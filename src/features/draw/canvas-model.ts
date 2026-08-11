/**
 * The MS Paint drawing model — Grade 6 · Chapter 3 "Cartoon Drawing".
 *
 * Chapter 3 is a drawing chapter done entirely in MS Paint, so the model is
 * shaped like Paint itself: one sheet of paper, the tools of Paint's Home
 * ribbon (pencil, brush, eraser, fill, line, rectangle, ellipse, triangle),
 * Paint's own twenty-colour box, Color 1 for the outline and Color 2 for the
 * fill. A student comparing the screen with the printed screenshot on book
 * pages 39, 41, 43 and 45 should recognise every control.
 *
 * A drawing is a list of `DrawOp`s per layer, replayed onto a canvas — never a
 * bitmap. That keeps undo/redo instant, keeps memory tiny, and lets the picture
 * be re-rendered at any size for the PNG the student saves to their portfolio.
 * The one op that is not vector — `flood` (Paint's Fill with color) — is
 * replayed by re-running the fill against the pixels underneath it, exactly as
 * Paint would.
 *
 * Two layers, not one: the book draws construction shapes first ("use
 * guidlines", book p. 40) and only then the finished lines ("clean up your
 * lines", p. 44). Sketch sits under Ink, so a student can hide or clear the
 * construction shapes at the end instead of erasing them one by one.
 *
 * Pure data and pure canvas painting — no React, no state, no network.
 */

export interface Point {
  x: number;
  y: number;
}

/** The sheet, in drawing units. Landscape, like Paint's default canvas. */
export const CANVAS_W = 1024;
export const CANVAS_H = 576;

/** Paint's paper colour, and the colour the flood fill treats as empty. */
export const PAPER = "#ffffff";

// ── Tools ───────────────────────────────────────────────────────────────────

export type ToolId =
  | "pencil"
  | "brush"
  | "eraser"
  | "fill"
  | "line"
  | "rect"
  | "ellipse"
  | "triangle";

export interface ToolMeta {
  id: ToolId;
  /** Paint's own name for the tool. */
  label: string;
  /** Which ribbon group it belongs to in Paint. */
  group: "tools" | "shapes";
  /** What it does, in a Grade 6 student's words. */
  hint: string;
  /** Shapes and the line take Color 2 as their fill. */
  fillable: boolean;
}

export const TOOLS: readonly ToolMeta[] = [
  {
    id: "pencil",
    label: "Pencil",
    group: "tools",
    hint: "A thin free line — good for sketching the guidelines.",
    fillable: false,
  },
  {
    id: "brush",
    label: "Brushes",
    group: "tools",
    hint: "A thicker free line — good for the final outline.",
    fillable: false,
  },
  {
    id: "fill",
    label: "Fill with color",
    group: "tools",
    hint: "Click inside a closed shape to colour it in.",
    fillable: false,
  },
  {
    id: "eraser",
    label: "Eraser",
    group: "tools",
    hint: "Rubs out what you drew on this layer.",
    fillable: false,
  },
  {
    id: "line",
    label: "Line",
    group: "shapes",
    hint: "Drag for a straight line — arms, legs, the waist line.",
    fillable: false,
  },
  {
    id: "rect",
    label: "Rectangle",
    group: "shapes",
    hint: "Drag a box — square bodies, arm and leg blocks.",
    fillable: true,
  },
  {
    id: "ellipse",
    label: "Oval",
    group: "shapes",
    hint: "Drag an oval — heads, torsos, shoulder balls.",
    fillable: true,
  },
  {
    id: "triangle",
    label: "Triangle",
    group: "shapes",
    hint: "Drag down for a triangle pointing up, drag up to flip it.",
    fillable: true,
  },
];

export const toolMeta = (id: ToolId): ToolMeta =>
  TOOLS.find((t) => t.id === id) ?? TOOLS[0];

/** The four thicknesses of Paint's Size box. */
export const BRUSH_SIZES = [2, 5, 9, 16] as const;

