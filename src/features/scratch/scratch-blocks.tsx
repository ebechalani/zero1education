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
import { cn } from "@/lib/utils";
import {
  Blocks,
  ChevronDown,
  Flag,
  GripVertical,
  Keyboard,
  Minus,
  MousePointerClick,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { describeCond, describeExpr } from "./scratch-engine";
import {
  SC_BLOCK_CATEGORY,
  SC_CATEGORIES,
  SC_CATEGORY_ORDER,
  SC_COLOUR_HEX,
  SC_COLOUR_NAMES,
  SC_KEYS,
  SC_PEN_SWATCHES,
  SC_SPRITE_ONLY,
  penColourCss,
  scId,
  type ScCategory,
  type ScColourName,
  type ScCompareOp,
  type ScCond,
  type ScExpr,
  type ScHat,
  type ScKey,
  type ScMathOp,
  type ScStatement,
} from "./scratch-model";

/**
 * The Scratch 3.0 block editor: the palette on the left, the scripts of one
 * target on the right.
 *
 * A student here is holding a printed page open beside the screen, so the
 * blocks are Scratch's own: Scratch's nine category colours, Scratch's notch,
 * Scratch's hat, Scratch's C-shaped loops with the mouth that holds other
 * blocks, and the same words in the same order. Blocks are added by clicking
 * one in the palette — a lesson can never depend on a drag landing — and moved
 * by dragging or with the arrow keys.
 *
 * White words are Scratch's own choice on six of the nine hues. On the three
 * yellows (Events, Control, Variables) white on that gold is barely readable on
 * a projector, so those three carry ink text instead. The hues themselves never
 * change: they are what a student matches against the screenshots in the book.
 */

// ── Addressing: every stack is "<ownerId>::<slot>" ──────────────────────────

type Slot = "body" | "then" | "else";
type ContainerKey = string;

const CANVAS_ID = "sc-canvas";
/** Loops inside loops — Lesson 7 needs three levels; four is room to spare. */
const MAX_DEPTH = 4;

const ckey = (ownerId: string, slot: Slot): ContainerKey => `${ownerId}::${slot}`;
const ownerOf = (key: ContainerKey): string => key.slice(0, key.indexOf("::"));
const slotOf = (key: ContainerKey): Slot => key.slice(key.indexOf("::") + 2) as Slot;
const isContainerId = (id: UniqueIdentifier) => String(id).startsWith("container:");

// ── Script surgery (pure, immutable) ────────────────────────────────────────

/** Rebuild a hat with a new body, keeping its discriminant concrete for TS. */
function withHatBody(hat: ScHat, body: ScStatement[]): ScHat {
  switch (hat.kind) {
    case "when-flag":
      return { ...hat, body };
    case "when-key":
      return { ...hat, body };
    case "when-clicked":
      return { ...hat, body };
  }
}

/** Apply `fn` to every body a statement owns, leaving other kinds untouched. */
function mapBodies(
  stmt: ScStatement,
  fn: (list: ScStatement[]) => ScStatement[],
): ScStatement {
  switch (stmt.kind) {
    case "repeat":
      return { ...stmt, body: fn(stmt.body) };
    case "forever":
      return { ...stmt, body: fn(stmt.body) };
    case "if":
      return {
        ...stmt,
        then: fn(stmt.then),
        ...(stmt.otherwise ? { otherwise: fn(stmt.otherwise) } : {}),
      };
    default:
      return stmt;
  }
}

function bodiesOf(stmt: ScStatement): ScStatement[][] {
  switch (stmt.kind) {
    case "repeat":
    case "forever":
      return [stmt.body];
    case "if":
      return stmt.otherwise ? [stmt.then, stmt.otherwise] : [stmt.then];
    default:
      return [];
  }
}

type ScShell = Extract<ScStatement, { kind: "repeat" | "forever" | "if" }>;

function asShell(stmt: ScStatement): ScShell | null {
  switch (stmt.kind) {
    case "repeat":
    case "forever":
    case "if":
      return stmt;
    default:
      return null;
  }
}

function editList(
  scripts: ScHat[],
  key: ContainerKey,
  edit: (list: ScStatement[]) => ScStatement[],
): ScHat[] {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const here = (stmt: ScStatement): ScStatement => {
    switch (stmt.kind) {
      case "repeat":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "forever":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "if":
        if (slot === "then") return { ...stmt, then: edit(stmt.then) };
        if (slot === "else") return { ...stmt, otherwise: edit(stmt.otherwise ?? []) };
        return stmt;
      default:
        return stmt;
    }
  };
  const walk = (list: ScStatement[]): ScStatement[] =>
    list.map((s) => (s.id === owner ? here(s) : mapBodies(s, walk)));
  return scripts.map((hat) =>
    hat.id === owner && slot === "body"
      ? withHatBody(hat, edit(hat.body))
      : withHatBody(hat, walk(hat.body)),
  );
}

function findStatement(scripts: ScHat[], id: string): ScStatement | null {
  let found: ScStatement | null = null;
  const walk = (list: ScStatement[]) => {
    for (const stmt of list) {
      if (found) return;
      if (stmt.id === id) {
        found = stmt;
        return;
      }
      bodiesOf(stmt).forEach(walk);
    }
  };
  scripts.forEach((hat) => walk(hat.body));
  return found;
}

function getList(scripts: ScHat[], key: ContainerKey): ScStatement[] | null {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const hat = scripts.find((h) => h.id === owner);
  if (hat) return slot === "body" ? hat.body : null;
  const stmt = findStatement(scripts, owner);
  if (!stmt) return null;
  switch (stmt.kind) {
    case "repeat":
    case "forever":
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
  scripts: ScHat[],
  key: ContainerKey,
  index: number,
  stmt: ScStatement,
): ScHat[] =>
  editList(scripts, key, (list) => [...list.slice(0, index), stmt, ...list.slice(index)]);

function removeStatement(
  scripts: ScHat[],
  id: string,
): { scripts: ScHat[]; removed: ScStatement | null } {
  let removed: ScStatement | null = null;
  const walk = (list: ScStatement[]): ScStatement[] => {
    const out: ScStatement[] = [];
    for (const stmt of list) {
      if (stmt.id === id) {
        removed = stmt;
        continue;
      }
      out.push(mapBodies(stmt, walk));
    }
    return out;
  };
  return { scripts: scripts.map((hat) => withHatBody(hat, walk(hat.body))), removed };
}

const mutateStatement = (
  scripts: ScHat[],
  id: string,
  fn: (stmt: ScStatement) => ScStatement,
): ScHat[] => {
  const walk = (list: ScStatement[]): ScStatement[] =>
    list.map((s) => (s.id === id ? fn(s) : mapBodies(s, walk)));
  return scripts.map((hat) => withHatBody(hat, walk(hat.body)));
};

const mutateHat = (scripts: ScHat[], id: string, fn: (hat: ScHat) => ScHat): ScHat[] =>
  scripts.map((hat) => (hat.id === id ? fn(hat) : hat));

function collectIds(stmt: ScStatement): string[] {
  const ids = [stmt.id];
  bodiesOf(stmt).forEach((list) => list.forEach((s) => ids.push(...collectIds(s))));
  return ids;
}

// ── Reaching into a block's values ──────────────────────────────────────────

function setExprIn(expr: ScExpr, path: string[], next: ScExpr): ScExpr {
  if (path.length === 0) return next;
  const [seg, ...rest] = path;
  if (expr.kind === "binop") {
    if (seg === "left") return { ...expr, left: setExprIn(expr.left, rest, next) };
    if (seg === "right") return { ...expr, right: setExprIn(expr.right, rest, next) };
  }
  if (expr.kind === "random") {
    if (seg === "min") return { ...expr, min: setExprIn(expr.min, rest, next) };
    if (seg === "max") return { ...expr, max: setExprIn(expr.max, rest, next) };
  }
  return expr;
}

function setCondExpr(cond: ScCond, path: string[], next: ScExpr): ScCond {
  if (cond.kind !== "compare") return cond;
  const [seg, ...rest] = path;
  if (seg === "left") return { ...cond, left: setExprIn(cond.left, rest, next) };
  if (seg === "right") return { ...cond, right: setExprIn(cond.right, rest, next) };
  return cond;
}

/** Replace the value at `path`; path[0] names the field of the block. */
function setStatementExpr(
  stmt: ScStatement,
  path: string[],
  next: ScExpr,
): ScStatement {
  const [field, ...rest] = path;
  const at = (current: ScExpr) => setExprIn(current, rest, next);
  switch (stmt.kind) {
    case "move":
      return field === "steps" ? { ...stmt, steps: at(stmt.steps) } : stmt;
    case "turn":
      return field === "degrees" ? { ...stmt, degrees: at(stmt.degrees) } : stmt;
    case "goto-xy":
      if (field === "x") return { ...stmt, x: at(stmt.x) };
      if (field === "y") return { ...stmt, y: at(stmt.y) };
      return stmt;
    case "glide-xy":
      if (field === "x") return { ...stmt, x: at(stmt.x) };
      if (field === "y") return { ...stmt, y: at(stmt.y) };
      return stmt;
    case "point-in-direction":
      return field === "degrees" ? { ...stmt, degrees: at(stmt.degrees) } : stmt;
    case "repeat":
      return field === "times" ? { ...stmt, times: at(stmt.times) } : stmt;
    case "set-var":
      return field === "value" ? { ...stmt, value: at(stmt.value) } : stmt;
    case "change-var":
      return field === "by" ? { ...stmt, by: at(stmt.by) } : stmt;
    case "change-pen-colour":
      return field === "by" ? { ...stmt, by: at(stmt.by) } : stmt;
    case "if":
      return field === "cond" ? { ...stmt, cond: setCondExpr(stmt.cond, rest, next) } : stmt;
    default:
      return stmt;
  }
}

// ── Reading a block out loud ────────────────────────────────────────────────

/** Scratch's own wording — the label a screen reader and the drag ghost use. */
export function scStatementLabel(st: ScStatement): string {
  switch (st.kind) {
    case "move":
      return `move ${describeExpr(st.steps)} steps`;
    case "turn":
      return `turn ${st.way === "cw" ? "right" : "left"} ${describeExpr(st.degrees)} degrees`;
    case "goto-xy":
      return `go to x ${describeExpr(st.x)} y ${describeExpr(st.y)}`;
    case "glide-xy":
      return `glide ${st.secs} seconds to x ${describeExpr(st.x)} y ${describeExpr(st.y)}`;
    case "point-in-direction":
      return `point in direction ${describeExpr(st.degrees)}`;
    case "if-on-edge-bounce":
      return "if on edge, bounce";
    case "say":
      return st.secs === undefined
        ? `say ${st.text}`
        : `say ${st.text} for ${st.secs} seconds`;
    case "think":
      return st.secs === undefined
        ? `think ${st.text}`
        : `think ${st.text} for ${st.secs} seconds`;
    case "switch-backdrop":
      return `switch backdrop to ${st.backdrop}`;
    case "next-backdrop":
      return "next backdrop";
    case "switch-costume":
      return `switch costume to ${st.costume}`;
    case "next-costume":
      return "next costume";
    case "show":
      return "show";
    case "hide":
      return "hide";
    case "play-sound":
      return st.untilDone ? `play sound ${st.sound} until done` : `start sound ${st.sound}`;
    case "wait":
      return `wait ${st.secs} seconds`;
    case "repeat":
      return `repeat ${describeExpr(st.times)}`;
    case "forever":
      return "forever";
    case "if":
      return `if ${describeCond(st.cond)} then`;
    case "stop-all":
      return "stop all";
    case "set-var":
      return `set ${st.name} to ${describeExpr(st.value)}`;
    case "change-var":
      return `change ${st.name} by ${describeExpr(st.by)}`;
    case "pen-down":
      return "pen down";
    case "pen-up":
      return "pen up";
    case "erase-all":
      return "erase all";
    case "set-pen-colour":
      return `set pen colour to ${st.colour}`;
    case "change-pen-colour":
      return `change pen colour by ${describeExpr(st.by)}`;
  }
}

export const scHatLabel = (hat: ScHat): string => {
  switch (hat.kind) {
    case "when-flag":
      return "when green flag clicked";
    case "when-key":
      return `when ${hat.key} key pressed`;
    case "when-clicked":
      return "when this sprite clicked";
  }
};

// ── The palette ─────────────────────────────────────────────────────────────

export interface ScEditorContext {
  /** The Stage has no Motion, Looks-on-a-sprite or Pen drawer. */
  isStage: boolean;
  targetName: string;
  sprites: { id: string; name: string }[];
  backdrops: string[];
  costumes: string[];
  sounds: string[];
  variables: string[];
}

type ScShape = "hat" | "stack" | "c" | "reporter" | "boolean";
type MakeId = () => string;

interface ScEntryBase {
  key: string;
  category: ScCategory;
  /** One line of plain help — the tooltip, and part of the spoken label. */
  help: string;
}

interface ScHatEntry extends ScEntryBase {
  shape: "hat";
  hat: (id: MakeId, ctx: ScEditorContext) => ScHat;
}
interface ScStackEntry extends ScEntryBase {
  shape: "stack";
  stmt: (id: MakeId, ctx: ScEditorContext) => ScStatement;
}
/** The C-shaped blocks. Separate from a plain stack block so that narrowing
 *  `shape === "stack" || shape === "c"` leaves nothing behind. */
interface ScShellEntry extends ScEntryBase {
  shape: "c";
  stmt: (id: MakeId, ctx: ScEditorContext) => ScStatement;
}
interface ScReporterEntry extends ScEntryBase {
  shape: "reporter";
  expr: (ctx: ScEditorContext) => ScExpr;
}
interface ScBooleanEntry extends ScEntryBase {
  shape: "boolean";
  cond: (ctx: ScEditorContext) => ScCond;
}

/** A plain union, not an intersection: only this shape narrows cleanly. */
type ScPaletteEntry =
  | ScHatEntry
  | ScStackEntry
  | ScShellEntry
  | ScReporterEntry
  | ScBooleanEntry;

const num = (value: number): ScExpr => ({ kind: "num", value });
const first = (list: string[], fallback: string): string => list[0] ?? fallback;

/**
 * Every block the chapter uses, in Scratch's drawer order. Defaults are
 * Scratch's own defaults — `move 10 steps`, `wait 1 seconds`, `repeat 10` —
 * so a block dragged out matches the picture in the book before it is touched.
 */
function buildPalette(ctx: ScEditorContext): ScPaletteEntry[] {
  const entries: ScPaletteEntry[] = [
    // ── Motion ──
    {
      key: "move",
      category: "motion",
      shape: "stack",
      help: "Walk forward in the direction the sprite is pointing.",
      stmt: (id) => ({ id: id(), kind: "move", steps: num(10) }),
    },
    {
      key: "turn-cw",
      category: "motion",
      shape: "stack",
      help: "Turn to the right (clockwise).",
      stmt: (id) => ({ id: id(), kind: "turn", way: "cw", degrees: num(15) }),
    },
    {
      key: "turn-ccw",
      category: "motion",
      shape: "stack",
      help: "Turn to the left (anticlockwise).",
      stmt: (id) => ({ id: id(), kind: "turn", way: "ccw", degrees: num(15) }),
    },
    {
      key: "goto-xy",
      category: "motion",
      shape: "stack",
      help: "Jump straight to a place on the stage.",
      stmt: (id) => ({ id: id(), kind: "goto-xy", x: num(0), y: num(0) }),
    },
    {
      key: "glide-xy",
      category: "motion",
      shape: "stack",
      help: "Slide there smoothly, taking the seconds you choose.",
      stmt: (id) => ({ id: id(), kind: "glide-xy", secs: 1, x: num(0), y: num(0) }),
    },
    {
      key: "point-in-direction",
      category: "motion",
      shape: "stack",
      help: "0 is up, 90 is right, 45 is the diagonal between them.",
      stmt: (id) => ({ id: id(), kind: "point-in-direction", degrees: num(90) }),
    },
    {
      key: "if-on-edge-bounce",
      category: "motion",
      shape: "stack",
      help: "At the edge of the stage, turn back the other way.",
      stmt: (id) => ({ id: id(), kind: "if-on-edge-bounce" }),
    },
    {
      key: "x-position",
      category: "motion",
      shape: "reporter",
      help: "How far across the stage the sprite is now.",
      expr: () => ({ kind: "x-position" }),
    },
    {
      key: "y-position",
      category: "motion",
      shape: "reporter",
      help: "How far up the stage the sprite is now.",
      expr: () => ({ kind: "y-position" }),
    },

    // ── Looks ──
    {
      key: "say-for",
      category: "looks",
      shape: "stack",
      help: "Show a sentence in a bubble, then carry on.",
      stmt: (id) => ({ id: id(), kind: "say", text: "Hello!", secs: 2 }),
    },
    {
      key: "say",
      category: "looks",
      shape: "stack",
      help: "Show a sentence and leave it there.",
      stmt: (id) => ({ id: id(), kind: "say", text: "Hello!" }),
    },
    {
      key: "think-for",
      category: "looks",
      shape: "stack",
      help: "A thought bubble for a few seconds.",
      stmt: (id) => ({ id: id(), kind: "think", text: "Hmm…", secs: 2 }),
    },
    {
      key: "think",
      category: "looks",
      shape: "stack",
      help: "A thought bubble that stays.",
      stmt: (id) => ({ id: id(), kind: "think", text: "Hmm…" }),
    },
    {
      key: "switch-backdrop",
      category: "looks",
      shape: "stack",
      help: "Change the scene on the Stage.",
      stmt: (id, c) => ({
        id: id(),
        kind: "switch-backdrop",
        backdrop: first(c.backdrops, "backdrop1"),
      }),
    },
    {
      key: "next-backdrop",
      category: "looks",
      shape: "stack",
      help: "Move on to the next scene in the list.",
      stmt: (id) => ({ id: id(), kind: "next-backdrop" }),
    },
    {
      key: "switch-costume",
      category: "looks",
      shape: "stack",
      help: "Wear one of this sprite's own drawings.",
      stmt: (id, c) => ({
        id: id(),
        kind: "switch-costume",
        costume: first(c.costumes, "costume1"),
      }),
    },
    {
      key: "next-costume",
      category: "looks",
      shape: "stack",
      help: "Wear the following drawing — this is what animates a sprite.",
      stmt: (id) => ({ id: id(), kind: "next-costume" }),
    },
    {
      key: "show",
      category: "looks",
      shape: "stack",
      help: "Put the sprite on the stage.",
      stmt: (id) => ({ id: id(), kind: "show" }),
    },
    {
      key: "hide",
      category: "looks",
      shape: "stack",
      help: "Take the sprite off the stage.",
      stmt: (id) => ({ id: id(), kind: "hide" }),
    },

    // ── Sound ──
    {
      key: "play-sound-until-done",
      category: "sound",
      shape: "stack",
      help: "Play a sound and wait until it has finished.",
      stmt: (id, c) => ({
        id: id(),
        kind: "play-sound",
        sound: first(c.sounds, "pop"),
        untilDone: true,
      }),
    },
    {
      key: "play-sound",
      category: "sound",
      shape: "stack",
      help: "Start a sound and carry on straight away.",
      stmt: (id, c) => ({
        id: id(),
        kind: "play-sound",
        sound: first(c.sounds, "pop"),
        untilDone: false,
      }),
    },

    // ── Events ──
    {
      key: "when-flag",
      category: "events",
      shape: "hat",
      help: "Everything under this block runs when the green flag is clicked.",
      hat: (id) => ({ id: id(), kind: "when-flag", body: [] }),
    },
    {
      key: "when-key",
      category: "events",
      shape: "hat",
      help: "Runs whenever that key is pressed while the project is running.",
      hat: (id) => ({ id: id(), kind: "when-key", key: "space", body: [] }),
    },
    {
      key: "when-clicked",
      category: "events",
      shape: "hat",
      help: "Runs when someone clicks this sprite on the stage.",
      hat: (id) => ({ id: id(), kind: "when-clicked", body: [] }),
    },

    // ── Control ──
    {
      key: "wait",
      category: "control",
      shape: "stack",
      help: "Hold everything below for a number of seconds.",
      stmt: (id) => ({ id: id(), kind: "wait", secs: 1 }),
    },
    {
      key: "repeat",
      category: "control",
      shape: "c",
      help: "Run the blocks inside a chosen number of times.",
      stmt: (id) => ({ id: id(), kind: "repeat", times: num(10), body: [] }),
    },
    {
      key: "forever",
      category: "control",
      shape: "c",
      help: "Run the blocks inside over and over, for as long as the project runs.",
      stmt: (id) => ({ id: id(), kind: "forever", body: [] }),
    },
    {
      key: "if",
      category: "control",
      shape: "c",
      help: "Ask a question; run the blocks inside only when the answer is yes.",
      stmt: (id, c) => ({
        id: id(),
        kind: "if",
        cond: c.sprites.length > 0
          ? { kind: "touching-sprite", sprite: c.sprites[0].id }
          : { kind: "touching-edge" },
        then: [],
      }),
    },
    {
      key: "stop-all",
      category: "control",
      shape: "stack",
      help: "End the whole project — every script stops.",
      stmt: (id) => ({ id: id(), kind: "stop-all" }),
    },

    // ── Sensing ──
    {
      key: "touching-sprite",
      category: "sensing",
      shape: "boolean",
      help: "Yes while this sprite is overlapping the one you choose.",
      cond: (c) => ({
        kind: "touching-sprite",
        sprite: c.sprites[0]?.id ?? "",
      }),
    },
    {
      key: "touching-colour",
      category: "sensing",
      shape: "boolean",
      help: "Yes while the sprite is on top of that colour on the backdrop.",
      cond: () => ({ kind: "touching-colour", colour: "red" }),
    },
    {
      key: "touching-edge",
      category: "sensing",
      shape: "boolean",
      help: "Yes while the sprite has reached the edge of the stage.",
      cond: () => ({ kind: "touching-edge" }),
    },
    {
      key: "key-pressed",
      category: "sensing",
      shape: "boolean",
      help: "Yes while that key is being held down.",
      cond: () => ({ kind: "key-pressed", key: "space" }),
    },
    {
      key: "mouse-down",
      category: "sensing",
      shape: "boolean",
      help: "Yes while the mouse button is held down.",
      cond: () => ({ kind: "mouse-down" }),
    },
    {
      key: "mouse-x",
      category: "sensing",
      shape: "reporter",
      help: "How far across the stage the mouse pointer is.",
      expr: () => ({ kind: "mouse-x" }),
    },
    {
      key: "mouse-y",
      category: "sensing",
      shape: "reporter",
      help: "How far up the stage the mouse pointer is.",
      expr: () => ({ kind: "mouse-y" }),
    },

    // ── Operators ──
    {
      key: "op-add",
      category: "operators",
      shape: "reporter",
      help: "Add two numbers.",
      expr: () => ({ kind: "binop", op: "+", left: num(0), right: num(0) }),
    },
    {
      key: "op-sub",
      category: "operators",
      shape: "reporter",
      help: "Take one number away from another.",
      expr: () => ({ kind: "binop", op: "-", left: num(0), right: num(0) }),
    },
    {
      key: "op-mul",
      category: "operators",
      shape: "reporter",
      help: "Multiply two numbers.",
      expr: () => ({ kind: "binop", op: "*", left: num(0), right: num(0) }),
    },
    {
      key: "op-div",
      category: "operators",
      shape: "reporter",
      help: "Divide one number by another.",
      expr: () => ({ kind: "binop", op: "/", left: num(0), right: num(0) }),
    },
    {
      key: "op-random",
      category: "operators",
      shape: "reporter",
      help: "A different number every time, between the two you choose.",
      expr: () => ({ kind: "random", min: num(1), max: num(10) }),
    },
    {
      key: "op-lt",
      category: "operators",
      shape: "boolean",
      help: "Yes while the first number is smaller than the second.",
      cond: () => ({ kind: "compare", op: "<", left: num(0), right: num(50) }),
    },
    {
      key: "op-eq",
      category: "operators",
      shape: "boolean",
      help: "Yes while the two are exactly equal.",
      cond: () => ({ kind: "compare", op: "=", left: num(0), right: num(50) }),
    },
    {
      key: "op-gt",
      category: "operators",
      shape: "boolean",
      help: "Yes while the first number is bigger than the second.",
      cond: () => ({ kind: "compare", op: ">", left: num(0), right: num(50) }),
    },

    // ── Variables ──
    {
      key: "set-var",
      category: "variables",
      shape: "stack",
      help: "Put a value into the box, throwing away what was in it.",
      stmt: (id, c) => ({
        id: id(),
        kind: "set-var",
        name: first(c.variables, "counter"),
        value: num(0),
      }),
    },
    {
      key: "change-var",
      category: "variables",
      shape: "stack",
      help: "Add to what is already in the box.",
      stmt: (id, c) => ({
        id: id(),
        kind: "change-var",
        name: first(c.variables, "counter"),
        by: num(1),
      }),
    },
    ...ctx.variables.map(
      (name): ScPaletteEntry => ({
        key: `var-${name}`,
        category: "variables",
        shape: "reporter",
        help: `Use what is inside ${name} right now.`,
        expr: () => ({ kind: "var", name }),
      }),
    ),

    // ── Pen ──
    {
      key: "erase-all",
      category: "pen",
      shape: "stack",
      help: "Wipe the stage clean before a drawing starts.",
      stmt: (id) => ({ id: id(), kind: "erase-all" }),
    },
    {
      key: "pen-down",
      category: "pen",
      shape: "stack",
      help: "From now on the sprite leaves a line behind it.",
      stmt: (id) => ({ id: id(), kind: "pen-down" }),
    },
    {
      key: "pen-up",
      category: "pen",
      shape: "stack",
      help: "Stop drawing — the sprite can move without leaving a line.",
      stmt: (id) => ({ id: id(), kind: "pen-up" }),
    },
    {
      key: "set-pen-colour",
      category: "pen",
      shape: "stack",
      help: "Choose the colour of the line.",
      stmt: (id) => ({ id: id(), kind: "set-pen-colour", colour: 0 }),
    },
    {
      key: "change-pen-colour",
      category: "pen",
      shape: "stack",
      help: "Move the pen a little way around the colour wheel.",
      stmt: (id) => ({ id: id(), kind: "change-pen-colour", by: num(10) }),
    },
  ];

  if (!ctx.isStage) return entries;
  // On the Stage, the blocks that move or dress a sprite are simply not there.
  const spriteOnly = new Set<string>(SC_SPRITE_ONLY as string[]);
  return entries.filter((entry) => {
    if (entry.shape === "hat") return entry.key !== "when-clicked";
    if (entry.shape === "reporter")
      return entry.key !== "x-position" && entry.key !== "y-position";
    if (entry.shape === "boolean")
      return !["touching-sprite", "touching-colour", "touching-edge"].includes(entry.key);
    const sample = entry.stmt(() => "probe", ctx);
    return !spriteOnly.has(sample.kind);
  });
}

/** Ids for the little copies drawn in the palette — stable, so React can keep them. */
const previewIds = (key: string): MakeId => {
  let n = 0;
  return () => `preview-${key}-${(n += 1)}`;
};

// ── Editor context ──────────────────────────────────────────────────────────

type ScSelection =
  | { kind: "hat"; id: string }
  | { kind: "statement"; id: string }
  | { kind: "slot"; container: ContainerKey };

interface FocusedValue {
  ownerId: string;
  path: string[];
}

interface EditorApi {
  readOnly: boolean;
  ctx: ScEditorContext;
  activeIds: string[];
  selection: ScSelection | null;
  select: (selection: ScSelection | null) => void;
  tabTargetId: string | null;
  update: (fn: (scripts: ScHat[]) => ScHat[]) => void;
  removeBlock: (id: string) => void;
  moveWithin: (id: string, delta: number) => void;
  navigate: (id: string, delta: number) => void;
  navigateInto: (id: string) => void;
  navigateOut: (id: string) => void;
  focusFirstField: (id: string) => void;
  registerNode: (id: string, el: HTMLDivElement | null) => void;
  setFocusedValue: (value: FocusedValue | null) => void;
  setFocusedCond: (ownerId: string | null) => void;
  makeVariable: (name: string) => void;
  say: (message: string) => void;
  dragShape: ScShape | null;
  activeDragId: string | null;
  overId: string | null;
}

const EditorCtx = createContext<EditorApi | null>(null);

function useEditor(): EditorApi {
  const api = useContext(EditorCtx);
  if (!api) throw new Error("Scratch block parts must render inside <ScratchBlocks>");
  return api;
}

/**
 * Blocks drawn in the palette and in the drag ghost are pictures, not
 * controls: their fields become plain text and their slots stop being drop
 * targets. The value is the id prefix, which keeps the two copies apart.
 */
const StaticCtx = createContext<string | null>(null);
const useStaticPrefix = () => useContext(StaticCtx);

/** Fields join the tab order only once their block is selected. */
function useFieldTab(ownerId: string): number {
  const { selection } = useEditor();
  const isStatic = useStaticPrefix() !== null;
  if (isStatic) return -1;
  return selection && selection.kind !== "slot" && selection.id === ownerId ? 0 : -1;
}

// ── Scratch geometry ────────────────────────────────────────────────────────

/**
 * Scratch's own measurements: a notch 12px in from the left edge, 18px wide
 * and 4px deep with sloped shoulders, a 16px wall down the inside of every
 * C-shaped block, and small 5px corners. Change them and the blocks stop
 * matching the screenshots the book is printed with.
 */
const NOTCH_X = 12;
const NOTCH_W = 18;
const NOTCH_D = 4;
const RAIL = 16;
const RADIUS = 5;

const NOTCH_SHAPE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${NOTCH_W}" height="${NOTCH_D}"><path d="M0 0 L3 2.6 Q4.4 4 6.2 4 H11.8 Q13.6 4 15 2.6 L18 0 Z" fill="#000"/></svg>`,
)}")`;

