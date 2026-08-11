"use client";

import { cn } from "@/lib/utils";
import {
  Brush,
  Circle,
  Eraser,
  Minus,
  PaintBucket,
  Palette,
  Pencil,
  Square,
  Trash2,
  Triangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from "react";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  applyFlood,
  beginOp,
  BRUSH_SIZES,
  CANVAS_H,
  CANVAS_W,
  extendPath,
  extendShape,
  freezeOp,
  GUIDE_ECHO,
  GUIDE_INK,
  isEmptyOp,
  PAINT_PALETTE,
  PAPER,
  renderGuide,
  renderOp,
  TOOLS,
  toolMeta,
  type DrawDoc,
  type DrawOp,
  type GuideShape,
  type PaintTools,
  type Point,
  type ToolId,
} from "./canvas-model";

// ── The canvas ──────────────────────────────────────────────────────────────

export interface DrawCanvasHandle {
  /** The picture as a PNG data URL — paper and layers, never the guide. */
  exportPng: () => string | null;
}

export interface DrawCanvasProps {
  doc: DrawDoc;
  /** The layer a new mark lands on. */
  activeLayerId: string;
  tools: PaintTools;
  /** Construction geometry for the step the student is on. */
  guide?: readonly GuideShape[];
  /** Construction geometry from the steps already passed, drawn further back. */
  guideEcho?: readonly GuideShape[];
  /** 0 hides the tracing guide; the overlay fades between values. */
  guideOpacity?: number;
  onCommit: (op: DrawOp) => void;
  ref?: Ref<DrawCanvasHandle>;
  className?: string;
}

interface BakeState {
  count: number;
  last: DrawOp | null;
}

const deviceSize = (dpr: number) => ({
  w: Math.round(CANVAS_W * dpr),
  h: Math.round(CANVAS_H * dpr),
});

/** Sharp on a retina laptop, capped so a flood fill stays instant. */
const readDensity = () => Math.min(2, window.devicePixelRatio || 1);

