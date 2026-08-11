"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { clamp, cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  Bot,
  CheckCircle2,
  ChevronDown,
  Eye,
  Gauge,
  GripVertical,
  Keyboard,
  Lightbulb,
  ListRestart,
  Mic,
  Minus,
  MousePointerClick,
  Play,
  Plus,
  Radar,
  Square,
  Sun,
  Trash2,
  TriangleAlert,
  Volume2,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RobotArena } from "./robot-arena";
import {
  checkRun,
  type RbCheckResult,
  type RbExercise,
} from "./exercises";
import {
  countBlocks,
  createRuntime,
  describeEvent,
  describeProgram,
  describeStatement,
  simulateAll,
  type RbIssue,
  type RbRuntime,
  type RbSpeed,
} from "./robot-engine";
import {
  RB_ARENA_ORDER,
  RB_ARENAS,
  RB_BUTTONS,
  RB_CATEGORIES,
  RB_CATEGORY_ORDER,
  RB_COLOUR_HEX,
  RB_COMPARISONS,
  RB_EXPR_CATEGORY,
  RB_JOYSTICK_LABEL,
  RB_LED_COLOURS,
  RB_LED_HEX,
  RB_LOGIC_OPS,
  RB_MATH_OPS,
  RB_MOTORS,
  RB_MOTOR_LABEL,
  RB_OP_LABEL,
  RB_PRINT_SIZES,
  RB_SENSED_COLOURS,
  RB_SOUNDS,
  RB_STATEMENT_CATEGORY,
  RB_ULTRASONIC_MAX_CM,
  arenaById,
  emptyProgram,
  initialWorldState,
  type RbArena,
  type RbArenaId,
  type RbBinOp,
  type RbButton,
  type RbCategory,
  type RbColour,
  type RbEvent,
  type RbExpr,
  type RbJoystick,
  type RbLedColour,
  type RbMotor,
  type RbPrintSize,
  type RbProgram,
  type RbStatement,
  type RbWorldState,
} from "./robot-model";

/**
 * The mBot2 instrument: build a mission out of mBlock blocks on the left, watch
 * the robot drive it in the arena on the right.
 *
 * Two audiences, one component. A teacher puts it on the projector, sets the
 * speed to Slow and points at the live ultrasonic reading to explain *why* the
 * robot stopped where it did. A student builds the book's mission and is judged
 * on what the robot did — reaching the bin, not stopping on the hand, counting
 * ten clients — never on the arrangement of the blocks, because every mission in
 * Chapter 4 has many correct answers.
 *
 * The chapter's model, engine, arena and exercises live in their own files; this
 * one only composes them and owns the block editor.
 */

// ════════════════════════════════════════════════════════════════════════════
// Small shared bits
// ════════════════════════════════════════════════════════════════════════════

const SPEEDS: { id: RbSpeed; label: string; hint: string }[] = [
  {
    id: "slow",
    label: "Slow",
    hint: "One block at a time — slow enough to explain to the class",
  },
  { id: "normal", label: "Normal", hint: "Watch the robot drive" },
  { id: "fast", label: "Fast", hint: "Get to the end of the mission quickly" },
];

/** Fresh ids for blocks a student adds. Only ever called from an event handler. */
let seq = 0;
const nid = (kind: string): string => `rb-${kind}-${(seq += 1)}`;

const num = (value: number): RbExpr => ({ kind: "num", value });
const text = (value: string): RbExpr => ({ kind: "text", value });

/** A faint wash of a category's own colour, for the palette background. */
const tint = (hex: string): string => `${hex}14`;

/**
 * What a block is called out loud. The engine's own sentences are written to be
 * read as a list, so they end in a colon; a screen reader announcing "Move
 * forever, over and over:. Press space" should not have to read that.
 */
const blockName = (stmt: RbStatement): string =>
  describeStatement(stmt).replace(/[:.]\s*$/, "");
const eventName = (event: RbEvent): string =>
  describeEvent(event).replace(/[:.]\s*$/, "");

const COLOUR_WORD: Record<RbColour, string> = {
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
  white: "white",
  black: "black",
  none: "nothing",
};

// ════════════════════════════════════════════════════════════════════════════
// Program surgery — pure, immutable, and never throws
// ════════════════════════════════════════════════════════════════════════════

type Slot = "body" | "then" | "else";
/** Every stack of blocks is addressed as "<ownerId>::<slot>". */
type ContainerKey = string;

const CANVAS_ID = "rb-canvas";
/** Loops inside loops: deep enough for the book, shallow enough to read. */
const MAX_DEPTH = 4;

const ckey = (ownerId: string, slot: Slot): ContainerKey => `${ownerId}::${slot}`;
const ownerOf = (key: ContainerKey): string => key.slice(0, key.indexOf("::"));
const slotOf = (key: ContainerKey): Slot =>
  key.slice(key.indexOf("::") + 2) as Slot;

type RbContainerStatement = Extract<
  RbStatement,
  { kind: "forever" | "repeat" | "if" }
>;

/** Narrow to a C-shaped block, so its inside stacks can be read. */
function asContainer(stmt: RbStatement): RbContainerStatement | null {
  switch (stmt.kind) {
    case "forever":
    case "repeat":
    case "if":
      return stmt;
    default:
      return null;
  }
}

function bodiesOf(stmt: RbStatement): RbStatement[][] {
  switch (stmt.kind) {
    case "forever":
    case "repeat":
      return [stmt.body];
    case "if":
      return stmt.otherwise ? [stmt.then, stmt.otherwise] : [stmt.then];
    default:
      return [];
  }
}

/** Rebuild a hat with a new body — keeps the discriminant concrete for TS. */
function withEventBody(event: RbEvent, body: RbStatement[]): RbEvent {
  switch (event.kind) {
    case "on-launch":
      return { ...event, body };
    case "on-button":
      return { ...event, body };
    case "on-joystick":
      return { ...event, body };
  }
}

/** Apply `fn` to every stack a block owns, leaving other kinds untouched. */
function mapBodies(
  stmt: RbStatement,
  fn: (list: RbStatement[], slot: Slot) => RbStatement[],
): RbStatement {
  switch (stmt.kind) {
    case "forever":
      return { ...stmt, body: fn(stmt.body, "body") };
    case "repeat":
      return { ...stmt, body: fn(stmt.body, "body") };
    case "if":
      return {
        ...stmt,
        then: fn(stmt.then, "then"),
        ...(stmt.otherwise ? { otherwise: fn(stmt.otherwise, "else") } : {}),
      };
    default:
      return stmt;
  }
}

function editList(
  program: RbProgram,
  key: ContainerKey,
  edit: (list: RbStatement[]) => RbStatement[],
): RbProgram {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const here = (stmt: RbStatement): RbStatement => {
    switch (stmt.kind) {
      case "forever":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "repeat":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "if":
        if (slot === "then") return { ...stmt, then: edit(stmt.then) };
        if (slot === "else")
          return { ...stmt, otherwise: edit(stmt.otherwise ?? []) };
        return stmt;
      default:
        return stmt;
    }
  };
  const walk = (list: RbStatement[]): RbStatement[] =>
    list.map((s) => (s.id === owner ? here(s) : mapBodies(s, walk)));
  return {
    scripts: program.scripts.map((script) =>
      script.id === owner && slot === "body"
        ? withEventBody(script, edit(script.body))
        : withEventBody(script, walk(script.body)),
    ),
  };
}

function findStatement(program: RbProgram, id: string): RbStatement | null {
  const box: { value: RbStatement | null } = { value: null };
  const walk = (list: RbStatement[]) => {
    for (const s of list) {
      if (box.value) return;
      if (s.id === id) {
        box.value = s;
        return;
      }
      bodiesOf(s).forEach(walk);
    }
  };
  program.scripts.forEach((script) => walk(script.body));
  return box.value;
}

function getList(program: RbProgram, key: ContainerKey): RbStatement[] | null {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const script = program.scripts.find((s) => s.id === owner);
  if (script) return slot === "body" ? script.body : null;
  const stmt = findStatement(program, owner);
  if (!stmt) return null;
  switch (stmt.kind) {
    case "forever":
    case "repeat":
      return slot === "body" ? stmt.body : null;
    case "if":
      if (slot === "then") return stmt.then;
      if (slot === "else") return stmt.otherwise ?? [];
      return null;
    default:
      return null;
  }
}

const insertStatement = (
  program: RbProgram,
  key: ContainerKey,
  index: number,
  stmt: RbStatement,
): RbProgram =>
  editList(program, key, (list) => [
    ...list.slice(0, index),
    stmt,
    ...list.slice(index),
  ]);

function removeStatement(
  program: RbProgram,
  id: string,
): { program: RbProgram; removed: RbStatement | null } {
  const box: { value: RbStatement | null } = { value: null };
  const walk = (list: RbStatement[]): RbStatement[] => {
    const out: RbStatement[] = [];
    for (const s of list) {
      if (s.id === id) {
        box.value = s;
        continue;
      }
      out.push(mapBodies(s, walk));
    }
    return out;
  };
  const scripts = program.scripts.map((s) => withEventBody(s, walk(s.body)));
  return { program: { scripts }, removed: box.value };
}

const mutateStatement = (
  program: RbProgram,
  id: string,
  fn: (stmt: RbStatement) => RbStatement,
): RbProgram => {
  const walk = (list: RbStatement[]): RbStatement[] =>
    list.map((s) => (s.id === id ? fn(s) : mapBodies(s, walk)));
  return {
    scripts: program.scripts.map((s) => withEventBody(s, walk(s.body))),
  };
};

const mutateEvent = (
  program: RbProgram,
  id: string,
  fn: (event: RbEvent) => RbEvent,
): RbProgram => ({
  scripts: program.scripts.map((s) => (s.id === id ? fn(s) : s)),
});

function collectIds(stmt: RbStatement): string[] {
  const ids = [stmt.id];
  bodiesOf(stmt).forEach((list) =>
    list.forEach((s) => ids.push(...collectIds(s))),
  );
  return ids;
}

interface FlatNode {
  id: string;
  type: "event" | "statement";
  container: ContainerKey | null;
  index: number;
  depth: number;
}

/** Render order of every block, plus how deep each stack sits. */
function flattenProgram(program: RbProgram): {
  nodes: FlatNode[];
  depths: Map<ContainerKey, number>;
} {
  const nodes: FlatNode[] = [];
  const depths = new Map<ContainerKey, number>();
  const walk = (list: RbStatement[], container: ContainerKey, depth: number) => {
    depths.set(container, depth);
    list.forEach((stmt, index) => {
      nodes.push({ id: stmt.id, type: "statement", container, index, depth });
      switch (stmt.kind) {
        case "forever":
        case "repeat":
          walk(stmt.body, ckey(stmt.id, "body"), depth + 1);
          break;
        case "if":
          walk(stmt.then, ckey(stmt.id, "then"), depth + 1);
          if (stmt.otherwise)
            walk(stmt.otherwise, ckey(stmt.id, "else"), depth + 1);
          break;
        default:
          break;
      }
    });
  };
  program.scripts.forEach((script, index) => {
    nodes.push({ id: script.id, type: "event", container: null, index, depth: 0 });
    walk(script.body, ckey(script.id, "body"), 1);
  });
  return { nodes, depths };
}

/** Replace the expression at `path` — ["cond", "left"] walks into a comparison. */
function setInExpr(current: RbExpr, path: string[], next: RbExpr): RbExpr {
  if (path.length === 0) return next;
  const [seg, ...rest] = path;
  if (current.kind === "binop") {
    if (seg === "left")
      return { ...current, left: setInExpr(current.left, rest, next) };
    if (seg === "right")
      return { ...current, right: setInExpr(current.right, rest, next) };
  }
  if (current.kind === "not" && seg === "value") {
    return { ...current, value: setInExpr(current.value, rest, next) };
  }
  return current;
}

