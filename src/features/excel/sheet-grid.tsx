"use client";

/**
 * The spreadsheet itself: column letters and row numbers, a selected cell you
 * can see from the back of the class, a formula bar that shows the formula
 * while the cell shows the answer, and the Home ribbon of Chapter 2 — bold,
 * fill colour, borders, Merge & Center, alignment, orientation, wrapping,
 * number formats, insert/delete and Hide & Unhide.
 *
 * The look copies Excel on purpose: a student is holding a printed screenshot
 * next to the screen and has to recognise the buttons the book names.
 *
 * Three pieces live here — `useSheetController` (all of the state and every
 * edit), `SheetRibbon` / `FormulaBar` / `SheetGrid` (what you see). The studio
 * puts them together.
 */

import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ChevronDown,
  Columns3,
  Eye,
  EyeOff,
  Grid2x2X,
  Minus,
  PaintBucket,
  Plus,
  Redo2,
  Rows3,
  Search,
  Table2,
  Type,
  Undo2,
  WrapText,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ERROR_HELP,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
  ORIENTATIONS,
  SWATCHES,
  accountingParts,
  cloneSheet,
  colName,
  colWidth,
  colorHex,
  defaultContext,
  describeCell,
  displayText,
  effectiveAlign,
  evaluateSheet,
  formatOf,
  isCellError,
  isColHidden,
  isCovered,
  isRowHidden,
  mergeAt,
  normalizeRange,
  rangeName,
  rangeRefs,
  rawOf,
  refName,
  rowHeight,
  translateFormula,
  valueAt,
  withBorders,
  withCell,
  withCleared,
  withDeleteCol,
  withDeleteRow,
  withFormat,
  withHidden,
  withInsertCol,
  withInsertRow,
  withMerge,
  withSize,
  withUnmerge,
  type BorderPreset,
  type BorderStyle,
  type CellAddr,
  type CellFormat,
  type CellValue,
  type EvalContext,
  type FormatPatch,
  type NumberFormat,
  type Orientation,
  type RangeAddr,
  type Sheet,
} from "./sheet-model";

// ── The Excel chrome palette (cell colours come from the model) ─────────────

const XL = {
  green: "#217346",
  greenDark: "#1c5e39",
  line: "#d4d4d4",
  header: "#f5f5f5",
  headerText: "#5f5f5f",
  headerActive: "#cfe8dc",
  ribbon: "#f8f8f8",
  ribbonLine: "#e1e1e1",
  selection: "rgba(33, 115, 70, 0.08)",
  errorText: "#c00000",
};

// ── Selection ───────────────────────────────────────────────────────────────

export interface Selection {
  anchor: CellAddr;
  focus: CellAddr;
}

export const selectionRange = (sel: Selection): RangeAddr =>
  normalizeRange({
    r1: sel.anchor.row,
    c1: sel.anchor.col,
    r2: sel.focus.row,
    c2: sel.focus.col,
  });

export interface EditState {
  ref: string;
  draft: string;
}

// ── The controller ──────────────────────────────────────────────────────────

export interface SheetController {
  sheet: Sheet;
  values: Map<string, CellValue>;
  selection: Selection;
  range: RangeAddr;
  activeRef: string;
  /** Format of the cell the keyboard is on — drives the ribbon's pressed state. */
  format: CellFormat;
  edit: EditState | null;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  setZoom: (z: number) => void;
  select: (row: number, col: number, extend?: boolean) => void;
  moveBy: (dRow: number, dCol: number, extend?: boolean) => void;
  beginEdit: (seed?: string) => void;
  changeDraft: (text: string) => void;
  commit: (move?: "down" | "right" | "up" | "left" | "stay") => void;
  cancel: () => void;
  clear: () => void;
  applyFormat: (patch: FormatPatch) => void;
  applyBorders: (preset: BorderPreset, style: BorderStyle) => void;
  toggleMerge: () => void;
  setHidden: (axis: "row" | "col", hidden: boolean) => void;
  unhideAll: () => void;
  insertLine: (axis: "row" | "col") => void;
  deleteLine: (axis: "row" | "col") => void;
  fillDown: () => void;
  resize: (axis: "row" | "col", index: number, px: number) => void;
  nudgeSize: (axis: "row" | "col", px: number) => void;
  undo: () => void;
  redo: () => void;
  reset: (sheet: Sheet) => void;
}

const HISTORY_LIMIT = 60;

interface History {
  past: Sheet[];
  present: Sheet;
  future: Sheet[];
}

