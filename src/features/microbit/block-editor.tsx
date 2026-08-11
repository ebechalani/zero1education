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
  ChevronRight,
  CircleDot,
  GripVertical,
  Keyboard,
  Minus,
  MousePointerClick,
  Plus,
  Power,
  Repeat,
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

// ── Inline field atoms ──────────────────────────────────────────────────────

const FIELD =
  "h-8 rounded-md bg-white text-[14px] font-mono font-semibold text-ink-900 ring-1 ring-ink-900/15 disabled:bg-white/70 disabled:text-ink-400";

/** Typing inside a block must not reach the block's own arrow/Delete keys. */
const stopKeys = (e: ReactKeyboardEvent) => {
  if (e.key !== "Escape") e.stopPropagation();
};

function W({ children }: { children: ReactNode }) {
  return (
    <span className="px-0.5 text-[15px] leading-none font-semibold whitespace-nowrap">
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
        FIELD,
        "px-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
      )}
      style={{ width: `calc(${Math.max(1, shown.length)}ch + 1.15rem)` }}
    />
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
      className={cn(FIELD, "px-2")}
      style={{ width: `calc(${Math.max(4, value.length)}ch + 1.25rem)` }}
    />
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
  return (
    <span className="relative inline-flex items-center">
      {lead && <span className="pointer-events-none absolute left-1.5 z-10">{lead}</span>}
      <select
        data-field
        aria-label={label}
        value={value}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          FIELD,
          "cursor-pointer appearance-none py-0 pr-6",
          lead ? "pl-6" : "pl-2",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 size-3.5 text-ink-400"
        aria-hidden
      />
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
        className={cn(FIELD, "w-28 px-2")}
      />
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

/** Icon picker — expands on its own line inside the block, never clipped. */
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
    <>
      <button
        data-field
        type="button"
        aria-expanded={open}
        aria-label={`Icon: ${MB_ICON_LABEL[icon]}. Choose another`}
        disabled={readOnly}
        tabIndex={tabIndex}
        onKeyDown={stopKeys}
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, "inline-flex cursor-pointer items-center gap-1.5 px-1.5")}
      >
        <IconGrid icon={icon} />
        <span className="text-[13px]">{MB_ICON_LABEL[icon]}</span>
        <ChevronDown className="size-3.5 text-ink-400" aria-hidden />
      </button>
      {open && !readOnly && (
        <div
          role="group"
          aria-label="Pick an icon"
          className="mt-1 flex w-full basis-full flex-wrap gap-1.5 rounded-md bg-black/15 p-1.5"
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
        </div>
      )}
    </>
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

  const grouped = expr.kind === "binop" || expr.kind === "random";
  const childBoolean = expr.kind === "binop" && MB_LOGIC_OPS.includes(expr.op);
  const opOptions = boolean
    ? [...MB_COMPARISONS, ...MB_LOGIC_OPS]
    : [...MB_MATH_OPS, ...MB_COMPARISONS];

  return (
    <span
      ref={setNodeRef}
      onFocus={() => setFocusedSlot({ ownerId, path, boolean })}
      className={cn(
        "inline-flex items-center gap-1 rounded-md",
        grouped && "bg-black/15 px-1 py-1",
        slotLive && "ring-2 ring-white/50",
        slotLive && isOver && "ring-2 ring-white",
      )}
    >
      {naming ? (
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
          className={cn(FIELD, "w-24 px-2")}
        />
      ) : (
        <>
          {expr.kind === "num" && (
            <NumberField
              ownerId={ownerId}
              value={expr.value}
              label={label}
              onCommit={(n) => set(mbNum(n))}
            />
          )}
          {expr.kind === "var" && (
            <span className={cn(FIELD, "inline-flex items-center px-2 text-coral-700")}>
              {expr.name}
            </span>
          )}
          {(expr.kind === "temperature" ||
            expr.kind === "humidity" ||
            expr.kind === "light") && (
            <span className={cn(FIELD, "inline-flex items-center px-2 text-amber-700")}>
              {SENSOR_LABEL[expr.kind]}
            </span>
          )}
          {expr.kind === "random" && (
            <>
              <W>random</W>
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
            </>
          )}
          {expr.kind === "binop" && (
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
                options={opOptions.map((op) => ({
                  value: op,
                  label: MB_OP_LABEL[op],
                }))}
                onChange={(op) => set({ ...expr, op: op as MbBinOp })}
              />
              <ValueSlot
                ownerId={ownerId}
                path={[...path, "right"]}
                expr={expr.right}
                label={`${label} right side`}
                boolean={childBoolean}
              />
            </>
          )}
          {!readOnly && (
            <span className="relative inline-flex size-6 items-center justify-center rounded-md bg-white/90 ring-1 ring-ink-900/15 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500">
              <select
                data-field
                aria-label={`What goes in ${label}`}
                value={slotKindValue(expr)}
                tabIndex={tabIndex}
                onKeyDown={stopKeys}
                onChange={(e) => changeKind(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {kindOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-3.5 text-ink-500" aria-hidden />
            </span>
          )}
        </>
      )}
    </span>
  );
}

// ── The words and fields of each statement ──────────────────────────────────

function StatementFields({ stmt }: { stmt: MbStatement }) {
  const { update, say } = useEditor();
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
          <ElseToggle stmt={stmt} onToggle={set} say={say} />
        </>
      );
  }
}

