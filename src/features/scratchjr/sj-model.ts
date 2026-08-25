/**
 * The ScratchJr project model.
 *
 * ScratchJr is not small Scratch. It is a different editor for children who
 * cannot read: every block is a picture, a script is a horizontal row rather
 * than a vertical stack, and the only text anywhere is what a child types into
 * a Say block. Grade 1 Chapter 5 and Grade 2 Chapter 4 are both taught in it,
 * and the printed pages are screenshots of it, so what a child clicks here has
 * to be the block printed on the page.
 *
 * Everything in this file is data: the block shapes, the sprite and background
 * libraries the choosers offer, and pure edits over a project. Nothing runs —
 * the engine does that.
 */

// ── The palette ─────────────────────────────────────────────────────────────

/**
 * ScratchJr's six drawers, in its own colours and its own order. A child is
 * comparing this screen against a printed screenshot, so these hues are the
 * ones that must not drift.
 */
export const SJ_CATEGORIES = {
  triggers: { label: "Triggers", hex: "#FFD400", ink: "#5c4a00" },
  motion: { label: "Motion", hex: "#54B9F0", ink: "#0d3b52" },
  looks: { label: "Looks", hex: "#A972D6", ink: "#3d1f56" },
  sound: { label: "Sound", hex: "#7FD13B", ink: "#2b4a12" },
  control: { label: "Control", hex: "#FFA033", ink: "#5c3300" },
  end: { label: "End", hex: "#E4564A", ink: "#5c1611" },
} as const;

export type SjCategory = keyof typeof SJ_CATEGORIES;

/** Drawer order, left to right, as in the app. */
export const SJ_CATEGORY_ORDER: SjCategory[] = [
  "triggers",
  "motion",
  "looks",
  "sound",
  "control",
  "end",
];

// ── The stage ───────────────────────────────────────────────────────────────

/**
 * ScratchJr's stage is twenty squares across and fifteen down, and the grid
 * can be switched on. Both books ask a child to read a sprite's position off
 * that grid and write it as a pair, so the grid is not decoration — it is the
 * coordinate system the lessons are about.
 */
export const SJ_COLS = 20;
export const SJ_ROWS = 15;

/** A square on the grid. Columns count 1…20 left to right, rows 1…15 down. */
export interface SjPosition {
  x: number;
  y: number;
}

export const sjInside = (p: SjPosition): boolean =>
  p.x >= 1 && p.x <= SJ_COLS && p.y >= 1 && p.y <= SJ_ROWS;

/** Keep a sprite on the stage, the way ScratchJr does — it stops at the edge. */
export const sjClamp = (p: SjPosition): SjPosition => ({
  x: Math.min(SJ_COLS, Math.max(1, p.x)),
  y: Math.min(SJ_ROWS, Math.max(1, p.y)),
});

// ── Blocks ──────────────────────────────────────────────────────────────────

/** How fast the sprite carries out each block. ScratchJr offers three. */
export type SjSpeed = "slow" | "normal" | "fast";

/**
 * The blocks a script is built from.
 *
 * `n` is the number printed in the white box on the block's corner. Motion
 * blocks count squares; turns count twelfths of a full turn, as ScratchJr's
 * clock-face dial does; Wait counts tenths of a second.
 */
export type SjBlock =
  // Motion — the eight blue Action blocks Grade 1 Lesson 1 names
  | { id: string; kind: "move-right"; n: number }
  | { id: string; kind: "move-left"; n: number }
  | { id: string; kind: "move-up"; n: number }
  | { id: string; kind: "move-down"; n: number }
  | { id: string; kind: "turn-right"; n: number }
  | { id: string; kind: "turn-left"; n: number }
  | { id: string; kind: "hop"; n: number }
  | { id: string; kind: "go-home" }
  // Looks
  | { id: string; kind: "say"; text: string }
  | { id: string; kind: "grow"; n: number }
  | { id: string; kind: "shrink"; n: number }
  | { id: string; kind: "reset-size" }
  | { id: string; kind: "hide" }
  | { id: string; kind: "show" }
  // Sound
  | { id: string; kind: "pop" }
  | { id: string; kind: "play-sound"; sound: string }
  // Control
  | { id: string; kind: "wait"; n: number }
  | { id: string; kind: "stop" }
  | { id: string; kind: "set-speed"; speed: SjSpeed }
  | { id: string; kind: "repeat"; n: number; body: SjBlock[] }
  // End
  | { id: string; kind: "end" }
  | { id: string; kind: "repeat-forever"; body: SjBlock[] };

