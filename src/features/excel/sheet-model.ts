/**
 * The spreadsheet model and the formula engine for Grade 6 · Chapter 2.
 *
 * Deliberately shaped like the Excel the book teaches, so what a student
 * builds on screen is the thing printed on the page — not a translation of
 * it. Chapter 2 needs exactly this much: a grid of cells that hold text,
 * numbers, dates or a formula; the formatting the chapter spends three
 * lessons on (bold, fill colour, borders, merge, alignment, wrapping, text
 * orientation, hidden rows and columns); and the calculation engine of
 * lessons 4 to 7 — cell addresses, ranges, the four operations with
 * parentheses, and the functions the book names by name.
 *
 * Everything here is pure data and pure functions: no React, no browser.
 */

// ── Addresses ───────────────────────────────────────────────────────────────

export interface CellAddr {
  /** 1-based, like the row numbers a student reads on screen. */
  row: number;
  /** 1-based: A = 1, B = 2 … */
  col: number;
}

export interface RangeAddr {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

/** 1 → "A", 27 → "AA" */
export function colName(col: number): string {
  let n = Math.max(1, Math.trunc(col));
  let out = "";
  while (n > 0) {
    const rest = (n - 1) % 26;
    out = String.fromCharCode(65 + rest) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** "A" → 1, "aa" → 27 */
export function colNumber(name: string): number {
  let n = 0;
  for (const ch of name.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

export const refName = (row: number, col: number): string =>
  `${colName(col)}${row}`;

const REF_PATTERN = /^\$?([A-Za-z]{1,3})\$?([0-9]{1,7})$/;

/** "B2" or "$B$2" → { row: 2, col: 2 } · anything else → null */
export function parseRef(text: string): CellAddr | null {
  const m = REF_PATTERN.exec(text.trim());
  if (!m) return null;
  const col = colNumber(m[1]);
  const row = Number(m[2]);
  if (!row || !col) return null;
  return { row, col };
}

/** Corners in any order come back top-left → bottom-right. */
export function normalizeRange(r: RangeAddr): RangeAddr {
  return {
    r1: Math.min(r.r1, r.r2),
    c1: Math.min(r.c1, r.c2),
    r2: Math.max(r.r1, r.r2),
    c2: Math.max(r.c1, r.c2),
  };
}

/** "B2:F5" → range · a single "B2" → the one-cell range · else null */
export function parseRange(text: string): RangeAddr | null {
  const [a, b] = text.split(":");
  const start = a ? parseRef(a) : null;
  if (!start) return null;
  if (b === undefined) {
    return { r1: start.row, c1: start.col, r2: start.row, c2: start.col };
  }
  const end = parseRef(b);
  if (!end) return null;
  return normalizeRange({
    r1: start.row,
    c1: start.col,
    r2: end.row,
    c2: end.col,
  });
}

export function rangeName(r: RangeAddr): string {
  const n = normalizeRange(r);
  return n.r1 === n.r2 && n.c1 === n.c2
    ? refName(n.r1, n.c1)
    : `${refName(n.r1, n.c1)}:${refName(n.r2, n.c2)}`;
}

/** Every address inside the rectangle, row by row. */
export function rangeRefs(r: RangeAddr): string[] {
  const n = normalizeRange(r);
  const out: string[] = [];
  for (let row = n.r1; row <= n.r2; row += 1) {
    for (let col = n.c1; col <= n.c2; col += 1) out.push(refName(row, col));
  }
  return out;
}

export const rangeContains = (r: RangeAddr, row: number, col: number): boolean =>
  row >= r.r1 && row <= r.r2 && col >= r.c1 && col <= r.c2;

// ── Colours ─────────────────────────────────────────────────────────────────

/**
 * A palette in the spirit of Excel's Fill Color / Font Color pickers: the ten
 * standard hues in four tints. Checks ask for a *family* ("some green"), never
 * for one exact hex — the book prints "change the colour of the cells as
 * shown" and a student matching the colour by eye must be able to pass.
 */
export type ColorFamily =
  | "white"
  | "grey"
  | "black"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink";

export interface Swatch {
  key: string;
  hex: string;
  family: ColorFamily;
  label: string;
  /** True when white text reads better on top of it. */
  dark: boolean;
}

const swatch = (
  key: string,
  hex: string,
  family: ColorFamily,
  label: string,
  dark = false,
): Swatch => ({ key, hex, family, label, dark });

/** Row-major, 10 columns wide — the shape of the picker the book screenshots. */
export const SWATCHES: Swatch[] = [
  swatch("white", "#ffffff", "white", "White"),
  swatch("grey-100", "#f2f2f2", "grey", "Grey 5%"),
  swatch("grey-300", "#d9d9d9", "grey", "Grey 15%"),
  swatch("grey-500", "#a6a6a6", "grey", "Grey 35%"),
  swatch("grey-700", "#808080", "grey", "Grey 50%", true),
  swatch("black", "#000000", "black", "Black", true),
  swatch("red-100", "#fce4e4", "red", "Light red"),
  swatch("red-300", "#ffc7ce", "red", "Rose"),
  swatch("red-500", "#ff0000", "red", "Red", true),
  swatch("red-700", "#c00000", "red", "Dark red", true),
  swatch("orange-100", "#fce4d6", "orange", "Light orange"),
  swatch("orange-300", "#f8cbad", "orange", "Peach"),
  swatch("orange-500", "#ffc000", "orange", "Orange"),
  swatch("orange-700", "#ed7d31", "orange", "Dark orange"),
  swatch("yellow-100", "#fff2cc", "yellow", "Light yellow"),
  swatch("yellow-300", "#ffe699", "yellow", "Pale yellow"),
  swatch("yellow-500", "#ffff00", "yellow", "Yellow"),
  swatch("yellow-700", "#ffd966", "yellow", "Gold"),
  swatch("green-100", "#e2efda", "green", "Light green"),
  swatch("green-300", "#c6e0b4", "green", "Pale green"),
  swatch("green-500", "#92d050", "green", "Green"),
  swatch("green-700", "#00b050", "green", "Dark green", true),
  swatch("blue-100", "#ddebf7", "blue", "Light blue"),
  swatch("blue-300", "#bdd7ee", "blue", "Pale blue"),
  swatch("blue-500", "#00b0f0", "blue", "Blue"),
  swatch("blue-700", "#0070c0", "blue", "Dark blue", true),
  swatch("purple-100", "#e4dfec", "purple", "Light purple"),
  swatch("purple-300", "#ccc0da", "purple", "Pale purple"),
  swatch("purple-500", "#8064a2", "purple", "Purple", true),
  swatch("purple-700", "#7030a0", "purple", "Dark purple", true),
  swatch("pink-100", "#fce4ec", "pink", "Light pink"),
  swatch("pink-300", "#f8bbd0", "pink", "Pink"),
  swatch("pink-500", "#ec7fa4", "pink", "Deep pink"),
  swatch("pink-700", "#c2185b", "pink", "Dark pink", true),
];

const SWATCH_BY_KEY = new Map(SWATCHES.map((s) => [s.key, s]));

export const swatchOf = (key: string | undefined): Swatch | undefined =>
  key ? SWATCH_BY_KEY.get(key) : undefined;

export const colorHex = (key: string | undefined): string | undefined =>
  swatchOf(key)?.hex;

export const colorFamily = (key: string | undefined): ColorFamily | undefined =>
  swatchOf(key)?.family;

// ── Cell formatting ─────────────────────────────────────────────────────────

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "middle" | "bottom";

/** The six entries of the book's Orientation menu. */
export type Orientation =
  | "horizontal"
  | "angle-up"
  | "angle-down"
  | "vertical"
  | "rotate-up"
  | "rotate-down";

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "horizontal", label: "Horizontal" },
  { id: "angle-up", label: "Angle Counterclockwise" },
  { id: "angle-down", label: "Angle Clockwise" },
  { id: "vertical", label: "Vertical Text" },
  { id: "rotate-up", label: "Rotate Text Up" },
  { id: "rotate-down", label: "Rotate Text Down" },
];

/** Anything that is not "horizontal" satisfies the book's "vertical title". */
export const isTurned = (o: Orientation | undefined): boolean =>
  o !== undefined && o !== "horizontal";

export type BorderStyle = "thin" | "medium" | "thick" | "double";

export interface Borders {
  top?: BorderStyle;
  right?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
}

export type NumberFormat =
  | "general"
  | "integer"
  | "decimal1"
  | "decimal2"
  | "accounting"
  | "percent"
  | "date";

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Swatch key from SWATCHES */
  fill?: string;
  /** Swatch key from SWATCHES */
  font?: string;
  /** Point size, as in the Font group */
  size?: number;
  align?: HAlign;
  valign?: VAlign;
  wrap?: boolean;
  orientation?: Orientation;
  borders?: Borders;
  numFmt?: NumberFormat;
}

/** `null` removes a property, `undefined` leaves it alone. */
export type FormatPatch = { [K in keyof CellFormat]?: CellFormat[K] | null };

const EMPTY_FORMAT: CellFormat = {};

export const formatOf = (sheet: Sheet, ref: string): CellFormat =>
  sheet.cells[ref]?.format ?? EMPTY_FORMAT;

export const hasBorders = (b: Borders | undefined): boolean =>
  !!b && (!!b.top || !!b.right || !!b.bottom || !!b.left);

export const hasAllBorders = (b: Borders | undefined): boolean =>
  !!b && !!b.top && !!b.right && !!b.bottom && !!b.left;

// ── Dates ───────────────────────────────────────────────────────────────────

/** Excel counts days from 1899-12-30, so 1 is 1900-01-01. */
const EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

export const dateSerial = (year: number, month: number, day: number): number =>
  Math.round((Date.UTC(year, month - 1, day) - EPOCH_MS) / DAY_MS);

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function serialToDate(serial: number): DateParts {
  const d = new Date(EPOCH_MS + Math.floor(serial) * DAY_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export const todaySerial = (now: Date = new Date()): number =>
  dateSerial(now.getFullYear(), now.getMonth() + 1, now.getDate());

/**
 * The date printed in the book's own screenshot of lesson 5. It is the
 * fallback "today" so the sheet renders the same on the server and on the
 * first client frame; the studio swaps in the real date once mounted.
 */
export const BOOK_TODAY = dateSerial(2020, 11, 28);

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** The format the book prints in Project 1: 3-Aug-21 */
export function formatDateSerial(serial: number): string {
  const { year, month, day } = serialToDate(serial);
  return `${day}-${MONTH_NAMES[month - 1]}-${String(year % 100).padStart(2, "0")}`;
}

const fullYear = (y: number): number => (y >= 100 ? y : y < 30 ? 2000 + y : 1900 + y);

const DMY = /^([0-9]{1,2})[-/ ]([A-Za-z]{3,9})[-/ ]([0-9]{2,4})$/;
const MDY = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2,4})$/;

/** Accepts the book's two spellings: 3-Aug-21 and the American 8/3/21. */
export function parseDate(text: string): number | null {
  const t = text.trim();
  const named = DMY.exec(t);
  if (named) {
    const month = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase() === named[2].slice(0, 3).toLowerCase(),
    );
    if (month < 0) return null;
    return dateSerial(fullYear(Number(named[3])), month + 1, Number(named[1]));
  }
  const slashed = MDY.exec(t);
  if (slashed) {
    const month = Number(slashed[1]);
    const day = Number(slashed[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return dateSerial(fullYear(Number(slashed[3])), month, day);
  }
  return null;
}

// ── Values and errors ───────────────────────────────────────────────────────

export type ErrorCode =
  | "#DIV/0!"
  | "#VALUE!"
  | "#NAME?"
  | "#REF!"
  | "#NUM!"
  | "#CIRC!";

/**
 * `code` is what Excel shows in the cell; `explain` is the same thing said to
 * a Grade 6 student. Both travel together so a wrong formula teaches instead
 * of just going red.
 *
 * #CIRC! is the one code Excel does not print in the cell — a real Excel shows
 * a warning bar and leaves 0 behind. Marking the cell itself is clearer on a
 * projector, and it keeps the engine from ever looping for ever.
 */
export interface CellError {
  code: ErrorCode;
  explain: string;
}

export type CellValue = number | string | boolean | CellError | null;

export const isCellError = (v: CellValue): v is CellError =>
  typeof v === "object" && v !== null && "code" in v;

export const err = (code: ErrorCode, explain: string): CellError => ({
  code,
  explain,
});

/** The general help line for each code — shown under the formula bar. */
export const ERROR_HELP: Record<ErrorCode, string> = {
  "#DIV/0!":
    "Something is being divided by zero, or by a cell that is still empty. Nothing can be shared into 0 parts.",
  "#VALUE!":
    "One of the cells in this calculation holds text instead of a number — Excel cannot add words.",
  "#NAME?":
    "Excel does not recognise a name in this formula. Check the spelling of the function and remember a formula has no spaces.",
  "#REF!":
    "This formula points at a cell that no longer exists — its row or its column was deleted.",
  "#NUM!": "The number in this formula is outside what Excel can work with.",
  "#CIRC!":
    "This formula asks for its own cell, so it would go round for ever. Point it at the other cells instead.",
};

// ── The sheet ───────────────────────────────────────────────────────────────

export interface Cell {
  /** Exactly what the student typed: "12", "Monday", "=SUM(C5:E5)". */
  raw: string;
  format?: CellFormat;
}

export interface Sheet {
  name: string;
  rowCount: number;
  colCount: number;
  cells: Record<string, Cell>;
  /** Merged rectangles, written the way the book writes them: "B2:F2". */
  merges: string[];
  hiddenRows: number[];
  hiddenCols: number[];
  /** Pixels, keyed by 1-based column / row index. */
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export const DEFAULT_COL_WIDTH = 96;
export const DEFAULT_ROW_HEIGHT = 30;
export const MIN_COL_WIDTH = 32;
export const MIN_ROW_HEIGHT = 20;

export interface SheetSpec {
  name?: string;
  rowCount?: number;
  colCount?: number;
  /** Raw contents, keyed by address. */
  cells?: Record<string, string | number>;
  /** Formats, keyed by address **or range** — "B4:F4" formats all six cells. */
  formats?: Record<string, CellFormat>;
  merges?: string[];
  hiddenRows?: number[];
  /** Column letters, as the book names them. */
  hiddenCols?: string[];
  /** Column letter → pixels. */
  colWidths?: Record<string, number>;
  rowHeights?: Record<number, number>;
}

export function makeSheet(spec: SheetSpec = {}): Sheet {
  const sheet: Sheet = {
    name: spec.name ?? "Sheet1",
    rowCount: spec.rowCount ?? 22,
    colCount: spec.colCount ?? 10,
    cells: {},
    merges: [...(spec.merges ?? [])],
    hiddenRows: [...(spec.hiddenRows ?? [])],
    hiddenCols: (spec.hiddenCols ?? []).map(colNumber),
    colWidths: {},
    rowHeights: { ...(spec.rowHeights ?? {}) },
  };
  for (const [letter, px] of Object.entries(spec.colWidths ?? {})) {
    sheet.colWidths[colNumber(letter)] = px;
  }
  // Formats first, contents second — so that typing a date or an amount can
  // still set its own number format, exactly as it does in the grid.
  for (const [where, format] of Object.entries(spec.formats ?? {})) {
    const range = parseRange(where);
    if (!range) continue;
    for (const ref of rangeRefs(range)) {
      sheet.cells[ref] = { raw: sheet.cells[ref]?.raw ?? "", format: { ...format } };
    }
  }
  for (const [ref, raw] of Object.entries(spec.cells ?? {})) {
    const key = normalizeKey(ref);
    if (!key) continue;
    const text = String(raw);
    const format = sheet.cells[key]?.format;
    const literal = text.startsWith("=") ? null : parseLiteral(text);
    sheet.cells[key] =
      literal?.numFmt && (!format?.numFmt || format.numFmt === "general")
        ? { raw: text, format: { ...format, numFmt: literal.numFmt } }
        : { raw: text, format };
  }
  // A cell that is neither written nor formatted has no business existing.
  for (const [ref, cell] of Object.entries(sheet.cells)) {
    if (!cell.raw && !cell.format) delete sheet.cells[ref];
  }
  return sheet;
}

const normalizeKey = (ref: string): string | null => {
  const addr = parseRef(ref);
  return addr ? refName(addr.row, addr.col) : null;
};

export const cloneSheet = (sheet: Sheet): Sheet => ({
  ...sheet,
  cells: Object.fromEntries(
    Object.entries(sheet.cells).map(([ref, cell]) => [
      ref,
      { raw: cell.raw, format: cell.format ? { ...cell.format } : undefined },
    ]),
  ),
  merges: [...sheet.merges],
  hiddenRows: [...sheet.hiddenRows],
  hiddenCols: [...sheet.hiddenCols],
  colWidths: { ...sheet.colWidths },
  rowHeights: { ...sheet.rowHeights },
});

export const rawOf = (sheet: Sheet, ref: string): string =>
  sheet.cells[ref]?.raw ?? "";

export const colWidth = (sheet: Sheet, col: number): number =>
  sheet.colWidths[col] ?? DEFAULT_COL_WIDTH;

export const rowHeight = (sheet: Sheet, row: number): number =>
  sheet.rowHeights[row] ?? DEFAULT_ROW_HEIGHT;

export const isRowHidden = (sheet: Sheet, row: number): boolean =>
  sheet.hiddenRows.includes(row);

export const isColHidden = (sheet: Sheet, col: number): boolean =>
  sheet.hiddenCols.includes(col);

/** The merge covering this cell, anchor included — or null. */
export function mergeAt(sheet: Sheet, row: number, col: number): RangeAddr | null {
  for (const name of sheet.merges) {
    const range = parseRange(name);
    if (range && rangeContains(range, row, col)) return range;
  }
  return null;
}

/** True for the cells a merge swallowed (everything but its top-left corner). */
export function isCovered(sheet: Sheet, row: number, col: number): boolean {
  const merge = mergeAt(sheet, row, col);
  return !!merge && !(merge.r1 === row && merge.c1 === col);
}

// ── Sheet operations (all pure — they return a new sheet) ───────────────────

function writeCell(
  sheet: Sheet,
  ref: string,
  update: (cell: Cell | undefined) => Cell | undefined,
): Sheet {
  const next = cloneSheet(sheet);
  const value = update(next.cells[ref]);
  if (!value || (!value.raw && !value.format)) delete next.cells[ref];
  else next.cells[ref] = value;
  return next;
}

/**
 * Type into a cell. Typing a date or an amount with a currency sign sets the
 * matching number format, exactly as Excel does when you press Enter.
 */
export function withCell(sheet: Sheet, ref: string, raw: string): Sheet {
  const literal = raw.startsWith("=") ? null : parseLiteral(raw);
  return writeCell(sheet, ref, (cell) => {
    const format = cell?.format ? { ...cell.format } : undefined;
    if (literal?.numFmt && (!format?.numFmt || format.numFmt === "general")) {
      return { raw, format: { ...format, numFmt: literal.numFmt } };
    }
    return { raw, format };
  });
}

/** The Delete key: contents go, formatting stays (as in Excel). */
export function withCleared(sheet: Sheet, refs: string[]): Sheet {
  let next = sheet;
  for (const ref of refs) next = writeCell(next, ref, (cell) => (cell ? { ...cell, raw: "" } : undefined));
  return next;
}

export function withFormat(
  sheet: Sheet,
  refs: string[],
  patch: FormatPatch,
): Sheet {
  let next = sheet;
  for (const ref of refs) {
    next = writeCell(next, ref, (cell) => {
      const format: CellFormat = { ...(cell?.format ?? {}) };
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined) {
          delete format[key as keyof CellFormat];
        } else {
          Object.assign(format, { [key]: value });
        }
      }
      const empty = Object.keys(format).length === 0;
      return { raw: cell?.raw ?? "", format: empty ? undefined : format };
    });
  }
  return next;
}

export type BorderPreset =
  | "all"
  | "outline"
  | "none"
  | "top"
  | "bottom"
  | "left"
  | "right";

/** The Borders dropdown of the Home menu, applied to a selection. */
export function withBorders(
  sheet: Sheet,
  range: RangeAddr,
  preset: BorderPreset,
  style: BorderStyle = "thin",
): Sheet {
  const r = normalizeRange(range);
  let next = sheet;
  for (let row = r.r1; row <= r.r2; row += 1) {
    for (let col = r.c1; col <= r.c2; col += 1) {
      const ref = refName(row, col);
      const current = formatOf(next, ref).borders ?? {};
      let borders: Borders;
      switch (preset) {
        case "none":
          borders = {};
          break;
        case "all":
          borders = { top: style, right: style, bottom: style, left: style };
          break;
        case "outline":
          borders = {
            ...current,
            top: row === r.r1 ? style : current.top,
            bottom: row === r.r2 ? style : current.bottom,
            left: col === r.c1 ? style : current.left,
            right: col === r.c2 ? style : current.right,
          };
          break;
        default:
          borders = { ...current, [preset]: style };
      }
      const empty = !hasBorders(borders);
      next = withFormat(next, [ref], { borders: empty ? null : borders });
    }
  }
  return next;
}

/**
 * Merge & Center. Excel keeps only the top-left value; so do we, and the
 * anchor's format spreads over the whole rectangle so a merged title looks
 * like one painted bar.
 */
export function withMerge(sheet: Sheet, range: RangeAddr): Sheet {
  const r = normalizeRange(range);
  if (r.r1 === r.r2 && r.c1 === r.c2) return sheet;
  const next = cloneSheet(sheet);
  const anchor = refName(r.r1, r.c1);
  const anchorFormat = next.cells[anchor]?.format;
  // Drop any merge that overlaps the new one.
  next.merges = next.merges.filter((name) => {
    const other = parseRange(name);
    if (!other) return false;
    return other.r2 < r.r1 || other.r1 > r.r2 || other.c2 < r.c1 || other.c1 > r.c2;
  });
  for (const ref of rangeRefs(r)) {
    if (ref === anchor) continue;
    next.cells[ref] = {
      raw: "",
      format: anchorFormat ? { ...anchorFormat } : next.cells[ref]?.format,
    };
    if (!next.cells[ref].format) delete next.cells[ref];
  }
  next.merges.push(rangeName(r));
  return next;
}

export function withUnmerge(sheet: Sheet, row: number, col: number): Sheet {
  const merge = mergeAt(sheet, row, col);
  if (!merge) return sheet;
  const next = cloneSheet(sheet);
  next.merges = next.merges.filter((name) => name !== rangeName(merge));
  return next;
}

export function withHidden(
  sheet: Sheet,
  axis: "row" | "col",
  indexes: number[],
  hidden: boolean,
): Sheet {
  const next = cloneSheet(sheet);
  const list = axis === "row" ? next.hiddenRows : next.hiddenCols;
  const set = new Set(list);
  for (const i of indexes) {
    if (hidden) set.add(i);
    else set.delete(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  if (axis === "row") next.hiddenRows = sorted;
  else next.hiddenCols = sorted;
  return next;
}

export function withSize(
  sheet: Sheet,
  axis: "row" | "col",
  index: number,
  px: number,
): Sheet {
  const next = cloneSheet(sheet);
  if (axis === "col") {
    next.colWidths[index] = Math.max(MIN_COL_WIDTH, Math.round(px));
  } else {
    next.rowHeights[index] = Math.max(MIN_ROW_HEIGHT, Math.round(px));
  }
  return next;
}

interface Shift {
  axis: "row" | "col";
  at: number;
  delta: number;
}

const shiftIndex = (index: number, s: Shift): number =>
  index >= s.at ? index + s.delta : index;

function shiftSheet(sheet: Sheet, s: Shift): Sheet {
  const next = cloneSheet(sheet);
  next.cells = {};
  for (const [ref, cell] of Object.entries(sheet.cells)) {
    const addr = parseRef(ref);
    if (!addr) continue;
    const row = s.axis === "row" ? shiftIndex(addr.row, s) : addr.row;
    const col = s.axis === "col" ? shiftIndex(addr.col, s) : addr.col;
    if (row < 1 || col < 1) continue;
    if (s.delta < 0 && (s.axis === "row" ? addr.row : addr.col) === s.at) continue;
    next.cells[refName(row, col)] = {
      raw: cell.raw.startsWith("=") ? adjustFormula(cell.raw, s) : cell.raw,
      format: cell.format ? { ...cell.format } : undefined,
    };
  }
  next.merges = sheet.merges
    .map((name) => {
      const r = parseRange(name);
      if (!r) return null;
      const moved =
        s.axis === "row"
          ? {
              ...r,
              r1: shiftIndex(r.r1, s),
              r2: r.r2 >= s.at ? r.r2 + s.delta : r.r2,
            }
          : {
              ...r,
              c1: shiftIndex(r.c1, s),
              c2: r.c2 >= s.at ? r.c2 + s.delta : r.c2,
            };
      return moved.r2 >= moved.r1 && moved.c2 >= moved.c1 ? rangeName(moved) : null;
    })
    .filter((name): name is string => name !== null);
  const move = (list: number[]) =>
    list
      .filter((i) => !(s.delta < 0 && i === s.at))
      .map((i) => shiftIndex(i, s))
      .filter((i) => i >= 1);
  next.hiddenRows = s.axis === "row" ? move(sheet.hiddenRows) : [...sheet.hiddenRows];
  next.hiddenCols = s.axis === "col" ? move(sheet.hiddenCols) : [...sheet.hiddenCols];
  const moveSizes = (sizes: Record<number, number>) => {
    const out: Record<number, number> = {};
    for (const [key, px] of Object.entries(sizes)) {
      const i = Number(key);
      if (s.delta < 0 && i === s.at) continue;
      out[shiftIndex(i, s)] = px;
    }
    return out;
  };
  next.rowHeights =
    s.axis === "row" ? moveSizes(sheet.rowHeights) : { ...sheet.rowHeights };
  next.colWidths =
    s.axis === "col" ? moveSizes(sheet.colWidths) : { ...sheet.colWidths };
  return next;
}

/** Home → Insert → Insert Sheet Rows, at (and pushing down) this row. */
export const withInsertRow = (sheet: Sheet, at: number): Sheet =>
  shiftSheet(sheet, { axis: "row", at, delta: 1 });

/** Home → Insert → Insert Sheet Columns. */
export const withInsertCol = (sheet: Sheet, at: number): Sheet =>
  shiftSheet(sheet, { axis: "col", at, delta: 1 });

export const withDeleteRow = (sheet: Sheet, at: number): Sheet =>
  shiftSheet(sheet, { axis: "row", at, delta: -1 });

export const withDeleteCol = (sheet: Sheet, at: number): Sheet =>
  shiftSheet(sheet, { axis: "col", at, delta: -1 });

// ── Rewriting the addresses inside a formula ────────────────────────────────

interface RefToken {
  absCol: boolean;
  col: number;
  absRow: boolean;
  row: number;
}

const REF_SCAN = /(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})/g;

/**
 * Walk a formula and hand every cell address to `rewrite`, leaving text in
 * quotes alone. Everything that moves a formula around — filling down,
 * inserting a row — goes through here.
 */
function rewriteRefs(raw: string, rewrite: (ref: RefToken) => string): string {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < raw.length) {
        if (raw[j] === '"' && raw[j + 1] === '"') j += 2;
        else if (raw[j] === '"') break;
        else j += 1;
      }
      out += raw.slice(i, Math.min(j + 1, raw.length));
      i = j + 1;
      continue;
    }
    REF_SCAN.lastIndex = i;
    const m = REF_SCAN.exec(raw);
    if (m && m.index === i) {
      const before = i > 0 ? raw[i - 1] : "";
      const after = raw[i + m[0].length] ?? "";
      const glued = /[A-Za-z0-9_.$]/.test(before) || /[A-Za-z0-9_.]/.test(after);
      if (!glued) {
        out += rewrite({
          absCol: m[1] === "$",
          col: colNumber(m[2]),
          absRow: m[3] === "$",
          row: Number(m[4]),
        });
        i += m[0].length;
        continue;
      }
    }
    out += ch;
    i += 1;
  }
  return out;
}