/** Fires when the window moves to a screen with a different density. */
function subscribeToDensity(onChange: () => void): () => void {
  const query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The Paint canvas: pointer in, pixels out.
 *
 * The document is replayed onto one offscreen canvas per layer, and those are
 * composited onto the visible canvas together with the mark currently under the
 * pointer. Replaying is incremental — a new mark is painted straight onto its
 * layer — and only an undo, a cleared layer or a change of screen density makes
 * a layer rebuild from the start, which is why undo stays instant even after a
 * hundred strokes.
 */
export function DrawCanvas({
  doc,
  activeLayerId,
  tools,
  guide,
  guideEcho,
  guideOpacity = 0.7,
  onCommit,
  ref,
  className,
}: DrawCanvasProps) {
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const layersRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const bakeRef = useRef<Map<string, BakeState>>(new Map());
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const draftRef = useRef<DrawOp | null>(null);
  const pointerRef = useRef<number | null>(null);
  const rafRef = useRef(0);
  const [cursor, setCursor] = useState<Point | null>(null);
  /** Screen density is a browser fact, so it is read, never stored in state. */
  const dpr = useSyncExternalStore(subscribeToDensity, readDensity, () => 1);

  const meta = toolMeta(tools.tool);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const ensureLayer = (id: string): HTMLCanvasElement => {
    const { w, h } = deviceSize(dpr);
    let canvas = layersRef.current.get(id);
    if (!canvas) {
      canvas = document.createElement("canvas");
      layersRef.current.set(id, canvas);
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      bakeRef.current.set(id, { count: 0, last: null });
    }
    return canvas;
  };

  const ensureScratch = (): HTMLCanvasElement => {
    const { w, h } = deviceSize(dpr);
    let canvas = scratchRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      scratchRef.current = canvas;
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return canvas;
  };

  /** Fill needs to see the paper and everything painted below the mark. */
  const runFlood = (layerId: string, op: DrawOp) => {
    if (op.kind !== "flood") return;
    const target = ensureLayer(layerId);
    const reference = ensureScratch();
    const ctx = reference.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, reference.width, reference.height);
    for (const layer of doc.layers) {
      if (layer.id === layerId) break;
      if (!layer.visible) continue;
      const below = layersRef.current.get(layer.id);
      if (below) ctx.drawImage(below, 0, 0);
    }
    ctx.drawImage(target, 0, 0);
    applyFlood(target, reference, op, dpr);
  };

  /** Replay every layer up to date, painting only the marks not yet baked. */
  const syncLayers = () => {
    for (const layer of doc.layers) {
      const canvas = ensureLayer(layer.id);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const state = bakeRef.current.get(layer.id) ?? { count: 0, last: null };
      const rewound =
        state.count > layer.ops.length ||
        (state.count > 0 && layer.ops[state.count - 1] !== state.last);
      if (rewound) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        state.count = 0;
      }
      for (let i = state.count; i < layer.ops.length; i += 1) {
        const op = layer.ops[i];
        if (op.kind === "flood") runFlood(layer.id, op);
        else renderOp(ctx, op);
      }
      state.count = layer.ops.length;
      state.last = layer.ops.length > 0 ? layer.ops[layer.ops.length - 1] : null;
      bakeRef.current.set(layer.id, state);
    }
  };

  const paint = () => {
    const view = viewRef.current;
    if (!view) return;
    const { w, h } = deviceSize(dpr);
    if (view.width !== w || view.height !== h) {
      view.width = w;
      view.height = h;
    }
    const ctx = view.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    for (const layer of doc.layers) {
      if (!layer.visible) continue;
      const canvas = layersRef.current.get(layer.id);
      if (canvas) ctx.drawImage(canvas, 0, 0);
    }
    const draft = draftRef.current;
    if (draft) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderOp(ctx, draft);
    }
  };

  // Kept deliberately dependency-free: after any render the picture on screen
  // is rebuilt from the document, so a repaint can never be missed.
  useEffect(() => {
    syncLayers();
    paint();
  });

  useEffect(() => {
    const canvas = guideRef.current;
    if (!canvas) return;
    const { w, h } = deviceSize(dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (guideEcho && guideEcho.length > 0) renderGuide(ctx, guideEcho, GUIDE_ECHO);
    if (guide && guide.length > 0) renderGuide(ctx, guide, GUIDE_INK);
  }, [guide, guideEcho, dpr]);

  useImperativeHandle(ref, () => ({
    exportPng: () => {
      const { w, h } = deviceSize(dpr);
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, w, h);
      for (const layer of doc.layers) {
        if (!layer.visible) continue;
        const canvas = layersRef.current.get(layer.id);
        if (canvas) ctx.drawImage(canvas, 0, 0);
      }
      return out.toDataURL("image/png");
    },
  }));

  // ── Pointer ───────────────────────────────────────────────────────────────

  const toPaper = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const showCursor = (at: Point | null) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      setCursor(at ? { x: Math.round(at.x), y: Math.round(at.y) } : null);
    });
  };

  const handleDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const at = toPaper(e);
    const op = beginOp(tools, at);
    if (op.kind === "flood") {
      onCommit(op);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = e.pointerId;
    draftRef.current = op;
    paint();
  };

  const handleMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const at = toPaper(e);
    showCursor(at);
    const draft = draftRef.current;
    if (!draft) return;
    if (draft.kind === "path") extendPath(draft, at);
    else extendShape(draft, at, e.shiftKey);
    paint();
  };

  const handleUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const draft = draftRef.current;
    draftRef.current = null;
    if (pointerRef.current !== null) {
      if (e.currentTarget.hasPointerCapture(pointerRef.current)) {
        e.currentTarget.releasePointerCapture(pointerRef.current);
      }
      pointerRef.current = null;
    }
    if (draft && !isEmptyOp(draft)) onCommit(freezeOp(draft));
    else paint();
  };

  const activeName =
    doc.layers.find((l) => l.id === activeLayerId)?.name ?? "the drawing";

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="bg-[#7f8a99] p-3 sm:p-4">
        <div
          className="relative mx-auto w-full shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          <canvas
            ref={viewRef}
            tabIndex={0}
            aria-label={`Paint canvas, ${CANVAS_W} by ${CANVAS_H} pixels. Tool: ${meta.label}. Drawing on the ${activeName} layer. Draw by dragging with a mouse, a pen or a finger.`}
            className="absolute inset-0 h-full w-full touch-none bg-white"
            style={{ cursor: tools.tool === "fill" ? "cell" : "crosshair" }}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
            onPointerLeave={() => showCursor(null)}
          />
          <canvas
            ref={guideRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300"
            style={{ opacity: guideOpacity }}
          />
        </div>
      </div>

      {/* Paint's status bar */}
      <div className="flex items-center gap-3 overflow-x-auto border-t border-[#a3bdd4] bg-[#eef4fa] px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-ink-600">
        <span className="tnum">
          {cursor ? `${cursor.x}, ${cursor.y}px` : "— , —"}
        </span>
        <span className="tnum">
          {CANVAS_W} × {CANVAS_H}px
        </span>
        <span className="text-ink-500">{meta.label}</span>
        <span className="ml-auto tnum text-ink-500">100%</span>
      </div>
    </div>
  );
}

