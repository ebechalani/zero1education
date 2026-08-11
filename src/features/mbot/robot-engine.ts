/**
 * The mBot2 runtime — a stepped, interruptible interpreter for `RbProgram`.
 *
 * Four rules shape every decision in this file:
 *
 *  1. **It must never block the tab.** Every statement is a generator that
 *     yields back to a scheduler, so a `forever` loop is a coroutine the host
 *     keeps waking up. Stop is instant, mid-drive.
 *  2. **Several hats run at once.** That is the whole point of Lesson 5's
 *     "multitasking mission": one script closes the shutter, another watches
 *     for a hand and stops the motor. The scheduler is a small discrete-event
 *     queue, so the interleaving is deterministic and replayable.
 *  3. **It must never throw at the class.** A Grade 6 mission is full of honest
 *     mistakes — a variable that was never set, a wall in the way, a speed of
 *     0 %. Those come back as `RbIssue` values written for a student, and the
 *     mission keeps running with a sensible fallback.
 *  4. **The same code judges the answer.** `simulate()` runs a mission on a
 *     virtual clock with no timers at all, so checking a student's work is
 *     exact and instant, and uses the physics the class just watched.
 *
 * Time is measured in milliseconds throughout. In the live runtime one virtual
 * millisecond is one real millisecond; `simulate()` simply runs the same clock
 * as fast as the CPU allows.
 */

import { clamp } from "@/lib/utils";
import {
  RB_COLOUR_OBJECT_CM,
  RB_COLOUR_OFFSET_CM,
  RB_DEFAULT_SPEED,
  RB_MOTOR_ROT_PER_SEC,
  RB_ROBOT_RADIUS_CM,
  RB_SENSOR_OFFSET_CM,
  RB_SHUTTER_CLOSED_TURNS,
  RB_TURN_DEG_PER_SEC,
  RB_ULTRASONIC_MAX_CM,
  RB_ULTRASONIC_MIN_CM,
  RB_ALL_LEDS_OFF,
  RB_CM_PER_ROTATION,
  RB_JOYSTICK_LABEL,
  RB_MOTOR_LABEL,
  RB_OP_LABEL,
  arenaById,
  initialWorldState,
  rbCircleHitsRect,
  rbHeadingVector,
  rbNormaliseAngle,
  rbPointInRect,
  rbRayHitsRect,
  rbSpeedCmPerSec,
  type RbArena,
  type RbArenaId,
  type RbButton,
  type RbColour,
  type RbEvent,
  type RbExpr,
  type RbJoystick,
  type RbLedColour,
  type RbMotor,
  type RbPose,
  type RbProgram,
  type RbStatement,
  type RbValue,
  type RbWorldState,
} from "./robot-model";

// ── Public types ────────────────────────────────────────────────────────────

export const RB_SPEEDS = {
  slow: { statementMs: 260, timeScale: 2 },
  normal: { statementMs: 80, timeScale: 1 },
  fast: { statementMs: 16, timeScale: 0.35 },
} as const;

export type RbSpeed = keyof typeof RB_SPEEDS;

export type RbSeverity = "warning" | "error";

/** Everything that can go wrong, as data, in a student's words. */
export type RbIssue = {
  message: string;
  severity: RbSeverity;
  /** Which block it came from, so the editor can point at it. */
  statementId?: string;
} & (
  | { kind: "unknown-variable"; name: string }
  | { kind: "bumped" }
  | { kind: "off-road" }
  | { kind: "bad-number"; detail: string }
  | { kind: "too-many-steps"; limit: number }
  | { kind: "empty-program" }
  | { kind: "crashed"; detail: string }
);

export type RbStopReason = "stopped" | "finished" | "step-limit" | "crashed";

export interface RbRuntimeStatus {
  world: RbWorldState;
  arena: RbArena;
  running: boolean;
  /** Running, but waiting for someone to press a button or pull the joystick. */
  idle: boolean;
  /** Blocks executing right now, one per live script. */
  activeIds: string[];
  steps: number;
  issues: RbIssue[];
  stopReason: RbStopReason | null;
}

export interface RbRuntimeOptions {
  speed?: RbSpeed;
  light?: number;
  objectCm?: number | null;
  objectColour?: RbColour;
  maxSteps?: number;
}

export interface RbRuntime {
  start(): void;
  stop(): void;
  /** Stop, put the robot back on its starting square, wipe the screen. */
  reset(): void;
  /** A short press, like a finger on the CyberPi. */
  pressButton(button: RbButton): void;
  /** A short pull of the joystick. */
  pullJoystick(direction: RbJoystick): void;
  setLight(percent: number): void;
  setObject(cm: number | null, colour?: RbColour): void;
  setSpeed(speed: RbSpeed): void;
  subscribe(callback: (status: RbRuntimeStatus) => void): () => void;
  getStatus(): RbRuntimeStatus;
  dispose(): void;
}

// ── What a recorded mission looks like ──────────────────────────────────────

export interface RbTrialSetup {
  start?: RbPose;
  light?: number;
  objectCm?: number | null;
  objectColour?: RbColour;
  speedPercent?: number;
}

/** Everything that can happen to the robot from outside during a trial. */
export type RbStimulus =
  | { at: number; kind: "press"; button: RbButton }
  | { at: number; kind: "joystick"; direction: RbJoystick }
  | { at: number; kind: "light"; value: number }
  | { at: number; kind: "object"; cm: number | null; colour?: RbColour };

export interface RbSimTrial {
  id: string;
  arena: RbArenaId;
  setup?: RbTrialSetup;
  input?: RbStimulus[];
  /** Simulated milliseconds. A trial may be far longer than a lesson. */
  durationMs: number;
}

export interface RbRunRecord {
  trialId: string;
  arenaId: RbArenaId;
  durationMs: number;
  /** Where the robot was put down — displacement is measured from here. */
  start: RbPose;
  final: RbPose;
  travelledCm: number;
  turnedDeg: number;
  bumps: number;
  offRoadMs: number;
  path: { at: number; x: number; y: number; heading: number }[];
  zoneVisits: { at: number; zone: string }[];
  finalZones: string[];
  printed: { at: number; text: string }[];
  finalScreen: string[];
  ledFrames: { at: number; colours: RbLedColour[] }[];
  finalLeds: RbLedColour[];
  sounds: { at: number; sound: string }[];
  voices: { at: number; text: string }[];
  recordings: { at: number; event: "start" | "stop" | "play" }[];
  variables: { at: number; name: string; value: RbValue }[];
  finalVariables: Record<string, RbValue>;
  shutterSamples: { at: number; turns: number }[];
  finalShutterTurns: number;
  maxShutterTurns: number;
  /** How many times a script called `stop encoder motor`. */
  motorStops: number;
  minDistanceCm: number;
  issues: string[];
}