export function useSheetController(
  initial: Sheet,
  ctx: EvalContext = defaultContext(),
): SheetController {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: cloneSheet(initial),
    future: [],
  }));
  const [selection, setSelection] = useState<Selection>({
    anchor: { row: 1, col: 1 },
    focus: { row: 1, col: 1 },
  });
  const [edit, setEdit] = useState<EditState | null>(null);
  const [zoom, setZoom] = useState(1);

  const sheet = history.present;
  const values = useMemo(() => evaluateSheet(sheet, ctx), [sheet, ctx]);
  const range = useMemo(() => selectionRange(selection), [selection]);
  const activeRef = refName(selection.focus.row, selection.focus.col);

  /** Every edit goes through here, which is what makes Undo possible. */
  const change = useCallback((make: (current: Sheet) => Sheet) => {
    setHistory((h) => {
      const next = make(h.present);
      if (next === h.present) return h;
      return {
        past: [...h.past, h.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
      };
    });
  }, []);

  const select = useCallback((row: number, col: number, extend = false) => {
    setSelection((sel) =>
      extend
        ? { anchor: sel.anchor, focus: { row, col } }
        : { anchor: { row, col }, focus: { row, col } },
    );
  }, []);

  const moveBy = useCallback(
    (dRow: number, dCol: number, extend = false) => {
      setSelection((sel) => {
        let row = sel.focus.row;
        let col = sel.focus.col;
        if (dRow) {
          let next = row + dRow;
          while (next >= 1 && next <= sheet.rowCount && isRowHidden(sheet, next)) {
            next += dRow;
          }
          if (next >= 1 && next <= sheet.rowCount) row = next;
        }
        if (dCol) {
          let next = col + dCol;
          while (next >= 1 && next <= sheet.colCount && isColHidden(sheet, next)) {
            next += dCol;
          }
          if (next >= 1 && next <= sheet.colCount) col = next;
        }
        return extend
          ? { anchor: sel.anchor, focus: { row, col } }
          : { anchor: { row, col }, focus: { row, col } };
      });
    },
    [sheet],
  );

  const beginEdit = useCallback(
    (seed?: string) => {
      setEdit({ ref: activeRef, draft: seed ?? rawOf(sheet, activeRef) });
    },
    [activeRef, sheet],
  );

  const changeDraft = useCallback((text: string) => {
    setEdit((e) => (e ? { ...e, draft: text } : e));
  }, []);

  const commit = useCallback(
    (move: "down" | "right" | "up" | "left" | "stay" = "down") => {
      if (edit && rawOf(sheet, edit.ref) !== edit.draft) {
        change((s) => withCell(s, edit.ref, edit.draft));
      }
      setEdit(null);
      if (move === "down") moveBy(1, 0);
      else if (move === "up") moveBy(-1, 0);
      else if (move === "right") moveBy(0, 1);
      else if (move === "left") moveBy(0, -1);
    },
    [change, edit, moveBy, sheet],
  );

  const cancel = useCallback(() => setEdit(null), []);

  const clear = useCallback(() => {
    const refs = rangeRefs(range);
    change((s) => withCleared(s, refs));
  }, [change, range]);

  const applyFormat = useCallback(
    (patch: FormatPatch) => {
      const refs = rangeRefs(range);
      change((s) => withFormat(s, refs, patch));
    },
    [change, range],
  );

  const applyBorders = useCallback(
    (preset: BorderPreset, style: BorderStyle) => {
      change((s) => withBorders(s, range, preset, style));
    },
    [change, range],
  );

  const toggleMerge = useCallback(() => {
    const { row, col } = selection.focus;
    change((s) => {
      if (mergeAt(s, row, col)) return withUnmerge(s, row, col);
      if (range.r1 === range.r2 && range.c1 === range.c2) return s;
      return withFormat(withMerge(s, range), [refName(range.r1, range.c1)], {
        align: "center",
        valign: "middle",
      });
    });
  }, [change, range, selection.focus]);

  const setHidden = useCallback(
    (axis: "row" | "col", hidden: boolean) => {
      const indexes =
        axis === "row" ? countUp(range.r1, range.r2) : countUp(range.c1, range.c2);
      change((s) => withHidden(s, axis, indexes, hidden));
    },
    [change, range],
  );

  const unhideAll = useCallback(() => {
    change((s) => {
      const rows = withHidden(s, "row", s.hiddenRows, false);
      return withHidden(rows, "col", rows.hiddenCols, false);
    });
  }, [change]);

  const insertLine = useCallback(
    (axis: "row" | "col") => {
      change((s) =>
        axis === "row" ? withInsertRow(s, range.r1) : withInsertCol(s, range.c1),
      );
    },
    [change, range],
  );

  const deleteLine = useCallback(
    (axis: "row" | "col") => {
      change((s) =>
        axis === "row" ? withDeleteRow(s, range.r1) : withDeleteCol(s, range.c1),
      );
    },
    [change, range],
  );

  /** Ctrl+D and the fill handle: copy the top row of the selection downwards. */
  const fillDown = useCallback(() => {
    change((s) => {
      let next = s;
      const last =
        range.r2 > range.r1 ? range.r2 : Math.min(range.r1 + 1, s.rowCount);
      for (let col = range.c1; col <= range.c2; col += 1) {
        const source = refName(range.r1, col);
        const raw = rawOf(s, source);
        const format = formatOf(s, source);
        for (let row = range.r1 + 1; row <= last; row += 1) {
          const target = refName(row, col);
          next = withCell(next, target, translateFormula(raw, row - range.r1, 0));
          next = withFormat(next, [target], { ...format });
        }
      }
      return next;
    });
  }, [change, range]);

  const resize = useCallback(
    (axis: "row" | "col", index: number, px: number) => {
      change((s) => withSize(s, axis, index, px));
    },
    [change],
  );

  const nudgeSize = useCallback(
    (axis: "row" | "col", px: number) => {
      change((s) => {
        let next = s;
        if (axis === "col") {
          for (let col = range.c1; col <= range.c2; col += 1) {
            next = withSize(next, "col", col, colWidth(next, col) + px);
          }
        } else {
          for (let row = range.r1; row <= range.r2; row += 1) {
            next = withSize(next, "row", row, rowHeight(next, row) + px);
          }
        }
        return next;
      });
    },
    [change, range],
  );

  const undo = useCallback(() => {
    setEdit(null);
    setHistory((h) =>
      h.past.length === 0
        ? h
        : {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future].slice(0, HISTORY_LIMIT),
          },
    );
  }, []);

  const redo = useCallback(() => {
    setEdit(null);
    setHistory((h) =>
      h.future.length === 0
        ? h
        : {
            past: [...h.past, h.present].slice(-HISTORY_LIMIT),
            present: h.future[0],
            future: h.future.slice(1),
          },
    );
  }, []);

  const reset = useCallback((next: Sheet) => {
    setHistory({ past: [], present: cloneSheet(next), future: [] });
    setEdit(null);
    setSelection({ anchor: { row: 1, col: 1 }, focus: { row: 1, col: 1 } });
  }, []);

  return {
    sheet,
    values,
    selection,
    range,
    activeRef,
    format: formatOf(sheet, activeRef),
    edit,
    zoom,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setZoom,
    select,
    moveBy,
    beginEdit,
    changeDraft,
    commit,
    cancel,
    clear,
    applyFormat,
    applyBorders,
    toggleMerge,
    setHidden,
    unhideAll,
    insertLine,
    deleteLine,
    fillDown,
    resize,
    nudgeSize,
    undo,
    redo,
    reset,
  };
}

const countUp = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ── Small chrome pieces ─────────────────────────────────────────────────────

