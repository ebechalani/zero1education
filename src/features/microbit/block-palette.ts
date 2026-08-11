import type {
  MbBinOp,
  MbButton,
  MbEvent,
  MbExpr,
  MbIcon,
  MbStatement,
} from "./program";

/**
 * The palette is data. The editor renders from it, so adding a block to the
 * platform = one entry here (plus, if it is a new statement kind, a case in
 * StatementFields).
 *
 * Categories, order and colours are MakeCode's own, so a block a student drags
 * on screen is the block printed in the book — same hue, same order in the
 * palette. Block words are white on every face, as MakeCode has them; the
 * editor adds a hair of text shadow so the lighter greens still read from the
 * back of a room.
 */

// ── Categories ──────────────────────────────────────────────────────────────

export type MbCategory =
  | "basic"
  | "input"
  | "music"
  | "led"
  | "loops"
  | "logic"
  | "variables"
  | "math"
  | "sensors";

export interface MbCategoryMeta {
  id: MbCategory;
  label: string;
  /**
   * MakeCode's own block colour, verbatim. The exact hue is the point: the
   * student is comparing what is on screen with a printed screenshot, so these
   * are literal hexes applied inline, never design tokens that "look close".
   */
  hex: string;
  /** A pale wash of `hex` — palette flyout behind that category's blocks. */
  tint: string;
  /** The block face. Same as `hex`; named for what it is at the call site. */
  face: string;
  /** Alias of `face`, for call sites that read a background. */
  bg: string;
  /** A darker edge of the face — rails, notch shadows, borders. */
  accent: string;
  /** Pale wash, for flyout and drop-target backgrounds. */
  soft: string;
}

/** Mix `hex` towards white (255) or black (0) — used only for chrome, never a block face. */
function shade(hex: string, amount: number, towards: 0 | 255): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `#${[n >> 16, (n >> 8) & 255, n & 255]
    .map((c) => Math.round(c + (towards - c) * amount))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

const meta = (id: MbCategory, label: string, hex: string): MbCategoryMeta => ({
  id,
  label,
  hex,
  tint: shade(hex, 0.92, 255),
  face: hex,
  bg: hex,
  accent: shade(hex, 0.25, 0),
  soft: shade(hex, 0.9, 255),
});

export const MB_CATEGORIES: Record<MbCategory, MbCategoryMeta> = {
  basic: meta("basic", "Basic", "#1E90FF"),
  input: meta("input", "Input", "#B4009E"),
  music: meta("music", "Music", "#D83B01"),
  led: meta("led", "Led", "#5C2D91"),
  loops: meta("loops", "Loops", "#00A84F"),
  logic: meta("logic", "Logic", "#00A4A6"),
  variables: meta("variables", "Variables", "#DC143C"),
  math: meta("math", "Math", "#712672"),
  sensors: meta("sensors", "Sensors", "#00B294"),
};

/** The order the book's palette screenshot shows. */
export const MB_CATEGORY_ORDER: MbCategory[] = [
  "basic",
  "input",
  "music",
  "led",
  "loops",
  "logic",
  "variables",
  "math",
  "sensors",
];

/** Which colour a block already in the program wears. */
export const MB_STATEMENT_CATEGORY: Record<MbStatement["kind"], MbCategory> = {
  "show-number": "basic",
  "show-string": "basic",
  "show-icon": "basic",
  "clear-screen": "basic",
  pause: "basic",
  plot: "led",
  unplot: "led",
  repeat: "loops",
  for: "loops",
  while: "loops",
  if: "logic",
  "set-var": "variables",
  "change-var": "variables",
  "set-zip": "sensors",
  "play-tone": "music",
};

export const MB_EVENT_CATEGORY: Record<MbEvent["kind"], MbCategory> = {
  "on-start": "basic",
  forever: "basic",
  "on-button": "input",
};

// ── Shared choices the inline editors offer ─────────────────────────────────

export const MB_BUTTONS: MbButton[] = ["A", "B", "A+B"];
export const MB_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"] as const;
export const MB_ZIP_COLOURS = ["red", "green", "amber", "off"] as const;
export const MB_COMPARISONS: MbBinOp[] = ["<", "<=", "=", "!=", ">=", ">"];
export const MB_LOGIC_OPS: MbBinOp[] = ["and", "or"];
export const MB_MATH_OPS: MbBinOp[] = ["+", "-", "*", "/"];

export const MB_OP_LABEL: Record<MbBinOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "<": "<",
  ">": ">",
  "=": "=",
  "!=": "≠",
  "<=": "≤",
  ">=": "≥",
  and: "and",
  or: "or",
};

export const MB_ICON_ORDER: MbIcon[] = [
  "heart",
  "happy",
  "sad",
  "yes",
  "no",
  "arrow-up",
  "arrow-down",
  "square",
  "small-square",
  "diamond",
];

export const MB_ICON_LABEL: Record<MbIcon, string> = {
  heart: "Heart",
  happy: "Happy face",
  sad: "Sad face",
  yes: "Tick",
  no: "Cross",
  "arrow-up": "Arrow up",
  "arrow-down": "Arrow down",
  square: "Big square",
  "small-square": "Small square",
  diamond: "Diamond",
};

// ── Block ids ───────────────────────────────────────────────────────────────

let seq = 0;

/** Unique id for a freshly created block. Only ever called from an interaction. */
export function mbId(prefix = "mb"): string {
  return `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;
}