// ── Tuning ──────────────────────────────────────────────────────────────────

const DEFAULT_MAX_STEPS = 250_000;
const MAX_LAPS = 100_000;
const MAX_ISSUES = 10;
const MAX_SCREEN_LINES = 12;
const MAX_TRAIL = 600;
/** One centimetre per motion tick: smooth to watch, exact enough to stop on a wall. */
const DRIVE_STEP_CM = 1;
const TURN_STEP_DEG = 5;
const MOTOR_SLICE_MS = 60;
/** A `play … until done` block holds the script for about this long. */
const SOUND_MS = 700;
/** How long a simulated press or joystick pull lasts. */
const PULSE_MS = 250;
/** Blocks are charged this much virtual time while checking an answer. */
const SIM_STATEMENT_MS = 2;
/** Work one live wake-up may do before handing the thread back. */
const LIVE_OPS = 400;
const LIVE_MS = 8;
/** A whole simulated trial may not cost more than this many scheduler steps. */
const SIM_OPS = 150_000;
const SPEED_FLOOR = 5;

// ── Values ──────────────────────────────────────────────────────────────────

const looksNumeric = (v: RbValue): boolean =>
  typeof v === "number" || (v.trim() !== "" && Number.isFinite(Number(v)));

export const rbAsNumber = (v: RbValue): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : 0;
};

export const rbAsText = (v: RbValue): string => {
  if (typeof v === "string") return v;
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
};

const asBool = (v: RbValue): boolean =>
  typeof v === "number"
    ? v !== 0
    : v.trim() !== "" && v.trim().toLowerCase() !== "false" && v.trim() !== "0";

// ── Interpreter internals ───────────────────────────────────────────────────

interface RbTick {
  ms: number;
  id: string | null;
}

interface Settings {
  statementMs: number;
  timeScale: number;
  maxSteps: number;
}

type Body = () => Generator<RbTick, void, void>;

interface Ctx {
  arena: RbArena;
  world: RbWorldState;
  settings: Settings;
  steps: number;
  clock: { now: number };
  timerBase: number;
  /** Bumped by `stop encoder motor` — every motion in flight sees it and quits. */
  stopToken: number;
  motorStops: number;
  report: (issue: RbIssue) => void;
  spawn: (eventId: string, body: Body) => void;
  /** Called for every `print`, so the recorder never has to guess. */
  onPrint: ((text: string, at: number) => void) | null;
}

/** Internal stop signal. Never escapes the scheduler, never reaches the UI. */
class RbHalt {
  constructor(
    readonly issue: RbIssue,
    readonly reason: RbStopReason,
  ) {}
}

const tick = (ctx: Ctx, id: string): RbTick => ({
  ms: ctx.settings.statementMs,
  id,
});

function charge(ctx: Ctx, id: string): void {
  ctx.steps += 1;
  if (ctx.steps > ctx.settings.maxSteps) {
    throw new RbHalt(
      {
        kind: "too-many-steps",
        limit: ctx.settings.maxSteps,
        severity: "error",
        statementId: id,
        message:
          "This mission ran an enormous number of blocks without finishing — that usually means a loop never ends. I stopped it so the page stays awake.",
      },
      "step-limit",
    );
  }
}

// ── Sensing ─────────────────────────────────────────────────────────────────

/** The point the ultrasonic sensor looks out from. */
export function rbSensorPoint(world: RbWorldState): {
  x: number;
  y: number;
  dx: number;
  dy: number;
} {
  const { dx, dy } = rbHeadingVector(world.heading);
  return {
    x: world.x + dx * RB_SENSOR_OFFSET_CM,
    y: world.y + dy * RB_SENSOR_OFFSET_CM,
    dx,
    dy,
  };
}

/** What the ultrasonic sensor reads right now, in centimetres. */
export function rbReadUltrasonic(arena: RbArena, world: RbWorldState): number {
  const { x, y, dx, dy } = rbSensorPoint(world);
  let best = RB_ULTRASONIC_MAX_CM;

  // The arena walls close the world in — a beam always ends somewhere.
  if (dx > 1e-9) best = Math.min(best, (arena.widthCm - x) / dx);
  else if (dx < -1e-9) best = Math.min(best, -x / dx);
  if (dy > 1e-9) best = Math.min(best, (arena.heightCm - y) / dy);
  else if (dy < -1e-9) best = Math.min(best, -y / dy);

  for (const w of arena.walls) {
    const t = rbRayHitsRect(x, y, dx, dy, w);
    if (t !== null && t >= 0) best = Math.min(best, t);
  }

  if (world.objectCm !== null) best = Math.min(best, world.objectCm);
  return clamp(best, RB_ULTRASONIC_MIN_CM, RB_ULTRASONIC_MAX_CM);
}

/**
 * What the quad RGB sensor reads. It points down at the floor, but an object
 * standing right in front of the robot is read instead — that is how the smart
 * bin of Lesson 3 reads the colour of the trash it has just received.
 */
export function rbReadColour(arena: RbArena, world: RbWorldState): RbColour {
  if (world.objectCm !== null && world.objectCm <= RB_COLOUR_OBJECT_CM) {
    return world.objectColour;
  }
  const { dx, dy } = rbHeadingVector(world.heading);
  const px = world.x + dx * RB_COLOUR_OFFSET_CM;
  const py = world.y + dy * RB_COLOUR_OFFSET_CM;
  for (let i = arena.patches.length - 1; i >= 0; i -= 1) {
    const patch = arena.patches[i];
    if (patch.colour === "none") continue;
    if (rbPointInRect(px, py, patch)) return patch.colour;
  }
  return arena.floorColour;
}

const hasRoads = (arena: RbArena): boolean =>
  arena.patches.some((p) => p.road);

function readOffRoad(arena: RbArena, world: RbWorldState): boolean {
  if (!hasRoads(arena)) return false;
  return !arena.patches.some(
    (p) => p.road && rbPointInRect(world.x, world.y, p),
  );
}

/** Zones the robot is standing in right now. */
export function rbZonesAt(arena: RbArena, world: RbWorldState): string[] {
  return arena.zones
    .filter((z) => rbPointInRect(world.x, world.y, z))
    .map((z) => z.id);
}

function refresh(ctx: Ctx): void {
  const w = ctx.world;
  w.distanceCm = rbReadUltrasonic(ctx.arena, w);
  w.colourSeen = rbReadColour(ctx.arena, w);
  w.offRoad = readOffRoad(ctx.arena, w);
  w.timerMs = Math.max(0, ctx.clock.now - ctx.timerBase);
}

// ── Moving ──────────────────────────────────────────────────────────────────