// ── The ribbon ──────────────────────────────────────────────────────────────

export const TOOL_ICONS: Record<ToolId, LucideIcon> = {
  pencil: Pencil,
  brush: Brush,
  fill: PaintBucket,
  eraser: Eraser,
  line: Minus,
  rect: Square,
  ellipse: Circle,
  triangle: Triangle,
};

function RibbonGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 border-r border-[#c3d5e6] px-2.5",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-1">{children}</div>
      <span className="text-[10px] leading-none text-ink-500">{label}</span>
    </div>
  );
}

function RibbonButton({
  active,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={title}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded border transition-colors",
        active
          ? "border-[#5b93cd] bg-[#cbe3fb] text-ink-900"
          : "border-transparent text-ink-700 hover:border-[#8fbde9] hover:bg-[#e6f1fc]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The Home tab of the Paint ribbon, in Paint's own order: the tools, the
 * shapes, the size box and the twenty-colour box with Color 1 and Color 2.
 * Clicking a colour paints whichever of the two slots is selected — the detail
 * every Grade 6 class trips over on the printed screenshots.
 */
export function PaintRibbon({
  tools,
  onChange,
  onClearImage,
  className,
}: {
  tools: PaintTools;
  onChange: (next: PaintTools) => void;
  onClearImage: () => void;
  className?: string;
}) {
  const [slot, setSlot] = useState<1 | 2>(1);
  const setColour = (hex: string) =>
    onChange(slot === 1 ? { ...tools, color1: hex } : { ...tools, color2: hex });

  const shapeToolSelected = toolMeta(tools.tool).group === "shapes";

  return (
    <div
      className={cn(
        "thin-scroll flex items-stretch gap-0 overflow-x-auto border-b border-[#a3bdd4] bg-gradient-to-b from-[#f7fafd] to-[#dceaf7] px-2 py-2",
        className,
      )}
    >
      <RibbonGroup label="Image">
        <RibbonButton
          label="Clear image — start the drawing again"
          title="Clear image — start the drawing again"
          onClick={onClearImage}
        >
          <Trash2 className="size-4.5" />
        </RibbonButton>
      </RibbonGroup>

      <RibbonGroup label="Tools">
        {TOOLS.filter((t) => t.group === "tools").map((t) => {
          const Icon = TOOL_ICONS[t.id];
          return (
            <RibbonButton
              key={t.id}
              active={tools.tool === t.id}
              label={`${t.label} — ${t.hint}`}
              title={`${t.label} — ${t.hint}`}
              onClick={() => onChange({ ...tools, tool: t.id })}
            >
              <Icon className="size-4.5" />
            </RibbonButton>
          );
        })}
      </RibbonGroup>

      <RibbonGroup label="Shapes">
        {TOOLS.filter((t) => t.group === "shapes").map((t) => {
          const Icon = TOOL_ICONS[t.id];
          return (
            <RibbonButton
              key={t.id}
              active={tools.tool === t.id}
              label={`${t.label} — ${t.hint}`}
              title={`${t.label} — ${t.hint}`}
              onClick={() => onChange({ ...tools, tool: t.id })}
            >
              <Icon className="size-4.5" />
            </RibbonButton>
          );
        })}
        <button
          type="button"
          onClick={() => onChange({ ...tools, shapeFill: !tools.shapeFill })}
          aria-pressed={tools.shapeFill}
          title="Fill — paint the inside of a new shape with Color 2"
          className={cn(
            "ml-1 flex h-9 cursor-pointer items-center gap-1.5 rounded border px-2 text-[12px] font-medium transition-colors",
            tools.shapeFill
              ? "border-[#5b93cd] bg-[#cbe3fb] text-ink-900"
              : "border-[#c3d5e6] bg-white/70 text-ink-600 hover:bg-[#e6f1fc]",
            !shapeToolSelected && "opacity-70",
          )}
        >
          <span
            className="size-4 rounded-xs border border-ink-300"
            style={{ background: tools.shapeFill ? tools.color2 : "transparent" }}
            aria-hidden
          />
          Fill
        </button>
      </RibbonGroup>

      <RibbonGroup label="Size">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange({ ...tools, size })}
            aria-pressed={tools.size === size}
            aria-label={`Thickness ${size} pixels`}
            title={`Thickness ${size}px`}
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded border transition-colors",
              tools.size === size
                ? "border-[#5b93cd] bg-[#cbe3fb]"
                : "border-transparent hover:border-[#8fbde9] hover:bg-[#e6f1fc]",
            )}
          >
            <span
              className="block w-6 rounded-full bg-ink-800"
              style={{ height: Math.max(2, size * 0.7) }}
              aria-hidden
            />
          </button>
        ))}
      </RibbonGroup>

      <RibbonGroup label="Colors" className="border-r-0">
        <div className="flex items-center gap-1.5">
          {([1, 2] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSlot(n)}
              aria-pressed={slot === n}
              aria-label={`Color ${n} — ${n === 1 ? "the outline colour" : "the fill colour"}, currently ${n === 1 ? tools.color1 : tools.color2}`}
              title={`Color ${n} — ${n === 1 ? "outline" : "fill"}`}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-0.5 rounded border px-1.5 py-1 transition-colors",
                slot === n
                  ? "border-[#5b93cd] bg-[#cbe3fb]"
                  : "border-transparent hover:bg-[#e6f1fc]",
              )}
            >
              <span
                className="size-6 rounded-xs border border-ink-400"
                style={{ background: n === 1 ? tools.color1 : tools.color2 }}
                aria-hidden
              />
              <span className="text-[9px] leading-none text-ink-600">Color {n}</span>
            </button>
          ))}

          <div className="grid grid-cols-10 gap-px">
            {PAINT_PALETTE.flat().map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setColour(swatch.hex)}
                aria-label={`${swatch.name} for Color ${slot}`}
                title={swatch.name}
                className="flex size-8 cursor-pointer items-center justify-center rounded-xs hover:bg-[#cbe3fb]"
              >
                <span
                  className="size-5 rounded-[2px] border border-ink-400/70"
                  style={{ background: swatch.hex }}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          <label
            className="relative flex h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-transparent px-1.5 text-ink-700 hover:border-[#8fbde9] hover:bg-[#e6f1fc] focus-within:border-[#5b93cd]"
            title="Edit colors — pick any colour you like"
          >
            <Palette className="size-4.5" aria-hidden />
            <span className="text-[9px] leading-none text-ink-600">Edit colors</span>
            <input
              type="color"
              value={slot === 1 ? tools.color1 : tools.color2}
              onChange={(e) => setColour(e.target.value)}
              aria-label={`Edit colors — choose any colour for Color ${slot}`}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </RibbonGroup>
    </div>
  );
}