/** Windows Paint's colour box: row 1 above, row 2 below, in Paint's order. */
export const PAINT_PALETTE: readonly (readonly { hex: string; name: string }[])[] =
  [
    [
      { hex: "#000000", name: "Black" },
      { hex: "#7f7f7f", name: "Grey 50%" },
      { hex: "#880015", name: "Dark red" },
      { hex: "#ed1c24", name: "Red" },
      { hex: "#ff7f27", name: "Orange" },
      { hex: "#fff200", name: "Yellow" },
      { hex: "#22b14c", name: "Green" },
      { hex: "#00a2e8", name: "Turquoise" },
      { hex: "#3f48cc", name: "Indigo" },
      { hex: "#a349a4", name: "Purple" },
    ],
    [
      { hex: "#ffffff", name: "White" },
      { hex: "#c3c3c3", name: "Grey 25%" },
      { hex: "#b97a57", name: "Brown" },
      { hex: "#ffaec9", name: "Rose" },
      { hex: "#ffc90e", name: "Gold" },
      { hex: "#efe4b0", name: "Light yellow" },
      { hex: "#b5e61d", name: "Lime" },
      { hex: "#99d9ea", name: "Light turquoise" },
      { hex: "#7092be", name: "Blue grey" },
      { hex: "#c8bfe7", name: "Lavender" },
    ],
  ];

/** Everything the ribbon holds: the current tool and its two colours. */
export interface PaintTools {
  tool: ToolId;
  /** Outline colour — Paint's "Color 1". */
  color1: string;
  /** Fill colour — Paint's "Color 2". */
  color2: string;
  size: number;
  /** Paint's Fill dropdown: shapes are outline-only until this is on. */
  shapeFill: boolean;
}

export const defaultTools = (): PaintTools => ({
  tool: "pencil",
  color1: "#000000",
  color2: "#ffc90e",
  size: 5,
  shapeFill: false,
});

/** Paint's pencil is finer than its brush, and its eraser is fatter than both. */
export function strokeWidth(tool: ToolId, size: number): number {
  if (tool === "pencil") return Math.max(1.5, size * 0.7);
  if (tool === "brush") return size * 1.7;
  if (tool === "eraser") return size * 2.6;
  return size;
}

// ── Marks ───────────────────────────────────────────────────────────────────

export type DrawOp =
  | {
      id: string;
      kind: "path";
      tool: "pencil" | "brush" | "eraser";
      points: Point[];
      color: string;
      width: number;
    }
  | { id: string; kind: "line"; a: Point; b: Point; color: string; width: number }
  | {
      id: string;
      kind: "rect";
      a: Point;
      b: Point;
      color: string;
      width: number;
      fill: string | null;
    }
  | {
      id: string;
      kind: "ellipse";
      a: Point;
      b: Point;
      color: string;
      width: number;
      fill: string | null;
    }
  | {
      id: string;
      kind: "triangle";
      a: Point;
      b: Point;
      color: string;
      width: number;
      fill: string | null;
    }
  | { id: string; kind: "flood"; at: Point; color: string };

export type ShapeOp = Extract<
  DrawOp,
  { kind: "line" | "rect" | "ellipse" | "triangle" }
>;
export type FloodOp = Extract<DrawOp, { kind: "flood" }>;

let opSeq = 0;
/** Ids are only minted when a student draws, so they never reach the server. */
export const nextOpId = (): string => `op-${(opSeq += 1)}`;

// ── The document ────────────────────────────────────────────────────────────

export interface DrawLayer {
  id: string;
  name: string;
  /** One line explaining what belongs on this layer. */
  purpose: string;
  visible: boolean;
  ops: DrawOp[];
}

export interface DrawDoc {
  /** Painted bottom to top: layers[0] is furthest back. */
  layers: DrawLayer[];
}

export const SKETCH_LAYER = "sketch";
export const INK_LAYER = "ink";

