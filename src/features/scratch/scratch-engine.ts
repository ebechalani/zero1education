/**
 * The Scratch runtime — a stepped, interruptible interpreter for a ScProject.
 *
 * Three rules shape every decision in this file:
 *
 *  1. **Scratch's own clock.** Every lap of a `forever` or `repeat` costs one
 *     frame (1/30 s) and nothing else costs time, exactly as Scratch schedules
 *     scripts. That is why `move 5 steps` inside a forever loop crosses the
 *     stage at the speed a student remembers from the real editor.
 *  2. **It must never block the tab.** Statements are generators that yield back
 *     to a scheduler, so a `forever` loop is a coroutine the host wakes up.
 *     Stop is instant.
 *  3. **It must never throw at the class.** A Grade 6 project is full of honest
 *     mistakes — a backdrop that was renamed, a variable used before it is set.
 *     Those come back as `ScIssue` values written for a student, and the project
 *     keeps running with a sensible fallback.
 *
 * Two drivers share one interpreter:
 *  · `createScratchRuntime` runs on real timers, for the stage on screen.
 *  · `simulateTrial` runs on a virtual clock with no timers at all, so checking
 *    an answer replays four minutes of a game in a few milliseconds and gives
 *    exactly the same answer every time.
 */

import { clamp, mulberry32 } from "@/lib/utils";
import {
  boxesOverlap,
  coloursUnder,
  directionVector,
  initialStageState,
  penColourCss,
  spriteBox,
  STAGE_X,
  STAGE_Y,
  wrapDirection,
  type ScColourName,
  type ScCond,
  type ScExpr,
  type ScHat,
  type ScKey,
  type ScPenLine,
  type ScProject,
  type ScSpriteState,
  type ScStageState,
  type ScStatement,
} from "./scratch-model";

// ── Public types ────────────────────────────────────────────────────────────

export type ScSeverity = "warning" | "error";

/**
 * Everything that can go wrong, as data. `message` is written for a student,
 * not a developer — it says what happened and what the runtime did instead.
 */
export type ScIssue = {
  message: string;
  severity: ScSeverity;
  /** Block the issue came from, for highlighting in the editor. */
  blockId?: string;
} & (
  | { kind: "unknown-variable"; name: string }
  | { kind: "unknown-backdrop"; name: string }
  | { kind: "unknown-costume"; name: string }
  | { kind: "unknown-sprite"; name: string }
  | { kind: "unknown-sound"; name: string }
  | { kind: "sprite-only" }
  | { kind: "divide-by-zero" }
  | { kind: "empty-project" }
  | { kind: "too-many-steps"; limit: number }
  | { kind: "crashed"; detail: string }
);

/** Execution gears. Only the on-screen runtime uses anything but `normal`. */
export const SC_SPEED_PROFILE = {
  slow: { traceMs: 260, frameMs: 110, waitScale: 1 },
  normal: { traceMs: 0, frameMs: 1000 / 30, waitScale: 1 },
  fast: { traceMs: 0, frameMs: 1000 / 60, waitScale: 0.25 },
} as const;

export type ScSpeed = keyof typeof SC_SPEED_PROFILE;

export type ScStopReason = "stopped" | "finished" | "stop-all" | "step-limit";

export interface ScRuntimeStatus {
  state: ScStageState;
  running: boolean;
  /** Running, but nothing to do until a key or a click arrives. */
  idle: boolean;
  /** Blocks executing right now, one per live script. */
  activeIds: string[];
  steps: number;
  issues: ScIssue[];
  stopReason: ScStopReason | null;
}

export interface ScRuntime {
  greenFlag(): void;
  stopAll(): void;
  /** Stop and put every sprite back where the project starts. */
  reset(): void;
  keyDown(key: ScKey): void;
  keyUp(key: ScKey): void;
  clickSprite(spriteId: string): void;
  setMouse(x: number, y: number): void;
  setMouseDown(down: boolean): void;
  setSpeed(speed: ScSpeed): void;
  setProject(project: ScProject): void;
  subscribe(callback: (status: ScRuntimeStatus) => void): () => void;
  getStatus(): ScRuntimeStatus;
  dispose(): void;
}

// ── Tuning ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_STEPS = 400_000;
const MAX_LAPS = 200_000;
const MAX_PEN_LINES = 6_000;
const MAX_ISSUES = 10;
const MAX_TEXT = 140;
/** How much work one wake-up may do before handing the thread back. */
const PASS_BUDGET = 4_000;
const PASS_MS = 8;
/** Sprites keep at least this much of themselves on the stage, as in Scratch. */
const FENCE = 15;
/** A glide is walked in this many little hops, so the pen draws a smooth line. */
const GLIDE_STEPS = 12;

// ── Interpreter internals ───────────────────────────────────────────────────

/** What a statement hands back to the scheduler: how long to wait, and where. */
interface ScTick {
  ms: number;
  id: string | null;
}

interface ScSettings {
  traceMs: number;
  frameMs: number;
  waitScale: number;
  maxSteps: number;
}

/** Written to while a trial runs; null when nobody is recording. */
interface ScRecorder {
  backdrop(name: string): void;
  say(sprite: string, text: string, kind: "say" | "think", secs?: number): void;
  visible(sprite: string, visible: boolean): void;
  costume(sprite: string, costume: string): void;
  sound(sprite: string, sound: string, seconds: number): void;
  variable(name: string, value: number): void;
  stopped(): void;
}

interface ScCtx {
  project: ScProject;
  state: ScStageState;
  settings: ScSettings;
  clock: { now: number };
  steps: number;
  keys: Set<string>;
  random: () => number;
  report: (issue: ScIssue) => void;
  rec: ScRecorder | null;
}

/** Internal stop signal. Never escapes the scheduler, never reaches the UI. */
class ScHalt {
  constructor(
    readonly reason: ScStopReason,
    readonly issue?: ScIssue,
  ) {}
}

function charge(ctx: ScCtx, id: string): void {
  ctx.steps += 1;
  if (ctx.steps > ctx.settings.maxSteps) {
    throw new ScHalt("step-limit", {
      kind: "too-many-steps",
      limit: ctx.settings.maxSteps,
      severity: "error",
      blockId: id,
      message:
        "This project ran an enormous number of blocks without finishing — that usually means a loop never ends. I stopped it so the page stays awake.",
    });
  }
}

const findSprite = (ctx: ScCtx, id: string): ScSpriteState | undefined =>
  ctx.state.sprites.find((s) => s.id === id);