function setStatementExpr(
  stmt: RbStatement,
  path: string[],
  next: RbExpr,
): RbStatement {
  const [field, ...rest] = path;
  const at = (current: RbExpr) => setInExpr(current, rest, next);
  switch (stmt.kind) {
    case "move-distance":
      return field === "cm" ? { ...stmt, cm: at(stmt.cm) } : stmt;
    case "move-timed":
      if (field === "rpm") return { ...stmt, rpm: at(stmt.rpm) };
      if (field === "secs") return { ...stmt, secs: at(stmt.secs) };
      return stmt;
    case "move-on":
      return field === "rpm" ? { ...stmt, rpm: at(stmt.rpm) } : stmt;
    case "turn":
      return field === "degrees" ? { ...stmt, degrees: at(stmt.degrees) } : stmt;
    case "set-speed":
      return field === "percent" ? { ...stmt, percent: at(stmt.percent) } : stmt;
    case "encoder-motor":
      if (field === "power") return { ...stmt, power: at(stmt.power) };
      if (field === "secs") return { ...stmt, secs: at(stmt.secs) };
      return stmt;
    case "encoder-rotate":
      return field === "degrees" ? { ...stmt, degrees: at(stmt.degrees) } : stmt;
    case "print":
      return field === "value" ? { ...stmt, value: at(stmt.value) } : stmt;
    case "wait":
      return field === "secs" ? { ...stmt, secs: at(stmt.secs) } : stmt;
    case "repeat":
      return field === "times" ? { ...stmt, times: at(stmt.times) } : stmt;
    case "if":
      return field === "cond" ? { ...stmt, cond: at(stmt.cond) } : stmt;
    case "set-var":
      return field === "value" ? { ...stmt, value: at(stmt.value) } : stmt;
    case "change-var":
      return field === "by" ? { ...stmt, by: at(stmt.by) } : stmt;
    default:
      return stmt;
  }
}

/** Every variable the mission already mentions, in the order it meets them. */
function listVariables(program: RbProgram): string[] {
  const names: string[] = [];
  const add = (name: string) => {
    if (name && !names.includes(name)) names.push(name);
  };
  const fromExpr = (expr: RbExpr) => {
    if (expr.kind === "var") add(expr.name);
    else if (expr.kind === "binop") {
      fromExpr(expr.left);
      fromExpr(expr.right);
    } else if (expr.kind === "not") fromExpr(expr.value);
  };
  const walk = (list: RbStatement[]) => {
    for (const s of list) {
      switch (s.kind) {
        case "set-var":
          add(s.name);
          fromExpr(s.value);
          break;
        case "change-var":
          add(s.name);
          fromExpr(s.by);
          break;
        case "print":
          fromExpr(s.value);
          break;
        case "repeat":
          fromExpr(s.times);
          break;
        case "if":
          fromExpr(s.cond);
          break;
        case "move-distance":
          fromExpr(s.cm);
          break;
        case "wait":
          fromExpr(s.secs);
          break;
        default:
          break;
      }
      bodiesOf(s).forEach(walk);
    }
  };
  program.scripts.forEach((script) => walk(script.body));
  return names;
}

// ════════════════════════════════════════════════════════════════════════════
// The palette, in mBlock's own categories
// ════════════════════════════════════════════════════════════════════════════

type Shape = "hat" | "statement" | "value";

type PaletteEntry =
  | {
      key: string;
      category: RbCategory;
      label: string;
      help: string;
      shape: "hat";
      create: () => RbEvent;
    }
  | {
      key: string;
      category: RbCategory;
      label: string;
      help: string;
      shape: "statement";
      wraps?: boolean;
      create: () => RbStatement;
    }
  | {
      key: string;
      category: RbCategory;
      label: string;
      help: string;
      shape: "value";
      /** True when it answers yes or no, so it can go in an “if”. */
      test?: boolean;
      create: (existing?: RbExpr) => RbExpr;
    };

/**
 * The blocks of Chapter 4, in the words the book prints on them. Only the ones
 * the seven lessons actually need — a Grade 6 palette a student can read
 * through, not the whole of mBlock.
 */
