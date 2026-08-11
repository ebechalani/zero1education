/**
 * The Scratch 3.0 project model.
 *
 * Shaped like the editor the book photographs, so a block a student clicks here
 * is the block printed on the page — not a translation of it. A project is a
 * Stage that owns the backdrops and its own scripts, plus a list of sprites that
 * each own costumes, sounds, a pose and their own scripts. That split is the
 * whole of Chapter 5 Lesson 2: "click on the heading Stage… then click on Code".
 *
 * Everything in this file is data: pure types, the block shapes, the backdrop
 * and sprite libraries the trays offer, and small pure edits over a project.
 * Nothing here runs; the engine does that.
 */

// ── The palette, in Scratch's own colours ───────────────────────────────────

/**
 * Scratch's category hues, exactly as the editor paints them. A student is
 * comparing this screen with a printed screenshot, so these nine values are the
 * ones that must not drift.
 */
export const SC_CATEGORIES = {
  motion: { label: "Motion", hex: "#4C97FF" },
  looks: { label: "Looks", hex: "#9966FF" },
  sound: { label: "Sound", hex: "#CF63CF" },
  events: { label: "Events", hex: "#FFBF00" },
  control: { label: "Control", hex: "#FFAB19" },
  sensing: { label: "Sensing", hex: "#5CB1D6" },
  operators: { label: "Operators", hex: "#59C059" },
  variables: { label: "Variables", hex: "#FF8C1A" },
  pen: { label: "Pen", hex: "#0FBD8C" },
} as const;

export type ScCategory = keyof typeof SC_CATEGORIES;

/** Palette order, top to bottom, as in the editor. */
export const SC_CATEGORY_ORDER: ScCategory[] = [
  "motion",
  "looks",
  "sound",
  "events",
  "control",
  "sensing",
  "operators",
  "variables",
  "pen",
];

// ── The stage ───────────────────────────────────────────────────────────────

export const STAGE_WIDTH = 480;
export const STAGE_HEIGHT = 360;
/** Scratch's coordinates: x −240…240, y −180…180, y counting upwards. */
export const STAGE_X = 240;
export const STAGE_Y = 180;

/** Colours a `touching color` block can look for on a backdrop. */
export type ScColourName =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "brown"
  | "sand"
  | "grey"
  | "white";

export const SC_COLOUR_HEX: Record<ScColourName, string> = {
  red: "#e2261c",
  green: "#4fb84f",
  blue: "#7fd8f0",
  yellow: "#ffd84d",
  brown: "#8a5a2b",
  sand: "#e8c98a",
  grey: "#9aa4b2",
  white: "#ffffff",
};

export const SC_COLOUR_NAMES: ScColourName[] = [
  "red",
  "green",
  "blue",
  "yellow",
  "brown",
  "sand",
  "grey",
  "white",
];

/**
 * A backdrop is a stack of horizontal bands — flat colour or a two-stop
 * gradient — named after the scene the book asks for. Bands are the reason
 * `touching color (red)` can work at all: the band carries the colour name a
 * sensing block looks for.
 */
export interface ScBand {
  /** Fraction of the stage height. 0 is the top edge, 1 the bottom. */
  from: number;
  to: number;
  colour: string;
  /** When present the band is a top-to-bottom gradient from `colour` to this. */
  colour2?: string;
  /** What a `touching color` block sees inside this band. */
  tag?: ScColourName;
}

export interface ScBackdrop {
  id: string;
  name: string;
  bands: ScBand[];
}

// ── Sprites ─────────────────────────────────────────────────────────────────

/** The vector glyphs the stage can draw. No cat artwork is copied — these are
 *  simple shapes, and a costume is one of them in one colour. */
export type ScGlyph =
  | "cat"
  | "parrot"
  | "person"
  | "ball"
  | "bar"
  | "bottle"
  | "can"
  | "carton";

export interface ScCostume {
  id: string;
  name: string;
  glyph: ScGlyph;
  colour: string;
  /** Second colour — wings, lids, labels. */
  accent?: string;
}

export interface ScSound {
  name: string;
  /** How long the sound lasts, in seconds. */
  seconds: number;
}

export type ScRotationStyle = "all-around" | "left-right" | "none";