export const createDoc = (): DrawDoc => ({
  layers: [
    {
      id: SKETCH_LAYER,
      name: "Sketch",
      purpose: "Construction shapes and guidelines you will hide later.",
      visible: true,
      ops: [],
    },
    {
      id: INK_LAYER,
      name: "Ink",
      purpose: "The finished outline and the colours.",
      visible: true,
      ops: [],
    },
  ],
});

export const layerOf = (doc: DrawDoc, id: string): DrawLayer | undefined =>
  doc.layers.find((l) => l.id === id);

const mapLayer = (
  doc: DrawDoc,
  id: string,
  change: (layer: DrawLayer) => DrawLayer,
): DrawDoc => ({
  layers: doc.layers.map((l) => (l.id === id ? change(l) : l)),
});

export const addOp = (doc: DrawDoc, layerId: string, op: DrawOp): DrawDoc =>
  mapLayer(doc, layerId, (l) => ({ ...l, ops: [...l.ops, op] }));

export const clearLayer = (doc: DrawDoc, layerId: string): DrawDoc =>
  mapLayer(doc, layerId, (l) => ({ ...l, ops: [] }));

export const setLayerVisible = (
  doc: DrawDoc,
  layerId: string,
  visible: boolean,
): DrawDoc => mapLayer(doc, layerId, (l) => ({ ...l, visible }));

export const clearAll = (doc: DrawDoc): DrawDoc => ({
  layers: doc.layers.map((l) => ({ ...l, ops: [] })),
});

export const opCount = (doc: DrawDoc): number =>
  doc.layers.reduce((n, l) => n + l.ops.length, 0);

// ── Undo / redo ─────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 60;

export interface DrawHistory {
  past: DrawDoc[];
  present: DrawDoc;
  future: DrawDoc[];
}

export const createHistory = (doc: DrawDoc = createDoc()): DrawHistory => ({
  past: [],
  present: doc,
  future: [],
});

/** Every change a student makes goes through here, so everything is undoable. */
export const commitDoc = (h: DrawHistory, next: DrawDoc): DrawHistory => ({
  past: [...h.past, h.present].slice(-HISTORY_LIMIT),
  present: next,
  future: [],
});

export const canUndo = (h: DrawHistory): boolean => h.past.length > 0;
export const canRedo = (h: DrawHistory): boolean => h.future.length > 0;

export function undo(h: DrawHistory): DrawHistory {
  if (h.past.length === 0) return h;
  const past = h.past.slice(0, -1);
  const present = h.past[h.past.length - 1];
  return { past, present, future: [h.present, ...h.future].slice(0, HISTORY_LIMIT) };
}

export function redo(h: DrawHistory): DrawHistory {
  if (h.future.length === 0) return h;
  const [present, ...future] = h.future;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present, future };
}

// ── Building a mark while the pointer is down ───────────────────────────────

/**
 * The op a press starts. It stays mutable (see `extendPath`) until the pointer
 * is lifted and it is committed into the document, which is the only place a
 * `DrawOp` is ever changed.
 */