function RibbonButton({
  label,
  onClick,
  pressed,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded border border-transparent px-2 text-[12px] font-medium text-ink-700 transition-colors hover:border-ink-200 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40",
        pressed && "border-ink-200 bg-ink-100 text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function Dropdown({
  label,
  children,
  icon,
  width = 260,
}: {
  label: string;
  children: (close: () => void) => ReactNode;
  icon: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = useCallback(() => {
    if (ref.current) ref.current.open = false;
  }, []);

  useEffect(() => {
    const onDocumentDown = (event: MouseEvent) => {
      const node = ref.current;
      if (!node?.open) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      node.open = false;
    };
    document.addEventListener("mousedown", onDocumentDown);
    return () => document.removeEventListener("mousedown", onDocumentDown);
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={label}
        title={label}
        className="inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded border border-transparent px-2 text-[12px] font-medium text-ink-700 transition-colors hover:border-ink-200 hover:bg-ink-50 [&::-webkit-details-marker]:hidden"
      >
        {icon}
        <ChevronDown className="size-3 text-ink-400" aria-hidden />
      </summary>
      <div
        className="animate-pop absolute top-9 left-0 z-40 rounded-lg border border-ink-200 bg-white p-2 shadow-pop"
        style={{ width }}
      >
        {children(close)}
      </div>
    </details>
  );
}

function SwatchGrid({
  onPick,
  onClear,
  clearLabel,
  current,
}: {
  onPick: (key: string) => void;
  onClear: () => void;
  clearLabel: string;
  current?: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-1">
        {SWATCHES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onPick(s.key)}
            aria-label={s.label}
            aria-pressed={current === s.key}
            title={s.label}
            className={cn(
              "size-8 cursor-pointer rounded border transition-transform hover:scale-110",
              current === s.key
                ? "border-ink-900 ring-2 ring-ink-900"
                : "border-ink-200",
            )}
            style={{ background: s.hex }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 h-8 w-full cursor-pointer rounded border border-ink-200 text-[12px] font-medium text-ink-700 hover:bg-ink-50"
      >
        {clearLabel}
      </button>
    </div>
  );
}

const MenuItem = ({
  onClick,
  children,
  active,
}: {
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex h-8 w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-[12.5px] text-ink-700 hover:bg-ink-50",
      active && "bg-ink-100 font-semibold text-ink-900",
    )}
  >
    {children}
  </button>
);

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col items-center gap-1 px-2">
    <div className="flex items-center gap-0.5">{children}</div>
    <span className="text-[9.5px] tracking-wide text-ink-400 uppercase">{title}</span>
  </div>
);

const Divider = () => <span className="h-10 w-px shrink-0 bg-ink-100" aria-hidden />;

// ── The ribbon ──────────────────────────────────────────────────────────────

const NUMBER_FORMATS: { id: NumberFormat; label: string; sample: string }[] = [
  { id: "general", label: "General", sample: "12" },
  { id: "integer", label: "Number, no decimals", sample: "12" },
  { id: "decimal1", label: "Number, 1 decimal", sample: "11.3" },
  { id: "decimal2", label: "Number, 2 decimals", sample: "11.33" },
  { id: "accounting", label: "Accounting Number Format", sample: "$ 2.00" },
  { id: "percent", label: "Percentage", sample: "50%" },
  { id: "date", label: "Date", sample: "3-Aug-21" },
];

const BORDER_PRESETS: { id: BorderPreset; label: string }[] = [
  { id: "all", label: "All Borders" },
  { id: "outline", label: "Outside Borders" },
  { id: "top", label: "Top Border" },
  { id: "bottom", label: "Bottom Border" },
  { id: "left", label: "Left Border" },
  { id: "right", label: "Right Border" },
  { id: "none", label: "No Border" },
];

const BORDER_STYLES: BorderStyle[] = ["thin", "medium", "thick", "double"];

const ALIGN_ICON = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
} as const;

