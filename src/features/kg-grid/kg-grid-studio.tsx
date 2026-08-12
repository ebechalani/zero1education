"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Glyph } from "./glyphs";
import { KgGrid } from "./kg-grid";
import { KG_PUZZLES, puzzleById } from "./puzzles";
import type { KgPuzzle } from "./grid-model";

/**
 * The Kindergarten grid instrument.
 *
 * Deliberately plainer than the older grades' studios: no toolbar, no speed
 * control, no score. A four-year-old gets a puzzle, big arrows and a play
 * button — and a row of pictures to choose the next puzzle, because they
 * cannot read a menu.
 */
export function KgGridStudio({
  exercise,
  onSolved,
  className,
}: {
  /** A KgPuzzle, or its id — the registry passes whatever it resolved */
  exercise?: unknown;
  onSolved?: () => void;
  className?: string;
}) {
  const initial =
    typeof exercise === "string"
      ? puzzleById(exercise)
      : ((exercise as KgPuzzle | undefined)?.id
          ? (exercise as KgPuzzle)
          : undefined);

  const [puzzle, setPuzzle] = useState<KgPuzzle>(initial ?? KG_PUZZLES[0]);
  const [done, setDone] = useState<Set<string>>(new Set());

  return (
    <div className={cn("space-y-5", className)}>
      <KgGrid
        key={puzzle.id}
        puzzle={puzzle}
        onSolved={() => {
          setDone((d) => new Set(d).add(puzzle.id));
          onSolved?.();
        }}
      />

      {/* Puzzle picker — pictures, not words */}
      <div className="rounded-2xl border-2 border-ink-100 bg-white p-3">
        <div className="flex flex-wrap justify-center gap-2.5">
          {KG_PUZZLES.map((p, i) => {
            const active = p.id === puzzle.id;
            const solved = done.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setPuzzle(p)}
                aria-label={`${p.title}${solved ? " — done" : ""}`}
                className={cn(
                  "relative flex size-16 cursor-pointer items-center justify-center rounded-2xl border-4 transition-all active:scale-95",
                  active
                    ? "border-brand-500 bg-brand-50"
                    : solved
                      ? "border-mint-400 bg-mint-50"
                      : "border-ink-200 bg-white hover:border-brand-300",
                )}
              >
                <Glyph name={p.character} className="size-11" />
                <span className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-ink-800 font-mono text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {solved && (
                  <span className="absolute -right-1.5 -bottom-1.5 flex size-6 items-center justify-center rounded-full bg-mint-500 text-[13px] font-bold text-white">
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
