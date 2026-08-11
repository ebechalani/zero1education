/**
 * The book's own tables and tasks, turned into checkable exercises.
 *
 * Every exercise below comes from a printed page of Grade 6 · Chapter 2
 * "Microsoft Excel" — the same tables, the same numbers, the same wording, the
 * same cell addresses (B2:F2, E5, D7:D16, C13, F4, I4…). Nothing here was
 * invented, and where the book prints something twice with two different
 * answers the disagreement is written down in a comment instead of being
 * quietly fixed.
 *
 * A task is checked on the RESULT — the value a cell works out to and, where
 * the lesson is about formatting, the format the cell carries. It is never
 * checked on the click path: a total may be reached with =c5+d5+e5 or with
 * =sum(c5:e5), because page 30 prints both.
 *
 * Every check is plain data — no functions inside it — so the whole set stays
 * serialisable for Studio later.
 */

import {
  colName,
  colNumber,
  colorFamily,
  dateSerial,
  defaultContext,
  displayText,
  evaluateSheet,
  formatOf,
  isCellError,
  isTurned,
  hasAllBorders,
  hasBorders,
  makeSheet,
  mergeAt,
  parseRange,
  parseRef,
  rangeRefs,
  rawOf,
  serialToDate,
  valueAt,
  withCell,
  withFormat,
  withInsertCol,
  withInsertRow,
  type Borders,
  type CellFormat,
  type CellValue,
  type ColorFamily,
  type ErrorCode,
  type EvalContext,
  type FunctionName,
  type HAlign,
  type NumberFormat,
  type Sheet,
  type SheetSpec,
} from "./sheet-model";

// ── What a check is made of ─────────────────────────────────────────────────

export type ValueExpect =
  | { kind: "number"; value: number; tolerance?: number }
  /** Compared trimmed and without caring about capitals; a list means "any of these". */
  | { kind: "text"; value: string | string[] }
  | { kind: "boolean"; value: boolean }
  | { kind: "blank" }
  | { kind: "error"; code: ErrorCode }
  | { kind: "date"; year: number; month: number; day: number }
  /** Worked out from the day the student is sitting at the computer. */
  | { kind: "today"; part: "date" | "day" | "month" | "year" };

export interface FormatExpect {
  bold?: boolean;
  italic?: boolean;
  /** "any" = some colour, or one/several colour families. */
  fill?: "any" | ColorFamily | ColorFamily[];
  font?: "any" | ColorFamily | ColorFamily[];
  align?: HAlign;
  wrap?: boolean;
  /** True = the text is no longer horizontal (any of the Orientation entries). */
  turned?: boolean;
  /** "all" = all four sides · "any" = at least one line. */
  borders?: "all" | "any";
  numFmt?: NumberFormat | NumberFormat[];
}

export type SheetAssertion =
  /**
   * The cells of `range`, row by row, must work out to `expect`.
   * `formula` demands Excel do the work; `fn` demands the lesson's function
   * appear somewhere in the range.
   */
  | {
      kind: "cells";
      range: string;
      expect: ValueExpect[];
      formula?: boolean;
      fn?: FunctionName;
      message: string;
    }
  | { kind: "format"; range: string; expect: FormatExpect; message: string }
  | { kind: "merged"; range: string; message: string }
  /** One merged block covers both of these cells — used where the book shows a
   *  merge in a figure without naming its exact corners. */
  | { kind: "merged-through"; from: string; to: string; message: string }
  | { kind: "hidden"; axis: "row" | "col"; index: number | string; message: string }
  | { kind: "wider"; col: string; than: number; message: string };

/** One numbered step of the printed lesson. */
export interface XlTask {
  id: string;
  label: string;
  assert: SheetAssertion[];
}

export interface XlCheck {
  /** One line a teacher can read out: what the platform is about to look at. */
  summary: string;
  tasks: XlTask[];
}