function ElseToggle({
  stmt,
  onToggle,
  say,
}: {
  stmt: Extract<MbStatement, { kind: "if" }>;
  onToggle: (next: MbStatement) => void;
  say: (message: string) => void;
}) {
  const { readOnly } = useEditor();
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
          onToggle(rest);
          say(
            otherwise && otherwise.length > 0
              ? "Removed the else part and the blocks inside it."
              : "Removed the else part.",
          );
        } else {
          onToggle({ ...stmt, otherwise: [] });
          say("Added an else part — blocks in there run when the test is false.");
        }
      }}
      className="ml-1 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-black/15 px-2 text-[12.5px] font-semibold hover:bg-black/25"
    >
      {hasElse ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
      else
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
        "flex w-full cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
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
      className={cn(
        "min-h-10 space-y-2 rounded-md",
        dragShape === "statement" && isOver && "outline-2 outline-dashed outline-brand-500",
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

/** The indented, railed area that makes nesting visible. */
function BodyRegion({
  containerKey,
  items,
  depth,
  flush,
}: {
  containerKey: ContainerKey;
  items: MbStatement[];
  depth: number;
  flush?: boolean;
}) {
  return (
    <div className="flex">
      <span className="w-5 shrink-0" aria-hidden />
      <div
        className={cn(
          "min-w-0 flex-1 bg-ink-50 p-2 shadow-[inset_0_1px_3px_rgba(11,17,32,0.14)]",
          flush ? "rounded-l-lg" : "rounded-lg",
        )}
      >
        <StackList containerKey={containerKey} items={items} depth={depth} />
      </div>
    </div>
  );
}

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
      className="mt-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-black/15 opacity-70 transition hover:bg-black/30 hover:opacity-100"
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
      className={cn("relative", isDragging && "opacity-40")}
    >
      {dropping && (
        <span
          className="absolute -top-1 left-0 z-10 h-1.5 w-full rounded-full bg-brand-500 shadow-glow"
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
        className={cn(
          "relative rounded-lg shadow-card outline-none",
          cat.face,
          shell && "overflow-hidden",
          selected && "ring-2 ring-brand-500 ring-offset-2 ring-offset-ink-50",
        )}
      >
        <span
          className="absolute top-0 left-4 h-1.5 w-5 rounded-b-[4px] bg-black/20"
          aria-hidden
        />
        <div className="flex items-start gap-1 px-1.5 py-1">
          {!editor.readOnly && (
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              type="button"
              tabIndex={-1}
              aria-label={`Drag ${mbStatementText(stmt)}`}
              className="mt-1 flex h-8 w-4 shrink-0 cursor-grab touch-none items-center justify-center rounded opacity-60 hover:opacity-100 active:cursor-grabbing"
            >
              <GripVertical className="size-4" aria-hidden />
            </button>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1">
            <StatementFields stmt={stmt} />
          </div>
          {!editor.readOnly && (
            <DeleteButton
              onClick={() => editor.removeBlock(stmt.id)}
              label={`Delete ${mbStatementText(stmt)}`}
            />
          )}
        </div>
        {shell && (
          <div className="pb-2.5">
            <BodyRegion
              containerKey={ckey(shell.id, shell.kind === "if" ? "then" : "body")}
              items={shell.kind === "if" ? shell.then : shell.body}
              depth={depth + 1}
              flush
            />
            {shell.kind === "if" && shell.otherwise && (
              <>
                <p className="px-3 py-1.5 text-[15px] font-semibold">else</p>
                <BodyRegion
                  containerKey={ckey(shell.id, "else")}
                  items={shell.otherwise}
                  depth={depth + 1}
                  flush
                />
              </>
            )}
          </div>
        )}
      </div>
      <span
        className={cn(
          "pointer-events-none absolute top-full left-4 h-1.5 w-5 rounded-b-[4px]",
          cat.bg,
        )}
        aria-hidden
      />
    </div>
  );
}

const HAT_ICON: Record<MbEvent["kind"], typeof Power> = {
  "on-start": Power,
  forever: Repeat,
  "on-button": CircleDot,
};

function EventNode({ event }: { event: MbEvent }) {
  const editor = useEditor();
  const cat = MB_CATEGORIES[MB_EVENT_CATEGORY[event.kind]];
  const selected = editor.selection?.kind === "event" && editor.selection.id === event.id;
  const Icon = HAT_ICON[event.kind];

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
      className={cn(
        "animate-fade-up rounded-t-[22px] rounded-b-xl shadow-pop outline-none",
        cat.face,
        selected && "ring-2 ring-brand-500 ring-offset-2 ring-offset-ink-50",
      )}
    >
      <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-2">
        <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
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
        </div>
        {!editor.readOnly && (
          <DeleteButton
            onClick={() => editor.removeBlock(event.id)}
            label={`Delete ${mbEventText(event)} and everything inside it`}
          />
        )}
      </div>
      <div className="px-2 pb-2">
        <BodyRegion
          containerKey={ckey(event.id, "body")}
          items={event.body}
          depth={1}
        />
      </div>
    </div>
  );
}

// ── Palette ─────────────────────────────────────────────────────────────────

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
      onClick={() => onAdd(entry)}
      className={cn(
        "flex w-full cursor-grab touch-none flex-col items-stretch gap-1 rounded-lg p-1 text-left transition-colors hover:bg-ink-100 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <span
        className={cn(
          "relative rounded-lg px-2.5 py-1.5 text-[14px] font-semibold shadow-card",
          entry.colour,
          entry.shape === "hat" && "rounded-t-[16px]",
        )}
      >
        <span
          className="absolute top-0 left-3 h-1 w-4 rounded-b-[3px] bg-black/20"
          aria-hidden
        />
        {entry.label}
      </span>
      <span className="px-1 text-[11px] leading-snug text-ink-400">{entry.help}</span>
    </button>
  );
}

function PaletteGroup({
  category,
  open,
  onToggle,
  onAdd,
}: {
  category: MbCategory;
  open: boolean;
  onToggle: () => void;
  onAdd: (entry: MbPaletteEntry) => void;
}) {
  const cat = MB_CATEGORIES[category];
  const entries = MB_PALETTE_BY_CATEGORY[category];
  return (
    <section className="border-b border-ink-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-ink-50"
      >
        <span className={cn("size-3 shrink-0 rounded-[4px]", cat.accent)} aria-hidden />
        <span className="flex-1 font-display text-[14px] font-semibold text-ink-800">
          {cat.label}
        </span>
        <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[10px]", cat.soft)}>
          {entries.length}
        </span>
        {open ? (
          <ChevronDown className="size-4 text-ink-400" aria-hidden />
        ) : (
          <ChevronRight className="size-4 text-ink-400" aria-hidden />
        )}
      </button>
      {open && (
        <div className="space-y-1 px-2 pb-2.5">
          {entries.map((entry) => (
            <PaletteItem key={entry.kind} entry={entry} onAdd={onAdd} />
          ))}
        </div>
      )}
    </section>
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
  const [openCats, setOpenCats] = useState<MbCategory[]>(["basic", "input"]);
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
            <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card lg:w-[268px]">
              <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
                <Blocks className="size-4 text-brand-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[15px] font-semibold text-ink-900">
                    Blocks
                  </h3>
                  <p className="text-[11px] text-ink-400">Click to add · drag to place</p>
                </div>
              </div>
              <div className="thin-scroll max-h-[62vh] flex-1 overflow-y-auto">
                {MB_CATEGORY_ORDER.map((category) => (
                  <PaletteGroup
                    key={category}
                    category={category}
                    open={openCats.includes(category)}
                    onToggle={() =>
                      setOpenCats((open) =>
                        open.includes(category)
                          ? open.filter((c) => c !== category)
                          : [...open, category],
                      )
                    }
                    onAdd={addEntry}
                  />
                ))}
              </div>
            </aside>
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

            <div
              ref={setCanvasRef}
              className={cn(
                "thin-scroll max-h-[62vh] min-h-80 flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4",
                "[background-image:radial-gradient(var(--color-ink-200)_1px,transparent_1px)] [background-size:18px_18px]",
                canvasOver && "ring-2 ring-brand-500 ring-inset",
              )}
            >
              {program.events.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-ink-300 bg-white/70 p-6 text-center">
                  <Power className="size-7 text-ink-300" aria-hidden />
                  <p className="max-w-sm text-[14px] text-ink-500">
                    Every micro:bit program starts with a hat block. Click one in{" "}
                    <span className="font-semibold text-ink-700">Basic</span> or{" "}
                    <span className="font-semibold text-ink-700">Input</span> — or drag
                    it here.
                  </p>
                  {!readOnly && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {MB_PALETTE_BY_CATEGORY.basic
                        .filter((entry) => entry.shape === "hat")
                        .map((entry) => (
                          <button
                            key={entry.kind}
                            type="button"
                            onClick={() => addEntry(entry)}
                            className={cn(
                              "cursor-pointer rounded-lg rounded-t-[16px] px-3.5 py-2 text-[14px] font-semibold shadow-card transition hover:brightness-110",
                              entry.colour,
                            )}
                          >
                            {entry.label}
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
            <span
              className={cn(
                "inline-block rounded-lg px-3 py-2 text-[14px] font-semibold shadow-pop",
                dragEntry.colour,
              )}
            >
              {dragEntry.label}
            </span>
          )}
          {draggedStatement && (
            <span
              className={cn(
                "inline-block rounded-lg px-3 py-2 text-[14px] font-semibold shadow-pop",
                MB_CATEGORIES[MB_STATEMENT_CATEGORY[draggedStatement.kind]].face,
              )}
            >
              {mbStatementText(draggedStatement)}
            </span>
          )}
        </DragOverlay>
      </EditorCtx.Provider>
    </DndContext>
  );
}