function blocked(ctx: Ctx, x: number, y: number): boolean {
  const r = RB_ROBOT_RADIUS_CM;
  if (
    x < r ||
    y < r ||
    x > ctx.arena.widthCm - r ||
    y > ctx.arena.heightCm - r
  ) {
    return true;
  }
  return ctx.arena.walls.some((w) => rbCircleHitsRect(x, y, r, w));
}

function pushTrail(ctx: Ctx): void {
  const trail = ctx.world.trail;
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(last.x - ctx.world.x, last.y - ctx.world.y) > 1.5) {
    trail.push({ x: ctx.world.x, y: ctx.world.y });
    if (trail.length > MAX_TRAIL) trail.shift();
  }
}

function moveBy(ctx: Ctx, cm: number): boolean {
  const { dx, dy } = rbHeadingVector(ctx.world.heading);
  const nx = ctx.world.x + dx * cm;
  const ny = ctx.world.y + dy * cm;
  if (blocked(ctx, nx, ny)) return false;
  ctx.world.x = nx;
  ctx.world.y = ny;
  ctx.world.travelledCm += Math.abs(cm);
  pushTrail(ctx);
  return true;
}

function bump(ctx: Ctx, id: string): void {
  ctx.world.bumps += 1;
  ctx.report({
    kind: "bumped",
    severity: "warning",
    statementId: id,
    message:
      "The robot ran into something and could not go any further. Check the distance in that block, or turn before you drive.",
  });
}

/**
 * An object standing in front of the sensor is where the robot found it: once
 * the robot drives away or turns, it is no longer in the beam. Without this the
 * book's smart-bin loop would sort the same piece of trash for ever.
 */
function leaveObject(ctx: Ctx): void {
  if (ctx.world.objectCm !== null) ctx.world.objectCm = null;
}

const liveSpeed = (ctx: Ctx): number =>
  clamp(ctx.world.speedPercent, SPEED_FLOOR, 100);

function* drive(
  ctx: Ctx,
  id: string,
  forward: boolean,
  totalCm: number,
  cmPerSec: number,
): Generator<RbTick, void, void> {
  const token = ctx.stopToken;
  const total = Math.max(0, totalCm);
  const speed = Math.max(1, cmPerSec);
  const sign = forward ? 1 : -1;
  ctx.world.motion = forward ? "forward" : "backward";
  leaveObject(ctx);
  let done = 0;
  while (done < total - 1e-6) {
    if (ctx.stopToken !== token) break;
    charge(ctx, id);
    const step = Math.min(DRIVE_STEP_CM, total - done);
    if (!moveBy(ctx, sign * step)) {
      bump(ctx, id);
      break;
    }
    done += step;
    yield { ms: (step / speed) * 1000 * ctx.settings.timeScale, id };
  }
  if (ctx.stopToken === token) ctx.world.motion = null;
}

function* turnBy(
  ctx: Ctx,
  id: string,
  right: boolean,
  degrees: number,
): Generator<RbTick, void, void> {
  const token = ctx.stopToken;
  const total = Math.max(0, Math.abs(degrees));
  const sign = right ? 1 : -1;
  const rate = (liveSpeed(ctx) / 100) * RB_TURN_DEG_PER_SEC;
  ctx.world.motion = right ? "turn-right" : "turn-left";
  leaveObject(ctx);
  let done = 0;
  while (done < total - 1e-6) {
    if (ctx.stopToken !== token) break;
    charge(ctx, id);
    const step = Math.min(TURN_STEP_DEG, total - done);
    ctx.world.heading = rbNormaliseAngle(ctx.world.heading + sign * step);
    ctx.world.turnedDeg += sign * step;
    done += step;
    yield { ms: (step / rate) * 1000 * ctx.settings.timeScale, id };
  }
  if (ctx.stopToken === token) ctx.world.motion = null;
}

/**
 * One encoder motor, for a time. In the window scene the motor is the rolling
 * shutter's engine, so its turns wind the shutter down; anywhere else it is a
 * wheel — EM1 alone swings the robot right, EM2 alone swings it left, and
 * "all" drives it straight.
 */
function* runMotor(
  ctx: Ctx,
  id: string,
  motor: RbMotor,
  power: number,
  seconds: number,
): Generator<RbTick, void, void> {
  const token = ctx.stopToken;
  const p = clamp(power, -100, 100);
  let left = Math.max(0, seconds) * 1000;
  ctx.world.motorRunning = true;
  while (left > 1e-6) {
    if (ctx.stopToken !== token) break;
    charge(ctx, id);
    const slice = Math.min(MOTOR_SLICE_MS, left);
    // Wait out the slice first, and only then count the turns it produced. A
    // `stop encoder motor` that arrives while the motor is running therefore
    // stops it before it has moved anything — which is exactly what Lesson 5
    // means by "stop the rolling shutter immediately".
    yield { ms: slice * ctx.settings.timeScale, id };
    if (ctx.stopToken !== token) break;
    applyMotor(ctx, id, motor, p, slice);
    left -= slice;
  }
  if (ctx.stopToken === token) {
    ctx.world.motorRunning = false;
    ctx.world.motion = null;
  }
}

function applyMotor(
  ctx: Ctx,
  id: string,
  motor: RbMotor,
  power: number,
  sliceMs: number,
): void {
  const rotations = (power / 100) * RB_MOTOR_ROT_PER_SEC * (sliceMs / 1000);
  if (ctx.arena.motorRole === "shutter") {
    ctx.world.shutterTurns = clamp(
      ctx.world.shutterTurns + rotations,
      0,
      RB_SHUTTER_CLOSED_TURNS,
    );
    return;
  }
  if (motor === "all") {
    ctx.world.motion = rotations >= 0 ? "forward" : "backward";
    leaveObject(ctx);
    if (!moveBy(ctx, rotations * RB_CM_PER_ROTATION)) bump(ctx, id);
    return;
  }
  // One wheel turning is a robot swinging round: EM1 is on the left.
  const right = motor === "EM1";
  const degrees =
    rotations * 360 * (RB_CM_PER_ROTATION / (Math.PI * 22)) * (right ? 1 : -1);
  ctx.world.motion = degrees >= 0 ? "turn-right" : "turn-left";
  leaveObject(ctx);
  ctx.world.heading = rbNormaliseAngle(ctx.world.heading + degrees);
  ctx.world.turnedDeg += degrees;
}

// ── Expressions ─────────────────────────────────────────────────────────────