// ── Expression helpers (also used by the editor's inline fields) ────────────

export const mbNum = (value: number): MbExpr => ({ kind: "num", value });
export const mbVarExpr = (name: string): MbExpr => ({ kind: "var", name });

export const mbCompare = (left: MbExpr, op: MbBinOp, right: MbExpr): MbExpr => ({
  kind: "binop",
  op,
  left,
  right,
});

/** True for the C-shaped blocks that hold a body. */
export function mbIsContainer(
  kind: MbStatement["kind"],
): kind is "repeat" | "for" | "while" | "if" {
  return kind === "repeat" || kind === "for" || kind === "while" || kind === "if";
}

// ── Palette entries ─────────────────────────────────────────────────────────

/** What a palette entry produces, and therefore where it can be dropped. */
export type MbPaletteShape = "hat" | "statement" | "value" | "condition";

/** Names the student's existing variables so new blocks default sensibly. */
export interface MbBlockContext {
  variables: string[];
}

interface MbEntryBase {
  /** Stable key — the palette drag id and the React key. */
  kind: string;
  label: string;
  category: MbCategory;
  /** The category's MakeCode hex, so a palette block is painted like the real one. */
  colour: string;
  /** One line, student language, shown as the block's tooltip in the palette. */
  help: string;
}

export interface MbHatEntry extends MbEntryBase {
  shape: "hat";
  create: (ctx: MbBlockContext) => MbEvent;
}

export interface MbStatementEntry extends MbEntryBase {
  shape: "statement";
  /** C-shaped: draw the palette preview with a cavity, like repeat and if. */
  wraps?: boolean;
  create: (ctx: MbBlockContext) => MbStatement;
}

export interface MbValueEntry extends MbEntryBase {
  shape: "value";
  create: (ctx: MbBlockContext) => MbExpr;
}

export interface MbConditionEntry extends MbEntryBase {
  shape: "condition";
  /** `current` is the condition already in the slot, so and/or can wrap it. */
  create: (ctx: MbBlockContext, current?: MbExpr) => MbExpr;
}

export type MbPaletteEntry =
  | MbHatEntry
  | MbStatementEntry
  | MbValueEntry
  | MbConditionEntry;

const firstVar = (ctx: MbBlockContext) => ctx.variables[0] ?? "count";
const colourOf = (category: MbCategory) => MB_CATEGORIES[category].hex;