export function beginOp(tools: PaintTools, at: Point): DrawOp {
  const id = nextOpId();
  const width = strokeWidth(tools.tool, tools.size);
  const fill = tools.shapeFill ? tools.color2 : null;
  switch (tools.tool) {
    case "pencil":
    case "brush":
    case "eraser":
      return {
        id,
        kind: "path",
        tool: tools.tool,
        points: [at],
        color: tools.color1,
        width,
      };
    case "fill":
      return { id, kind: "flood", at, color: tools.color1 };
    case "line":
      return { id, kind: "line", a: at, b: at, color: tools.color1, width };
    case "rect":
      return { id, kind: "rect", a: at, b: at, color: tools.color1, width, fill };
    case "ellipse":
      return { id, kind: "ellipse", a: at, b: at, color: tools.color1, width, fill };
    case "triangle":
      return { id, kind: "triangle", a: at, b: at, color: tools.color1, width, fill };
  }
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Adds a point to a free line, skipping the jitter of a shaky hand. */
export function extendPath(op: DrawOp, to: Point): boolean {
  if (op.kind !== "path") return false;
  const last = op.points[op.points.length - 1];
  if (dist(last, to) < 1.1) return false;
  op.points.push(to);
  return true;
}

/** Shift, as in Paint: straight lines snap to 45°, boxes become squares. */
export function extendShape(op: DrawOp, to: Point, constrain: boolean): void {
  if (op.kind === "path" || op.kind === "flood") return;
  if (!constrain) {
    op.b = to;
    return;
  }
  if (op.kind === "line") {
    const dx = to.x - op.a.x;
    const dy = to.y - op.a.y;
    const step = Math.PI / 4;
    const angle = Math.round(Math.atan2(dy, dx) / step) * step;
    const length = Math.hypot(dx, dy);
    op.b = {
      x: op.a.x + Math.cos(angle) * length,
      y: op.a.y + Math.sin(angle) * length,
    };
    return;
  }
  const side = Math.max(Math.abs(to.x - op.a.x), Math.abs(to.y - op.a.y));
  op.b = {
    x: op.a.x + Math.sign(to.x - op.a.x || 1) * side,
    y: op.a.y + Math.sign(to.y - op.a.y || 1) * side,
  };
}

/** A committed mark is a snapshot: shapes are copied out of the live draft. */
export function freezeOp(op: DrawOp): DrawOp {
  if (op.kind === "path") return { ...op, points: [...op.points] };
  if (op.kind === "flood") return { ...op };
  return { ...op, a: { ...op.a }, b: { ...op.b } };
}

/** True when a drag was so short it drew nothing worth keeping. */
export function isEmptyOp(op: DrawOp): boolean {
  if (op.kind === "flood") return false;
  if (op.kind === "path") return false;
  return dist(op.a, op.b) < 2;
}

// ── Geometry shared by the canvas and the guides ────────────────────────────

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const boxOf = (a: Point, b: Point): Box => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(b.x - a.x),
  h: Math.abs(b.y - a.y),
});

/** Paint's triangle: apex on the drag's leading edge, base opposite it. */
export function trianglePoints(a: Point, b: Point): Point[] {
  const box = boxOf(a, b);
  const apexUp = b.y >= a.y;
  return apexUp
    ? [
        { x: box.x + box.w / 2, y: box.y },
        { x: box.x + box.w, y: box.y + box.h },
        { x: box.x, y: box.y + box.h },
      ]
    : [
        { x: box.x + box.w / 2, y: box.y + box.h },
        { x: box.x + box.w, y: box.y },
        { x: box.x, y: box.y },
      ];
}

/**
 * The four corners of an "arm block" or "leg block" (book p. 40 step 4): a
 * rectangle laid along the bone from a to b.
 */
export function limbBlock(a: Point, b: Point, halfWidth: number): Point[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * halfWidth;
  const ny = (dx / len) * halfWidth;
  return [
    { x: a.x + nx, y: a.y + ny },
    { x: b.x + nx, y: b.y + ny },
    { x: b.x - nx, y: b.y - ny },
    { x: a.x - nx, y: a.y - ny },
  ];
}

// ── Painting a mark ─────────────────────────────────────────────────────────

function tracePath(ctx: CanvasRenderingContext2D, points: Point[], smooth: boolean) {
  ctx.beginPath();
  if (points.length === 1) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[0].x + 0.01, points[0].y);
    return;
  }
  ctx.moveTo(points[0].x, points[0].y);
  if (!smooth || points.length < 3) {
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    return;
  }
  // Brush: curve through the midpoints so a fast stroke stays round.
  for (let i = 1; i < points.length - 1; i += 1) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