// ── Expressions ─────────────────────────────────────────────────────────────

function evalExpr(
  expr: ScExpr,
  ctx: ScCtx,
  self: ScSpriteState | null,
  where: string,
): number {
  const value = evalRaw(expr, ctx, self, where);
  return Number.isFinite(value) ? value : 0;
}

function evalRaw(
  expr: ScExpr,
  ctx: ScCtx,
  self: ScSpriteState | null,
  where: string,
): number {
  switch (expr.kind) {
    case "num":
      return expr.value;
    case "var": {
      const value = ctx.state.variables[expr.name];
      if (value === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: expr.name,
          severity: "error",
          blockId: where,
          message: `I don't know a variable called “${expr.name}” yet. Set it before you use it — “set ${expr.name} to 0” under the green flag, for example. I used 0 this time.`,
        });
        return 0;
      }
      return value;
    }
    case "mouse-x":
      return ctx.state.mouse.x;
    case "mouse-y":
      return ctx.state.mouse.y;
    case "x-position":
      return self ? self.x : 0;
    case "y-position":
      return self ? self.y : 0;
    case "random": {
      const a = Math.round(evalExpr(expr.min, ctx, self, where));
      const b = Math.round(evalExpr(expr.max, ctx, self, where));
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return lo + Math.floor(ctx.random() * (hi - lo + 1));
    }
    case "binop": {
      const l = evalExpr(expr.left, ctx, self, where);
      const r = evalExpr(expr.right, ctx, self, where);
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
              blockId: where,
              message:
                "You can't share something into 0 groups, so dividing by 0 has no answer. I used 0 instead.",
            });
            return 0;
          }
          return l / r;
      }
    }
  }
}

function evalCond(
  cond: ScCond,
  ctx: ScCtx,
  self: ScSpriteState | null,
  where: string,
): boolean {
  switch (cond.kind) {
    case "touching-sprite": {
      if (!self) return false;
      const other = findSprite(ctx, cond.sprite);
      if (!other) {
        ctx.report({
          kind: "unknown-sprite",
          name: cond.sprite,
          severity: "warning",
          blockId: where,
          message:
            "This block is looking for a sprite that is not in the project any more. Pick another one from the drop-down.",
        });
        return false;
      }
      if (!self.visible || !other.visible) return false;
      return boxesOverlap(spriteBox(self), spriteBox(other));
    }
    case "touching-colour": {
      if (!self || !self.visible) return false;
      const backdrop = ctx.project.backdrops[ctx.state.backdrop];
      return coloursUnder(backdrop, spriteBox(self)).includes(cond.colour);
    }
    case "touching-edge": {
      if (!self) return false;
      const box = spriteBox(self);
      return (
        box.left <= -STAGE_X ||
        box.right >= STAGE_X ||
        box.top >= STAGE_Y ||
        box.bottom <= -STAGE_Y
      );
    }
    case "key-pressed":
      return ctx.keys.has(cond.key);
    case "mouse-down":
      return ctx.state.mouse.down;
    case "compare": {
      const l = evalExpr(cond.left, ctx, self, where);
      const r = evalExpr(cond.right, ctx, self, where);
      if (cond.op === "<") return l < r;
      if (cond.op === ">") return l > r;
      return Math.abs(l - r) < 1e-9;
    }
  }
}

// ── Motion helpers ──────────────────────────────────────────────────────────

/** Scratch keeps a sliver of every sprite on the stage — this is that rule. */
function fence(sprite: ScSpriteState, x: number, y: number): { x: number; y: number } {
  const scale = sprite.size / 100;
  const halfW = (sprite.width * scale) / 2;
  const halfH = (sprite.height * scale) / 2;
  const roomX = STAGE_X + halfW - Math.min(FENCE, halfW * 2);
  const roomY = STAGE_Y + halfH - Math.min(FENCE, halfH * 2);
  return { x: clamp(x, -roomX, roomX), y: clamp(y, -roomY, roomY) };
}

/** Move the sprite, drawing a pen line behind it when the pen is down. */
function moveTo(ctx: ScCtx, self: ScSpriteState, x: number, y: number): void {
  const to = fence(self, x, y);
  if (
    self.penDown &&
    (Math.abs(to.x - self.x) > 1e-6 || Math.abs(to.y - self.y) > 1e-6) &&
    ctx.state.pen.length < MAX_PEN_LINES
  ) {
    ctx.state.pen.push({
      x1: self.x,
      y1: self.y,
      x2: to.x,
      y2: to.y,
      colour: self.penColour,
      width: self.penSize,
    });
  }
  self.x = to.x;
  self.y = to.y;
}

function bounceOffEdge(self: ScSpriteState): void {
  const box = spriteBox(self);
  const distLeft = box.left + STAGE_X;
  const distRight = STAGE_X - box.right;
  const distTop = STAGE_Y - box.top;
  const distBottom = box.bottom + STAGE_Y;
  const nearest = Math.min(distLeft, distRight, distTop, distBottom);
  if (nearest > 0) return;

  const { dx, dy } = directionVector(self.direction);
  const horizontal = nearest === distLeft || nearest === distRight;
  const ndx = horizontal ? -dx : dx;
  const ndy = horizontal ? dy : -dy;
  self.direction = wrapDirection((Math.atan2(ndx, ndy) * 180) / Math.PI);

  // Step back onto the stage so the next lap does not bounce again.
  const after = spriteBox(self);
  if (after.left < -STAGE_X) self.x += -STAGE_X - after.left;
  if (after.right > STAGE_X) self.x -= after.right - STAGE_X;
  if (after.bottom < -STAGE_Y) self.y += -STAGE_Y - after.bottom;
  if (after.top > STAGE_Y) self.y -= after.top - STAGE_Y;
}

// ── Statements ──────────────────────────────────────────────────────────────

function* execBody(
  body: ScStatement[],
  ctx: ScCtx,
  self: ScSpriteState | null,
): Generator<ScTick, void, void> {
  for (const stmt of body) {
    yield* execStatement(stmt, ctx, self);
  }
}

/** Sprite blocks dropped on the Stage: say so once, then carry on. */
function needSprite(
  ctx: ScCtx,
  self: ScSpriteState | null,
  id: string,
): self is ScSpriteState {
  if (self) return true;
  ctx.report({
    kind: "sprite-only",
    severity: "warning",
    blockId: id,
    message:
      "This block moves or changes a sprite, so it cannot run on the Stage. Select a sprite first, then build the script there.",
  });
  return false;
}