export interface ScSprite {
  id: string;
  name: string;
  costumes: ScCostume[];
  /** Costume the sprite wears when the project opens. */
  costume: number;
  x: number;
  y: number;
  direction: number;
  /** Percent, as in Scratch's Size field. */
  size: number;
  visible: boolean;
  rotationStyle: ScRotationStyle;
  /** Size of the glyph on the stage at size 100 — also its collision box. */
  width: number;
  height: number;
  sounds: ScSound[];
  scripts: ScHat[];
}

export interface ScStageTarget {
  scripts: ScHat[];
  sounds: ScSound[];
}

export interface ScProject {
  backdrops: ScBackdrop[];
  /** Index of the backdrop showing when the project opens. */
  backdrop: number;
  sprites: ScSprite[];
  stage: ScStageTarget;
}

// ── Values ──────────────────────────────────────────────────────────────────

export type ScMathOp = "+" | "-" | "*" | "/";
export type ScCompareOp = "<" | "=" | ">";

export type ScExpr =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string }
  | { kind: "mouse-x" }
  | { kind: "mouse-y" }
  | { kind: "x-position" }
  | { kind: "y-position" }
  | { kind: "random"; min: ScExpr; max: ScExpr }
  | { kind: "binop"; op: ScMathOp; left: ScExpr; right: ScExpr };

export const SC_KEYS = [
  "space",
  "up arrow",
  "down arrow",
  "right arrow",
  "left arrow",
  "a",
  "s",
  "d",
  "w",
] as const;

export type ScKey = (typeof SC_KEYS)[number];

/** The hexagon blocks: everything that answers true or false. */
export type ScCond =
  | { kind: "touching-sprite"; sprite: string }
  | { kind: "touching-colour"; colour: ScColourName }
  | { kind: "touching-edge" }
  | { kind: "key-pressed"; key: ScKey }
  | { kind: "mouse-down" }
  | { kind: "compare"; op: ScCompareOp; left: ScExpr; right: ScExpr };

// ── Blocks ──────────────────────────────────────────────────────────────────

export type ScStatement =
  // Motion
  | { id: string; kind: "move"; steps: ScExpr }
  | { id: string; kind: "turn"; way: "cw" | "ccw"; degrees: ScExpr }
  | { id: string; kind: "goto-xy"; x: ScExpr; y: ScExpr }
  | { id: string; kind: "glide-xy"; secs: number; x: ScExpr; y: ScExpr }
  | { id: string; kind: "point-in-direction"; degrees: ScExpr }
  | { id: string; kind: "if-on-edge-bounce" }
  // Looks
  | { id: string; kind: "say"; text: string; secs?: number }
  | { id: string; kind: "think"; text: string; secs?: number }
  | { id: string; kind: "switch-backdrop"; backdrop: string }
  | { id: string; kind: "next-backdrop" }
  | { id: string; kind: "switch-costume"; costume: string }
  | { id: string; kind: "next-costume" }
  | { id: string; kind: "show" }
  | { id: string; kind: "hide" }
  // Sound
  | { id: string; kind: "play-sound"; sound: string; untilDone: boolean }
  // Control
  | { id: string; kind: "wait"; secs: number }
  | { id: string; kind: "repeat"; times: ScExpr; body: ScStatement[] }
  | { id: string; kind: "forever"; body: ScStatement[] }
  | {
      id: string;
      kind: "if";
      cond: ScCond;
      then: ScStatement[];
      otherwise?: ScStatement[];
    }
  | { id: string; kind: "stop-all" }
  // Variables
  | { id: string; kind: "set-var"; name: string; value: ScExpr }
  | { id: string; kind: "change-var"; name: string; by: ScExpr }
  // Pen
  | { id: string; kind: "pen-down" }
  | { id: string; kind: "pen-up" }
  | { id: string; kind: "erase-all" }
  | { id: string; kind: "set-pen-colour"; colour: number }
  | { id: string; kind: "change-pen-colour"; by: ScExpr };

export type ScStatementKind = ScStatement["kind"];

/** The hat blocks a script hangs from. */
export type ScHat =
  | { id: string; kind: "when-flag"; body: ScStatement[] }
  | { id: string; kind: "when-key"; key: ScKey; body: ScStatement[] }
  | { id: string; kind: "when-clicked"; body: ScStatement[] };

export type ScHatKind = ScHat["kind"];