function evalExpr(expr: RbExpr, ctx: Ctx, where: string): RbValue {
  switch (expr.kind) {
    case "num":
      return Number.isFinite(expr.value) ? expr.value : 0;
    case "text":
      return expr.value;

    case "var": {
      const value = ctx.world.variables[expr.name];
      if (value === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: expr.name,
          severity: "error",
          statementId: where,
          message: `I don't know a variable called “${expr.name}” yet. Make it and set it (in the “when 🏳 clicked” script, for example) before you use it. I used 0 this time.`,
        });
        return 0;
      }
      return value;
    }

    case "not":
      return asBool(evalExpr(expr.value, ctx, where)) ? 0 : 1;

    case "ultrasonic":
      return Math.round(ctx.world.distanceCm);

    case "colour-is":
      return ctx.world.colourSeen === expr.colour ? 1 : 0;

    case "colour-name":
      return ctx.world.colourSeen;

    case "light":
      return Math.round(ctx.world.light);

    case "button":
      return ctx.world.buttons[expr.button] ? 1 : 0;

    case "joystick":
      return ctx.world.joystick === expr.direction ? 1 : 0;

    case "timer":
      return Math.round(ctx.world.timerMs / 100) / 10;

    case "binop": {
      if (expr.op === "and") {
        return asBool(evalExpr(expr.left, ctx, where)) &&
          asBool(evalExpr(expr.right, ctx, where))
          ? 1
          : 0;
      }
      if (expr.op === "or") {
        return asBool(evalExpr(expr.left, ctx, where)) ||
          asBool(evalExpr(expr.right, ctx, where))
          ? 1
          : 0;
      }
      const left = evalExpr(expr.left, ctx, where);
      const right = evalExpr(expr.right, ctx, where);

      if (expr.op === "=") {
        if (looksNumeric(left) && looksNumeric(right)) {
          return Math.abs(rbAsNumber(left) - rbAsNumber(right)) < 1e-9 ? 1 : 0;
        }
        return rbAsText(left).trim().toLowerCase() ===
          rbAsText(right).trim().toLowerCase()
          ? 1
          : 0;
      }

      const l = rbAsNumber(left);
      const r = rbAsNumber(right);
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
              kind: "bad-number",
              detail: "divide by 0",
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
      }
      return 0;
    }
  }
}

const evalNumber = (expr: RbExpr, ctx: Ctx, where: string): number =>
  rbAsNumber(evalExpr(expr, ctx, where));

// ── Statements ──────────────────────────────────────────────────────────────

function print(ctx: Ctx, text: string, newline: boolean): void {
  const screen = ctx.world.screen;
  if (newline || screen.length === 0) screen.push(text);
  else screen[screen.length - 1] = `${screen[screen.length - 1]}${text}`;
  ctx.onPrint?.(screen[screen.length - 1], ctx.clock.now);
  while (screen.length > MAX_SCREEN_LINES) screen.shift();
}

function* execBlock(
  body: RbStatement[],
  ctx: Ctx,
): Generator<RbTick, void, void> {
  for (const statement of body) {
    yield* execStatement(statement, ctx);
  }
}

function* execStatement(
  st: RbStatement,
  ctx: Ctx,
): Generator<RbTick, void, void> {
  charge(ctx, st.id);

  switch (st.kind) {
    // ── Chassis ──
    case "move-distance": {
      const cm = Math.abs(evalNumber(st.cm, ctx, st.id));
      yield* drive(
        ctx,
        st.id,
        st.direction === "forward",
        cm,
        rbSpeedCmPerSec(liveSpeed(ctx)),
      );
      return;
    }

    case "move-timed": {
      const rpm = Math.abs(evalNumber(st.rpm, ctx, st.id));
      const secs = Math.max(0, evalNumber(st.secs, ctx, st.id));
      const cmPerSec = Math.max(1, rpm * (RB_CM_PER_ROTATION / 60));
      yield* drive(
        ctx,
        st.id,
        st.direction === "forward",
        cmPerSec * secs,
        cmPerSec,
      );
      return;
    }

    case "move-on": {
      const rpm = Math.abs(evalNumber(st.rpm, ctx, st.id));
      const cmPerSec = Math.max(1, rpm * (RB_CM_PER_ROTATION / 60));
      // "moves forward at 50 RPM" has no end: it keeps the wheels turning while
      // the script goes on with the next block, exactly as the real one does.
      const forward = st.direction === "forward";
      ctx.spawn(`${st.id}:wheels`, () =>
        drive(ctx, st.id, forward, RB_ULTRASONIC_MAX_CM * 4, cmPerSec),
      );
      yield tick(ctx, st.id);
      return;
    }

    case "turn": {
      const degrees = evalNumber(st.degrees, ctx, st.id);
      yield* turnBy(ctx, st.id, st.side === "right", degrees);
      return;
    }

    case "set-speed":
      ctx.world.speedPercent = clamp(
        evalNumber(st.percent, ctx, st.id),
        SPEED_FLOOR,
        100,
      );
      yield tick(ctx, st.id);
      return;

    case "encoder-motor": {
      const power = evalNumber(st.power, ctx, st.id);
      const secs = evalNumber(st.secs, ctx, st.id);
      yield* runMotor(ctx, st.id, st.motor, power, secs);
      return;
    }

    case "encoder-rotate": {
      const degrees = evalNumber(st.degrees, ctx, st.id);
      const rotations = degrees / 360;
      const seconds = Math.abs(rotations) / RB_MOTOR_ROT_PER_SEC;
      yield* runMotor(
        ctx,
        st.id,
        st.motor,
        rotations >= 0 ? 100 : -100,
        seconds,
      );
      return;
    }

    case "stop-motor":
      ctx.stopToken += 1;
      ctx.motorStops += 1;
      ctx.world.motorRunning = false;
      ctx.world.motion = null;
      yield tick(ctx, st.id);
      return;

    // ── Display, LEDs, audio ──
    case "print":
      print(ctx, rbAsText(evalExpr(st.value, ctx, st.id)), st.newline);
      yield tick(ctx, st.id);
      return;

    case "clear-screen":
      ctx.world.screen = [];
      yield tick(ctx, st.id);
      return;

    case "set-print-size":
      ctx.world.printSize = st.size;
      yield tick(ctx, st.id);
      return;

    case "display-leds":
      ctx.world.leds = [0, 1, 2, 3, 4].map(
        (i) => st.colours[i] ?? "off",
      ) as RbLedColour[];
      yield tick(ctx, st.id);
      return;

    case "play-sound":
      ctx.world.sound = st.sound;
      yield {
        ms: Math.max(ctx.settings.statementMs, SOUND_MS * ctx.settings.timeScale),
        id: st.id,
      };
      ctx.world.sound = null;
      return;

    case "play-voice":
      ctx.world.sound = "voice";
      ctx.world.voice = st.text;
      yield {
        ms: Math.max(
          ctx.settings.statementMs,
          SOUND_MS * 2 * ctx.settings.timeScale,
        ),
        id: st.id,
      };
      ctx.world.sound = null;
      return;

    case "start-recording":
      ctx.world.recording = true;
      yield tick(ctx, st.id);
      return;

    case "stop-recording":
      ctx.world.recording = false;
      yield tick(ctx, st.id);
      return;

    case "play-recording":
      ctx.world.sound = "recording";
      yield {
        ms: Math.max(ctx.settings.statementMs, SOUND_MS * ctx.settings.timeScale),
        id: st.id,
      };
      ctx.world.sound = null;
      return;

    // ── Control ──
    case "wait":
      yield {
        ms:
          clamp(evalNumber(st.secs, ctx, st.id), 0, 600) *
          1000 *
          ctx.settings.timeScale,
        id: st.id,
      };
      return;

    case "forever": {
      let laps = 0;
      for (;;) {
        charge(ctx, st.id);
        yield tick(ctx, st.id);
        yield* execBlock(st.body, ctx);
        if (++laps >= MAX_LAPS) {
          throw new RbHalt(
            {
              kind: "too-many-steps",
              limit: MAX_LAPS,
              severity: "error",
              statementId: st.id,
              message:
                "This “forever” loop went round more times than I can count. Add a block inside it that takes some time — a movement, or a “wait 1 seconds”.",
            },
            "step-limit",
          );
        }
      }
    }

    case "repeat": {
      const times = clamp(
        Math.round(evalNumber(st.times, ctx, st.id)),
        0,
        MAX_LAPS,
      );
      for (let i = 0; i < times; i += 1) {
        charge(ctx, st.id);
        yield tick(ctx, st.id);
        yield* execBlock(st.body, ctx);
      }
      return;
    }

    case "if": {
      const taken = asBool(evalExpr(st.cond, ctx, st.id));
      yield tick(ctx, st.id);
      if (taken) yield* execBlock(st.then, ctx);
      else if (st.otherwise) yield* execBlock(st.otherwise, ctx);
      return;
    }

    // ── Variables ──
    case "set-var":
      ctx.world.variables[st.name] = evalExpr(st.value, ctx, st.id);
      yield tick(ctx, st.id);
      return;

    case "change-var": {
      const current = ctx.world.variables[st.name];
      if (current === undefined) {
        ctx.report({
          kind: "unknown-variable",
          name: st.name,
          severity: "error",
          statementId: st.id,
          message: `“${st.name}” has never been set, so there is nothing to change yet. I started it at 0 — try setting it when the mission starts.`,
        });
      }
      ctx.world.variables[st.name] =
        rbAsNumber(current ?? 0) + evalNumber(st.by, ctx, st.id);
      yield tick(ctx, st.id);
      return;
    }

    case "reset-timer":
      ctx.timerBase = ctx.clock.now;
      ctx.world.timerMs = 0;
      yield tick(ctx, st.id);
      return;
  }
}