function* execStatement(
  st: ScStatement,
  ctx: ScCtx,
  self: ScSpriteState | null,
): Generator<ScTick, void, void> {
  charge(ctx, st.id);
  const wait = (seconds: number): ScTick => ({
    ms: clamp(seconds, 0, 600) * 1000 * ctx.settings.waitScale,
    id: st.id,
  });
  if (ctx.settings.traceMs > 0) yield { ms: ctx.settings.traceMs, id: st.id };

  switch (st.kind) {
    // ── Motion ──
    case "move": {
      if (!needSprite(ctx, self, st.id)) return;
      const steps = evalExpr(st.steps, ctx, self, st.id);
      const { dx, dy } = directionVector(self.direction);
      moveTo(ctx, self, self.x + steps * dx, self.y + steps * dy);
      return;
    }
    case "turn": {
      if (!needSprite(ctx, self, st.id)) return;
      const degrees = evalExpr(st.degrees, ctx, self, st.id);
      self.direction = wrapDirection(
        self.direction + (st.way === "cw" ? degrees : -degrees),
      );
      return;
    }
    case "goto-xy": {
      if (!needSprite(ctx, self, st.id)) return;
      moveTo(
        ctx,
        self,
        evalExpr(st.x, ctx, self, st.id),
        evalExpr(st.y, ctx, self, st.id),
      );
      return;
    }
    case "glide-xy": {
      if (!needSprite(ctx, self, st.id)) return;
      const fromX = self.x;
      const fromY = self.y;
      const toX = evalExpr(st.x, ctx, self, st.id);
      const toY = evalExpr(st.y, ctx, self, st.id);
      const secs = clamp(st.secs, 0, 60);
      for (let i = 1; i <= GLIDE_STEPS; i += 1) {
        moveTo(
          ctx,
          self,
          fromX + ((toX - fromX) * i) / GLIDE_STEPS,
          fromY + ((toY - fromY) * i) / GLIDE_STEPS,
        );
        yield wait(secs / GLIDE_STEPS);
      }
      return;
    }
    case "point-in-direction": {
      if (!needSprite(ctx, self, st.id)) return;
      self.direction = wrapDirection(evalExpr(st.degrees, ctx, self, st.id));
      return;
    }
    case "if-on-edge-bounce": {
      if (!needSprite(ctx, self, st.id)) return;
      bounceOffEdge(self);
      return;
    }

    // ── Looks ──
    case "say":
    case "think": {
      if (!needSprite(ctx, self, st.id)) return;
      const text = st.text.slice(0, MAX_TEXT);
      const kind = st.kind === "say" ? "say" : "think";
      self.bubble = text.trim() ? { text, kind } : null;
      if (text.trim()) ctx.rec?.say(self.id, text, kind, st.secs);
      if (st.secs === undefined) return;
      yield wait(st.secs);
      if (self.bubble && self.bubble.text === text) self.bubble = null;
      return;
    }
    case "switch-backdrop": {
      const index = ctx.project.backdrops.findIndex((b) => b.name === st.backdrop);
      if (index < 0) {
        ctx.report({
          kind: "unknown-backdrop",
          name: st.backdrop,
          severity: "warning",
          blockId: st.id,
          message: `There is no backdrop called “${st.backdrop}” in this project any more. Add it back to the Stage, or choose another one in the block.`,
        });
        return;
      }
      ctx.state.backdrop = index;
      ctx.rec?.backdrop(st.backdrop);
      return;
    }
    case "next-backdrop": {
      const count = ctx.project.backdrops.length;
      if (count === 0) return;
      ctx.state.backdrop = (ctx.state.backdrop + 1) % count;
      ctx.rec?.backdrop(ctx.project.backdrops[ctx.state.backdrop].name);
      return;
    }
    case "switch-costume": {
      if (!needSprite(ctx, self, st.id)) return;
      const def = ctx.project.sprites.find((s) => s.id === self.id);
      const index = def?.costumes.findIndex((c) => c.name === st.costume) ?? -1;
      if (index < 0) {
        ctx.report({
          kind: "unknown-costume",
          name: st.costume,
          severity: "warning",
          blockId: st.id,
          message: `“${self.name}” has no costume called “${st.costume}”. Open the drop-down and pick one of its own costumes.`,
        });
        return;
      }
      self.costume = index;
      ctx.rec?.costume(self.id, st.costume);
      return;
    }
    case "next-costume": {
      if (!needSprite(ctx, self, st.id)) return;
      const def = ctx.project.sprites.find((s) => s.id === self.id);
      const count = def?.costumes.length ?? 1;
      self.costume = (self.costume + 1) % Math.max(1, count);
      ctx.rec?.costume(self.id, def?.costumes[self.costume]?.name ?? "costume");
      return;
    }
    case "show":
    case "hide": {
      if (!needSprite(ctx, self, st.id)) return;
      self.visible = st.kind === "show";
      ctx.rec?.visible(self.id, self.visible);
      return;
    }

    // ── Sound ──
    case "play-sound": {
      const owner = self
        ? ctx.project.sprites.find((s) => s.id === self.id)?.sounds
        : ctx.project.stage.sounds;
      const found = owner?.find((s) => s.name === st.sound);
      if (!found) {
        ctx.report({
          kind: "unknown-sound",
          name: st.sound,
          severity: "warning",
          blockId: st.id,
          message: `There is no sound called “${st.sound}” here. Open the Sounds list of this sprite and choose one of its own sounds.`,
        });
        return;
      }
      const who = self ? self.id : "stage";
      ctx.state.sound = { sprite: who, name: found.name };
      ctx.rec?.sound(who, found.name, found.seconds);
      if (!st.untilDone) return;
      yield wait(found.seconds);
      if (ctx.state.sound?.name === found.name) ctx.state.sound = null;
      return;
    }

    // ── Control ──
    case "wait":
      yield wait(st.secs);
      return;
    case "repeat": {
      const times = Math.round(evalExpr(st.times, ctx, self, st.id));
      const laps = clamp(Number.isFinite(times) ? times : 0, 0, MAX_LAPS);
      for (let i = 0; i < laps; i += 1) {
        charge(ctx, st.id);
        yield* execBody(st.body, ctx, self);
        yield { ms: ctx.settings.frameMs, id: st.id };
      }
      return;
    }
    case "forever": {
      for (let lap = 0; lap < MAX_LAPS; lap += 1) {
        charge(ctx, st.id);
        yield* execBody(st.body, ctx, self);
        yield { ms: ctx.settings.frameMs, id: st.id };
      }
      return;
    }
    case "if": {
      const taken = evalCond(st.cond, ctx, self, st.id);
      if (taken) yield* execBody(st.then, ctx, self);
      else if (st.otherwise) yield* execBody(st.otherwise, ctx, self);
      return;
    }
    case "stop-all":
      ctx.rec?.stopped();
      throw new ScHalt("stop-all");

    // ── Variables ──
    case "set-var": {
      const value = evalExpr(st.value, ctx, self, st.id);
      ctx.state.variables[st.name] = value;
      ctx.rec?.variable(st.name, value);
      return;
    }
    case "change-var": {
      const current = ctx.state.variables[st.name];
      if (current === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: st.name,
          severity: "warning",
          blockId: st.id,
          message: `“${st.name}” has never been set, so there is nothing to change yet. I started it at 0 — try setting it under the green flag.`,
        });
      }
      const value = (current ?? 0) + evalExpr(st.by, ctx, self, st.id);
      ctx.state.variables[st.name] = value;
      ctx.rec?.variable(st.name, value);
      return;
    }

    // ── Pen ──
    case "pen-down":
      if (!needSprite(ctx, self, st.id)) return;
      self.penDown = true;
      return;
    case "pen-up":
      if (!needSprite(ctx, self, st.id)) return;
      self.penDown = false;
      return;
    case "erase-all":
      ctx.state.pen = [];
      return;
    case "set-pen-colour":
      if (!needSprite(ctx, self, st.id)) return;
      self.penColour = st.colour;
      return;
    case "change-pen-colour":
      if (!needSprite(ctx, self, st.id)) return;
      self.penColour = self.penColour + evalExpr(st.by, ctx, self, st.id);
      return;
  }
}

