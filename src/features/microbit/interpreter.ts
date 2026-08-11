/**
 * The micro:bit runtime — a stepped, interruptible interpreter for MbProgram.
 *
 * Two rules shape every decision in this file:
 *
 *  1. **It must never block the tab.** Every statement is a generator that
 *     yields back to a `setTimeout` scheduler, so a `forever` loop is just a
 *     coroutine the host keeps waking up. Stop is instant.
 *  2. **It must never throw at the class.** A Grade 6 program is full of
 *     honest mistakes — an unset variable, a light at x = 7, a divide by 0.
 *     Those come back as structured `MbIssue` values with plain-English
 *     messages, and the program keeps running with a sensible fallback.
 *
 * Pacing is deliberate: ~120ms per statement so a room can watch a script
 * execute block by block, with a "fast" gear for when the point is the result.
 */

import { clamp, mulberry32 } from "@/lib/utils";
import {
  DIGIT_BITMAPS,
  ICON_BITMAPS,
  blankLeds,
  initialDeviceState,
  type MbButton,
  type MbDeviceState,
  type MbEvent,
  type MbExpr,
  type MbProgram,
  type MbStatement,
} from "./program";

// ── Public types ────────────────────────────────────────────────────────────

export type MbSensorName = "temperature" | "humidity" | "light";

/** Execution gears. `pauseScale` shortens `pause` blocks in fast mode only. */
export const SPEED_PROFILE = {
  slow: { statementMs: 320, pauseScale: 1 },
  normal: { statementMs: 120, pauseScale: 1 },
  fast: { statementMs: 15, pauseScale: 0.25 },
} as const;

export type MbSpeed = keyof typeof SPEED_PROFILE;

export type MbSeverity = "warning" | "error";

/**
 * Everything that can go wrong, as data. `message` is written for a student,
 * not a developer — it says what happened and what the runtime did instead.
 */
export type MbIssue = {
  message: string;
  severity: MbSeverity;
  /** Statement the issue came from, for highlighting in the editor. */
  statementId?: string;
} & (
  | { kind: "unknown-variable"; name: string }
  | { kind: "divide-by-zero" }
  | { kind: "off-grid"; x: number; y: number }
  | { kind: "bad-number"; detail: string }
  | { kind: "too-many-steps"; limit: number }
  | { kind: "empty-program" }
  | { kind: "crashed"; detail: string }
);

export type MbIssueKind = MbIssue["kind"];

export type MbStopReason = "stopped" | "finished" | "step-limit" | "crashed";

export interface MbRuntimeStatus {
  device: MbDeviceState;
  /** True from `start()` until `stop()` — including while armed for buttons. */
  running: boolean;
  /** Running, but nothing to do until someone presses a button. */
  idle: boolean;
  /** Ids of the statements executing right now, one per live event. */
  activeIds: string[];
  /** Statements executed since `start()` — the runaway-loop budget. */
  steps: number;
  issues: MbIssue[];
  stopReason: MbStopReason | null;
}

export interface MbRuntimeOptions {
  speed?: MbSpeed | number;
  /** Runaway-loop budget for one run. Default 200,000 statements. */
  maxSteps?: number;
  /** Seed the `random` block so a demo replays identically. */
  seed?: number;
  sensors?: Partial<Record<MbSensorName, number>>;
  onIssue?: (issue: MbIssue) => void;
}

export interface MbRuntime {
  start(): void;
  stop(): void;
  /** Stop and wipe screen + variables. Sensor dials keep their positions. */
  reset(): void;
  pressButton(button: MbButton): void;
  setSensor(name: MbSensorName, value: number): void;
  setSpeed(speed: MbSpeed | number): void;
  /** Swap the script without losing the sensor dials. Stops the run first. */
  setProgram(program: MbProgram): void;
  /** Fires immediately with the current status, then on every change. */
  subscribe(callback: (status: MbRuntimeStatus) => void): () => void;
  /** Referentially stable between changes — safe for useSyncExternalStore. */
  getStatus(): MbRuntimeStatus;
  dispose(): void;
}