function buildPalette(vars: string[]): Record<RbCategory, PaletteEntry[]> {
  const first = vars[0] ?? "counter";
  return {
    events: [
      {
        key: "on-launch",
        category: "events",
        label: "when 🏳 clicked",
        help: "Starts this mission as soon as you press Run.",
        shape: "hat",
        create: () => ({ id: nid("launch"), kind: "on-launch", body: [] }),
      },
      {
        key: "on-button",
        category: "events",
        label: "when button A pressed",
        help: "Starts this mission when someone presses a button on the CyberPi.",
        shape: "hat",
        create: () => ({
          id: nid("button"),
          kind: "on-button",
          button: "A",
          body: [],
        }),
      },
      {
        key: "on-joystick",
        category: "events",
        label: "when joystick pulled ↑",
        help: "Starts this mission when the joystick is pushed that way.",
        shape: "hat",
        create: () => ({
          id: nid("joy"),
          kind: "on-joystick",
          direction: "up",
          body: [],
        }),
      },
    ],
    control: [
      {
        key: "wait",
        category: "control",
        label: "wait 1 seconds",
        help: "Holds this mission still for a moment.",
        shape: "statement",
        create: () => ({ id: nid("wait"), kind: "wait", secs: num(1) }),
      },
      {
        key: "forever",
        category: "control",
        label: "forever",
        help: "Runs the blocks inside it over and over, without stopping.",
        shape: "statement",
        wraps: true,
        create: () => ({ id: nid("forever"), kind: "forever", body: [] }),
      },
      {
        key: "repeat",
        category: "control",
        label: "repeat 4 times",
        help: "Runs the blocks inside it a number of times, then moves on.",
        shape: "statement",
        wraps: true,
        create: () => ({
          id: nid("repeat"),
          kind: "repeat",
          times: num(4),
          body: [],
        }),
      },
      {
        key: "if",
        category: "control",
        label: "if ⬡ then",
        help: "Asks a question, and only runs the blocks inside when the answer is yes.",
        shape: "statement",
        wraps: true,
        create: () => ({
          id: nid("if"),
          kind: "if",
          cond: { kind: "ultrasonic" },
          then: [],
        }),
      },
    ],
    chassis: [
      {
        key: "move-distance",
        category: "chassis",
        label: "moves forward 70 cm until done",
        help: "Drives a distance in centimetres and waits until it has arrived.",
        shape: "statement",
        create: () => ({
          id: nid("move"),
          kind: "move-distance",
          direction: "forward",
          cm: num(70),
        }),
      },
      {
        key: "move-timed",
        category: "chassis",
        label: "moves forward at 50 RPM for 1 secs",
        help: "Drives for a number of seconds instead of a distance.",
        shape: "statement",
        create: () => ({
          id: nid("movet"),
          kind: "move-timed",
          direction: "forward",
          rpm: num(50),
          secs: num(1),
        }),
      },
      {
        key: "move-on",
        category: "chassis",
        label: "moves forward at 50 RPM",
        help: "Starts the wheels turning and carries straight on to the next block.",
        shape: "statement",
        create: () => ({
          id: nid("moveo"),
          kind: "move-on",
          direction: "forward",
          rpm: num(50),
        }),
      },
      {
        key: "turn",
        category: "chassis",
        label: "turns left 90° until done",
        help: "Turns on the spot, without driving anywhere.",
        shape: "statement",
        create: () => ({
          id: nid("turn"),
          kind: "turn",
          side: "left",
          degrees: num(90),
        }),
      },
      {
        key: "set-speed",
        category: "chassis",
        label: "set moving speed to 50 %",
        help: "How much power every movement block uses.",
        shape: "statement",
        create: () => ({
          id: nid("speed"),
          kind: "set-speed",
          percent: num(50),
        }),
      },
      {
        key: "encoder-motor",
        category: "chassis",
        label: "encoder motor EM1 rotates at 20 power for 1 secs",
        help: "Runs one motor on its own — the rolling shutter's engine.",
        shape: "statement",
        create: () => ({
          id: nid("motor"),
          kind: "encoder-motor",
          motor: "EM1",
          power: num(20),
          secs: num(1),
        }),
      },
      {
        key: "encoder-rotate",
        category: "chassis",
        label: "encoder motor all rotates by 180°",
        help: "Turns a motor by an exact number of degrees.",
        shape: "statement",
        create: () => ({
          id: nid("rot"),
          kind: "encoder-rotate",
          motor: "all",
          degrees: num(180),
        }),
      },
      {
        key: "stop-motor",
        category: "chassis",
        label: "stop encoder motor all",
        help: "Stops a motor straight away, even in the middle of a movement.",
        shape: "statement",
        create: () => ({ id: nid("stop"), kind: "stop-motor", motor: "all" }),
      },
    ],
    shield: [
      {
        key: "ultrasonic",
        category: "shield",
        label: "ultrasonic distance (cm)",
        help: "How far away the nearest thing in front of the robot is.",
        shape: "value",
        create: () => ({ kind: "ultrasonic" }),
      },
      {
        key: "colour-is",
        category: "shield",
        label: "quad rgb sensor sees white?",
        help: "Asks whether the colour sensor is reading one colour. Yes or no.",
        shape: "value",
        test: true,
        create: () => ({ kind: "colour-is", colour: "white" }),
      },
      {
        key: "colour-name",
        category: "shield",
        label: "the colour the sensor reads",
        help: "The colour itself, as a word you can print.",
        shape: "value",
        create: () => ({ kind: "colour-name" }),
      },
    ],
    display: [
      {
        key: "print-line",
        category: "display",
        label: "print ( ) and move to a newline",
        help: "Writes on the CyberPi screen and starts a new line.",
        shape: "statement",
        create: () => ({
          id: nid("print"),
          kind: "print",
          value: text("Hello"),
          newline: true,
        }),
      },
      {
        key: "print",
        category: "display",
        label: "print ( )",
        help: "Writes on the CyberPi screen, carrying on the same line.",
        shape: "statement",
        create: () => ({
          id: nid("print"),
          kind: "print",
          value: text("Hello"),
          newline: false,
        }),
      },
      {
        key: "clear-screen",
        category: "display",
        label: "clear screen",
        help: "Wipes everything off the CyberPi screen.",
        shape: "statement",
        create: () => ({ id: nid("clear"), kind: "clear-screen" }),
      },
      {
        key: "set-print-size",
        category: "display",
        label: "set print size to super big",
        help: "How big the writing on the screen is.",
        shape: "statement",
        create: () => ({
          id: nid("size"),
          kind: "set-print-size",
          size: "super big",
        }),
      },
      {
        key: "display-leds",
        category: "display",
        label: "display ■■■■■",
        help: "Lights the five LEDs on the CyberPi.",
        shape: "statement",
        create: () => ({
          id: nid("leds"),
          kind: "display-leds",
          colours: ["green", "green", "green", "green", "green"],
        }),
      },
    ],
    audio: [
      {
        key: "play-sound",
        category: "audio",
        label: "play sound hi until done",
        help: "Plays one of the CyberPi's own sounds.",
        shape: "statement",
        create: () => ({ id: nid("sound"), kind: "play-sound", sound: "hi" }),
      },
      {
        key: "play-voice",
        category: "audio",
        label: "play voice ( ) until done",
        help: "Says a sentence out loud.",
        shape: "statement",
        create: () => ({
          id: nid("voice"),
          kind: "play-voice",
          text: "Hello, I am mBot2",
        }),
      },
      {
        key: "start-recording",
        category: "audio",
        label: "start recording",
        help: "Starts recording with the CyberPi microphone.",
        shape: "statement",
        create: () => ({ id: nid("rec"), kind: "start-recording" }),
      },
      {
        key: "stop-recording",
        category: "audio",
        label: "stop recording",
        help: "Stops recording and saves what it heard.",
        shape: "statement",
        create: () => ({ id: nid("rec"), kind: "stop-recording" }),
      },
      {
        key: "play-recording",
        category: "audio",
        label: "play recording",
        help: "Plays back the recording.",
        shape: "statement",
        create: () => ({ id: nid("rec"), kind: "play-recording" }),
      },
    ],
    sensing: [
      {
        key: "light",
        category: "sensing",
        label: "ambient light intensity",
        help: "How much light there is around the robot, from 0 to 100 %.",
        shape: "value",
        create: () => ({ kind: "light" }),
      },
      {
        key: "button",
        category: "sensing",
        label: "button A pressed?",
        help: "Asks whether a button on the CyberPi is being held down.",
        shape: "value",
        test: true,
        create: () => ({ kind: "button", button: "A" }),
      },
      {
        key: "joystick",
        category: "sensing",
        label: "joystick pulled ↑?",
        help: "Asks whether the joystick is being pushed that way.",
        shape: "value",
        test: true,
        create: () => ({ kind: "joystick", direction: "up" }),
      },
      {
        key: "timer",
        category: "sensing",
        label: "timer (s)",
        help: "How many seconds have gone by since the timer was reset.",
        shape: "value",
        create: () => ({ kind: "timer" }),
      },
      {
        key: "reset-timer",
        category: "sensing",
        label: "reset timer",
        help: "Puts the timer back to 0 and starts it counting again.",
        shape: "statement",
        create: () => ({ id: nid("timer"), kind: "reset-timer" }),
      },
    ],
    operators: [
      {
        key: "math",
        category: "operators",
        label: "( ) + ( )",
        help: "A calculation: add, take away, times or share.",
        shape: "value",
        create: (existing) => ({
          kind: "binop",
          op: "+",
          left: existing ?? num(0),
          right: num(1),
        }),
      },
      {
        key: "compare",
        category: "operators",
        label: "( ) < ( )",
        help: "Compares two numbers. Answers yes or no.",
        shape: "value",
        test: true,
        create: (existing) => ({
          kind: "binop",
          op: "<",
          left: existing ?? num(0),
          right: num(10),
        }),
      },
      {
        key: "logic",
        category: "operators",
        label: "⬡ and ⬡",
        help: "Joins two questions. Change it to “or” if only one has to be true.",
        shape: "value",
        test: true,
        create: (existing) => ({
          kind: "binop",
          op: "and",
          left: existing ?? { kind: "ultrasonic" },
          right: num(1),
        }),
      },
    ],
    variables: [
      {
        key: "set-var",
        category: "variables",
        label: "set counter to 0",
        help: "Puts a number into a variable — where the robot keeps a count.",
        shape: "statement",
        create: () => ({
          id: nid("setvar"),
          kind: "set-var",
          name: first,
          value: num(0),
        }),
      },
      {
        key: "change-var",
        category: "variables",
        label: "change counter by 1",
        help: "Adds to what is already in the variable.",
        shape: "statement",
        create: () => ({
          id: nid("chvar"),
          kind: "change-var",
          name: first,
          by: num(1),
        }),
      },
      {
        key: "var",
        category: "variables",
        label: "counter",
        help: "The number the variable is holding right now.",
        shape: "value",
        create: () => ({ kind: "var", name: first }),
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Editor context
// ════════════════════════════════════════════════════════════════════════════

type Selection =
  | { kind: "event"; id: string }
  | { kind: "statement"; id: string }
  | { kind: "slot"; container: ContainerKey };

interface FocusedSlot {
  ownerId: string;
  path: string[];
}

interface EditorApi {
  readOnly: boolean;
  vars: string[];
  allows: (category: RbCategory) => boolean;
  activeIds: string[];
  selection: Selection | null;
  select: (selection: Selection | null) => void;
  update: (fn: (program: RbProgram) => RbProgram) => void;
  removeBlock: (id: string) => void;
  moveWithin: (id: string, delta: number) => void;
  setFocusedSlot: (slot: FocusedSlot | null) => void;
  say: (message: string) => void;
  dragShape: Shape | null;
  overId: string | null;
  draggingId: string | null;
}

const EditorCtx = createContext<EditorApi | null>(null);

function useEditor(): EditorApi {
  const ctx = useContext(EditorCtx);
  if (!ctx) throw new Error("Block parts must render inside <MissionEditor>");
  return ctx;
}

// ════════════════════════════════════════════════════════════════════════════
// mBlock geometry — plain rounded blocks with a notch, the way Scratch draws
// ════════════════════════════════════════════════════════════════════════════

const NOTCH_X = 14;
const NOTCH_W = 10;
const NOTCH_D = 4;
/** The rail down the inside of every C-shaped block. */
const RAIL = 14;
const RADIUS = 5;

/** White words on saturated colour — a hair of shadow keeps them crisp. */
const TEXT_SHADOW = "0 1px 1px rgba(11,17,32,0.28)";

/** Booleans are hexagons, so only they look like they fit a question slot. */
const HEX_CLIP =
  "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)";

/** The bump under a block that sits in the dent of the block below it. */
function Nub({ hex, className }: { hex: string; className: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute rounded-b-[3px]", className)}
      style={{ background: hex, left: NOTCH_X, width: NOTCH_W, height: NOTCH_D }}
    />
  );
}

/** An event hat: the wide shallow dome mBlock springs off the left edge. */
function Dome({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 w-24 rounded-t-[999px]"
      style={{ background: hex, height: 16, top: -15 }}
    />
  );
}

function Hexagon({ hex, children }: { hex: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex min-h-8 items-center px-3 py-1">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: hex, clipPath: HEX_CLIP }}
      />
      <span className="relative inline-flex items-center gap-1">{children}</span>
    </span>
  );
}

// ── Inline field atoms ──────────────────────────────────────────────────────

const PILL =
  "inline-flex items-center rounded-full text-[13px] leading-none font-semibold";
const WHITE_PILL = `${PILL} h-6 bg-white px-1.5 text-ink-900 shadow-[0_1px_0_rgba(11,17,32,0.2)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500`;
const DARK_PILL = `${PILL} relative h-6 cursor-pointer gap-1 bg-black/25 pr-1.5 pl-2 text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white`;
const BARE_INPUT =
  "min-w-0 border-0 bg-transparent p-0 font-mono text-[13px] font-semibold text-ink-900 outline-none placeholder:text-ink-300 disabled:text-ink-400";
/**
 * An invisible <select> laid over its pill, grown to a 32px touch target. The
 * element is transparent but its POPUP is not — the browser paints that list
 * with the select's own colours, which would otherwise inherit the white text
 * of the block face and render white on white. So they are pinned here.
 */
const OVERLAY_SELECT =
  "absolute inset-x-0 -inset-y-1 cursor-pointer opacity-0 disabled:cursor-default " +
  "bg-white text-ink-900 [&>option]:bg-white [&>option]:text-ink-900";

function W({ children }: { children: ReactNode }) {
  return (
    <span className="px-0.5 text-[13.5px] leading-none font-semibold whitespace-nowrap text-white">
      {children}
    </span>
  );
}

function NumberField({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
}) {
  const { readOnly } = useEditor();
  // While typing, half-finished text ("" or "-") lives here; otherwise the
  // block itself is the single source of truth.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  return (
    <span className={cn(WHITE_PILL, "px-1")}>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={shown}
        disabled={readOnly}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const n = Number(raw);
          if (raw.trim() !== "" && Number.isFinite(n)) onCommit(n);
        }}
        onBlur={() => setDraft(null)}
        className={cn(
          BARE_INPUT,
          "h-5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
        style={{ width: `calc(${Math.max(1, shown.length)}ch + 0.7rem)` }}
      />
    </span>
  );
}

function TextField({
  value,
  onCommit,
  label,
  width = 8,
}: {
  value: string;
  onCommit: (v: string) => void;
  label: string;
  width?: number;
}) {
  const { readOnly } = useEditor();
  return (
    <span className={cn(WHITE_PILL, "px-2")}>
      <input
        type="text"
        aria-label={label}
        value={value}
        maxLength={60}
        disabled={readOnly}
        onChange={(e) => onCommit(e.target.value)}
        className={cn(BARE_INPUT, "h-5")}
        style={{ width: `calc(${Math.max(width, value.length)}ch + 0.4rem)` }}
      />
    </span>
  );
}

function ChoiceField({
  value,
  options,
  onChange,
  label,
  lead,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  lead?: ReactNode;
}) {
  const { readOnly } = useEditor();
  const current = options.find((o) => o.value === value);
  return (
    <span className={cn(DARK_PILL, readOnly && "cursor-default")}>
      {lead}
      <span className="whitespace-nowrap">{current?.label ?? value}</span>
      <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      <select
        aria-label={label}
        value={value}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={OVERLAY_SELECT}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Pick an existing variable or make a new one, in place. */
function VarField({
  name,
  onChange,
  label,
}: {
  name: string;
  onChange: (name: string) => void;
  label: string;
}) {
  const { vars, readOnly } = useEditor();
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  if (naming && !readOnly) {
    return (
      <span className={cn(WHITE_PILL, "px-2")}>
        <input
          autoFocus
          aria-label="New variable name"
          value={draft}
          placeholder="name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const clean = draft.trim();
              if (clean) onChange(clean);
              setNaming(false);
              setDraft("");
            }
            if (e.key === "Escape") setNaming(false);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const clean = draft.trim();
            if (clean) onChange(clean);
            setNaming(false);
            setDraft("");
          }}
          className={cn(BARE_INPUT, "h-5 w-24")}
        />
      </span>
    );
  }

  const known = vars.includes(name) ? vars : [name, ...vars];
  return (
    <ChoiceField
      value={name}
      label={label}
      options={[
        ...known.map((v) => ({ value: v, label: v })),
        { value: "__new__", label: "New variable…" },
      ]}
      onChange={(v) => {
        if (v === "__new__") setNaming(true);
        else onChange(v);
      }}
    />
  );
}

function ColourDot({ colour }: { colour: RbColour }) {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-full ring-1 ring-white/60"
      style={{ background: RB_COLOUR_HEX[colour] }}
    />
  );
}

// ── Value slots: the round and hexagonal blocks, edited in place ─────────────

function slotKindValue(expr: RbExpr): string {
  switch (expr.kind) {
    case "var":
      return `var:${expr.name}`;
    case "binop":
      if (RB_MATH_OPS.includes(expr.op)) return "math";
      return RB_LOGIC_OPS.includes(expr.op) ? "logic" : "compare";
    default:
      return expr.kind;
  }
}

/**
 * One value inside a block. Rather than dragging reporter blocks around — the
 * part of mBlock that costs a Grade 6 class the most time — what sits in a slot
 * is chosen from the little ▾ beside it, and dropping a palette block on it
 * works too.
 */
function ValueSlot({
  ownerId,
  path,
  expr,
  label,
  test = false,
}: {
  ownerId: string;
  path: string[];
  expr: RbExpr;
  label: string;
  test?: boolean;
}) {
  const { update, vars, allows, readOnly, dragShape, setFocusedSlot } =
    useEditor();
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  const set = (next: RbExpr) =>
    update((p) =>
      mutateStatement(p, ownerId, (s) => setStatementExpr(s, path, next)),
    );

  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${ownerId}:${path.join(".")}`,
    data: { type: "value-slot", ownerId, path },
    disabled: readOnly,
  });

  const options: { value: string; label: string }[] = [
    { value: "num", label: "123  a number" },
    { value: "text", label: "abc  words" },
    ...vars.map((v) => ({ value: `var:${v}`, label: `${v}  (variable)` })),
    ...(allows("shield")
      ? [
          { value: "ultrasonic", label: "ultrasonic distance (cm)" },
          { value: "colour-is", label: "the sensor sees a colour?" },
          { value: "colour-name", label: "the colour it reads" },
        ]
      : []),
    ...(allows("sensing")
      ? [
          { value: "light", label: "ambient light intensity" },
          { value: "button", label: "button pressed?" },
          { value: "joystick", label: "joystick pulled?" },
          { value: "timer", label: "timer (s)" },
        ]
      : []),
    ...(allows("operators")
      ? [
          { value: "compare", label: "compare  (< > =)" },
          { value: "math", label: "calculation  (+ − × ÷)" },
          ...(test ? [{ value: "logic", label: "and / or" }] : []),
        ]
      : []),
    { value: "__new__", label: "New variable…" },
  ];

  const changeKind = (value: string) => {
    switch (value) {
      case "__new__":
        setNaming(true);
        return;
      case "num":
        set(num(expr.kind === "num" ? expr.value : 0));
        return;
      case "text":
        set(text(expr.kind === "text" ? expr.value : ""));
        return;
      case "ultrasonic":
        set({ kind: "ultrasonic" });
        return;
      case "colour-is":
        set({ kind: "colour-is", colour: "white" });
        return;
      case "colour-name":
        set({ kind: "colour-name" });
        return;
      case "light":
        set({ kind: "light" });
        return;
      case "timer":
        set({ kind: "timer" });
        return;
      case "button":
        set({ kind: "button", button: "A" });
        return;
      case "joystick":
        set({ kind: "joystick", direction: "up" });
        return;
      case "compare":
        set({ kind: "binop", op: "<", left: expr, right: num(10) });
        return;
      case "math":
        set({ kind: "binop", op: "+", left: expr, right: num(1) });
        return;
      case "logic":
        set({ kind: "binop", op: "and", left: expr, right: num(1) });
        return;
      default:
        if (value.startsWith("var:")) set({ kind: "var", name: value.slice(4) });
    }
  };

  const category = RB_EXPR_CATEGORY[expr.kind];
  const hex = RB_CATEGORIES[category].hex;
  const isTest =
    expr.kind === "colour-is" ||
    expr.kind === "button" ||
    expr.kind === "joystick" ||
    (expr.kind === "binop" && !RB_MATH_OPS.includes(expr.op));

  const kindSelect = () => (
    <select
      aria-label={`What goes in ${label}`}
      value={slotKindValue(expr)}
      disabled={readOnly}
      onChange={(e) => changeKind(e.target.value)}
      className={OVERLAY_SELECT}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  /** Stands beside a white field or a group, which cannot host the menu itself. */
  const caret = readOnly ? null : (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-black/25 text-white/90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white">
      <ChevronDown className="size-3" aria-hidden />
      {kindSelect()}
    </span>
  );

  /** A reporter block sitting in the slot: its own colour, its own menu. */
  const reporter = (words: ReactNode) => (
    <span
      className="relative inline-flex h-6 items-center gap-1 rounded-full pr-1.5 pl-2.5 text-[13px] leading-none font-semibold whitespace-nowrap text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white"
      style={{ background: hex, textShadow: TEXT_SHADOW }}
    >
      {words}
      {!readOnly && (
        <>
          <ChevronDown className="size-3.5 shrink-0 opacity-85" aria-hidden />
          {kindSelect()}
        </>
      )}
    </span>
  );

  let body: ReactNode = null;
  switch (expr.kind) {
    case "num":
      body = (
        <>
          <NumberField
            value={expr.value}
            label={label}
            onCommit={(n) => set(num(n))}
          />
          {caret}
        </>
      );
      break;
    case "text":
      body = (
        <>
          <TextField
            value={expr.value}
            label={label}
            width={6}
            onCommit={(v) => set(text(v))}
          />
          {caret}
        </>
      );
      break;
    case "var":
      body = reporter(expr.name);
      break;
    case "ultrasonic":
      body = reporter("ultrasonic distance (cm)");
      break;
    case "colour-name":
      body = reporter("the colour the sensor reads");
      break;
    case "light":
      body = reporter("ambient light intensity");
      break;
    case "timer":
      body = reporter("timer (s)");
      break;
    case "colour-is":
      body = (
        <Hexagon hex={hex}>
          <W>quad rgb sensor sees</W>
          <ChoiceField
            value={expr.colour}
            label={`${label} colour`}
            lead={<ColourDot colour={expr.colour} />}
            options={RB_SENSED_COLOURS.map((c) => ({ value: c, label: c }))}
            onChange={(c) => set({ ...expr, colour: c as RbColour })}
          />
          <W>?</W>
          {caret}
        </Hexagon>
      );
      break;
    case "button":
      body = (
        <Hexagon hex={hex}>
          <W>button</W>
          <ChoiceField
            value={expr.button}
            label={`${label} button`}
            options={RB_BUTTONS.map((b) => ({ value: b, label: b }))}
            onChange={(b) => set({ ...expr, button: b as RbButton })}
          />
          <W>pressed?</W>
          {caret}
        </Hexagon>
      );
      break;
    case "joystick":
      body = (
        <Hexagon hex={hex}>
          <W>joystick</W>
          <ChoiceField
            value={expr.direction}
            label={`${label} direction`}
            options={(
              Object.keys(RB_JOYSTICK_LABEL) as RbJoystick[]
            ).map((d) => ({ value: d, label: RB_JOYSTICK_LABEL[d] }))}
            onChange={(d) => set({ ...expr, direction: d as RbJoystick })}
          />
          <W>?</W>
          {caret}
        </Hexagon>
      );
      break;
    case "not":
      body = (
        <Hexagon hex={hex}>
          <W>not</W>
          <ValueSlot
            ownerId={ownerId}
            path={[...path, "value"]}
            expr={expr.value}
            label={`${label} inside`}
            test
          />
          {caret}
        </Hexagon>
      );
      break;
    case "binop": {
      const childTest = RB_LOGIC_OPS.includes(expr.op);
      const opOptions = isTest
        ? [...RB_COMPARISONS, ...RB_LOGIC_OPS]
        : [...RB_MATH_OPS, ...RB_COMPARISONS];
      const parts = (
        <>
          <ValueSlot
            ownerId={ownerId}
            path={[...path, "left"]}
            expr={expr.left}
            label={`${label} left side`}
            test={childTest}
          />
          <ChoiceField
            value={expr.op}
            label={`${label} operator`}
            options={opOptions.map((op) => ({
              value: op,
              label: RB_OP_LABEL[op],
            }))}
            onChange={(op) => set({ ...expr, op: op as RbBinOp })}
          />
          <ValueSlot
            ownerId={ownerId}
            path={[...path, "right"]}
            expr={expr.right}
            label={`${label} right side`}
            test={childTest}
          />
          {caret}
        </>
      );
      body = isTest ? (
        <Hexagon hex={hex}>{parts}</Hexagon>
      ) : (
        <span
          className="relative inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5"
          style={{ background: hex }}
        >
          {parts}
        </span>
      );
      break;
    }
  }

  const live = dragShape === "value";
  return (
    <span
      ref={setNodeRef}
      onFocus={() => setFocusedSlot({ ownerId, path })}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg",
        live && "ring-2 ring-white/60",
        live && isOver && "ring-2 ring-white",
      )}
    >
      {naming ? (
        <span className={cn(WHITE_PILL, "px-2")}>
          <input
            autoFocus
            aria-label="New variable name"
            value={draft}
            placeholder="name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const clean = draft.trim();
                if (clean) set({ kind: "var", name: clean });
                setNaming(false);
                setDraft("");
              }
              if (e.key === "Escape") setNaming(false);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const clean = draft.trim();
              if (clean) set({ kind: "var", name: clean });
              setNaming(false);
              setDraft("");
            }}
            className={cn(BARE_INPUT, "h-5 w-20")}
          />
        </span>
      ) : (
        body
      )}
    </span>
  );
}

// ── The words and fields of each block ──────────────────────────────────────

const DIRECTIONS = [
  { value: "forward", label: "forward" },
  { value: "backward", label: "backward" },
];
const SIDES = [
  { value: "left", label: "left" },
  { value: "right", label: "right" },
];

function LedRow({
  colours,
  onChange,
}: {
  colours: RbLedColour[];
  onChange: (colours: RbLedColour[]) => void;
}) {
  const { readOnly } = useEditor();
  const five = [0, 1, 2, 3, 4].map((i) => colours[i] ?? "off");
  return (
    <span className="inline-flex items-center gap-1">
      {five.map((colour, i) => (
        <span
          key={i}
          className="relative inline-flex size-6 items-center justify-center rounded-md bg-black/25 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white"
        >
          <span
            aria-hidden
            className="size-3.5 rounded-full ring-1 ring-white/40"
            style={{ background: RB_LED_HEX[colour] }}
          />
          <select
            aria-label={`LED ${i + 1} colour`}
            value={colour}
            disabled={readOnly}
            onChange={(e) => {
              const next = [...five];
              next[i] = e.target.value as RbLedColour;
              onChange(next);
            }}
            className={OVERLAY_SELECT}
          >
            {RB_LED_COLOURS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </span>
      ))}
    </span>
  );
}

function StatementFields({ stmt }: { stmt: RbStatement }) {
  const { update } = useEditor();
  const set = (next: RbStatement) =>
    update((p) => mutateStatement(p, stmt.id, () => next));
  const motorOptions = RB_MOTORS.map((m) => ({
    value: m,
    label: RB_MOTOR_LABEL[m],
  }));

  switch (stmt.kind) {
    case "move-distance":
      return (
        <>
          <W>moves</W>
          <ChoiceField
            value={stmt.direction}
            label="which way"
            options={DIRECTIONS}
            onChange={(v) =>
              set({ ...stmt, direction: v as "forward" | "backward" })
            }
          />
          <ValueSlot
            ownerId={stmt.id}
            path={["cm"]}
            expr={stmt.cm}
            label="how many centimetres"
          />
          <W>cm until done</W>
        </>
      );
    case "move-timed":
      return (
        <>
          <W>moves</W>
          <ChoiceField
            value={stmt.direction}
            label="which way"
            options={DIRECTIONS}
            onChange={(v) =>
              set({ ...stmt, direction: v as "forward" | "backward" })
            }
          />
          <W>at</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["rpm"]}
            expr={stmt.rpm}
            label="how many RPM"
          />
          <W>RPM for</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["secs"]}
            expr={stmt.secs}
            label="how many seconds"
          />
          <W>secs</W>
        </>
      );
    case "move-on":
      return (
        <>
          <W>moves</W>
          <ChoiceField
            value={stmt.direction}
            label="which way"
            options={DIRECTIONS}
            onChange={(v) =>
              set({ ...stmt, direction: v as "forward" | "backward" })
            }
          />
          <W>at</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["rpm"]}
            expr={stmt.rpm}
            label="how many RPM"
          />
          <W>RPM</W>
        </>
      );
    case "turn":
      return (
        <>
          <W>turns</W>
          <ChoiceField
            value={stmt.side}
            label="which side"
            options={SIDES}
            onChange={(v) => set({ ...stmt, side: v as "left" | "right" })}
          />
          <ValueSlot
            ownerId={stmt.id}
            path={["degrees"]}
            expr={stmt.degrees}
            label="how many degrees"
          />
          <W>° until done</W>
        </>
      );
    case "set-speed":
      return (
        <>
          <W>set moving speed to</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["percent"]}
            expr={stmt.percent}
            label="speed in per cent"
          />
          <W>%</W>
        </>
      );
    case "encoder-motor":
      return (
        <>
          <W>encoder motor</W>
          <ChoiceField
            value={stmt.motor}
            label="which motor"
            options={motorOptions}
            onChange={(v) => set({ ...stmt, motor: v as RbMotor })}
          />
          <W>rotates at</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["power"]}
            expr={stmt.power}
            label="power in per cent"
          />
          <W>power (%) for</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["secs"]}
            expr={stmt.secs}
            label="how many seconds"
          />
          <W>secs</W>
        </>
      );
    case "encoder-rotate":
      return (
        <>
          <W>encoder motor</W>
          <ChoiceField
            value={stmt.motor}
            label="which motor"
            options={motorOptions}
            onChange={(v) => set({ ...stmt, motor: v as RbMotor })}
          />
          <W>rotates by</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["degrees"]}
            expr={stmt.degrees}
            label="how many degrees"
          />
          <W>°</W>
        </>
      );
    case "stop-motor":
      return (
        <>
          <W>stop encoder motor</W>
          <ChoiceField
            value={stmt.motor}
            label="which motor"
            options={motorOptions}
            onChange={(v) => set({ ...stmt, motor: v as RbMotor })}
          />
        </>
      );
    case "print":
      return (
        <>
          <W>print</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["value"]}
            expr={stmt.value}
            label="what to print"
          />
          {stmt.newline && <W>and move to a newline</W>}
        </>
      );
    case "clear-screen":
      return <W>clear screen</W>;
    case "set-print-size":
      return (
        <>
          <W>set print size to</W>
          <ChoiceField
            value={stmt.size}
            label="print size"
            options={RB_PRINT_SIZES.map((s) => ({ value: s, label: s }))}
            onChange={(v) => set({ ...stmt, size: v as RbPrintSize })}
          />
        </>
      );
    case "display-leds":
      return (
        <>
          <W>display</W>
          <LedRow
            colours={stmt.colours}
            onChange={(colours) => set({ ...stmt, colours })}
          />
        </>
      );
    case "play-sound":
      return (
        <>
          <W>play sound</W>
          <ChoiceField
            value={stmt.sound}
            label="which sound"
            options={RB_SOUNDS.map((s) => ({ value: s, label: s }))}
            onChange={(sound) => set({ ...stmt, sound })}
          />
          <W>until done</W>
        </>
      );
    case "play-voice":
      return (
        <>
          <W>play voice</W>
          <TextField
            value={stmt.text}
            label="what to say"
            width={14}
            onCommit={(t) => set({ ...stmt, text: t })}
          />
          <W>until done</W>
        </>
      );
    case "start-recording":
      return <W>start recording</W>;
    case "stop-recording":
      return <W>stop recording</W>;
    case "play-recording":
      return <W>play recording</W>;
    case "wait":
      return (
        <>
          <W>wait</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["secs"]}
            expr={stmt.secs}
            label="how many seconds"
          />
          <W>seconds</W>
        </>
      );
    case "forever":
      return <W>forever</W>;
    case "repeat":
      return (
        <>
          <W>repeat</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["times"]}
            expr={stmt.times}
            label="how many times"
          />
          <W>times</W>
        </>
      );
    case "if":
      return (
        <>
          <W>if</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["cond"]}
            expr={stmt.cond}
            label="the question"
            test
          />
          <W>then</W>
        </>
      );
    case "set-var":
      return (
        <>
          <W>set</W>
          <VarField
            name={stmt.name}
            label="which variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          <W>to</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["value"]}
            expr={stmt.value}
            label="the new value"
          />
        </>
      );
    case "change-var":
      return (
        <>
          <W>change</W>
          <VarField
            name={stmt.name}
            label="which variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          <W>by</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["by"]}
            expr={stmt.by}
            label="how much to add"
          />
        </>
      );
    case "reset-timer":
      return <W>reset timer</W>;
  }
}

// ── Stacks, blocks and hats ─────────────────────────────────────────────────

function EmptySlot({ containerKey }: { containerKey: ContainerKey }) {
  const { selection, select, readOnly } = useEditor();
  const active =
    selection?.kind === "slot" && selection.container === containerKey;
  if (readOnly) {
    return (
      <p className="px-2 py-1.5 font-mono text-[12px] text-ink-400">(empty)</p>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        select({ kind: "slot", container: containerKey });
      }}
      className={cn(
        "flex min-h-9 w-full min-w-[196px] cursor-pointer items-center gap-2 rounded-[4px] border-2 border-dashed px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-ink-300 bg-white/70 text-ink-400 hover:border-brand-400 hover:text-brand-600",
      )}
    >
      <MousePointerClick className="size-4 shrink-0" aria-hidden />
      {active ? "Now click a block in the palette" : "Drag a block here, or click one"}
    </button>
  );
}

function StackList({
  containerKey,
  items,
  depth,
}: {
  containerKey: ContainerKey;
  items: RbStatement[];
  depth: number;
}) {
  const { dragShape, readOnly } = useEditor();
  const { setNodeRef, isOver } = useDroppable({
    id: `container:${containerKey}`,
    data: { type: "container", container: containerKey, depth },
    disabled: readOnly,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-max",
        dragShape === "statement" &&
          isOver &&
          "outline-2 outline-offset-2 outline-dashed outline-brand-500",
      )}
    >
      <SortableContext
        items={items.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((stmt, index) => (
          <BlockNode
            key={stmt.id}
            stmt={stmt}
            container={containerKey}
            index={index}
            depth={depth}
          />
        ))}
      </SortableContext>
      {items.length === 0 && <EmptySlot containerKey={containerKey} />}
    </div>
  );
}

/**
 * The inside of a C: a rail down the left, then the child stack over the page
 * itself. The cavity is genuinely transparent — that is what makes a nested
 * block read as being *inside* the loop rather than painted on top of it.
 */
function Cavity({
  hex,
  containerKey,
  items,
  depth,
}: {
  hex: string;
  containerKey: ContainerKey;
  items: RbStatement[];
  depth: number;
}) {
  return (
    <div className="flex">
      <span
        aria-hidden
        className="shrink-0"
        style={{ background: hex, width: RAIL }}
      />
      <div className="relative min-w-[196px]">
        {items.length > 0 && <Nub hex={hex} className="top-0" />}
        <StackList containerKey={containerKey} items={items} depth={depth} />
      </div>
    </div>
  );
}

/** Small round controls on a block face: 28px of paint, 32px of target. */
const BLOCK_BUTTON =
  "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/75 transition after:absolute after:-inset-[2px] after:content-[''] hover:bg-black/25 hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent";

function BlockNode({
  stmt,
  container,
  index,
  depth,
}: {
  stmt: RbStatement;
  container: ContainerKey;
  index: number;
  depth: number;
}) {
  const editor = useEditor();
  const cat = RB_CATEGORIES[RB_STATEMENT_CATEGORY[stmt.kind]];
  const shell = asContainer(stmt);
  const words = blockName(stmt);
  const selected =
    editor.selection?.kind === "statement" && editor.selection.id === stmt.id;
  const live = editor.activeIds.includes(stmt.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stmt.id,
    data: { type: "statement", container, index, stmtId: stmt.id },
    disabled: editor.readOnly,
  });

  const dropping =
    editor.dragShape === "statement" &&
    editor.overId === stmt.id &&
    editor.draggingId !== stmt.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? undefined : CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative w-max", isDragging && "opacity-40")}
    >
      {dropping && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[3px] left-0 z-20 h-1.5 w-full rounded-full bg-brand-500 shadow-glow"
        />
      )}
      <div
        {...attributes}
        role="group"
        aria-roledescription="block"
        aria-label={words}
        onClick={(e) => {
          if (e.target === e.currentTarget || !editor.readOnly) {
            editor.select({ kind: "statement", id: stmt.id });
          }
        }}
        className="relative"
      >
        {/* The bar carrying the words — and, for a C-block, the top of the C. */}
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: cat.hex,
              borderRadius: shell
                ? `${RADIUS}px ${RADIUS}px 0 0`
                : `${RADIUS}px`,
            }}
          />
          <div
            className="relative flex min-h-9 items-center gap-1 py-1 pr-1 pl-2.5"
            style={{ textShadow: TEXT_SHADOW }}
          >
            <StatementFields stmt={stmt} />
            {!editor.readOnly && (
              <span className="ml-1 flex shrink-0 items-center">
                <button
                  ref={setActivatorNodeRef}
                  {...listeners}
                  type="button"
                  aria-label={`Move ${words}. Press space, then use the arrow keys`}
                  className={cn(
                    BLOCK_BUTTON,
                    "cursor-grab touch-none active:cursor-grabbing",
                  )}
                >
                  <GripVertical className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${words} up`}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.moveWithin(stmt.id, -1);
                  }}
                  className={BLOCK_BUTTON}
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${words} down`}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.moveWithin(stmt.id, 1);
                  }}
                  className={BLOCK_BUTTON}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${words}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.removeBlock(stmt.id);
                  }}
                  className={BLOCK_BUTTON}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </span>
            )}
          </div>
        </div>

        {shell && (
          <>
            <Cavity
              hex={cat.hex}
              containerKey={ckey(shell.id, shell.kind === "if" ? "then" : "body")}
              items={shell.kind === "if" ? shell.then : shell.body}
              depth={depth + 1}
            />
            {shell.kind === "if" && shell.otherwise && (
              <>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: cat.hex }}
                  />
                  <p
                    className="relative px-3 py-1.5 text-[13.5px] font-semibold text-white"
                    style={{ textShadow: TEXT_SHADOW }}
                  >
                    else
                  </p>
                </div>
                <Cavity
                  hex={cat.hex}
                  containerKey={ckey(shell.id, "else")}
                  items={shell.otherwise}
                  depth={depth + 1}
                />
              </>
            )}
            {/* The lip that closes the C — and, on an if, carries the ⊕. */}
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: cat.hex,
                  borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
                }}
              />
              <div
                className="relative flex items-center px-2"
                style={{ minHeight: shell.kind === "if" ? 28 : RAIL }}
              >
                {shell.kind === "if" && !editor.readOnly && (
                  <ElseToggle stmt={shell} />
                )}
              </div>
            </div>
          </>
        )}

        <Nub hex={cat.hex} className="top-full" />
        {selected && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-[3px] rounded-[8px]"
            style={{
              boxShadow: "inset 0 0 0 2px #ffffff, 0 0 0 2px rgba(11,17,32,0.9)",
            }}
          />
        )}
        {live && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-[3px] rounded-[8px] ring-3 ring-bit-400"
          />
        )}
      </div>
    </div>
  );
}

/** mBlock's circled ⊕ in the bottom lip of an “if”. */
function ElseToggle({ stmt }: { stmt: Extract<RbStatement, { kind: "if" }> }) {
  const { update, say } = useEditor();
  const hasElse = Boolean(stmt.otherwise);
  return (
    <button
      type="button"
      aria-label={hasElse ? "Remove the else part" : "Add an else part"}
      onClick={(e) => {
        e.stopPropagation();
        if (hasElse) {
          // Rebuilt rather than spread-minus-key, so the discriminant stays
          // concrete and the else blocks go with the else part.
          update((p) =>
            mutateStatement(p, stmt.id, () => ({
              id: stmt.id,
              kind: "if",
              cond: stmt.cond,
              then: stmt.then,
            })),
          );
          say("Removed the else part.");
        } else {
          update((p) =>
            mutateStatement(p, stmt.id, () => ({ ...stmt, otherwise: [] })),
          );
          say("Added an else part — those blocks run when the answer is no.");
        }
      }}
      className="relative flex size-5 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/70 after:absolute after:-inset-[6px] after:content-[''] hover:bg-white/40"
    >
      {hasElse ? (
        <Minus className="size-3" aria-hidden />
      ) : (
        <Plus className="size-3" aria-hidden />
      )}
    </button>
  );
}

function EventNode({ event }: { event: RbEvent }) {
  const editor = useEditor();
  const cat = RB_CATEGORIES.events;
  const words = eventName(event);
  const selected =
    editor.selection?.kind === "event" && editor.selection.id === event.id;
  const live = editor.activeIds.includes(event.id);

  return (
    <div
      role="group"
      aria-roledescription="event block"
      aria-label={words}
      onClick={() => editor.select({ kind: "event", id: event.id })}
      // mt-4 leaves room for the dome, which overhangs the block.
      className="animate-fade-up relative mt-4 w-max"
    >
      <div className="relative">
        <Dome hex={cat.hex} />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: cat.hex, borderRadius: `0 ${RADIUS}px 0 0` }}
        />
        <div
          className="relative flex min-h-9 items-center gap-1 py-1 pr-1 pl-3"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {event.kind === "on-launch" && <W>when 🏳 clicked</W>}
          {event.kind === "on-button" && (
            <>
              <W>when button</W>
              <ChoiceField
                value={event.button}
                label="which button"
                options={RB_BUTTONS.map((b) => ({ value: b, label: b }))}
                onChange={(button) =>
                  editor.update((p) =>
                    mutateEvent(p, event.id, (ev) =>
                      ev.kind === "on-button"
                        ? { ...ev, button: button as RbButton }
                        : ev,
                    ),
                  )
                }
              />
              <W>pressed</W>
            </>
          )}
          {event.kind === "on-joystick" && (
            <>
              <W>when joystick</W>
              <ChoiceField
                value={event.direction}
                label="which direction"
                options={(Object.keys(RB_JOYSTICK_LABEL) as RbJoystick[]).map(
                  (d) => ({ value: d, label: RB_JOYSTICK_LABEL[d] }),
                )}
                onChange={(direction) =>
                  editor.update((p) =>
                    mutateEvent(p, event.id, (ev) =>
                      ev.kind === "on-joystick"
                        ? { ...ev, direction: direction as RbJoystick }
                        : ev,
                    ),
                  )
                }
              />
            </>
          )}
          {!editor.readOnly && (
            <span className="ml-2 flex shrink-0">
              <button
                type="button"
                aria-label={`Delete ${words} and everything inside it`}
                onClick={(e) => {
                  e.stopPropagation();
                  editor.removeBlock(event.id);
                }}
                className={BLOCK_BUTTON}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </span>
          )}
        </div>
      </div>
      <Cavity
        hex={cat.hex}
        containerKey={ckey(event.id, "body")}
        items={event.body}
        depth={1}
      />
      <div
        aria-hidden
        style={{
          background: cat.hex,
          height: RAIL,
          borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
        }}
      />
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[3px] rounded-[8px]"
          style={{
            boxShadow: "inset 0 0 0 2px #ffffff, 0 0 0 2px rgba(11,17,32,0.9)",
          }}
        />
      )}
      {live && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[3px] rounded-[8px] ring-3 ring-bit-400"
        />
      )}
    </div>
  );
}

// ── Palette ─────────────────────────────────────────────────────────────────

/** A palette entry drawn as the block it makes — same shape, same colour. */
function MiniBlock({ entry }: { entry: PaletteEntry }) {
  const hex = RB_CATEGORIES[entry.category].hex;
  const words = (
    <span
      className="relative block px-2.5 py-1.5 text-[12.5px] leading-tight font-semibold text-white"
      style={{ textShadow: TEXT_SHADOW }}
    >
      {entry.label}
    </span>
  );

  if (entry.shape === "value" && entry.test) {
    return (
      <span className="relative inline-flex min-h-8 items-center px-3">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: hex, clipPath: HEX_CLIP }}
        />
        <span
          className="relative text-[12.5px] font-semibold text-white"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {entry.label}
        </span>
      </span>
    );
  }

  if (entry.shape === "value") {
    return (
      <span
        className="inline-flex min-h-7 items-center rounded-full px-3 text-[12.5px] font-semibold text-white"
        style={{ background: hex, textShadow: TEXT_SHADOW }}
      >
        {entry.label}
      </span>
    );
  }

  if (entry.shape === "hat") {
    return (
      <span className="relative mt-[15px] block">
        <span className="relative block">
          <Dome hex={hex} />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: hex, borderRadius: `0 ${RADIUS}px 0 0` }}
          />
          {words}
        </span>
        <span
          aria-hidden
          className="block"
          style={{ background: hex, height: 12, width: RAIL }}
        />
        <span
          aria-hidden
          className="block"
          style={{
            background: hex,
            height: 9,
            borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          }}
        />
      </span>
    );
  }

  if (entry.wraps) {
    return (
      <span className="relative block">
        <span className="relative block">
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: hex,
              borderRadius: `${RADIUS}px ${RADIUS}px 0 0`,
            }}
          />
          {words}
        </span>
        <span
          aria-hidden
          className="block"
          style={{ background: hex, height: 14, width: RAIL }}
        />
        <span
          aria-hidden
          className="block"
          style={{
            background: hex,
            height: 9,
            borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          }}
        />
        <Nub hex={hex} className="top-full" />
      </span>
    );
  }

  return (
    <span className="relative block">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: hex, borderRadius: `${RADIUS}px` }}
      />
      {words}
      <Nub hex={hex} className="top-full" />
    </span>
  );
}

function PaletteItem({
  entry,
  onAdd,
}: {
  entry: PaletteEntry;
  onAdd: (entry: PaletteEntry) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${entry.key}`,
    data: { type: "palette", entry },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      title={entry.help}
      aria-label={`${entry.label}. ${entry.help}`}
      onClick={() => onAdd(entry)}
      className={cn(
        "block w-full cursor-grab touch-none rounded-[6px] text-left transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <MiniBlock entry={entry} />
    </button>
  );
}