// ── Tasks ───────────────────────────────────────────────────────────────────

interface ScTask {
  hatId: string;
  spriteId: string | null;
  gen: Generator<ScTick, void, void>;
  wakeAt: number;
  currentId: string | null;
  done: boolean;
}

interface ScTargetHats {
  spriteId: string | null;
  hats: ScHat[];
}

const allTargets = (project: ScProject): ScTargetHats[] => [
  { spriteId: null, hats: project.stage.scripts },
  ...project.sprites.map((s) => ({ spriteId: s.id, hats: s.scripts })),
];

function spawnTasks(
  ctx: ScCtx,
  at: number,
  match: (hat: ScHat, spriteId: string | null) => boolean,
): ScTask[] {
  const tasks: ScTask[] = [];
  for (const target of allTargets(ctx.project)) {
    const self = target.spriteId ? findSprite(ctx, target.spriteId) ?? null : null;
    for (const hat of target.hats) {
      if (!match(hat, target.spriteId)) continue;
      tasks.push({
        hatId: hat.id,
        spriteId: target.spriteId,
        gen: execBody(hat.body, ctx, self),
        wakeAt: at,
        currentId: null,
        done: false,
      });
    }
  }
  return tasks;
}

// ── The on-screen runtime ───────────────────────────────────────────────────

const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export interface ScRuntimeOptions {
  speed?: ScSpeed;
  maxSteps?: number;
  seed?: number;
}

/**
 * Build a runtime for one project. Nothing runs until `greenFlag()`.
 * The handle is deliberately imperative — a React host subscribes once and lets
 * the scheduler drive, instead of re-rendering a loop into existence.
 */