export const MB_PALETTE: MbPaletteEntry[] = [
  // ── Basic ────────────────────────────────────────────────────────────────
  {
    kind: "on-start",
    label: "on start",
    category: "basic",
    colour: colourOf("basic"),
    shape: "hat",
    help: "Runs once, the moment the micro:bit switches on.",
    create: () => ({ id: mbId("ev"), kind: "on-start", body: [] }),
  },
  {
    kind: "forever",
    label: "forever",
    category: "basic",
    colour: colourOf("basic"),
    shape: "hat",
    help: "Runs these blocks again and again, without stopping.",
    create: () => ({ id: mbId("ev"), kind: "forever", body: [] }),
  },
  {
    kind: "show-number",
    label: "show number",
    category: "basic",
    colour: colourOf("basic"),
    shape: "statement",
    help: "Writes a number on the 25 LEDs.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "show-number",
      value: ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : mbNum(0),
    }),
  },
  {
    kind: "show-string",
    label: "show string",
    category: "basic",
    colour: colourOf("basic"),
    shape: "statement",
    help: "Scrolls a word or short message across the screen.",
    create: () => ({ id: mbId("st"), kind: "show-string", value: "Hi!" }),
  },
  {
    kind: "show-icon",
    label: "show icon",
    category: "basic",
    colour: colourOf("basic"),
    shape: "statement",
    help: "Draws a ready-made picture, like a heart.",
    create: () => ({ id: mbId("st"), kind: "show-icon", icon: "heart" }),
  },
  {
    kind: "clear-screen",
    label: "clear screen",
    category: "basic",
    colour: colourOf("basic"),
    shape: "statement",
    help: "Switches every LED off.",
    create: () => ({ id: mbId("st"), kind: "clear-screen" }),
  },
  {
    kind: "pause",
    label: "pause (ms)",
    category: "basic",
    colour: colourOf("basic"),
    shape: "statement",
    help: "Waits a moment — 1000 ms is one second.",
    create: () => ({ id: mbId("st"), kind: "pause", ms: 500 }),
  },

  // ── Input ────────────────────────────────────────────────────────────────
  {
    kind: "on-button-a",
    label: "on button A pressed",
    category: "input",
    colour: colourOf("input"),
    shape: "hat",
    help: "Runs when someone presses the A push button.",
    create: () => ({ id: mbId("ev"), kind: "on-button", button: "A", body: [] }),
  },
  {
    kind: "on-button-b",
    label: "on button B pressed",
    category: "input",
    colour: colourOf("input"),
    shape: "hat",
    help: "Runs when someone presses the B push button.",
    create: () => ({ id: mbId("ev"), kind: "on-button", button: "B", body: [] }),
  },
  {
    kind: "on-button-ab",
    label: "on button A+B pressed",
    category: "input",
    colour: colourOf("input"),
    shape: "hat",
    help: "Runs when both buttons are pressed together — handy for reset.",
    create: () => ({ id: mbId("ev"), kind: "on-button", button: "A+B", body: [] }),
  },

  // ── LED ──────────────────────────────────────────────────────────────────
  {
    kind: "plot",
    label: "plot x y",
    category: "led",
    colour: colourOf("led"),
    shape: "statement",
    help: "Lights one LED — x is the column, y is the row, both from 0 to 4.",
    create: () => ({ id: mbId("st"), kind: "plot", x: mbNum(0), y: mbNum(0) }),
  },
  {
    kind: "unplot",
    label: "unplot x y",
    category: "led",
    colour: colourOf("led"),
    shape: "statement",
    help: "Switches off the LED at that column and row.",
    create: () => ({ id: mbId("st"), kind: "unplot", x: mbNum(0), y: mbNum(0) }),
  },

  // ── Loops ────────────────────────────────────────────────────────────────
  {
    kind: "repeat",
    label: "repeat N times",
    category: "loops",
    colour: colourOf("loops"),
    shape: "statement",
    wraps: true,
    help: "Runs the blocks inside it a fixed number of times.",
    create: () => ({ id: mbId("st"), kind: "repeat", times: mbNum(4), body: [] }),
  },
  {
    kind: "for",
    label: "for index from 0 to N",
    category: "loops",
    colour: colourOf("loops"),
    shape: "statement",
    wraps: true,
    help: "Counts with a variable — perfect for walking across the 25 LEDs.",
    create: () => ({
      id: mbId("st"),
      kind: "for",
      name: "index",
      from: mbNum(0),
      to: mbNum(4),
      body: [],
    }),
  },
  {
    kind: "while",
    label: "while",
    category: "loops",
    colour: colourOf("loops"),
    shape: "statement",
    wraps: true,
    help: "Keeps repeating for as long as the test is true.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "while",
      cond: mbCompare(
        ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : mbNum(0),
        "<",
        mbNum(10),
      ),
      body: [],
    }),
  },

  // ── Logic ────────────────────────────────────────────────────────────────
  {
    kind: "if",
    label: "if … then",
    category: "logic",
    colour: colourOf("logic"),
    shape: "statement",
    wraps: true,
    help: "Runs the blocks inside only when the test is true.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "if",
      cond: mbCompare(
        ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : { kind: "temperature" },
        ">",
        mbNum(0),
      ),
      then: [],
    }),
  },
  {
    kind: "if-else",
    label: "if … then … else",
    category: "logic",
    colour: colourOf("logic"),
    shape: "statement",
    wraps: true,
    help: "One path when the test is true, another path when it is false.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "if",
      cond: mbCompare(
        ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : { kind: "temperature" },
        ">",
        mbNum(0),
      ),
      then: [],
      otherwise: [],
    }),
  },
  {
    kind: "compare",
    label: "0 < 0",
    category: "logic",
    colour: colourOf("logic"),
    shape: "condition",
    help: "Compares two values — drop it in an if or while test.",
    create: (ctx) =>
      mbCompare(
        ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : { kind: "temperature" },
        ">",
        mbNum(0),
      ),
  },
  {
    kind: "and-or",
    label: "… and / or …",
    category: "logic",
    colour: colourOf("logic"),
    shape: "condition",
    help: "Joins two tests: both must be true (and), or just one (or).",
    create: (ctx, current) => ({
      kind: "binop",
      op: "and",
      left: current ?? mbCompare({ kind: "temperature" }, ">", mbNum(30)),
      right: mbCompare(
        ctx.variables.length > 0 ? mbVarExpr(ctx.variables[0]) : { kind: "humidity" },
        "<",
        mbNum(60),
      ),
    }),
  },

  // ── Variables ────────────────────────────────────────────────────────────
  {
    kind: "set-var",
    label: "set … to",
    category: "variables",
    colour: colourOf("variables"),
    shape: "statement",
    help: "Puts a value into a variable — the box that remembers a number.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "set-var",
      name: firstVar(ctx),
      value: mbNum(0),
    }),
  },
  {
    kind: "change-var",
    label: "change … by",
    category: "variables",
    colour: colourOf("variables"),
    shape: "statement",
    help: "Adds to what is already in the variable — counting up by 1.",
    create: (ctx) => ({
      id: mbId("st"),
      kind: "change-var",
      name: firstVar(ctx),
      by: mbNum(1),
    }),
  },

  // ── Math ─────────────────────────────────────────────────────────────────
  {
    kind: "math-op",
    label: "0 + 0",
    category: "math",
    colour: colourOf("math"),
    shape: "value",
    help: "Adds, takes away, multiplies or divides two numbers.",
    create: () => ({ kind: "binop", op: "+", left: mbNum(0), right: mbNum(0) }),
  },
  {
    kind: "random",
    label: "pick random 0 to 4",
    category: "math",
    colour: colourOf("math"),
    shape: "value",
    help: "A surprise number between the two you choose — dice, games, sparkles.",
    create: () => ({ kind: "random", min: mbNum(0), max: mbNum(4) }),
  },

  // ── Sensors ──────────────────────────────────────────────────────────────
  {
    kind: "temperature",
    label: "temperature (°C)",
    category: "sensors",
    colour: colourOf("sensors"),
    shape: "value",
    help: "How warm the air is right now, read by the station.",
    create: () => ({ kind: "temperature" }),
  },
  {
    kind: "humidity",
    label: "humidity (%)",
    category: "sensors",
    colour: colourOf("sensors"),
    shape: "value",
    help: "How much water vapour is in the air right now.",
    create: () => ({ kind: "humidity" }),
  },
  {
    kind: "light",
    label: "light level",
    category: "sensors",
    colour: colourOf("sensors"),
    shape: "value",
    help: "How bright it is, from 0 (dark) to 255 (very bright).",
    create: () => ({ kind: "light" }),
  },
  {
    kind: "set-zip",
    label: "set ZIP colour",
    category: "sensors",
    colour: colourOf("sensors"),
    shape: "statement",
    help: "Colours the station's ZIP LEDs — green is safe, red is a warning.",
    create: () => ({ id: mbId("st"), kind: "set-zip", colour: "green" }),
  },

  // ── Music ────────────────────────────────────────────────────────────────
  {
    kind: "play-tone",
    label: "play tone",
    category: "music",
    colour: colourOf("music"),
    shape: "statement",
    help: "Plays one musical note through the speaker.",
    create: () => ({ id: mbId("st"), kind: "play-tone", note: "C4", ms: 400 }),
  },
];