const writeRef = (r: RefToken): string =>
  `${r.absCol ? "$" : ""}${colName(r.col)}${r.absRow ? "$" : ""}${r.row}`;

/** Copying a formula down or across: relative addresses follow, $ ones stay. */
export function translateFormula(raw: string, dRow: number, dCol: number): string {
  if (!raw.startsWith("=")) return raw;
  return rewriteRefs(raw, (ref) => {
    const row = ref.absRow ? ref.row : ref.row + dRow;
    const col = ref.absCol ? ref.col : ref.col + dCol;
    if (row < 1 || col < 1) return "#REF!";
    return writeRef({ ...ref, row, col });
  });
}

/** Inserting or deleting a line: every address after it moves, $ or not. */
function adjustFormula(raw: string, s: Shift): string {
  return rewriteRefs(raw, (ref) => {
    const index = s.axis === "row" ? ref.row : ref.col;
    if (s.delta < 0 && index === s.at) return "#REF!";
    const moved = shiftIndex(index, s);
    return writeRef(
      s.axis === "row" ? { ...ref, row: moved } : { ...ref, col: moved },
    );
  });
}

// ── Literals ────────────────────────────────────────────────────────────────

export interface Literal {
  value: number | string | boolean;
  numFmt?: NumberFormat;
}

const NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)$/;
const MONEY = /^-?\$\s?(\d+(\.\d*)?|\.\d+)$/;
const PERCENT = /^-?(\d+(\.\d*)?|\.\d+)\s?%$/;

/** What a typed cell means before any formula is involved. */
export function parseLiteral(raw: string): Literal {
  const text = raw.trim();
  if (!text) return { value: "" };
  if (NUMERIC.test(text)) return { value: Number(text) };
  if (MONEY.test(text)) {
    return { value: Number(text.replace(/[$\s]/g, "")), numFmt: "accounting" };
  }
  if (PERCENT.test(text)) {
    return { value: Number(text.replace(/[%\s]/g, "")) / 100, numFmt: "percent" };
  }
  const date = parseDate(text);
  if (date !== null) return { value: date, numFmt: "date" };
  const upper = text.toUpperCase();
  if (upper === "TRUE") return { value: true };
  if (upper === "FALSE") return { value: false };
  return { value: raw };
}

// ── The formula language ────────────────────────────────────────────────────

type Node =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "err"; v: CellError }
  | { t: "ref"; row: number; col: number }
  | { t: "range"; range: RangeAddr }
  | { t: "unary"; op: "-" | "+"; a: Node }
  | { t: "binary"; op: string; a: Node; b: Node }
  | { t: "call"; name: string; args: Node[] };