export function createScratchRuntime(
  project: ScProject,
  opts: ScRuntimeOptions = {},
): ScRuntime {
  let script = project;

  const profile = SC_SPEED_PROFILE[opts.speed ?? "normal"];
  const settings: ScSettings = {
    traceMs: profile.traceMs,
    frameMs: profile.frameMs,
    waitScale: profile.waitScale,
    maxSteps: Math.max(1, opts.maxSteps ?? DEFAULT_MAX_STEPS),
  };

  let state = initialStageState(script);
  let tasks: ScTask[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopReason: ScStopReason | null = null;
  let issues: ScIssue[] = [];
  let cached: ScRuntimeStatus | null = null;
  const seen = new Set<string>();
  const subscribers = new Set<(status: ScRuntimeStatus) => void>();
  const keys = new Set<string>();

  const ctx: ScCtx = {
    project: script,
    state,
    settings,
    clock: { now: 0 },
    steps: 0,
    keys,
    random: mulberry32(opts.seed ?? ((Date.now() ^ 0x5f3759df) >>> 0)),
    report: (issue) => pushIssue(issue),
    rec: null,
  };

  function pushIssue(issue: ScIssue): void {
    // One report per distinct mistake — a forever loop would otherwise print
    // the same warning five hundred times and bury the useful one.
    const key = `${issue.kind}|${issue.blockId ?? ""}|${issue.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (issues.length < MAX_ISSUES) issues = [...issues, issue];
    cached = null;
  }

  const hasWaitingHats = (): boolean =>
    allTargets(script).some((t) =>
      t.hats.some((h) => h.kind === "when-key" || h.kind === "when-clicked"),
    );

  function snapshot(): ScRuntimeStatus {
    if (cached) return cached;
    cached = {
      state: {
        ...state,
        sprites: state.sprites.map((s) => ({ ...s })),
        pen: [...state.pen],
        variables: { ...state.variables },
        mouse: { ...state.mouse },
      },
      running,
      idle: running && tasks.length === 0,
      activeIds: tasks
        .map((t) => t.currentId)
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

  function finish(reason: ScStopReason): void {
    clearTimer();
    tasks = [];
    running = false;
    stopReason = reason;
    state.running = false;
    state.sound = null;
    cached = null;
  }

  function wipe(): void {
    state = initialStageState(script);
    ctx.state = state;
    ctx.project = script;
    ctx.steps = 0;
    ctx.clock.now = 0;
    issues = [];
    seen.clear();
    stopReason = null;
    cached = null;
  }

  function advance(task: ScTask, at: number): void {
    try {
      const step = task.gen.next();
      if (step.done) {
        task.done = true;
        task.currentId = null;
        return;
      }
      task.currentId = step.value.id;
      task.wakeAt = at + Math.max(0, step.value.ms);
    } catch (error) {
      if (error instanceof ScHalt) {
        if (error.issue) pushIssue(error.issue);
        finish(error.reason);
        return;
      }
      task.done = true;
      task.currentId = null;
      pushIssue({
        kind: "crashed",
        detail: error instanceof Error ? error.message : String(error),
        severity: "error",
        message:
          "Something unexpected went wrong while running this project. Press the stop sign and try again.",
      });
    }
  }

  function loop(): void {
    timer = null;
    if (!running) return;

    const startedAt = nowMs();
    let budget = PASS_BUDGET;
    let advanced = true;

    while (running && advanced && budget > 0 && nowMs() - startedAt < PASS_MS) {
      advanced = false;
      const at = nowMs();
      ctx.clock.now = at;
      for (const task of [...tasks]) {
        if (task.done || task.wakeAt > at) continue;
        advance(task, at);
        advanced = true;
        budget -= 1;
        if (!running) break;
      }
      if (running) tasks = tasks.filter((t) => !t.done);
    }

    if (running && tasks.length === 0 && !hasWaitingHats()) finish("finished");

    notify();
    schedule();
  }

  function start(newTasks: ScTask[]): void {
    if (newTasks.length === 0) return;
    tasks = [...tasks, ...newTasks];
    running = true;
    state.running = true;
    notify();
    schedule();
  }

  return {
    greenFlag() {
      clearTimer();
      tasks = [];
      wipe();
      const at = nowMs();
      const spawned = spawnTasks(ctx, at, (hat) => hat.kind === "when-flag");
      if (spawned.length === 0 && !hasWaitingHats()) {
        pushIssue({
          kind: "empty-project",
          severity: "warning",
          message:
            "Nothing is waiting for the green flag yet. Drop a “when green flag clicked” block at the top of a script, then press it again.",
        });
        stopReason = "finished";
        notify();
        return;
      }
      running = true;
      state.running = true;
      start(spawned);
      if (spawned.length === 0) notify();
    },

    stopAll() {
      if (!running) return;
      finish("stopped");
      notify();
    },

    reset() {
      clearTimer();
      running = false;
      tasks = [];
      wipe();
      notify();
    },

    keyDown(key) {
      keys.add(key);
      if (!running) return;
      start(
        spawnTasks(ctx, nowMs(), (hat) => hat.kind === "when-key" && hat.key === key),
      );
    },

    keyUp(key) {
      keys.delete(key);
    },

    clickSprite(spriteId) {
      if (!running) return;
      start(
        spawnTasks(
          ctx,
          nowMs(),
          (hat, owner) => hat.kind === "when-clicked" && owner === spriteId,
        ),
      );
    },

    setMouse(x, y) {
      state.mouse = {
        ...state.mouse,
        x: clamp(Math.round(x), -STAGE_X, STAGE_X),
        y: clamp(Math.round(y), -STAGE_Y, STAGE_Y),
      };
      cached = null;
    },

    setMouseDown(down) {
      state.mouse = { ...state.mouse, down };
      cached = null;
    },

    setSpeed(speed) {
      const next = SC_SPEED_PROFILE[speed];
      settings.traceMs = next.traceMs;
      settings.frameMs = next.frameMs;
      settings.waitScale = next.waitScale;
      notify();
    },

    setProject(next) {
      clearTimer();
      running = false;
      tasks = [];
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

// ── Recording a trial on a virtual clock ────────────────────────────────────

export type ScStimulus =
  | { at: number; kind: "key"; key: ScKey; holdMs?: number }
  | { at: number; kind: "click"; sprite: string }
  | { at: number; kind: "mouse"; x: number; y: number }
  | { at: number; kind: "mouse-down"; down: boolean }
  /** A perfect player: from now on the mouse tracks this sprite. */
  | { at: number; kind: "follow"; sprite: string; axis: "x" | "y" | "both" }
  /** The checker nudges a score, so a long game can be tested in one step. */
  | { at: number; kind: "set-variable"; name: string; value: number };

/** Everything a trial needs to replay a project; the assertions live next door. */
export interface ScTrialInput {
  id: string;
  label: string;
  durationMs: number;
  input?: ScStimulus[];
  seed?: number;
}

export interface ScSayEvent {
  at: number;
  endsAt: number;
  sprite: string;
  text: string;
  kind: "say" | "think";
}

export interface ScBackdropEvent {
  at: number;
  name: string;
}

export interface ScVisibilityEvent {
  at: number;
  sprite: string;
  visible: boolean;
}

export interface ScCostumeEvent {
  at: number;
  sprite: string;
  costume: string;
}

export interface ScSoundEvent {
  at: number;
  endsAt: number;
  sprite: string;
  sound: string;
}

export interface ScVarSample {
  at: number;
  name: string;
  value: number;
}

export interface ScPoseSample {
  at: number;
  sprite: string;
  x: number;
  y: number;
  direction: number;
  visible: boolean;
}

export interface ScMouseSample {
  at: number;
  x: number;
  y: number;
}

export interface ScTouchEvent {
  at: number;
  sprite: string;
  other: string;
}

export interface ScColourTouchEvent {
  at: number;
  sprite: string;
  colour: ScColourName;
}

/** Everything the simulator observed during one trial. */
export interface ScRunRecord {
  trialId: string;
  durationMs: number;
  /** The project's own setup, so a check can look at the backdrops themselves. */
  backdropNames: string[];
  spriteInfo: { id: string; name: string; costumes: number }[];
  /** Backdrop timeline, starting with the one showing at time 0. */
  backdrops: ScBackdropEvent[];
  says: ScSayEvent[];
  visibility: ScVisibilityEvent[];
  costumes: ScCostumeEvent[];
  sounds: ScSoundEvent[];
  variables: ScVarSample[];
  poses: ScPoseSample[];
  mouse: ScMouseSample[];
  touches: ScTouchEvent[];
  colourTouches: ScColourTouchEvent[];
  pen: ScPenLine[];
  /** When a `stop all` block ran, in simulated ms. */
  stoppedAt: number | null;
  endedAt: number;
  finalSprites: ScSpriteState[];
  finalVariables: Record<string, number>;
  finalBackdrop: string;
  issues: ScIssue[];
}

const SAMPLE_MS = 50;
const POSE_MS = 100;
const MAX_SAMPLES = 40_000;
/** However strange the project, one trial may not hold the browser for long. */
const MAX_REAL_MS = 900;

/**
 * Replay a project against one trial with no timers at all: the clock jumps
 * from one due event to the next, so twenty simulated seconds cost microseconds
 * and two runs of the same project always agree.
 */
export function simulateTrial(project: ScProject, trial: ScTrialInput): ScRunRecord {
  const state = initialStageState(project);
  const issues: ScIssue[] = [];
  const seen = new Set<string>();

  const backdrops: ScBackdropEvent[] = [];
  const says: ScSayEvent[] = [];
  const visibility: ScVisibilityEvent[] = [];
  const costumes: ScCostumeEvent[] = [];
  const sounds: ScSoundEvent[] = [];
  const variables: ScVarSample[] = [];
  const poses: ScPoseSample[] = [];
  const mouse: ScMouseSample[] = [];
  const touches: ScTouchEvent[] = [];
  const colourTouches: ScColourTouchEvent[] = [];
  let stoppedAt: number | null = null;

  const clock = { now: 0 };
  const settings: ScSettings = {
    traceMs: 0,
    frameMs: SC_SPEED_PROFILE.normal.frameMs,
    waitScale: 1,
    maxSteps: DEFAULT_MAX_STEPS,
  };

  const rec: ScRecorder = {
    backdrop: (name) => backdrops.push({ at: clock.now, name }),
    say: (sprite, text, kind, secs) =>
      says.push({
        at: clock.now,
        endsAt: secs === undefined ? Number.POSITIVE_INFINITY : clock.now + secs * 1000,
        sprite,
        text,
        kind,
      }),
    visible: (sprite, value) =>
      visibility.push({ at: clock.now, sprite, visible: value }),
    costume: (sprite, costume) => costumes.push({ at: clock.now, sprite, costume }),
    sound: (sprite, sound, seconds) =>
      sounds.push({ at: clock.now, endsAt: clock.now + seconds * 1000, sprite, sound }),
    variable: (name, value) => variables.push({ at: clock.now, name, value }),
    stopped: () => {
      stoppedAt = clock.now;
    },
  };

  const ctx: ScCtx = {
    project,
    state,
    settings,
    clock,
    steps: 0,
    keys: new Set<string>(),
    random: mulberry32(trial.seed ?? 20260810),
    report: (issue) => {
      const key = `${issue.kind}|${issue.blockId ?? ""}|${issue.message}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (issues.length < MAX_ISSUES) issues.push(issue);
    },
    rec,
  };

  // The backdrop showing before anything runs is part of the timeline.
  backdrops.push({
    at: 0,
    name: project.backdrops[state.backdrop]?.name ?? "backdrop1",
  });
  for (const sprite of state.sprites) {
    visibility.push({ at: 0, sprite: sprite.id, visible: sprite.visible });
  }

  let tasks = spawnTasks(ctx, 0, (hat) => hat.kind === "when-flag");
  state.running = true;

  const timeline = [...(trial.input ?? [])].sort((a, b) => a.at - b.at);
  let nextStimulus = 0;
  const keyReleases: { at: number; key: ScKey }[] = [];
  let follow: { sprite: string; axis: "x" | "y" | "both" } | null = null;

  const touching = new Set<string>();
  const onColour = new Set<string>();
  let nextSample = 0;
  let lastPose = -POSE_MS;
  let stopped = false;
  const realStart = Date.now();

  const sample = (at: number): void => {
    if (poses.length + mouse.length > MAX_SAMPLES) return;
    const wantPose = at - lastPose >= POSE_MS;
    if (wantPose) {
      lastPose = at;
      mouse.push({ at, x: state.mouse.x, y: state.mouse.y });
      for (const sprite of state.sprites) {
        poses.push({
          at,
          sprite: sprite.id,
          x: sprite.x,
          y: sprite.y,
          direction: sprite.direction,
          visible: sprite.visible,
        });
      }
    }
    // Overlaps are watched by the checker, not by the student's blocks, so a
    // project that never asks "touching?" is still measured fairly.
    const backdrop = project.backdrops[state.backdrop];
    for (const sprite of state.sprites) {
      for (const other of state.sprites) {
        if (sprite.id === other.id) continue;
        const key = `${sprite.id}>${other.id}`;
        const now =
          sprite.visible && other.visible && boxesOverlap(spriteBox(sprite), spriteBox(other));
        if (now && !touching.has(key)) {
          touching.add(key);
          touches.push({ at, sprite: sprite.id, other: other.id });
        } else if (!now) {
          touching.delete(key);
        }
      }
      const here = sprite.visible ? coloursUnder(backdrop, spriteBox(sprite)) : [];
      for (const colour of here) {
        const key = `${sprite.id}#${colour}`;
        if (!onColour.has(key)) {
          onColour.add(key);
          colourTouches.push({ at, sprite: sprite.id, colour });
        }
      }
      for (const key of [...onColour]) {
        if (!key.startsWith(`${sprite.id}#`)) continue;
        const colour = key.slice(sprite.id.length + 1) as ScColourName;
        if (!here.includes(colour)) onColour.delete(key);
      }
    }
  };

  const applyFollow = (): void => {
    if (!follow) return;
    const target = state.sprites.find((s) => s.id === follow?.sprite);
    if (!target) return;
    if (follow.axis === "x" || follow.axis === "both") state.mouse.x = Math.round(target.x);
    if (follow.axis === "y" || follow.axis === "both") state.mouse.y = Math.round(target.y);
  };

  // No sample before the first pass: the opening blocks of every script run at
  // time 0, and "where did it start?" means where the script put it.
  let guard = 0;
  while (!stopped && clock.now < trial.durationMs) {
    if ((guard += 1) > 2_000_000 || Date.now() - realStart > MAX_REAL_MS) break;

    // Where does the clock go next? The earliest of: a task waking, a
    // stimulus arriving, a key lifting, the next sample, the end of the trial.
    let next = trial.durationMs;
    for (const task of tasks) if (!task.done) next = Math.min(next, task.wakeAt);
    if (nextStimulus < timeline.length) next = Math.min(next, timeline[nextStimulus].at);
    for (const release of keyReleases) next = Math.min(next, release.at);
    next = Math.min(next, nextSample);
    clock.now = Math.max(clock.now, next);

    while (nextStimulus < timeline.length && timeline[nextStimulus].at <= clock.now) {
      const stimulus = timeline[nextStimulus];
      nextStimulus += 1;
      switch (stimulus.kind) {
        case "key":
          ctx.keys.add(stimulus.key);
          keyReleases.push({
            at: clock.now + (stimulus.holdMs ?? 120),
            key: stimulus.key,
          });
          tasks = [
            ...tasks,
            ...spawnTasks(
              ctx,
              clock.now,
              (hat) => hat.kind === "when-key" && hat.key === stimulus.key,
            ),
          ];
          break;
        case "click":
          tasks = [
            ...tasks,
            ...spawnTasks(
              ctx,
              clock.now,
              (hat, owner) => hat.kind === "when-clicked" && owner === stimulus.sprite,
            ),
          ];
          break;
        case "mouse":
          state.mouse = {
            ...state.mouse,
            x: clamp(stimulus.x, -STAGE_X, STAGE_X),
            y: clamp(stimulus.y, -STAGE_Y, STAGE_Y),
          };
          break;
        case "mouse-down":
          state.mouse = { ...state.mouse, down: stimulus.down };
          break;
        case "follow":
          follow = { sprite: stimulus.sprite, axis: stimulus.axis };
          break;
        case "set-variable":
          state.variables[stimulus.name] = stimulus.value;
          variables.push({ at: clock.now, name: stimulus.name, value: stimulus.value });
          break;
      }
    }

    for (let i = keyReleases.length - 1; i >= 0; i -= 1) {
      if (keyReleases[i].at <= clock.now) {
        ctx.keys.delete(keyReleases[i].key);
        keyReleases.splice(i, 1);
      }
    }

    applyFollow();

    let ran = false;
    for (const task of [...tasks]) {
      if (task.done || task.wakeAt > clock.now) continue;
      try {
        const step = task.gen.next();
        if (step.done) {
          task.done = true;
          task.currentId = null;
        } else {
          task.currentId = step.value.id;
          task.wakeAt = clock.now + Math.max(0, step.value.ms);
        }
      } catch (error) {
        if (error instanceof ScHalt) {
          if (error.issue) ctx.report(error.issue);
          stopped = true;
          break;
        }
        task.done = true;
        ctx.report({
          kind: "crashed",
          detail: error instanceof Error ? error.message : String(error),
          severity: "error",
          message:
            "Something unexpected went wrong while running this project. Press the stop sign and try again.",
        });
      }
      ran = true;
    }
    tasks = tasks.filter((t) => !t.done);

    if (clock.now >= nextSample) {
      sample(clock.now);
      nextSample = clock.now + SAMPLE_MS;
    }

    if (stopped) break;
    if (tasks.length === 0 && nextStimulus >= timeline.length && !ran) {
      // Nothing left to run and nothing left to arrive: sample to the end so
      // "where did it finish" questions still have an answer.
      break;
    }
  }

  const endedAt = Math.min(clock.now, trial.durationMs);
  sample(endedAt);
  state.running = false;

  return {
    trialId: trial.id,
    durationMs: trial.durationMs,
    backdropNames: project.backdrops.map((b) => b.name),
    spriteInfo: project.sprites.map((s) => ({
      id: s.id,
      name: s.name,
      costumes: s.costumes.length,
    })),
    backdrops,
    says,
    visibility,
    costumes,
    sounds,
    variables,
    poses,
    mouse,
    touches,
    colourTouches,
    pen: state.pen,
    stoppedAt,
    endedAt,
    finalSprites: state.sprites.map((s) => ({ ...s })),
    finalVariables: { ...state.variables },
    finalBackdrop: project.backdrops[state.backdrop]?.name ?? "backdrop1",
    issues,
  };
}