export function SheetRibbon({ ctl }: { ctl: SheetController }) {
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("thin");
  const f = ctl.format;
  const merged = !!mergeAt(ctl.sheet, ctl.selection.focus.row, ctl.selection.focus.col);
  const hiddenCount = ctl.sheet.hiddenRows.length + ctl.sheet.hiddenCols.length;

  return (
    <div
      className="thin-scroll overflow-x-auto border-b"
      style={{ background: XL.ribbon, borderColor: XL.ribbonLine }}
    >
      <div className="flex min-w-max items-stretch gap-1 px-2 py-1.5">
        <Group title="Undo">
          <RibbonButton label="Undo" onClick={ctl.undo} disabled={!ctl.canUndo}>
            <Undo2 className="size-4" aria-hidden />
          </RibbonButton>
          <RibbonButton label="Redo" onClick={ctl.redo} disabled={!ctl.canRedo}>
            <Redo2 className="size-4" aria-hidden />
          </RibbonButton>
        </Group>
        <Divider />

        <Group title="Font">
          <RibbonButton
            label="Bold"
            pressed={!!f.bold}
            onClick={() => ctl.applyFormat({ bold: f.bold ? null : true })}
          >
            <span className="font-serif text-[15px] font-bold">B</span>
          </RibbonButton>
          <RibbonButton
            label="Italic"
            pressed={!!f.italic}
            onClick={() => ctl.applyFormat({ italic: f.italic ? null : true })}
          >
            <span className="font-serif text-[15px] italic">I</span>
          </RibbonButton>
          <RibbonButton
            label="Underline"
            pressed={!!f.underline}
            onClick={() => ctl.applyFormat({ underline: f.underline ? null : true })}
          >
            <span className="font-serif text-[15px] underline">U</span>
          </RibbonButton>
          <RibbonButton
            label="Decrease font size"
            onClick={() => ctl.applyFormat({ size: Math.max(8, (f.size ?? 11) - 1) })}
          >
            <span className="text-[11px] font-bold">A-</span>
          </RibbonButton>
          <RibbonButton
            label="Increase font size"
            onClick={() => ctl.applyFormat({ size: Math.min(36, (f.size ?? 11) + 1) })}
          >
            <span className="text-[13px] font-bold">A+</span>
          </RibbonButton>
          <Dropdown
            label="Fill Color"
            icon={
              <span className="flex flex-col items-center leading-none">
                <PaintBucket className="size-3.5" aria-hidden />
                <span
                  className="mt-0.5 block h-1 w-4 rounded-sm border border-ink-200"
                  style={{ background: colorHex(f.fill) ?? "#ffffff" }}
                />
              </span>
            }
          >
            {(close) => (
              <SwatchGrid
                current={f.fill}
                onPick={(key) => {
                  ctl.applyFormat({ fill: key });
                  close();
                }}
                onClear={() => {
                  ctl.applyFormat({ fill: null });
                  close();
                }}
                clearLabel="No Fill"
              />
            )}
          </Dropdown>
          <Dropdown
            label="Font Color"
            icon={
              <span className="flex flex-col items-center leading-none">
                <Type className="size-3.5" aria-hidden />
                <span
                  className="mt-0.5 block h-1 w-4 rounded-sm border border-ink-200"
                  style={{ background: colorHex(f.font) ?? "#000000" }}
                />
              </span>
            }
          >
            {(close) => (
              <SwatchGrid
                current={f.font}
                onPick={(key) => {
                  ctl.applyFormat({ font: key });
                  close();
                }}
                onClear={() => {
                  ctl.applyFormat({ font: null });
                  close();
                }}
                clearLabel="Automatic (black)"
              />
            )}
          </Dropdown>
          <Dropdown
            label="Borders"
            width={240}
            icon={<Grid2x2X className="size-4" aria-hidden />}
          >
            {(close) => (
              <div>
                <p className="px-2 pb-1 text-[11px] font-semibold text-ink-400 uppercase">
                  Style of the border
                </p>
                <div className="mb-2 flex gap-1 px-1">
                  {BORDER_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBorderStyle(s)}
                      aria-pressed={borderStyle === s}
                      className={cn(
                        "h-8 flex-1 cursor-pointer rounded border text-[11.5px] capitalize",
                        borderStyle === s
                          ? "border-ink-900 bg-ink-100 font-semibold"
                          : "border-ink-200 hover:bg-ink-50",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {BORDER_PRESETS.map((p) => (
                  <MenuItem
                    key={p.id}
                    onClick={() => {
                      ctl.applyBorders(p.id, borderStyle);
                      close();
                    }}
                  >
                    {p.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </Dropdown>
        </Group>
        <Divider />

        <Group title="Alignment">
          {(["top", "middle", "bottom"] as const).map((v) => (
            <RibbonButton
              key={v}
              label={`Align ${v}`}
              pressed={(f.valign ?? "bottom") === v}
              onClick={() => ctl.applyFormat({ valign: v })}
            >
              <span className="flex size-4 flex-col justify-between py-0.5" aria-hidden>
                {(["top", "middle", "bottom"] as const).map((slot) => (
                  <span
                    key={slot}
                    className={cn(
                      "h-0.5 w-full rounded-full",
                      slot === v ? "bg-ink-700" : "bg-ink-200",
                    )}
                  />
                ))}
              </span>
            </RibbonButton>
          ))}
          {(["left", "center", "right"] as const).map((a) => {
            const Icon = ALIGN_ICON[a];
            return (
              <RibbonButton
                key={a}
                label={`Align ${a}`}
                pressed={f.align === a}
                onClick={() => ctl.applyFormat({ align: f.align === a ? null : a })}
              >
                <Icon className="size-4" aria-hidden />
              </RibbonButton>
            );
          })}
          <Dropdown
            label="Orientation"
            width={230}
            icon={<span className="text-[13px] font-semibold">↗A</span>}
          >
            {(close) => (
              <div>
                {ORIENTATIONS.map((o) => (
                  <MenuItem
                    key={o.id}
                    active={(f.orientation ?? "horizontal") === o.id}
                    onClick={() => {
                      ctl.applyFormat({
                        orientation: o.id === "horizontal" ? null : o.id,
                      });
                      close();
                    }}
                  >
                    <span
                      className="inline-block w-5 text-center font-serif font-bold"
                      style={{ transform: previewTransform(o.id) }}
                      aria-hidden
                    >
                      A
                    </span>
                    {o.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </Dropdown>
          <RibbonButton
            label="Wrap Text"
            pressed={!!f.wrap}
            onClick={() => ctl.applyFormat({ wrap: f.wrap ? null : true })}
          >
            <WrapText className="size-4" aria-hidden />
          </RibbonButton>
          <RibbonButton
            label={merged ? "Unmerge Cells" : "Merge and Center"}
            pressed={merged}
            onClick={ctl.toggleMerge}
          >
            <Table2 className="size-4" aria-hidden />
          </RibbonButton>
        </Group>
        <Divider />

        <Group title="Number">
          <Dropdown
            label="Number format"
            width={260}
            icon={
              <span className="font-mono text-[12px] font-semibold">
                {NUMBER_FORMATS.find((n) => n.id === (f.numFmt ?? "general"))?.sample}
              </span>
            }
          >
            {(close) => (
              <div>
                {NUMBER_FORMATS.map((n) => (
                  <MenuItem
                    key={n.id}
                    active={(f.numFmt ?? "general") === n.id}
                    onClick={() => {
                      ctl.applyFormat({ numFmt: n.id === "general" ? null : n.id });
                      close();
                    }}
                  >
                    <span className="w-16 font-mono text-[11.5px] text-ink-500">
                      {n.sample}
                    </span>
                    {n.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </Dropdown>
        </Group>
        <Divider />

        <Group title="Cells">
          <Dropdown label="Insert" width={230} icon={<Plus className="size-4" aria-hidden />}>
            {(close) => (
              <div>
                <MenuItem
                  onClick={() => {
                    ctl.insertLine("row");
                    close();
                  }}
                >
                  <Rows3 className="size-3.5" aria-hidden /> Insert Sheet Rows
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    ctl.insertLine("col");
                    close();
                  }}
                >
                  <Columns3 className="size-3.5" aria-hidden /> Insert Sheet Columns
                </MenuItem>
              </div>
            )}
          </Dropdown>
          <Dropdown label="Delete" width={230} icon={<Minus className="size-4" aria-hidden />}>
            {(close) => (
              <div>
                <MenuItem
                  onClick={() => {
                    ctl.deleteLine("row");
                    close();
                  }}
                >
                  <Rows3 className="size-3.5" aria-hidden /> Delete Sheet Rows
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    ctl.deleteLine("col");
                    close();
                  }}
                >
                  <Columns3 className="size-3.5" aria-hidden /> Delete Sheet Columns
                </MenuItem>
              </div>
            )}
          </Dropdown>
          <Dropdown
            label="Format"
            width={260}
            icon={<span className="text-[12px] font-semibold">Format</span>}
          >
            {(close) => (
              <div>
                <p className="px-2 pb-1 text-[11px] font-semibold text-ink-400 uppercase">
                  Cell Size
                </p>
                <div className="flex items-center gap-1 px-1 pb-2">
                  <span className="w-24 text-[12px] text-ink-600">Column Width</span>
                  <button
                    type="button"
                    aria-label="Make the column narrower"
                    onClick={() => ctl.nudgeSize("col", -16)}
                    className="h-8 flex-1 cursor-pointer rounded border border-ink-200 hover:bg-ink-50"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="Make the column wider"
                    onClick={() => ctl.nudgeSize("col", 16)}
                    className="h-8 flex-1 cursor-pointer rounded border border-ink-200 hover:bg-ink-50"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-1 px-1 pb-2">
                  <span className="w-24 text-[12px] text-ink-600">Row Height</span>
                  <button
                    type="button"
                    aria-label="Make the row shorter"
                    onClick={() => ctl.nudgeSize("row", -8)}
                    className="h-8 flex-1 cursor-pointer rounded border border-ink-200 hover:bg-ink-50"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    aria-label="Make the row taller"
                    onClick={() => ctl.nudgeSize("row", 8)}
                    className="h-8 flex-1 cursor-pointer rounded border border-ink-200 hover:bg-ink-50"
                  >
                    +
                  </button>
                </div>
                <p className="px-2 pb-1 text-[11px] font-semibold text-ink-400 uppercase">
                  Visibility
                </p>
                <MenuItem
                  onClick={() => {
                    ctl.setHidden("row", true);
                    close();
                  }}
                >
                  <EyeOff className="size-3.5" aria-hidden /> Hide Rows
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    ctl.setHidden("col", true);
                    close();
                  }}
                >
                  <EyeOff className="size-3.5" aria-hidden /> Hide Columns
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    ctl.unhideAll();
                    close();
                  }}
                >
                  <Eye className="size-3.5" aria-hidden /> Unhide Rows and Columns
                </MenuItem>
              </div>
            )}
          </Dropdown>
          <RibbonButton label="Fill Down (Ctrl+D)" onClick={ctl.fillDown}>
            <ArrowDownToLine className="size-4" aria-hidden />
          </RibbonButton>
        </Group>

        {hiddenCount > 0 && (
          <>
            <Divider />
            <Group title="Hidden">
              <button
                type="button"
                onClick={ctl.unhideAll}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded border border-amber-500/40 bg-amber-100 px-2.5 text-[12px] font-medium text-amber-700 hover:brightness-105"
              >
                <EyeOff className="size-3.5" aria-hidden />
                {describeHidden(ctl.sheet)} — show
              </button>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}

const describeHidden = (sheet: Sheet): string => {
  const parts: string[] = [];
  if (sheet.hiddenCols.length) {
    parts.push(
      `${sheet.hiddenCols.length === 1 ? "Column" : "Columns"} ${sheet.hiddenCols
        .map(colName)
        .join(", ")}`,
    );
  }
  if (sheet.hiddenRows.length) {
    parts.push(
      `${sheet.hiddenRows.length === 1 ? "Row" : "Rows"} ${sheet.hiddenRows.join(", ")}`,
    );
  }
  return parts.join(" · ");
};

const previewTransform = (o: Orientation): string => {
  switch (o) {
    case "angle-up":
      return "rotate(-45deg)";
    case "angle-down":
      return "rotate(45deg)";
    case "rotate-up":
      return "rotate(-90deg)";
    case "rotate-down":
      return "rotate(90deg)";
    default:
      return "none";
  }
};

// ── The formula bar ─────────────────────────────────────────────────────────

export function FormulaBar({ ctl }: { ctl: SheetController }) {
  const inputId = useId();
  const merge = mergeAt(ctl.sheet, ctl.selection.focus.row, ctl.selection.focus.col);
  const boxName = merge ? rangeName(merge) : rangeName(ctl.range);
  const shown = ctl.edit ? ctl.edit.draft : rawOf(ctl.sheet, ctl.activeRef);

  return (
    <div
      className="flex items-stretch gap-1 border-b bg-white px-2 py-1.5"
      style={{ borderColor: XL.ribbonLine }}
    >
      <span
        className="tnum flex h-8 w-24 shrink-0 items-center rounded border px-2 font-mono text-[12.5px] font-semibold text-ink-700"
        style={{ borderColor: XL.line }}
        aria-label={`Selected cell ${boxName}`}
      >
        {boxName}
      </span>
      <label
        htmlFor={inputId}
        className="flex h-8 w-9 shrink-0 items-center justify-center rounded border font-serif text-[13px] font-bold text-ink-500 italic"
        style={{ borderColor: XL.line }}
        title="Formula bar"
      >
        fx
      </label>
      <input
        id={inputId}
        value={shown}
        spellCheck={false}
        autoComplete="off"
        placeholder="Type a value, or a formula that starts with ="
        aria-label={`Contents of ${ctl.activeRef}`}
        onChange={(e) => {
          if (ctl.edit) ctl.changeDraft(e.target.value);
          else ctl.beginEdit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            ctl.commit("down");
          } else if (e.key === "Escape") {
            e.preventDefault();
            ctl.cancel();
          }
        }}
        className="h-8 min-w-0 flex-1 rounded border px-2 font-mono text-[13px] text-ink-900 outline-none focus:border-[#217346]"
        style={{ borderColor: XL.line }}
      />
    </div>
  );
}

// ── The grid ────────────────────────────────────────────────────────────────

const orientationStyle = (o: Orientation | undefined): CSSProperties => {
  switch (o) {
    case "vertical":
      return { writingMode: "vertical-rl", textOrientation: "upright" };
    case "rotate-up":
      return { writingMode: "vertical-rl", transform: "rotate(180deg)" };
    case "rotate-down":
      return { writingMode: "vertical-rl" };
    case "angle-up":
      return { transform: "rotate(-45deg)" };
    case "angle-down":
      return { transform: "rotate(45deg)" };
    default:
      return {};
  }
};

const borderCss = (style: BorderStyle | undefined): string | undefined => {
  switch (style) {
    case "thin":
      return "1px solid #3f3f3f";
    case "medium":
      return "2px solid #262626";
    case "thick":
      return "3px solid #000000";
    case "double":
      return "3px double #000000";
    default:
      return undefined;
  }
};

interface DragState {
  axis: "row" | "col";
  index: number;
  start: number;
  from: number;
}

export function SheetGrid({
  ctl,
  height = 430,
  className,
}: {
  ctl: SheetController;
  /** Visible height of the scrolling area, in pixels. */
  height?: number;
  className?: string;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);
  const gridId = useId();
  const { sheet, range, selection, edit, zoom } = ctl;
  const [drag, setDrag] = useState<DragState | null>(null);

  const cellId = useCallback(
    (row: number, col: number) => `${gridId}-${refName(row, col)}`,
    [gridId],
  );

  const focusGrid = useCallback(() => gridRef.current?.focus(), []);

  useEffect(() => {
    if (edit) editRef.current?.focus();
  }, [edit]);

  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      const delta = (drag.axis === "col" ? event.clientX : event.clientY) - drag.start;
      const min = drag.axis === "col" ? MIN_COL_WIDTH : MIN_ROW_HEIGHT;
      ctl.resize(drag.axis, drag.index, Math.max(min, drag.from + delta / zoom));
    };
    const stop = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [drag, ctl, zoom]);

  const visibleCols = useMemo(
    () =>
      Array.from({ length: sheet.colCount }, (_, i) => i + 1).filter(
        (col) => !isColHidden(sheet, col),
      ),
    [sheet],
  );
  const visibleRows = useMemo(
    () =>
      Array.from({ length: sheet.rowCount }, (_, i) => i + 1).filter(
        (row) => !isRowHidden(sheet, row),
      ),
    [sheet],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (edit) return;
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const mod = ctrlKey || metaKey;
    if (mod) {
      const lower = key.toLowerCase();
      if (lower === "b") {
        event.preventDefault();
        ctl.applyFormat({ bold: ctl.format.bold ? null : true });
        return;
      }
      if (lower === "i") {
        event.preventDefault();
        ctl.applyFormat({ italic: ctl.format.italic ? null : true });
        return;
      }
      if (lower === "u") {
        event.preventDefault();
        ctl.applyFormat({ underline: ctl.format.underline ? null : true });
        return;
      }
      if (lower === "d") {
        event.preventDefault();
        ctl.fillDown();
        return;
      }
      if (lower === "z") {
        event.preventDefault();
        ctl.undo();
        return;
      }
      if (lower === "y") {
        event.preventDefault();
        ctl.redo();
        return;
      }
    }
    switch (key) {
      case "ArrowUp":
        event.preventDefault();
        ctl.moveBy(-1, 0, shiftKey);
        return;
      case "ArrowDown":
        event.preventDefault();
        ctl.moveBy(1, 0, shiftKey);
        return;
      case "ArrowLeft":
        event.preventDefault();
        ctl.moveBy(0, -1, shiftKey);
        return;
      case "ArrowRight":
        event.preventDefault();
        ctl.moveBy(0, 1, shiftKey);
        return;
      case "Tab":
        event.preventDefault();
        ctl.moveBy(0, shiftKey ? -1 : 1);
        return;
      case "Enter":
        event.preventDefault();
        ctl.moveBy(shiftKey ? -1 : 1, 0);
        return;
      case "F2":
        event.preventDefault();
        ctl.beginEdit();
        return;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        ctl.clear();
        return;
      case "Home":
        event.preventDefault();
        ctl.select(mod ? 1 : selection.focus.row, 1);
        return;
      default:
        break;
    }
    if (key.length === 1 && !mod) {
      event.preventDefault();
      ctl.beginEdit(key);
    }
  };

  const totalWidth =
    visibleCols.reduce((sum, col) => sum + colWidth(sheet, col) * zoom, 0) + 44 * zoom;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={gridRef}
        role="grid"
        tabIndex={0}
        aria-label={`Spreadsheet ${sheet.name}. Use the arrow keys to move, F2 to edit.`}
        aria-rowcount={sheet.rowCount}
        aria-colcount={sheet.colCount}
        aria-activedescendant={cellId(selection.focus.row, selection.focus.col)}
        onKeyDown={onKeyDown}
        className="thin-scroll relative overflow-auto bg-white"
        style={{ height }}
      >
        <table
          className="border-separate"
          style={{
            borderSpacing: 0,
            tableLayout: "fixed",
            width: totalWidth,
            fontSize: 13 * zoom,
          }}
        >
          <colgroup>
            <col style={{ width: 44 * zoom }} />
            {visibleCols.map((col) => (
              <col key={col} style={{ width: colWidth(sheet, col) * zoom }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ height: 26 * zoom }}>
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 p-0"
                style={{
                  background: XL.header,
                  borderRight: `1px solid ${XL.line}`,
                  borderBottom: `1px solid ${XL.line}`,
                }}
              >
                <span className="sr-only">Row and column headings</span>
              </th>
              {visibleCols.map((col, i) => {
                const selected = col >= range.c1 && col <= range.c2;
                const gap = i > 0 && visibleCols[i - 1] !== col - 1;
                return (
                  <th
                    key={col}
                    scope="col"
                    className="sticky top-0 z-20 p-0 font-semibold select-none"
                    style={{
                      background: selected ? XL.headerActive : XL.header,
                      color: selected ? XL.greenDark : XL.headerText,
                      borderRight: `1px solid ${XL.line}`,
                      borderBottom: selected
                        ? `2px solid ${XL.green}`
                        : `1px solid ${XL.line}`,
                      borderLeft: gap ? `3px double ${XL.green}` : undefined,
                      fontSize: 11 * zoom,
                    }}
                  >
                    <div className="relative flex h-full items-center justify-center">
                      <button
                        type="button"
                        className="w-full cursor-pointer py-1"
                        title={
                          gap
                            ? `Column ${colName(col)} — a column before it is hidden`
                            : `Select column ${colName(col)}`
                        }
                        aria-label={`Select the whole column ${colName(col)}`}
                        onClick={() => {
                          ctl.select(1, col);
                          ctl.select(sheet.rowCount, col, true);
                          focusGrid();
                        }}
                      >
                        {colName(col)}
                      </button>
                      <span
                        aria-hidden
                        onPointerDown={(e) => {
                          e.preventDefault();
                          setDrag({
                            axis: "col",
                            index: col,
                            start: e.clientX,
                            from: colWidth(sheet, col),
                          });
                        }}
                        className="absolute top-0 -right-1 h-full w-2 cursor-col-resize"
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, ri) => {
              const selected = row >= range.r1 && row <= range.r2;
              const gap = ri > 0 && visibleRows[ri - 1] !== row - 1;
              return (
                <tr key={row} style={{ height: rowHeight(sheet, row) * zoom }}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 p-0 text-center font-semibold select-none"
                    style={{
                      background: selected ? XL.headerActive : XL.header,
                      color: selected ? XL.greenDark : XL.headerText,
                      borderRight: selected
                        ? `2px solid ${XL.green}`
                        : `1px solid ${XL.line}`,
                      borderBottom: `1px solid ${XL.line}`,
                      borderTop: gap ? `3px double ${XL.green}` : undefined,
                      fontSize: 11 * zoom,
                    }}
                  >
                    <div className="relative flex h-full items-center justify-center">
                      <button
                        type="button"
                        className="h-full w-full cursor-pointer"
                        title={
                          gap ? `Row ${row} — a row above it is hidden` : `Select row ${row}`
                        }
                        aria-label={`Select the whole row ${row}`}
                        onClick={() => {
                          ctl.select(row, 1);
                          ctl.select(row, sheet.colCount, true);
                          focusGrid();
                        }}
                      >
                        {row}
                      </button>
                      <span
                        aria-hidden
                        onPointerDown={(e) => {
                          e.preventDefault();
                          setDrag({
                            axis: "row",
                            index: row,
                            start: e.clientY,
                            from: rowHeight(sheet, row),
                          });
                        }}
                        className="absolute -bottom-1 left-0 h-2 w-full cursor-row-resize"
                      />
                    </div>
                  </th>
                  {visibleCols.map((col) => {
                    const merge = mergeAt(sheet, row, col);
                    if (merge && isCovered(sheet, row, col)) {
                      // Only the first cell of a merge that is actually visible
                      // gets drawn — the rest were swallowed by it.
                      const firstRow = visibleRows.find(
                        (r) => r >= merge.r1 && r <= merge.r2,
                      );
                      const firstCol = visibleCols.find(
                        (c) => c >= merge.c1 && c <= merge.c2,
                      );
                      if (!(row === firstRow && col === firstCol)) return null;
                    }
                    const colSpan = merge
                      ? visibleCols.filter((c) => c >= merge.c1 && c <= merge.c2).length
                      : 1;
                    const rowSpan = merge
                      ? visibleRows.filter((r) => r >= merge.r1 && r <= merge.r2).length
                      : 1;
                    return (
                      <GridCell
                        key={refName(row, col)}
                        id={cellId(row, col)}
                        ctl={ctl}
                        row={row}
                        col={col}
                        colSpan={colSpan}
                        rowSpan={rowSpan}
                        editRef={editRef}
                        onFocusGrid={focusGrid}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status bar — the zoom sits where Excel puts it */}
      <div
        className="flex flex-wrap items-center gap-3 border-t px-3 py-1.5 text-[11.5px] text-ink-500"
        style={{ borderColor: XL.ribbonLine, background: XL.ribbon }}
      >
        <span className="font-mono">{sheet.name}</span>
        <span className="tnum">{summarise(ctl)}</span>
        <span className="ml-auto flex items-center gap-1">
          <Search className="size-3.5" aria-hidden />
          {[1, 1.25, 1.5].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => ctl.setZoom(z)}
              aria-pressed={zoom === z}
              aria-label={`Zoom to ${Math.round(z * 100)} percent`}
              className={cn(
                "h-6 cursor-pointer rounded px-2 font-medium",
                zoom === z ? "bg-ink-900 text-white" : "hover:bg-ink-100",
              )}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Excel's status bar: count, sum and average of whatever is selected. */
function summarise(ctl: SheetController): string {
  const numbers: number[] = [];
  let filled = 0;
  for (const ref of rangeRefs(ctl.range)) {
    const v = valueAt(ctl.values, ref);
    if (v === null || v === "") continue;
    filled += 1;
    if (typeof v === "number") numbers.push(v);
  }
  if (!filled) return "";
  if (numbers.length < 2) return `Count: ${filled}`;
  const sum = numbers.reduce((total, n) => total + n, 0);
  const round = (n: number) => Math.round(n * 100) / 100;
  return `Count: ${filled}   Sum: ${round(sum)}   Average: ${round(sum / numbers.length)}`;
}

function GridCell({
  id,
  ctl,
  row,
  col,
  colSpan,
  rowSpan,
  editRef,
  onFocusGrid,
}: {
  id: string;
  ctl: SheetController;
  row: number;
  col: number;
  colSpan: number;
  rowSpan: number;
  editRef: RefObject<HTMLInputElement | null>;
  onFocusGrid: () => void;
}) {
  const { sheet, values, range, selection, edit, zoom } = ctl;
  const ref = refName(row, col);
  const fmt = formatOf(sheet, ref);
  const value = valueAt(values, ref);
  const editing = edit?.ref === ref;
  const inRange =
    row >= range.r1 && row <= range.r2 && col >= range.c1 && col <= range.c2;
  const isActive = selection.focus.row === row && selection.focus.col === col;
  const single = range.r1 === range.r2 && range.c1 === range.c2;
  const isCorner = row === range.r2 && col === range.c2;

  const outline: string[] = [];
  if (inRange) {
    if (row === range.r1) outline.push(`inset 0 2px 0 0 ${XL.green}`);
    if (row === range.r2) outline.push(`inset 0 -2px 0 0 ${XL.green}`);
    if (col === range.c1) outline.push(`inset 2px 0 0 0 ${XL.green}`);
    if (col === range.c2) outline.push(`inset -2px 0 0 0 ${XL.green}`);
  }

  const align = effectiveAlign(value, fmt);
  const text = displayText(value, fmt);
  const error = isCellError(value) ? value : null;
  const fontPx = (fmt.size ? fmt.size * 1.18 : 13) * zoom;
  // Long text spills over an empty neighbour, exactly as the book shows before
  // it teaches Wrap Text.
  const spill =
    !fmt.wrap &&
    !fmt.orientation &&
    !rawOf(sheet, refName(row, col + 1)) &&
    text.length * fontPx * 0.56 > colWidth(sheet, col) * zoom;

  const style: CSSProperties = {
    background: colorHex(fmt.fill) ?? (inRange && !isActive ? XL.selection : undefined),
    borderRight: borderCss(fmt.borders?.right) ?? `1px solid ${XL.line}`,
    borderBottom: borderCss(fmt.borders?.bottom) ?? `1px solid ${XL.line}`,
    borderTop: borderCss(fmt.borders?.top),
    borderLeft: borderCss(fmt.borders?.left),
    boxShadow: outline.length ? outline.join(", ") : undefined,
    padding: 0,
    position: "relative",
    verticalAlign:
      fmt.valign === "top" ? "top" : fmt.valign === "middle" ? "middle" : "bottom",
  };

  return (
    <td
      id={id}
      role="gridcell"
      aria-selected={inRange}
      aria-label={`${ref}${text ? ` ${text}` : " empty"}`}
      colSpan={colSpan > 1 ? colSpan : undefined}
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
      style={style}
      onMouseDown={(e) => {
        if (editing) return;
        if (edit) ctl.commit("stay");
        ctl.select(row, col, e.shiftKey);
        onFocusGrid();
      }}
      onDoubleClick={() => {
        ctl.select(row, col);
        ctl.beginEdit();
      }}
      className="cursor-cell"
    >
      {editing && edit ? (
        <input
          ref={editRef}
          value={edit.draft}
          spellCheck={false}
          autoComplete="off"
          aria-label={`Editing ${ref}`}
          onChange={(e) => ctl.changeDraft(e.target.value)}
          onBlur={() => ctl.commit("stay")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ctl.commit(e.shiftKey ? "up" : "down");
              onFocusGrid();
            } else if (e.key === "Tab") {
              e.preventDefault();
              ctl.commit(e.shiftKey ? "left" : "right");
              onFocusGrid();
            } else if (e.key === "Escape") {
              e.preventDefault();
              ctl.cancel();
              onFocusGrid();
            }
          }}
          className="h-full w-full border-0 bg-white px-1 font-mono outline-none"
          style={{ fontSize: 13 * zoom, boxShadow: `inset 0 0 0 2px ${XL.green}` }}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full px-1",
            spill ? "overflow-visible" : "overflow-hidden",
          )}
          style={{
            justifyContent:
              align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
            alignItems:
              fmt.valign === "top"
                ? "flex-start"
                : fmt.valign === "middle"
                  ? "center"
                  : "flex-end",
          }}
        >
          <span
            title={error ? `${error.code} — ${error.explain}` : undefined}
            className={cn(
              "tnum",
              fmt.bold && "font-bold",
              fmt.italic && "italic",
              fmt.underline && "underline",
              error && "font-semibold",
              fmt.numFmt === "accounting" && typeof value === "number" && "w-full",
            )}
            style={{
              color: error ? XL.errorText : colorHex(fmt.font),
              fontSize: fmt.size ? fontPx : undefined,
              whiteSpace: fmt.wrap ? "pre-wrap" : "pre",
              wordBreak: fmt.wrap ? "break-word" : undefined,
              lineHeight: 1.25,
              ...orientationStyle(fmt.orientation),
            }}
          >
            {fmt.numFmt === "accounting" && typeof value === "number" ? (
              <span className="flex w-full items-center justify-between gap-2">
                <span>{accountingParts(value).symbol}</span>
                <span>{accountingParts(value).body}</span>
              </span>
            ) : (
              text
            )}
          </span>
        </div>
      )}

      {/* The fill handle — a real button, so the keyboard can use it too */}
      {isCorner && !editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            ctl.fillDown();
          }}
          aria-label={
            single
              ? `Copy ${ctl.activeRef} into the cell below it`
              : `Copy the top row of ${rangeName(range)} down through the selection`
          }
          title="Fill down (Ctrl+D)"
          className="absolute -right-[3px] -bottom-[3px] size-2.5 cursor-crosshair rounded-[1px] border border-white"
          style={{ background: XL.green }}
        />
      )}
    </td>
  );
}

// ── A read-out a teacher can put on the board ───────────────────────────────

export function CellReadout({ ctl }: { ctl: SheetController }) {
  const value = valueAt(ctl.values, ctl.activeRef);
  const error = isCellError(value) ? value : null;
  return (
    <div className="space-y-1.5">
      <p className="text-[12.5px] leading-relaxed text-ink-600">
        {describeCell(ctl.sheet, ctl.values, ctl.activeRef)}
      </p>
      {error && (
        <p className="rounded-lg bg-coral-100 px-3 py-2 text-[12.5px] leading-relaxed text-coral-700">
          <span className="font-mono font-bold">{error.code}</span> — {error.explain}
          {error.explain !== ERROR_HELP[error.code] && (
            <span className="mt-1 block opacity-80">{ERROR_HELP[error.code]}</span>
          )}
        </p>
      )}
    </div>
  );
}
