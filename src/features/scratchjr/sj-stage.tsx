"use client";

import { cn } from "@/lib/utils";
import { SjSpriteArt, SJ_GLYPH_LABEL } from "./sj-sprite-art";
import {
  SJ_COLS,
  SJ_ROWS,
  type SjBackground,
  type SjSprite,
  type SjSpriteState,
} from "./sj-model";

/**
 * The ScratchJr stage.
 *
 * Twenty squares across and fifteen down, with the grid switchable — which is
 * not decoration: Grade 1 Lesson 2 and Grade 2 Lesson 2 both ask a child to
 * read a sprite's position off this grid and write it as a pair of numbers, so
 * the numbering down the side and along the top is the lesson.
 */

const CELL_W = 100 / SJ_COLS;
const CELL_H = 100 / SJ_ROWS;

/** A sprite at size 100 covers two squares each way. */
const BASE_SPAN = 2;

export function SjStage({
  background,
  sprites,
  showGrid = false,
  onTapSprite,
  onTapSquare,
  picked,
  highlight,
  className,
}: {
  background: SjBackground;
  sprites: SjSpriteState[];
  /** The lessons' grid overlay */
  showGrid?: boolean;
  /** Tapping a sprite fires its on-tap scripts */
  onTapSprite?: (id: string) => void;
  /**
   * Tapping a square answers a "where does it stop?" question. Both books
   * open their grid lessons with one, and the answer is a square, not a
   * program — so the grid itself has to be the input.
   */
  onTapSquare?: (p: { x: number; y: number }) => void;
  /** A square the child has answered with, and whether it was right */
  picked?: { x: number; y: number; right: boolean } | null;
  /** Ring a sprite, e.g. the one being edited */
  highlight?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-ink-200 bg-white",
        className,
      )}
    >
      {/* The scene, as horizontal bands */}
      {background.bands.map((band, i) => (
        <div
          key={i}
          className="absolute inset-x-0"
          style={{
            top: `${band.from * 100}%`,
            height: `${(band.to - band.from) * 100}%`,
            background: band.colour2
              ? `linear-gradient(${band.colour}, ${band.colour2})`
              : band.colour,
          }}
        />
      ))}

      {/* Scenery drawn over the bands */}
      {background.props?.map((prop, i) => (
        <div
          key={`prop-${i}`}
          className="absolute"
          style={{
            left: `${(prop.at.x - 0.5) * CELL_W}%`,
            top: `${(prop.at.y - 0.5) * CELL_H}%`,
            width: `${((prop.size ?? 100) / 100) * BASE_SPAN * CELL_W}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <SjSpriteArt glyph={prop.glyph} colour={prop.colour} className="w-full" />
        </div>
      ))}

      {/* The grid the lessons read positions off */}
      {showGrid && (
        <div className="pointer-events-none absolute inset-0">
          <svg
            viewBox={`0 0 ${SJ_COLS} ${SJ_ROWS}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            {Array.from({ length: SJ_COLS - 1 }, (_, i) => (
              <line
                key={`v${i}`}
                x1={i + 1}
                y1={0}
                x2={i + 1}
                y2={SJ_ROWS}
                stroke="#0b1120"
                strokeOpacity="0.18"
                strokeWidth="0.03"
              />
            ))}
            {Array.from({ length: SJ_ROWS - 1 }, (_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={i + 1}
                x2={SJ_COLS}
                y2={i + 1}
                stroke="#0b1120"
                strokeOpacity="0.18"
                strokeWidth="0.03"
              />
            ))}
          </svg>
          {/* Column numbers along the top, row numbers down the left */}
          {Array.from({ length: SJ_COLS }, (_, i) => (
            <span
              key={`cn${i}`}
              className="absolute font-mono text-[7px] leading-none font-bold text-ink-700/70"
              style={{ left: `${(i + 0.5) * CELL_W}%`, top: "1px", transform: "translateX(-50%)" }}
            >
              {i + 1}
            </span>
          ))}
          {Array.from({ length: SJ_ROWS }, (_, i) => (
            <span
              key={`rn${i}`}
              className="absolute font-mono text-[7px] leading-none font-bold text-ink-700/70"
              style={{ top: `${(i + 0.5) * CELL_H}%`, left: "1px", transform: "translateY(-50%)" }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}

      {/* Answering by tapping a square, for "where does it stop?" */}
      {onTapSquare && (
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${SJ_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${SJ_ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: SJ_COLS * SJ_ROWS }, (_, i) => {
            const x = (i % SJ_COLS) + 1;
            const y = Math.floor(i / SJ_COLS) + 1;
            const chosen = picked?.x === x && picked?.y === y;
            return (
              <button
                key={i}
                onClick={() => onTapSquare({ x, y })}
                aria-label={`square ${x}, ${y}`}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-brand-500/25",
                  chosen &&
                    (picked?.right
                      ? "bg-mint-500/55 ring-2 ring-mint-600 ring-inset"
                      : "bg-coral-500/45 ring-2 ring-coral-600 ring-inset"),
                )}
              />
            );
          })}
        </div>
      )}

      {/* The cast */}
      {sprites.map((sprite) => {
        if (!sprite.visible) return null;
        const span = (sprite.size / 100) * BASE_SPAN;
        const tappable = Boolean(onTapSprite);
        return (
          <div
            key={sprite.id}
            className="absolute"
            style={{
              left: `${(sprite.x - 0.5) * CELL_W}%`,
              top: `${(sprite.y - 0.5) * CELL_H}%`,
              width: `${span * CELL_W}%`,
              transform: "translate(-50%, -50%)",
              transition: "left 180ms linear, top 180ms linear, width 180ms linear",
            }}
          >
            {sprite.bubble && (
              <div
                className="absolute bottom-full left-1/2 mb-1 w-max max-w-[220px] -translate-x-1/2 rounded-xl border-2 border-ink-200 bg-white px-2.5 py-1.5 text-[12px] leading-snug font-semibold text-ink-800 shadow-card"
                role="status"
              >
                {sprite.bubble}
                <span className="absolute top-full left-1/2 -ml-1.5 border-x-6 border-t-6 border-x-transparent border-t-white" />
              </div>
            )}
            <button
              type="button"
              disabled={!tappable}
              onClick={() => onTapSprite?.(sprite.id)}
              aria-label={
                tappable
                  ? `tap ${sprite.name}`
                  : `${sprite.name}, at ${sprite.x}, ${sprite.y}`
              }
              className={cn(
                "block w-full",
                tappable && "cursor-pointer",
                highlight === sprite.id &&
                  "rounded-lg ring-3 ring-brand-500 ring-offset-1",
              )}
              style={{
                transform: `${sprite.flipped ? "scaleX(-1)" : ""} rotate(${(sprite.turn / 12) * 360}deg)`,
                transformOrigin: "center",
                transition: "transform 180ms linear",
              }}
            >
              <SjSpriteArt
                glyph={sprite.glyph}
                colour={sprite.colour}
                accent={sprite.accent}
                className="w-full"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** The stage as it looks before anything runs — for lesson cards and previews. */
export function SjStagePreview({
  background,
  sprites,
  showGrid,
  className,
}: {
  background: SjBackground;
  sprites: SjSprite[];
  showGrid?: boolean;
  className?: string;
}) {
  return (
    <SjStage
      background={background}
      showGrid={showGrid}
      className={className}
      sprites={sprites.map((s) => ({
        id: s.id,
        name: s.name,
        glyph: s.glyph,
        colour: s.colour,
        accent: s.accent,
        x: s.home.x,
        y: s.home.y,
        size: s.size,
        flipped: s.flipped,
        visible: true,
        bubble: null,
        turn: 0,
        speed: "normal",
      }))}
    />
  );
}

export { SJ_GLYPH_LABEL };