// ── Reading a drawing back ──────────────────────────────────────────────────

export interface ScPenShape {
  /** Corners, after straight-on joins have been merged into one side. */
  sides: number;
  sideLengths: number[];
  perimeter: number;
  start: { x: number; y: number };
  /** True when every side is the same length, give or take a tenth. */
  equalSides: boolean;
  colour: number;
}

const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(ax - bx, ay - by);

/** Two drawn points are the same corner when they are this close. */
const CORNER_EPS = 3;
/** A join this straight is not a corner at all. */
const STRAIGHT_EPS = 8;

interface ScStroke {
  points: { x: number; y: number }[];
  /** Colour of the segment leaving points[i]. */
  colours: number[];
}

/** Split the pen record into unbroken strokes — the pen lifting starts a new one. */
function strokesOf(lines: ScPenLine[]): ScStroke[] {
  const strokes: ScStroke[] = [];
  let current: ScStroke | null = null;
  for (const line of lines) {
    if (dist(line.x1, line.y1, line.x2, line.y2) < 0.01) continue;
    if (
      !current ||
      dist(
        current.points[current.points.length - 1].x,
        current.points[current.points.length - 1].y,
        line.x1,
        line.y1,
      ) > CORNER_EPS
    ) {
      current = { points: [{ x: line.x1, y: line.y1 }], colours: [] };
      strokes.push(current);
    }
    current.points.push({ x: line.x2, y: line.y2 });
    current.colours.push(line.colour);
  }
  return strokes;
}