// ── Tuning ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_STEPS = 200_000;
/** Per-loop lap cap, so one runaway `while` cannot outlive the step budget. */
const MAX_LAPS = 200_000;
/**
 * How much work one wake-up may do before handing the thread back. Only bites
 * at `speed: 0` (the "run it instantly" gear used for checking an answer);
 * at any visible speed a task sleeps after a single statement anyway.
 */
const PASS_BUDGET = 512;
const PASS_MS = 8;
const MAX_TEXT = 120;
const MAX_ISSUES = 12;
const MAX_PAUSE_MS = 60_000;

const SENSOR_RANGE: Record<MbSensorName, [number, number]> = {
  temperature: [-40, 85],
  humidity: [0, 100],
  light: [0, 255],
};

// ── The 5×5 font ────────────────────────────────────────────────────────────

/**
 * Digits come straight from the contract (DIGIT_BITMAPS); letters and symbols
 * are the same 5×5 grid the real device scrolls, written as rows of 0/1 so a
 * teacher can read the shape in the source.
 */
const GLYPH_ROWS: Record<string, string> = {
  " ": "00000 00000 00000 00000 00000",
  A: "01110 10001 11111 10001 10001",
  B: "11110 10001 11110 10001 11110",
  C: "01111 10000 10000 10000 01111",
  D: "11110 10001 10001 10001 11110",
  E: "11111 10000 11110 10000 11111",
  F: "11111 10000 11110 10000 10000",
  G: "01111 10000 10011 10001 01111",
  H: "10001 10001 11111 10001 10001",
  I: "11111 00100 00100 00100 11111",
  J: "11111 00010 00010 10010 01100",
  K: "10001 10010 11100 10010 10001",
  L: "10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10001 10001",
  N: "10001 11001 10101 10011 10001",
  O: "01110 10001 10001 10001 01110",
  P: "11110 10001 11110 10000 10000",
  Q: "01110 10001 10101 10010 01101",
  R: "11110 10001 11110 10010 10001",
  S: "01111 10000 01110 00001 11110",
  T: "11111 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 01110",
  V: "10001 10001 10001 01010 00100",
  W: "10001 10001 10101 11011 10001",
  X: "10001 01010 00100 01010 10001",
  Y: "10001 01010 00100 00100 00100",
  Z: "11111 00010 00100 01000 11111",
  ".": "00000 00000 00000 00000 00100",
  ",": "00000 00000 00000 00100 01000",
  "!": "00100 00100 00100 00000 00100",
  "?": "11110 00001 00110 00000 00100",
  ":": "00000 00100 00000 00100 00000",
  "+": "00000 00100 01110 00100 00000",
  "=": "00000 01110 00000 01110 00000",
  "<": "00010 00100 01000 00100 00010",
  ">": "01000 00100 00010 00100 01000",
  "/": "00001 00010 00100 01000 10000",
  "*": "10101 01110 11111 01110 10101",
  "%": "10001 00010 00100 01000 10001",
  "'": "00100 00100 00000 00000 00000",
  "(": "00010 00100 00100 00100 00010",
  ")": "01000 00100 00100 00100 01000",
};

const rowsToBitmap = (spec: string): number[][] =>
  spec
    .trim()
    .split(/\s+/)
    .map((row) => row.split("").map((c) => (c === "1" ? 1 : 0)));

/** Every glyph the display can render: the book's digits plus A–Z. */
export const GLYPH_BITMAPS: Record<string, number[][]> = {
  ...Object.fromEntries(
    Object.entries(GLYPH_ROWS).map(([ch, spec]) => [ch, rowsToBitmap(spec)]),
  ),
  // The contract owns the digits — never shadow them.
  ...DIGIT_BITMAPS,
};

const glyphFor = (ch: string): number[][] =>
  GLYPH_BITMAPS[ch] ?? GLYPH_BITMAPS[ch.toUpperCase()] ?? GLYPH_BITMAPS["?"];