export type SjBlockKind = SjBlock["kind"];

/** The yellow blocks a script hangs from. */
export type SjTrigger =
  | { id: string; kind: "on-flag" }
  | { id: string; kind: "on-tap" }
  | { id: string; kind: "on-bump" };

export type SjTriggerKind = SjTrigger["kind"];

/** One script: a trigger, then a row of blocks running left to right. */
export interface SjScript {
  id: string;
  trigger: SjTrigger;
  blocks: SjBlock[];
}

/** Which drawer each block came out of. */
export const SJ_BLOCK_CATEGORY: Record<SjBlockKind | SjTriggerKind, SjCategory> = {
  "on-flag": "triggers",
  "on-tap": "triggers",
  "on-bump": "triggers",
  "move-right": "motion",
  "move-left": "motion",
  "move-up": "motion",
  "move-down": "motion",
  "turn-right": "motion",
  "turn-left": "motion",
  hop: "motion",
  "go-home": "motion",
  say: "looks",
  grow: "looks",
  shrink: "looks",
  "reset-size": "looks",
  hide: "looks",
  show: "looks",
  pop: "sound",
  "play-sound": "sound",
  wait: "control",
  stop: "control",
  "set-speed": "control",
  repeat: "control",
  end: "end",
  "repeat-forever": "end",
};

/** Blocks that hold other blocks — ScratchJr has two, and both are C-shaped. */
export const sjIsContainer = (
  block: SjBlock,
): block is Extract<SjBlock, { kind: "repeat" | "repeat-forever" }> =>
  block.kind === "repeat" || block.kind === "repeat-forever";

/** Blocks carrying a number in the white box, and what that number may be. */
export const SJ_NUMBER_RANGE: Partial<Record<SjBlockKind, { min: number; max: number }>> = {
  "move-right": { min: 1, max: 20 },
  "move-left": { min: 1, max: 20 },
  "move-up": { min: 1, max: 15 },
  "move-down": { min: 1, max: 15 },
  "turn-right": { min: 1, max: 12 },
  "turn-left": { min: 1, max: 12 },
  hop: { min: 1, max: 15 },
  grow: { min: 1, max: 20 },
  shrink: { min: 1, max: 20 },
  wait: { min: 1, max: 40 },
  repeat: { min: 1, max: 20 },
};

export const sjNumberOf = (block: SjBlock): number | undefined =>
  "n" in block ? block.n : undefined;

// ── Sprites and backgrounds ─────────────────────────────────────────────────

/**
 * The characters the two chapters actually use. Drawn as flat SVG rather than
 * copied from ScratchJr's own artwork: these are the book's cast, and they
 * have to print and project cleanly.
 */
export type SjGlyph =
  | "cat"
  | "duck"
  | "fish"
  | "frog"
  | "butterfly"
  | "boy"
  | "girl"
  | "ball"
  | "bird"
  | "dog"
  | "star"
  | "tree";

export interface SjSprite {
  id: string;
  /** ScratchJr names its first sprite TIC; the books use TIC, TAC and TOC. */
  name: string;
  glyph: SjGlyph;
  /** Repaints the main mass. Left off, the glyph keeps its natural colours. */
  colour?: string;
  accent?: string;
  /** Where it stands when the project opens */
  home: SjPosition;
  /** Percent, as ScratchJr's Grow and Shrink change it */
  size: number;
  /** Which way it looks. ScratchJr flips the picture rather than rotating it. */
  flipped: boolean;
  scripts: SjScript[];
}

/**
 * A background is a stack of horizontal bands, named after the scene the book
 * asks for. Bands rather than bitmaps so a scene prints, scales and themes
 * cleanly, and so `bump` against scenery stays describable.
 */
export interface SjBand {
  /** Fraction of stage height. 0 is the top edge, 1 the bottom. */
  from: number;
  to: number;
  colour: string;
  colour2?: string;
}