/** Corner count of a closed loop, with straight-on joins merged away. */
function measureLoop(points: { x: number; y: number }[]): {
  sides: number;
  lengths: number[];
} {
  const n = points.length;
  const edges: { angle: number; length: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const length = dist(a.x, a.y, b.x, b.y);
    if (length < 0.5) continue;
    edges.push({ angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, length });
  }
  if (edges.length === 0) return { sides: 0, lengths: [] };
  const merged: { angle: number; length: number }[] = [];
  for (const edge of edges) {
    const last = merged[merged.length - 1];
    const turn = last ? Math.abs(wrapDirection(edge.angle - last.angle)) : 999;
    if (last && turn < STRAIGHT_EPS) last.length += edge.length;
    else merged.push({ ...edge });
  }
  // The seam between the last and the first edge is a join too.
  if (merged.length > 1) {
    const first = merged[0];
    const last = merged[merged.length - 1];
    if (Math.abs(wrapDirection(first.angle - last.angle)) < STRAIGHT_EPS) {
      first.length += last.length;
      merged.pop();
    }
  }
  return { sides: merged.length, lengths: merged.map((e) => e.length) };
}

/**
 * Read the closed shapes back out of a drawing.
 *
 * The pen leaves an ordered list of segments; walking them on a stack and
 * popping whenever the path comes back to a corner it has already visited pulls
 * each closed figure out on its own — the twelve squares of a rotating pattern,
 * or the four triangles standing on the sides of a square.
 */