interface Token {
  kind:
    | "num"
    | "str"
    | "ref"
    | "name"
    | "err"
    | "op"
    | "("
    | ")"
    | ","
    | ":";
  text: string;
}

class SyntaxProblem extends Error {}

const OPERATORS = ["<>", ">=", "<=", "=", "<", ">", "+", "-", "*", "/", "^"];

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t" || ch === "\n") {
      i += 1;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let text = "";
      let closed = false;
      while (j < src.length) {
        if (src[j] === '"' && src[j + 1] === '"') {
          text += '"';
          j += 2;
        } else if (src[j] === '"') {
          closed = true;
          j += 1;
          break;
        } else {
          text += src[j];
          j += 1;
        }
      }
      if (!closed) {
        throw new SyntaxProblem(
          "a piece of text was opened with a quotation mark and never closed",
        );
      }
      tokens.push({ kind: "str", text });
      i = j;
      continue;
    }
    if (ch === "(" || ch === ")" || ch === ":") {
      tokens.push({ kind: ch, text: ch });
      i += 1;
      continue;
    }
    if (ch === "," || ch === ";") {
      tokens.push({ kind: ",", text: "," });
      i += 1;
      continue;
    }
    if (ch === "#") {
      const m = /^#[A-Za-z0-9/]+[!?]/.exec(src.slice(i));
      if (m) {
        tokens.push({ kind: "err", text: m[0].toUpperCase() });
        i += m[0].length;
        continue;
      }
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const m = /^(\d+(\.\d*)?|\.\d+)/.exec(src.slice(i));
      if (m) {
        tokens.push({ kind: "num", text: m[0] });
        i += m[0].length;
        continue;
      }
    }
    if (/[A-Za-z_$]/.test(ch)) {
      const rest = src.slice(i);
      const asRef = /^\$?[A-Za-z]{1,3}\$?[0-9]{1,7}(?![A-Za-z0-9_.])/.exec(rest);
      if (asRef) {
        tokens.push({ kind: "ref", text: asRef[0] });
        i += asRef[0].length;
        continue;
      }
      const asName = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest);
      if (asName) {
        tokens.push({ kind: "name", text: asName[0] });
        i += asName[0].length;
        continue;
      }
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (op) {
      tokens.push({ kind: "op", text: op });
      i += op.length;
      continue;
    }
    throw new SyntaxProblem(`the character "${ch}" does not belong in a formula`);
  }
  return tokens;
}