/** Flatten text into display columns, one blank column between characters. */
function textColumns(text: string): number[][] {
  const chars = [...text];
  const cols: number[][] = [];
  chars.forEach((ch, i) => {
    const glyph = glyphFor(ch);
    for (let x = 0; x < 5; x++) {
      cols.push([glyph[0][x], glyph[1][x], glyph[2][x], glyph[3][x], glyph[4][x]]);
    }
    if (i < chars.length - 1) cols.push([0, 0, 0, 0, 0]);
  });
  return cols;
}

// ── Interpreter internals ───────────────────────────────────────────────────

/** What a statement hands back to the scheduler: how long to wait, and where. */
interface MbTick {
  ms: number;
  id: string | null;
}

interface Settings {
  statementMs: number;
  pauseScale: number;
  maxSteps: number;
}

interface Ctx {
  device: MbDeviceState;
  settings: Settings;
  steps: number;
  random: () => number;
  report: (issue: MbIssue) => void;
}

/** Internal stop signal. Never escapes the scheduler, never reaches the UI. */
class MbHalt {
  constructor(
    readonly issue: MbIssue,
    readonly reason: MbStopReason,
  ) {}
}

const tick = (ctx: Ctx, id: string): MbTick => ({
  ms: ctx.settings.statementMs,
  id,
});

function charge(ctx: Ctx, id: string): void {
  ctx.steps += 1;
  if (ctx.steps > ctx.settings.maxSteps) {
    throw new MbHalt(
      {
        kind: "too-many-steps",
        limit: ctx.settings.maxSteps,
        severity: "error",
        statementId: id,
        message: `This program ran ${ctx.settings.maxSteps.toLocaleString(
          "en-US",
        )} blocks without finishing — that usually means a loop never ends. I stopped it so the page stays awake.`,
      },
      "step-limit",
    );
  }
}

const truthy = (n: number): boolean => n !== 0;

function formatDisplayNumber(n: number): string {
  if (!Number.isFinite(n)) return "?";
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

// ── Expressions ─────────────────────────────────────────────────────────────

function evalExpr(expr: MbExpr, ctx: Ctx, where: string): number {
  const value = evalRaw(expr, ctx, where);
  if (!Number.isFinite(value)) {
    ctx.report({
      kind: "bad-number",
      detail: describeExpr(expr),
      severity: "error",
      statementId: where,
      message: `“${describeExpr(expr)}” did not work out to a real number, so I used 0 instead.`,
    });
    return 0;
  }
  return value;
}

function evalRaw(expr: MbExpr, ctx: Ctx, where: string): number {
  switch (expr.kind) {
    case "num":
      return expr.value;

    case "var": {
      const value = ctx.device.variables[expr.name];
      if (value === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: expr.name,
          severity: "error",
          statementId: where,
          message: `I don't know a variable called “${expr.name}” yet. Set it (in “on start”, for example) before you use it. I used 0 this time.`,
        });
        return 0;
      }
      return value;
    }

    case "temperature":
      return ctx.device.temperature;
    case "humidity":
      return ctx.device.humidity;
    case "light":
      return ctx.device.light;

    case "random": {
      const a = Math.round(evalExpr(expr.min, ctx, where));
      const b = Math.round(evalExpr(expr.max, ctx, where));
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      // Inclusive at both ends, like MakeCode's "pick random" block.
      return lo + Math.floor(ctx.random() * (hi - lo + 1));
    }

    case "binop": {
      // `and`/`or` short-circuit so the unused side can't raise a false alarm.
      if (expr.op === "and") {
        return truthy(evalExpr(expr.left, ctx, where)) &&
          truthy(evalExpr(expr.right, ctx, where))
          ? 1
          : 0;
      }
      if (expr.op === "or") {
        return truthy(evalExpr(expr.left, ctx, where)) ||
          truthy(evalExpr(expr.right, ctx, where))
          ? 1
          : 0;
      }

      const l = evalExpr(expr.left, ctx, where);
      const r = evalExpr(expr.right, ctx, where);
      const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

      switch (expr.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          if (r === 0) {
            ctx.report({
              kind: "divide-by-zero",
              severity: "error",
              statementId: where,
              message:
                "You can't share something into 0 groups, so dividing by 0 has no answer. I used 0 instead.",
            });
            return 0;
          }
          return l / r;
        case "<":
          return l < r ? 1 : 0;
        case ">":
          return l > r ? 1 : 0;
        case "=":
          return near(l, r) ? 1 : 0;
        case "!=":
          return near(l, r) ? 0 : 1;
        case "<=":
          return l <= r || near(l, r) ? 1 : 0;
        case ">=":
          return l >= r || near(l, r) ? 1 : 0;
      }
    }
  }
}