export interface XlExercise {
  id: string;
  /** g6-xl-01 … g6-xl-07 */
  lessonId: string;
  /** The book's own page number. */
  page: number;
  title: string;
  /** What the book asks for, in the book's terms. */
  brief: string;
  /** The sheet the student starts from. */
  starter: Sheet;
  hints: string[];
  check: XlCheck;
  /** A worked answer, revealed only after real attempts. */
  solution: Sheet;
  /** A step of the printed lesson this instrument cannot carry out. */
  alsoInExcel?: string;
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface AssertionResult {
  assertion: SheetAssertion;
  passed: boolean;
  /** What the sheet actually says, in words a Grade 6 student can read. */
  detail: string;
}

export interface TaskResult {
  id: string;
  label: string;
  passed: boolean;
  assertions: AssertionResult[];
}

export interface SheetCheckResult {
  passed: boolean;
  tasks: TaskResult[];
  /** Every failing line, ready to be shown. */
  failures: string[];
}

// ── The check engine ────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();

const near = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

const show = (v: CellValue): string => {
  if (v === null || v === "") return "empty";
  if (isCellError(v)) return v.code;
  if (typeof v === "number") return displayText(v);
  return `"${v}"`;
};

const describeExpect = (e: ValueExpect): string => {
  switch (e.kind) {
    case "number":
      return displayText(e.value);
    case "text":
      return Array.isArray(e.value) ? `"${e.value[0]}"` : `"${e.value}"`;
    case "boolean":
      return e.value ? "TRUE" : "FALSE";
    case "blank":
      return "empty";
    case "error":
      return e.code;
    case "date":
      return `${e.day}/${e.month}/${e.year}`;
    case "today":
      return e.part === "date" ? "today's date" : `the ${e.part} of today's date`;
  }
};

function valueMatches(
  expect: ValueExpect,
  actual: CellValue,
  ctx: EvalContext,
): boolean {
  switch (expect.kind) {
    case "number":
      return (
        typeof actual === "number" &&
        near(actual, expect.value, expect.tolerance ?? 0.005)
      );
    case "text": {
      if (typeof actual !== "string") return false;
      const wanted = Array.isArray(expect.value) ? expect.value : [expect.value];
      return wanted.some((w) => norm(w) === norm(actual));
    }
    case "boolean":
      return typeof actual === "boolean" && actual === expect.value;
    case "blank":
      return actual === null || actual === "";
    case "error":
      return isCellError(actual) && actual.code === expect.code;
    case "date":
      return (
        typeof actual === "number" &&
        actual === dateSerial(expect.year, expect.month, expect.day)
      );
    case "today": {
      if (typeof actual !== "number") return false;
      const parts = serialToDate(ctx.today);
      switch (expect.part) {
        case "date":
          return Math.floor(actual) === ctx.today;
        case "day":
          return actual === parts.day;
        case "month":
          return actual === parts.month;
        case "year":
          return actual === parts.year;
      }
    }
  }
}

const familyMatches = (
  want: "any" | ColorFamily | ColorFamily[],
  key: string | undefined,
): boolean => {
  const family = colorFamily(key);
  if (!family) return false;
  if (want === "any") return true;
  const list = Array.isArray(want) ? want : [want];
  return list.includes(family);
};

const familyWords = (want: "any" | ColorFamily | ColorFamily[]): string =>
  want === "any"
    ? "a colour"
    : `a ${(Array.isArray(want) ? want : [want]).join(" or ")}`;

function formatProblem(
  ref: string,
  fmt: CellFormat,
  expect: FormatExpect,
): string | null {
  if (expect.bold !== undefined && !!fmt.bold !== expect.bold) {
    return expect.bold ? `${ref} is not bold yet` : `${ref} should not be bold`;
  }
  if (expect.italic !== undefined && !!fmt.italic !== expect.italic) {
    return expect.italic ? `${ref} is not in italics` : `${ref} should not be italic`;
  }
  if (expect.fill !== undefined && !familyMatches(expect.fill, fmt.fill)) {
    return fmt.fill
      ? `${ref} is filled, but not with ${familyWords(expect.fill)}`
      : `${ref} has no fill colour — it needs ${familyWords(expect.fill)}`;
  }
  if (expect.font !== undefined && !familyMatches(expect.font, fmt.font)) {
    return `the writing in ${ref} needs ${familyWords(expect.font)}`;
  }
  if (expect.align !== undefined && fmt.align !== expect.align) {
    return `${ref} is not aligned to the ${expect.align}`;
  }
  if (expect.wrap !== undefined && !!fmt.wrap !== expect.wrap) {
    return expect.wrap
      ? `${ref} still writes on one line — it needs Wrap Text`
      : `${ref} should not be wrapped`;
  }
  if (expect.turned !== undefined && isTurned(fmt.orientation) !== expect.turned) {
    return expect.turned
      ? `the text in ${ref} is still horizontal`
      : `the text in ${ref} should stay horizontal`;
  }
  if (expect.borders !== undefined) {
    const ok =
      expect.borders === "all" ? hasAllBorders(fmt.borders) : hasBorders(fmt.borders);
    if (!ok) return `${ref} has no border ${expect.borders === "all" ? "all around it" : "yet"}`;
  }
  if (expect.numFmt !== undefined) {
    const list = Array.isArray(expect.numFmt) ? expect.numFmt : [expect.numFmt];
    if (!list.includes(fmt.numFmt ?? "general")) {
      return `${ref} is not using the ${list[0] === "accounting" ? "Accounting Number Format" : list[0]} format`;
    }
  }
  return null;
}

const usesFunction = (raw: string, fn: FunctionName): boolean =>
  new RegExp(`\\b${fn}\\s*\\(`, "i").test(raw);

function runAssertion(
  a: SheetAssertion,
  sheet: Sheet,
  values: Map<string, CellValue>,
  ctx: EvalContext,
): AssertionResult {
  const fail = (detail: string): AssertionResult => ({
    assertion: a,
    passed: false,
    detail: `${a.message} — ${detail}.`,
  });
  const pass = (detail: string): AssertionResult => ({
    assertion: a,
    passed: true,
    detail,
  });

  switch (a.kind) {
    case "cells": {
      const range = parseRange(a.range);
      if (!range) return fail(`${a.range} is not a range`);
      const refs = rangeRefs(range);
      let sawFunction = false;
      for (let i = 0; i < refs.length && i < a.expect.length; i += 1) {
        const ref = refs[i];
        const expect = a.expect[i];
        const raw = rawOf(sheet, ref);
        const actual = valueAt(values, ref);
        if (a.fn && usesFunction(raw, a.fn)) sawFunction = true;
        if (!valueMatches(expect, actual, ctx)) {
          if (isCellError(actual)) {
            return fail(`${ref} answers ${actual.code}. ${actual.explain}`);
          }
          if (actual === null || actual === "") {
            return fail(`${ref} is still empty, and it should show ${describeExpect(expect)}`);
          }
          return fail(
            `${ref} shows ${show(actual)}, and it should show ${describeExpect(expect)}`,
          );
        }
        if (a.formula && expect.kind !== "blank" && !raw.startsWith("=")) {
          return fail(
            `${ref} was typed in by hand. Excel has to work it out — start the cell with the = sign`,
          );
        }
      }
      if (a.fn && !sawFunction) {
        return fail(`none of these cells uses the function ${a.fn}`);
      }
      return pass(`${a.range} is right`);
    }
    case "format": {
      const range = parseRange(a.range);
      if (!range) return fail(`${a.range} is not a range`);
      for (const ref of rangeRefs(range)) {
        const problem = formatProblem(ref, formatOf(sheet, ref), a.expect);
        if (problem) return fail(problem);
      }
      return pass(`${a.range} is formatted`);
    }
    case "merged": {
      const range = parseRange(a.range);
      if (!range) return fail(`${a.range} is not a range`);
      const merge = mergeAt(sheet, range.r1, range.c1);
      if (!merge) return fail(`${a.range} is not merged yet`);
      const same =
        merge.r1 === range.r1 &&
        merge.c1 === range.c1 &&
        merge.r2 === range.r2 &&
        merge.c2 === range.c2;
      return same
        ? pass(`${a.range} is merged`)
        : fail(
            `the merged block starts at ${colName(merge.c1)}${merge.r1} and stops at ${colName(merge.c2)}${merge.r2}, not at ${a.range.split(":")[1] ?? a.range}`,
          );
    }
    case "merged-through": {
      const from = parseRef(a.from);
      const to = parseRef(a.to);
      if (!from || !to) return fail("that is not a cell address");
      const merge = mergeAt(sheet, from.row, from.col);
      if (!merge) return fail(`${a.from} is not merged yet`);
      const covers =
        to.row >= merge.r1 && to.row <= merge.r2 && to.col >= merge.c1 && to.col <= merge.c2;
      return covers
        ? pass(`${a.from} is merged as far as ${a.to}`)
        : fail(`the merged block does not reach ${a.to}`);
    }
    case "hidden": {
      const index =
        typeof a.index === "number" ? a.index : colNumber(String(a.index));
      const hidden =
        a.axis === "row" ? sheet.hiddenRows.includes(index) : sheet.hiddenCols.includes(index);
      const name = a.axis === "row" ? `Row ${index}` : `Column ${colName(index)}`;
      return hidden ? pass(`${name} is hidden`) : fail(`${name} is still showing`);
    }
    case "wider": {
      const col = colNumber(a.col);
      const width = sheet.colWidths[col] ?? 0;
      return width > a.than
        ? pass(`column ${a.col} was widened`)
        : fail(`column ${a.col} is still at its starting width`);
    }
  }
}

/**
 * Check a sheet against the book's task list.
 *
 * The caller hands in the sheet the student built and the same evaluation
 * context the grid is using, so a TODAY() answer is judged against the day the
 * student is actually working on.
 */
export function checkSheet(
  check: XlCheck,
  sheet: Sheet,
  ctx: EvalContext = defaultContext(),
): SheetCheckResult {
  const values = evaluateSheet(sheet, ctx);
  const tasks = check.tasks.map((task) => {
    const assertions = task.assert.map((a) => runAssertion(a, sheet, values, ctx));
    return {
      id: task.id,
      label: task.label,
      passed: assertions.every((r) => r.passed),
      assertions,
    };
  });
  return {
    passed: tasks.every((t) => t.passed),
    tasks,
    failures: tasks
      .filter((t) => !t.passed)
      .flatMap((t) => t.assertions.filter((r) => !r.passed).map((r) => r.detail)),
  };
}

// ── Authoring helpers (they only ever produce plain data) ───────────────────

const n = (value: number, tolerance?: number): ValueExpect => ({
  kind: "number",
  value,
  ...(tolerance === undefined ? {} : { tolerance }),
});
const t = (value: string | string[]): ValueExpect => ({ kind: "text", value });
const blank: ValueExpect = { kind: "blank" };
const on = (year: number, month: number, day: number): ValueExpect => ({
  kind: "date",
  year,
  month,
  day,
});

const ALL_BORDERS: Borders = {
  top: "thin",
  right: "thin",
  bottom: "thin",
  left: "thin",
};

const boxed: CellFormat = { borders: ALL_BORDERS };

const titleBar = (fill: string, font = "white"): CellFormat => ({
  bold: true,
  fill,
  font,
  align: "center",
  valign: "middle",
  size: 14,
});

const headCell = (fill: string): CellFormat => ({
  bold: true,
  fill,
  align: "center",
  valign: "middle",
  borders: ALL_BORDERS,
});

/** Merge two sheet specs — the base table plus the worked answer on top. */
const extend = (base: SheetSpec, more: SheetSpec): SheetSpec => ({
  ...base,
  ...more,
  cells: { ...base.cells, ...more.cells },
  formats: { ...base.formats, ...more.formats },
  merges: [...(base.merges ?? []), ...(more.merges ?? [])],
  hiddenRows: [...(base.hiddenRows ?? []), ...(more.hiddenRows ?? [])],
  hiddenCols: [...(base.hiddenCols ?? []), ...(more.hiddenCols ?? [])],
  colWidths: { ...base.colWidths, ...more.colWidths },
  rowHeights: { ...base.rowHeights, ...more.rowHeights },
});

/** Every address of a written range — "B4:F5" → B4, C4 … F5. */
const refsOf = (range: string): string[] => {
  const parsed = parseRange(range);
  return parsed ? rangeRefs(parsed) : [];
};

/** Spread one row of values across a row of the sheet, starting at `col`. */
const rowCells = (
  row: number,
  col: string,
  values: (string | number)[],
): Record<string, string | number> => {
  const start = colNumber(col);
  const out: Record<string, string | number> = {};
  values.forEach((value, i) => {
    if (value !== "") out[`${colName(start + i)}${row}`] = value;
  });
  return out;
};

// ── Lesson 1 · the GRADES sheet (book p. 24) ────────────────────────────────

/**
 * Book: "1- Reproduce the grades sheet as shown in the figure on the right.
 * 2- Apply borders to the table and change the colour of the cells as shown.
 * 4- Merge cells B2, C2, D2, E2, F2 and then write the title GRADES sheet."
 * (The printed list skips 3.)
 *
 * The row 14 numbers 8 · 16.5 · 10 are the ones printed in the figure. They are
 * typed values here, exactly as the book shows them; lesson 5 comes back to
 * that row and replaces them with real averages.
 */
const GRADE_ROWS: [string, number, number, number][] = [
  ["Math", 12, 14, 7],
  ["Computer", 15, 8, 12],
  ["English", 18, 13, 11],
  ["Physics", 8, 16.5, 14],
  ["Biology", 16, 12, 6],
  ["Geography", 12, 14, 11],
  ["Average", 8, 16.5, 10],
];

const gradesTableCells = (): Record<string, string | number> => {
  const cells: Record<string, string | number> = {
    B2: "GRADES sheet",
    B4: "First Name",
    E4: "Grade",
    B5: "Last Name",
    E5: "Academic Year",
    ...rowCells(7, "B", ["Discipline", "Grade 1", "Grade 2", "Grade 3", "Average"]),
  };
  GRADE_ROWS.forEach((row, i) => {
    Object.assign(cells, rowCells(8 + i, "B", [row[0], row[1], row[2], row[3]]));
  });
  return cells;
};

const GRADES_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: gradesTableCells(),
  formats: {
    "B2:F2": titleBar("blue-700"),
    "B4:F5": boxed,
    B4: { fill: "green-500", borders: ALL_BORDERS },
    B5: { fill: "green-500", borders: ALL_BORDERS },
    E4: { fill: "green-500", borders: ALL_BORDERS },
    E5: { fill: "green-500", wrap: true, borders: ALL_BORDERS },
    "B7:F7": headCell("yellow-500"),
    "B8:F14": boxed,
  },
  merges: ["B2:F2"],
  colWidths: { B: 150, E: 110 },
  rowHeights: { 2: 42, 5: 40 },
};

