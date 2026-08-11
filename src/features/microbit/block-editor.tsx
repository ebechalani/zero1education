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
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  Blocks,
  ChevronDown,
  GripVertical,
  Keyboard,
  Minus,
  MousePointerClick,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import {
  createContext,
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
import {
  MB_BUTTONS,
  MB_CATEGORIES,
  MB_CATEGORY_ORDER,
  MB_COMPARISONS,
  MB_EVENT_CATEGORY,
  MB_ICON_LABEL,
  MB_ICON_ORDER,
  MB_LOGIC_OPS,
  MB_MATH_OPS,
  MB_NOTES,
  MB_OP_LABEL,
  MB_PALETTE_BY_CATEGORY,
  MB_STATEMENT_CATEGORY,
  MB_ZIP_COLOURS,
  mbEventText,
  mbExprCategory,
  mbIsContainer,
  mbNum,
  mbStatementText,
  mbVarExpr,
  type MbCategory,
  type MbPaletteEntry,
  type MbPaletteShape,
} from "./block-palette";
import {
  ICON_BITMAPS,
  type MbBinOp,
  type MbButton,
  type MbEvent,
  type MbExpr,
  type MbIcon,
  type MbProgram,
  type MbStatement,
} from "./program";

/**
 * The MakeCode-style block editor: palette on the left, event hats and their
 * stacks on the right. Blocks are added by clicking a palette block (works on
 * its own — a lesson can never depend on a drag landing) or by dragging one
 * onto a precise position, and every value is edited inside the block itself.
 */

// ── Addressing: every stack is "<ownerId>::<slot>" ──────────────────────────

type Slot = "body" | "then" | "else";
type ContainerKey = string;

const CANVAS_ID = "mb-canvas";
/** Loops inside loops inside loops — deep enough for the book, shallow enough to read. */
const MAX_DEPTH = 4;

const ckey = (ownerId: string, slot: Slot): ContainerKey => `${ownerId}::${slot}`;
const ownerOf = (key: ContainerKey): string => key.slice(0, key.indexOf("::"));
const slotOf = (key: ContainerKey): Slot => key.slice(key.indexOf("::") + 2) as Slot;
const isContainerId = (id: UniqueIdentifier) => String(id).startsWith("container:");

/**
 * Which drop targets are live for the thing being dragged. Filtering here
 * rather than disabling droppables matters: a droppable that is disabled when
 * the drag starts is never measured, so it could never be dropped on.
 */
function acceptsDrag(
  data: Record<string, unknown> | undefined,
  shape: MbPaletteShape | null,
): boolean {
  if (!data || !shape) return false;
  switch (shape) {
    case "hat":
      return data.type === "canvas";
    case "statement":
      return data.type === "container" || data.type === "statement";
    case "value":
      return data.type === "value-slot";
    case "condition":
      return data.type === "value-slot" && data.boolean === true;
  }
}

// ── Program surgery (pure, immutable) ───────────────────────────────────────

/** Rebuild an event with a new body — keeps the discriminant concrete for TS. */
function withEventBody(event: MbEvent, body: MbStatement[]): MbEvent {
  switch (event.kind) {
    case "on-start":
      return { ...event, body };
    case "forever":
      return { ...event, body };
    case "on-button":
      return { ...event, body };
  }
}

/** Apply `fn` to every body a statement owns, leaving other kinds untouched. */
function mapBodies(
  stmt: MbStatement,
  fn: (list: MbStatement[], slot: Slot) => MbStatement[],
): MbStatement {
  switch (stmt.kind) {
    case "repeat":
      return { ...stmt, body: fn(stmt.body, "body") };
    case "for":
      return { ...stmt, body: fn(stmt.body, "body") };
    case "while":
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

type MbContainerStatement = Extract<
  MbStatement,
  { kind: "repeat" | "for" | "while" | "if" }
>;

/** Narrow to a C-shaped block so its bodies can be read. */
function asContainer(stmt: MbStatement): MbContainerStatement | null {
  switch (stmt.kind) {
    case "repeat":
    case "for":
    case "while":
    case "if":
      return stmt;
    default:
      return null;
  }
}

function bodiesOf(stmt: MbStatement): MbStatement[][] {
  switch (stmt.kind) {
    case "repeat":
    case "for":
    case "while":
      return [stmt.body];
    case "if":
      return stmt.otherwise ? [stmt.then, stmt.otherwise] : [stmt.then];
    default:
      return [];
  }
}

function editList(
  program: MbProgram,
  key: ContainerKey,
  edit: (list: MbStatement[]) => MbStatement[],
): MbProgram {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const here = (stmt: MbStatement): MbStatement => {
    switch (stmt.kind) {
      case "repeat":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "for":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "while":
        return slot === "body" ? { ...stmt, body: edit(stmt.body) } : stmt;
      case "if":
        if (slot === "then") return { ...stmt, then: edit(stmt.then) };
        if (slot === "else") return { ...stmt, otherwise: edit(stmt.otherwise ?? []) };
        return stmt;
      default:
        return stmt;
    }
  };
  const walk = (list: MbStatement[]): MbStatement[] =>
    list.map((s) => (s.id === owner ? here(s) : mapBodies(s, walk)));
  return {
    events: program.events.map((ev) =>
      ev.id === owner && slot === "body"
        ? withEventBody(ev, edit(ev.body))
        : withEventBody(ev, walk(ev.body)),
    ),
  };
}

function findStatement(program: MbProgram, id: string): MbStatement | null {
  const box: { value: MbStatement | null } = { value: null };
  const walk = (list: MbStatement[]) => {
    for (const s of list) {
      if (box.value) return;
      if (s.id === id) {
        box.value = s;
        return;
      }
      bodiesOf(s).forEach(walk);
    }
  };
  program.events.forEach((ev) => walk(ev.body));
  return box.value;
}

function getList(program: MbProgram, key: ContainerKey): MbStatement[] | null {
  const owner = ownerOf(key);
  const slot = slotOf(key);
  const event = program.events.find((e) => e.id === owner);
  if (event) return slot === "body" ? event.body : null;
  const stmt = findStatement(program, owner);
  if (!stmt) return null;
  switch (stmt.kind) {
    case "repeat":
    case "for":
    case "while":
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
  program: MbProgram,
  key: ContainerKey,
  index: number,
  stmt: MbStatement,
): MbProgram =>
  editList(program, key, (list) => [
    ...list.slice(0, index),
    stmt,
    ...list.slice(index),
  ]);

function removeStatement(
  program: MbProgram,
  id: string,
): { program: MbProgram; removed: MbStatement | null } {
  const box: { value: MbStatement | null } = { value: null };
  const walk = (list: MbStatement[]): MbStatement[] => {
    const out: MbStatement[] = [];
    for (const s of list) {
      if (s.id === id) {
        box.value = s;
        continue;
      }
      out.push(mapBodies(s, walk));
    }
    return out;
  };
  const events = program.events.map((ev) => withEventBody(ev, walk(ev.body)));
  return { program: { events }, removed: box.value };
}

const mutateStatement = (
  program: MbProgram,
  id: string,
  fn: (stmt: MbStatement) => MbStatement,
): MbProgram => {
  const walk = (list: MbStatement[]): MbStatement[] =>
    list.map((s) => (s.id === id ? fn(s) : mapBodies(s, walk)));
  return { events: program.events.map((ev) => withEventBody(ev, walk(ev.body))) };
};

const mutateEvent = (
  program: MbProgram,
  id: string,
  fn: (event: MbEvent) => MbEvent,
): MbProgram => ({
  events: program.events.map((ev) => (ev.id === id ? fn(ev) : ev)),
});

function collectIds(stmt: MbStatement): string[] {
  const ids = [stmt.id];
  bodiesOf(stmt).forEach((list) => list.forEach((s) => ids.push(...collectIds(s))));
  return ids;
}

/** Replace the expression at `path` — ["cond", "left"] walks into a comparison. */
function setInExpr(current: MbExpr, path: string[], next: MbExpr): MbExpr {
  if (path.length === 0) return next;
  const [seg, ...rest] = path;
  if (current.kind === "binop") {
    if (seg === "left") return { ...current, left: setInExpr(current.left, rest, next) };
    if (seg === "right") return { ...current, right: setInExpr(current.right, rest, next) };
  }
  if (current.kind === "random") {
    if (seg === "min") return { ...current, min: setInExpr(current.min, rest, next) };
    if (seg === "max") return { ...current, max: setInExpr(current.max, rest, next) };
  }
  return current;
}

function setStatementExpr(
  stmt: MbStatement,
  path: string[],
  next: MbExpr,
): MbStatement {
  const [field, ...rest] = path;
  const at = (current: MbExpr) => setInExpr(current, rest, next);
  switch (stmt.kind) {
    case "show-number":
      return field === "value" ? { ...stmt, value: at(stmt.value) } : stmt;
    case "plot":
      if (field === "x") return { ...stmt, x: at(stmt.x) };
      if (field === "y") return { ...stmt, y: at(stmt.y) };
      return stmt;
    case "unplot":
      if (field === "x") return { ...stmt, x: at(stmt.x) };
      if (field === "y") return { ...stmt, y: at(stmt.y) };
      return stmt;
    case "set-var":
      return field === "value" ? { ...stmt, value: at(stmt.value) } : stmt;
    case "change-var":
      return field === "by" ? { ...stmt, by: at(stmt.by) } : stmt;
    case "repeat":
      return field === "times" ? { ...stmt, times: at(stmt.times) } : stmt;
    case "for":
      if (field === "from") return { ...stmt, from: at(stmt.from) };
      if (field === "to") return { ...stmt, to: at(stmt.to) };
      return stmt;
    case "while":
      return field === "cond" ? { ...stmt, cond: at(stmt.cond) } : stmt;
    case "if":
      return field === "cond" ? { ...stmt, cond: at(stmt.cond) } : stmt;
    default:
      return stmt;
  }
}

/** Every variable the program already mentions, in the order it meets them. */
function listVariables(program: MbProgram): string[] {
  const names: string[] = [];
  const add = (name: string) => {
    if (name && !names.includes(name)) names.push(name);
  };
  const fromExpr = (expr: MbExpr) => {
    if (expr.kind === "var") add(expr.name);
    else if (expr.kind === "binop") {
      fromExpr(expr.left);
      fromExpr(expr.right);
    } else if (expr.kind === "random") {
      fromExpr(expr.min);
      fromExpr(expr.max);
    }
  };
  const walk = (list: MbStatement[]) => {
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
        case "for":
          add(s.name);
          fromExpr(s.from);
          fromExpr(s.to);
          break;
        case "show-number":
          fromExpr(s.value);
          break;
        case "plot":
        case "unplot":
          fromExpr(s.x);
          fromExpr(s.y);
          break;
        case "repeat":
          fromExpr(s.times);
          break;
        case "while":
        case "if":
          fromExpr(s.cond);
          break;
        default:
          break;
      }
      bodiesOf(s).forEach(walk);
    }
  };
  program.events.forEach((ev) => walk(ev.body));
  return names;
}

interface FlatNode {
  id: string;
  type: "event" | "statement";
  container: ContainerKey | null;
  index: number;
  depth: number;
}

/** Render order of every block, plus how deep each stack sits. */
function flattenProgram(program: MbProgram): {
  nodes: FlatNode[];
  depths: Map<ContainerKey, number>;
} {
  const nodes: FlatNode[] = [];
  const depths = new Map<ContainerKey, number>();
  const walk = (list: MbStatement[], container: ContainerKey, depth: number) => {
    depths.set(container, depth);
    list.forEach((stmt, index) => {
      nodes.push({ id: stmt.id, type: "statement", container, index, depth });
      switch (stmt.kind) {
        case "repeat":
        case "for":
        case "while":
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
  program.events.forEach((event, index) => {
    nodes.push({ id: event.id, type: "event", container: null, index, depth: 0 });
    walk(event.body, ckey(event.id, "body"), 1);
  });
  return { nodes, depths };
}

// ── Editor context ──────────────────────────────────────────────────────────

type MbSelection =
  | { kind: "event"; id: string }
  | { kind: "statement"; id: string }
  | { kind: "slot"; container: ContainerKey };

interface EditorApi {
  readOnly: boolean;
  variables: string[];
  selection: MbSelection | null;
  select: (selection: MbSelection | null) => void;
  /** Which block currently owns the single tab stop of the canvas. */
  tabTargetId: string | null;
  update: (fn: (program: MbProgram) => MbProgram) => void;
  removeBlock: (id: string) => void;
  moveWithin: (id: string, delta: number) => void;
  navigate: (id: string, delta: number) => void;
  navigateInto: (id: string) => void;
  navigateOut: (id: string) => void;
  focusFirstField: (id: string) => void;
  registerNode: (id: string, el: HTMLDivElement | null) => void;
  setFocusedSlot: (slot: FocusedSlot | null) => void;
  say: (message: string) => void;
  /** Shape being dragged right now — drives which drop targets are live. */
  dragShape: MbPaletteShape | null;
  activeId: string | null;
  overId: string | null;
}

interface FocusedSlot {
  ownerId: string;
  path: string[];
  boolean: boolean;
}

const EditorCtx = createContext<EditorApi | null>(null);

function useEditor(): EditorApi {
  const ctx = useContext(EditorCtx);
  if (!ctx) throw new Error("Block editor parts must render inside <BlockEditor>");
  return ctx;
}

/** Fields only join the tab order once their block is selected (roving tabindex). */
function useFieldTab(ownerId: string): number {
  const { selection } = useEditor();
  return selection && selection.kind !== "slot" && selection.id === ownerId ? 0 : -1;
}

// ── MakeCode geometry ───────────────────────────────────────────────────────

/**
 * These are MakeCode's own measurements, in fixed px rather than tokens: an
 * 8×4 notch set 14px in from the left edge, 4px corners, and a 14px rail down
 * the inside of every C-shaped block. Change them and blocks stop matching the
 * screenshots in the book.
 */
const NOTCH_X = 14;
const NOTCH_W = 8;
const NOTCH_D = 4;
const RAIL = 14;
const RADIUS = 4;

/** White words on saturated colour — a hair of shadow keeps them crisp. */
const TEXT_SHADOW = "0 1px 1px rgba(11,17,32,0.28)";

const NOTCH_SHAPE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${NOTCH_W}" height="${NOTCH_D}"><rect width="${NOTCH_W}" height="${NOTCH_D}" rx="2" fill="#000"/></svg>`,
)}")`;

/**
 * The socket in a block's top edge is a hole punched clean through the face —
 * "the whole rectangle, minus the notch" — so the tab of the block above shows
 * through it and the two interlock, exactly as two MakeCode blocks do. A
 * browser without mask-composite falls back to a plain rectangle: a block that
 * has lost its dent, never a block that has vanished.
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

/** Booleans are hexagons, so only they look like they fit a test slot. */
const HEX_CLIP =
  "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)";

/**
 * A block's colour is painted on its own layer *behind* the words, so the mask
 * that cuts the socket can never clip a field, a dropdown or a focus ring.
 */
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
      style={{ background: hex, borderRadius: radius, ...(socket ? SOCKET : null) }}
    />
  );
}

/** The tab that drops into the socket of the block below. */
function Tab({ hex, className }: { hex: string; className: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute rounded-b-[2px]", className)}
      style={{ background: hex, left: NOTCH_X, width: NOTCH_W, height: NOTCH_D }}
    />
  );
}

/** An event hat: the wide shallow dome MakeCode springs off the left edge. */
function Dome({ hex }: { hex: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 w-24 rounded-t-[999px]"
      // 1px of overlap with the bar below, so no hairline shows at any zoom.
      style={{ background: hex, height: 16, top: -15 }}
    />
  );
}

/** Selected: white just inside the edge, ink just outside. Reads on every hue. */
function SelectRing() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -inset-[3px] rounded-[7px]"
      style={{ boxShadow: "inset 0 0 0 2px #ffffff, 0 0 0 2px rgba(11,17,32,0.9)" }}
    />
  );
}