// ── Display helpers ─────────────────────────────────────────────────────────

function drawBitmap(ctx: Ctx, bitmap: number[][]): void {
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      ctx.device.leds[y][x] = bitmap[y]?.[x] ? 255 : 0;
    }
  }
}

/**
 * Text on a 5-pixel-wide screen. One character is shown centred and held —
 * that is exactly what a real micro:bit does with `show number 7`. Anything
 * longer scrolls in from the right, one column per frame, and off the left.
 */
function* showText(
  text: string,
  ctx: Ctx,
  id: string,
): Generator<MbTick, void, void> {
  const chars = [...text];
  ctx.device.display = text;

  if (chars.length <= 1) {
    drawBitmap(ctx, glyphFor(chars[0] ?? " "));
    yield { ms: clamp(ctx.settings.statementMs * 5, 150, 1400), id };
    ctx.device.display = null;
    return;
  }

  const frameMs = clamp(ctx.settings.statementMs, 30, 260);
  const cols = textColumns(text);
  const LEAD = 5; // scroll in from the right edge…
  const TRAIL = 5; // …and all the way off the left
  const total = LEAD + cols.length + TRAIL;

  for (let offset = 0; offset <= total - 5; offset++) {
    for (let x = 0; x < 5; x++) {
      const index = offset + x - LEAD;
      const col = index >= 0 && index < cols.length ? cols[index] : null;
      for (let y = 0; y < 5; y++) {
        ctx.device.leds[y][x] = col && col[y] ? 255 : 0;
      }
    }
    yield { ms: frameMs, id };
  }

  ctx.device.display = null;
}

// ── Statements ──────────────────────────────────────────────────────────────

function* execBlock(
  body: MbStatement[],
  ctx: Ctx,
): Generator<MbTick, void, void> {
  for (const statement of body) {
    yield* execStatement(statement, ctx);
  }
}