/** Which palette drawer each block came out of. */
export const SC_BLOCK_CATEGORY: Record<ScStatementKind | ScHatKind, ScCategory> = {
  move: "motion",
  turn: "motion",
  "goto-xy": "motion",
  "glide-xy": "motion",
  "point-in-direction": "motion",
  "if-on-edge-bounce": "motion",
  say: "looks",
  think: "looks",
  "switch-backdrop": "looks",
  "next-backdrop": "looks",
  "switch-costume": "looks",
  "next-costume": "looks",
  show: "looks",
  hide: "looks",
  "play-sound": "sound",
  wait: "control",
  repeat: "control",
  forever: "control",
  if: "control",
  "stop-all": "control",
  "set-var": "variables",
  "change-var": "variables",
  "pen-down": "pen",
  "pen-up": "pen",
  "erase-all": "pen",
  "set-pen-colour": "pen",
  "change-pen-colour": "pen",
  "when-flag": "events",
  "when-key": "events",
  "when-clicked": "events",
};

/** Blocks that only make sense on a sprite — the Stage has no Motion drawer. */
export const SC_SPRITE_ONLY: ScStatementKind[] = [
  "move",
  "turn",
  "goto-xy",
  "glide-xy",
  "point-in-direction",
  "if-on-edge-bounce",
  "say",
  "think",
  "switch-costume",
  "next-costume",
  "show",
  "hide",
  "pen-down",
  "pen-up",
  "set-pen-colour",
  "change-pen-colour",
];

/** C-shaped blocks — the ones with a mouth that holds other blocks. */
export const scIsContainer = (
  stmt: ScStatement,
): stmt is Extract<ScStatement, { kind: "repeat" | "forever" | "if" }> =>
  stmt.kind === "repeat" || stmt.kind === "forever" || stmt.kind === "if";

// ── Pen colour ──────────────────────────────────────────────────────────────

/** Scratch's pen colour runs 0–99 around the colour wheel: 0 red, 33 green, 66 blue. */
export const penColourCss = (colour: number): string => {
  const hue = (((colour % 100) + 100) % 100) * 3.6;
  return `hsl(${hue.toFixed(1)} 85% 45%)`;
};

export const SC_PEN_SWATCHES: { name: string; colour: number }[] = [
  { name: "red", colour: 0 },
  { name: "orange", colour: 8 },
  { name: "yellow", colour: 16 },
  { name: "green", colour: 33 },
  { name: "turquoise", colour: 48 },
  { name: "blue", colour: 66 },
  { name: "purple", colour: 78 },
  { name: "pink", colour: 90 },
];

// ── Live state ──────────────────────────────────────────────────────────────

export interface ScPenLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Scratch pen colour 0–99. */
  colour: number;
  width: number;
}

export interface ScBubble {
  text: string;
  kind: "say" | "think";
}

export interface ScSpriteState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costume: number;
  bubble: ScBubble | null;
  penDown: boolean;
  penColour: number;
  penSize: number;
  /** Collision box at size 100 — copied from the sprite so the engine is self-contained. */
  width: number;
  height: number;
  rotationStyle: ScRotationStyle;
}

export interface ScStageState {
  backdrop: number;
  sprites: ScSpriteState[];
  pen: ScPenLine[];
  variables: Record<string, number>;
  /** What is being played right now, so the stage can show a speaker. */
  sound: { sprite: string; name: string } | null;
  mouse: { x: number; y: number; down: boolean };
  running: boolean;
}

export const initialSpriteState = (sprite: ScSprite): ScSpriteState => ({
  id: sprite.id,
  name: sprite.name,
  x: sprite.x,
  y: sprite.y,
  direction: sprite.direction,
  size: sprite.size,
  visible: sprite.visible,
  costume: sprite.costume,
  bubble: null,
  penDown: false,
  penColour: 66,
  penSize: 3,
  width: sprite.width,
  height: sprite.height,
  rotationStyle: sprite.rotationStyle,
});

export const initialStageState = (project: ScProject): ScStageState => ({
  backdrop: Math.min(project.backdrop, Math.max(0, project.backdrops.length - 1)),
  sprites: project.sprites.map(initialSpriteState),
  pen: [],
  variables: {},
  sound: null,
  mouse: { x: 0, y: 0, down: false },
  running: false,
});

// ── Geometry helpers ────────────────────────────────────────────────────────