export interface SjBackground {
  id: string;
  name: string;
  bands: SjBand[];
  /** Simple scenery drawn over the bands, e.g. a sun or a net. */
  props?: { glyph: SjGlyph; at: SjPosition; size?: number; colour?: string }[];
}

export interface SjProject {
  background: SjBackground;
  sprites: SjSprite[];
}

// ── Live state ──────────────────────────────────────────────────────────────

export interface SjSpriteState {
  id: string;
  name: string;
  /** Copied from the sprite so the stage can draw a frame on its own */
  glyph: SjGlyph;
  colour?: string;
  accent?: string;
  x: number;
  y: number;
  size: number;
  flipped: boolean;
  visible: boolean;
  /** What the sprite is saying right now, if anything */
  bubble: string | null;
  /** Twelfths of a full turn, 0…11, as ScratchJr's dial counts */
  turn: number;
  speed: SjSpeed;
}

export interface SjStageState {
  sprites: SjSpriteState[];
  /** What is sounding right now, so the stage can show it */
  sound: { sprite: string; name: string } | null;
  running: boolean;
}

export const sjInitialSprite = (sprite: SjSprite): SjSpriteState => ({
  id: sprite.id,
  name: sprite.name,
  glyph: sprite.glyph,
  colour: sprite.colour,
  accent: sprite.accent,
  x: sprite.home.x,
  y: sprite.home.y,
  size: sprite.size,
  flipped: sprite.flipped,
  visible: true,
  bubble: null,
  turn: 0,
  speed: "normal",
});

export const sjInitialStage = (project: SjProject): SjStageState => ({
  sprites: project.sprites.map(sjInitialSprite),
  sound: null,
  running: false,
});

// ── Fresh ids ───────────────────────────────────────────────────────────────

let seq = 0;

/** Ids only ever come from event handlers, so a plain counter stays SSR-safe. */
export const sjId = (prefix = "b"): string => {
  seq += 1;
  return `${prefix}${seq}`;
};

/** Deep copy of a block with brand-new ids — used when the palette is tapped. */
export function sjCloneBlock(block: SjBlock): SjBlock {
  const id = sjId();
  return sjIsContainer(block)
    ? { ...block, id, body: block.body.map(sjCloneBlock) }
    : { ...block, id };
}

export function sjCloneScript(script: SjScript): SjScript {
  return {
    id: sjId("s"),
    trigger: { ...script.trigger, id: sjId("t") },
    blocks: script.blocks.map(sjCloneBlock),
  };
}

// ── Counting ────────────────────────────────────────────────────────────────

/** How many blocks a project holds — the flag waits for at least one. */
export function sjCountBlocks(project: SjProject): number {
  const walk = (blocks: SjBlock[]): number =>
    blocks.reduce(
      (total, b) => total + 1 + (sjIsContainer(b) ? walk(b.body) : 0),
      0,
    );
  return project.sprites.reduce(
    (total, sprite) =>
      total + sprite.scripts.reduce((n, s) => n + 1 + walk(s.blocks), 0),
    0,
  );
}

// ── Pure edits ──────────────────────────────────────────────────────────────

export function sjSetScripts(
  project: SjProject,
  spriteId: string,
  scripts: SjScript[],
): SjProject {
  return {
    ...project,
    sprites: project.sprites.map((s) =>
      s.id === spriteId ? { ...s, scripts } : s,
    ),
  };
}

export function sjAddSprite(project: SjProject, sprite: SjSprite): SjProject {
  const taken = project.sprites.map((s) => s.id);
  let id = sprite.id;
  for (let n = 2; taken.includes(id); n += 1) id = `${sprite.id}${n}`;
  return { ...project, sprites: [...project.sprites, { ...sprite, id, scripts: [] }] };
}

export function sjRemoveSprite(project: SjProject, id: string): SjProject {
  if (project.sprites.length <= 1) return project;
  return { ...project, sprites: project.sprites.filter((s) => s.id !== id) };
}

export function sjSetBackground(
  project: SjProject,
  background: SjBackground,
): SjProject {
  return { ...project, background };
}