/**
 * The dent in a block's top edge is a hole punched clean through its face, so
 * the tab of the block above shows through it and the two interlock. A browser
 * without mask-composite falls back to a plain rectangle: a block that has lost
 * its dent, never a block that has vanished.
 */
const SOCKET: CSSProperties = {
  maskImage: `linear-gradient(#000, #000), ${NOTCH_SHAPE}`,
  maskPosition: `0 0, ${NOTCH_X}px 0`,
  maskSize: `auto, ${NOTCH_W}px ${NOTCH_D}px`,
  maskRepeat: "no-repeat",
  maskComposite: "exclude",
  WebkitMaskImage: `linear-gradient(#000, #000), ${NOTCH_SHAPE}`,
  WebkitMaskPosition: `0 0, ${NOTCH_X}px 0`,
  WebkitMaskSize: `auto, ${NOTCH_W}px ${NOTCH_D}px`,
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskComposite: "xor",
};

const HEX_CLIP =
  "polygon(9px 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 9px 100%, 0 50%)";

/**
 * White on Scratch's three golds is unreadable from the back of a classroom,
 * so Events, Control and Variables carry ink text. Every hue is untouched.
 */
const INK_TEXT: ScCategory[] = ["events", "control", "variables"];
const inkText = (category: ScCategory) => INK_TEXT.includes(category);
const textFor = (category: ScCategory) => (inkText(category) ? "#0b1120" : "#ffffff");
const shadowFor = (category: ScCategory) =>
  inkText(category) ? "none" : "0 1px 1px rgba(11,17,32,0.3)";