/** The boolean shape — the clip lives on a backing layer so children escape it. */
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

const PILL = "inline-flex items-center rounded-full text-[13px] leading-none font-semibold";
/** A white MakeCode value field — fully rounded, dark text, auto width. */
const WHITE_PILL = `${PILL} h-6 bg-white px-1.5 text-ink-900 shadow-[0_1px_0_rgba(11,17,32,0.2)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500`;
/** A dropdown painted onto the block face, the way MakeCode darkens its own. */
const DARK_PILL = `${PILL} relative h-6 cursor-pointer gap-1 bg-black/20 pr-1.5 pl-2 text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white`;
const BARE_INPUT =
  "min-w-0 border-0 bg-transparent p-0 font-mono text-[13px] font-semibold text-ink-900 outline-none placeholder:text-ink-300 disabled:text-ink-400";
/** Invisible <select> laid over its pill, grown to a 32px touch target. */
const OVERLAY_SELECT =
  "absolute inset-x-0 -inset-y-1 cursor-pointer opacity-0 disabled:cursor-default";

/** Typing inside a block must not reach the block's own arrow/Delete keys. */
const stopKeys = (e: ReactKeyboardEvent) => {
  if (e.key !== "Escape") e.stopPropagation();
};

function W({ children }: { children: ReactNode }) {
  return (
    <span className="px-0.5 text-[13.5px] leading-none font-semibold whitespace-nowrap text-white">
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
  // While typing, half-finished text ("" or "-") lives here; otherwise the
  // block itself is the single source of truth.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  return (
    <span className={cn(WHITE_PILL, "px-1")}>
      <input
        data-field
        type="number"
        inputMode="numeric"
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
        style={{ width: `calc(${Math.max(1, shown.length)}ch + 0.6rem)` }}
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
  return (
    <span className={cn(WHITE_PILL, "px-2")}>
      <input
        data-field
        type="text"
        aria-label={label}
        value={value}
        maxLength={24}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
        onChange={(e) => onCommit(e.target.value)}
        className={cn(BARE_INPUT, "h-5")}
        style={{ width: `calc(${Math.max(4, value.length)}ch + 0.35rem)` }}
      />
    </span>
  );
}

function ChoiceField({
  ownerId,
  value,
  options,
  onChange,
  label,
  lead,
}: {
  ownerId: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  lead?: ReactNode;
}) {
  const { readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const current = options.find((o) => o.value === value);
  return (
    <span className={cn(DARK_PILL, readOnly && "cursor-default")}>
      {lead}
      <span className="whitespace-nowrap">{current?.label ?? value}</span>
      <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
    </span>
  );
}

/** Variable name field: pick an existing variable or make a new one, in place. */
function VarField({
  ownerId,
  name,
  onChange,
  label,
}: {
  ownerId: string;
  name: string;
  onChange: (name: string) => void;
  label: string;
}) {
  const { variables, readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  if (naming) {
    return (
      <span className={cn(WHITE_PILL, "px-2")}>
        <input
          data-field
          autoFocus
          aria-label="New variable name"
          value={draft}
          disabled={readOnly}
          tabIndex={tabIndex}
          placeholder="name"
          onKeyDown={(e) => {
            stopKeys(e);
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

  const options = [
    ...(variables.includes(name) ? variables : [name, ...variables]).map((v) => ({
      value: v,
      label: v,
    })),
    { value: "__new__", label: "New variable…" },
  ];
  return (
    <ChoiceField
      ownerId={ownerId}
      value={name}
      options={options}
      label={label}
      onChange={(v) => {
        if (v === "__new__") setNaming(true);
        else onChange(v);
      }}
    />
  );
}

function IconGrid({ icon, size = 1 }: { icon: MbIcon; size?: number }) {
  return (
    <span className="grid shrink-0 grid-cols-5 gap-px" aria-hidden>
      {ICON_BITMAPS[icon].flat().map((on, i) => (
        <span
          key={i}
          className={cn("rounded-[1px]", on ? "bg-coral-500" : "bg-ink-200")}
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
        />
      ))}
    </span>
  );
}

/** Icon picker — the chosen pattern on the block, the rest in a dropdown. */
function IconField({
  ownerId,
  icon,
  onChange,
}: {
  ownerId: string;
  icon: MbIcon;
  onChange: (icon: MbIcon) => void;
}) {
  const { readOnly } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        data-field
        type="button"
        aria-expanded={open}
        aria-label={`Icon: ${MB_ICON_LABEL[icon]}. Choose another`}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
        onClick={() => setOpen((o) => !o)}
        className={cn(DARK_PILL, "gap-1.5 pl-1.5", readOnly && "cursor-default")}
      >
        <span className="inline-flex rounded-[3px] bg-white p-0.5">
          <IconGrid icon={icon} />
        </span>
        <span className="whitespace-nowrap">{MB_ICON_LABEL[icon]}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
      </button>
      {open && !readOnly && (
        <span
          role="group"
          aria-label="Pick an icon"
          className="absolute top-full left-0 z-30 mt-1 flex w-[188px] flex-wrap gap-1.5 rounded-lg bg-ink-900/95 p-2 shadow-pop"
        >
          {MB_ICON_ORDER.map((option) => (
            <button
              key={option}
              data-field
              type="button"
              tabIndex={tabIndex}
              aria-pressed={option === icon}
              aria-label={MB_ICON_LABEL[option]}
              onKeyDown={stopKeys}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer rounded-md bg-white p-1.5 ring-1 ring-ink-900/15 transition-transform hover:scale-105",
                option === icon && "ring-2 ring-brand-500",
              )}
            >
              <IconGrid icon={option} />
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

// ── Value slots (the MbExpr editors) ────────────────────────────────────────

const SENSOR_LABEL: Record<"temperature" | "humidity" | "light", string> = {
  temperature: "temperature",
  humidity: "humidity",
  light: "light level",
};

function slotKindValue(expr: MbExpr): string {
  switch (expr.kind) {
    case "num":
      return "num";
    case "var":
      return `var:${expr.name}`;
    case "binop":
      return MB_MATH_OPS.includes(expr.op) ? "math" : "compare";
    case "random":
      return "random";
    default:
      return expr.kind;
  }
}

function ValueSlot({
  ownerId,
  path,
  expr,
  label,
  boolean = false,
}: {
  ownerId: string;
  path: string[];
  expr: MbExpr;
  label: string;
  boolean?: boolean;
}) {
  const { update, variables, readOnly, dragShape, setFocusedSlot } = useEditor();
  const tabIndex = useFieldTab(ownerId);
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState("");

  const set = (next: MbExpr) =>
    update((p) => mutateStatement(p, ownerId, (s) => setStatementExpr(s, path, next)));

  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${ownerId}:${path.join(".")}`,
    data: { type: "value-slot", ownerId, path, boolean },
    disabled: readOnly,
  });
  const slotLive = dragShape === "value" || (dragShape === "condition" && boolean);

  const kindOptions = [
    { value: "num", label: "123  a number" },
    ...variables.map((v) => ({ value: `var:${v}`, label: `${v}  (variable)` })),
    { value: "temperature", label: "temperature" },
    { value: "humidity", label: "humidity" },
    { value: "light", label: "light level" },
    { value: "random", label: "random number" },
    ...(boolean
      ? [{ value: "compare", label: "compare  (< > =)" }]
      : [{ value: "math", label: "calculation  (+ − × ÷)" }]),
    { value: "__new__", label: "New variable…" },
  ];

  const changeKind = (value: string) => {
    if (value === "__new__") {
      setNaming(true);
      return;
    }
    if (value === "num") {
      set(mbNum(expr.kind === "num" ? expr.value : 0));
      return;
    }
    if (value.startsWith("var:")) {
      set(mbVarExpr(value.slice(4)));
      return;
    }
    if (value === "random") {
      set({ kind: "random", min: mbNum(0), max: mbNum(4) });
      return;
    }
    if (value === "compare") {
      set({ kind: "binop", op: ">", left: expr, right: mbNum(0) });
      return;
    }
    if (value === "math") {
      set({ kind: "binop", op: "+", left: expr, right: mbNum(1) });
      return;
    }
    if (value === "temperature" || value === "humidity" || value === "light") {
      set({ kind: value });
    }
  };

  const childBoolean = expr.kind === "binop" && MB_LOGIC_OPS.includes(expr.op);
  const opOptions = boolean
    ? [...MB_COMPARISONS, ...MB_LOGIC_OPS]
    : [...MB_MATH_OPS, ...MB_COMPARISONS];

  // What sits in the slot decides its shape and its colour, exactly as in
  // MakeCode: white pill for a number, category-coloured pill for a variable
  // or a reporter, hexagon for anything that answers true or false.
  const category = mbExprCategory(expr);
  const hex = category ? MB_CATEGORIES[category].hex : undefined;
  const isTest = expr.kind === "binop" && !MB_MATH_OPS.includes(expr.op);

  /** MakeCode swaps values by dragging; this is the same move for a keyboard. */
  const kindSelect = () => (
    <select
      data-field
      aria-label={`What goes in ${label}`}
      value={slotKindValue(expr)}
      tabIndex={tabIndex}
      onKeyDown={stopKeys}
      onChange={(e) => changeKind(e.target.value)}
      className={OVERLAY_SELECT}
    >
      {kindOptions.map((o) => (
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

  /** A reporter block sitting in the slot: its own colour, its own dropdown. */
  const menuPill = (text: string) => (
    <span
      className="relative inline-flex h-6 items-center gap-1 rounded-full pr-1.5 pl-2.5 text-[13px] leading-none font-semibold whitespace-nowrap text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white"
      style={{ background: hex, textShadow: TEXT_SHADOW }}
    >
      {text}
      {!readOnly && (
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
          onCommit={(n) => set(mbNum(n))}
        />
        {caret}
      </>
    );
  } else if (expr.kind === "var") {
    body = menuPill(expr.name);
  } else if (
    expr.kind === "temperature" ||
    expr.kind === "humidity" ||
    expr.kind === "light"
  ) {
    body = menuPill(SENSOR_LABEL[expr.kind]);
  } else if (expr.kind === "random") {
    body = (
      <span
        className="relative inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: hex, textShadow: TEXT_SHADOW }}
      >
        <W>pick random</W>
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "min"]}
          expr={expr.min}
          label={`${label} lowest`}
        />
        <W>to</W>
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
    const parts = (
      <>
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "left"]}
          expr={expr.left}
          label={`${label} left side`}
          boolean={childBoolean}
        />
        <ChoiceField
          ownerId={ownerId}
          value={expr.op}
          label={`${label} operator`}
          options={opOptions.map((op) => ({ value: op, label: MB_OP_LABEL[op] }))}
          onChange={(op) => set({ ...expr, op: op as MbBinOp })}
        />
        <ValueSlot
          ownerId={ownerId}
          path={[...path, "right"]}
          expr={expr.right}
          label={`${label} right side`}
          boolean={childBoolean}
        />
        {caret}
      </>
    );
    body = isTest ? (
      <Hexagon hex={hex ?? MB_CATEGORIES.logic.hex}>{parts}</Hexagon>
    ) : (
      <span
        className="relative inline-flex min-h-7 items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: hex }}
      >
        {parts}
      </span>
    );
  }

  return (
    <span
      ref={setNodeRef}
      onFocus={() => setFocusedSlot({ ownerId, path, boolean })}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg",
        slotLive && "ring-2 ring-white/60",
        slotLive && isOver && "ring-2 ring-white",
      )}
    >
      {naming ? (
        <span className={cn(WHITE_PILL, "px-2")}>
          <input
            data-field
            autoFocus
            aria-label="New variable name"
            value={draft}
            tabIndex={tabIndex}
            placeholder="name"
            onKeyDown={(e) => {
              stopKeys(e);
              if (e.key === "Enter") {
                const clean = draft.trim();
                if (clean) set(mbVarExpr(clean));
                setNaming(false);
                setDraft("");
              }
              if (e.key === "Escape") setNaming(false);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const clean = draft.trim();
              if (clean) set(mbVarExpr(clean));
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

// ── The words and fields of each statement ──────────────────────────────────

function StatementFields({ stmt }: { stmt: MbStatement }) {
  const { update } = useEditor();
  const set = (next: MbStatement) => update((p) => mutateStatement(p, stmt.id, () => next));

  switch (stmt.kind) {
    case "show-number":
      return (
        <>
          <W>show number</W>
          <ValueSlot ownerId={stmt.id} path={["value"]} expr={stmt.value} label="number to show" />
        </>
      );
    case "show-string":
      return (
        <>
          <W>show string</W>
          <TextField
            ownerId={stmt.id}
            value={stmt.value}
            label="text to scroll"
            onCommit={(value) => set({ ...stmt, value })}
          />
        </>
      );
    case "show-icon":
      return (
        <>
          <W>show icon</W>
          <IconField
            ownerId={stmt.id}
            icon={stmt.icon}
            onChange={(icon) => set({ ...stmt, icon })}
          />
        </>
      );
    case "clear-screen":
      return <W>clear screen</W>;
    case "plot":
    case "unplot":
      return (
        <>
          <W>{stmt.kind === "plot" ? "plot" : "unplot"}</W>
          <W>x</W>
          <ValueSlot ownerId={stmt.id} path={["x"]} expr={stmt.x} label="column x" />
          <W>y</W>
          <ValueSlot ownerId={stmt.id} path={["y"]} expr={stmt.y} label="row y" />
        </>
      );
    case "play-tone":
      return (
        <>
          <W>play tone</W>
          <ChoiceField
            ownerId={stmt.id}
            value={stmt.note}
            label="note"
            options={MB_NOTES.map((n) => ({ value: n, label: n }))}
            onChange={(note) => set({ ...stmt, note })}
          />
          <W>for</W>
          <NumberField
            ownerId={stmt.id}
            value={stmt.ms}
            label="milliseconds"
            onCommit={(ms) => set({ ...stmt, ms })}
          />
          <W>ms</W>
        </>
      );
    case "set-zip":
      return (
        <>
          <W>set ZIP LEDs</W>
          <ChoiceField
            ownerId={stmt.id}
            value={stmt.colour}
            label="ZIP LED colour"
            lead={
              <span
                className={cn(
                  "size-3 rounded-full ring-1 ring-ink-900/20",
                  stmt.colour === "red" && "bg-coral-500",
                  stmt.colour === "green" && "bg-mint-500",
                  stmt.colour === "amber" && "bg-amber-500",
                  stmt.colour === "off" && "bg-ink-200",
                )}
                aria-hidden
              />
            }
            options={MB_ZIP_COLOURS.map((c) => ({ value: c, label: c }))}
            onChange={(colour) =>
              set({ ...stmt, colour: colour as (typeof MB_ZIP_COLOURS)[number] })
            }
          />
        </>
      );
    case "pause":
      return (
        <>
          <W>pause</W>
          <NumberField
            ownerId={stmt.id}
            value={stmt.ms}
            label="milliseconds"
            onCommit={(ms) => set({ ...stmt, ms })}
          />
          <W>ms</W>
        </>
      );
    case "set-var":
      return (
        <>
          <W>set</W>
          <VarField
            ownerId={stmt.id}
            name={stmt.name}
            label="variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          <W>to</W>
          <ValueSlot ownerId={stmt.id} path={["value"]} expr={stmt.value} label="new value" />
        </>
      );
    case "change-var":
      return (
        <>
          <W>change</W>
          <VarField
            ownerId={stmt.id}
            name={stmt.name}
            label="variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          <W>by</W>
          <ValueSlot ownerId={stmt.id} path={["by"]} expr={stmt.by} label="amount to add" />
        </>
      );
    case "repeat":
      return (
        <>
          <W>repeat</W>
          <ValueSlot ownerId={stmt.id} path={["times"]} expr={stmt.times} label="how many times" />
          <W>times</W>
        </>
      );
    case "for":
      return (
        <>
          <W>for</W>
          <VarField
            ownerId={stmt.id}
            name={stmt.name}
            label="counter variable"
            onChange={(name) => set({ ...stmt, name })}
          />
          <W>from</W>
          <ValueSlot ownerId={stmt.id} path={["from"]} expr={stmt.from} label="start value" />
          <W>to</W>
          <ValueSlot ownerId={stmt.id} path={["to"]} expr={stmt.to} label="end value" />
        </>
      );
    case "while":
      return (
        <>
          <W>while</W>
          <ValueSlot
            ownerId={stmt.id}
            path={["cond"]}
            expr={stmt.cond}
            label="test"
            boolean
          />
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
            label="test"
            boolean
          />
          <W>then</W>
        </>
      );
  }
}

/**
 * MakeCode's circled ⊕ under an if block. It lives in the bottom lip, not in
 * the header, which is where a student following the book will look for it.
 */
function ElseToggle({ stmt }: { stmt: Extract<MbStatement, { kind: "if" }> }) {
  const { readOnly, update, say } = useEditor();
  const tabIndex = useFieldTab(stmt.id);
  if (readOnly) return null;
  const hasElse = Boolean(stmt.otherwise);
  return (
    <button
      data-field
      type="button"
      tabIndex={tabIndex}
      onKeyDown={stopKeys}
      aria-label={hasElse ? "Remove the else part" : "Add an else part"}
      onClick={() => {
        if (hasElse) {
          const { otherwise, ...rest } = stmt;
          update((p) => mutateStatement(p, stmt.id, () => rest));
          say(
            otherwise && otherwise.length > 0
              ? "Removed the else part and the blocks inside it."
              : "Removed the else part.",
          );
        } else {
          update((p) => mutateStatement(p, stmt.id, () => ({ ...stmt, otherwise: [] })));
          say("Added an else part — blocks in there run when the test is false.");
        }
      }}
      // The ::after grows a 20px circle into a 32px target for small fingers.
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

// ── Stacks, blocks and hats ─────────────────────────────────────────────────

function EmptySlot({ containerKey }: { containerKey: ContainerKey }) {
  const { selection, select, readOnly } = useEditor();
  const active = selection?.kind === "slot" && selection.container === containerKey;
  if (readOnly)
    return <p className="px-2 py-1.5 font-mono text-[12px] text-ink-400">(empty)</p>;
  return (
    <button
      type="button"
      // Stop here — the block this slot lives in must not re-select itself.
      onClick={(e) => {
        e.stopPropagation();
        select({ kind: "slot", container: containerKey });
      }}
      className={cn(
        "flex min-h-9 w-full min-w-[190px] cursor-pointer items-center gap-2 rounded-[4px] border-2 border-dashed px-2.5 py-1.5 text-left text-[12.5px] font-medium transition-colors",
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
  items: MbStatement[];
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
      // No vertical rhythm here on purpose: blocks butt together so the tab of
      // one sits in the socket of the next.
      className={cn(
        "min-w-max",
        dragShape === "statement" &&
          isOver &&
          "outline-2 outline-offset-2 outline-dashed outline-brand-500",
      )}
    >
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
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
 * The inside of a C: a 14px rail down the left, then the child stack over the
 * page itself. The cavity is genuinely transparent — that is what makes nested
 * blocks read as being *inside* the loop rather than painted on top of it.
 */
function Cavity({
  hex,
  containerKey,
  items,
  depth,
}: {
  hex: string;
  containerKey: ContainerKey;
  items: MbStatement[];
  depth: number;
}) {
  return (
    <div className="flex">
      <span aria-hidden className="shrink-0" style={{ background: hex, width: RAIL }} />
      <div className="relative min-w-[190px]">
        {/* The parent's own tab, waiting in the first child's socket. */}
        {items.length > 0 && <Tab hex={hex} className="top-0" />}
        <StackList containerKey={containerKey} items={items} depth={depth} />
      </div>
    </div>
  );
}

/** Small round controls on a block face: 28px of paint, 32px of target. */
const BLOCK_BUTTON =
  "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/75 transition after:absolute after:-inset-[2px] after:content-[''] hover:text-white";

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      // Must not bubble: the block behind would select itself again after it goes.
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(BLOCK_BUTTON, "bg-black/15 hover:bg-black/35")}
    >
      <Trash2 className="size-3.5" aria-hidden />
    </button>
  );
}

function BlockNode({
  stmt,
  container,
  index,
  depth,
}: {
  stmt: MbStatement;
  container: ContainerKey;
  index: number;
  depth: number;
}) {
  const editor = useEditor();
  const cat = MB_CATEGORIES[MB_STATEMENT_CATEGORY[stmt.kind]];
  const selected =
    editor.selection?.kind === "statement" && editor.selection.id === stmt.id;
  const shell = asContainer(stmt);
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
    editor.activeId !== stmt.id;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // A block sits inside its parent block, so anything handled here must stop —
    // otherwise one arrow press would travel up every enclosing block.
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
      // The block being dragged stays put and dims — the DragOverlay is what
      // follows the pointer. Its neighbours still slide to open a gap.
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
        {...attributes}
        role="group"
        aria-roledescription="block"
        aria-label={mbStatementText(stmt)}
        data-block={stmt.id}
        ref={(el) => editor.registerNode(stmt.id, el)}
        tabIndex={editor.tabTargetId === stmt.id ? 0 : -1}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          const owner = (e.target as HTMLElement).closest("[data-block]");
          if (owner?.getAttribute("data-block") === stmt.id)
            editor.select({ kind: "statement", id: stmt.id });
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-block]") === e.currentTarget)
            editor.select({ kind: "statement", id: stmt.id });
        }}
        className="relative outline-none"
      >
        {/* The bar carrying the words — and, for a C-block, the top of the C. */}
        <div className="relative">
          <Face
            hex={cat.hex}
            radius={shell ? `${RADIUS}px ${RADIUS}px 0 0` : `${RADIUS}px`}
            socket
          />
          <div
            className="relative flex min-h-8 items-center gap-1 py-1 pr-1 pl-2.5"
            style={{ textShadow: TEXT_SHADOW }}
          >
            <StatementFields stmt={stmt} />
            {!editor.readOnly && (
              <span className="ml-1 flex shrink-0 items-center gap-1.5">
                <button
                  ref={setActivatorNodeRef}
                  {...listeners}
                  type="button"
                  tabIndex={-1}
                  aria-label={`Drag ${mbStatementText(stmt)}`}
                  className={cn(
                    BLOCK_BUTTON,
                    "cursor-grab touch-none hover:bg-black/20 active:cursor-grabbing",
                  )}
                >
                  <GripVertical className="size-4" aria-hidden />
                </button>
                <DeleteButton
                  onClick={() => editor.removeBlock(stmt.id)}
                  label={`Delete ${mbStatementText(stmt)}`}
                />
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
                  <Face hex={cat.hex} radius="0" />
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
              <Face hex={cat.hex} radius={`0 0 ${RADIUS}px ${RADIUS}px`} />
              <div
                className="relative flex items-center px-2"
                style={{ minHeight: shell.kind === "if" ? 28 : RAIL }}
              >
                {shell.kind === "if" && <ElseToggle stmt={shell} />}
              </div>
            </div>
          </>
        )}
        <Tab hex={cat.hex} className="top-full" />
        {selected && <SelectRing />}
      </div>
    </div>
  );
}

function EventNode({ event }: { event: MbEvent }) {
  const editor = useEditor();
  const cat = MB_CATEGORIES[MB_EVENT_CATEGORY[event.kind]];
  const selected = editor.selection?.kind === "event" && editor.selection.id === event.id;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const mine = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      mine();
      editor.navigate(event.id, e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "ArrowRight") {
      mine();
      editor.navigateInto(event.id);
      return;
    }
    if (e.key === "Enter") {
      mine();
      editor.focusFirstField(event.id);
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      mine();
      editor.removeBlock(event.id);
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
      aria-label={mbEventText(event)}
      data-block={event.id}
      ref={(el) => editor.registerNode(event.id, el)}
      tabIndex={editor.tabTargetId === event.id ? 0 : -1}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const owner = (e.target as HTMLElement).closest("[data-block]");
        if (owner?.getAttribute("data-block") === event.id)
          editor.select({ kind: "event", id: event.id });
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-block]") === e.currentTarget)
          editor.select({ kind: "event", id: event.id });
      }}
      // mt-4 leaves room for the dome, which overhangs the box.
      className="animate-fade-up relative mt-4 w-max outline-none"
    >
      <div className="relative">
        <Dome hex={cat.hex} />
        <Face hex={cat.hex} radius={`0 ${RADIUS}px 0 0`} />
        <div
          className="relative flex min-h-9 items-center gap-1 py-1 pr-1 pl-3"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {event.kind === "on-start" && <W>on start</W>}
          {event.kind === "forever" && <W>forever</W>}
          {event.kind === "on-button" && (
            <>
              <W>on button</W>
              <ChoiceField
                ownerId={event.id}
                value={event.button}
                label="which button"
                options={MB_BUTTONS.map((b) => ({ value: b, label: b }))}
                onChange={(button) =>
                  editor.update((p) =>
                    mutateEvent(p, event.id, (ev) =>
                      ev.kind === "on-button"
                        ? { ...ev, button: button as MbButton }
                        : ev,
                    ),
                  )
                }
              />
              <W>pressed</W>
            </>
          )}
          {!editor.readOnly && (
            <span className="ml-2 flex shrink-0">
              <DeleteButton
                onClick={() => editor.removeBlock(event.id)}
                label={`Delete ${mbEventText(event)} and everything inside it`}
              />
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
      {selected && <SelectRing />}
    </div>
  );
}

// ── Palette ─────────────────────────────────────────────────────────────────

/**
 * A palette entry drawn as the block it makes — same shapes, same colours as
 * the canvas. A student matching the book is looking for a picture, not a row
 * of text, so the one-line help becomes the tooltip instead.
 */
function MiniBlock({ entry }: { entry: MbPaletteEntry }) {
  const hex = entry.colour;
  const words = (
    <span
      className="relative block px-2.5 py-1.5 text-[13px] leading-tight font-semibold text-white"
      style={{ textShadow: TEXT_SHADOW }}
    >
      {entry.label}
    </span>
  );

  if (entry.shape === "value")
    return (
      <span
        className="inline-flex min-h-7 items-center rounded-full px-3 text-[13px] font-semibold text-white"
        style={{ background: hex, textShadow: TEXT_SHADOW }}
      >
        {entry.label}
      </span>
    );

  if (entry.shape === "condition")
    return (
      <span className="relative inline-flex min-h-8 items-center px-3">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: hex, clipPath: HEX_CLIP }}
        />
        <span
          className="relative text-[13px] font-semibold text-white"
          style={{ textShadow: TEXT_SHADOW }}
        >
          {entry.label}
        </span>
      </span>
    );

  if (entry.shape === "hat")
    return (
      <span className="relative mt-[15px] block">
        <span className="relative block">
          <Dome hex={hex} />
          <Face hex={hex} radius={`0 ${RADIUS}px 0 0`} />
          {words}
        </span>
        <span className="flex">
          <span aria-hidden className="shrink-0" style={{ background: hex, width: RAIL, height: 14 }} />
        </span>
        <span
          aria-hidden
          className="block"
          style={{ background: hex, height: 10, borderRadius: `0 0 ${RADIUS}px ${RADIUS}px` }}
        />
      </span>
    );

  if (entry.wraps)
    return (
      <span className="relative block">
        <span className="relative block">
          <Face hex={hex} radius={`${RADIUS}px ${RADIUS}px 0 0`} socket />
          {words}
        </span>
        <span className="flex">
          <span aria-hidden className="shrink-0" style={{ background: hex, width: RAIL, height: 16 }} />
        </span>
        <span
          aria-hidden
          className="block"
          style={{ background: hex, height: 10, borderRadius: `0 0 ${RADIUS}px ${RADIUS}px` }}
        />
        <Tab hex={hex} className="top-full" />
      </span>
    );

  return (
    <span className="relative block">
      <Face hex={hex} socket />
      {words}
      <Tab hex={hex} className="top-full" />
    </span>
  );
}

function PaletteItem({
  entry,
  onAdd,
}: {
  entry: MbPaletteEntry;
  onAdd: (entry: MbPaletteEntry) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${entry.kind}`,
    data: { type: "palette", entry },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      title={entry.help}
      onClick={() => onAdd(entry)}
      className={cn(
        "block w-full cursor-grab touch-none rounded-[6px] text-left transition-transform hover:-translate-y-px active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <MiniBlock entry={entry} />
    </button>
  );
}

/** MakeCode's toolbox: categories down the side, that category's blocks beside. */
function Palette({
  active,
  onSelect,
  onAdd,
}: {
  active: MbCategory;
  onSelect: (category: MbCategory) => void;
  onAdd: (entry: MbPaletteEntry) => void;
}) {
  const cat = MB_CATEGORIES[active];
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card lg:w-[304px]">
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
          className="thin-scroll max-h-[62vh] w-[104px] shrink-0 overflow-y-auto border-r border-ink-100 py-1"
        >
          {MB_CATEGORY_ORDER.map((id) => {
            const meta = MB_CATEGORIES[id];
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => onSelect(id)}
                className={cn(
                  "flex min-h-9 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[13px] font-semibold transition-colors",
                  on ? "text-white" : "text-ink-700 hover:bg-ink-50",
                )}
                style={on ? { background: meta.hex } : undefined}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-[3px]"
                  style={{ background: on ? "rgba(255,255,255,0.92)" : meta.hex }}
                />
                {meta.label}
              </button>
            );
          })}
        </nav>
        <div
          className="thin-scroll max-h-[62vh] min-w-0 flex-1 overflow-auto p-2.5"
          style={{ background: cat.tint }}
        >
          <div className="flex w-max min-w-full flex-col items-start gap-1.5">
            {MB_PALETTE_BY_CATEGORY[active].map((entry) => (
              <PaletteItem key={entry.kind} entry={entry} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── The editor ──────────────────────────────────────────────────────────────

const BASE_HINT =
  "Click a block to add it where the blue outline is — or drag it exactly where you want it.";

export function BlockEditor({
  program,
  onChange,
  readOnly = false,
}: {
  program: MbProgram;
  onChange: (program: MbProgram) => void;
  readOnly?: boolean;
}) {
  const [selection, setSelection] = useState<MbSelection | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<FocusedSlot | null>(null);
  const [activeCat, setActiveCat] = useState<MbCategory>("basic");
  const [dragShape, setDragShape] = useState<MbPaletteShape | null>(null);
  const [dragEntry, setDragEntry] = useState<MbPaletteEntry | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [hint, setHint] = useState(BASE_HINT);

  const nodes = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef<string | null>(null);
  const lastDragEnd = useRef(0);
  const dragShapeRef = useRef<MbPaletteShape | null>(null);

  const variables = useMemo(() => listVariables(program), [program]);
  const { nodes: flat, depths } = useMemo(() => flattenProgram(program), [program]);
  const blockCount = flat.length;

  const say = useCallback((message: string) => setHint(message), []);
  const update = useCallback(
    (fn: (p: MbProgram) => MbProgram) => onChange(fn(program)),
    [onChange, program],
  );

  const registerNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  }, []);

  const focusBlock = useCallback((id: string) => {
    nodes.current.get(id)?.focus();
  }, []);

  // Blocks created by a click or a drop take focus once React has drawn them.
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    focusBlock(id);
  }, [program, focusBlock]);

  const tabTargetId = useMemo(() => {
    if (selection && selection.kind !== "slot") return selection.id;
    return flat[0]?.id ?? null;
  }, [selection, flat]);

  const select = useCallback((next: MbSelection | null) => {
    setSelection(next);
  }, []);

  /** Where a clicked palette block lands: after the selection, or at the end. */
  const insertionPoint = useCallback((): { container: ContainerKey; index: number } | null => {
    if (selection?.kind === "slot") {
      const list = getList(program, selection.container);
      return list ? { container: selection.container, index: list.length } : null;
    }
    if (selection?.kind === "event") {
      const event = program.events.find((e) => e.id === selection.id);
      if (event) return { container: ckey(event.id, "body"), index: event.body.length };
    }
    if (selection?.kind === "statement") {
      const node = flat.find((n) => n.id === selection.id);
      if (node?.container) return { container: node.container, index: node.index + 1 };
    }
    const last = program.events[program.events.length - 1];
    return last ? { container: ckey(last.id, "body"), index: last.body.length } : null;
  }, [selection, program, flat]);

  const addEntry = useCallback(
    (entry: MbPaletteEntry) => {
      if (readOnly) return;
      if (Date.now() - lastDragEnd.current < 200) return; // the click that follows a drag
      const ctx = { variables };

      if (entry.shape === "hat") {
        const event = entry.create(ctx);
        onChange({ events: [...program.events, event] });
        setSelection({ kind: "event", id: event.id });
        pendingFocus.current = event.id;
        say(`Added "${entry.label}". Now click blocks to fill it.`);
        return;
      }

      if (entry.shape === "statement") {
        const target = insertionPoint();
        if (!target) {
          say("Start with a hat block — on start, forever, or on button pressed.");
          return;
        }
        const stmt = entry.create(ctx);
        if (mbIsContainer(stmt.kind) && (depths.get(target.container) ?? 1) >= MAX_DEPTH) {
          say("That stack is already deeply nested — build this part somewhere shallower.");
          return;
        }
        onChange(insertStatement(program, target.container, target.index, stmt));
        setSelection({ kind: "statement", id: stmt.id });
        pendingFocus.current = stmt.id;
        say(`Added "${entry.label}".`);
        return;
      }

      // Reporters and tests fill a slot rather than joining a stack.
      if (entry.shape === "condition") {
        const stmt =
          selection?.kind === "statement" ? findStatement(program, selection.id) : null;
        if (stmt && (stmt.kind === "if" || stmt.kind === "while")) {
          const next = entry.create(ctx, stmt.cond);
          onChange(
            mutateStatement(program, stmt.id, (s) => setStatementExpr(s, ["cond"], next)),
          );
          say(`Changed the test to "${entry.label}".`);
          return;
        }
      }
      if (focusedSlot && (entry.shape === "value" || focusedSlot.boolean)) {
        const current = findStatement(program, focusedSlot.ownerId);
        if (current) {
          const next: MbExpr = entry.create(ctx);
          onChange(
            mutateStatement(program, focusedSlot.ownerId, (s) =>
              setStatementExpr(s, focusedSlot.path, next),
            ),
          );
          say(`Dropped "${entry.label}" into the slot you last used.`);
          return;
        }
      }
      say(
        entry.shape === "condition"
          ? "Select an if or while block first, then click this test."
          : "Click a value slot inside a block first, then click this sensor.",
      );
    },
    [
      readOnly,
      variables,
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
      const neighbour =
        flat.filter((n) => n.container === node.container && n.id !== id)[
          Math.max(0, node.index - 1)
        ]?.id ??
        (node.container ? ownerOf(node.container) : null);
      if (node.type === "event") {
        onChange({ events: program.events.filter((e) => e.id !== id) });
        say("Deleted the hat block and everything inside it.");
      } else {
        onChange(removeStatement(program, id).program);
        say("Deleted the block.");
      }
      if (neighbour) {
        setSelection(
          program.events.some((e) => e.id === neighbour)
            ? { kind: "event", id: neighbour }
            : { kind: "statement", id: neighbour },
        );
        pendingFocus.current = neighbour;
      } else {
        setSelection(null);
      }
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
      onChange(editList(program, node.container, (l) => arrayMove(l, node.index, to)));
      pendingFocus.current = id;
      say(`Moved the block ${delta > 0 ? "down" : "up"}.`);
    },
    [readOnly, flat, program, onChange, say],
  );

  const navigate = useCallback(
    (id: string, delta: number) => {
      const at = flat.findIndex((n) => n.id === id);
      const next = flat[at + delta];
      if (!next) return;
      setSelection(
        next.type === "event"
          ? { kind: "event", id: next.id }
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
      for (let i = at - 1; i >= 0; i--) {
        if (flat[i].depth < here.depth) {
          setSelection(
            flat[i].type === "event"
              ? { kind: "event", id: flat[i].id }
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

  /** Only the targets this drag can land on, precise ones before their stack. */
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
    setActiveId(String(e.active.id));
    const entry = data?.type === "palette" ? (data.entry as MbPaletteEntry) : null;
    // The ref, not the state, is what collision detection reads — it has to be
    // right on the very first move, before React has re-rendered.
    dragShapeRef.current = entry ? entry.shape : "statement";
    setDragEntry(entry);
    setDragShape(dragShapeRef.current);
  };

  const onDragOver = (e: DragOverEvent) => setOverId(e.over ? String(e.over.id) : null);

  const clearDrag = () => {
    dragShapeRef.current = null;
    setActiveId(null);
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
      const entry = active.entry as MbPaletteEntry;
      const ctx = { variables };

      if (entry.shape === "hat") {
        const event = entry.create(ctx);
        onChange({ events: [...program.events, event] });
        setSelection({ kind: "event", id: event.id });
        pendingFocus.current = event.id;
        say(`Added "${entry.label}".`);
        return;
      }
      if (entry.shape === "statement") {
        const target = targetOf(over);
        if (!target) return;
        const stmt = entry.create(ctx);
        if (mbIsContainer(stmt.kind) && (depths.get(target.container) ?? 1) >= MAX_DEPTH) {
          say("That stack is already deeply nested — build this part somewhere shallower.");
          return;
        }
        onChange(insertStatement(program, target.container, target.index, stmt));
        setSelection({ kind: "statement", id: stmt.id });
        pendingFocus.current = stmt.id;
        say(`Added "${entry.label}".`);
        return;
      }
      if (over.type === "value-slot") {
        const ownerId = over.ownerId as string;
        const path = over.path as string[];
        const current = findStatement(program, ownerId);
        const existing =
          entry.shape === "condition" && current && "cond" in current
            ? (current as Extract<MbStatement, { kind: "if" | "while" }>).cond
            : undefined;
        const next =
          entry.shape === "condition" ? entry.create(ctx, existing) : entry.create(ctx);
        onChange(
          mutateStatement(program, ownerId, (s) => setStatementExpr(s, path, next)),
        );
        say(`Dropped "${entry.label}" into the block.`);
      }
      return;
    }

    // 2 — moving a block that is already in the program
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
        pendingFocus.current = stmtId;
        say("Moved the block.");
        return;
      }

      const moving = findStatement(program, stmtId);
      if (!moving) return;
      if (collectIds(moving).includes(ownerOf(target.container))) {
        say("A block cannot be dropped inside itself.");
        return;
      }
      if (mbIsContainer(moving.kind) && (depths.get(target.container) ?? 1) >= MAX_DEPTH) {
        say("That stack is already deeply nested — try a shallower place.");
        return;
      }
      const { program: without, removed } = removeStatement(program, stmtId);
      if (!removed) return;
      onChange(insertStatement(without, target.container, target.index, removed));
      setSelection({ kind: "statement", id: stmtId });
      pendingFocus.current = stmtId;
      say("Moved the block into another stack.");
    }
  };

  const api: EditorApi = {
    readOnly,
    variables,
    selection,
    select,
    tabTargetId,
    update,
    removeBlock,
    moveWithin,
    navigate,
    navigateInto,
    navigateOut,
    focusFirstField,
    registerNode,
    setFocusedSlot,
    say,
    dragShape,
    activeId,
    overId,
  };

  const draggedStatement =
    dragShape === "statement" && activeId ? findStatement(program, activeId) : null;

  return (
    <DndContext
      // Fixed id — dnd-kit otherwise numbers its aria ids from a module counter,
      // which drifts between the prerendered HTML and the client.
      id="mb-block-editor"
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
            <Palette active={activeCat} onSelect={setActiveCat} onAdd={addEntry} />
          )}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
            <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-900 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
                  micro:bit
                </p>
                <h3 className="font-display text-[15px] font-semibold text-white">
                  My program
                </h3>
              </div>
              <div className="hidden max-w-[45%] flex-wrap items-center justify-end gap-1 sm:flex">
                {variables.map((name) => (
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
                "thin-scroll max-h-[62vh] min-h-80 flex-1 overflow-auto bg-ink-50 p-4 pt-1",
                "[background-image:radial-gradient(var(--color-ink-200)_1px,transparent_1px)] [background-size:18px_18px]",
                canvasOver && "ring-2 ring-brand-500 ring-inset",
              )}
            >
              {program.events.length === 0 ? (
                <div className="mt-3 flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-ink-300 bg-white/70 p-6 text-center">
                  <Power className="size-7 text-ink-300" aria-hidden />
                  <p className="max-w-sm text-[14px] text-ink-500">
                    Every micro:bit program starts with a hat block. Click one in{" "}
                    <span className="font-semibold text-ink-700">Basic</span> or{" "}
                    <span className="font-semibold text-ink-700">Input</span> — or drag
                    it here.
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap items-start justify-center gap-3">
                      {MB_PALETTE_BY_CATEGORY.basic
                        .filter((entry) => entry.shape === "hat")
                        .map((entry) => (
                          <button
                            key={entry.kind}
                            type="button"
                            onClick={() => addEntry(entry)}
                            className="w-[136px] cursor-pointer transition-transform hover:-translate-y-px"
                          >
                            <MiniBlock entry={entry} />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                program.events.map((event) => <EventNode key={event.id} event={event} />)
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
            <span className="block w-[168px] drop-shadow-lg">
              <MiniBlock entry={dragEntry} />
            </span>
          )}
          {draggedStatement && (
            <span
              className="inline-flex min-h-8 items-center rounded-[4px] px-2.5 text-[13.5px] font-semibold whitespace-nowrap text-white shadow-pop"
              style={{
                background: MB_CATEGORIES[MB_STATEMENT_CATEGORY[draggedStatement.kind]].hex,
                textShadow: TEXT_SHADOW,
              }}
            >
              {mbStatementText(draggedStatement)}
            </span>
          )}
        </DragOverlay>
      </EditorCtx.Provider>
    </DndContext>
  );
}