export function analysePenShapes(lines: ScPenLine[]): ScPenShape[] {
  const shapes: ScPenShape[] = [];
  for (const stroke of strokesOf(lines)) {
    const stack: { x: number; y: number }[] = [stroke.points[0]];
    const stackColour: number[] = [];
    for (let i = 1; i < stroke.points.length; i += 1) {
      const point = stroke.points[i];
      const colour = stroke.colours[i - 1];
      let closedAt = -1;
      for (let j = stack.length - 2; j >= 0; j -= 1) {
        if (dist(stack[j].x, stack[j].y, point.x, point.y) <= CORNER_EPS) {
          closedAt = j;
          break;
        }
      }
      if (closedAt < 0) {
        stack.push(point);
        stackColour.push(colour);
        continue;
      }
      const loop = stack.slice(closedAt);
      const { sides, lengths } = measureLoop(loop);
      if (sides >= 3 && shapes.length < 400) {
        const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        shapes.push({
          sides,
          sideLengths: lengths,
          perimeter: lengths.reduce((a, b) => a + b, 0),
          start: { x: loop[0].x, y: loop[0].y },
          equalSides: lengths.every((l) => Math.abs(l - mean) <= mean * 0.12),
          colour: stackColour[closedAt] ?? colour,
        });
      }
      stack.length = closedAt + 1;
      stackColour.length = closedAt;
    }
  }
  return shapes;
}

/** Distinct pen colours used in a drawing. */
export const penColoursUsed = (lines: ScPenLine[]): number[] => {
  const out: number[] = [];
  for (const line of lines) {
    const colour = (((line.colour % 100) + 100) % 100);
    if (!out.some((c) => Math.abs(c - colour) < 2)) out.push(colour);
  }
  return out;
};

/** Handy for a legend or a swatch next to the drawing. */
export const penLineCss = (line: ScPenLine): string => penColourCss(line.colour);

// ── The project in words, for teaching ──────────────────────────────────────

export interface ScPseudoLine {
  id: string;
  depth: number;
  text: string;
}

const round1 = (n: number): string =>
  Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);

export function describeExpr(expr: ScExpr): string {
  switch (expr.kind) {
    case "num":
      return round1(expr.value);
    case "var":
      return expr.name;
    case "mouse-x":
      return "the mouse x";
    case "mouse-y":
      return "the mouse y";
    case "x-position":
      return "its own x";
    case "y-position":
      return "its own y";
    case "random":
      return `a random number from ${describeExpr(expr.min)} to ${describeExpr(expr.max)}`;
    case "binop":
      return `${describeExpr(expr.left)} ${expr.op} ${describeExpr(expr.right)}`;
  }
}

export function describeCond(cond: ScCond): string {
  switch (cond.kind) {
    case "touching-sprite":
      return `it is touching ${cond.sprite}`;
    case "touching-colour":
      return `it is touching the colour ${cond.colour}`;
    case "touching-edge":
      return "it is touching the edge";
    case "key-pressed":
      return `the ${cond.key} key is pressed`;
    case "mouse-down":
      return "the mouse button is down";
    case "compare":
      return `${describeExpr(cond.left)} ${cond.op} ${describeExpr(cond.right)}`;
  }
}

function describeStatement(st: ScStatement): string {
  switch (st.kind) {
    case "move":
      return `move ${describeExpr(st.steps)} steps forward`;
    case "turn":
      return `turn ${st.way === "cw" ? "right" : "left"} ${describeExpr(st.degrees)} degrees`;
    case "goto-xy":
      return `jump to x = ${describeExpr(st.x)}, y = ${describeExpr(st.y)}`;
    case "glide-xy":
      return `glide in ${st.secs} seconds to x = ${describeExpr(st.x)}, y = ${describeExpr(st.y)}`;
    case "point-in-direction":
      return `point in direction ${describeExpr(st.degrees)}`;
    case "if-on-edge-bounce":
      return "bounce if it has reached the edge";
    case "say":
      return st.secs === undefined
        ? `say “${st.text}”`
        : `say “${st.text}” for ${st.secs} seconds`;
    case "think":
      return st.secs === undefined
        ? `think “${st.text}”`
        : `think “${st.text}” for ${st.secs} seconds`;
    case "switch-backdrop":
      return `show the backdrop ${st.backdrop}`;
    case "next-backdrop":
      return "show the next backdrop";
    case "switch-costume":
      return `wear the costume ${st.costume}`;
    case "next-costume":
      return "wear the next costume";
    case "show":
      return "appear on the stage";
    case "hide":
      return "disappear from the stage";
    case "play-sound":
      return st.untilDone
        ? `play the sound ${st.sound} right to the end`
        : `start the sound ${st.sound}`;
    case "wait":
      return `wait ${st.secs} seconds`;
    case "repeat":
      return `repeat ${describeExpr(st.times)} times:`;
    case "forever":
      return "forever, over and over:";
    case "if":
      return `if ${describeCond(st.cond)} then:`;
    case "stop-all":
      return "stop everything";
    case "set-var":
      return `set ${st.name} to ${describeExpr(st.value)}`;
    case "change-var":
      return `change ${st.name} by ${describeExpr(st.by)}`;
    case "pen-down":
      return "put the pen down";
    case "pen-up":
      return "lift the pen up";
    case "erase-all":
      return "erase everything the pen drew";
    case "set-pen-colour":
      return `set the pen colour to ${st.colour}`;
    case "change-pen-colour":
      return `change the pen colour by ${describeExpr(st.by)}`;
  }
}

const describeHat = (hat: ScHat): string => {
  switch (hat.kind) {
    case "when-flag":
      return "When the green flag is clicked:";
    case "when-key":
      return `When the ${hat.key} key is pressed:`;
    case "when-clicked":
      return "When this sprite is clicked:";
  }
};

function pushLines(body: ScStatement[], depth: number, out: ScPseudoLine[]): void {
  for (const stmt of body) {
    out.push({ id: stmt.id, depth, text: describeStatement(stmt) });
    if (stmt.kind === "repeat" || stmt.kind === "forever") {
      pushLines(stmt.body, depth + 1, out);
    } else if (stmt.kind === "if") {
      pushLines(stmt.then, depth + 1, out);
      if (stmt.otherwise && stmt.otherwise.length > 0) {
        out.push({ id: `${stmt.id}:else`, depth, text: "if not, then:" });
        pushLines(stmt.otherwise, depth + 1, out);
      }
    }
  }
}

/** One script as readable pseudocode — Teach Mode reads these out loud. */
export function describeScripts(hats: ScHat[]): ScPseudoLine[] {
  const out: ScPseudoLine[] = [];
  for (const hat of hats) {
    out.push({ id: hat.id, depth: 0, text: describeHat(hat) });
    pushLines(hat.body, 1, out);
  }
  return out;
}