const EDGE = "inset 0 0 0 1px rgba(11,17,32,0.14)";

function Face({
  hex,
  radius = `${RADIUS}px`,
  socket = false,
}: {
  hex: string;
  radius?: string;
  socket?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: hex,
        borderRadius: radius,
        boxShadow: EDGE,
        ...(socket ? SOCKET : null),
      }}
    />
  );
}

/** The bump that drops into the dent of the block below. */
function Tab({ hex, className }: { hex: string; className: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{
        background: hex,
        left: NOTCH_X,
        width: NOTCH_W,
        height: NOTCH_D,
        maskImage: NOTCH_SHAPE,
        maskSize: `${NOTCH_W}px ${NOTCH_D}px`,
        maskRepeat: "no-repeat",
        WebkitMaskImage: NOTCH_SHAPE,
        WebkitMaskSize: `${NOTCH_W}px ${NOTCH_D}px`,
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}

/** The arch across the top of an event block. */
function Dome({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0"
      // 1px of overlap with the bar below, so no hairline shows at any zoom.
      style={{
        background: hex,
        height: 17,
        top: -16,
        borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
      }}
    />
  );
}

function SelectRing() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-[3px] rounded-[8px]"
      style={{ boxShadow: "inset 0 0 0 2px #ffffff, 0 0 0 2px rgba(11,17,32,0.9)" }}
    />
  );
}

/** Scratch's yellow halo around whatever is running right now. */
function RunGlow() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-[3px] rounded-[8px]"
      style={{ boxShadow: "0 0 0 3px #ffd84d, 0 0 12px 2px rgba(255,216,77,0.6)" }}
    />
  );
}

function Hexagon({ hex, children }: { hex: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex min-h-7 items-center px-3 py-0.5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: hex, clipPath: HEX_CLIP }}
      />
      <span className="relative inline-flex items-center gap-1">{children}</span>
    </span>
  );
}

// ── Inline fields ───────────────────────────────────────────────────────────

const PILL = "inline-flex items-center rounded-full text-[13px] leading-none font-semibold";
/** Scratch's white oval — where a number or a sentence is typed. */
const WHITE_PILL = `${PILL} h-6 bg-white px-1.5 text-ink-900 shadow-[0_1px_0_rgba(11,17,32,0.18)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500`;
/** Scratch paints a dropdown as a darker patch of the block's own colour. */
const DARK_PILL = `${PILL} relative h-6 cursor-pointer gap-1 bg-black/20 pr-1.5 pl-2 text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white`;
const LIGHT_PILL = `${PILL} relative h-6 cursor-pointer gap-1 bg-white/45 pr-1.5 pl-2 text-ink-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink-900`;
const BARE_INPUT =
  "min-w-0 border-0 bg-transparent p-0 font-mono text-[13px] font-semibold text-ink-900 outline-none placeholder:text-ink-300 disabled:text-ink-400";
/**
 * A transparent <select> laid over its pill. The element is invisible but its
 * POPUP is not, and the browser paints that list with the select's own
 * computed colours — which would inherit the white text of the block face and
 * come out white on white. So the colours are pinned here.
 */
const OVERLAY_SELECT =
  "absolute inset-x-0 -inset-y-1 cursor-pointer opacity-0 disabled:cursor-default " +
  "bg-white text-ink-900 [&>option]:bg-white [&>option]:text-ink-900";

/** Typing inside a block must not reach the block's own arrow and Delete keys. */
const stopKeys = (e: ReactKeyboardEvent) => {
  if (e.key !== "Escape") e.stopPropagation();
};

function W({ children, category }: { children: ReactNode; category: ScCategory }) {
  return (
    <span
      className="px-0.5 text-[13.5px] leading-none font-semibold whitespace-nowrap"
      style={{ color: textFor(category), textShadow: shadowFor(category) }}
    >
      {children}
    </span>
  );
}