function traceShape(ctx: CanvasRenderingContext2D, op: ShapeOp) {
  ctx.beginPath();
  if (op.kind === "line") {
    ctx.moveTo(op.a.x, op.a.y);
    ctx.lineTo(op.b.x, op.b.y);
    return;
  }
  const box = boxOf(op.a, op.b);
  if (op.kind === "rect") {
    ctx.rect(box.x, box.y, box.w, box.h);
    return;
  }
  if (op.kind === "ellipse") {
    ctx.ellipse(
      box.x + box.w / 2,
      box.y + box.h / 2,
      Math.max(box.w / 2, 0.1),
      Math.max(box.h / 2, 0.1),
      0,
      0,
      Math.PI * 2,
    );
    return;
  }
  const points = trianglePoints(op.a, op.b);
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

/**
 * Paints one mark onto a layer. `flood` is not handled here — it needs the
 * pixels underneath it, so the canvas calls `applyFlood` instead.
 */
export function renderOp(ctx: CanvasRenderingContext2D, op: DrawOp): void {
  if (op.kind === "flood") return;
  ctx.save();
  ctx.lineJoin = "round";
  if (op.kind === "path") {
    ctx.lineCap = op.tool === "eraser" ? "square" : "round";
    ctx.lineWidth = op.width;
    if (op.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000000";
    } else {
      ctx.strokeStyle = op.color;
    }
    tracePath(ctx, op.points, op.tool === "brush");
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.lineCap = "round";
  ctx.lineWidth = op.width;
  traceShape(ctx, op);
  if (op.kind !== "line" && op.fill) {
    ctx.fillStyle = op.fill;
    ctx.fill();
  }
  ctx.strokeStyle = op.color;
  ctx.stroke();
  ctx.restore();
}

// ── Fill with color ─────────────────────────────────────────────────────────

/** Paint's fill stops at any line; the slack lets it cross soft, blurry edges. */
export const FILL_TOLERANCE = 42;

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

/**
 * Flood fill, the way Paint does it: the region is found on `reference` — an
 * opaque picture of the paper plus everything painted under this mark — and the
 * colour lands on `target`, the student's layer. Both canvases are in device
 * pixels, so the click point is scaled by `scale`.
 *
 * Returns false when the click landed outside the paper.
 */
export function applyFlood(
  target: HTMLCanvasElement,
  reference: HTMLCanvasElement,
  op: FloodOp,
  scale: number,
  tolerance: number = FILL_TOLERANCE,
): boolean {
  const w = reference.width;
  const h = reference.height;
  const sx = Math.round(op.at.x * scale);
  const sy = Math.round(op.at.y * scale);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return false;

  const refCtx = reference.getContext("2d", { willReadFrequently: true });
  const targetCtx = target.getContext("2d");
  if (!refCtx || !targetCtx) return false;

  const ref = refCtx.getImageData(0, 0, w, h).data;
  const start = (sy * w + sx) * 4;
  const r0 = ref[start];
  const g0 = ref[start + 1];
  const b0 = ref[start + 2];
  const [r, g, b] = parseHex(op.color);
  if (Math.abs(r - r0) <= 1 && Math.abs(g - g0) <= 1 && Math.abs(b - b0) <= 1) {
    return false;
  }

  const mask = refCtx.createImageData(w, h);
  const out = mask.data;
  const seen = new Uint8Array(w * h);
  const matches = (i: number) => {
    const p = i * 4;
    return (
      Math.abs(ref[p] - r0) <= tolerance &&
      Math.abs(ref[p + 1] - g0) <= tolerance &&
      Math.abs(ref[p + 2] - b0) <= tolerance
    );
  };

  const stack: number[] = [sy * w + sx];
  while (stack.length > 0) {
    const seed = stack.pop() as number;
    if (seen[seed] === 1 || !matches(seed)) continue;
    const x = seed % w;
    const y = (seed - x) / w;
    let left = x;
    while (left > 0 && seen[y * w + left - 1] === 0 && matches(y * w + left - 1)) {
      left -= 1;
    }
    let right = x;
    while (
      right < w - 1 &&
      seen[y * w + right + 1] === 0 &&
      matches(y * w + right + 1)
    ) {
      right += 1;
    }
    for (let k = left; k <= right; k += 1) {
      const i = y * w + k;
      seen[i] = 1;
      const p = i * 4;
      out[p] = r;
      out[p + 1] = g;
      out[p + 2] = b;
      out[p + 3] = 255;
      if (y > 0 && seen[i - w] === 0 && matches(i - w)) stack.push(i - w);
      if (y < h - 1 && seen[i + w] === 0 && matches(i + w)) stack.push(i + w);
    }
  }

  // Stamp the filled region on top of the layer without disturbing the rest.
  const stamp = document.createElement("canvas");
  stamp.width = w;
  stamp.height = h;
  const stampCtx = stamp.getContext("2d");
  if (!stampCtx) return false;
  stampCtx.putImageData(mask, 0, 0);
  targetCtx.save();
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
  targetCtx.drawImage(stamp, 0, 0);
  targetCtx.restore();
  return true;
}

// ── Guides: the construction lines a student traces over ────────────────────

export type GuideShape =
  | { kind: "line"; a: Point; b: Point; dashed?: boolean }
  | { kind: "poly"; points: Point[]; closed?: boolean; dashed?: boolean }
  | { kind: "ellipse"; c: Point; rx: number; ry: number; dashed?: boolean }
  | { kind: "rect"; a: Point; b: Point; dashed?: boolean }
  /** A joint: the big dot the book puts on elbows, knees and hip sockets. */
  | { kind: "joint"; c: Point; r?: number }
  /** A callout, drawn like the book's dotted label leaders. */
  | {
      kind: "label";
      at: Point;
      to?: Point;
      text: string;
      align?: "left" | "right" | "center";
    };

export interface GuidePaint {
  colour: string;
  labelColour: string;
  width: number;
  alpha: number;
}

/** The step you are on. */
export const GUIDE_INK: GuidePaint = {
  colour: "#0d8ecf",
  labelColour: "#0a6d9e",
  width: 2,
  alpha: 1,
};

/** The steps you already passed — still there, further back, like the book's plates. */
export const GUIDE_ECHO: GuidePaint = {
  colour: "#8fb6cd",
  labelColour: "#8fb6cd",
  width: 1.5,
  alpha: 0.6,
};

const GUIDE_FONT = "600 13px ui-sans-serif, system-ui, sans-serif";

export function renderGuide(
  ctx: CanvasRenderingContext2D,
  shapes: readonly GuideShape[],
  paint: GuidePaint,
): void {
  ctx.save();
  ctx.globalAlpha = paint.alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const shape of shapes) {
    ctx.strokeStyle = paint.colour;
    ctx.fillStyle = paint.colour;
    ctx.lineWidth = paint.width;
    ctx.setLineDash("dashed" in shape && shape.dashed ? [7, 7] : []);
    switch (shape.kind) {
      case "line":
        ctx.beginPath();
        ctx.moveTo(shape.a.x, shape.a.y);
        ctx.lineTo(shape.b.x, shape.b.y);
        ctx.stroke();
        break;
      case "poly": {
        ctx.beginPath();
        shape.points.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        if (shape.closed !== false) ctx.closePath();
        ctx.stroke();
        break;
      }
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(shape.c.x, shape.c.y, shape.rx, shape.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "rect": {
        const box = boxOf(shape.a, shape.b);
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.stroke();
        break;
      }
      case "joint":
        ctx.beginPath();
        ctx.arc(shape.c.x, shape.c.y, shape.r ?? 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "label": {
        if (shape.to) {
          ctx.save();
          ctx.setLineDash([2, 5]);
          ctx.lineWidth = Math.max(1, paint.width - 0.5);
          ctx.beginPath();
          ctx.moveTo(shape.at.x, shape.at.y);
          ctx.lineTo(shape.to.x, shape.to.y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.font = GUIDE_FONT;
        ctx.textAlign = shape.align ?? "left";
        ctx.textBaseline = "middle";
        const pad = shape.align === "right" ? -8 : shape.align === "center" ? 0 : 8;
        const tx = shape.at.x + pad;
        const ty = shape.at.y;
        // A white halo keeps the label readable over a coloured drawing.
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.setLineDash([]);
        ctx.strokeText(shape.text, tx, ty);
        ctx.fillStyle = paint.labelColour;
        ctx.fillText(shape.text, tx, ty);
        break;
      }
    }
  }
  ctx.restore();
}