export interface ScBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** The sprite's box on the stage, in Scratch coordinates. */
export function spriteBox(sprite: ScSpriteState): ScBox {
  const scale = sprite.size / 100;
  const halfW = (sprite.width * scale) / 2;
  const halfH = (sprite.height * scale) / 2;
  return {
    left: sprite.x - halfW,
    right: sprite.x + halfW,
    top: sprite.y + halfH,
    bottom: sprite.y - halfH,
  };
}

export const boxesOverlap = (a: ScBox, b: ScBox): boolean =>
  a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;

/** Movement vector for a Scratch direction: 90 is right, 0 is up. */
export const directionVector = (direction: number): { dx: number; dy: number } => {
  const rad = (direction * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: Math.cos(rad) };
};

/** Fold any angle into Scratch's −179…180 range. */
export const wrapDirection = (direction: number): number => {
  let d = ((direction + 180) % 360 + 360) % 360;
  d -= 180;
  return d === -180 ? 180 : d;
};

/** Stage y of a band edge, so bands and sprites can be compared directly. */
export const bandBox = (band: ScBand): { top: number; bottom: number } => ({
  top: STAGE_Y - band.from * STAGE_HEIGHT,
  bottom: STAGE_Y - band.to * STAGE_HEIGHT,
});

/** Every colour a sprite's box is sitting on right now. */
export function coloursUnder(backdrop: ScBackdrop | undefined, box: ScBox): ScColourName[] {
  if (!backdrop) return [];
  const found: ScColourName[] = [];
  for (const band of backdrop.bands) {
    if (!band.tag) continue;
    const { top, bottom } = bandBox(band);
    if (box.bottom < top && box.top > bottom && !found.includes(band.tag)) {
      found.push(band.tag);
    }
  }
  return found;
}

// ── The backdrop library ("Choose a Backdrop") ──────────────────────────────

const backdrop = (id: string, name: string, bands: ScBand[]): ScBackdrop => ({
  id,
  name,
  bands,
});

/**
 * The scenes the chapter names: the blank one Scratch opens with, the Bedroom
 * and the Desert of the story, the game's Blue Sky with its red line, and one
 * per renewable energy source for the documentary.
 */
export const SC_BACKDROP_LIBRARY: ScBackdrop[] = [
  backdrop("blank", "backdrop1", [{ from: 0, to: 1, colour: "#ffffff", tag: "white" }]),
  backdrop("bedroom", "Bedroom 3", [
    { from: 0, to: 0.62, colour: "#dfe9dd", colour2: "#c7dbcb" },
    { from: 0.62, to: 1, colour: "#a9c07f", colour2: "#8fa966", tag: "green" },
  ]),
  backdrop("desert", "Desert", [
    { from: 0, to: 0.52, colour: "#8fd8ef", colour2: "#d9f0f7", tag: "blue" },
    { from: 0.52, to: 1, colour: "#eccf93", colour2: "#d9b371", tag: "sand" },
  ]),
  backdrop("blue-sky", "Blue Sky", [
    { from: 0, to: 0.58, colour: "#8fdcf2", colour2: "#c8eefa", tag: "blue" },
    { from: 0.58, to: 0.86, colour: "#5cc25c", colour2: "#3f9c3f", tag: "green" },
    { from: 0.86, to: 0.9, colour: "#e2261c", tag: "red" },
    { from: 0.9, to: 1, colour: "#8a5a2b", tag: "brown" },
  ]),
  backdrop("solar", "Solar", [
    { from: 0, to: 0.46, colour: "#7fc9ee", colour2: "#cfeaf7", tag: "blue" },
    { from: 0.46, to: 0.66, colour: "#f6d98a", colour2: "#e7c471", tag: "sand" },
    { from: 0.66, to: 1, colour: "#2b3d63", colour2: "#1d2b47", tag: "grey" },
  ]),
  backdrop("wind", "Wind", [
    { from: 0, to: 0.6, colour: "#9fdcf5", colour2: "#e2f4fb", tag: "blue" },
    { from: 0.6, to: 1, colour: "#8fc45a", colour2: "#5f9a37", tag: "green" },
  ]),
  backdrop("water", "Water", [
    { from: 0, to: 0.34, colour: "#a9dff0", colour2: "#dcf2f8", tag: "blue" },
    { from: 0.34, to: 0.52, colour: "#6f9f5f", colour2: "#4d7a44", tag: "green" },
    { from: 0.52, to: 1, colour: "#3f8fd0", colour2: "#1f5f9c", tag: "blue" },
  ]),
  backdrop("geothermal", "Geothermal", [
    { from: 0, to: 0.45, colour: "#b9c6d4", colour2: "#e4ecf2", tag: "grey" },
    { from: 0.45, to: 0.72, colour: "#7f6a5c", colour2: "#5b4a40", tag: "brown" },
    { from: 0.72, to: 1, colour: "#e07b3c", colour2: "#c0522a", tag: "red" },
  ]),
  backdrop("recycle-bay", "Recycle Bay", [
    { from: 0, to: 0.72, colour: "#eef4f8", colour2: "#dbe7f0", tag: "white" },
    { from: 0.72, to: 1, colour: "#b9c6d4", colour2: "#98a8ba", tag: "grey" },
  ]),
];