function Palette({
  categories,
  palette,
  active,
  onSelect,
  onAdd,
}: {
  categories: RbCategory[];
  palette: Record<RbCategory, PaletteEntry[]>;
  active: RbCategory;
  onSelect: (category: RbCategory) => void;
  onAdd: (entry: PaletteEntry) => void;
}) {
  const meta = RB_CATEGORIES[active];
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card lg:w-[278px]">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
        <Blocks className="size-4 text-brand-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold text-ink-900">
            Blocks
          </h3>
          <p className="text-[11px] text-ink-400">Click to add · drag to place</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Block categories"
          className="thin-scroll max-h-[58vh] w-[112px] shrink-0 overflow-y-auto border-r border-ink-100 py-1"
        >
          {categories.map((id) => {
            const cat = RB_CATEGORIES[id];
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex min-h-9 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12.5px] font-semibold transition-colors",
                  on ? "text-white" : "text-ink-700 hover:bg-ink-50",
                )}
                style={on ? { background: cat.hex } : undefined}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-[3px]"
                  style={{ background: on ? "rgba(255,255,255,0.92)" : cat.hex }}
                />
                <span className="min-w-0 truncate">{cat.label}</span>
              </button>
            );
          })}
        </nav>
        <div
          className="thin-scroll max-h-[58vh] min-w-0 flex-1 overflow-auto p-2.5"
          style={{ background: tint(meta.hex) }}
        >
          <div className="flex w-max min-w-full flex-col items-start gap-1.5">
            {palette[active].map((entry) => (
              <PaletteItem key={entry.key} entry={entry} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// The block editor
// ════════════════════════════════════════════════════════════════════════════

const BASE_HINT =
  "Click a block to add it where the blue outline is — or drag it exactly where you want it.";

/** Which drop targets are live for the thing being dragged. */
function acceptsDrag(
  data: Record<string, unknown> | undefined,
  shape: Shape | null,
): boolean {
  if (!data || !shape) return false;
  switch (shape) {
    case "hat":
      return data.type === "canvas";
    case "statement":
      return data.type === "container" || data.type === "statement";
    case "value":
      return data.type === "value-slot";
  }
}

const isContainerId = (id: UniqueIdentifier) =>
  String(id).startsWith("container:");

function MissionEditor({
  program,
  onChange,
  readOnly = false,
  allowed,
  activeIds,
}: {
  program: RbProgram;
  onChange: (program: RbProgram) => void;
  readOnly?: boolean;
  /** Categories this mission offers. Undefined means all of them. */
  allowed?: RbCategory[];
  activeIds: string[];
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<FocusedSlot | null>(null);
  const [dragShape, setDragShape] = useState<Shape | null>(null);
  const [dragEntry, setDragEntry] = useState<PaletteEntry | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [hint, setHint] = useState(BASE_HINT);
  const lastDragEnd = useRef(0);
  const dragShapeRef = useRef<Shape | null>(null);

  const categories = useMemo(
    () =>
      RB_CATEGORY_ORDER.filter((c) => !allowed || allowed.includes(c)),
    [allowed],
  );
  const [chosenCat, setChosenCat] = useState<RbCategory>(
    () => categories[0] ?? "events",
  );
  // A mission that does not offer the chosen category shows its first one
  // instead — derived, so switching missions can never leave an empty palette.
  const activeCat = categories.includes(chosenCat)
    ? chosenCat
    : (categories[0] ?? "events");

  const vars = useMemo(() => listVariables(program), [program]);
  const palette = useMemo(() => buildPalette(vars), [vars]);
  const { nodes: flat, depths } = useMemo(
    () => flattenProgram(program),
    [program],
  );
  const blockCount = countBlocks(program);

  const say = useCallback((message: string) => setHint(message), []);
  const update = useCallback(
    (fn: (p: RbProgram) => RbProgram) => onChange(fn(program)),
    [onChange, program],
  );
  const allows = useCallback(
    (category: RbCategory) => !allowed || allowed.includes(category),
    [allowed],
  );

  /** Where a clicked palette block lands: after the selection, or at the end. */
  const insertionPoint = useCallback((): {
    container: ContainerKey;
    index: number;
  } | null => {
    if (selection?.kind === "slot") {
      const list = getList(program, selection.container);
      if (list) return { container: selection.container, index: list.length };
    }
    if (selection?.kind === "event") {
      const script = program.scripts.find((s) => s.id === selection.id);
      if (script)
        return { container: ckey(script.id, "body"), index: script.body.length };
    }
    if (selection?.kind === "statement") {
      const node = flat.find((n) => n.id === selection.id);
      if (node?.container)
        return { container: node.container, index: node.index + 1 };
    }
    const last = program.scripts[program.scripts.length - 1];
    return last
      ? { container: ckey(last.id, "body"), index: last.body.length }
      : null;
  }, [selection, program, flat]);

  /** A container block, once added, wants the class to fill it. */
  const selectInside = (stmt: RbStatement) => {
    const shell = asContainer(stmt);
    if (shell) {
      setSelection({
        kind: "slot",
        container: ckey(shell.id, shell.kind === "if" ? "then" : "body"),
      });
    } else {
      setSelection({ kind: "statement", id: stmt.id });
    }
  };

  const addEntry = useCallback(
    (entry: PaletteEntry) => {
      if (readOnly) return;
      if (Date.now() - lastDragEnd.current < 200) return; // the click after a drag

      if (entry.shape === "hat") {
        const event = entry.create();
        onChange({ scripts: [...program.scripts, event] });
        setSelection({ kind: "slot", container: ckey(event.id, "body") });
        say(`Added “${entry.label}”. Now click blocks to fill it.`);
        return;
      }

      if (entry.shape === "statement") {
        const target = insertionPoint();
        if (!target) {
          say("Start with a hat block from Events — every mission needs one.");
          return;
        }
        const stmt = entry.create();
        if (
          asContainer(stmt) &&
          (depths.get(target.container) ?? 1) >= MAX_DEPTH
        ) {
          say("That stack is already deeply nested — build this part somewhere shallower.");
          return;
        }
        onChange(insertStatement(program, target.container, target.index, stmt));
        selectInside(stmt);
        say(`Added “${entry.label}”.`);
        return;
      }

      // A reporter or a question fills a slot rather than joining a stack.
      if (entry.test && selection?.kind === "statement") {
        const stmt = findStatement(program, selection.id);
        if (stmt && stmt.kind === "if") {
          onChange(
            mutateStatement(program, stmt.id, (s) =>
              setStatementExpr(s, ["cond"], entry.create(stmt.cond)),
            ),
          );
          say(`Put “${entry.label}” into the question of that “if”.`);
          return;
        }
      }
      if (focusedSlot) {
        const owner = findStatement(program, focusedSlot.ownerId);
        if (owner) {
          onChange(
            mutateStatement(program, focusedSlot.ownerId, (s) =>
              setStatementExpr(s, focusedSlot.path, entry.create()),
            ),
          );
          say(`Put “${entry.label}” into the slot you last used.`);
          return;
        }
      }
      say("Click a slot inside a block first, then click this one to drop it in.");
    },
    [
      readOnly,
      program,
      onChange,
      insertionPoint,
      depths,
      selection,
      focusedSlot,
      say,
    ],
  );

  const removeBlock = useCallback(
    (id: string) => {
      if (readOnly) return;
      const node = flat.find((n) => n.id === id);
      if (!node) return;
      if (node.type === "event") {
        onChange({ scripts: program.scripts.filter((s) => s.id !== id) });
        say("Deleted the hat block and everything inside it.");
      } else {
        onChange(removeStatement(program, id).program);
        say("Deleted the block.");
      }
      setSelection(null);
    },
    [readOnly, flat, program, onChange, say],
  );

  const moveWithin = useCallback(
    (id: string, delta: number) => {
      if (readOnly) return;
      const node = flat.find((n) => n.id === id);
      if (!node?.container) return;
      const list = getList(program, node.container);
      if (!list) return;
      const to = node.index + delta;
      if (to < 0 || to >= list.length) {
        say("That block is already at the end of its stack.");
        return;
      }
      onChange(
        editList(program, node.container, (l) => arrayMove(l, node.index, to)),
      );
      say(`Moved the block ${delta > 0 ? "down" : "up"}.`);
    },
    [readOnly, flat, program, onChange, say],
  );

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Only the targets this drag can land on, precise ones before their stack. */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const liveTargets = args.droppableContainers.filter((c) =>
      acceptsDrag(c.data.current, dragShapeRef.current),
    );
    if (liveTargets.length === 0) return [];
    const scoped = { ...args, droppableContainers: liveTargets };
    const pointer = pointerWithin(scoped);
    const hits = pointer.length > 0 ? pointer : rectIntersection(scoped);
    if (hits.length === 0) return hits;
    const precise = hits.filter(
      (h) => !isContainerId(h.id) && h.id !== CANVAS_ID,
    );
    if (precise.length > 0) return precise;
    const stacks = hits.filter((h) => isContainerId(h.id));
    if (stacks.length > 0) {
      const area = (id: UniqueIdentifier) => {
        const rect = args.droppableRects.get(id);
        return rect ? rect.width * rect.height : Number.MAX_SAFE_INTEGER;
      };
      return [stacks.reduce((best, c) => (area(c.id) < area(best.id) ? c : best))];
    }
    return hits;
  }, []);

  const { setNodeRef: setCanvasRef, isOver: canvasOver } = useDroppable({
    id: CANVAS_ID,
    data: { type: "canvas" },
    disabled: readOnly,
  });

  const clearDrag = () => {
    dragShapeRef.current = null;
    setDraggingId(null);
    setOverId(null);
    setDragShape(null);
    setDragEntry(null);
    lastDragEnd.current = Date.now();
  };

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    setDraggingId(String(e.active.id));
    const entry =
      data?.type === "palette" ? (data.entry as PaletteEntry) : null;
    // The ref, not the state, is what collision detection reads — it has to be
    // right on the very first move, before React has re-rendered.
    dragShapeRef.current = entry ? entry.shape : "statement";
    setDragEntry(entry);
    setDragShape(dragShapeRef.current);
  };

  const onDragOver = (e: DragOverEvent) =>
    setOverId(e.over ? String(e.over.id) : null);

  const targetOf = (
    data: Record<string, unknown> | undefined,
  ): { container: ContainerKey; index: number } | null => {
    if (!data) return null;
    if (data.type === "statement")
      return {
        container: data.container as ContainerKey,
        index: data.index as number,
      };
    if (data.type === "container") {
      const container = data.container as ContainerKey;
      return { container, index: getList(program, container)?.length ?? 0 };
    }
    return null;
  };

  const onDragEnd = (e: DragEndEvent) => {
    const active = e.active.data.current;
    const over = e.over?.data.current;
    clearDrag();
    if (readOnly || !e.over || !active || !over) return;

    // 1 — a new block from the palette
    if (active.type === "palette") {
      const entry = active.entry as PaletteEntry;

      if (entry.shape === "hat") {
        const event = entry.create();
        onChange({ scripts: [...program.scripts, event] });
        setSelection({ kind: "slot", container: ckey(event.id, "body") });
        say(`Added “${entry.label}”.`);
        return;
      }
      if (entry.shape === "statement") {
        const target = targetOf(over);
        if (!target) return;
        const stmt = entry.create();
        if (
          asContainer(stmt) &&
          (depths.get(target.container) ?? 1) >= MAX_DEPTH
        ) {
          say("That stack is already deeply nested — try a shallower place.");
          return;
        }
        onChange(insertStatement(program, target.container, target.index, stmt));
        selectInside(stmt);
        say(`Added “${entry.label}”.`);
        return;
      }
      if (over.type === "value-slot") {
        const ownerId = over.ownerId as string;
        const path = over.path as string[];
        const owner = findStatement(program, ownerId);
        if (!owner) return;
        onChange(
          mutateStatement(program, ownerId, (s) =>
            setStatementExpr(s, path, entry.create()),
          ),
        );
        say(`Dropped “${entry.label}” into the block.`);
      }
      return;
    }

    // 2 — moving a block that is already in the mission
    if (active.type === "statement") {
      const stmtId = active.stmtId as string;
      const from = active.container as ContainerKey;
      const fromIndex = active.index as number;
      const target = targetOf(over);
      if (!target) return;

      if (target.container === from) {
        const list = getList(program, from) ?? [];
        const to =
          over.type === "statement" ? (over.index as number) : list.length - 1;
        if (to === fromIndex) return;
        onChange(editList(program, from, (l) => arrayMove(l, fromIndex, to)));
        say("Moved the block.");
        return;
      }

      const moving = findStatement(program, stmtId);
      if (!moving) return;
      if (collectIds(moving).includes(ownerOf(target.container))) {
        say("A block cannot be dropped inside itself.");
        return;
      }
      if (asContainer(moving) && (depths.get(target.container) ?? 1) >= MAX_DEPTH) {
        say("That stack is already deeply nested — try a shallower place.");
        return;
      }
      const { program: without, removed } = removeStatement(program, stmtId);
      if (!removed) return;
      onChange(insertStatement(without, target.container, target.index, removed));
      setSelection({ kind: "statement", id: stmtId });
      say("Moved the block into another stack.");
    }
  };

  const api: EditorApi = {
    readOnly,
    vars,
    allows,
    activeIds,
    selection,
    select: setSelection,
    update,
    removeBlock,
    moveWithin,
    setFocusedSlot,
    say,
    dragShape,
    overId,
    draggingId,
  };

  const draggedStatement =
    dragShape === "statement" && draggingId
      ? findStatement(program, draggingId)
      : null;

  return (
    <DndContext
      // Fixed id — dnd-kit otherwise numbers its aria ids from a module counter,
      // which drifts between the prerendered HTML and the client.
      id="rb-block-editor"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
      <EditorCtx.Provider value={api}>
        <div className="flex flex-col gap-3 lg:flex-row">
          {!readOnly && (
            <Palette
              categories={categories}
              palette={palette}
              active={activeCat}
              onSelect={setChosenCat}
              onAdd={addEntry}
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-900 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
                  mBlock
                </p>
                <h3 className="font-display text-[15px] font-semibold text-white">
                  My mission
                </h3>
              </div>
              <div className="hidden max-w-[45%] flex-wrap items-center justify-end gap-1 sm:flex">
                {vars.map((name) => (
                  <Chip key={name} tone="coral">
                    {name}
                  </Chip>
                ))}
              </div>
              <Chip tone="ink">
                {blockCount} {blockCount === 1 ? "block" : "blocks"}
              </Chip>
            </div>

            {/* Blocks keep their natural width; at 375px the canvas scrolls
                sideways rather than squashing them out of shape. */}
            <div
              ref={setCanvasRef}
              className={cn(
                "thin-scroll max-h-[58vh] min-h-72 flex-1 overflow-auto bg-ink-50 p-4 pt-1",
                "[background-image:radial-gradient(var(--color-ink-200)_1px,transparent_1px)] [background-size:18px_18px]",
                canvasOver && "ring-2 ring-brand-500 ring-inset",
              )}
            >
              {program.scripts.length === 0 ? (
                <div className="mt-3 flex h-full min-h-56 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-ink-300 bg-white/70 p-6 text-center">
                  <Bot className="size-7 text-ink-300" aria-hidden />
                  <p className="max-w-sm text-[14px] text-ink-500">
                    Every mBot2 mission starts with a hat block. Click one from{" "}
                    <span className="font-semibold text-ink-700">Events</span> —
                    or drag it here.
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap items-start justify-center gap-3">
                      {palette.events.map((entry) => (
                        <button
                          key={entry.key}
                          type="button"
                          onClick={() => addEntry(entry)}
                          className="w-[142px] cursor-pointer transition-transform hover:-translate-y-px"
                        >
                          <MiniBlock entry={entry} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                program.scripts.map((event) => (
                  <EventNode key={event.id} event={event} />
                ))
              )}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 border-t border-ink-100 px-4 py-2 text-[12.5px] text-ink-500"
            >
              <Keyboard className="size-3.5 shrink-0 text-ink-300" aria-hidden />
              <span className="min-w-0 flex-1">
                {readOnly ? "The mission is running — press Stop to change it." : hint}
              </span>
            </p>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragEntry && (
            <span className="block w-[176px] drop-shadow-lg">
              <MiniBlock entry={dragEntry} />
            </span>
          )}
          {draggedStatement && (
            <span
              className="inline-flex min-h-8 items-center rounded-[5px] px-2.5 text-[13.5px] font-semibold whitespace-nowrap text-white shadow-pop"
              style={{
                background:
                  RB_CATEGORIES[RB_STATEMENT_CATEGORY[draggedStatement.kind]].hex,
                textShadow: TEXT_SHADOW,
              }}
            >
              {blockName(draggedStatement)}
            </span>
          )}
        </DragOverlay>
      </EditorCtx.Provider>
    </DndContext>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// The robot's side of the studio
// ════════════════════════════════════════════════════════════════════════════

/**
 * The live ultrasonic reading, big enough to point at from the back of the
 * room. When a mission stops in a strange place, this is the number that
 * explains it.
 */
function DistanceGauge({
  world,
  running,
}: {
  world: RbWorldState;
  running: boolean;
}) {
  const reading = Math.round(world.distanceCm);
  const far = reading >= RB_ULTRASONIC_MAX_CM;
  /** The interesting range is 0–100 cm; beyond that the bar is simply full. */
  const fill = clamp((reading / 100) * 100, 0, 100);
  const close = !far && reading < 10;
  const near = !far && reading < 30;

  const sentence = far
    ? "Nothing in front of it — the sensor reports “far”."
    : close
      ? `Something is very close: ${reading} cm. Under 10 cm is what the book calls “detected”.`
      : near
        ? `Something is close: ${reading} cm. Under 30 cm is close enough to sort or to stop.`
        : `The nearest thing in front is ${reading} cm away.`;

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-3 py-2.5 transition-colors",
        close
          ? "border-coral-500 bg-coral-100"
          : near
            ? "border-amber-500 bg-amber-100"
            : "border-signal-200 bg-signal-50",
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Radar
          className={cn(
            "size-4 shrink-0 self-center",
            close ? "text-coral-700" : near ? "text-amber-700" : "text-signal-600",
          )}
          aria-hidden
        />
        <span className="font-mono text-[10px] tracking-[0.16em] text-ink-500 uppercase">
          Ultrasonic
        </span>
        <span className="ml-auto flex items-baseline gap-1">
          <span
            className={cn(
              "tnum font-display text-[30px] leading-none font-black",
              close
                ? "text-coral-700"
                : near
                  ? "text-amber-700"
                  : "text-signal-700",
            )}
          >
            {far ? "far" : reading}
          </span>
          {!far && (
            <span className="text-[13px] font-bold text-ink-500">cm</span>
          )}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-ink-200"
        role="img"
        aria-label={sentence}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100",
            close ? "bg-coral-500" : near ? "bg-amber-500" : "bg-signal-500",
          )}
          style={{ width: `${far ? 100 : fill}%` }}
        />
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-ink-700">
        {sentence}
        {!running && " Press Run and watch it change."}
      </p>
    </div>
  );
}

const SCREEN_SIZE: Record<RbPrintSize, string> = {
  small: "text-[11px]",
  medium: "text-[13px]",
  big: "text-[17px]",
  "super big": "text-[22px]",
};

function CyberPi({ world, arena }: { world: RbWorldState; arena: RbArena }) {
  const lines = world.screen.slice(-6);
  const variables = Object.entries(world.variables);
  const shutterPercent = Math.round((world.shutterTurns / 2) * 100);
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.16em] text-ink-400 uppercase">
          CyberPi
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => {
            const colour = world.leds[i] ?? "off";
            return (
              <span
                key={i}
                aria-hidden
                className="size-3.5 rounded-full ring-1 ring-ink-900/20"
                style={{
                  background: RB_LED_HEX[colour],
                  boxShadow:
                    colour === "off" ? undefined : `0 0 7px ${RB_LED_HEX[colour]}`,
                }}
              />
            );
          })}
          <span className="sr-only">
            {world.leds.every((c) => c === "off")
              ? "The five LEDs are off."
              : `The five LEDs are ${world.leds.join(", ")}.`}
          </span>
        </span>
      </div>

      <div className="thin-scroll mt-2 max-h-32 min-h-[68px] overflow-auto rounded-md bg-ink-900 px-3 py-2">
        {lines.length === 0 ? (
          <p className="font-mono text-[11.5px] text-ink-500">
            the screen is empty
          </p>
        ) : (
          lines.map((line, i) => (
            <p
              key={i}
              className={cn(
                "font-mono leading-tight font-bold break-words text-signal-200",
                SCREEN_SIZE[world.printSize],
              )}
            >
              {line}
            </p>
          ))
        )}
      </div>

      {(world.sound || world.voice || world.recording || variables.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {world.recording && (
            <Chip tone="coral" icon={<Mic />}>
              recording
            </Chip>
          )}
          {world.sound && world.sound !== "voice" && (
            <Chip tone="violet" icon={<Volume2 />}>
              {world.sound}
            </Chip>
          )}
          {world.voice && (
            <Chip tone="violet" icon={<Volume2 />}>
              “{world.voice}”
            </Chip>
          )}
          {variables.map(([name, value]) => (
            <Chip key={name} tone="brand">
              {name} = {String(value)}
            </Chip>
          ))}
        </div>
      )}

      {arena.motorRole === "shutter" && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-semibold text-ink-600">
              Rolling shutter
            </span>
            <span className="tnum text-[12px] font-bold text-ink-800">
              {shutterPercent} % closed
            </span>
          </div>
          <div
            className="mt-1 h-4 overflow-hidden rounded-sm bg-signal-100 ring-1 ring-ink-200"
            role="img"
            aria-label={`The rolling shutter is ${shutterPercent} per cent closed.`}
          >
            <div
              className="h-full bg-ink-600 transition-[width] duration-100"
              style={{ width: `${shutterPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const JOYSTICK_KEYS: { direction: RbJoystick; glyph: string; cell: string }[] = [
  { direction: "up", glyph: "↑", cell: "col-start-2 row-start-1" },
  { direction: "left", glyph: "←", cell: "col-start-1 row-start-2" },
  { direction: "middle", glyph: "●", cell: "col-start-2 row-start-2" },
  { direction: "right", glyph: "→", cell: "col-start-3 row-start-2" },
  { direction: "down", glyph: "↓", cell: "col-start-2 row-start-3" },
];

const HAND_CONTROL =
  "flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-ink-200 bg-white text-[14px] font-bold text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100 disabled:cursor-default disabled:opacity-45 disabled:hover:border-ink-200 disabled:hover:bg-white disabled:hover:text-ink-700";

/** Everything a person can do to the robot while it is running. */
function WorldControls({
  running,
  light,
  onLight,
  objectCm,
  objectColour,
  onObject,
  onButton,
  onJoystick,
}: {
  running: boolean;
  light: number;
  onLight: (value: number) => void;
  objectCm: number | null;
  objectColour: RbColour;
  onObject: (cm: number | null, colour: RbColour) => void;
  onButton: (button: RbButton) => void;
  onJoystick: (direction: RbJoystick) => void;
}) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-3">
      <p className="font-mono text-[10px] tracking-[0.16em] text-ink-400 uppercase">
        You are the world
      </p>

      <div className="mt-2 flex flex-wrap items-start gap-4">
        <div>
          <p className="mb-1 text-[12px] font-semibold text-ink-600">Buttons</p>
          <div className="flex gap-1.5">
            {RB_BUTTONS.map((b) => (
              <button
                key={b}
                type="button"
                disabled={!running}
                onClick={() => onButton(b)}
                title={running ? undefined : "Press Run first"}
                aria-label={`Press button ${b} on the CyberPi`}
                className={cn(HAND_CONTROL, "w-11")}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[12px] font-semibold text-ink-600">Joystick</p>
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            {JOYSTICK_KEYS.map((key) => (
              <button
                key={key.direction}
                type="button"
                disabled={!running}
                onClick={() => onJoystick(key.direction)}
                title={running ? undefined : "Press Run first"}
                aria-label={`Joystick ${RB_JOYSTICK_LABEL[key.direction]}`}
                className={cn(HAND_CONTROL, "size-9 min-h-0", key.cell)}
              >
                {key.glyph}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-600">
          <Sun className="size-3.5 text-amber-500" aria-hidden />
          Ambient light
          <span className="tnum ml-auto font-bold text-ink-800">{light} %</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={light}
          aria-label="Ambient light intensity, in per cent"
          onChange={(e) => onLight(Number(e.target.value))}
          className="mt-1 w-full accent-amber-500"
        />
      </label>

      <div className="mt-3 border-t border-ink-100 pt-2.5">
        <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-600">
          <input
            type="checkbox"
            checked={objectCm !== null}
            onChange={(e) => onObject(e.target.checked ? 20 : null, objectColour)}
            className="size-4 accent-brand-600"
          />
          Put something in front of the sensor
        </label>
        {objectCm !== null && (
          <div className="mt-2 space-y-2">
            <label className="block">
              <span className="flex items-center gap-1.5 text-[12px] text-ink-600">
                How far away
                <span className="tnum ml-auto font-bold text-ink-800">
                  {objectCm} cm
                </span>
              </span>
              <input
                type="range"
                min={2}
                max={60}
                step={1}
                value={objectCm}
                aria-label="How far in front of the sensor, in centimetres"
                onChange={(e) => onObject(Number(e.target.value), objectColour)}
                className="mt-1 w-full accent-signal-500"
              />
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] text-ink-600">Its colour</span>
              {RB_SENSED_COLOURS.map((colour) => (
                <button
                  key={colour}
                  type="button"
                  aria-pressed={colour === objectColour}
                  aria-label={`Make it ${COLOUR_WORD[colour]}`}
                  onClick={() => onObject(objectCm, colour)}
                  className={cn(
                    "size-6 cursor-pointer rounded-full ring-1 ring-ink-300 transition-transform hover:scale-110",
                    colour === objectColour &&
                      "ring-2 ring-ink-900 ring-offset-2",
                  )}
                  style={{ background: RB_COLOUR_HEX[colour] }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// The studio
// ════════════════════════════════════════════════════════════════════════════

type Verdict =
  | { kind: "result"; result: RbCheckResult }
  | { kind: "error"; message: string };

export function MbotStudio({
  exercise,
  onSolved,
  className,
}: {
  /** When present, the studio runs in exercise mode with checking. */
  exercise?: RbExercise;
  onSolved?: () => void;
  className?: string;
}) {
  const [program, setProgram] = useState<RbProgram>(
    () => exercise?.starter ?? emptyProgram(),
  );
  const [arenaId, setArenaId] = useState<RbArenaId>(
    () => exercise?.arena ?? "bench",
  );
  const [world, setWorld] = useState<RbWorldState>(() =>
    initialWorldState(arenaById(exercise?.arena ?? "bench")),
  );
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<RbIssue[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [speed, setSpeed] = useState<RbSpeed>("normal");
  const [light, setLight] = useState<number>(
    () => arenaById(exercise?.arena ?? "bench").light,
  );
  const [objectCm, setObjectCm] = useState<number | null>(null);
  const [objectColour, setObjectColour] = useState<RbColour>("white");
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  /** onSolved is announced once, the first time every trial passes. */
  const [solved, setSolved] = useState(false);

  const runtimeRef = useRef<RbRuntime | null>(null);

  // A different mission arriving from a deep link resets the whole studio.
  const [loadedId, setLoadedId] = useState<string | null>(exercise?.id ?? null);
  if ((exercise?.id ?? null) !== loadedId) {
    const nextArena = exercise?.arena ?? "bench";
    setLoadedId(exercise?.id ?? null);
    setProgram(exercise?.starter ?? emptyProgram());
    setArenaId(nextArena);
    setLight(arenaById(nextArena).light);
    setObjectCm(null);
    setObjectColour("white");
    setVerdict(null);
    setHintsShown(0);
    setShowSolution(false);
    setSolved(false);
  }

  const arena = arenaById(world.arenaId);

  // One runtime per mission and arena; tearing it down is what makes Stop
  // instant, even in the middle of a 70 cm drive.
  useEffect(() => {
    const runtime = createRuntime(program, arenaId, { speed: "normal" });
    runtimeRef.current = runtime;
    const unsubscribe = runtime.subscribe((status) => {
      setWorld(status.world);
      setRunning(status.running);
      setIssues(status.issues);
      setActiveIds(status.activeIds);
    });
    return () => {
      unsubscribe();
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [program, arenaId]);

  // Declared after the runtime effect, so a freshly built runtime is handed the
  // speed and the sensor readings the class has already set.
  useEffect(() => {
    runtimeRef.current?.setSpeed(speed);
  }, [speed, program, arenaId]);

  useEffect(() => {
    runtimeRef.current?.setLight(light);
  }, [light, program, arenaId]);

  useEffect(() => {
    runtimeRef.current?.setObject(objectCm, objectColour);
  }, [objectCm, objectColour, program, arenaId]);

  const changeProgram = useCallback((next: RbProgram) => {
    setProgram(next);
    setVerdict(null);
  }, []);

  const run = useCallback(() => {
    setVerdict(null);
    runtimeRef.current?.start();
  }, []);

  const stop = useCallback(() => runtimeRef.current?.stop(), []);

  const reset = useCallback(() => {
    runtimeRef.current?.stop();
    runtimeRef.current?.reset();
    setVerdict(null);
  }, []);

  const changeArena = useCallback((id: RbArenaId) => {
    runtimeRef.current?.stop();
    setArenaId(id);
    setLight(arenaById(id).light);
    setObjectCm(null);
    setVerdict(null);
  }, []);

  const runCheck = useCallback(async () => {
    if (!exercise) return;
    setChecking(true);
    setVerdict(null);
    runtimeRef.current?.stop();
    // A breath, so the button can paint "Checking…" before the trials run.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const records = simulateAll(program, exercise.check.trials);
      const result = checkRun(exercise.check, records);
      setVerdict({ kind: "result", result });
      if (result.passed && !solved) {
        setSolved(true);
        onSolved?.();
      }
    } catch {
      setVerdict({
        kind: "error",
        message:
          "Something went wrong while trying your mission. Press Reset, then check it again.",
      });
    } finally {
      setChecking(false);
    }
  }, [exercise, program, solved, onSolved]);

  const fatal = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity !== "error");
  const blockCount = countBlocks(program);
  const hasScripts = program.scripts.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-white shadow-card",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-900 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          mBot2 · CyberPi
        </span>
        {exercise ? (
          <Chip tone="signal">{exercise.title}</Chip>
        ) : (
          <label className="flex items-center gap-2">
            <span className="sr-only">Which arena the robot drives in</span>
            <select
              value={arenaId}
              onChange={(e) => changeArena(e.target.value as RbArenaId)}
              className="h-8 cursor-pointer rounded-md border border-white/20 bg-white/10 px-2 text-[13px] font-semibold text-white [&>option]:bg-white [&>option]:text-ink-900"
            >
              {RB_ARENA_ORDER.map((id) => (
                <option key={id} value={id}>
                  {RB_ARENAS[id].name}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="ml-auto flex flex-wrap items-center gap-2">
          {/* Speed — the teaching control */}
          <span className="flex items-center overflow-hidden rounded-md border border-white/15">
            <Gauge className="mx-2 size-3.5 text-ink-400" aria-hidden />
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeed(s.id)}
                title={s.hint}
                aria-pressed={speed === s.id}
                className={cn(
                  "cursor-pointer px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  speed === s.id
                    ? "bg-white/15 text-white"
                    : "text-ink-300 hover:bg-white/10",
                )}
              >
                {s.label}
              </button>
            ))}
          </span>
          <Button
            variant="inverse"
            size="sm"
            icon={<ListRestart />}
            onClick={reset}
          >
            Reset
          </Button>
          {running ? (
            <Button variant="danger" size="sm" icon={<Square />} onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button
              variant="world"
              size="sm"
              icon={<Play />}
              onClick={run}
              disabled={!hasScripts}
            >
              Run
            </Button>
          )}
        </span>
      </div>

      {exercise ? (
        <p className="border-b border-ink-100 bg-signal-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-700">
          {exercise.brief}
        </p>
      ) : (
        <p className="border-b border-ink-100 bg-ink-50 px-4 py-2.5 text-[13px] leading-relaxed text-ink-600">
          {arena.caption}
        </p>
      )}

      {/* Editor | the robot */}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,412px)]">
        <div className="min-w-0 border-b border-ink-100 p-4 xl:border-r xl:border-b-0">
          <MissionEditor
            program={program}
            onChange={changeProgram}
            readOnly={running}
            allowed={exercise?.allowed}
            activeIds={activeIds}
          />
        </div>

        <div className="min-w-0 space-y-3 p-4">
          <DistanceGauge world={world} running={running} />
          <RobotArena arena={arena} world={world} />
          <CyberPi world={world} arena={arena} />
          <WorldControls
            running={running}
            light={light}
            onLight={setLight}
            objectCm={objectCm}
            objectColour={objectColour}
            onObject={(cm, colour) => {
              setObjectCm(cm);
              setObjectColour(colour);
            }}
            onButton={(b) => runtimeRef.current?.pressButton(b)}
            onJoystick={(d) => runtimeRef.current?.pullJoystick(d)}
          />

          {/* Issues — teaching feedback, never a stack trace */}
          {(fatal.length > 0 || warnings.length > 0) && (
            <div className="space-y-1.5">
              {[...fatal, ...warnings].slice(0, 3).map((issue, i) => (
                <p
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]",
                    issue.severity === "error"
                      ? "bg-coral-100 text-coral-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          {/* What the mission says, in words — used while explaining */}
          {blockCount > 0 && (
            <details className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-700">
                Read the mission in words
              </summary>
              <ol className="thin-scroll mt-2 max-h-56 space-y-0.5 overflow-auto font-mono text-[11.5px] leading-relaxed whitespace-pre text-ink-600">
                {describeProgram(program).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>

      {/* Exercise footer */}
      {exercise && (
        <div className="border-t border-ink-100 p-4">
          {verdict?.kind === "error" && (
            <p className="animate-pop mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-3 text-[13px] font-semibold text-amber-700">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {verdict.message}
            </p>
          )}

          {verdict?.kind === "result" && (
            <div
              className={cn(
                "animate-pop mb-3 rounded-lg px-4 py-3",
                verdict.result.passed ? "bg-mint-100" : "bg-coral-100",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  verdict.result.passed ? "text-mint-700" : "text-coral-700",
                )}
              >
                {verdict.result.passed ? (
                  <>
                    <CheckCircle2 className="size-4.5" aria-hidden /> The robot
                    did what the book asks — well done.
                  </>
                ) : (
                  <>
                    <XCircle className="size-4.5" aria-hidden /> Not yet
                  </>
                )}
              </p>
              <ul className="mt-2 space-y-1.5">
                {verdict.result.trials.map((trial) => {
                  const notes = trial.assertions
                    .filter((a) => !a.passed)
                    .map((a) => a.detail)
                    .slice(0, 2);
                  return (
                    <li key={trial.trialId} className="text-[13px] text-ink-700">
                      <span className="flex items-start gap-2">
                        {trial.passed ? (
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-mint-600"
                            aria-hidden
                          />
                        ) : (
                          <XCircle
                            className="mt-0.5 size-4 shrink-0 text-coral-600"
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0">
                          <span className="font-semibold">{trial.label}</span>
                          {notes.map((note, i) => (
                            <span key={i} className="block text-ink-600">
                              {note}
                            </span>
                          ))}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {hintsShown > 0 && (
            <div className="mb-3 space-y-1.5">
              {exercise.hints.slice(0, hintsShown).map((h, i) => (
                <p
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-bit-200 bg-bit-50 px-3 py-2 text-[13px] text-ink-700"
                >
                  <Lightbulb
                    className="mt-0.5 size-3.5 shrink-0 text-bit-600"
                    aria-hidden
                  />
                  {h}
                </p>
              ))}
            </div>
          )}

          <p className="mb-2 text-[12.5px] text-ink-400">
            {exercise.check.summary}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={runCheck} disabled={!hasScripts || checking}>
              {checking ? "Checking…" : "Check my mission"}
            </Button>
            {hintsShown < exercise.hints.length && (
              <Button
                variant="secondary"
                icon={<Lightbulb />}
                onClick={() => setHintsShown((h) => h + 1)}
              >
                Hint {hintsShown + 1}/{exercise.hints.length}
              </Button>
            )}
            {hintsShown >= exercise.hints.length && !showSolution && (
              <Button
                variant="ghost"
                icon={<Eye />}
                onClick={() => {
                  setShowSolution(true);
                  changeProgram(exercise.solution);
                }}
              >
                Show me one answer
              </Button>
            )}
            {showSolution && (
              <span className="text-[12.5px] text-ink-400">
                This is one correct answer — yours may look different and still
                work.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