// ── The scheduler ───────────────────────────────────────────────────────────

interface Task {
  eventId: string;
  gen: Generator<RbTick, void, void>;
  wakeAt: number;
  currentId: string | null;
  done: boolean;
}

interface PendingTimer {
  at: number;
  run: () => void;
}

interface Machine {
  ctx: Ctx;
  tasks: Task[];
  timers: PendingTimer[];
  issues: RbIssue[];
  stopReason: RbStopReason | null;
  finished: boolean;
}

function makeMachine(
  program: RbProgram,
  arena: RbArena,
  settings: Settings,
  setup: RbTrialSetup | undefined,
  onIssue: (issue: RbIssue) => void,
  onPrint: ((text: string, at: number) => void) | null = null,
): Machine {
  const world = initialWorldState(arena);
  if (setup?.start) {
    world.x = setup.start.x;
    world.y = setup.start.y;
    world.heading = setup.start.heading;
    world.trail = [{ x: world.x, y: world.y }];
  }
  if (setup?.light !== undefined) world.light = setup.light;
  if (setup?.objectCm !== undefined) world.objectCm = setup.objectCm;
  if (setup?.objectColour !== undefined) world.objectColour = setup.objectColour;
  world.speedPercent = setup?.speedPercent ?? RB_DEFAULT_SPEED;

  const machine: Machine = {
    tasks: [],
    timers: [],
    issues: [],
    stopReason: null,
    finished: false,
    ctx: null as unknown as Ctx,
  };

  const ctx: Ctx = {
    arena,
    world,
    settings,
    steps: 0,
    clock: { now: 0 },
    timerBase: 0,
    stopToken: 0,
    motorStops: 0,
    onPrint,
    report: (issue) => {
      if (machine.issues.length < MAX_ISSUES) machine.issues.push(issue);
      onIssue(issue);
    },
    spawn: (eventId, body) => {
      machine.tasks.push({
        eventId,
        gen: body(),
        wakeAt: ctx.clock.now,
        currentId: null,
        done: false,
      });
    },
  };
  machine.ctx = ctx;

  world.running = true;
  refresh(ctx);

  for (const script of program.scripts) {
    if (script.kind === "on-launch") {
      ctx.spawn(script.id, () => execBlock(script.body, ctx));
    }
  }
  return machine;
}

function spawnHats(
  machine: Machine,
  program: RbProgram,
  match: (event: RbEvent) => boolean,
): void {
  for (const script of program.scripts) {
    if (!match(script)) continue;
    // A script still busy from the last press ignores this one, instead of
    // stacking copies of itself — the same rule the real CyberPi follows.
    if (machine.tasks.some((t) => t.eventId === script.id)) continue;
    machine.ctx.spawn(script.id, () => execBlock(script.body, machine.ctx));
  }
}

function advanceTask(machine: Machine, task: Task): void {
  const ctx = machine.ctx;
  try {
    const step = task.gen.next();
    if (step.done) {
      task.done = true;
      task.currentId = null;
      return;
    }
    task.currentId = step.value.id;
    task.wakeAt = ctx.clock.now + Math.max(0, step.value.ms);
  } catch (error) {
    if (error instanceof RbHalt) {
      ctx.report(error.issue);
      machine.tasks = [];
      machine.stopReason = error.reason;
      machine.finished = true;
      return;
    }
    task.done = true;
    task.currentId = null;
    ctx.report({
      kind: "crashed",
      detail: error instanceof Error ? error.message : String(error),
      severity: "error",
      message:
        "Something unexpected went wrong while running this mission. Press Reset and try again.",
    });
  }
}

/**
 * Run the machine forward to `targetMs` of virtual time. Returns when it gets
 * there, when nothing is left to do, or when the budget runs out — whichever
 * comes first. This one function drives both the live runtime and the checker.
 */