function parseFormula(body: string): Node {
  const tokens = tokenize(body);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const eat = (): Token => {
    const token = tokens[pos];
    if (!token) throw new SyntaxProblem("the formula stops before it is finished");
    pos += 1;
    return token;
  };
  const expect = (kind: Token["kind"], what: string): Token => {
    const token = peek();
    if (!token || token.kind !== kind) {
      throw new SyntaxProblem(`${what} is missing`);
    }
    return eat();
  };

  const parseExpr = (): Node => parseCompare();

  const parseCompare = (): Node => {
    let left = parseAdditive();
    for (;;) {
      const token = peek();
      if (
        token?.kind === "op" &&
        ["=", "<>", "<", ">", "<=", ">="].includes(token.text)
      ) {
        eat();
        left = { t: "binary", op: token.text, a: left, b: parseAdditive() };
      } else return left;
    }
  };

  const parseAdditive = (): Node => {
    let left = parseMultiplicative();
    for (;;) {
      const token = peek();
      if (token?.kind === "op" && (token.text === "+" || token.text === "-")) {
        eat();
        left = { t: "binary", op: token.text, a: left, b: parseMultiplicative() };
      } else return left;
    }
  };

  const parseMultiplicative = (): Node => {
    let left = parseUnary();
    for (;;) {
      const token = peek();
      if (token?.kind === "op" && (token.text === "*" || token.text === "/")) {
        eat();
        left = { t: "binary", op: token.text, a: left, b: parseUnary() };
      } else return left;
    }
  };

  const parseUnary = (): Node => {
    const token = peek();
    if (token?.kind === "op" && (token.text === "-" || token.text === "+")) {
      eat();
      return { t: "unary", op: token.text as "-" | "+", a: parseUnary() };
    }
    return parsePower();
  };

  const parsePower = (): Node => {
    const base = parsePrimary();
    const token = peek();
    if (token?.kind === "op" && token.text === "^") {
      eat();
      return { t: "binary", op: "^", a: base, b: parseUnary() };
    }
    return base;
  };

  const parsePrimary = (): Node => {
    const token = eat();
    switch (token.kind) {
      case "num":
        return { t: "num", v: Number(token.text) };
      case "str":
        return { t: "str", v: token.text };
      case "err":
        return {
          t: "err",
          v: err(
            (token.text as ErrorCode) === "#REF!" ? "#REF!" : "#NAME?",
            token.text === "#REF!"
              ? ERROR_HELP["#REF!"]
              : `The formula contains ${token.text}.`,
          ),
        };
      case "(": {
        const inner = parseExpr();
        expect(")", "a closing bracket )");
        return inner;
      }
      case "ref": {
        const start = parseRef(token.text);
        if (!start) throw new SyntaxProblem(`"${token.text}" is not a cell address`);
        if (peek()?.kind === ":") {
          eat();
          const end = expect("ref", "the second address of the range");
          const stop = parseRef(end.text);
          if (!stop) throw new SyntaxProblem(`"${end.text}" is not a cell address`);
          return {
            t: "range",
            range: normalizeRange({
              r1: start.row,
              c1: start.col,
              r2: stop.row,
              c2: stop.col,
            }),
          };
        }
        return { t: "ref", row: start.row, col: start.col };
      }
      case "name": {
        const upper = token.text.toUpperCase();
        if (peek()?.kind === "(") {
          eat();
          const args: Node[] = [];
          if (peek()?.kind !== ")") {
            args.push(parseExpr());
            while (peek()?.kind === ",") {
              eat();
              args.push(parseExpr());
            }
          }
          expect(")", "a closing bracket )");
          return { t: "call", name: upper, args };
        }
        if (upper === "TRUE") return { t: "bool", v: true };
        if (upper === "FALSE") return { t: "bool", v: false };
        throw new SyntaxProblem(
          `Excel does not know what "${token.text}" means. If it is a function, it needs brackets after it, like ${upper}(…)`,
        );
      }
      default:
        throw new SyntaxProblem(
          `"${token.text}" turned up where a number or a cell address was expected`,
        );
    }
  };

  const node = parseExpr();
  if (pos < tokens.length) {
    throw new SyntaxProblem(
      `there is something extra after the end of the formula ("${tokens[pos].text}")`,
    );
  }
  return node;
}