const l1GradesSheet: XlExercise = {
  id: "g6-c2-l1-grades-sheet",
  lessonId: "g6-xl-01",
  page: 24,
  title: "The GRADES sheet",
  brief:
    "1- Reproduce the grades sheet as shown in the figure. 2- Apply borders to the table and change the colour of the cells as shown. 4- Merge cells B2, C2, D2, E2, F2 and then write the title \"GRADES sheet\".",
  starter: makeSheet({ name: "Sheet1" }),
  hints: [
    "The letters along the top and the numbers down the side of the picture tell you the address of every word. \"Discipline\" is in B7, so click B7 and type it.",
    "A title cannot be typed across five cells. Select B2 to F2 first, then press Merge & Center — the five cells become one.",
    "Select a block of cells before you use Fill Color or Borders: whatever is selected is what gets painted or ruled.",
  ],
  check: {
    summary:
      "Looks at every word and number of the table, then at the merged title, the colours, the borders and the width of column B.",
    tasks: [
      {
        id: "table",
        label: "1 · Reproduce the grades sheet",
        assert: [
          {
            kind: "cells",
            range: "B4:B5",
            expect: [t("First Name"), t("Last Name")],
            message: "The names go in B4 and B5",
          },
          {
            kind: "cells",
            range: "E4:E5",
            expect: [t("Grade"), t("Academic Year")],
            message: "\"Grade\" and \"Academic Year\" go in E4 and E5",
          },
          {
            kind: "cells",
            range: "B7:F7",
            expect: [
              t("Discipline"),
              t("Grade 1"),
              t("Grade 2"),
              t("Grade 3"),
              t("Average"),
            ],
            message: "Row 7 is the heading row of the table",
          },
          {
            kind: "cells",
            range: "B8:E14",
            expect: GRADE_ROWS.flatMap((row) => [
              t(row[0]),
              n(row[1]),
              n(row[2]),
              n(row[3]),
            ]),
            message: "Copy the seven subjects and their three grades",
          },
          {
            kind: "wider",
            col: "B",
            than: 96,
            message: "Column B has to be widened so \"Geography\" fits inside it",
          },
        ],
      },
      {
        id: "title",
        label: "4 · Merge B2 to F2 and write the title",
        assert: [
          {
            kind: "merged",
            range: "B2:F2",
            message: "The five cells B2, C2, D2, E2 and F2 become one",
          },
          {
            kind: "cells",
            range: "B2",
            expect: [t("GRADES sheet")],
            message: "The title of the table is \"GRADES sheet\"",
          },
        ],
      },
      {
        id: "colours",
        label: "2 · Change the colour of the cells",
        assert: [
          {
            kind: "format",
            range: "B2",
            expect: { fill: "any", bold: true },
            message: "The title bar is coloured and written in bold",
          },
          {
            kind: "format",
            range: "B4:B5",
            expect: { fill: "green" },
            message: "First Name and Last Name are on a green",
          },
          {
            kind: "format",
            range: "E4:E5",
            expect: { fill: "green" },
            message: "Grade and Academic Year are on a green",
          },
          {
            kind: "format",
            range: "B7:F7",
            expect: { fill: "yellow", bold: true },
            message: "The heading row of the table is a bold yellow",
          },
        ],
      },
      {
        id: "borders",
        label: "2 · Apply borders to the table",
        assert: [
          {
            kind: "format",
            range: "B4:F5",
            expect: { borders: "all" },
            message: "The name block B4:F5 is ruled all around",
          },
          {
            kind: "format",
            range: "B7:F14",
            expect: { borders: "all" },
            message: "Every cell of the grades table has its borders",
          },
        ],
      },
    ],
  },
  solution: makeSheet(GRADES_SHEET),
};

// ── Lesson 2 · Remarks, Drawing, two lines, centring (book p. 26) ───────────

/**
 * Book: "1- Open the document created in the previous lesson. 2- Insert a new
 * Sheet in your workbook. 3- Add a new column Remarks between the columns
 * Grade 3 and Average. 4- Add a new row Drawing between the rows Physics and
 * Biology. 5- Display the content of cell E5 on two lines. 6- Centre the
 * content of cells B4 - B5 - E4 and E5."
 *
 * Inserting the column pushes Average from F to G; inserting the row pushes
 * Biology from 12 to 13 — that shift is what the check looks for, so retyping
 * the words on top of the old ones will not pass.
 */
const l2RemarksAndDrawing: XlExercise = {
  id: "g6-c2-l2-remarks-and-drawing",
  lessonId: "g6-xl-02",
  page: 26,
  title: "A new column, a new row",
  brief:
    "Open the document created in the previous lesson. 3- Add a new column \"Remarks\" between the columns \"Grade 3\" and \"Average\". 4- Add a new row \"Drawing\" between the rows \"Physics\" and \"Biology\". 5- Display the content of cell E5 on two lines. 6- Centre the content of cells B4 - B5 - E4 and E5.",
  alsoInExcel:
    "The lesson also asks you to insert a new sheet in the workbook (Home → Insert → Insert Sheet, or the + sign). This instrument works on one sheet, so do that step in Excel itself.",
  starter: makeSheet(GRADES_SHEET),
  hints: [
    "A new column has to be *inserted*, not typed over. Click a cell in the column that will be pushed to the right, then Home → Insert → Insert Sheet Columns.",
    "Which column has to move to the right so that Remarks can stand between Grade 3 and Average? Select a cell in that column first.",
    "Wrap Text is what puts \"Academic Year\" on two lines inside one cell. The alignment buttons sit next to it in the Alignment group.",
  ],
  check: {
    summary:
      "Looks for the Remarks column and the Drawing row in their new places, for the wrapped cell E5 and for the four centred headings.",
    tasks: [
      {
        id: "column",
        label: "3 · A new column \"Remarks\" between Grade 3 and Average",
        assert: [
          {
            kind: "cells",
            range: "E7:G7",
            expect: [t("Grade 3"), t("Remarks"), t("Average")],
            message: "Row 7 must now read Grade 3, Remarks, Average",
          },
          {
            kind: "cells",
            range: "E8:E10",
            expect: [n(7), n(12), n(11)],
            message:
              "The Grade 3 marks stay in column E — only the columns to their right move",
          },
        ],
      },
      {
        id: "row",
        label: "4 · A new row \"Drawing\" between Physics and Biology",
        assert: [
          {
            kind: "cells",
            range: "B11:B15",
            expect: [
              t("Physics"),
              t("Drawing"),
              t("Biology"),
              t("Geography"),
              t("Average"),
            ],
            message:
              "Column B must now read Physics, Drawing, Biology, Geography, Average",
          },
          {
            kind: "cells",
            range: "C13:E13",
            expect: [n(16), n(12), n(6)],
            message: "Biology keeps its three marks when it moves down to row 13",
          },
        ],
      },
      {
        id: "wrap",
        label: "5 · Display the content of E5 on two lines",
        assert: [
          {
            kind: "cells",
            range: "E5",
            expect: [t("Academic Year")],
            message: "E5 still says \"Academic Year\"",
          },
          {
            kind: "format",
            range: "E5",
            expect: { wrap: true },
            message: "E5 must be wrapped so the two words sit on two lines",
          },
        ],
      },
      {
        id: "centre",
        label: "6 · Centre B4, B5, E4 and E5",
        assert: [
          {
            kind: "format",
            range: "B4:B5",
            expect: { align: "center" },
            message: "B4 and B5 are centred",
          },
          {
            kind: "format",
            range: "E4:E5",
            expect: { align: "center" },
            message: "E4 and E5 are centred",
          },
        ],
      },
    ],
  },
  // Built by actually doing it: insert the column, insert the row, then wrap
  // and centre — so the worked answer cannot drift from what the buttons do.
  solution: (() => {
    let sheet = withInsertCol(makeSheet(GRADES_SHEET), colNumber("F"));
    sheet = withCell(sheet, "F7", "Remarks");
    sheet = withFormat(sheet, ["F7"], headCell("pink-500"));
    sheet = withInsertRow(sheet, 12);
    sheet = withCell(sheet, "B12", "Drawing");
    sheet = withFormat(sheet, refsOf("B12:G12"), { borders: ALL_BORDERS });
    sheet = withFormat(sheet, ["B4", "B5", "E4", "E5"], { align: "center" });
    sheet = withFormat(sheet, ["E5"], { wrap: true });
    return sheet;
  })(),
};

// ── Lesson 2 · Time to practise — the Calendar (book p. 27) ─────────────────

/**
 * Book: "Reproduce in Excel the table on the right. Try to keep the same
 * formatting." The printed table is a yellow "Calendar" written down the page
 * beside six month bars, the last one — June — in white on black.
 *
 * The exact corners of the month bars are not printed in words, so the check
 * asks for the month in its cell and for the colour band, and is strict only
 * about the two things the lesson is teaching: the turned "Calendar" block and
 * the merged June bar.
 */
const MONTH_BARS: { row: number; name: string; fill: string; family: ColorFamily }[] =
  [
    { row: 2, name: "January", fill: "green-300", family: "green" },
    { row: 4, name: "February", fill: "pink-300", family: "pink" },
    { row: 6, name: "March", fill: "blue-300", family: "blue" },
    { row: 8, name: "April", fill: "grey-300", family: "grey" },
    { row: 10, name: "May", fill: "grey-500", family: "grey" },
  ];

const CALENDAR_SHEET: SheetSpec = {
  name: "Sheet2",
  cells: {
    C2: "Calendar",
    ...Object.fromEntries(MONTH_BARS.map((m) => [`D${m.row}`, m.name])),
    C12: "June",
  },
  formats: {
    "C2:C11": {
      bold: true,
      fill: "yellow-300",
      orientation: "rotate-up",
      align: "center",
      valign: "middle",
      size: 16,
    },
    ...Object.fromEntries(
      MONTH_BARS.map((m) => [
        `D${m.row}:F${m.row}`,
        { fill: m.fill, align: "center", valign: "middle", font: "white" } as CellFormat,
      ]),
    ),
    "C12:F13": {
      bold: true,
      fill: "black",
      font: "white",
      align: "center",
      valign: "middle",
      size: 20,
    },
  },
  merges: [
    "C2:C11",
    ...MONTH_BARS.map((m) => `D${m.row}:F${m.row}`),
    "C12:F13",
  ],
  colWidths: { C: 70, D: 90, E: 90, F: 90 },
};