export const MB_PALETTE_BY_CATEGORY: Record<MbCategory, MbPaletteEntry[]> =
  MB_CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = MB_PALETTE.filter((entry) => entry.category === category);
      return acc;
    },
    {} as Record<MbCategory, MbPaletteEntry[]>,
  );

export function mbPaletteEntry(kind: string): MbPaletteEntry | undefined {
  return MB_PALETTE.find((entry) => entry.kind === kind);
}

/**
 * The colour a value wears when it sits in another block's slot. `null` means
 * a plain number: MakeCode draws those as a white field, not a coloured block.
 */
export function mbExprCategory(expr: MbExpr): MbCategory | null {
  switch (expr.kind) {
    case "num":
      return null;
    case "var":
      return "variables";
    case "temperature":
    case "humidity":
    case "light":
      return "sensors";
    case "random":
      return "math";
    case "binop":
      return MB_MATH_OPS.includes(expr.op) ? "math" : "logic";
  }
}

// ── Plain-language labels (aria, drag previews, teacher read-back) ──────────

export function mbExprText(expr: MbExpr): string {
  switch (expr.kind) {
    case "num":
      return String(expr.value);
    case "var":
      return expr.name;
    case "binop":
      return `${mbExprText(expr.left)} ${MB_OP_LABEL[expr.op]} ${mbExprText(expr.right)}`;
    case "temperature":
      return "temperature";
    case "humidity":
      return "humidity";
    case "light":
      return "light level";
    case "random":
      return `random ${mbExprText(expr.min)} to ${mbExprText(expr.max)}`;
  }
}

