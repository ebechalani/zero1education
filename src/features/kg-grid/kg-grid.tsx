"use client";

import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Play,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Glyph, GLYPH_LABEL } from "./glyphs";
import {
  landingGlyph,
  reachesGoal,
  walk,
  type KgDirection,
  type KgGlyph,
  type KgPuzzle,
} from "./grid-model";

const ARROWS: { dir: KgDirection; Icon: typeof ArrowUp; label: string }[] = [
  { dir: "up", Icon: ArrowUp, label: "up" },
  { dir: "down", Icon: ArrowDown, label: "down" },
  { dir: "left", Icon: ArrowLeft, label: "left" },
  { dir: "right", Icon: ArrowRight, label: "right" },
];

/** Speaks a prompt. Silently does nothing where the browser has no voices. */
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

/**
 * "Moving the dog" — the book's picture-grid puzzle.
 *
 * A four-year-old drives this, so: every target is finger-sized, the only
 * words are spoken aloud, mistakes are never scored, and the character walks
 * slowly enough to follow with a finger.
 */
export function KgGrid({
  puzzle,
  onSolved,
  className,
}: {
  puzzle: KgPuzzle;
  onSolved?: () => void;
  className?: string;
}) {
  const [path, setPath] = useState<KgDirection[]>([]);
  const [step, setStep] = useState<number | null>(null);
  const [tapped, setTapped] = useState<KgGlyph | null>(null);
  const [outcome, setOutcome] = useState<"none" | "yes" | "again">("none");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedRef = useRef(false);

  const slots = puzzle.slots ?? 6;
  const isFollow = puzzle.mode === "follow-path";
  // The arrows being walked: the child's own, or the ones the book gives.
  const shown = useMemo(
    () => (isFollow ? (puzzle.given ?? []) : path),
    [isFollow, puzzle.given, path],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Where the character stands right now: mid-walk, or back at the start.
  const trail = walk(puzzle, shown).positions;
  const at = step === null ? puzzle.start : (trail[Math.min(step, trail.length - 1)] ?? puzzle.start);

  const play = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOutcome("none");
    const positions = walk(puzzle, shown).positions;
    let i = 0;
    setStep(0);
    const tick = () => {
      i++;
      if (i >= positions.length) {
        setStep(positions.length - 1);
        if (!isFollow) {
          const won = reachesGoal(puzzle, shown);
          setOutcome(won ? "yes" : "again");
          speak(won ? "Yes! You did it." : "Not yet. Try again.");
          if (won && !solvedRef.current) {
            solvedRef.current = true;
            onSolved?.();
          }
        }
        return;
      }
      setStep(i);
      timer.current = setTimeout(tick, 620);
    };
    timer.current = setTimeout(tick, 620);
  }, [puzzle, shown, isFollow, onSolved]);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPath([]);
    setStep(null);
    setTapped(null);
    setOutcome("none");
  };

  const addArrow = (dir: KgDirection) => {
    if (isFollow || path.length >= slots) return;
    setOutcome("none");
    setStep(null);
    setPath((p) => [...p, dir]);
  };

  const tapCell = (glyph: KgGlyph | undefined) => {
    if (!isFollow || !glyph) return;
    setTapped(glyph);
    const right = glyph === landingGlyph(puzzle);
    setOutcome(right ? "yes" : "again");
    speak(right ? "Yes! That is right." : "Not that one. Look again.");
    if (right && !solvedRef.current) {
      solvedRef.current = true;
      onSolved?.();
    }
  };

  const cellSize = `min(13vw, ${Math.floor(520 / Math.max(puzzle.width, puzzle.height))}px)`;

  return (
    <div className={cn("rounded-2xl border-2 border-ink-200 bg-white p-4 sm:p-6", className)}>
      {/* Spoken prompt — the only instruction, and it is read aloud */}
      <button
        onClick={() => speak(puzzle.spoken)}
        className="mb-5 flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-bit-100 px-5 py-4 text-left transition-colors hover:bg-bit-200"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bit-500 text-white">
          <Volume2 className="size-6" />
        </span>
        <span className="text-[17px] font-semibold text-ink-800">{puzzle.spoken}</span>
      </button>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {/* The grid */}
        <div
          className="grid gap-1.5 rounded-2xl bg-ink-50 p-2"
          style={{
            gridTemplateColumns: `repeat(${puzzle.width}, ${cellSize})`,
            gridTemplateRows: `repeat(${puzzle.height}, ${cellSize})`,
          }}
        >
          {puzzle.cells.map((row, y) =>
            row.map((cell, x) => {
              const here = at.x === x && at.y === y;
              const isGoal = puzzle.goal?.x === x && puzzle.goal?.y === y;
              const walked = trail
                .slice(0, (step ?? 0) + 1)
                .some((p) => p.x === x && p.y === y);
              const tappable = isFollow && Boolean(cell.glyph);
              return (
                <button
                  key={`${x},${y}`}
                  disabled={!tappable}
                  onClick={() => tapCell(cell.glyph)}
                  aria-label={
                    cell.glyph ? GLYPH_LABEL[cell.glyph] : `empty square ${x + 1}, ${y + 1}`
                  }
                  className={cn(
                    "relative flex items-center justify-center rounded-xl border-2 transition-all",
                    cell.blocked
                      ? "border-ink-300 bg-ink-200"
                      : walked && step !== null
                        ? "border-mint-300 bg-mint-100"
                        : "border-ink-100 bg-white",
                    tappable && "cursor-pointer hover:border-brand-400 hover:bg-brand-50",
                    tapped && cell.glyph === tapped && "border-brand-500 bg-brand-100",
                    isGoal && "border-bit-500 bg-bit-50",
                  )}
                >
                  {cell.glyph && <Glyph name={cell.glyph} className="size-[78%]" />}
                  {here && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Glyph
                        name={puzzle.character}
                        className="size-[88%] drop-shadow-[0_2px_6px_rgba(11,17,32,0.3)] transition-transform"
                        title="the dog"
                      />
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>

        {/* Arrow cards and controls */}
        <div className="w-full max-w-xs">
          {!isFollow && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {ARROWS.map(({ dir, Icon, label }) => (
                  <button
                    key={dir}
                    onClick={() => addArrow(dir)}
                    disabled={path.length >= slots}
                    aria-label={`move ${label}`}
                    className={cn(
                      "flex h-20 cursor-pointer items-center justify-center rounded-2xl border-4 border-brand-200 bg-brand-50 text-brand-700 transition-all",
                      "hover:border-brand-400 hover:bg-brand-100 active:scale-95",
                      "disabled:cursor-default disabled:opacity-40",
                    )}
                  >
                    <Icon className="size-10" strokeWidth={3} />
                  </button>
                ))}
              </div>

              {/* The path the child has built */}
              <div className="mt-4 flex min-h-16 flex-wrap gap-1.5 rounded-2xl border-2 border-dashed border-ink-200 p-2">
                {path.length === 0 && (
                  <span className="m-auto text-[13px] text-ink-300">
                    Tap the arrows
                  </span>
                )}
                {path.map((d, i) => {
                  const A = ARROWS.find((a) => a.dir === d)!;
                  return (
                    <button
                      key={i}
                      onClick={() => setPath((p) => p.filter((_, j) => j !== i))}
                      aria-label={`remove arrow ${i + 1}`}
                      className={cn(
                        "flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 transition-colors",
                        step !== null && i < (step ?? 0)
                          ? "border-mint-400 bg-mint-100 text-mint-700"
                          : "border-brand-300 bg-white text-brand-700 hover:border-coral-400 hover:bg-coral-50",
                      )}
                    >
                      <A.Icon className="size-6" strokeWidth={3} />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2.5">
            {!isFollow && (
              <button
                onClick={play}
                disabled={path.length === 0}
                className="flex h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint-500 text-white transition-all hover:bg-mint-600 active:scale-95 disabled:opacity-40"
                aria-label="play"
              >
                <Play className="size-8" fill="currentColor" />
              </button>
            )}
            {isFollow && (
              <button
                onClick={play}
                className="flex h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint-500 text-white transition-all hover:bg-mint-600 active:scale-95"
                aria-label="watch the dog walk"
              >
                <Play className="size-8" fill="currentColor" />
              </button>
            )}
            <button
              onClick={reset}
              className="flex size-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 active:scale-95"
              aria-label="start again"
            >
              <RotateCcw className="size-7" />
            </button>
          </div>

          {/* Result — a face, not a mark */}
          {outcome !== "none" && (
            <div
              className={cn(
                "animate-pop mt-4 flex items-center gap-3 rounded-2xl px-4 py-3",
                outcome === "yes" ? "bg-mint-100" : "bg-amber-100",
              )}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full text-white",
                  outcome === "yes" ? "bg-mint-500" : "bg-amber-500",
                )}
              >
                {outcome === "yes" ? <Check className="size-7" strokeWidth={3} /> : <X className="size-7" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "text-[17px] font-bold",
                  outcome === "yes" ? "text-mint-700" : "text-amber-700",
                )}
              >
                {outcome === "yes" ? "Yes!" : "Try again"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