function NumberField({
  ownerId,
  value,
  onCommit,
  label,
}: {
  ownerId: string;
  value: number;
  onCommit: (n: number) => void;
  label: string;
}) {
  const { readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const isStatic = useStaticPrefix() !== null;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);

  if (isStatic) {
    return <span className={cn(WHITE_PILL, "px-2 font-mono")}>{value}</span>;
  }
  return (
    <span className={cn(WHITE_PILL, "px-1")}>
      <input
        data-field
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={shown}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
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
  ownerId,
  value,
  onCommit,
  label,
}: {
  ownerId: string;
  value: string;
  onCommit: (v: string) => void;
  label: string;
}) {
  const { readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const isStatic = useStaticPrefix() !== null;

  if (isStatic) {
    return (
      <span className={cn(WHITE_PILL, "max-w-[14ch] truncate px-2")}>{value}</span>
    );
  }
  return (
    <span className={cn(WHITE_PILL, "px-2")}>
      <input
        data-field
        type="text"
        aria-label={label}
        value={value}
        maxLength={80}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
        onChange={(e) => onCommit(e.target.value)}
        className={cn(BARE_INPUT, "h-5 font-sans")}
        style={{ width: `calc(${Math.min(34, Math.max(6, value.length))}ch + 0.4rem)` }}
      />
    </span>
  );
}

function ChoiceField({
  ownerId,
  category,
  value,
  options,
  onChange,
  label,
  lead,
}: {
  ownerId: string;
  category: ScCategory;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  lead?: ReactNode;
}) {
  const { readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const isStatic = useStaticPrefix() !== null;
  const current = options.find((o) => o.value === value);
  const pill = inkText(category) ? LIGHT_PILL : DARK_PILL;

  return (
    <span className={cn(pill, (readOnly || isStatic) && "cursor-default")}>
      {lead}
      <span className="max-w-[16ch] truncate whitespace-nowrap">
        {current?.label ?? value}
      </span>
      <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      {!isStatic && (
        <select
          data-field
          aria-label={label}
          value={value}
          disabled={readOnly}
          tabIndex={tabIndex}
          onKeyDown={stopKeys}
          onChange={(e) => onChange(e.target.value)}
          className={OVERLAY_SELECT}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}

/** Pick a variable, or make one — Scratch's "Make a Variable", inside the block. */
function VarField({
  ownerId,
  category,
  name,
  onChange,
  label,
}: {
  ownerId: string;
  category: ScCategory;
  name: string;
  onChange: (name: string) => void;
  label: string;
}) {
  const { ctx, makeVariable, readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const isStatic = useStaticPrefix() !== null;
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  if (naming && !isStatic) {
    const commit = () => {
      const clean = draft.trim();
      if (clean) {
        makeVariable(clean);
        onChange(clean);
      }
      setNaming(false);
      setDraft("");
    };
    return (
      <span className={cn(WHITE_PILL, "px-2")}>
        <input
          data-field
          autoFocus
          aria-label="Name for the new variable"
          value={draft}
          disabled={readOnly}
          tabIndex={tabIndex}
          placeholder="name"
          onKeyDown={(e) => {
            stopKeys(e);
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setNaming(false);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          className={cn(BARE_INPUT, "h-5 w-24")}
        />
      </span>
    );
  }

  const known = ctx.variables.includes(name) ? ctx.variables : [name, ...ctx.variables];
  return (
    <ChoiceField
      ownerId={ownerId}
      category={category}
      value={name}
      label={label}
      options={[
        ...known.filter(Boolean).map((v) => ({ value: v, label: v })),
        { value: "__new__", label: "Make a Variable…" },
      ]}
      onChange={(v) => {
        if (v === "__new__") setNaming(true);
        else onChange(v);
      }}
    />
  );
}

/** The pen's colour, shown as the swatch it draws with. */
function PenColourField({
  ownerId,
  colour,
  onChange,
}: {
  ownerId: string;
  colour: number;
  onChange: (colour: number) => void;
}) {
  const known = SC_PEN_SWATCHES.some((s) => s.colour === colour)
    ? SC_PEN_SWATCHES
    : [{ name: `colour ${colour}`, colour }, ...SC_PEN_SWATCHES];
  return (
    <ChoiceField
      ownerId={ownerId}
      category="pen"
      value={String(colour)}
      label="pen colour"
      lead={
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full ring-1 ring-white/70"
          style={{ background: penColourCss(colour) }}
        />
      }
      options={known.map((s) => ({ value: String(s.colour), label: s.name }))}
      onChange={(v) => onChange(Number(v))}
    />
  );
}

// ── Value slots (the ScExpr editors) ────────────────────────────────────────

const exprCategory = (expr: ScExpr): ScCategory => {
  switch (expr.kind) {
    case "var":
      return "variables";
    case "mouse-x":
    case "mouse-y":
      return "sensing";
    case "x-position":
    case "y-position":
      return "motion";
    default:
      return "operators";
  }
};

const exprKindValue = (expr: ScExpr): string =>
  expr.kind === "var" ? `var:${expr.name}` : expr.kind;

const MATH_LABEL: Record<ScMathOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

const REPORTER_WORDS: Record<string, string> = {
  "mouse-x": "mouse x",
  "mouse-y": "mouse y",
  "x-position": "x position",
  "y-position": "y position",
};

function ValueSlot({
  ownerId,
  path,
  expr,
  label,
}: {
  ownerId: string;
  path: string[];
  expr: ScExpr;
  label: string;
}) {
  const { update, ctx, readOnly, makeVariable, dragShape, setFocusedValue } = useEditor();
  const prefix = useStaticPrefix();
  const isStatic = prefix !== null;
  const tabIndex = useFieldTab(ownerId);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  const set = (next: ScExpr) =>
    update((s) => mutateStatement(s, ownerId, (st) => setStatementExpr(st, path, next)));

  const { setNodeRef, isOver } = useDroppable({
    id: `${prefix ?? ""}slot:${ownerId}:${path.join(".")}`,
    data: { type: "value-slot", ownerId, path },
    disabled: readOnly || isStatic,
  });
  const live = !isStatic && dragShape === "reporter";

  const options = [
    { value: "num", label: "a number" },
    ...ctx.variables.map((v) => ({ value: `var:${v}`, label: `${v}  (variable)` })),
    ...(ctx.isStage
      ? []
      : [
          { value: "x-position", label: "x position" },
          { value: "y-position", label: "y position" },
        ]),
    { value: "mouse-x", label: "mouse x" },
    { value: "mouse-y", label: "mouse y" },
    { value: "random", label: "pick random ( ) to ( )" },
    { value: "binop", label: "a calculation (+ − × ÷)" },
    { value: "__new__", label: "Make a Variable…" },
  ];

  const changeKind = (value: string) => {
    if (value === "__new__") {
      setNaming(true);
      return;
    }
    if (value === "num") {
      set(num(expr.kind === "num" ? expr.value : 0));
      return;
    }
    if (value.startsWith("var:")) {
      set({ kind: "var", name: value.slice(4) });
      return;
    }
    if (value === "random") {
      set({ kind: "random", min: num(1), max: num(10) });
      return;
    }
    if (value === "binop") {
      set({ kind: "binop", op: "+", left: expr, right: num(1) });
      return;
    }
    if (
      value === "mouse-x" ||
      value === "mouse-y" ||
      value === "x-position" ||
      value === "y-position"
    ) {
      set({ kind: value });
    }
  };

  const kindSelect = () =>
    isStatic ? null : (
      <select
        data-field
        aria-label={`What goes in ${label}`}
        value={exprKindValue(expr)}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
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

  const caret =
    readOnly || isStatic ? null : (
      <span className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-black/25 text-white/90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white">
        <ChevronDown className="size-3" aria-hidden />
        {kindSelect()}
      </span>
    );

  const category = exprCategory(expr);
  const hex = SC_CATEGORIES[category].hex;

  /** A reporter sitting in the slot: its own drawer's colour, its own menu. */
  const reporterPill = (text: string) => (
    <span
      className="relative inline-flex h-6 items-center gap-1 rounded-full pr-1.5 pl-2.5 text-[13px] leading-none font-semibold whitespace-nowrap"
      style={{
        background: hex,
        color: textFor(category),
        textShadow: shadowFor(category),
        boxShadow: EDGE,
      }}
    >
      {text}
      {!readOnly && !isStatic && (
        <>
          <ChevronDown className="size-3.5 shrink-0 opacity-85" aria-hidden />
          {kindSelect()}
        </>
      )}
    </span>
  );

  let body: ReactNode = null;
  if (expr.kind === "num") {
    body = (
      <>
        <NumberField
          ownerId={ownerId}
          value={expr.value}
          label={label}
          onCommit={(n) => set(num(n))}
        />
        {caret}
      </>
    );
  } else if (expr.kind === "var") {
    body = reporterPill(expr.name);
  } else if (expr.kind === "random") {
    body = (
      <span
        className="relative inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: hex, boxShadow: EDGE }}
      >
        <W category={category}>pick random</W>
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "min"]}
          expr={expr.min}
          label={`${label} lowest`}
        />
        <W category={category}>to</W>
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "max"]}
          expr={expr.max}
          label={`${label} highest`}
        />
        {caret}
      </span>
    );
  } else if (expr.kind === "binop") {
    body = (
      <span
        className="relative inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: hex, boxShadow: EDGE }}
      >
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "left"]}
          expr={expr.left}
          label={`${label} first number`}
        />
        <ChoiceField
          ownerId={ownerId}
          category={category}
          value={expr.op}
          label={`${label} sign`}
          options={(["+", "-", "*", "/"] as ScMathOp[]).map((op) => ({
            value: op,
            label: MATH_LABEL[op],
          }))}
          onChange={(op) => set({ ...expr, op: op as ScMathOp })}
        />
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "right"]}
          expr={expr.right}
          label={`${label} second number`}
        />
        {caret}
      </span>
    );
  } else {
    body = reporterPill(REPORTER_WORDS[expr.kind] ?? expr.kind);
  }

  return (
    <span
      ref={setNodeRef}
      onFocus={() => setFocusedValue({ ownerId, path })}
      className={cn(
        "inline-flex items-center gap-1 rounded-full",
        live && "ring-2 ring-white/70",
        live && isOver && "ring-2 ring-white",
      )}
    >
      {naming && !isStatic ? (
        <span className={cn(WHITE_PILL, "px-2")}>
          <input
            data-field
            autoFocus
            aria-label="Name for the new variable"
            value={draft}
            tabIndex={tabIndex}
            placeholder="name"
            onKeyDown={(e) => {
              stopKeys(e);
              if (e.key === "Enter") {
                const clean = draft.trim();
                if (clean) {
                  makeVariable(clean);
                  set({ kind: "var", name: clean });
                }
                setNaming(false);
                setDraft("");
              }
              if (e.key === "Escape") setNaming(false);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const clean = draft.trim();
              if (clean) {
                makeVariable(clean);
                set({ kind: "var", name: clean });
              }
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

// ── The test slot (the ScCond editor) ───────────────────────────────────────

const COMPARE_LABEL: Record<ScCompareOp, string> = { "<": "<", "=": "=", ">": ">" };

const condKindValue = (cond: ScCond): string => cond.kind;

function CondSlot({ ownerId, cond }: { ownerId: string; cond: ScCond }) {
  const { update, ctx, readOnly, dragShape, setFocusedCond } = useEditor();
  const prefix = useStaticPrefix();
  const isStatic = prefix !== null;
  const tabIndex = useFieldTab(ownerId);

  const set = (next: ScCond) =>
    update((s) =>
      mutateStatement(s, ownerId, (st) => (st.kind === "if" ? { ...st, cond: next } : st)),
    );

  const { setNodeRef, isOver } = useDroppable({
    id: `${prefix ?? ""}cond:${ownerId}`,
    data: { type: "cond-slot", ownerId },
    disabled: readOnly || isStatic,
  });
  const live = !isStatic && dragShape === "boolean";

  const category: ScCategory = cond.kind === "compare" ? "operators" : "sensing";
  const hex = SC_CATEGORIES[category].hex;

  const options = [
    ...(ctx.isStage
      ? []
      : [
          { value: "touching-sprite", label: "touching a sprite?" },
          { value: "touching-colour", label: "touching a colour?" },
          { value: "touching-edge", label: "touching the edge?" },
        ]),
    { value: "key-pressed", label: "key pressed?" },
    { value: "mouse-down", label: "mouse down?" },
    { value: "compare", label: "compare two numbers" },
  ];

  const changeKind = (value: string) => {
    switch (value) {
      case "touching-sprite":
        set({ kind: "touching-sprite", sprite: ctx.sprites[0]?.id ?? "" });
        return;
      case "touching-colour":
        set({ kind: "touching-colour", colour: "red" });
        return;
      case "touching-edge":
        set({ kind: "touching-edge" });
        return;
      case "key-pressed":
        set({ kind: "key-pressed", key: "space" });
        return;
      case "mouse-down":
        set({ kind: "mouse-down" });
        return;
      case "compare":
        set({ kind: "compare", op: "=", left: num(0), right: num(50) });
        return;
    }
  };

  const caret =
    readOnly || isStatic ? null : (
      <span className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-black/25 text-white/90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white">
        <ChevronDown className="size-3" aria-hidden />
        <select
          data-field
          aria-label="What the if block asks"
          value={condKindValue(cond)}
          disabled={readOnly}
          tabIndex={tabIndex}
          onKeyDown={stopKeys}
          onChange={(e) => changeKind(e.target.value)}
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

  let inside: ReactNode = null;
  switch (cond.kind) {
    case "touching-sprite":
      inside = (
        <>
          <W category={category}>touching</W>
          <ChoiceField
            ownerId={ownerId}
            category={category}
            value={cond.sprite}
            label="which sprite"
            options={ctx.sprites.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(sprite) => set({ ...cond, sprite })}
          />
          <W category={category}>?</W>
        </>
      );
      break;
    case "touching-colour":
      inside = (
        <>
          <W category={category}>touching colour</W>
          <ChoiceField
            ownerId={ownerId}
            category={category}
            value={cond.colour}
            label="which colour"
            lead={
              <span
                aria-hidden
                className="size-3.5 shrink-0 rounded-[3px] ring-1 ring-white/70"
                style={{ background: SC_COLOUR_HEX[cond.colour] }}
              />
            }
            options={SC_COLOUR_NAMES.map((c) => ({ value: c, label: c }))}
            onChange={(colour) => set({ ...cond, colour: colour as ScColourName })}
          />
          <W category={category}>?</W>
        </>
      );
      break;
    case "touching-edge":
      inside = <W category={category}>touching edge ?</W>;
      break;
    case "key-pressed":
      inside = (
        <>
          <W category={category}>key</W>
          <ChoiceField
            ownerId={ownerId}
            category={category}
            value={cond.key}
            label="which key"
            options={SC_KEYS.map((k) => ({ value: k, label: k }))}
            onChange={(key) => set({ ...cond, key: key as ScKey })}
          />
          <W category={category}>pressed ?</W>
        </>
      );
      break;
    case "mouse-down":
      inside = <W category={category}>mouse down ?</W>;
      break;
    case "compare":
      inside = (
        <>
          <ValueSlot
            ownerId={ownerId}
            path={["cond", "left"]}
            expr={cond.left}
            label="first number"
          />
          <ChoiceField
            ownerId={ownerId}
            category={category}
            value={cond.op}
            label="how to compare"
            options={(["<", "=", ">"] as ScCompareOp[]).map((op) => ({
              value: op,
              label: COMPARE_LABEL[op],
            }))}
            onChange={(op) => set({ ...cond, op: op as ScCompareOp })}
          />
          <ValueSlot
            ownerId={ownerId}
            path={["cond", "right"]}
            expr={cond.right}
            label="second number"
          />
        </>
      );
      break;
  }

  return (
    <span
      ref={setNodeRef}
      onFocus={() => setFocusedCond(ownerId)}
      className={cn(
        "inline-flex items-center",
        live && "rounded-md ring-2 ring-white/70",
        live && isOver && "ring-2 ring-white",
      )}
    >
      <Hexagon hex={hex}>
        {inside}
        {caret}
      </Hexagon>
    </span>
  );
}

// ── The words and fields of every block ─────────────────────────────────────

function StatementFields({ stmt }: { stmt: ScStatement }) {
  const { update, ctx } = useEditor();
  const category = SC_BLOCK_CATEGORY[stmt.kind];
  const set = (next: ScStatement) =>
    update((s) => mutateStatement(s, stmt.id, () => next));
  const word = (text: string) => <W category={category}>{text}</W>;

  switch (stmt.kind) {
    case "move":
      return (
        <>
          {word("move")}
          <ValueSlot ownerId={stmt.id} path={["steps"]} expr={stmt.steps} label="how many steps" />
          {word("steps")}
        </>
      );
    case "turn":
      return (
        <>
          {word("turn")}
          <span
            aria-hidden
            className="inline-flex shrink-0"
            style={{ color: textFor(category) }}
          >
            {stmt.way === "cw" ? (
              <RotateCw className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
          </span>
          <ValueSlot
            ownerId={stmt.id}
            path={["degrees"]}
            expr={stmt.degrees}
            label={`degrees to turn ${stmt.way === "cw" ? "right" : "left"}`}
          />
          {word("degrees")}
        </>
      );
    case "goto-xy":
      return (
        <>
          {word("go to x:")}
          <ValueSlot ownerId={stmt.id} path={["x"]} expr={stmt.x} label="x to go to" />
          {word("y:")}
          <ValueSlot ownerId={stmt.id} path={["y"]} expr={stmt.y} label="y to go to" />
        </>
      );
    case "glide-xy":
      return (
        <>
          {word("glide")}
          <NumberField
            ownerId={stmt.id}
            value={stmt.secs}
            label="seconds the glide takes"
            onCommit={(secs) => set({ ...stmt, secs })}
          />
          {word("secs to x:")}
          <ValueSlot ownerId={stmt.id} path={["x"]} expr={stmt.x} label="x to glide to" />
          {word("y:")}
          <ValueSlot ownerId={stmt.id} path={["y"]} expr={stmt.y} label="y to glide to" />
        </>
      );
    case "point-in-direction":
      return (
        <>
          {word("point in direction")}
          <ValueSlot
            ownerId={stmt.id}
            path={["degrees"]}
            expr={stmt.degrees}
            label="direction"
          />
        </>
      );
    case "if-on-edge-bounce":
      return word("if on edge, bounce");
    case "say":
    case "think":
      return (
        <>
          {word(stmt.kind)}
          <TextField
            ownerId={stmt.id}
            value={stmt.text}
            label={stmt.kind === "say" ? "what to say" : "what to think"}
            onCommit={(text) => set({ ...stmt, text })}
          />
          {stmt.secs !== undefined && (
            <>
              {word("for")}
              <NumberField
                ownerId={stmt.id}
                value={stmt.secs}
                label="seconds"
                onCommit={(secs) => set({ ...stmt, secs })}
              />
              {word("seconds")}
            </>
          )}
        </>
      );
    case "switch-backdrop":
      return (
        <>
          {word("switch backdrop to")}
          <ChoiceField
            ownerId={stmt.id}
            category={category}
            value={stmt.backdrop}
            label="which backdrop"
            options={(ctx.backdrops.includes(stmt.backdrop)
              ? ctx.backdrops
              : [stmt.backdrop, ...ctx.backdrops]
            ).map((b) => ({ value: b, label: b }))}
            onChange={(backdrop) => set({ ...stmt, backdrop })}
          />
        </>
      );
    case "next-backdrop":
      return word("next backdrop");
    case "switch-costume":
      return (
        <>
          {word("switch costume to")}
          <ChoiceField
            ownerId={stmt.id}
            category={category}
            value={stmt.costume}
            label="which costume"
            options={(ctx.costumes.includes(stmt.costume)
              ? ctx.costumes
              : [stmt.costume, ...ctx.costumes]
            ).map((c) => ({ value: c, label: c }))}
            onChange={(costume) => set({ ...stmt, costume })}
          />
        </>
      );
    case "next-costume":
      return word("next costume");
    case "show":
      return word("show");
    case "hide":
      return word("hide");
    case "play-sound":
      return (
        <>
          {word(stmt.untilDone ? "play sound" : "start sound")}
          <ChoiceField
            ownerId={stmt.id}
            category={category}
            value={stmt.sound}
            label="which sound"
            options={(ctx.sounds.includes(stmt.sound)
              ? ctx.sounds
              : [stmt.sound, ...ctx.sounds]
            ).map((s) => ({ value: s, label: s }))}
            onChange={(sound) => set({ ...stmt, sound })}
          />
          {stmt.untilDone && word("until done")}
        </>
      );
    case "wait":
      return (
        <>
          {word("wait")}
          <NumberField
            ownerId={stmt.id}
            value={stmt.secs}
            label="seconds to wait"
            onCommit={(secs) => set({ ...stmt, secs })}
          />
          {word("seconds")}
        </>
      );
    case "repeat":
      return (
        <>
          {word("repeat")}
          <ValueSlot
            ownerId={stmt.id}
            path={["times"]}
            expr={stmt.times}
            label="how many times"
          />
        </>
      );
    case "forever":
      return word("forever");
    case "if":
      return (
        <>
          {word("if")}
          <CondSlot ownerId={stmt.id} cond={stmt.cond} />
          {word("then")}
        </>
      );
    case "stop-all":
      return word("stop all");
    case "set-var":
      return (
        <>
          {word("set")}
          <VarField
            ownerId={stmt.id}
            category={category}
            name={stmt.name}
            label="which variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          {word("to")}
          <ValueSlot ownerId={stmt.id} path={["value"]} expr={stmt.value} label="new value" />
        </>
      );
    case "change-var":
      return (
        <>
          {word("change")}
          <VarField
            ownerId={stmt.id}
            category={category}
            name={stmt.name}
            label="which variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          {word("by")}
          <ValueSlot ownerId={stmt.id} path={["by"]} expr={stmt.by} label="how much to add" />
        </>
      );
    case "pen-down":
      return word("pen down");
    case "pen-up":
      return word("pen up");
    case "erase-all":
      return word("erase all");
    case "set-pen-colour":
      return (
        <>
          {word("set pen colour to")}
          <PenColourField
            ownerId={stmt.id}
            colour={stmt.colour}
            onChange={(colour) => set({ ...stmt, colour })}
          />
        </>
      );
    case "change-pen-colour":
      return (
        <>
          {word("change pen colour by")}
          <ValueSlot ownerId={stmt.id} path={["by"]} expr={stmt.by} label="how much" />
        </>
      );
  }
}

function HatFields({ hat }: { hat: ScHat }) {
  const { update } = useEditor();
  const category: ScCategory = "events";
  switch (hat.kind) {
    case "when-flag":
      return (
        <>
          <W category={category}>when</W>
          <Flag className="size-4 shrink-0 fill-mint-500 text-mint-600" aria-hidden />
          <W category={category}>clicked</W>
        </>
      );
    case "when-key":
      return (
        <>
          <W category={category}>when</W>
          <ChoiceField
            ownerId={hat.id}
            category={category}
            value={hat.key}
            label="which key"
            options={SC_KEYS.map((k) => ({ value: k, label: k }))}
            onChange={(key) =>
              update((s) =>
                mutateHat(s, hat.id, (h) =>
                  h.kind === "when-key" ? { ...h, key: key as ScKey } : h,
                ),
              )
            }
          />
          <W category={category}>key pressed</W>
        </>
      );
    case "when-clicked":
      return <W category={category}>when this sprite clicked</W>;
  }
}

// ── Stacks, blocks and hats ─────────────────────────────────────────────────

function EmptySlot({ containerKey }: { containerKey: ContainerKey }) {
  const { selection, select, readOnly } = useEditor();
  const isStatic = useStaticPrefix() !== null;
  const active = selection?.kind === "slot" && selection.container === containerKey;
  // In the palette the mouth of a loop is just an empty gap, as it is in Scratch.
  if (isStatic) return <span className="block h-6 min-w-[56px]" />;
  if (readOnly) return <span className="block min-h-8 min-w-[150px]" />;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        select({ kind: "slot", container: containerKey });
      }}
      className={cn(
        "flex min-h-9 w-full min-w-[186px] cursor-pointer items-center gap-2 rounded-[4px] border-2 border-dashed px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
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
  items: ScStatement[];
  depth: number;
}) {
  const { dragShape, readOnly } = useEditor();
  const prefix = useStaticPrefix();
  const { setNodeRef, isOver } = useDroppable({
    id: `${prefix ?? ""}container:${containerKey}`,
    data: { type: "container", container: containerKey, depth },
    disabled: readOnly || prefix !== null,
  });
  const wanted = dragShape === "stack" || dragShape === "c";
  return (
    <div
      ref={setNodeRef}
      // No vertical rhythm on purpose: blocks butt together so the tab of one
      // sits in the dent of the next, exactly as Scratch snaps them.
      className={cn(
        "min-w-max",
        wanted && isOver && "outline-2 outline-offset-2 outline-dashed outline-brand-500",
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
 * The mouth of a C-block: a 16px wall down the left, then the child stack over
 * the page itself. The cavity is genuinely transparent — that is what makes the
 * blocks inside read as being *inside* the loop rather than painted on it.
 */
function Cavity({
  hex,
  containerKey,
  items,
  depth,
}: {
  hex: string;
  containerKey: ContainerKey;
  items: ScStatement[];
  depth: number;
}) {
  return (
    <div className="flex">
      <span aria-hidden className="shrink-0" style={{ background: hex, width: RAIL }} />
      <div className="relative min-w-[186px]">
        {items.length > 0 && <Tab hex={hex} className="top-0" />}
        <StackList containerKey={containerKey} items={items} depth={depth} />
      </div>
    </div>
  );
}

const BLOCK_BUTTON =
  "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition after:absolute after:-inset-[2px] after:content-['']";

function BlockTools({
  label,
  onDelete,
  category,
  dragRef,
  listeners,
}: {
  label: string;
  onDelete: () => void;
  category: ScCategory;
  dragRef?: (el: HTMLElement | null) => void;
  listeners?: Record<string, unknown>;
}) {
  const tone = inkText(category)
    ? "text-ink-900/60 hover:text-ink-900 hover:bg-black/10"
    : "text-white/75 hover:text-white hover:bg-black/20";
  return (
    <span className="ml-1 flex shrink-0 items-center gap-1">
      <button
        ref={dragRef}
        {...listeners}
        type="button"
        tabIndex={-1}
        aria-label={`Drag ${label}`}
        className={cn(BLOCK_BUTTON, tone, "cursor-grab touch-none active:cursor-grabbing")}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Delete ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(BLOCK_BUTTON, tone)}
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

/** The ⊕ that grows an "else" onto an if block. */
function ElseToggle({ stmt }: { stmt: Extract<ScStatement, { kind: "if" }> }) {
  const { readOnly, update, say } = useEditor();
  const tabIndex = useFieldTab(stmt.id);
  const isStatic = useStaticPrefix() !== null;
  if (readOnly || isStatic) return null;
  const hasElse = Boolean(stmt.otherwise);
  return (
    <button
      data-field
      type="button"
      tabIndex={tabIndex}
      onKeyDown={stopKeys}
      aria-label={hasElse ? "Remove the else part" : "Add an else part"}
      onClick={() => {
        update((s) =>
          mutateStatement(s, stmt.id, (current) => {
            if (current.kind !== "if") return current;
            return hasElse
              ? { id: current.id, kind: "if", cond: current.cond, then: current.then }
              : { ...current, otherwise: [] };
          }),
        );
        say(
          hasElse
            ? "Removed the else part."
            : "Added an else part — those blocks run when the answer is no.",
        );
      }}
      className="relative flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/15 text-ink-900 ring-1 ring-ink-900/30 after:absolute after:-inset-[6px] after:content-[''] hover:bg-black/25"
    >
      {hasElse ? <Minus className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
    </button>
  );
}

function BlockNode({
  stmt,
  container,
  index,
  depth,
}: {
  stmt: ScStatement;
  container: ContainerKey;
  index: number;
  depth: number;
}) {
  const editor = useEditor();
  const isStatic = useStaticPrefix() !== null;
  const category = SC_BLOCK_CATEGORY[stmt.kind];
  const hex = SC_CATEGORIES[category].hex;
  const shell = asShell(stmt);
  const label = scStatementLabel(stmt);
  const selected =
    editor.selection?.kind === "statement" && editor.selection.id === stmt.id;
  const running = editor.activeIds.includes(stmt.id);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: stmt.id,
      data: { type: "statement", container, index, stmtId: stmt.id },
      disabled: editor.readOnly || isStatic,
    });

  const dropping =
    (editor.dragShape === "stack" || editor.dragShape === "c") &&
    editor.overId === stmt.id &&
    editor.activeDragId !== stmt.id;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const mine = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === " ") {
      (listeners?.onKeyDown as ((event: ReactKeyboardEvent) => void) | undefined)?.(e);
      mine();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      mine();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      if (e.ctrlKey || e.metaKey || e.altKey) editor.moveWithin(stmt.id, delta);
      else editor.navigate(stmt.id, delta);
      return;
    }
    if (e.key === "ArrowRight") {
      mine();
      editor.navigateInto(stmt.id);
      return;
    }
    if (e.key === "ArrowLeft") {
      mine();
      editor.navigateOut(stmt.id);
      return;
    }
    if (e.key === "Enter") {
      mine();
      editor.focusFirstField(stmt.id);
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      mine();
      editor.removeBlock(stmt.id);
      return;
    }
    if (e.key === "Escape") {
      mine();
      editor.select(null);
    }
  };

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
          className="pointer-events-none absolute -top-[3px] left-0 z-20 h-1.5 w-full rounded-full bg-brand-500 shadow-glow"
          aria-hidden
        />
      )}
      <div
        {...(isStatic ? {} : attributes)}
        role="group"
        aria-roledescription="block"
        aria-label={label}
        data-block={stmt.id}
        ref={(el) => editor.registerNode(stmt.id, el)}
        tabIndex={!isStatic && editor.tabTargetId === stmt.id ? 0 : -1}
        onKeyDown={isStatic ? undefined : onKeyDown}
        onFocus={(e) => {
          if (isStatic) return;
          const owner = (e.target as HTMLElement).closest("[data-block]");
          if (owner?.getAttribute("data-block") === stmt.id)
            editor.select({ kind: "statement", id: stmt.id });
        }}
        onClick={(e) => {
          if (isStatic) return;
          if ((e.target as HTMLElement).closest("[data-block]") === e.currentTarget)
            editor.select({ kind: "statement", id: stmt.id });
        }}
        className="relative outline-none"
      >
        <div className="relative">
          <Face
            hex={hex}
            radius={shell ? `${RADIUS}px ${RADIUS}px 0 0` : `${RADIUS}px`}
            socket
          />
          <div className="relative flex min-h-9 items-center gap-1 py-1 pr-1 pl-3">
            <StatementFields stmt={stmt} />
            {!editor.readOnly && !isStatic && (
              <BlockTools
                label={label}
                category={category}
                onDelete={() => editor.removeBlock(stmt.id)}
                dragRef={setActivatorNodeRef}
                listeners={listeners}
              />
            )}
          </div>
        </div>

        {shell && (
          <>
            <Cavity
              hex={hex}
              containerKey={ckey(shell.id, shell.kind === "if" ? "then" : "body")}
              items={shell.kind === "if" ? shell.then : shell.body}
              depth={depth + 1}
            />
            {shell.kind === "if" && shell.otherwise && (
              <>
                <div className="relative">
                  <Face hex={hex} radius="0" />
                  <p
                    className="relative px-3 py-1.5 text-[13.5px] font-semibold"
                    style={{ color: textFor(category), textShadow: shadowFor(category) }}
                  >
                    else
                  </p>
                </div>
                <Cavity
                  hex={hex}
                  containerKey={ckey(shell.id, "else")}
                  items={shell.otherwise}
                  depth={depth + 1}
                />
              </>
            )}
            <div className="relative">
              <Face hex={hex} radius={`0 0 ${RADIUS}px ${RADIUS}px`} />
              <div
                className="relative flex items-center px-2"
                style={{ minHeight: shell.kind === "if" ? 28 : RAIL }}
              >
                {shell.kind === "if" && <ElseToggle stmt={shell} />}
              </div>
            </div>
          </>
        )}
        {/* `forever` is the one block Scratch gives no tab: nothing can follow it. */}
        {stmt.kind !== "forever" && stmt.kind !== "stop-all" && (
          <Tab hex={hex} className="top-full" />
        )}
        {running && <RunGlow />}
        {selected && !running && <SelectRing />}
      </div>
    </div>
  );
}

function HatNode({ hat }: { hat: ScHat }) {
  const editor = useEditor();
  const isStatic = useStaticPrefix() !== null;
  const hex = SC_CATEGORIES.events.hex;
  const label = scHatLabel(hat);
  const selected = editor.selection?.kind === "hat" && editor.selection.id === hat.id;
  const running = editor.activeIds.includes(hat.id);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const mine = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      mine();
      editor.navigate(hat.id, e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "ArrowRight") {
      mine();
      editor.navigateInto(hat.id);
      return;
    }
    if (e.key === "Enter") {
      mine();
      editor.focusFirstField(hat.id);
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      mine();
      editor.removeBlock(hat.id);
      return;
    }
    if (e.key === "Escape") {
      mine();
      editor.select(null);
    }
  };

  return (
    <div
      role="group"
      aria-roledescription="event block"
      aria-label={label}
      data-block={hat.id}
      ref={(el) => editor.registerNode(hat.id, el)}
      tabIndex={!isStatic && editor.tabTargetId === hat.id ? 0 : -1}
      onKeyDown={isStatic ? undefined : onKeyDown}
      onFocus={(e) => {
        if (isStatic) return;
        const owner = (e.target as HTMLElement).closest("[data-block]");
        if (owner?.getAttribute("data-block") === hat.id)
          editor.select({ kind: "hat", id: hat.id });
      }}
      onClick={(e) => {
        if (isStatic) return;
        if ((e.target as HTMLElement).closest("[data-block]") === e.currentTarget)
          editor.select({ kind: "hat", id: hat.id });
      }}
      // mt-5 leaves room for the arch, which overhangs the block.
      className={cn("animate-fade-up relative w-max outline-none", !isStatic && "mt-5")}
    >
      <div className="relative">
        <Dome hex={hex} />
        <Face hex={hex} radius={`${RADIUS}px ${RADIUS}px 0 0`} />
        <div className="relative flex min-h-9 items-center gap-1 py-1 pr-1 pl-3">
          <HatFields hat={hat} />
          {!editor.readOnly && !isStatic && (
            <span className="ml-1 flex shrink-0">
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Delete ${label} and every block under it`}
                onClick={(e) => {
                  e.stopPropagation();
                  editor.removeBlock(hat.id);
                }}
                className={cn(
                  BLOCK_BUTTON,
                  "text-ink-900/60 hover:bg-black/10 hover:text-ink-900",
                )}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </span>
          )}
        </div>
      </div>
      <Cavity hex={hex} containerKey={ckey(hat.id, "body")} items={hat.body} depth={1} />
      <div
        aria-hidden
        style={{
          background: hex,
          height: RAIL,
          borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          boxShadow: EDGE,
        }}
      />
      {running && <RunGlow />}
      {selected && !running && <SelectRing />}
    </div>
  );
}

// ── The palette ─────────────────────────────────────────────────────────────

/** A palette block, drawn as the block it makes — same shapes, same colours. */
function MiniBlock({
  entry,
  ctx,
  prefix,
}: {
  entry: ScPaletteEntry;
  ctx: ScEditorContext;
  prefix: string;
}) {
  const id = previewIds(`${prefix}-${entry.key}`);

  if (entry.shape === "reporter") {
    const expr = entry.expr(ctx);
    return (
      <StaticCtx.Provider value={`${prefix}:`}>
        <span className="inline-flex">
          <ValueSlot ownerId={`preview-${prefix}-${entry.key}`} path={[]} expr={expr} label="" />
        </span>
      </StaticCtx.Provider>
    );
  }
  if (entry.shape === "boolean") {
    return (
      <StaticCtx.Provider value={`${prefix}:`}>
        <span className="inline-flex">
          <CondSlot ownerId={`preview-${prefix}-${entry.key}`} cond={entry.cond(ctx)} />
        </span>
      </StaticCtx.Provider>
    );
  }
  if (entry.shape === "hat") {
    return (
      <StaticCtx.Provider value={`${prefix}:`}>
        <span className="relative mt-4 block">
          <HatNode hat={entry.hat(id, ctx)} />
        </span>
      </StaticCtx.Provider>
    );
  }
  return (
    <StaticCtx.Provider value={`${prefix}:`}>
      <span className="relative block">
        <BlockNode
          stmt={entry.stmt(id, ctx)}
          container={`${prefix}::body`}
          index={0}
          depth={1}
        />
      </span>
    </StaticCtx.Provider>
  );
}

function PaletteItem({
  entry,
  ctx,
  onAdd,
  label,
  dragId,
  disabled = false,
}: {
  entry: ScPaletteEntry;
  ctx: ScEditorContext;
  onAdd: (entry: ScPaletteEntry) => void;
  label: string;
  /** Two copies of one block can be on screen at once, so each needs its own id. */
  dragId?: string;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? `palette:${entry.key}`,
    data: { type: "palette", entry },
    disabled,
  });
  return (
    <div
      className={cn(
        "relative w-max max-w-full",
        isDragging && "opacity-40",
        disabled && "opacity-60",
      )}
    >
      <div aria-hidden className="pointer-events-none">
        <MiniBlock entry={entry} ctx={ctx} prefix="palette" />
      </div>
      {/* One real button over the picture: click adds the block, drag places it. */}
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        title={entry.help}
        aria-label={`${label}. ${entry.help}`}
        onClick={() => onAdd(entry)}
        className={cn(
          "absolute inset-0 rounded-[6px] touch-none",
          disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      />
    </div>
  );
}

function Palette({
  entries,
  ctx,
  active,
  categories,
  onSelect,
  onAdd,
  onMakeVariable,
  labelOf,
  readOnly,
}: {
  entries: ScPaletteEntry[];
  ctx: ScEditorContext;
  active: ScCategory;
  categories: ScCategory[];
  onSelect: (category: ScCategory) => void;
  onAdd: (entry: ScPaletteEntry) => void;
  onMakeVariable: (name: string) => void;
  labelOf: (entry: ScPaletteEntry) => string;
  readOnly: boolean;
}) {
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");
  const drawer = entries.filter((entry) => entry.category === active);
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card lg:w-[318px]">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
        <Blocks className="size-4 text-brand-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold text-ink-900">Blocks</h3>
          <p className="text-[11px] text-ink-400">Click to add · drag to place</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Block categories"
          className="thin-scroll max-h-[58vh] w-[104px] shrink-0 overflow-y-auto border-r border-ink-100 py-1"
        >
          {categories.map((id) => {
            const meta = SC_CATEGORIES[id];
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex min-h-9 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[13px] font-semibold transition-colors",
                  on ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50",
                )}
              >
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full ring-1 ring-ink-900/15"
                  style={{ background: meta.hex }}
                />
                {meta.label}
              </button>
            );
          })}
        </nav>
        <div className="thin-scroll max-h-[58vh] min-w-0 flex-1 overflow-auto bg-ink-50/70 p-3">
          {readOnly && (
            <p className="mb-3 rounded-md bg-amber-100 px-2.5 py-2 text-[12px] leading-snug font-medium text-amber-700">
              The project is running. Press the stop sign to change the blocks.
            </p>
          )}
          {!readOnly && active === "variables" &&
            (naming ? (
              <form
                className="mb-3 flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const clean = draft.trim();
                  if (clean) onMakeVariable(clean);
                  setDraft("");
                  setNaming(false);
                }}
              >
                <input
                  autoFocus
                  aria-label="Name for the new variable"
                  value={draft}
                  maxLength={20}
                  placeholder="counter"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setNaming(false);
                  }}
                  className="h-9 min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-2.5 text-[13px] font-semibold text-ink-900 outline-none focus-visible:border-brand-500"
                />
                <button
                  type="submit"
                  className="h-9 cursor-pointer rounded-md bg-brand-600 px-3 text-[13px] font-semibold text-white hover:bg-brand-700"
                >
                  Make
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setNaming(true)}
                className="mb-3 flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-800 hover:border-ink-300 hover:bg-ink-50"
              >
                <Plus className="size-3.5" aria-hidden />
                Make a Variable
              </button>
            ))}
          <div className="flex w-max min-w-full flex-col items-start gap-2">
            {drawer.map((entry) => (
              <PaletteItem
                key={entry.key}
                entry={entry}
                ctx={ctx}
                onAdd={onAdd}
                label={labelOf(entry)}
                disabled={readOnly}
              />
            ))}
            {drawer.length === 0 && (
              <p className="text-[12.5px] text-ink-400">
                This drawer is empty for the Stage — select a sprite to use it.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Which drop targets are live for what is being dragged ───────────────────

function acceptsDrag(
  data: Record<string, unknown> | undefined,
  shape: ScShape | null,
): boolean {
  if (!data || !shape) return false;
  switch (shape) {
    case "hat":
      return data.type === "canvas";
    case "stack":
    case "c":
      return data.type === "container" || data.type === "statement";
    case "reporter":
      return data.type === "value-slot";
    case "boolean":
      return data.type === "cond-slot";
  }
}

interface FlatNode {
  id: string;
  type: "hat" | "statement";
  container: ContainerKey | null;
  index: number;
  depth: number;
}

function flatten(scripts: ScHat[]): {
  nodes: FlatNode[];
  depths: Map<ContainerKey, number>;
} {
  const nodes: FlatNode[] = [];
  const depths = new Map<ContainerKey, number>();
  const walk = (list: ScStatement[], container: ContainerKey, depth: number) => {
    depths.set(container, depth);
    list.forEach((stmt, index) => {
      nodes.push({ id: stmt.id, type: "statement", container, index, depth });
      switch (stmt.kind) {
        case "repeat":
        case "forever":
          walk(stmt.body, ckey(stmt.id, "body"), depth + 1);
          break;
        case "if":
          walk(stmt.then, ckey(stmt.id, "then"), depth + 1);
          if (stmt.otherwise) walk(stmt.otherwise, ckey(stmt.id, "else"), depth + 1);
          break;
        default:
          break;
      }
    });
  };
  scripts.forEach((hat, index) => {
    nodes.push({ id: hat.id, type: "hat", container: null, index, depth: 0 });
    walk(hat.body, ckey(hat.id, "body"), 1);
  });
  return { nodes, depths };
}

// ── The editor ──────────────────────────────────────────────────────────────

const BASE_HINT =
  "Click a block to add it where the blue outline is — or drag it exactly where you want it.";

function ScratchBlocksEditor({
  scripts,
  onChange,
  context,
  categories = SC_CATEGORY_ORDER,
  readOnly = false,
  activeIds = [],
  onMakeVariable,
  className,
}: {
  scripts: ScHat[];
  onChange: (scripts: ScHat[]) => void;
  context: ScEditorContext;
  /** Drawers on offer — early lessons keep the palette small. */
  categories?: ScCategory[];
  readOnly?: boolean;
  /** Blocks the runtime is executing right now; they glow, as in Scratch. */
  activeIds?: string[];
  onMakeVariable?: (name: string) => void;
  className?: string;
}) {
  const [selection, setSelection] = useState<ScSelection | null>(null);
  const [focusedValue, setFocusedValue] = useState<FocusedValue | null>(null);
  const [focusedCond, setFocusedCond] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<ScCategory>(categories[0] ?? "motion");
  const [dragShape, setDragShape] = useState<ScShape | null>(null);
  const [dragEntry, setDragEntry] = useState<ScPaletteEntry | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [hint, setHint] = useState(BASE_HINT);

  const nodes = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<string | null>(null);
  const lastDragEnd = useRef(0);
  const dragShapeRef = useRef<ScShape | null>(null);

  const entries = useMemo(() => buildPalette(context), [context]);
  const { nodes: flat, depths } = useMemo(() => flatten(scripts), [scripts]);

  /** Drawers this lesson offers that actually hold something for this target. */
  const drawers = useMemo(
    () =>
      SC_CATEGORY_ORDER.filter(
        (id) => categories.includes(id) && entries.some((e) => e.category === id),
      ),
    [categories, entries],
  );
  // Derived, not synchronised: a drawer the lesson has closed simply falls back.
  const activeDrawer = drawers.includes(activeCat) ? activeCat : drawers[0] ?? "motion";

  const say = useCallback((message: string) => setHint(message), []);
  const update = useCallback(
    (fn: (list: ScHat[]) => ScHat[]) => onChange(fn(scripts)),
    [onChange, scripts],
  );

  const registerNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  }, []);

  const focusBlock = useCallback((id: string) => {
    nodes.current.get(id)?.focus();
  }, []);

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    focusBlock(id);
  }, [scripts, focusBlock]);

  const tabTargetId = useMemo(() => {
    if (selection && selection.kind !== "slot") return selection.id;
    return flat[0]?.id ?? null;
  }, [selection, flat]);

  const makeVariable = useCallback(
    (name: string) => {
      onMakeVariable?.(name);
      say(`Made the variable “${name}”.`);
    },
    [onMakeVariable, say],
  );

  const labelOf = useCallback(
    (entry: ScPaletteEntry): string => {
      const id = previewIds(`label-${entry.key}`);
      switch (entry.shape) {
        case "hat":
          return scHatLabel(entry.hat(id, context));
        case "reporter":
          return describeExpr(entry.expr(context));
        case "boolean":
          return describeCond(entry.cond(context));
        default:
          return scStatementLabel(entry.stmt(id, context));
      }
    },
    [context],
  );

  /** Where a clicked palette block lands: after the selection, or at the end. */
  const insertionPoint = useCallback((): { container: ContainerKey; index: number } | null => {
    if (selection?.kind === "slot") {
      const list = getList(scripts, selection.container);
      return list ? { container: selection.container, index: list.length } : null;
    }
    if (selection?.kind === "hat") {
      const hat = scripts.find((h) => h.id === selection.id);
      if (hat) return { container: ckey(hat.id, "body"), index: hat.body.length };
    }
    if (selection?.kind === "statement") {
      const node = flat.find((n) => n.id === selection.id);
      if (node?.container) return { container: node.container, index: node.index + 1 };
    }
    const last = scripts[scripts.length - 1];
    return last ? { container: ckey(last.id, "body"), index: last.body.length } : null;
  }, [selection, scripts, flat]);

  const addEntry = useCallback(
    (entry: ScPaletteEntry) => {
      if (readOnly) return;
      if (Date.now() - lastDragEnd.current < 200) return; // the click that ends a drag

      if (entry.shape === "hat") {
        const hat = entry.hat(scId, context);
        onChange([...scripts, hat]);
        setSelection({ kind: "hat", id: hat.id });
        pendingFocus.current = hat.id;
        say("Added the hat block. Now click blocks to hang under it.");
        return;
      }

      if (entry.shape === "stack" || entry.shape === "c") {
        const target = insertionPoint();
        if (!target) {
          say("Start with a hat block from Events — a script needs something to start it.");
          return;
        }
        const stmt = entry.stmt(scId, context);
        if (
          (stmt.kind === "repeat" || stmt.kind === "forever" || stmt.kind === "if") &&
          (depths.get(target.container) ?? 1) >= MAX_DEPTH
        ) {
          say("That stack is already deeply nested — build this part somewhere shallower.");
          return;
        }
        onChange(insertStatement(scripts, target.container, target.index, stmt));
        setSelection({ kind: "statement", id: stmt.id });
        pendingFocus.current = stmt.id;
        say(`Added “${scStatementLabel(stmt)}”.`);
        return;
      }

      if (entry.shape === "boolean") {
        // Hoisted out of the callback below: TypeScript forgets what `entry` is
        // narrowed to once it crosses into a nested function.
        const cond = entry.cond(context);
        const owner =
          focusedCond ??
          (selection?.kind === "statement" &&
          findStatement(scripts, selection.id)?.kind === "if"
            ? selection.id
            : null);
        if (owner) {
          onChange(
            mutateStatement(scripts, owner, (st) =>
              st.kind === "if" ? { ...st, cond } : st,
            ),
          );
          say("Dropped the question into the if block.");
          return;
        }
        say("Select an if block first, then click this question.");
        return;
      }

      if (focusedValue) {
        const value = entry.expr(context);
        onChange(
          mutateStatement(scripts, focusedValue.ownerId, (st) =>
            setStatementExpr(st, focusedValue.path, value),
          ),
        );
        say("Dropped it into the slot you last used.");
        return;
      }
      say("Click a white slot inside a block first, then click this one.");
    },
    [
      readOnly,
      context,
      scripts,
      onChange,
      insertionPoint,
      depths,
      selection,
      focusedCond,
      focusedValue,
      say,
    ],
  );

  const removeBlock = useCallback(
    (id: string) => {
      if (readOnly) return;
      const node = flat.find((n) => n.id === id);
      if (!node) return;
      const neighbour =
        flat.filter((n) => n.container === node.container && n.id !== id)[
          Math.max(0, node.index - 1)
        ]?.id ?? (node.container ? ownerOf(node.container) : null);
      if (node.type === "hat") {
        onChange(scripts.filter((h) => h.id !== id));
        say("Deleted the hat block and everything under it.");
      } else {
        onChange(removeStatement(scripts, id).scripts);
        say("Deleted the block.");
      }
      if (neighbour) {
        setSelection(
          scripts.some((h) => h.id === neighbour)
            ? { kind: "hat", id: neighbour }
            : { kind: "statement", id: neighbour },
        );
        pendingFocus.current = neighbour;
      } else {
        setSelection(null);
      }
    },
    [readOnly, flat, scripts, onChange, say],
  );

  const moveWithin = useCallback(
    (id: string, delta: number) => {
      if (readOnly) return;
      const node = flat.find((n) => n.id === id);
      if (!node?.container) return;
      const list = getList(scripts, node.container);
      if (!list) return;
      const to = node.index + delta;
      if (to < 0 || to >= list.length) {
        say("That block is already at the end of its stack.");
        return;
      }
      onChange(editList(scripts, node.container, (l) => arrayMove(l, node.index, to)));
      pendingFocus.current = id;
      say(`Moved the block ${delta > 0 ? "down" : "up"}.`);
    },
    [readOnly, flat, scripts, onChange, say],
  );

  const navigate = useCallback(
    (id: string, delta: number) => {
      const at = flat.findIndex((n) => n.id === id);
      const next = flat[at + delta];
      if (!next) return;
      setSelection(
        next.type === "hat"
          ? { kind: "hat", id: next.id }
          : { kind: "statement", id: next.id },
      );
      focusBlock(next.id);
    },
    [flat, focusBlock],
  );

  const focusFirstField = useCallback((id: string) => {
    const root = nodes.current.get(id);
    if (!root) return;
    const field = Array.from(root.querySelectorAll<HTMLElement>("[data-field]")).find(
      (el) => el.closest("[data-block]") === root,
    );
    field?.focus();
  }, []);

  const navigateInto = useCallback(
    (id: string) => {
      const at = flat.findIndex((n) => n.id === id);
      const here = flat[at];
      const next = flat[at + 1];
      if (here && next && next.depth > here.depth) {
        setSelection({ kind: "statement", id: next.id });
        focusBlock(next.id);
        return;
      }
      focusFirstField(id);
    },
    [flat, focusBlock, focusFirstField],
  );

  const navigateOut = useCallback(
    (id: string) => {
      const at = flat.findIndex((n) => n.id === id);
      const here = flat[at];
      if (!here) return;
      for (let i = at - 1; i >= 0; i -= 1) {
        if (flat[i].depth < here.depth) {
          setSelection(
            flat[i].type === "hat"
              ? { kind: "hat", id: flat[i].id }
              : { kind: "statement", id: flat[i].id },
          );
          focusBlock(flat[i].id);
          return;
        }
      }
    },
    [flat, focusBlock],
  );

  // ── Drag and drop ────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const live = args.droppableContainers.filter((c) =>
      acceptsDrag(c.data.current, dragShapeRef.current),
    );
    if (live.length === 0) return [];
    const scoped = { ...args, droppableContainers: live };
    const pointer = pointerWithin(scoped);
    const hits = pointer.length > 0 ? pointer : rectIntersection(scoped);
    if (hits.length === 0) return hits;
    const precise = hits.filter((h) => !isContainerId(h.id) && h.id !== CANVAS_ID);
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

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    setActiveDragId(String(e.active.id));
    const entry = data?.type === "palette" ? (data.entry as ScPaletteEntry) : null;
    // The ref, not the state, is what collision detection reads: it has to be
    // right on the very first move, before React has re-rendered.
    dragShapeRef.current = entry ? entry.shape : "stack";
    setDragEntry(entry);
    setDragShape(dragShapeRef.current);
  };

  const onDragOver = (e: DragOverEvent) => setOverId(e.over ? String(e.over.id) : null);

  const clearDrag = () => {
    dragShapeRef.current = null;
    setActiveDragId(null);
    setOverId(null);
    setDragShape(null);
    setDragEntry(null);
    lastDragEnd.current = Date.now();
  };

  const targetOf = (
    data: Record<string, unknown> | undefined,
  ): { container: ContainerKey; index: number } | null => {
    if (!data) return null;
    if (data.type === "statement")
      return { container: data.container as ContainerKey, index: data.index as number };
    if (data.type === "container") {
      const container = data.container as ContainerKey;
      return { container, index: getList(scripts, container)?.length ?? 0 };
    }
    return null;
  };

  const onDragEnd = (e: DragEndEvent) => {
    const active = e.active.data.current;
    const over = e.over?.data.current;
    clearDrag();
    if (readOnly || !e.over || !active || !over) return;

    // 1 — a new block out of the palette
    if (active.type === "palette") {
      const entry = active.entry as ScPaletteEntry;

      if (entry.shape === "hat") {
        const hat = entry.hat(scId, context);
        onChange([...scripts, hat]);
        setSelection({ kind: "hat", id: hat.id });
        pendingFocus.current = hat.id;
        say("Added the hat block.");
        return;
      }
      if (entry.shape === "stack" || entry.shape === "c") {
        const target = targetOf(over);
        if (!target) return;
        const stmt = entry.stmt(scId, context);
        if (
          (stmt.kind === "repeat" || stmt.kind === "forever" || stmt.kind === "if") &&
          (depths.get(target.container) ?? 1) >= MAX_DEPTH
        ) {
          say("That stack is already deeply nested — try a shallower place.");
          return;
        }
        onChange(insertStatement(scripts, target.container, target.index, stmt));
        setSelection({ kind: "statement", id: stmt.id });
        pendingFocus.current = stmt.id;
        say(`Added “${scStatementLabel(stmt)}”.`);
        return;
      }
      if (entry.shape === "reporter" && over.type === "value-slot") {
        onChange(
          mutateStatement(scripts, over.ownerId as string, (st) =>
            setStatementExpr(st, over.path as string[], entry.expr(context)),
          ),
        );
        say("Dropped it into the block.");
        return;
      }
      if (entry.shape === "boolean" && over.type === "cond-slot") {
        onChange(
          mutateStatement(scripts, over.ownerId as string, (st) =>
            st.kind === "if" ? { ...st, cond: entry.cond(context) } : st,
          ),
        );
        say("Dropped the question into the if block.");
      }
      return;
    }

    // 2 — moving a block that is already in a script
    if (active.type === "statement") {
      const stmtId = active.stmtId as string;
      const from = active.container as ContainerKey;
      const fromIndex = active.index as number;
      const target = targetOf(over);
      if (!target) return;

      if (target.container === from) {
        const list = getList(scripts, from) ?? [];
        const to = over.type === "statement" ? (over.index as number) : list.length - 1;
        if (to === fromIndex) return;
        onChange(editList(scripts, from, (l) => arrayMove(l, fromIndex, to)));
        pendingFocus.current = stmtId;
        say("Moved the block.");
        return;
      }

      const moving = findStatement(scripts, stmtId);
      if (!moving) return;
      if (collectIds(moving).includes(ownerOf(target.container))) {
        say("A block cannot be dropped inside itself.");
        return;
      }
      if (
        (moving.kind === "repeat" || moving.kind === "forever" || moving.kind === "if") &&
        (depths.get(target.container) ?? 1) >= MAX_DEPTH
      ) {
        say("That stack is already deeply nested — try a shallower place.");
        return;
      }
      const { scripts: without, removed } = removeStatement(scripts, stmtId);
      if (!removed) return;
      onChange(insertStatement(without, target.container, target.index, removed));
      setSelection({ kind: "statement", id: stmtId });
      pendingFocus.current = stmtId;
      say("Moved the block into another stack.");
    }
  };

  const api: EditorApi = {
    readOnly,
    ctx: context,
    activeIds,
    selection,
    select: setSelection,
    tabTargetId,
    update,
    removeBlock,
    moveWithin,
    navigate,
    navigateInto,
    navigateOut,
    focusFirstField,
    registerNode,
    setFocusedValue,
    setFocusedCond,
    makeVariable,
    say,
    dragShape,
    activeDragId,
    overId,
  };

  const dragged =
    dragShape !== null && !dragEntry && activeDragId
      ? findStatement(scripts, activeDragId)
      : null;

  const flagEntry = entries.find((entry) => entry.key === "when-flag");

  return (
    <DndContext
      // Fixed id — dnd-kit otherwise numbers its aria ids from a module
      // counter, which drifts between the prerendered HTML and the client.
      id="sc-block-editor"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
      <EditorCtx.Provider value={api}>
        <div className={cn("flex flex-col gap-3 lg:flex-row", className)}>
          {/* The palette stays put while the project runs — dimmed, not gone.
              A drawer that vanished mid-run would jump the whole layout under
              a teacher who is mid-sentence. */}
          <Palette
            entries={entries}
            ctx={context}
            active={activeDrawer}
            categories={drawers}
            onSelect={setActiveCat}
            onAdd={addEntry}
            onMakeVariable={makeVariable}
            labelOf={labelOf}
            readOnly={readOnly}
          />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-900 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
                  Code
                </p>
                <h3 className="truncate font-display text-[15px] font-semibold text-white">
                  {context.targetName}
                </h3>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-ink-100">
                {scripts.length} {scripts.length === 1 ? "script" : "scripts"}
              </span>
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
              {scripts.length === 0 ? (
                <div className="mt-3 flex h-full min-h-56 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-ink-300 bg-white/70 p-6 text-center">
                  <p className="max-w-sm text-[14px] text-ink-500">
                    Every script starts with a hat block from{" "}
                    <span className="font-semibold text-ink-700">Events</span>. Click one
                    to start.
                  </p>
                  {!readOnly && flagEntry && (
                    <PaletteItem
                      entry={flagEntry}
                      ctx={context}
                      onAdd={addEntry}
                      label={labelOf(flagEntry)}
                      dragId="empty:when-flag"
                    />
                  )}
                </div>
              ) : (
                scripts.map((hat) => <HatNode key={hat.id} hat={hat} />)
              )}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 border-t border-ink-100 px-4 py-2 text-[12.5px] text-ink-500"
            >
              <Keyboard className="size-3.5 shrink-0 text-ink-300" aria-hidden />
              <span className="min-w-0 flex-1">{hint}</span>
              <span className="hidden shrink-0 font-mono text-[11px] text-ink-300 md:inline">
                ↑↓ move · Enter edit · Ctrl+↑↓ reorder · Del remove
              </span>
            </p>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragEntry && (
            <span className="block w-max drop-shadow-lg">
              <MiniBlock entry={dragEntry} ctx={context} prefix="overlay" />
            </span>
          )}
          {dragged && (
            <span
              className="inline-flex min-h-9 items-center rounded-[5px] px-3 text-[13.5px] font-semibold whitespace-nowrap shadow-pop"
              style={{
                background: SC_CATEGORIES[SC_BLOCK_CATEGORY[dragged.kind]].hex,
                color: textFor(SC_BLOCK_CATEGORY[dragged.kind]),
                textShadow: shadowFor(SC_BLOCK_CATEGORY[dragged.kind]),
              }}
            >
              {scStatementLabel(dragged)}
            </span>
          )}
        </DragOverlay>
      </EditorCtx.Provider>
    </DndContext>
  );
}

/**
 * Memoised on purpose. While a project runs, the stage reports back about
 * thirty times a second and nothing in the editor has changed — without this,
 * every one of those ticks would redraw the whole palette and every block in
 * it. Keep the props stable (see the studio) and a running project costs the
 * editor nothing.
 */
export const ScratchBlocks = memo(ScratchBlocksEditor);