export function mbStatementText(stmt: MbStatement): string {
  switch (stmt.kind) {
    case "show-number":
      return `show number ${mbExprText(stmt.value)}`;
    case "show-string":
      return `show string ${stmt.value}`;
    case "show-icon":
      return `show icon ${MB_ICON_LABEL[stmt.icon]}`;
    case "clear-screen":
      return "clear screen";
    case "plot":
      return `plot x ${mbExprText(stmt.x)} y ${mbExprText(stmt.y)}`;
    case "unplot":
      return `unplot x ${mbExprText(stmt.x)} y ${mbExprText(stmt.y)}`;
    case "play-tone":
      return `play tone ${stmt.note} for ${stmt.ms} ms`;
    case "set-zip":
      return `set ZIP LEDs ${stmt.colour}`;
    case "pause":
      return `pause ${stmt.ms} ms`;
    case "set-var":
      return `set ${stmt.name} to ${mbExprText(stmt.value)}`;
    case "change-var":
      return `change ${stmt.name} by ${mbExprText(stmt.by)}`;
    case "repeat":
      return `repeat ${mbExprText(stmt.times)} times`;
    case "for":
      return `for ${stmt.name} from ${mbExprText(stmt.from)} to ${mbExprText(stmt.to)}`;
    case "while":
      return `while ${mbExprText(stmt.cond)}`;
    case "if":
      return `if ${mbExprText(stmt.cond)} then${stmt.otherwise ? " else" : ""}`;
  }
}

export function mbEventText(event: MbEvent): string {
  switch (event.kind) {
    case "on-start":
      return "on start";
    case "forever":
      return "forever";
    case "on-button":
      return `on button ${event.button} pressed`;
  }
}