function pump(
  machine: Machine,
  targetMs: number,
  ops: number,
  deadline: number | null,
  observe: (() => void) | null,
): void {
  const ctx = machine.ctx;
  let budget = ops;

  while (budget > 0) {
    if (deadline !== null && Date.now() > deadline) return;

    let nextWake = Number.POSITIVE_INFINITY;
    for (const task of machine.tasks) {
      if (!task.done && task.wakeAt < nextWake) nextWake = task.wakeAt;
    }
    let nextTimer = Number.POSITIVE_INFINITY;
    for (const timer of machine.timers) {
      if (timer.at < nextTimer) nextTimer = timer.at;
    }

    const next = Math.min(nextWake, nextTimer);
    if (!Number.isFinite(next)) {
      ctx.clock.now = targetMs;
      refresh(ctx);
      machine.finished = true;
      return;
    }
    if (next > targetMs) {
      ctx.clock.now = targetMs;
      refresh(ctx);
      return;
    }

    ctx.clock.now = Math.max(ctx.clock.now, next);

    if (nextTimer <= ctx.clock.now) {
      const due = machine.timers.filter((t) => t.at <= ctx.clock.now);
      machine.timers = machine.timers.filter((t) => t.at > ctx.clock.now);
      for (const timer of due) timer.run();
      refresh(ctx);
      observe?.();
      budget -= 1;
      continue;
    }

    const task = machine.tasks.find(
      (t) => !t.done && t.wakeAt <= ctx.clock.now,
    );
    if (!task) {
      budget -= 1;
      continue;
    }
    advanceTask(machine, task);
    machine.tasks = machine.tasks.filter((t) => !t.done);
    refresh(ctx);
    observe?.();
    budget -= 1;
  }
}

// ── The live runtime ────────────────────────────────────────────────────────

const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
 * Build a runtime for one mission in one arena. Nothing runs until `start()`.
 * The handle is deliberately imperative: a React host subscribes once and lets
 * the scheduler drive, instead of re-rendering a loop into existence.
 */