function* execStatement(
  st: MbStatement,
  ctx: Ctx,
): Generator<MbTick, void, void> {
  charge(ctx, st.id);

  switch (st.kind) {
    case "show-number":
      yield* showText(formatDisplayNumber(evalExpr(st.value, ctx, st.id)), ctx, st.id);
      return;

    case "show-string":
      yield* showText(st.value.slice(0, MAX_TEXT), ctx, st.id);
      return;

    case "show-icon":
      drawBitmap(ctx, ICON_BITMAPS[st.icon]);
      ctx.device.display = null;
      yield tick(ctx, st.id);
      return;

    case "clear-screen":
      ctx.device.leds = blankLeds();
      ctx.device.display = null;
      yield tick(ctx, st.id);
      return;

    case "plot":
    case "unplot": {
      const point = resolvePoint(st.x, st.y, ctx, st.id);
      ctx.device.leds[point.y][point.x] = st.kind === "plot" ? 255 : 0;
      yield tick(ctx, st.id);
      return;
    }

    case "play-tone":
      ctx.device.tone = st.note;
      yield { ms: clamp(st.ms, 0, MAX_PAUSE_MS) * ctx.settings.pauseScale, id: st.id };
      ctx.device.tone = null;
      return;

    case "set-zip":
      ctx.device.zip = st.colour;
      yield tick(ctx, st.id);
      return;

    case "pause":
      yield {
        ms: clamp(st.ms, 0, MAX_PAUSE_MS) * ctx.settings.pauseScale,
        id: st.id,
      };
      return;

    case "set-var":
      ctx.device.variables[st.name] = evalExpr(st.value, ctx, st.id);
      yield tick(ctx, st.id);
      return;

    case "change-var": {
      const current = ctx.device.variables[st.name];
      if (current === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: st.name,
          severity: "error",
          statementId: st.id,
          message: `“${st.name}” has never been set, so there is nothing to change yet. I started it at 0 — try setting it in “on start”.`,
        });
      }
      ctx.device.variables[st.name] =
        (current ?? 0) + evalExpr(st.by, ctx, st.id);
      yield tick(ctx, st.id);
      return;
    }

    case "repeat": {
      const times = Math.round(evalExpr(st.times, ctx, st.id));
      const laps = clamp(Number.isFinite(times) ? times : 0, 0, MAX_LAPS);
      for (let i = 0; i < laps; i++) {
        charge(ctx, st.id);
        yield tick(ctx, st.id);
        yield* execBlock(st.body, ctx);
      }
      return;
    }

    case "for": {
      // MakeCode's loop counter is an ordinary variable: it shows up in the
      // variables list and keeps its final value after the loop ends.
      const from = Math.round(evalExpr(st.from, ctx, st.id));
      const to = Math.round(evalExpr(st.to, ctx, st.id));
      let laps = 0;
      for (let i = from; i <= to; i++) {
        charge(ctx, st.id);
        ctx.device.variables[st.name] = i;
        yield tick(ctx, st.id);
        yield* execBlock(st.body, ctx);
        if (++laps >= MAX_LAPS) break;
      }
      return;
    }

    case "while": {
      let laps = 0;
      while (truthy(evalExpr(st.cond, ctx, st.id))) {
        charge(ctx, st.id);
        yield tick(ctx, st.id);
        yield* execBlock(st.body, ctx);
        if (++laps >= MAX_LAPS) {
          throw new MbHalt(
            {
              kind: "too-many-steps",
              limit: MAX_LAPS,
              severity: "error",
              statementId: st.id,
              message:
                "This “while” loop kept going and going — its test never became false. I stopped it. Check that something inside the loop changes the answer.",
            },
            "step-limit",
          );
        }
      }
      return;
    }

    case "if": {
      const taken = truthy(evalExpr(st.cond, ctx, st.id));
      yield tick(ctx, st.id);
      if (taken) yield* execBlock(st.then, ctx);
      else if (st.otherwise) yield* execBlock(st.otherwise, ctx);
      return;
    }
  }
}

/** Clamp a plotted point onto the grid and say so — coordinates are the lesson. */
function resolvePoint(
  xe: MbExpr,
  ye: MbExpr,
  ctx: Ctx,
  id: string,
): { x: number; y: number } {
  const rawX = Math.round(evalExpr(xe, ctx, id));
  const rawY = Math.round(evalExpr(ye, ctx, id));
  const x = clamp(rawX, 0, 4);
  const y = clamp(rawY, 0, 4);
  if (x !== rawX || y !== rawY) {
    ctx.report({
      kind: "off-grid",
      x: rawX,
      y: rawY,
      severity: "warning",
      statementId: id,
      message: `The screen only counts 0, 1, 2, 3, 4 across and down. (x ${rawX}, y ${rawY}) is off the grid, so I used the closest light — (x ${x}, y ${y}).`,
    });
  }
  return { x, y };
}

// ── The scheduler ───────────────────────────────────────────────────────────

interface Task {
  eventId: string;
  kind: MbEvent["kind"];
  gen: Generator<MbTick, void, void>;
  /** Rebuilt each lap for `forever`; undefined for one-shot events. */
  respawn?: () => Generator<MbTick, void, void>;
  wakeAt: number;
  currentId: string | null;
  done: boolean;
}

const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

function resolveSpeed(speed: MbSpeed | number | undefined): {
  statementMs: number;
  pauseScale: number;
} {
  if (typeof speed === "number") {
    return { statementMs: clamp(speed, 0, 5000), pauseScale: 1 };
  }
  return SPEED_PROFILE[speed ?? "normal"];
}

/**
 * Build a runtime for one program. Nothing runs until `start()`.
 * The handle is deliberately imperative — a React host subscribes once and
 * lets the scheduler drive, instead of re-rendering a loop into existence.
 */