const l2Calendar: XlExercise = {
  id: "g6-c2-l2-calendar",
  lessonId: "g6-xl-02",
  page: 27,
  title: "Time to practise — the Calendar",
  brief:
    "Reproduce in Excel the table on the right. Try to keep the same formatting: the word \"Calendar\" written down the side of the six month bars, and June in white on black.",
  alsoInExcel:
    "The book asks for this table on Sheet2, renamed with Home → Format → Rename Sheet. This instrument works on one sheet, so do the renaming in Excel itself.",
  starter: makeSheet({ name: "Sheet2" }),
  hints: [
    "\"Calendar\" is one cell, not ten. Select C2 down to C11 and merge them into a single tall cell.",
    "A word only turns sideways with Home → Orientation. Pick the one that makes it read up the page.",
    "June is wider than the months above it — it starts one column further left, and its letters are white because the cell behind them is black.",
  ],
  check: {
    summary:
      "Looks at the tall Calendar cell, the five colour bands with their months, and the black June bar.",
    tasks: [
      {
        id: "calendar",
        label: "The word Calendar, turned and merged",
        assert: [
          {
            kind: "cells",
            range: "C2",
            expect: [t("Calendar")],
            message: "The word \"Calendar\" goes in C2",
          },
          {
            kind: "merged",
            range: "C2:C11",
            message: "C2 down to C11 becomes one tall cell",
          },
          {
            kind: "format",
            range: "C2",
            expect: { turned: true, fill: "yellow" },
            message: "\"Calendar\" is turned sideways on a yellow",
          },
        ],
      },
      {
        id: "months",
        label: "The five month bars",
        assert: [
          ...MONTH_BARS.map(
            (m): SheetAssertion => ({
              kind: "cells",
              range: `D${m.row}`,
              expect: [t(m.name)],
              message: `${m.name} goes in D${m.row}`,
            }),
          ),
          ...MONTH_BARS.map(
            (m): SheetAssertion => ({
              kind: "format",
              range: `D${m.row}`,
              expect: { fill: m.family },
              message: `${m.name} sits on ${familyWords(m.family)} band`,
            }),
          ),
        ],
      },
      {
        id: "june",
        label: "June in white on black",
        assert: [
          {
            kind: "cells",
            range: "C12",
            expect: [t("June")],
            message: "June goes in C12",
          },
          {
            kind: "merged-through",
            from: "C12",
            to: "F13",
            message: "The June bar is one merged block reaching across to column F",
          },
          {
            kind: "format",
            range: "C12",
            expect: { fill: "black", font: ["white"] },
            message: "June is written in white on black",
          },
        ],
      },
    ],
  },
  solution: makeSheet(CALENDAR_SHEET),
};

// ── Lesson 3 · My Expenses (book p. 28) ─────────────────────────────────────

/**
 * Book: "1- Reproduce the table on the right. 2- Apply the same formatting.
 * 3- Merge cells B2 to F2. 4- Merge cells B4 to B9. 5- Change to vertical the
 * orientation of the title My Expenses. 6- Hide column F and row 8.
 * 7- Protect Sheet1 against modifications. 8- Hide Sheet2. 9- Save the workbook."
 */
const EXPENSE_ROWS: [string, string, number][] = [
  ["Biscuit", "Monday", 2],
  ["Juce", "Monday", 4],
  ["Chocolat", "Tuesday", 5],
  ["Gift", "Thursday", 15],
  ["Pen", "Friday", 3],
];

const EXPENSES_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "Write your name here",
    B4: "My Expenses",
    ...rowCells(4, "D", ["Description", "Day", "Amount"]),
    ...Object.fromEntries(
      EXPENSE_ROWS.flatMap((row, i) => [
        [`D${5 + i}`, row[0]],
        [`E${5 + i}`, row[1]],
        [`F${5 + i}`, `$ ${row[2].toFixed(2)}`],
      ]),
    ),
  },
  formats: {
    "B2:F2": {
      bold: true,
      fill: "green-100",
      font: "green-700",
      align: "center",
      valign: "middle",
      size: 15,
    },
    "B4:B9": {
      bold: true,
      fill: "pink-300",
      orientation: "rotate-up",
      align: "center",
      valign: "middle",
      size: 15,
      borders: ALL_BORDERS,
    },
    "D4:F4": headCell("blue-300"),
    "D5:F9": { fill: "pink-100", borders: ALL_BORDERS },
    "F5:F9": { fill: "pink-100", borders: ALL_BORDERS, numFmt: "accounting" },
  },
  merges: ["B2:F2", "B4:B9"],
  colWidths: { B: 60, C: 40, D: 120, E: 100, F: 100 },
  rowHeights: { 2: 34 },
};

const l3MyExpenses: XlExercise = {
  id: "g6-c2-l3-my-expenses",
  lessonId: "g6-xl-03",
  page: 28,
  title: "My Expenses",
  brief:
    "1- Reproduce the table on the right. 2- Apply the same formatting. 3- Merge cells B2 to F2. 4- Merge cells B4 to B9. 5- Change to vertical the orientation of the title \"My Expenses\". 6- Hide column F and row 8.",
  alsoInExcel:
    "Steps 7, 8 and 9 of the lesson — protect Sheet1 with a password, hide Sheet2 and save the workbook on the hard drive — belong to Excel itself and to your own computer, so do those three in Excel.",
  starter: makeSheet({ name: "Sheet1" }),
  hints: [
    "Two merges, and they do not go the same way: B2 to F2 lies across the page, B4 to B9 stands down it.",
    "\"My Expenses\" only fits in that tall thin block once it has been turned — Home → Orientation.",
    "Hiding is not deleting. Select column F, then Home → Format → Hide & Unhide → Hide Columns; the same menu brings it back.",
  ],
  check: {
    summary:
      "Looks at the five expenses, the two merged blocks, the turned title, and the hidden column F and row 8.",
    tasks: [
      {
        id: "table",
        label: "1 · Reproduce the table",
        assert: [
          {
            kind: "cells",
            range: "B2",
            expect: [t("Write your name here")],
            message: "The top bar says \"Write your name here\"",
          },
          {
            kind: "cells",
            range: "B4",
            expect: [t("My Expenses")],
            message: "The title of the block is \"My Expenses\"",
          },
          {
            kind: "cells",
            range: "D4:F4",
            expect: [t("Description"), t("Day"), t("Amount")],
            message: "Row 4 holds the three headings",
          },
          {
            kind: "cells",
            range: "D5:F9",
            expect: EXPENSE_ROWS.flatMap((row) => [t(row[0]), t(row[1]), n(row[2])]),
            message: "The five expenses go in rows 5 to 9",
          },
        ],
      },
      {
        id: "merges",
        label: "3 and 4 · Merge B2:F2 and B4:B9",
        assert: [
          { kind: "merged", range: "B2:F2", message: "B2 to F2 becomes one cell" },
          { kind: "merged", range: "B4:B9", message: "B4 to B9 becomes one cell" },
        ],
      },
      {
        id: "orientation",
        label: "5 · Turn the title \"My Expenses\"",
        assert: [
          {
            kind: "format",
            range: "B4",
            expect: { turned: true, fill: "pink" },
            message: "\"My Expenses\" reads down the pink block, not across it",
          },
        ],
      },
      {
        id: "hide",
        label: "6 · Hide column F and row 8",
        assert: [
          { kind: "hidden", axis: "col", index: "F", message: "Column F is hidden" },
          { kind: "hidden", axis: "row", index: 8, message: "Row 8 is hidden" },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(EXPENSES_SHEET, { hiddenCols: ["F"], hiddenRows: [8] }),
  ),
};

// ── Lesson 3 · Time to practise — Champion's League (book p. 29) ────────────

const CHAMPIONS_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "Champion's League",
    ...rowCells(4, "B", ["Date", "Hour", "Team 1", "VS", "Team 2", "Result"]),
  },
  formats: {
    "B2:G2": {
      bold: true,
      fill: "yellow-500",
      align: "center",
      valign: "middle",
      size: 14,
    },
    "B4:G14": { borders: ALL_BORDERS },
    "B4:G4": { ...headCell("blue-700"), font: "white" },
    "E4:E14": {
      bold: true,
      fill: "grey-500",
      orientation: "rotate-up",
      align: "center",
      valign: "middle",
      borders: ALL_BORDERS,
    },
    "G5:G14": { fill: "green-500", borders: ALL_BORDERS },
  },
  merges: ["B2:G2", "E4:E14"],
  colWidths: { B: 90, C: 70, D: 130, E: 44, F: 130, G: 90 },
  rowHeights: { 2: 34 },
};

const l3Champions: XlExercise = {
  id: "g6-c2-l3-champions-league",
  lessonId: "g6-xl-03",
  page: 29,
  title: "Time to practise — Champion's League",
  brief:
    "Reproduce the table shown on the right. Try to keep the same formatting. Hide column E, and then save the workbook on your computer's hard drive.",
  alsoInExcel:
    "The book asks for this table on \"Sheet1\" and for the workbook to be saved on your hard drive — saving is a step for Excel itself.",
  starter: makeSheet({ name: "Sheet1" }),
  hints: [
    "Start with the yellow title bar: select B2 across to G2 and merge it before typing.",
    "The narrow grey strip between the two teams is one merged cell with VS turned sideways inside it.",
    "Hide column E last, once the VS strip is finished — hidden is not deleted, and the same menu unhides it.",
  ],
  check: {
    summary:
      "Looks at the title bar, the six headings, the grey VS strip and the hidden column E.",
    tasks: [
      {
        id: "title",
        label: "The title bar",
        assert: [
          {
            kind: "cells",
            range: "B2",
            expect: [t("Champion's League")],
            message: "The title is \"Champion's League\"",
          },
          {
            kind: "merged-through",
            from: "B2",
            to: "G2",
            message: "The title bar is merged across to column G",
          },
          {
            kind: "format",
            range: "B2",
            expect: { fill: "yellow" },
            message: "The title bar is yellow",
          },
        ],
      },
      {
        id: "headings",
        label: "The heading row",
        assert: [
          {
            kind: "cells",
            range: "B4:D4",
            expect: [t("Date"), t("Hour"), t("Team 1")],
            message: "Row 4 starts with Date, Hour and Team 1",
          },
          {
            kind: "cells",
            range: "F4:G4",
            expect: [t("Team 2"), t("Result")],
            message: "Team 2 and Result finish the heading row",
          },
          {
            kind: "format",
            range: "B4:D4",
            expect: { fill: "blue", bold: true },
            message: "The heading row sits on a blue band",
          },
        ],
      },
      {
        id: "vs",
        label: "The VS strip, hidden at the end",
        assert: [
          {
            kind: "cells",
            range: "E4",
            expect: [t("VS")],
            message: "VS goes in column E, between the two teams",
          },
          {
            kind: "merged-through",
            from: "E4",
            to: "E14",
            message: "The VS strip is one merged cell running down to row 14",
          },
          {
            kind: "format",
            range: "E4",
            expect: { turned: true, fill: "grey" },
            message: "VS is turned sideways on a grey strip",
          },
          { kind: "hidden", axis: "col", index: "E", message: "Column E is hidden" },
        ],
      },
    ],
  },
  solution: makeSheet(extend(CHAMPIONS_SHEET, { hiddenCols: ["E"] })),
};

// ── Lesson 4 · My Bike Rides (book pp. 30–31) ───────────────────────────────

/**
 * Book: "Create the table below in Excel in order to calculate the total
 * distance made in one week, the average distance per day and the longest and
 * shortest rides." Then, cell by cell: =c5+d5+e5 or =sum(c6:e6) for the total,
 * =average(…) for the average, =max(…) for the longest, and =min(c5:c11) in C13
 * for the shortest Ride 1.
 *
 * Two printing slips are worth knowing about. The text says "In cell E5, write
 * =c5+d5+e5" while its own screenshot shows the formula sitting in F5, under
 * "Total distance" — F is where it belongs. And the average and maximum are
 * printed as =average(d5:f5) and =max(d5:f5) while both screenshots read
 * C5:E5 — the three rides live in C, D and E.
 */
const RIDE_ROWS: [string, number, number, number][] = [
  ["Monday", 5, 6, 7],
  ["Tuesday", 4, 8, 3],
  ["Wednesday", 7, 9, 10],
  ["Thursday", 13, 12, 8],
  ["Friday", 8, 9, 4],
  ["Saturday", 15, 18, 20],
  ["Sunday", 25, 14, 7],
];

const rideTotals = RIDE_ROWS.map((r) => r[1] + r[2] + r[3]);
const rideAverages = rideTotals.map((total) => total / 3);
const rideLongest = RIDE_ROWS.map((r) => Math.max(r[1], r[2], r[3]));

const BIKE_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "My Bike Rides",
    ...rowCells(4, "B", [
      "Day",
      "Ride 1 in KM",
      "Ride 2 in KM",
      "Ride 3 in KM",
      "Total distance",
      "Average distance",
      "Longest Ride",
    ]),
    ...Object.fromEntries(
      RIDE_ROWS.flatMap((row, i) => [
        [`B${5 + i}`, row[0]],
        [`C${5 + i}`, row[1]],
        [`D${5 + i}`, row[2]],
        [`E${5 + i}`, row[3]],
      ]),
    ),
    B12: "Total distance",
    B13: "Shortest Ride",
  },
  formats: {
    "B2:H2": { ...titleBar("grey-500"), size: 18 },
    B4: headCell("yellow-300"),
    "C4:E4": headCell("pink-300"),
    "F4:H4": headCell("orange-300"),
    "B5:B11": { fill: "green-300", borders: ALL_BORDERS },
    "C5:H11": boxed,
    "B12:B13": { fill: "pink-300", bold: true, borders: ALL_BORDERS },
    "C12:H13": boxed,
  },
  merges: ["B2:H2"],
  colWidths: { B: 110, C: 108, D: 108, E: 108, F: 112, G: 124, H: 110 },
  rowHeights: { 2: 40, 4: 34 },
};