// ── Evaluation ──────────────────────────────────────────────────────────────

export interface EvalContext {
  /** The serial number TODAY() answers with. */
  today: number;
}

export const defaultContext = (): EvalContext => ({ today: BOOK_TODAY });

type Arg =
  | { kind: "value"; value: CellValue }
  | { kind: "range"; values: CellValue[] };

class Circular extends Error {}

const value = (v: CellValue): Arg => ({ kind: "value", value: v });

const flatten = (a: Arg): CellValue[] =>
  a.kind === "range" ? a.values : [a.value];

const scalar = (a: Arg): CellValue =>
  a.kind === "value"
    ? a.value
    : err(
        "#VALUE!",
        "A whole block of cells was given where one single value was expected.",
      );

function toNumber(v: CellValue): number | CellError {
  if (v === null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (isCellError(v)) return v;
  const text = v.trim();
  if (!text) return 0;
  if (NUMERIC.test(text)) return Number(text);
  const date = parseDate(text);
  if (date !== null) return date;
  return err(
    "#VALUE!",
    `"${v}" is text, so it cannot be used in a calculation. Check that this cell holds a number.`,
  );
}

function toText(v: CellValue): string {
  if (v === null) return "";
  if (isCellError(v)) return v.code;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return formatNumberValue(v, "general");
  return v;
}

function toBool(v: CellValue): boolean | CellError {
  if (v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (isCellError(v)) return v;
  const upper = v.trim().toUpperCase();
  if (upper === "TRUE") return true;
  if (upper === "FALSE" || upper === "") return false;
  return err(
    "#VALUE!",
    `"${v}" is neither true nor false, so this test cannot be answered.`,
  );
}

const firstError = (values: CellValue[]): CellError | null => {
  for (const v of values) if (isCellError(v)) return v;
  return null;
};

const numbersIn = (values: CellValue[]): number[] => {
  const out: number[] = [];
  for (const v of values) {
    if (typeof v === "number") out.push(v);
    else if (typeof v === "boolean") out.push(v ? 1 : 0);
  }
  return out;
};

function compareValues(op: string, a: CellValue, b: CellValue): CellValue {
  const bothNumbers =
    (typeof a === "number" || a === null) && (typeof b === "number" || b === null);
  let cmp: number;
  if (bothNumbers) {
    cmp = (a === null ? 0 : a) - (b === null ? 0 : b);
  } else if (typeof a === "number" || typeof b === "number") {
    const left = typeof a === "number" ? a : Number.NaN;
    const right = typeof b === "number" ? b : Number.NaN;
    if (Number.isNaN(left) || Number.isNaN(right)) {
      // Excel sorts every piece of text above every number.
      cmp = typeof a === "number" ? -1 : 1;
    } else cmp = left - right;
  } else {
    const left = toText(a).toLowerCase();
    const right = toText(b).toLowerCase();
    cmp = left < right ? -1 : left > right ? 1 : 0;
  }
  switch (op) {
    case "=":
      return cmp === 0;
    case "<>":
      return cmp !== 0;
    case "<":
      return cmp < 0;
    case "<=":
      return cmp <= 0;
    case ">":
      return cmp > 0;
    default:
      return cmp >= 0;
  }
}

/** The functions the book names, and only those. */
export const FUNCTIONS = [
  "SUM",
  "AVERAGE",
  "MIN",
  "MAX",
  "COUNT",
  "COUNTBLANK",
  "IF",
  "AND",
  "OR",
  "TODAY",
  "DAY",
  "MONTH",
  "YEAR",
] as const;

export type FunctionName = (typeof FUNCTIONS)[number];

export const FUNCTION_HELP: Record<FunctionName, string> = {
  SUM: "SUM(C5:E5) — adds every number in the block.",
  AVERAGE: "AVERAGE(C5:E5) — the average of the numbers in the block.",
  MIN: "MIN(C5:C11) — the smallest number in the block.",
  MAX: "MAX(C5:E5) — the biggest number in the block.",
  COUNT: "COUNT(D7:D16) — how many cells hold a number.",
  COUNTBLANK: "COUNTBLANK(D7:D16) — how many cells are empty.",
  IF: 'IF(F4>=10,"PASSED","FAILED") — a test, then the answer if it is true, then the answer if it is false.',
  AND: "AND(F4>10,C4>11) — true only when every test is true.",
  OR: 'OR(B6="A",C6>=30) — true as soon as one test is true.',
  TODAY: "TODAY() — the date of today. It writes itself again every day.",
  DAY: "DAY(C2) — the day number inside a date.",
  MONTH: "MONTH(C2) — the month number inside a date.",
  YEAR: "YEAR(C2) — the year inside a date.",
};

const nameError = (name: string): CellError =>
  err(
    "#NAME?",
    `Excel has no function called ${name}. This chapter uses ${FUNCTIONS.join(", ")}.`,
  );

function callFunction(
  name: string,
  args: Node[],
  evalNode: (n: Node) => Arg,
  ctx: EvalContext,
): Arg {
  const evaluated = (): Arg[] => args.map(evalNode);
  const pool = (): CellValue[] => evaluated().flatMap(flatten);
  const argCount = (expected: string): CellError =>
    err("#VALUE!", `${name} needs ${expected}.`);

  switch (name) {
    case "SUM": {
      const values = pool();
      const bad = firstError(values);
      if (bad) return value(bad);
      return value(numbersIn(values).reduce((total, n) => total + n, 0));
    }
    case "AVERAGE": {
      const values = pool();
      const bad = firstError(values);
      if (bad) return value(bad);
      const numbers = numbersIn(values);
      if (!numbers.length) {
        return value(
          err(
            "#DIV/0!",
            "AVERAGE was given no numbers at all, and nothing can be shared between zero values.",
          ),
        );
      }
      return value(numbers.reduce((total, n) => total + n, 0) / numbers.length);
    }
    case "MIN":
    case "MAX": {
      const values = pool();
      const bad = firstError(values);
      if (bad) return value(bad);
      const numbers = numbersIn(values);
      if (!numbers.length) return value(0);
      return value(name === "MIN" ? Math.min(...numbers) : Math.max(...numbers));
    }
    case "COUNT": {
      // COUNT quietly skips text, blanks and errors — 0 does count.
      return value(numbersIn(pool().filter((v) => !isCellError(v))).length);
    }
    case "COUNTBLANK": {
      return value(
        pool().filter((v) => v === null || (typeof v === "string" && v === ""))
          .length,
      );
    }
    case "IF": {
      if (args.length < 2 || args.length > 3) {
        return value(
          argCount(
            "three parts separated by two commas: the test, the answer if it is true, the answer if it is false",
          ),
        );
      }
      const test = toBool(scalar(evalNode(args[0])));
      if (typeof test !== "boolean") return value(test);
      if (test) return value(scalar(evalNode(args[1])));
      return value(args[2] ? scalar(evalNode(args[2])) : false);
    }
    case "AND":
    case "OR": {
      if (!args.length) return value(argCount("at least one test"));
      const results: boolean[] = [];
      for (const v of pool()) {
        if (v === null) continue;
        const b = toBool(v);
        if (typeof b !== "boolean") return value(b);
        results.push(b);
      }
      if (!results.length) return value(argCount("at least one test"));
      return value(
        name === "AND" ? results.every(Boolean) : results.some(Boolean),
      );
    }
    case "TODAY": {
      if (args.length) {
        return value(
          err(
            "#VALUE!",
            "TODAY() takes nothing at all between its brackets — just TODAY().",
          ),
        );
      }
      return value(ctx.today);
    }
    case "DAY":
    case "MONTH":
    case "YEAR": {
      if (args.length !== 1) return value(argCount("one date between its brackets"));
      const raw = scalar(evalNode(args[0]));
      if (isCellError(raw)) return value(raw);
      const serial = toNumber(raw);
      if (typeof serial !== "number") return value(serial);
      if (serial < 0) {
        return value(
          err("#NUM!", "A date cannot come before the year 1900 in Excel."),
        );
      }
      const parts = serialToDate(serial);
      return value(
        name === "DAY" ? parts.day : name === "MONTH" ? parts.month : parts.year,
      );
    }
    default:
      return value(nameError(name));
  }
}

/**
 * Evaluate every cell of the sheet once.
 *
 * A formula that (directly or through its neighbours) asks for its own cell is
 * stopped and marked #CIRC! instead of looping for ever.
 */
export function evaluateSheet(
  sheet: Sheet,
  ctx: EvalContext = defaultContext(),
): Map<string, CellValue> {
  const cache = new Map<string, CellValue>();
  const visiting = new Set<string>();

  const cellValue = (row: number, col: number): CellValue => {
    if (row < 1 || col < 1) {
      return err("#REF!", ERROR_HELP["#REF!"]);
    }
    const ref = refName(row, col);
    const cached = cache.get(ref);
    if (cached !== undefined) return cached;
    if (visiting.has(ref)) throw new Circular(ref);

    const raw = sheet.cells[ref]?.raw ?? "";
    if (!raw) {
      cache.set(ref, null);
      return null;
    }
    if (!raw.startsWith("=")) {
      const literal = parseLiteral(raw);
      const v = literal.value === "" ? null : literal.value;
      cache.set(ref, v);
      return v;
    }

    visiting.add(ref);
    let result: CellValue;
    try {
      const node = parseFormula(raw.slice(1));
      result = scalar(evalNode(node));
    } catch (problem) {
      if (problem instanceof Circular) {
        result = err("#CIRC!", ERROR_HELP["#CIRC!"]);
      } else if (problem instanceof SyntaxProblem) {
        result = err(
          "#NAME?",
          `Excel could not read this formula: ${problem.message}.`,
        );
      } else {
        throw problem;
      }
    } finally {
      visiting.delete(ref);
    }
    cache.set(ref, result);
    return result;
  };

  const evalNode = (node: Node): Arg => {
    switch (node.t) {
      case "num":
        return value(node.v);
      case "str":
        return value(node.v);
      case "bool":
        return value(node.v);
      case "err":
        return value(node.v);
      case "ref":
        return value(cellValue(node.row, node.col));
      case "range":
        return {
          kind: "range",
          values: rangeRefs(node.range).map((ref) => {
            const addr = parseRef(ref);
            return addr ? cellValue(addr.row, addr.col) : null;
          }),
        };
      case "unary": {
        const inner = scalar(evalNode(node.a));
        const n = toNumber(inner);
        if (typeof n !== "number") return value(n);
        return value(node.op === "-" ? -n : n);
      }
      case "binary": {
        const left = scalar(evalNode(node.a));
        const right = scalar(evalNode(node.b));
        const bad = firstError([left, right]);
        if (bad) return value(bad);
        if (["=", "<>", "<", "<=", ">", ">="].includes(node.op)) {
          return value(compareValues(node.op, left, right));
        }
        const a = toNumber(left);
        if (typeof a !== "number") return value(a);
        const b = toNumber(right);
        if (typeof b !== "number") return value(b);
        switch (node.op) {
          case "+":
            return value(a + b);
          case "-":
            return value(a - b);
          case "*":
            return value(a * b);
          case "/":
            if (b === 0) {
              return value(
                err(
                  "#DIV/0!",
                  "This formula divides by 0, or by a cell that is still empty. Fill that cell in, or divide by something else.",
                ),
              );
            }
            return value(a / b);
          case "^": {
            const p = Math.pow(a, b);
            if (!Number.isFinite(p)) {
              return value(
                err("#NUM!", "That power is too big a number for Excel to hold."),
              );
            }
            return value(p);
          }
          default:
            return value(nameError(node.op));
        }
      }
      case "call":
        return callFunction(node.name, node.args, evalNode, ctx);
    }
  };

  for (const ref of Object.keys(sheet.cells)) {
    const addr = parseRef(ref);
    if (addr) cellValue(addr.row, addr.col);
  }
  return cache;
}

export const valueAt = (
  values: Map<string, CellValue>,
  ref: string,
): CellValue => values.get(ref) ?? null;

// ── Showing a value ─────────────────────────────────────────────────────────

const trimNumber = (n: number, digits: number): string => {
  const fixed = n.toFixed(digits);
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
};

export function formatNumberValue(n: number, fmt: NumberFormat = "general"): string {
  if (!Number.isFinite(n)) return "#NUM!";
  switch (fmt) {
    case "integer":
      return Math.round(n).toString();
    case "decimal1":
      return n.toFixed(1);
    case "decimal2":
    case "accounting":
      return Math.abs(n).toFixed(2);
    case "percent":
      return `${trimNumber(n * 100, 2)}%`;
    case "date":
      return formatDateSerial(n);
    default:
      // General: enough digits to be honest, without a screenful of decimals.
      return trimNumber(n, 9);
  }
}

/** Accounting cells show the symbol pinned left and the amount right. */
export const accountingParts = (
  n: number,
): { symbol: string; body: string } => ({
  symbol: n < 0 ? "-$" : "$",
  body: Math.abs(n).toFixed(2),
});

/** What the cell shows on the grid, as opposed to what it holds. */
export function displayText(v: CellValue, fmt?: CellFormat): string {
  if (v === null) return "";
  if (isCellError(v)) return v.code;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    const numFmt = fmt?.numFmt ?? "general";
    if (numFmt === "accounting") {
      const parts = accountingParts(v);
      return `${parts.symbol} ${parts.body}`;
    }
    return formatNumberValue(v, numFmt);
  }
  return v;
}

/** Numbers and dates sit right, text sits left — unless the student says otherwise. */
export function effectiveAlign(v: CellValue, fmt?: CellFormat): HAlign {
  if (fmt?.align) return fmt.align;
  if (typeof v === "number") return "right";
  if (typeof v === "boolean" || isCellError(v)) return "center";
  return "left";
}

/**
 * A one-line reading of a cell for the teacher's panel and for check
 * feedback: "B7 holds the text Discipline", "F5 holds the formula =SUM(C5:E5),
 * which works out to 18".
 */
export function describeCell(
  sheet: Sheet,
  values: Map<string, CellValue>,
  ref: string,
): string {
  const raw = rawOf(sheet, ref);
  const v = valueAt(values, ref);
  if (!raw) return `${ref} is empty`;
  if (raw.startsWith("=")) {
    if (isCellError(v)) return `${ref} holds ${raw} and answers ${v.code}`;
    return `${ref} holds ${raw}, which works out to ${displayText(v, formatOf(sheet, ref))}`;
  }
  if (typeof v === "number") {
    return `${ref} holds the number ${displayText(v, formatOf(sheet, ref))}`;
  }
  return `${ref} holds the text "${raw}"`;
}
