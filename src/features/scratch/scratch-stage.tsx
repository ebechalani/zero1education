"use client";

import { clamp, cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";
import { useId, type PointerEvent as ReactPointerEvent } from "react";
import {
  penColourCss,
  spriteBox,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  STAGE_X,
  STAGE_Y,
  type ScBackdrop,
  type ScCostume,
  type ScGlyph,
  type ScPenLine,
  type ScProject,
  type ScSpriteState,
  type ScStageState,
} from "./scratch-model";

/**
 * The Scratch stage: 480 × 360, exactly as the editor sizes it.
 *
 * Everything a project can put on the stage is drawn here — the backdrop's
 * bands, the pen's trail, the sprites at their x/y/direction/size, their speech
 * and thought bubbles, and the variable watchers of Lesson 6. It is one SVG at
 * the book's own resolution, scaled by CSS, so a stage on a phone and a stage
 * filling a projector are the same picture at two sizes and a sprite at x = 19
 * y = 33 is in the same place on both.
 *
 * The pen matters more than it looks: Lesson 7 asks the class to *reproduce*
 * four printed shapes, so a drawing that does not appear is a lesson that
 * cannot be taught. Pen segments are welded into as few paths as possible —
 * twelve squares of a rotating pattern are a handful of paths, not a thousand
 * line elements.
 */

// ── Scratch coordinates → SVG coordinates ───────────────────────────────────

/** x −240…240 with 0 in the middle → 0…480 from the left edge. */
const px = (x: number) => x + STAGE_X;
/** y −180…180 counting upwards → 0…360 counting down the screen. */
const py = (y: number) => STAGE_Y - y;
const r1 = (n: number) => Math.round(n * 10) / 10;

// ── The glyphs ──────────────────────────────────────────────────────────────

/**
 * How big each glyph is drawn before the sprite's own size is applied. These
 * match the widths and heights the sprite library declares, which are also the
 * boxes the engine uses for `touching`, so what the class sees collide is what
 * the interpreter saw collide.
 */
const GLYPH_SIZE: Record<ScGlyph, { w: number; h: number }> = {
  cat: { w: 62, h: 54 },
  parrot: { w: 58, h: 40 },
  person: { w: 42, h: 66 },
  ball: { w: 36, h: 36 },
  bar: { w: 96, h: 8 },
  bottle: { w: 36, h: 58 },
  can: { w: 32, h: 48 },
  carton: { w: 36, h: 50 },
};

const INK = "#0b1120";
const SHADE = "rgba(11,17,32,0.18)";

/**
 * One costume, drawn centred on (0, 0) and facing right — every sprite in the
 * chapter is a handful of ellipses and polygons we draw ourselves.
 */
function GlyphShape({ costume }: { costume: ScCostume }) {
  const { colour, accent } = costume;
  const second = accent ?? SHADE;

  switch (costume.glyph) {
    case "cat":
      return (
        <>
          <path
            d="M-22 6 C-33 4 -33 -12 -24 -13"
            fill="none"
            stroke={colour}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <rect x={-16} y={12} width={8} height={14} rx={3} fill={second} />
          <rect x={4} y={12} width={8} height={14} rx={3} fill={second} />
          <ellipse cx={-2} cy={6} rx={22} ry={13} fill={colour} />
          <path d="M7 -17 L11 -27 L17 -19 Z" fill={second} />
          <path d="M21 -19 L27 -27 L30 -17 Z" fill={second} />
          <circle cx={18} cy={-8} r={13} fill={colour} />
          <circle cx={21} cy={-11} r={2.4} fill={INK} />
          <circle cx={13} cy={-11} r={2.4} fill={INK} />
          <path d="M17 -4 L21 -4 L19 -1 Z" fill={INK} />
          <path
            d="M-8 2 h10 M-8 9 h10"
            stroke={second}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      );
    case "parrot":
      return (
        <>
          <path d="M-29 0 L-13 -6 L-13 7 Z" fill={second} />
          <ellipse cx={0} cy={0} rx={17} ry={12} fill={colour} />
          <ellipse cx={-2} cy={1} rx={10} ry={6.5} fill={second} />
          <circle cx={15} cy={-8} r={9} fill={colour} />
          <path d="M23 -10 L29 -6 L23 -2 Z" fill="#f2b64d" />
          <circle cx={17} cy={-10} r={2} fill={INK} />
          <path
            d="M6 11 v6 M12 10 v6"
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      );
    case "person":
      return (
        <>
          <rect x={-9} y={11} width={7} height={20} rx={3} fill="#1e2946" />
          <rect x={2} y={11} width={7} height={20} rx={3} fill="#1e2946" />
          <rect x={-17} y={-13} width={6} height={21} rx={3} fill={colour} />
          <rect x={11} y={-13} width={6} height={21} rx={3} fill={colour} />
          <rect x={-12} y={-15} width={24} height={28} rx={9} fill={colour} />
          <circle cx={0} cy={-24} r={9} fill={second} />
          <path d="M-9 -26 A9 9 0 0 1 9 -26 Z" fill="#2e3a5c" />
          <circle cx={-3.2} cy={-24} r={1.4} fill={INK} />
          <circle cx={3.2} cy={-24} r={1.4} fill={INK} />
        </>
      );
    case "ball":
      return (
        <>
          <circle cx={0} cy={0} r={17} fill={colour} />
          <circle cx={-5} cy={-5} r={5.5} fill="#ffffff" opacity={0.45} />
          <circle
            cx={0}
            cy={0}
            r={17}
            fill="none"
            stroke="rgba(11,17,32,0.15)"
            strokeWidth={1.5}
          />
        </>
      );
    case "bar":
      return <rect x={-48} y={-4} width={96} height={8} rx={4} fill={colour} />;
    case "bottle":
      return (
        <>
          <rect x={-13} y={-9} width={26} height={38} rx={9} fill={colour} />
          <rect x={-5} y={-25} width={10} height={18} rx={3} fill={colour} />
          <rect x={-7} y={-29} width={14} height={6} rx={2} fill={second} />
          <rect x={-13} y={3} width={26} height={11} fill="#ffffff" opacity={0.5} />
          <rect x={-9} y={-4} width={5} height={26} rx={2.5} fill="#ffffff" opacity={0.3} />
        </>
      );
    case "can":
      return (
        <>
          <rect x={-13} y={-20} width={26} height={40} rx={4} fill={colour} />
          <ellipse cx={0} cy={-20} rx={13} ry={4} fill="#ffffff" opacity={0.55} />
          <rect x={-13} y={-6} width={26} height={13} fill={second} />
          <ellipse cx={0} cy={20} rx={13} ry={4} fill="rgba(11,17,32,0.12)" />
        </>
      );
    case "carton":
      return (
        <>
          <rect x={-15} y={-14} width={30} height={39} rx={2} fill={colour} />
          <path d="M-15 -14 L0 -25 L15 -14 Z" fill={second} />
          <rect x={-10} y={-2} width={20} height={12} rx={1.5} fill="#ffffff" opacity={0.55} />
          <path d="M0 -25 v11" stroke="rgba(11,17,32,0.2)" strokeWidth={1.5} />
        </>
      );
  }
}

/** The scale that fits a glyph into the box its sprite declares. */
const glyphScale = (glyph: ScGlyph, width: number, height: number): number => {
  const natural = GLYPH_SIZE[glyph];
  return Math.min(width / natural.w, height / natural.h);
};

/**
 * One costume on its own, for the sprite tray and the costume list. Same
 * drawing as the stage uses, so a thumbnail is never a different picture.
 */
export function SpriteGlyph({
  costume,
  width,
  height,
  size = 40,
  className,
}: {
  costume: ScCostume;
  /** The sprite's own box; the glyph is fitted into it. */
  width: number;
  height: number;
  /** Side of the square the thumbnail is drawn in, in px. */
  size?: number;
  className?: string;
}) {
  const side = Math.max(width, height);
  const k = glyphScale(costume.glyph, width, height);
  return (
    <svg
      viewBox={`${-side / 2} ${-side / 2} ${side} ${side}`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
      focusable="false"
    >
      <g transform={`scale(${r1(k)})`}>
        <GlyphShape costume={costume} />
      </g>
    </svg>
  );
}

// ── The backdrop ────────────────────────────────────────────────────────────

function BackdropBands({
  backdrop,
  idBase,
}: {
  backdrop: ScBackdrop | undefined;
  idBase: string;
}) {
  if (!backdrop) {
    return <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#ffffff" />;
  }
  return (
    <>
      <defs>
        {backdrop.bands.map((band, i) =>
          band.colour2 ? (
            <linearGradient
              key={i}
              id={`${idBase}-band-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={band.colour} />
              <stop offset="100%" stopColor={band.colour2} />
            </linearGradient>
          ) : null,
        )}
      </defs>
      <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#ffffff" />
      {backdrop.bands.map((band, i) => (
        <rect
          key={i}
          x={0}
          y={r1(band.from * STAGE_HEIGHT)}
          width={STAGE_WIDTH}
          height={r1(Math.max(0, band.to - band.from) * STAGE_HEIGHT)}
          fill={band.colour2 ? `url(#${idBase}-band-${i})` : band.colour}
        />
      ))}
    </>
  );
}

/** The backdrop on its own, for the Stage tray under the editor. */
export function BackdropThumb({
  backdrop,
  className,
}: {
  backdrop: ScBackdrop;
  className?: string;
}) {
  const idBase = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
      className={cn("block h-full w-full", className)}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <BackdropBands backdrop={backdrop} idBase={idBase} />
    </svg>
  );
}

// ── The pen layer ───────────────────────────────────────────────────────────

interface PenPath {
  d: string;
  colour: number;
  width: number;
}

/**
 * Weld the pen's segments into paths. Consecutive segments that share a colour
 * and a width and carry on from where the last one stopped are one stroke —
 * which is what a square drawn by a `repeat 4` block actually is.
 */
export function penPaths(lines: ScPenLine[]): PenPath[] {
  const paths: PenPath[] = [];
  let open: PenPath | null = null;
  let atX = 0;
  let atY = 0;
  for (const line of lines) {
    const joins =
      open !== null &&
      open.colour === line.colour &&
      open.width === line.width &&
      Math.abs(atX - line.x1) < 0.01 &&
      Math.abs(atY - line.y1) < 0.01;
    if (joins && open) {
      open.d += ` L${r1(px(line.x2))} ${r1(py(line.y2))}`;
    } else {
      open = {
        d: `M${r1(px(line.x1))} ${r1(py(line.y1))} L${r1(px(line.x2))} ${r1(py(line.y2))}`,
        colour: line.colour,
        width: line.width,
      };
      paths.push(open);
    }
    atX = line.x2;
    atY = line.y2;
  }
  return paths;
}

function PenLayer({ lines }: { lines: ScPenLine[] }) {
  if (lines.length === 0) return null;
  return (
    <g>
      {penPaths(lines).map((path, i) => (
        <path
          key={i}
          d={path.d}
          fill="none"
          stroke={penColourCss(path.colour)}
          strokeWidth={path.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

// ── Speech and thought bubbles ──────────────────────────────────────────────

const BUBBLE_FONT = 13;
const BUBBLE_LINE = 16;
/** Widest a line of a bubble gets before it wraps, in characters. */
const BUBBLE_WRAP = 24;
/** Room to keep per character. Generous on purpose: the bubble is measured, not
 *  laid out, and a sentence must never spill over its own outline. */
const BUBBLE_CHAR = 7.6;

function wrapText(text: string): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let rest = word;
    // A single word longer than the bubble is cut rather than allowed to run
    // off the stage.
    while (rest.length > BUBBLE_WRAP) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(rest.slice(0, BUBBLE_WRAP));
      rest = rest.slice(BUBBLE_WRAP);
    }
    if (!line) line = rest;
    else if (`${line} ${rest}`.length <= BUBBLE_WRAP) line = `${line} ${rest}`;
    else {
      lines.push(line);
      line = rest;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

function Bubble({ sprite }: { sprite: ScSpriteState }) {
  const bubble = sprite.bubble;
  if (!bubble) return null;
  const lines = wrapText(bubble.text);
  if (lines.length === 0) return null;

  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = clamp(longest * BUBBLE_CHAR + 22, 54, 260);
  const height = lines.length * BUBBLE_LINE + 12;

  const box = spriteBox(sprite);
  const fromX = clamp(px(box.right) - 8, 8, STAGE_WIDTH - 8);
  const fromY = clamp(py(box.top) + 2, 8, STAGE_HEIGHT - 8);
  const x = clamp(fromX - 10, 4, STAGE_WIDTH - width - 4);
  const y = clamp(fromY - height - 14, 4, STAGE_HEIGHT - height - 4);
  const tailX = clamp(x + 18, x + 10, x + width - 24);

  return (
    <g>
      {bubble.kind === "say" ? (
        <path
          d={`M${tailX} ${y + height - 3} L${fromX} ${fromY} L${tailX + 16} ${y + height - 3} Z`}
          fill="#ffffff"
          stroke="rgba(11,17,32,0.18)"
          strokeWidth={1}
        />
      ) : (
        <>
          <circle
            cx={tailX + 6}
            cy={y + height + 6}
            r={4.5}
            fill="#ffffff"
            stroke="rgba(11,17,32,0.18)"
          />
          <circle
            cx={tailX + 13}
            cy={y + height + 14}
            r={3}
            fill="#ffffff"
            stroke="rgba(11,17,32,0.18)"
          />
        </>
      )}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="#ffffff"
        stroke="rgba(11,17,32,0.18)"
        strokeWidth={1}
      />
      {/* Redrawn over the tail's own outline, so the two read as one shape. */}
      {bubble.kind === "say" && (
        <rect
          x={x + 1}
          y={y + height - 5}
          width={width - 2}
          height={4}
          fill="#ffffff"
        />
      )}
      <text
        x={x + 10}
        y={y + 10}
        fontSize={BUBBLE_FONT}
        fontWeight={600}
        fill={INK}
        style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={x + 10} dy={i === 0 ? BUBBLE_FONT - 2 : BUBBLE_LINE}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

// ── Variable watchers ───────────────────────────────────────────────────────

/** Scratch's little read-outs in the top-left corner of the stage. */
function Watchers({ variables }: { variables: Record<string, number> }) {
  const names = Object.keys(variables);
  if (names.length === 0) return null;
  return (
    <g>
      {names.slice(0, 6).map((name, i) => {
        const value = variables[name];
        const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
        const nameWidth = name.length * 6.4 + 12;
        const valueWidth = Math.max(24, shown.length * 7.4 + 10);
        const y = 6 + i * 24;
        return (
          <g key={name}>
            <rect
              x={6}
              y={y}
              width={nameWidth + valueWidth + 8}
              height={20}
              rx={4}
              fill="#ffffff"
              stroke="rgba(11,17,32,0.18)"
            />
            <text
              x={12}
              y={y + 14}
              fontSize={11.5}
              fontWeight={600}
              fill="#1e2946"
              style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
            >
              {name}
            </text>
            <rect
              x={nameWidth + 8}
              y={y + 3}
              width={valueWidth}
              height={14}
              rx={7}
              fill="#FF8C1A"
            />
            <text
              x={nameWidth + 8 + valueWidth / 2}
              y={y + 13.5}
              fontSize={11}
              fontWeight={700}
              fill="#ffffff"
              textAnchor="middle"
              style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
            >
              {shown}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ── The x/y grid, for explaining coordinates ────────────────────────────────

function Grid() {
  const verticals = [-180, -120, -60, 60, 120, 180];
  const horizontals = [-120, -60, 60, 120];
  return (
    <g pointerEvents="none">
      {verticals.map((x) => (
        <line
          key={`v${x}`}
          x1={px(x)}
          y1={0}
          x2={px(x)}
          y2={STAGE_HEIGHT}
          stroke="rgba(11,17,32,0.14)"
          strokeWidth={1}
        />
      ))}
      {horizontals.map((y) => (
        <line
          key={`h${y}`}
          x1={0}
          y1={py(y)}
          x2={STAGE_WIDTH}
          y2={py(y)}
          stroke="rgba(11,17,32,0.14)"
          strokeWidth={1}
        />
      ))}
      <line
        x1={0}
        y1={py(0)}
        x2={STAGE_WIDTH}
        y2={py(0)}
        stroke="rgba(11,17,32,0.4)"
        strokeWidth={1.5}
      />
      <line
        x1={px(0)}
        y1={0}
        x2={px(0)}
        y2={STAGE_HEIGHT}
        stroke="rgba(11,17,32,0.4)"
        strokeWidth={1.5}
      />
      {[-200, -100, 100, 200].map((x) => (
        <text
          key={`vt${x}`}
          x={px(x)}
          y={py(0) - 5}
          fontSize={10}
          fill="rgba(11,17,32,0.55)"
          textAnchor="middle"
          style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
        >
          {x}
        </text>
      ))}
      {[-100, 100].map((y) => (
        <text
          key={`ht${y}`}
          x={px(0) + 5}
          y={py(y) - 3}
          fontSize={10}
          fill="rgba(11,17,32,0.55)"
          style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
        >
          {y}
        </text>
      ))}
    </g>
  );
}

// ── Sprites on the stage ────────────────────────────────────────────────────

function StageSprite({
  sprite,
  costume,
  clickable,
  onClick,
}: {
  sprite: ScSpriteState;
  costume: ScCostume;
  clickable: boolean;
  onClick?: () => void;
}) {
  const natural = GLYPH_SIZE[costume.glyph];
  const fit = glyphScale(costume.glyph, sprite.width, sprite.height);
  const scale = (sprite.size / 100) * fit;
  const rotate = sprite.rotationStyle === "all-around" ? sprite.direction - 90 : 0;
  const flip =
    sprite.rotationStyle === "left-right" && sprite.direction < 0 ? -1 : 1;

  const glyph = (
    <g
      transform={`translate(${r1(px(sprite.x))} ${r1(py(sprite.y))}) rotate(${r1(
        rotate,
      )}) scale(${r1(scale * flip)} ${r1(scale)})`}
    >
      {/* The whole box takes the click: the drawing itself has gaps. */}
      <rect
        x={-natural.w / 2}
        y={-natural.h / 2}
        width={natural.w}
        height={natural.h}
        fill="transparent"
      />
      <GlyphShape costume={costume} />
    </g>
  );

  if (!clickable) return glyph;

  return (
    <g
      className="group cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label={`Click the ${sprite.name} sprite`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <rect
        x={r1(px(spriteBox(sprite).left) - 4)}
        y={r1(py(spriteBox(sprite).top) - 4)}
        width={r1(spriteBox(sprite).right - spriteBox(sprite).left + 8)}
        height={r1(spriteBox(sprite).top - spriteBox(sprite).bottom + 8)}
        rx={6}
        fill="none"
        stroke="#3d63ff"
        strokeWidth={2}
        strokeDasharray="5 4"
        className="opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-100"
      />
      {glyph}
    </g>
  );
}

// ── The stage ───────────────────────────────────────────────────────────────

function stageSummary(project: ScProject, state: ScStageState): string {
  const backdrop = project.backdrops[state.backdrop]?.name ?? "no backdrop";
  const showing = state.sprites.filter((s) => s.visible);
  const who = showing.map(
    (s) =>
      `${s.name} at x ${Math.round(s.x)}, y ${Math.round(s.y)}` +
      (s.bubble ? `, ${s.bubble.kind === "say" ? "saying" : "thinking"} “${s.bubble.text}”` : ""),
  );
  return `Scratch stage, backdrop ${backdrop}. ${
    who.length > 0 ? who.join(". ") : "No sprite is showing."
  }`;
}

export function ScratchStage({
  project,
  state,
  className,
  showGrid = false,
  onSpriteClick,
  onMouse,
  onMouseDown,
}: {
  project: ScProject;
  state: ScStageState;
  className?: string;
  /** The teacher's overlay for explaining x and y. */
  showGrid?: boolean;
  onSpriteClick?: (spriteId: string) => void;
  /** Called with the pointer in Scratch coordinates, for `mouse x` / `mouse y`. */
  onMouse?: (x: number, y: number) => void;
  onMouseDown?: (down: boolean) => void;
}) {
  const idBase = useId().replace(/:/g, "");
  const backdrop = project.backdrops[state.backdrop];

  const track = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!onMouse) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    onMouse(
      Math.round(((e.clientX - rect.left) / rect.width) * STAGE_WIDTH - STAGE_X),
      Math.round(STAGE_Y - ((e.clientY - rect.top) / rect.height) * STAGE_HEIGHT),
    );
  };

  const sound = state.sound;
  const soundOwner =
    sound && sound.sprite !== "stage"
      ? project.sprites.find((s) => s.id === sound.sprite)?.name ?? "Stage"
      : "Stage";

  return (
    <div className={cn("relative", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-ink-200 bg-white shadow-card">
        <svg
          viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
          className="absolute inset-0 h-full w-full touch-none"
          role="img"
          aria-label={stageSummary(project, state)}
          onPointerMove={track}
          onPointerDown={(e) => {
            track(e);
            onMouseDown?.(true);
          }}
          onPointerUp={() => onMouseDown?.(false)}
          onPointerLeave={() => onMouseDown?.(false)}
        >
          <BackdropBands backdrop={backdrop} idBase={idBase} />
          {showGrid && <Grid />}
          <PenLayer lines={state.pen} />
          {state.sprites.map((sprite) => {
            if (!sprite.visible) return null;
            const definition = project.sprites.find((s) => s.id === sprite.id);
            const costume =
              definition?.costumes[
                Math.min(sprite.costume, Math.max(0, definition.costumes.length - 1))
              ];
            if (!costume) return null;
            return (
              <StageSprite
                key={sprite.id}
                sprite={sprite}
                costume={costume}
                clickable={Boolean(onSpriteClick)}
                onClick={() => onSpriteClick?.(sprite.id)}
              />
            );
          })}
          {state.sprites.map((sprite) =>
            sprite.visible && sprite.bubble ? (
              <Bubble key={`bubble-${sprite.id}`} sprite={sprite} />
            ) : null,
          )}
          <Watchers variables={state.variables} />
        </svg>

        {/* The platform cannot play the book's recordings, so it says which one
            is playing — the class still hears the teacher, not silence. */}
        {sound && (
          <p className="animate-pop absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-ink-900/85 px-2.5 py-1 text-[11.5px] font-semibold text-white">
            <Volume2 className="size-3.5 shrink-0" aria-hidden />
            {soundOwner}: {sound.name}
          </p>
        )}
      </div>
    </div>
  );
}