export const backdropTemplate = (id: string): ScBackdrop | undefined =>
  SC_BACKDROP_LIBRARY.find((b) => b.id === id);

// ── The sprite library ("Choose a Sprite") ──────────────────────────────────

const costume = (
  id: string,
  name: string,
  glyph: ScGlyph,
  colour: string,
  accent?: string,
): ScCostume => ({ id, name, glyph, colour, accent });

/**
 * Every sprite the chapter needs: the story's Cat and Parrot, the documentary's
 * Avery, the game's Ball and horizontal bar, and three recycled items that come
 * with the three costumes Lesson 4 asks for.
 */
export const SC_SPRITE_LIBRARY: ScSprite[] = [
  {
    id: "cat",
    name: "Cat",
    costumes: [
      costume("cat-1", "costume1", "cat", "#f5a623", "#e08c0b"),
      costume("cat-2", "costume2", "cat", "#f2b64d", "#e08c0b"),
    ],
    costume: 0,
    x: 0,
    y: -40,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "left-right",
    width: 62,
    height: 54,
    sounds: [{ name: "Meow", seconds: 0.9 }],
    scripts: [],
  },
  {
    id: "parrot",
    name: "Parrot",
    costumes: [
      costume("parrot-1", "parrot-a", "parrot", "#e2483d", "#2f7fd6"),
      costume("parrot-2", "parrot-b", "parrot", "#e2483d", "#28a45f"),
    ],
    costume: 0,
    x: 110,
    y: 90,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "left-right",
    width: 58,
    height: 40,
    sounds: [{ name: "Bird", seconds: 1.2 }],
    scripts: [],
  },
  {
    id: "avery",
    name: "Avery",
    costumes: [
      costume("avery-1", "avery-a", "person", "#6d4a9c", "#f0c9a8"),
      costume("avery-2", "avery-b", "person", "#8a5fbd", "#f0c9a8"),
    ],
    costume: 0,
    x: -120,
    y: -60,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "left-right",
    width: 42,
    height: 66,
    sounds: [
      { name: "pop", seconds: 0.4 },
      { name: "recording1", seconds: 8 },
    ],
    scripts: [],
  },
  {
    id: "ball",
    name: "Ball",
    costumes: [
      costume("ball-1", "ball-a", "ball", "#f5c518"),
      costume("ball-2", "ball-b", "ball", "#4c97ff"),
      costume("ball-3", "ball-c", "ball", "#e2483d"),
      costume("ball-4", "ball-d", "ball", "#59c059"),
      costume("ball-5", "ball-e", "ball", "#cf63cf"),
    ],
    costume: 0,
    x: 19,
    y: 33,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "none",
    width: 36,
    height: 36,
    sounds: [{ name: "Boing", seconds: 0.5 }],
    scripts: [],
  },
  {
    id: "bar",
    name: "Bar",
    costumes: [costume("bar-1", "costume1", "bar", "#0b1120")],
    costume: 0,
    x: 0,
    y: 0,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "none",
    width: 96,
    height: 8,
    sounds: [],
    scripts: [],
  },
  {
    id: "glass",
    name: "Glass",
    costumes: [
      costume("glass-1", "costume1", "bottle", "#5cc9e0"),
      costume("glass-2", "costume2", "bottle", "#4fb0a0"),
      costume("glass-3", "costume3", "bottle", "#7fd0b0"),
    ],
    costume: 0,
    x: -110,
    y: -20,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "none",
    width: 36,
    height: 58,
    sounds: [],
    scripts: [],
  },
  {
    id: "cans",
    name: "Cans",
    costumes: [
      costume("cans-1", "costume1", "can", "#b9c6d4", "#e2483d"),
      costume("cans-2", "costume2", "can", "#cdd8e3", "#4c97ff"),
      costume("cans-3", "costume3", "can", "#a8b6c6", "#59c059"),
    ],
    costume: 0,
    x: 0,
    y: -20,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "none",
    width: 32,
    height: 48,
    sounds: [],
    scripts: [],
  },
  {
    id: "carton",
    name: "Carton",
    costumes: [
      costume("carton-1", "costume1", "carton", "#e8c98a", "#b98a4a"),
      costume("carton-2", "costume2", "carton", "#dbb877", "#a2743a"),
      costume("carton-3", "costume3", "carton", "#f0d9a8", "#c79a58"),
    ],
    costume: 0,
    x: 110,
    y: -20,
    direction: 90,
    size: 100,
    visible: true,
    rotationStyle: "none",
    width: 36,
    height: 50,
    sounds: [],
    scripts: [],
  },
];