const l4BikeRides: XlExercise = {
  id: "g6-c2-l4-bike-rides",
  lessonId: "g6-xl-04",
  page: 30,
  title: "My Bike Rides",
  brief:
    "The week of rides is already typed for you. Calculate the total distance made in one week, the average distance per day, and the longest and shortest rides. The total may be written =c5+d5+e5 or =sum(c5:e5) — the book prints both.",
  starter: makeSheet(BIKE_SHEET),
  hints: [
    "Every formula begins with the = sign, and a formula never contains spaces.",
    "Write the formula once in row 5, then use Fill Down (Ctrl+D) — Excel moves the addresses down with it.",
    "The : in =min(c5:c11) means \"from cell C5 to cell C11\", so it looks at the whole week of Ride 1.",
  ],
  check: {
    summary:
      "Works through the four calculations of the lesson: the totals, the averages, the longest rides, and the total and shortest ride of Ride 1.",
    tasks: [
      {
        id: "total",
        label: "Total distance — column F",
        assert: [
          {
            kind: "cells",
            range: "F5:F11",
            expect: rideTotals.map((v) => n(v)),
            formula: true,
            message: "Column F adds the three rides of each day",
          },
        ],
      },
      {
        id: "average",
        label: "Average distance — column G",
        assert: [
          {
            kind: "cells",
            range: "G5:G11",
            expect: rideAverages.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Column G is the average of the 3 rides, with =average(…)",
          },
        ],
      },
      {
        id: "longest",
        label: "Longest Ride — column H",
        assert: [
          {
            kind: "cells",
            range: "H5:H11",
            expect: rideLongest.map((v) => n(v)),
            formula: true,
            fn: "MAX",
            message: "Column H is the longest ride of the day, with =max(…)",
          },
        ],
      },
      {
        id: "ride1",
        label: "Ride 1 for the whole week — C12 and C13",
        assert: [
          {
            kind: "cells",
            range: "C12",
            expect: [n(RIDE_ROWS.reduce((sum, r) => sum + r[1], 0))],
            formula: true,
            message: "C12 is the total distance of Ride 1 for the week",
          },
          {
            kind: "cells",
            range: "C13",
            expect: [n(Math.min(...RIDE_ROWS.map((r) => r[1])))],
            formula: true,
            fn: "MIN",
            message: "C13 is the shortest Ride 1 of the week: =min(c5:c11)",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(BIKE_SHEET, {
      cells: {
        ...Object.fromEntries(
          RIDE_ROWS.map((_, i) => [`F${5 + i}`, `=SUM(C${5 + i}:E${5 + i})`]),
        ),
        ...Object.fromEntries(
          RIDE_ROWS.map((_, i) => [`G${5 + i}`, `=AVERAGE(C${5 + i}:E${5 + i})`]),
        ),
        ...Object.fromEntries(
          RIDE_ROWS.map((_, i) => [`H${5 + i}`, `=MAX(C${5 + i}:E${5 + i})`]),
        ),
        C12: "=SUM(C5:C11)",
        C13: "=MIN(C5:C11)",
      },
    }),
  ),
};

// ── Lesson 4 · It is time for math! (book p. 31) ────────────────────────────

/**
 * Book: "Here is a formula written in two ways: with and without parentheses.
 * 1- =(C3+D3+E3)/3   2- =C3+D3+E3/3.  Try them on your computer and describe
 * the result." The book leaves C3, D3 and E3 empty, so three numbers are put
 * there to try it on — a teacher can change them and run it again.
 */
const MATH_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "It is time for math!",
    B3: "Three numbers",
    C3: 12,
    D3: 15,
    E3: 9,
    B5: "1   =(C3+D3+E3)/3",
    B6: "2   =C3+D3+E3/3",
  },
  formats: {
    "B2:E2": titleBar("purple-500"),
    B3: { bold: true, fill: "yellow-300", borders: ALL_BORDERS },
    "C3:E3": { ...boxed, align: "center" },
    "B5:B6": { fill: "grey-100", borders: ALL_BORDERS },
    "C5:C6": { ...boxed, bold: true },
  },
  merges: ["B2:E2"],
  colWidths: { B: 190, C: 90, D: 90, E: 90 },
};

const l4TimeForMath: XlExercise = {
  id: "g6-c2-l4-time-for-math",
  lessonId: "g6-xl-04",
  page: 31,
  title: "It is time for math!",
  brief:
    "Here is a formula written in two ways: with and without parentheses. Write =(C3+D3+E3)/3 in C5 and =C3+D3+E3/3 in C6. Try them on your computer and describe the result: why do the same three numbers give two different answers?",
  starter: makeSheet(MATH_SHEET),
  hints: [
    "Type the two formulas exactly as the book prints them — the only difference between them is a pair of brackets.",
    "Excel does the divisions before the additions, unless brackets tell it to do something first.",
    "In the second formula only one of the three numbers is divided by 3. Which one?",
  ],
  check: {
    summary: "Compares the two answers the book asks you to describe.",
    tasks: [
      {
        id: "with",
        label: "1 · With the parentheses",
        assert: [
          {
            kind: "cells",
            range: "C5",
            expect: [n(12)],
            formula: true,
            message: "C5 holds =(C3+D3+E3)/3, the true average of the three numbers",
          },
        ],
      },
      {
        id: "without",
        label: "2 · Without the parentheses",
        assert: [
          {
            kind: "cells",
            range: "C6",
            expect: [n(30)],
            formula: true,
            message:
              "C6 holds =C3+D3+E3/3 — Excel divides only the last number, so the answer is much bigger",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(MATH_SHEET, {
      cells: { C5: "=(C3+D3+E3)/3", C6: "=C3+D3+E3/3" },
    }),
  ),
};

// ── Lesson 5 · The most used formulas (book pp. 32–33) ──────────────────────

/** Unit price, then quantity — the blanks are blank in the book too. */
const PRODUCTS: [number, number | ""][] = [
  [12, ""],
  [4, 5],
  [2, 14],
  [6, 2],
  [8, ""],
  [7, 6],
  [1, 4],
  [5, 7],
  [2.5, ""],
  [4, 9],
];

const FORMULAS_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "Today's Date",
    E2: "The day",
    E3: "The Month",
    E4: "The Year",
    ...rowCells(6, "B", [
      "Description",
      "Unit Price",
      "Quantity",
      "Total Price",
      "Remarks",
    ]),
    ...Object.fromEntries(
      PRODUCTS.flatMap((product, i) => {
        const row = 7 + i;
        const cells: [string, string | number][] = [
          [`B${row}`, `Product ${i + 1}`],
          [`C${row}`, product[0]],
        ];
        if (product[1] !== "") cells.push([`D${row}`, product[1]]);
        return cells;
      }),
    ),
    B18: "Number of NON empty cells",
    B19: "Number of empty cells",
  },
  formats: {
    B2: { bold: true, fill: "green-300", borders: ALL_BORDERS },
    C2: { ...boxed, fill: "pink-100" },
    "E2:E4": { bold: true, fill: "green-300", borders: ALL_BORDERS },
    "F2:F4": { ...boxed, align: "center" },
    "B3:C4": { fill: "pink-300" },
    "B6:F6": headCell("yellow-500"),
    "B7:B16": { bold: true, borders: ALL_BORDERS },
    "C7:F16": boxed,
    "B18:B19": { bold: true, fill: "blue-100", borders: ALL_BORDERS },
    "C18:D19": { ...boxed, fill: "blue-300", align: "center" },
  },
  colWidths: { B: 190, C: 92, D: 92, E: 100, F: 100 },
  rowHeights: { 2: 30 },
};

const totalPrices = PRODUCTS.map((p) => p[0] * (p[1] === "" ? 0 : p[1]));
const quantityCount = PRODUCTS.filter((p) => p[1] !== "").length;

const l5MostUsedFormulas: XlExercise = {
  id: "g6-c2-l5-most-used-formulas",
  lessonId: "g6-xl-05",
  page: 32,
  title: "Today, Day, Month, Year, Count and Countblank",
  brief:
    "2- In cell C2, write the formula to display today's date. 3- In cell F2, the formula to display the day. 4- In F3, the month. 5- In F4, the year. 6- In cells E7 to E16, the formula to calculate the total price. 7- In D18, the formula to display the number of non empty cells. 8- In D19, the number of empty cells.",
  starter: makeSheet(FORMULAS_SHEET),
  hints: [
    "=today() takes nothing at all between its brackets, and it writes itself again every single day.",
    "The day, the month and the year are all pulled out of the date that is already sitting in C2.",
    "COUNT counts the cells that hold a number — and 0 counts as a number. COUNTBLANK counts the empty ones.",
  ],
  check: {
    summary:
      "Checks today's date and the three pieces pulled out of it, the ten total prices, and the two counts of the quantity column.",
    tasks: [
      {
        id: "today",
        label: "2 · Today's date in C2",
        assert: [
          {
            kind: "cells",
            range: "C2",
            expect: [{ kind: "today", part: "date" }],
            formula: true,
            fn: "TODAY",
            message: "C2 must show today's date with =today()",
          },
        ],
      },
      {
        id: "parts",
        label: "3, 4, 5 · The day, the month and the year",
        assert: [
          {
            kind: "cells",
            range: "F2",
            expect: [{ kind: "today", part: "day" }],
            formula: true,
            fn: "DAY",
            message: "F2 is the day of the date in C2: =day(C2)",
          },
          {
            kind: "cells",
            range: "F3",
            expect: [{ kind: "today", part: "month" }],
            formula: true,
            fn: "MONTH",
            message: "F3 is the month: =month(C2)",
          },
          {
            kind: "cells",
            range: "F4",
            expect: [{ kind: "today", part: "year" }],
            formula: true,
            fn: "YEAR",
            message: "F4 is the year: =year(C2)",
          },
        ],
      },
      {
        id: "totals",
        label: "6 · The total price, E7 to E16",
        assert: [
          {
            kind: "cells",
            range: "E7:E16",
            expect: totalPrices.map((v) => n(v)),
            formula: true,
            message:
              "Each total price is the unit price multiplied by the quantity — an empty quantity counts as 0",
          },
        ],
      },
      {
        id: "counts",
        label: "7 and 8 · Counting the quantity column",
        assert: [
          {
            kind: "cells",
            range: "D18",
            expect: [n(quantityCount)],
            formula: true,
            fn: "COUNT",
            message: "D18 counts the non empty cells: =COUNT(D7:D16)",
          },
          {
            kind: "cells",
            range: "D19",
            expect: [n(PRODUCTS.length - quantityCount)],
            formula: true,
            fn: "COUNTBLANK",
            message: "D19 counts the empty cells: =COUNTblank(D7:D16)",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(FORMULAS_SHEET, {
      cells: {
        C2: "=TODAY()",
        F2: "=DAY(C2)",
        F3: "=MONTH(C2)",
        F4: "=YEAR(C2)",
        ...Object.fromEntries(
          PRODUCTS.map((_, i) => [`E${7 + i}`, `=C${7 + i}*D${7 + i}`]),
        ),
        D18: "=COUNT(D7:D16)",
        D19: "=COUNTBLANK(D7:D16)",
      },
      formats: { C2: { ...boxed, fill: "pink-100", numFmt: "date" } },
    }),
  ),
};

// ── Lesson 5 · Time to practise — the Grades Bulletin (book p. 33) ──────────

/**
 * Book: "Open the document created on page 22. Calculate in column F the
 * average for each subject. Calculate in row 14 the average for each quiz."
 *
 * The figure on this page shows the same grades table under the title "Grades
 * Bulletin", with row 14 waiting to be filled — so the numbers 8 · 16.5 · 10
 * that lesson 1 printed in that row are gone, replaced by the averages Excel
 * works out.
 */
const subjectAverages = GRADE_ROWS.slice(0, 6).map(
  (row) => (row[1] + row[2] + row[3]) / 3,
);
const quizAverages = [1, 2, 3].map(
  (i) =>
    GRADE_ROWS.slice(0, 6).reduce((sum, row) => sum + row[i as 1 | 2 | 3], 0) / 6,
);

const BULLETIN_SHEET: SheetSpec = extend(GRADES_SHEET, {
  cells: {
    ...gradesTableCells(),
    B2: "Grades Bulletin",
    C14: "",
    D14: "",
    E14: "",
  },
  formats: { "B2:F2": titleBar("green-700") },
});

const l5GradesBulletin: XlExercise = {
  id: "g6-c2-l5-grades-bulletin",
  lessonId: "g6-xl-05",
  page: 33,
  title: "Time to practise — the Grades Bulletin",
  brief:
    "Open the document created in lesson 1. Calculate in column F the average for each subject, and in row 14 the average for each quiz.",
  starter: makeSheet(BULLETIN_SHEET),
  hints: [
    "One subject is one line of the table: its three marks sit side by side in C, D and E.",
    "One quiz is one column: Grade 1 runs from C8 all the way down to C13.",
    "Write the first formula, then fill it down (or across) instead of typing it six times.",
  ],
  check: {
    summary:
      "Checks the six subject averages down column F and the three quiz averages along row 14.",
    tasks: [
      {
        id: "subjects",
        label: "The average for each subject — column F",
        assert: [
          {
            kind: "cells",
            range: "F8:F13",
            expect: subjectAverages.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Column F averages the three marks of each subject",
          },
        ],
      },
      {
        id: "quizzes",
        label: "The average for each quiz — row 14",
        assert: [
          {
            kind: "cells",
            range: "C14:E14",
            expect: quizAverages.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Row 14 averages each quiz over the six subjects",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(BULLETIN_SHEET, {
      cells: {
        ...Object.fromEntries(
          GRADE_ROWS.slice(0, 6).map((_, i) => [
            `F${8 + i}`,
            `=AVERAGE(C${8 + i}:E${8 + i})`,
          ]),
        ),
        C14: "=AVERAGE(C8:C13)",
        D14: "=AVERAGE(D8:D13)",
        E14: "=AVERAGE(E8:E13)",
      },
    }),
  ),
};

// ── Lesson 6 · PASSED or FAILED (book p. 34) ────────────────────────────────

const STUDENT_ROWS: [string, number, number, number][] = [
  ["Student 1", 12, 15, 7],
  ["Student 2", 14, 13, 6],
  ["Student 3", 8, 14, 15],
  ["Student 4", 15, 11, 12],
  ["Student 5", 12, 10, 4],
  ["Student 6", 11, 6, 7],
  ["Student 7", 10, 9, 12],
];

const studentAverage = STUDENT_ROWS.map((r) => (r[1] + r[2] + r[3]) / 3);
const studentMax = STUDENT_ROWS.map((r) => Math.max(r[1], r[2], r[3]));
const studentMin = STUDENT_ROWS.map((r) => Math.min(r[1], r[2], r[3]));
const quizMax = [1, 2, 3].map((i) =>
  Math.max(...STUDENT_ROWS.map((r) => r[i as 1 | 2 | 3])),
);
const quizMin = [1, 2, 3].map((i) =>
  Math.min(...STUDENT_ROWS.map((r) => r[i as 1 | 2 | 3])),
);
const quizMean = [1, 2, 3].map(
  (i) =>
    STUDENT_ROWS.reduce((sum, r) => sum + r[i as 1 | 2 | 3], 0) /
    STUDENT_ROWS.length,
);

const IF_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    ...rowCells(2, "B", [
      "Student's Name",
      "Grade 1",
      "Grade 2",
      "Grade 3",
      "Average",
      "Max Grade",
      "Min Grade",
      "Result",
    ]),
    ...Object.fromEntries(
      STUDENT_ROWS.flatMap((row, i) => [
        [`B${4 + i}`, row[0]],
        [`C${4 + i}`, row[1]],
        [`D${4 + i}`, row[2]],
        [`E${4 + i}`, row[3]],
      ]),
    ),
    B12: "Max Grade",
    B13: "Min Grade",
    B14: "Average Grade",
  },
  formats: {
    "B2:I2": headCell("yellow-500"),
    "B4:B10": { bold: true, align: "center", borders: ALL_BORDERS },
    "C4:I10": { ...boxed, align: "center" },
    "B12:B14": { bold: true, fill: "blue-300", borders: ALL_BORDERS },
    "C12:E14": { ...boxed, fill: "green-300", align: "center" },
  },
  colWidths: { B: 130, F: 92, G: 96, H: 96, I: 92 },
};

const l6IfFunction: XlExercise = {
  id: "g6-c2-l6-if-passed-failed",
  lessonId: "g6-xl-06",
  page: 34,
  title: "Use the function IF — PASSED or FAILED",
  brief:
    "2- In columns F, G and H, write the formulas to calculate the Average, the maximum and the minimum grades. 3- In rows 12, 13 and 14, write the formulas to calculate the maximum, minimum and average for the 3 columns C, D and E. 4- In column I, write the IF function to display \"PASSED\" if the Average is greater than 10 and \"FAILED\" if the Average is less than 10.",
  starter: makeSheet(IF_SHEET),
  hints: [
    "Columns F, G and H look along one student's row; rows 12, 13 and 14 look down one quiz's column.",
    "The IF function is made of 3 parts separated by two commas: the condition, the answer when it is true, the answer when it is false.",
    "The two answers are words, so they go between quotation marks: =IF(F4>=10,\"PASSED\",\"FAILED\").",
  ],
  check: {
    summary:
      "Checks the three columns of each student, the three rows of each quiz, and the PASSED / FAILED decision.",
    tasks: [
      {
        id: "students",
        label: "2 · Average, maximum and minimum of each student",
        assert: [
          {
            kind: "cells",
            range: "F4:F10",
            expect: studentAverage.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Column F is the average of the three grades",
          },
          {
            kind: "cells",
            range: "G4:G10",
            expect: studentMax.map((v) => n(v)),
            formula: true,
            fn: "MAX",
            message: "Column G is the biggest of the three grades",
          },
          {
            kind: "cells",
            range: "H4:H10",
            expect: studentMin.map((v) => n(v)),
            formula: true,
            fn: "MIN",
            message: "Column H is the smallest of the three grades",
          },
        ],
      },
      {
        id: "quizzes",
        label: "3 · Maximum, minimum and average of the columns C, D and E",
        assert: [
          {
            kind: "cells",
            range: "C12:E12",
            expect: quizMax.map((v) => n(v)),
            formula: true,
            fn: "MAX",
            message: "Row 12 is the maximum of each quiz",
          },
          {
            kind: "cells",
            range: "C13:E13",
            expect: quizMin.map((v) => n(v)),
            formula: true,
            fn: "MIN",
            message: "Row 13 is the minimum of each quiz",
          },
          {
            kind: "cells",
            range: "C14:E14",
            expect: quizMean.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Row 14 is the average of each quiz",
          },
        ],
      },
      {
        id: "result",
        label: "4 · PASSED or FAILED in column I",
        assert: [
          {
            kind: "cells",
            range: "I4:I10",
            expect: studentAverage.map((avg) => t(avg >= 10 ? "PASSED" : "FAILED")),
            formula: true,
            fn: "IF",
            message:
              "Column I shows PASSED when the Average reaches 10, and FAILED when it does not",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(IF_SHEET, {
      cells: {
        ...Object.fromEntries(
          STUDENT_ROWS.flatMap((_, i) => {
            const row = 4 + i;
            return [
              [`F${row}`, `=AVERAGE(C${row}:E${row})`],
              [`G${row}`, `=MAX(C${row}:E${row})`],
              [`H${row}`, `=MIN(C${row}:E${row})`],
              [`I${row}`, `=IF(F${row}>=10,"PASSED","FAILED")`],
            ];
          }),
        ),
        C12: "=MAX(C4:C10)",
        D12: "=MAX(D4:D10)",
        E12: "=MAX(E4:E10)",
        C13: "=MIN(C4:C10)",
        D13: "=MIN(D4:D10)",
        E13: "=MIN(E4:E10)",
        C14: "=AVERAGE(C4:C10)",
        D14: "=AVERAGE(D4:D10)",
        E14: "=AVERAGE(E4:E10)",
      },
    }),
  ),
};

// ── Lesson 6 · Project 1 — RENT ME (book p. 35) ─────────────────────────────

/** Client · car · reservation date · release date · price per day. */
const RENTALS: [string, string, [number, number, number], [number, number, number], number][] =
  [
    ["Fadi Kamel", "BMW", [2021, 8, 3], [2021, 8, 6], 20],
    ["Farah Labaki", "Kia", [2021, 8, 4], [2021, 8, 10], 15],
    ["Rania Mansour", "Renault", [2021, 8, 6], [2021, 8, 10], 10],
    ["Ray Kaddoura", "Toyota", [2021, 8, 12], [2021, 8, 16], 16],
    ["Bassam Harb", "Infinity", [2021, 8, 20], [2021, 8, 25], 25],
    ["Jana Karim", "Mercedes", [2021, 8, 29], [2021, 9, 4], 30],
  ];

const rentalDays = RENTALS.map(
  (r) => dateSerial(...r[3]) - dateSerial(...r[2]),
);
const rentalTotals = RENTALS.map((r, i) => rentalDays[i] * r[4]);

const RENT_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "Rent Me: Statement of reservation",
    ...rowCells(4, "B", [
      "Client",
      "Car",
      "Reservation Date",
      "Release Date",
      "Nbr of Days",
      "Price per day",
      "Total Amount",
      "Discount",
    ]),
  },
  formats: {
    "B2:I2": { ...titleBar("pink-300"), font: "black" },
    "B4:I4": headCell("green-300"),
    "B5:I10": boxed,
    "F5:F10": { ...boxed, fill: "yellow-100", align: "center" },
    "G5:G10": { ...boxed, fill: "blue-100" },
    "H5:H10": { ...boxed, fill: "grey-100" },
    "I5:I10": { ...boxed, fill: "green-500", align: "center" },
  },
  merges: ["B2:I2"],
  colWidths: { B: 130, C: 100, D: 132, E: 120, F: 106, G: 116, H: 122, I: 92 },
  rowHeights: { 2: 36, 4: 34 },
};

const l6RentMe: XlExercise = {
  id: "g6-c2-l6-rent-me",
  lessonId: "g6-xl-06",
  page: 35,
  title: "Project 1 — RENT ME",
  brief:
    "The company \"RENT ME\" asks you to create a table registering all the reservations of cars. Fill in the columns B, C, D, E and G with the values of the printed table. In column F, calculate the number of reservation days. In column H, calculate the total price. In column I, use the formula IF to display \"Yes\" if the total is > 300 and \"No\" if the total is < 300. Remark 1: dates are written in the American system month/day/year. Remark 2: in column G, never type the symbol of the currency — use the Accounting Number Format.",
  starter: makeSheet(RENT_SHEET),
  hints: [
    "A date is a number to Excel: that is why one date can be taken away from another to count the days.",
    "The total amount is the price of one day repeated for every day of the reservation.",
    "The discount question has only two answers, so it is one IF: the test, the word for yes, the word for no.",
  ],
  check: {
    summary:
      "Checks the six reservations you typed, then the days, the totals and the discount decisions.",
    tasks: [
      {
        id: "data",
        label: "Fill in the columns B, C, D, E and G",
        assert: [
          {
            kind: "cells",
            range: "B5:C10",
            expect: RENTALS.flatMap((r) => [t(r[0]), t(r[1])]),
            message: "The six clients and their cars go in columns B and C",
          },
          {
            kind: "cells",
            range: "D5:E10",
            expect: RENTALS.flatMap((r) => [on(...r[2]), on(...r[3])]),
            message: "The reservation and release dates go in columns D and E",
          },
          {
            kind: "cells",
            range: "G5:G10",
            expect: RENTALS.map((r) => n(r[4])),
            message: "The price per day goes in column G",
          },
          {
            kind: "format",
            range: "G5:G10",
            expect: { numFmt: "accounting" },
            message:
              "Column G shows its currency with the Accounting Number Format, not with a typed symbol",
          },
        ],
      },
      {
        id: "days",
        label: "Column F · the number of reservation days",
        assert: [
          {
            kind: "cells",
            range: "F5:F10",
            expect: rentalDays.map((v) => n(v)),
            formula: true,
            message: "Excel counts the days between the two dates",
          },
        ],
      },
      {
        id: "total",
        label: "Column H · the total price",
        assert: [
          {
            kind: "cells",
            range: "H5:H10",
            expect: rentalTotals.map((v) => n(v)),
            formula: true,
            message: "The total is the number of days times the price per day",
          },
        ],
      },
      {
        id: "discount",
        label: "Column I · the discount",
        assert: [
          {
            kind: "cells",
            range: "I5:I10",
            expect: rentalTotals.map((total) => t(total > 300 ? "Yes" : "No")),
            formula: true,
            fn: "IF",
            message: "Column I answers Yes above 300 and No below it",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(RENT_SHEET, {
      cells: {
        ...Object.fromEntries(
          RENTALS.flatMap((r, i) => {
            const row = 5 + i;
            return [
              [`B${row}`, r[0]],
              [`C${row}`, r[1]],
              [`D${row}`, `${r[2][1]}/${r[2][2]}/${r[2][0]}`],
              [`E${row}`, `${r[3][1]}/${r[3][2]}/${r[3][0]}`],
              [`F${row}`, `=E${row}-D${row}`],
              [`G${row}`, r[4]],
              [`H${row}`, `=F${row}*G${row}`],
              [`I${row}`, `=IF(H${row}>300,"Yes","No")`],
            ];
          }),
        ),
      },
      formats: {
        "G5:G10": { ...boxed, fill: "blue-100", numFmt: "accounting" },
        "H5:H10": { ...boxed, fill: "grey-100", numFmt: "accounting" },
      },
    }),
  ),
};

// ── Lesson 7 · Project 2 — National School (book p. 36) ─────────────────────

/**
 * Book: "1- Calculate in column F the average for each student. 2- In column G,
 * calculate the average as follows: a- Average2 = Average1 + 1 if Average1 is
 * between 10 and 11. b- Average2 = Average1 in the other cases. 3- Calculate in
 * column H the Result1: display Succeded if Average2 > 10, Failed in the other
 * cases. Calculate in column I the Result2: the student is promoted to the next
 * class if Average2 > 10 and maths > 11. Note: you must use the formulas IF and
 * the logical connector AND."
 *
 * Two readings live in the same page. Sami's Average1 is exactly 11.0 and the
 * printed Average2 is 12.0, so "between 10 and 11" includes both ends. And the
 * printed Result2 column marks Simon and Hani "Succeded" although their maths
 * is 11, which "maths > 11" would refuse — the printed table answers as if it
 * were "maths ≥ 11". Those two cells therefore accept either answer here; every
 * other cell is checked strictly.
 */
const SCHOOL_ROWS: [string, number, number, number][] = [
  ["Sami Karam", 12, 10, 11],
  ["Simon Farah", 11, 11, 14],
  ["Karine Tabet", 8, 9, 9],
  ["Walid Sukkar", 10, 12, 10],
  ["Hani Chami", 11, 11, 14],
];

const average1 = SCHOOL_ROWS.map((r) => (r[1] + r[2] + r[3]) / 3);
const average2 = average1.map((a) => (a >= 10 && a <= 11 ? a + 1 : a));
const result1 = average2.map((a) => (a > 10 ? "Succeded" : "Failed"));
/** Strict reading (maths > 11) · the printed table's reading (maths ≥ 11). */
const result2 = SCHOOL_ROWS.map((r, i) => {
  const strict = average2[i] > 10 && r[1] > 11;
  const printed = average2[i] > 10 && r[1] >= 11;
  return strict === printed
    ? [strict ? "Succeded" : "Failed"]
    : ["Succeded", "Failed"];
});

const SCHOOL_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    B2: "National School",
    ...rowCells(4, "B", [
      "Name",
      "Maths",
      "IT",
      "English",
      "Average1",
      "Average2",
      "Result1",
      "Result2",
    ]),
  },
  formats: {
    "B2:I2": { ...titleBar("blue-500"), font: "green-500" },
    "B4:I4": headCell("orange-300"),
    "B6:I10": { ...boxed, align: "center" },
    "B6:B10": { ...boxed, bold: true },
    "F6:G10": { ...boxed, align: "center", numFmt: "decimal1" },
  },
  merges: ["B2:I2"],
  colWidths: { B: 130, F: 92, G: 92, H: 96, I: 96 },
  rowHeights: { 2: 32 },
};

const l7NationalSchool: XlExercise = {
  id: "g6-c2-l7-national-school",
  lessonId: "g6-xl-07",
  page: 36,
  title: "Project 2 — National School",
  brief:
    "Reproduce the table of grades. 1- Calculate in column F the average for each student. 2- In column G, Average2 = Average1 + 1 if Average1 is between 10 and 11, and Average2 = Average1 in the other cases. 3- In column H, display \"Succeded\" if Average2 > 10 and \"Failed\" in the other cases. In column I, the student is promoted if Average2 > 10 and maths > 11 — use IF with the logical connector AND.",
  starter: makeSheet(SCHOOL_SHEET),
  hints: [
    "\"Between 10 and 11\" is two conditions at once, and Excel joins them with AND(…,…).",
    "Look at Sami: his Average1 is exactly 11.0 and the book still adds 1 to it — so both ends belong inside the \"between\".",
    "Result2 asks two questions about two different columns at the same time: the average and the maths grade.",
  ],
  check: {
    summary:
      "Checks the five students' grades, then Average1, Average2, Result1 and Result2.",
    tasks: [
      {
        id: "data",
        label: "Reproduce the table of grades",
        assert: [
          {
            kind: "cells",
            range: "B6:E10",
            expect: SCHOOL_ROWS.flatMap((r) => [t(r[0]), n(r[1]), n(r[2]), n(r[3])]),
            message: "The five students and their three grades go in rows 6 to 10",
          },
        ],
      },
      {
        id: "average1",
        label: "1 · Average1 in column F",
        assert: [
          {
            kind: "cells",
            range: "F6:F10",
            expect: average1.map((v) => n(v)),
            formula: true,
            fn: "AVERAGE",
            message: "Column F averages Maths, IT and English",
          },
        ],
      },
      {
        id: "average2",
        label: "2 · Average2 in column G",
        assert: [
          {
            kind: "cells",
            range: "G6:G10",
            expect: average2.map((v) => n(v)),
            formula: true,
            fn: "IF",
            message:
              "Column G adds 1 only when Average1 is between 10 and 11, and copies it otherwise",
          },
        ],
      },
      {
        id: "result1",
        label: "3 · Result1 in column H",
        assert: [
          {
            kind: "cells",
            range: "H6:H10",
            expect: result1.map((r) => t([r, r === "Succeded" ? "Succeeded" : "Failed"])),
            formula: true,
            fn: "IF",
            message: "Column H reads Average2 and answers Succeded or Failed",
          },
        ],
      },
      {
        id: "result2",
        label: "Result2 in column I — with the connector AND",
        assert: [
          {
            kind: "cells",
            range: "I6:I10",
            expect: result2.map((options) =>
              t(options.flatMap((o) => (o === "Succeded" ? [o, "Succeeded"] : [o]))),
            ),
            formula: true,
            fn: "AND",
            message:
              "Column I promotes a student only when both tests are true at the same time",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(SCHOOL_SHEET, {
      cells: {
        ...Object.fromEntries(
          SCHOOL_ROWS.flatMap((r, i) => {
            const row = 6 + i;
            return [
              [`B${row}`, r[0]],
              [`C${row}`, r[1]],
              [`D${row}`, r[2]],
              [`E${row}`, r[3]],
              [`F${row}`, `=AVERAGE(C${row}:E${row})`],
              [
                `G${row}`,
                `=IF(AND(F${row}>=10,F${row}<=11),F${row}+1,F${row})`,
              ],
              [`H${row}`, `=IF(G${row}>10,"Succeded","Failed")`],
              [
                `I${row}`,
                `=IF(AND(G${row}>10,C${row}>=11),"Succeded","Failed")`,
              ],
            ];
          }),
        ),
      },
    }),
  ),
};

// ── Lesson 7 · Project 3 — Cinema Show (book p. 36) ─────────────────────────

/**
 * Book: "For room A, the film will be played regardless of the number of
 * reservations. For the other rooms, the movie will be played only if the
 * number of reservations is > 30. It is possible to make a double test with
 * the formula IF: =IF(OR(B6="A",C6>=30),message1,message2)."
 *
 * The headings keep the book's own spelling, typos included, because the
 * student is copying what is printed.
 */
const AUDITORIUMS: [string, number][] = [
  ["A", 45],
  ["B", 32],
  ["C", 45],
  ["D", 20],
];

const cinemaDecision = AUDITORIUMS.map(([room, seats]) =>
  room === "A" || seats >= 30 ? "Movie to Show" : "Movie will not run",
);

const CINEMA_SHEET: SheetSpec = {
  name: "Sheet1",
  cells: {
    C2: "Cimena Show",
    ...rowCells(4, "B", ["Auditorium", "Nuumber of Reservation", "Decision"]),
  },
  formats: {
    "B2:D2": { ...titleBar("green-100"), font: "green-700", size: 18 },
    "B4:D4": headCell("grey-300"),
    "B5:D8": { ...boxed, align: "center" },
    "D5:D8": { ...boxed, bold: true, align: "center" },
  },
  merges: ["B2:D2"],
  colWidths: { B: 110, C: 190, D: 160 },
  rowHeights: { 2: 44 },
};

const l7CinemaShow: XlExercise = {
  id: "g6-c2-l7-cinema-show",
  lessonId: "g6-xl-07",
  page: 36,
  title: "Project 3 — Cinema Show",
  brief:
    "The director of the theatre asks you to create a table displaying the number of reservations in the different rooms, so that he can decide if the film will be played or not. For room \"A\" the film is played whatever the number of reservations; for the other rooms it is played only if the number of reservations is > 30. Be careful: it is possible to make a double test with the formula IF.",
  starter: makeSheet(CINEMA_SHEET),
  hints: [
    "Two different reasons can let the film run, and either one of them is enough on its own.",
    "OR is true as soon as one of its tests is true — that is what makes room A special.",
    "The room letter is a word, so it goes between quotation marks inside the test: B5=\"A\".",
  ],
  check: {
    summary:
      "Checks the four auditoriums and the decision the double test comes to for each of them.",
    tasks: [
      {
        id: "data",
        label: "The four auditoriums",
        assert: [
          {
            kind: "cells",
            range: "B5:C8",
            expect: AUDITORIUMS.flatMap(([room, seats]) => [t(room), n(seats)]),
            message: "The rooms and their reservations go in columns B and C",
          },
        ],
      },
      {
        id: "decision",
        label: "The decision — a double test with IF and OR",
        assert: [
          {
            kind: "cells",
            range: "D5:D8",
            expect: cinemaDecision.map((d) => t(d)),
            formula: true,
            fn: "OR",
            message:
              "Room A always shows the movie; the others only when the reservations pass 30",
          },
        ],
      },
    ],
  },
  solution: makeSheet(
    extend(CINEMA_SHEET, {
      cells: {
        ...Object.fromEntries(
          AUDITORIUMS.flatMap(([room, seats], i) => {
            const row = 5 + i;
            return [
              [`B${row}`, room],
              [`C${row}`, seats],
              [
                `D${row}`,
                `=IF(OR(B${row}="A",C${row}>=30),"Movie to Show","Movie will not run")`,
              ],
            ];
          }),
        ),
      },
    }),
  ),
};

// ── The chapter, in the book's order ────────────────────────────────────────

export const XL_EXERCISES: XlExercise[] = [
  l1GradesSheet,
  l2RemarksAndDrawing,
  l2Calendar,
  l3MyExpenses,
  l3Champions,
  l4BikeRides,
  l4TimeForMath,
  l5MostUsedFormulas,
  l5GradesBulletin,
  l6IfFunction,
  l6RentMe,
  l7NationalSchool,
  l7CinemaShow,
];

/** Every exercise of one lesson, in the order the book sets them. */
export function exercisesForLesson(lessonId: string): XlExercise[] {
  return XL_EXERCISES.filter((exercise) => exercise.lessonId === lessonId);
}

/** One exercise by id — for deep links straight into the studio. */
export function exerciseById(id: string): XlExercise | undefined {
  return XL_EXERCISES.find((exercise) => exercise.id === id);
}