export function createRuntime(
  program: MbProgram,
  opts: MbRuntimeOptions = {},
): MbRuntime {
  let script = program;

  const speed = resolveSpeed(opts.speed);
  const settings: Settings = {
    statementMs: speed.statementMs,
    pauseScale: speed.pauseScale,
    maxSteps: Math.max(1, opts.maxSteps ?? DEFAULT_MAX_STEPS),
  };

  const base = initialDeviceState();
  // Mutated in place all run long; `ctx` and every snapshot read through it.
  const device: MbDeviceState = {
    ...base,
    temperature: clampSensor("temperature", opts.sensors?.temperature ?? base.temperature),
    humidity: clampSensor("humidity", opts.sensors?.humidity ?? base.humidity),
    light: clampSensor("light", opts.sensors?.light ?? base.light),
  };

  let tasks: Task[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopReason: MbStopReason | null = null;
  let issues: MbIssue[] = [];
  let cached: MbRuntimeStatus | null = null;
  const seenIssues = new Set<string>();
  const subscribers = new Set<(status: MbRuntimeStatus) => void>();

  const random = mulberry32(opts.seed ?? ((Date.now() ^ 0x5f3759df) >>> 0));

  const ctx: Ctx = {
    device,
    settings,
    steps: 0,
    random,
    report: (issue) => pushIssue(issue),
  };

  function clampSensor(name: MbSensorName, value: number): number {
    const [lo, hi] = SENSOR_RANGE[name];
    return clamp(Number.isFinite(value) ? value : 0, lo, hi);
  }

  function pushIssue(issue: MbIssue): void {
    // One report per distinct mistake — a forever loop would otherwise
    // print the same warning 500 times and bury the useful one.
    const key = JSON.stringify([issue.kind, issue.statementId, issue.message]);
    if (seenIssues.has(key)) return;
    seenIssues.add(key);
    if (issues.length < MAX_ISSUES) issues = [...issues, issue];
    opts.onIssue?.(issue);
    cached = null;
  }

  const hasButtonEvents = () =>
    script.events.some((event) => event.kind === "on-button");

  function makeTask(event: MbEvent, at: number): Task {
    const spawn = () => execBlock(event.body, ctx);
    return {
      eventId: event.id,
      kind: event.kind,
      gen: spawn(),
      respawn: event.kind === "forever" ? spawn : undefined,
      wakeAt: at,
      currentId: null,
      done: false,
    };
  }

  function snapshot(): MbRuntimeStatus {
    if (cached) return cached;
    cached = {
      device: {
        ...device,
        leds: device.leds.map((row) => [...row]),
        variables: { ...device.variables },
      },
      running,
      idle: running && tasks.length === 0,
      activeIds: tasks
        .map((task) => task.currentId)
        .filter((id): id is string => id !== null),
      steps: ctx.steps,
      issues,
      stopReason,
    };
    return cached;
  }

  function notify(): void {
    cached = null;
    const status = snapshot();
    for (const subscriber of subscribers) subscriber(status);
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function schedule(): void {
    clearTimer();
    if (!running || tasks.length === 0) return;
    const next = tasks.reduce(
      (min, task) => Math.min(min, task.wakeAt),
      Number.POSITIVE_INFINITY,
    );
    timer = setTimeout(loop, Math.max(0, next - nowMs()));
  }

  function finish(reason: MbStopReason): void {
    clearTimer();
    tasks = [];
    running = false;
    stopReason = reason;
    device.running = false;
    device.tone = null;
    device.display = null;
    cached = null;
  }

  function advance(task: Task, at: number): void {
    try {
      const step = task.gen.next();
      if (step.done) {
        if (task.respawn) {
          // `forever` restarts with a breath, exactly like the real block.
          task.gen = task.respawn();
          task.currentId = null;
          task.wakeAt = at + Math.max(1, settings.statementMs);
        } else {
          task.done = true;
          task.currentId = null;
        }
        return;
      }
      task.currentId = step.value.id;
      task.wakeAt = at + Math.max(0, step.value.ms);
    } catch (error) {
      if (error instanceof MbHalt) {
        pushIssue(error.issue);
        finish(error.reason);
        return;
      }
      // Defensive: nothing above should throw, but a crash must not reach
      // the UI as a red overlay in the middle of a lesson.
      task.done = true;
      task.currentId = null;
      pushIssue({
        kind: "crashed",
        detail: error instanceof Error ? error.message : String(error),
        severity: "error",
        message:
          "Something unexpected went wrong while running this script. Press Reset and try again.",
      });
    }
  }

  function loop(): void {
    timer = null;
    if (!running) return;

    const startedAt = nowMs();
    let budget = PASS_BUDGET;
    let advanced = true;

    // Keep serving tasks that are already due, but never hold the thread for
    // more than a frame — that is what makes a `forever` loop interruptible.
    while (running && advanced && budget > 0 && nowMs() - startedAt < PASS_MS) {
      advanced = false;
      const at = nowMs();
      for (const task of [...tasks]) {
        if (task.done || task.wakeAt > at) continue;
        advance(task, at);
        advanced = true;
        budget -= 1;
        if (!running) break; // a halt cleared every task
      }
      if (running) tasks = tasks.filter((task) => !task.done);
    }

    if (running && tasks.length === 0 && !hasButtonEvents()) finish("finished");

    notify();
    schedule();
  }

  function wipe(): void {
    device.leds = blankLeds();
    device.variables = {};
    device.display = null;
    device.tone = null;
    device.zip = "off";
    ctx.steps = 0;
    issues = [];
    seenIssues.clear();
    stopReason = null;
    cached = null;
  }

  return {
    start() {
      if (running) return;
      clearTimer();
      wipe();

      const startable = script.events.filter(
        (event) => event.kind === "on-start" || event.kind === "forever",
      );
      if (startable.length === 0 && !hasButtonEvents()) {
        pushIssue({
          kind: "empty-program",
          severity: "warning",
          message:
            "There is nothing to run yet. Add an “on start”, a “forever” or a button block, then press Run.",
        });
        stopReason = "finished";
        notify();
        return;
      }

      const at = nowMs();
      tasks = startable.map((event) => makeTask(event, at));
      running = true;
      device.running = true;
      notify();
      schedule();
    },

    stop() {
      if (!running) return;
      finish("stopped");
      notify();
    },

    reset() {
      clearTimer();
      running = false;
      tasks = [];
      device.running = false;
      wipe();
      notify();
    },

    pressButton(button) {
      if (!running) return;
      const handlers = script.events.filter(
        (event) => event.kind === "on-button" && event.button === button,
      );
      const at = nowMs();
      let spawned = false;
      for (const handler of handlers) {
        // A handler still busy from the last press ignores this one, rather
        // than stacking up copies of itself.
        if (tasks.some((task) => task.eventId === handler.id)) continue;
        tasks.push(makeTask(handler, at));
        spawned = true;
      }
      if (spawned) {
        notify();
        schedule();
      }
    },

    setSensor(name, value) {
      device[name] = clampSensor(name, value);
      notify();
    },

    setSpeed(next) {
      const resolved = resolveSpeed(next);
      settings.statementMs = resolved.statementMs;
      settings.pauseScale = resolved.pauseScale;
      notify();
    },

    setProgram(next) {
      finish("stopped");
      script = next;
      wipe();
      notify();
    },

    subscribe(callback) {
      subscribers.add(callback);
      callback(snapshot());
      return () => {
        subscribers.delete(callback);
      };
    },

    getStatus: snapshot,

    dispose() {
      clearTimer();
      running = false;
      tasks = [];
      subscribers.clear();
    },
  };
}

// ── Pseudocode, for Teach Mode ──────────────────────────────────────────────

export interface MbPseudoLine {
  /** Statement or event id — highlight the matching block while reading. */
  id: string;
  depth: number;
  text: string;
}

const ICON_WORDS: Record<string, string> = {
  "arrow-up": "up arrow",
  "arrow-down": "down arrow",
  "small-square": "small square",
};

function describeMs(ms: number): string {
  if (ms >= 1000 && ms % 1000 === 0) {
    const seconds = ms / 1000;
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  return `${ms} ms`;
}

const OP_WORDS: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "<": "is less than",
  ">": "is more than",
  "=": "is equal to",
  "!=": "is not equal to",
  "<=": "is at most",
  ">=": "is at least",
  and: "and",
  or: "or",
};

/** One expression, in words a Grade 6 reader can say out loud. */
export function describeExpr(expr: MbExpr): string {
  switch (expr.kind) {
    case "num":
      return formatDisplayNumber(expr.value);
    case "var":
      return expr.name;
    case "temperature":
      return "the temperature";
    case "humidity":
      return "the humidity";
    case "light":
      return "the light level";
    case "random":
      return `a random number from ${describeExpr(expr.min)} to ${describeExpr(expr.max)}`;
    case "binop": {
      const wrap = (side: MbExpr) =>
        side.kind === "binop" ? `(${describeExpr(side)})` : describeExpr(side);
      return `${wrap(expr.left)} ${OP_WORDS[expr.op]} ${wrap(expr.right)}`;
    }
  }
}

function describeStatement(st: MbStatement): string {
  switch (st.kind) {
    case "show-number":
      return `show the number ${describeExpr(st.value)}`;
    case "show-string":
      return `show the words “${st.value}”`;
    case "show-icon":
      return `show the ${ICON_WORDS[st.icon] ?? st.icon} picture`;
    case "clear-screen":
      return "clear the screen";
    case "plot":
      return `light up the LED at x = ${describeExpr(st.x)}, y = ${describeExpr(st.y)}`;
    case "unplot":
      return `turn off the LED at x = ${describeExpr(st.x)}, y = ${describeExpr(st.y)}`;
    case "play-tone":
      return `play the note ${st.note} for ${describeMs(st.ms)}`;
    case "set-zip":
      return st.colour === "off"
        ? "turn the ZIP LEDs off"
        : `turn the ZIP LEDs ${st.colour}`;
    case "pause":
      return `wait for ${describeMs(st.ms)}`;
    case "set-var":
      return `set ${st.name} to ${describeExpr(st.value)}`;
    case "change-var":
      return `change ${st.name} by ${describeExpr(st.by)}`;
    case "repeat":
      return `repeat ${describeExpr(st.times)} times:`;
    case "for":
      return `count ${st.name} from ${describeExpr(st.from)} up to ${describeExpr(st.to)}, and each time:`;
    case "while":
      return `while ${describeExpr(st.cond)}, keep doing:`;
    case "if":
      return `if ${describeExpr(st.cond)} then:`;
  }
}

function describeEvent(event: MbEvent): string {
  switch (event.kind) {
    case "on-start":
      return "When the micro:bit starts:";
    case "forever":
      return "Forever, over and over:";
    case "on-button":
      return event.button === "A+B"
        ? "When buttons A and B are pressed together:"
        : `When button ${event.button} is pressed:`;
  }
}

function pushStatements(
  body: MbStatement[],
  depth: number,
  out: MbPseudoLine[],
): void {
  for (const st of body) {
    out.push({ id: st.id, depth, text: describeStatement(st) });
    switch (st.kind) {
      case "repeat":
      case "for":
      case "while":
        pushStatements(st.body, depth + 1, out);
        break;
      case "if":
        pushStatements(st.then, depth + 1, out);
        if (st.otherwise && st.otherwise.length > 0) {
          out.push({ id: `${st.id}:else`, depth, text: "otherwise:" });
          pushStatements(st.otherwise, depth + 1, out);
        }
        break;
      default:
        break;
    }
  }
}

/** Pseudocode with ids and depth — for a Teach Mode that highlights as it reads. */
export function describeProgramLines(program: MbProgram): MbPseudoLine[] {
  const out: MbPseudoLine[] = [];
  for (const event of program.events) {
    out.push({ id: event.id, depth: 0, text: describeEvent(event) });
    pushStatements(event.body, 1, out);
  }
  return out;
}

/**
 * The program as readable pseudocode, one line per block, indented by nesting.
 * Teach Mode walks these lines to talk a class through a script.
 */
export function describeProgram(program: MbProgram): string[] {
  const lines = describeProgramLines(program);
  if (lines.length === 0) return ["This script is empty — there are no blocks yet."];
  return lines.map((line) => "  ".repeat(line.depth) + line.text);
}