export const spriteTemplate = (id: string): ScSprite | undefined =>
  SC_SPRITE_LIBRARY.find((s) => s.id === id);

// ── Building projects ───────────────────────────────────────────────────────

const cloneCostumes = (costumes: ScCostume[]): ScCostume[] =>
  costumes.map((c) => ({ ...c }));

/** A fresh copy of a library sprite, optionally re-posed for an exercise. */
export function makeSprite(
  templateId: string,
  overrides: Partial<ScSprite> = {},
): ScSprite {
  const template = spriteTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown sprite template: ${templateId}`);
  }
  return {
    ...template,
    costumes: cloneCostumes(template.costumes),
    sounds: template.sounds.map((s) => ({ ...s })),
    scripts: [],
    ...overrides,
  };
}

export function makeBackdrop(templateId: string): ScBackdrop {
  const template = backdropTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown backdrop template: ${templateId}`);
  }
  return { ...template, bands: template.bands.map((b) => ({ ...b })) };
}

/** What Scratch shows on launch: one white backdrop and the Cat. */
export const emptyProject = (): ScProject => ({
  backdrops: [makeBackdrop("blank")],
  backdrop: 0,
  sprites: [makeSprite("cat")],
  stage: { scripts: [], sounds: [{ name: "pop", seconds: 0.4 }] },
});

/** A project with the given library backdrops and sprites, in that order. */
export function buildProject(spec: {
  backdrops: string[];
  sprites: { template: string; overrides?: Partial<ScSprite> }[];
  stageScripts?: ScHat[];
}): ScProject {
  return {
    backdrops: spec.backdrops.map(makeBackdrop),
    backdrop: 0,
    sprites: spec.sprites.map((s) => makeSprite(s.template, s.overrides)),
    stage: {
      scripts: spec.stageScripts ?? [],
      sounds: [{ name: "pop", seconds: 0.4 }],
    },
  };
}

// ── Pure edits, for the trays ───────────────────────────────────────────────