export function createRuntime(
  program: RbProgram,
  arenaId: RbArenaId,
  opts: RbRuntimeOptions = {},
): RbRuntime {
  const arena = arenaById(arenaId);
  let gear: RbSpeed = opts.speed ?? "normal";
  const sensors: RbTrialSetup = {
    light: opts.light ?? arena.light,
    objectCm: opts.objectCm ?? arena.objectCm,
    objectColour: opts.objectColour ?? arena.objectColour,
  };

  const settings = (): Settings => ({
    statementMs: RB_SPEEDS[gear].statementMs,
    timeScale: RB_SPEEDS[gear].timeScale,
    maxSteps: Math.max(1, opts.maxSteps ?? DEFAULT_MAX_STEPS),
  });

  let machine = makeMachine(program, arena, settings(), sensors, () => {
    cached = null;
  });
  machine.ctx.world.running = false;

  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let originReal = 0;
  let cached: RbRuntimeStatus | null = null;
  const subscribers = new Set<(status: RbRuntimeStatus) => void>();

  const hasWaitingHats = () =>
    program.scripts.some((s) => s.kind !== "on-launch");

  function snapshot(): RbRuntimeStatus {
    if (cached) return cached;
    const w = machine.ctx.world;
    cached = {
      world: {
        ...w,
        trail: w.trail.map((p) => ({ ...p })),
        screen: [...w.screen],
        leds: [...w.leds],
        variables: { ...w.variables },
        buttons: { ...w.buttons },
      },
      arena,
      running,
      idle: running && machine.tasks.length === 0,
      activeIds: machine.tasks
        .map((t) => t.currentId)
        .filter((id): id is string => id !== null),
      steps: machine.ctx.steps,
      issues: machine.issues,
      stopReason: machine.stopReason,
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
    if (!running) return;
    let next = Number.POSITIVE_INFINITY;
    for (const task of machine.tasks) {
      if (!task.done && task.wakeAt < next) next = task.wakeAt;
    }
    for (const t of machine.timers) if (t.at < next) next = t.at;
    if (!Number.isFinite(next)) {
      if (!hasWaitingHats()) finish("finished");
      return;
    }
    const delay = originReal + next - nowMs();
    timer = setTimeout(loop, Math.max(0, Math.min(delay, 1000)));
  }

  function finish(reason: RbStopReason): void {
    clearTimer();
    machine.tasks = [];
    machine.timers = [];
    running = false;
    machine.stopReason = reason;
    machine.ctx.world.running = false;
    machine.ctx.world.motion = null;
    machine.ctx.world.motorRunning = false;
    machine.ctx.world.sound = null;
    cached = null;
  }

  function loop(): void {
    timer = null;
    if (!running) return;
    const target = nowMs() - originReal;
    pump(machine, target, LIVE_OPS, Date.now() + LIVE_MS, null);
    if (running && machine.tasks.length === 0 && !hasWaitingHats()) {
      finish("finished");
    }
    notify();
    schedule();
  }

  /**
   * While the mission is idle — armed, but with no script running — nothing
   * pumps the machine, so its virtual clock stands still. Catch it up with the
   * wall clock before anything is scheduled against it.
   */
  function syncClock(): void {
    if (!running) return;
    machine.ctx.clock.now = Math.max(
      machine.ctx.clock.now,
      nowMs() - originReal,
    );
    refresh(machine.ctx);
  }

  /** A press or a joystick pull: down now, up a quarter of a second later. */
  function pulse(apply: () => void, release: () => void): void {
    if (!running) return;
    syncClock();
    apply();
    machine.timers.push({
      at: machine.ctx.clock.now + PULSE_MS,
      run: release,
    });
    notify();
    schedule();
  }

  function rebuild(): void {
    machine = makeMachine(program, arena, settings(), sensors, () => {
      cached = null;
    });
    machine.ctx.world.running = false;
    cached = null;
  }

  return {
    start() {
      if (running) return;
      clearTimer();
      rebuild();
      if (program.scripts.length === 0) {
        machine.ctx.report({
          kind: "empty-program",
          severity: "warning",
          message:
            "There is nothing to run yet. Drag a “when 🏳 clicked” hat onto the script area and hang some blocks under it.",
        });
        machine.stopReason = "finished";
        notify();
        return;
      }
      running = true;
      machine.ctx.world.running = true;
      originReal = nowMs();
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
      rebuild();
      notify();
    },

    pressButton(button) {
      pulse(
        () => {
          machine.ctx.world.buttons[button] = true;
          spawnHats(
            machine,
            program,
            (e) => e.kind === "on-button" && e.button === button,
          );
        },
        () => {
          machine.ctx.world.buttons[button] = false;
        },
      );
    },

    pullJoystick(direction) {
      pulse(
        () => {
          machine.ctx.world.joystick = direction;
          spawnHats(
            machine,
            program,
            (e) => e.kind === "on-joystick" && e.direction === direction,
          );
        },
        () => {
          machine.ctx.world.joystick = null;
        },
      );
    },

    setLight(percent) {
      syncClock();
      sensors.light = clamp(percent, 0, 100);
      machine.ctx.world.light = sensors.light;
      notify();
      schedule();
    },

    setObject(cm, colour) {
      syncClock();
      sensors.objectCm = cm;
      if (colour) sensors.objectColour = colour;
      machine.ctx.world.objectCm = cm;
      if (colour) machine.ctx.world.objectColour = colour;
      refresh(machine.ctx);
      notify();
      schedule();
    },

    setSpeed(speed) {
      gear = speed;
      machine.ctx.settings.statementMs = RB_SPEEDS[speed].statementMs;
      machine.ctx.settings.timeScale = RB_SPEEDS[speed].timeScale;
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
      machine.tasks = [];
      machine.timers = [];
      subscribers.clear();
    },
  };
}

// ── Running a trial on a virtual clock, for checking ────────────────────────

/**
 * Run a mission through one trial with no timers at all and record everything
 * the robot did. Deterministic: the same program and the same trial always
 * produce the same record, so a check never flickers.
 */
export function simulate(program: RbProgram, trial: RbSimTrial): RbRunRecord {
  const arena = arenaById(trial.arena);
  const settings: Settings = {
    statementMs: SIM_STATEMENT_MS,
    timeScale: 1,
    maxSteps: DEFAULT_MAX_STEPS,
  };
  const issues: string[] = [];
  const printed: { at: number; text: string }[] = [];
  const machine = makeMachine(
    program,
    arena,
    settings,
    trial.setup,
    (issue) => {
      if (issues.length < MAX_ISSUES) issues.push(issue.message);
    },
    (text, at) => {
      printed.push({ at, text });
    },
  );
  const ctx = machine.ctx;

  const record: RbRunRecord = {
    trialId: trial.id,
    arenaId: trial.arena,
    durationMs: trial.durationMs,
    start: { x: ctx.world.x, y: ctx.world.y, heading: ctx.world.heading },
    final: { x: ctx.world.x, y: ctx.world.y, heading: ctx.world.heading },
    travelledCm: 0,
    turnedDeg: 0,
    bumps: 0,
    offRoadMs: 0,
    path: [{ at: 0, x: ctx.world.x, y: ctx.world.y, heading: ctx.world.heading }],
    zoneVisits: [],
    finalZones: [],
    printed,
    finalScreen: [],
    ledFrames: [],
    finalLeds: [...RB_ALL_LEDS_OFF],
    sounds: [],
    voices: [],
    recordings: [],
    variables: [],
    finalVariables: {},
    shutterSamples: [{ at: 0, turns: 0 }],
    finalShutterTurns: 0,
    maxShutterTurns: 0,
    motorStops: 0,
    minDistanceCm: ctx.world.distanceCm,
    issues,
  };

  let lastLeds = ctx.world.leds.join("|");
  let lastSound: string | null = null;
  let lastRecording = false;
  let lastShutter = 0;
  let lastZones = rbZonesAt(arena, ctx.world).join(",");
  let lastPathAt = 0;
  let lastOffRoadAt = 0;
  let wasOffRoad = false;
  const lastVars: Record<string, RbValue> = {};

  const observe = () => {
    const at = ctx.clock.now;
    const w = ctx.world;

    const leds = w.leds.join("|");
    if (leds !== lastLeds) {
      record.ledFrames.push({ at, colours: [...w.leds] });
      lastLeds = leds;
    }

    if (w.sound && w.sound !== lastSound) {
      if (w.sound === "voice") {
        if (w.voice) record.voices.push({ at, text: w.voice });
      } else {
        record.sounds.push({ at, sound: w.sound });
        if (w.sound === "recording") {
          record.recordings.push({ at, event: "play" });
        }
      }
    }
    lastSound = w.sound;

    if (w.recording !== lastRecording) {
      record.recordings.push({ at, event: w.recording ? "start" : "stop" });
      lastRecording = w.recording;
    }

    for (const [name, value] of Object.entries(w.variables)) {
      if (lastVars[name] !== value) {
        lastVars[name] = value;
        record.variables.push({ at, name, value });
      }
    }

    if (Math.abs(w.shutterTurns - lastShutter) > 0.02) {
      record.shutterSamples.push({ at, turns: w.shutterTurns });
      lastShutter = w.shutterTurns;
    }
    record.maxShutterTurns = Math.max(record.maxShutterTurns, w.shutterTurns);

    const zones = rbZonesAt(arena, w);
    const key = zones.join(",");
    if (key !== lastZones) {
      for (const zone of zones) {
        if (!lastZones.split(",").includes(zone)) {
          record.zoneVisits.push({ at, zone });
        }
      }
      lastZones = key;
    }

    if (w.offRoad) {
      if (wasOffRoad) record.offRoadMs += at - lastOffRoadAt;
      wasOffRoad = true;
      lastOffRoadAt = at;
    } else {
      wasOffRoad = false;
    }

    record.minDistanceCm = Math.min(record.minDistanceCm, w.distanceCm);

    if (
      at - lastPathAt > 120 ||
      Math.hypot(
        w.x - record.path[record.path.length - 1].x,
        w.y - record.path[record.path.length - 1].y,
      ) > 2
    ) {
      record.path.push({ at, x: w.x, y: w.y, heading: w.heading });
      lastPathAt = at;
    }
  };

  for (const stimulus of trial.input ?? []) {
    const at = Math.max(0, stimulus.at);
    switch (stimulus.kind) {
      case "press": {
        const button = stimulus.button;
        machine.timers.push({
          at,
          run: () => {
            ctx.world.buttons[button] = true;
            spawnHats(
              machine,
              program,
              (e) => e.kind === "on-button" && e.button === button,
            );
          },
        });
        machine.timers.push({
          at: at + PULSE_MS,
          run: () => {
            ctx.world.buttons[button] = false;
          },
        });
        break;
      }
      case "joystick": {
        const direction = stimulus.direction;
        machine.timers.push({
          at,
          run: () => {
            ctx.world.joystick = direction;
            spawnHats(
              machine,
              program,
              (e) => e.kind === "on-joystick" && e.direction === direction,
            );
          },
        });
        machine.timers.push({
          at: at + PULSE_MS,
          run: () => {
            ctx.world.joystick = null;
          },
        });
        break;
      }
      case "light": {
        const value = clamp(stimulus.value, 0, 100);
        machine.timers.push({
          at,
          run: () => {
            ctx.world.light = value;
          },
        });
        break;
      }
      case "object": {
        const cm = stimulus.cm;
        const colour = stimulus.colour;
        machine.timers.push({
          at,
          run: () => {
            ctx.world.objectCm = cm;
            if (colour) ctx.world.objectColour = colour;
          },
        });
        break;
      }
    }
  }

  pump(machine, trial.durationMs, SIM_OPS, null, observe);

  const w = ctx.world;
  record.final = { x: w.x, y: w.y, heading: w.heading };
  record.travelledCm = w.travelledCm;
  record.turnedDeg = w.turnedDeg;
  record.bumps = w.bumps;
  record.finalZones = rbZonesAt(arena, w);
  record.finalScreen = [...w.screen];
  record.finalLeds = [...w.leds];
  record.finalVariables = { ...w.variables };
  record.finalShutterTurns = w.shutterTurns;
  record.maxShutterTurns = Math.max(record.maxShutterTurns, w.shutterTurns);
  record.motorStops = ctx.motorStops;
  record.path.push({
    at: ctx.clock.now,
    x: w.x,
    y: w.y,
    heading: w.heading,
  });
  return record;
}

/** Run every trial of a check, in order. */
export function simulateAll(
  program: RbProgram,
  trials: readonly RbSimTrial[],
): RbRunRecord[] {
  return trials.map((trial) => simulate(program, trial));
}

// ── The mission in words, for teaching ──────────────────────────────────────

const COLOUR_WORD: Record<RbColour, string> = {
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
  white: "white",
  black: "black",
  none: "no colour",
};

export function describeExpr(expr: RbExpr): string {
  switch (expr.kind) {
    case "num":
      return String(expr.value);
    case "text":
      return `“${expr.value}”`;
    case "var":
      return expr.name;
    case "not":
      return `not ${describeExpr(expr.value)}`;
    case "ultrasonic":
      return "the distance the ultrasonic sensor reads";
    case "colour-is":
      return `the colour sensor sees ${COLOUR_WORD[expr.colour]}`;
    case "colour-name":
      return "the colour the sensor reads";
    case "light":
      return "the ambient light intensity";
    case "button":
      return `button ${expr.button} is pressed`;
    case "joystick":
      return `the joystick is ${RB_JOYSTICK_LABEL[expr.direction]}`;
    case "timer":
      return "the timer, in seconds";
    case "binop": {
      const wrap = (side: RbExpr) =>
        side.kind === "binop" ? `(${describeExpr(side)})` : describeExpr(side);
      const word =
        expr.op === "<"
          ? "is less than"
          : expr.op === ">"
            ? "is more than"
            : expr.op === "="
              ? "is equal to"
              : RB_OP_LABEL[expr.op];
      return `${wrap(expr.left)} ${word} ${wrap(expr.right)}`;
    }
  }
}

export function describeStatement(st: RbStatement): string {
  switch (st.kind) {
    case "move-distance":
      return `move ${st.direction} ${describeExpr(st.cm)} cm, and wait until it is done`;
    case "move-timed":
      return `move ${st.direction} at ${describeExpr(st.rpm)} RPM for ${describeExpr(st.secs)} seconds`;
    case "move-on":
      return `start moving ${st.direction} at ${describeExpr(st.rpm)} RPM`;
    case "turn":
      return `turn ${st.side} ${describeExpr(st.degrees)}°, and wait until it is done`;
    case "set-speed":
      return `set the moving speed to ${describeExpr(st.percent)} %`;
    case "encoder-motor":
      return `run the ${RB_MOTOR_LABEL[st.motor]} motor at ${describeExpr(st.power)} % power for ${describeExpr(st.secs)} seconds`;
    case "encoder-rotate":
      return `turn the ${RB_MOTOR_LABEL[st.motor]} motor by ${describeExpr(st.degrees)}°`;
    case "stop-motor":
      return `stop the ${RB_MOTOR_LABEL[st.motor]} motor`;
    case "print":
      return st.newline
        ? `print ${describeExpr(st.value)} and start a new line`
        : `print ${describeExpr(st.value)}`;
    case "clear-screen":
      return "clear the CyberPi screen";
    case "set-print-size":
      return `set the print size to ${st.size}`;
    case "display-leds":
      return `light the 5 LEDs: ${st.colours.join(", ")}`;
    case "play-sound":
      return `play the sound “${st.sound}” until it is done`;
    case "play-voice":
      return `say “${st.text}”`;
    case "start-recording":
      return "start recording";
    case "stop-recording":
      return "stop recording";
    case "play-recording":
      return "play the recording";
    case "wait":
      return `wait ${describeExpr(st.secs)} seconds`;
    case "forever":
      return "forever, over and over:";
    case "repeat":
      return `repeat ${describeExpr(st.times)} times:`;
    case "if":
      return `if ${describeExpr(st.cond)} then:`;
    case "set-var":
      return `set ${st.name} to ${describeExpr(st.value)}`;
    case "change-var":
      return `change ${st.name} by ${describeExpr(st.by)}`;
    case "reset-timer":
      return "reset the timer to 0";
  }
}

export function describeEvent(event: RbEvent): string {
  switch (event.kind) {
    case "on-launch":
      return "When the green flag is clicked:";
    case "on-button":
      return `When button ${event.button} is pressed:`;
    case "on-joystick":
      return `When the joystick is ${RB_JOYSTICK_LABEL[event.direction]}:`;
  }
}

export interface RbPseudoLine {
  id: string;
  depth: number;
  text: string;
}

function pushStatements(
  body: RbStatement[],
  depth: number,
  out: RbPseudoLine[],
): void {
  for (const st of body) {
    out.push({ id: st.id, depth, text: describeStatement(st) });
    switch (st.kind) {
      case "forever":
      case "repeat":
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

export function describeProgramLines(program: RbProgram): RbPseudoLine[] {
  const out: RbPseudoLine[] = [];
  for (const script of program.scripts) {
    out.push({ id: script.id, depth: 0, text: describeEvent(script) });
    pushStatements(script.body, 1, out);
  }
  return out;
}

/** The mission as readable pseudocode, one line per block. */
export function describeProgram(program: RbProgram): string[] {
  const lines = describeProgramLines(program);
  if (lines.length === 0) {
    return ["This mission is empty — there are no blocks yet."];
  }
  return lines.map((line) => "  ".repeat(line.depth) + line.text);
}

/** How many blocks a mission is made of, counting the ones inside loops. */
export function countBlocks(program: RbProgram): number {
  const walk = (body: RbStatement[]): number =>
    body.reduce((total, st) => {
      let n = 1;
      if (st.kind === "forever" || st.kind === "repeat") n += walk(st.body);
      if (st.kind === "if") {
        n += walk(st.then);
        if (st.otherwise) n += walk(st.otherwise);
      }
      return total + n;
    }, 0);
  return program.scripts.reduce((total, s) => total + walk(s.body), 0);
}