const uniqueId = (wanted: string, taken: string[]): string => {
  if (!taken.includes(wanted)) return wanted;
  for (let n = 2; ; n += 1) {
    const candidate = `${wanted}${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
};

const uniqueName = (wanted: string, taken: string[]): string => {
  if (!taken.includes(wanted)) return wanted;
  for (let n = 2; ; n += 1) {
    const candidate = `${wanted} ${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
};

export function addBackdrop(project: ScProject, templateId: string): ScProject {
  const fresh = makeBackdrop(templateId);
  fresh.id = uniqueId(
    fresh.id,
    project.backdrops.map((b) => b.id),
  );
  fresh.name = uniqueName(
    fresh.name,
    project.backdrops.map((b) => b.name),
  );
  return { ...project, backdrops: [...project.backdrops, fresh] };
}

export function removeBackdrop(project: ScProject, id: string): ScProject {
  if (project.backdrops.length <= 1) return project;
  const backdrops = project.backdrops.filter((b) => b.id !== id);
  return {
    ...project,
    backdrops,
    backdrop: Math.min(project.backdrop, backdrops.length - 1),
  };
}

export function addSprite(project: ScProject, templateId: string): ScProject {
  const fresh = makeSprite(templateId);
  fresh.id = uniqueId(
    fresh.id,
    project.sprites.map((s) => s.id),
  );
  fresh.name = uniqueName(
    fresh.name,
    project.sprites.map((s) => s.name),
  );
  return { ...project, sprites: [...project.sprites, fresh] };
}

export function removeSprite(project: ScProject, id: string): ScProject {
  return { ...project, sprites: project.sprites.filter((s) => s.id !== id) };
}

export function setSpriteScripts(
  project: ScProject,
  spriteId: string,
  scripts: ScHat[],
): ScProject {
  return {
    ...project,
    sprites: project.sprites.map((s) => (s.id === spriteId ? { ...s, scripts } : s)),
  };
}

export function setStageScripts(project: ScProject, scripts: ScHat[]): ScProject {
  return { ...project, stage: { ...project.stage, scripts } };
}

/** Every variable name the project mentions, in the order the blocks meet them. */
export function projectVariables(project: ScProject): string[] {
  const names: string[] = [];
  const add = (name: string) => {
    if (name && !names.includes(name)) names.push(name);
  };
  const fromExpr = (expr: ScExpr) => {
    if (expr.kind === "var") add(expr.name);
    else if (expr.kind === "binop") {
      fromExpr(expr.left);
      fromExpr(expr.right);
    } else if (expr.kind === "random") {
      fromExpr(expr.min);
      fromExpr(expr.max);
    }
  };
  const fromCond = (cond: ScCond) => {
    if (cond.kind === "compare") {
      fromExpr(cond.left);
      fromExpr(cond.right);
    }
  };
  const walk = (body: ScStatement[]) => {
    for (const stmt of body) {
      switch (stmt.kind) {
        case "set-var":
          add(stmt.name);
          fromExpr(stmt.value);
          break;
        case "change-var":
          add(stmt.name);
          fromExpr(stmt.by);
          break;
        case "repeat":
          fromExpr(stmt.times);
          walk(stmt.body);
          break;
        case "forever":
          walk(stmt.body);
          break;
        case "if":
          fromCond(stmt.cond);
          walk(stmt.then);
          if (stmt.otherwise) walk(stmt.otherwise);
          break;
        case "move":
          fromExpr(stmt.steps);
          break;
        case "turn":
          fromExpr(stmt.degrees);
          break;
        case "goto-xy":
          fromExpr(stmt.x);
          fromExpr(stmt.y);
          break;
        case "glide-xy":
          fromExpr(stmt.x);
          fromExpr(stmt.y);
          break;
        case "point-in-direction":
          fromExpr(stmt.degrees);
          break;
        case "change-pen-colour":
          fromExpr(stmt.by);
          break;
        default:
          break;
      }
    }
  };
  project.stage.scripts.forEach((hat) => walk(hat.body));
  project.sprites.forEach((sprite) => sprite.scripts.forEach((hat) => walk(hat.body)));
  return names;
}

/** How many blocks a project holds — the Run button waits for at least one. */
export function countBlocks(project: ScProject): number {
  const walk = (body: ScStatement[]): number =>
    body.reduce((total, stmt) => {
      if (stmt.kind === "repeat" || stmt.kind === "forever") {
        return total + 1 + walk(stmt.body);
      }
      if (stmt.kind === "if") {
        return total + 1 + walk(stmt.then) + walk(stmt.otherwise ?? []);
      }
      return total + 1;
    }, 0);
  const hats = [
    ...project.stage.scripts,
    ...project.sprites.flatMap((s) => s.scripts),
  ];
  return hats.reduce((total, hat) => total + 1 + walk(hat.body), 0);
}

// ── Fresh block ids ─────────────────────────────────────────────────────────

let seq = 0;

/** Ids only ever come from event handlers, so a plain counter stays SSR-safe. */
export const scId = (prefix = "b"): string => {
  seq += 1;
  return `${prefix}${seq}`;
};

/** Deep copy of a block, with brand-new ids — used when the palette is clicked. */
export function cloneStatement(stmt: ScStatement): ScStatement {
  const id = scId();
  if (stmt.kind === "repeat" || stmt.kind === "forever") {
    return { ...stmt, id, body: stmt.body.map(cloneStatement) };
  }
  if (stmt.kind === "if") {
    return {
      ...stmt,
      id,
      then: stmt.then.map(cloneStatement),
      ...(stmt.otherwise ? { otherwise: stmt.otherwise.map(cloneStatement) } : {}),
    };
  }
  return { ...stmt, id };
}

export function cloneHat(hat: ScHat): ScHat {
  return { ...hat, id: scId("h"), body: hat.body.map(cloneStatement) };
}
