"use client";

import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronUp,
  Play,
  RotateCcw,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Glyph, GLYPH_LABEL } from "./glyphs";
import {
  DELTA,
  isSolved,
  landingGlyph,
  walk,
  type KgCommand,
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

/** The picture on a card. Jump gets its own mark, as it does in the book. */
function CardFace({ card, className }: { card: KgCommand; className?: string }) {
  if (card === "jump") return <ChevronUp className={className} strokeWidth={3} />;
  const A = ARROWS.find((a) => a.dir === card)!;
  return <A.Icon className={className} strokeWidth={3} />;
}

const CARD_LABEL: Record<KgCommand, string> = {
  up: "move up",
  down: "move down",
  left: "move left",
  right: "move right",
  jump: "jump over",
};

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
 * The picture-grid instrument: Kindergarten's "Moving the dog" and Grade 1's
 * robot board, which are the same apparatus a year apart.
 *
 * A four-year-old drives the smallest version of this, so: every target is
 * finger-sized, the only words are spoken aloud, mistakes are never scored, and
 * the character walks slowly enough to follow with a finger.
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
  const [path, setPath] = useState<KgCommand[]>([]);
  const [step, setStep] = useState<number | null>(null);
  const [tapped, setTapped] = useState<KgGlyph | null>(null);
  const [outcome, setOutcome] = useState<"none" | "yes" | "again">("none");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedRef = useRef(false);

  const slots = puzzle.slots ?? 6;
  const isFollow = puzzle.mode === "follow-path";
  const isTrace = puzzle.mode === "trace-path";
  // The cards being walked: the child's own, or the ones the book gives.
  const shown = useMemo(
    () => (isFollow ? (puzzle.given ?? []) : path),
    [isFollow, puzzle.given, path],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Where the character stands right now: mid-walk, or back at the start.
  const run = walk(puzzle, shown);
  const trail = run.positions;
  const at = step === null ? puzzle.start : (trail[Math.min(step, trail.length - 1)] ?? puzzle.start);
  const score = puzzle.scored
    ? walk(puzzle, shown.slice(0, step === null ? 0 : step)).score
    : 0;

  /**
   * The route printed on the page, as an arrow leaving each square it passes
   * through. Trace-path lessons ask the child to read this off and write it
   * out, so it has to be legible without any words.
   */
  const drawnRoute = useMemo(() => {
    if (!isTrace || !puzzle.route) return new Map<string, KgDirection>();
    const positions = walk(puzzle, puzzle.route).positions;
    const marks = new Map<string, KgDirection>();
    for (let i = 0; i < positions.length - 1; i++) {
      const a = positions[i];
      const b = positions[i + 1];
      const dir = (Object.keys(DELTA) as KgDirection[]).find(
        (d) => a.x + DELTA[d].dx === b.x && a.y + DELTA[d].dy === b.y,
      );
      if (dir) marks.set(`${a.x},${a.y}`, dir);
    }
    return marks;
  }, [isTrace, puzzle]);

  const finish = useCallback(() => {
    const won = isSolved(puzzle, shown);
    setOutcome(won ? "yes" : "again");
    speak(won ? "Yes! You did it." : "Not yet. Try again.");
    if (won && !solvedRef.current) {
      solvedRef.current = true;
      onSolved?.();
    }
  }, [puzzle, shown, onSolved]);

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
        if (!isFollow) finish();
        return;
      }
      setStep(i);
      timer.current = setTimeout(tick, 620);
    };
    timer.current = setTimeout(tick, 620);
  }, [puzzle, shown, isFollow, finish]);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPath([]);
    setStep(null);
    setTapped(null);
    setOutcome("none");
  };

  const addCard = (card: KgCommand) => {
    if (isFollow || path.length >= slots) return;
    setOutcome("none");
    setStep(null);
    setPath((p) => [...p, card]);
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

  // Big squares for a four-year-old's four-column board; smaller ones for
  // Grade 1's ten-column board, which still has to fit a phone.
  const cellSize = `min(${Math.floor(84 / puzzle.width)}vw, ${Math.floor(
    520 / Math.max(puzzle.width, puzzle.height),
  )}px)`;
  const big = puzzle.width <= 6;

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
              const routeDir = drawnRoute.get(`${x},${y}`);
              const RouteIcon = routeDir
                ? ARROWS.find((a) => a.dir === routeDir)!.Icon
                : null;
              return (
                <button
                  key={`${x},${y}`}
                  disabled={!tappable}
                  onClick={() => tapCell(cell.glyph)}
                  aria-label={
                    cell.glyph ? GLYPH_LABEL[cell.glyph] : `empty square ${x + 1}, ${y + 1}`
                  }
                  className={cn(
                    "relative flex items-center justify-center border-2 transition-all",
                    big ? "rounded-xl" : "rounded-md",
                    cell.blocked
                      ? "border-ink-300 bg-ink-200"
                      : walked && step !== null
                        ? "border-mint-500 bg-mint-100"
                        : routeDir
                          ? "border-bit-200 bg-bit-50"
                          : "border-ink-100 bg-white",
                    tappable && "cursor-pointer hover:border-brand-400 hover:bg-brand-50",
                    tapped && cell.glyph === tapped && "border-brand-500 bg-brand-100",
                    isGoal && "border-bit-500 bg-bit-50",
                  )}
                >
                  {cell.glyph && <Glyph name={cell.glyph} className="size-[78%]" />}
                  {/* Points a child can see before deciding to go that way */}
                  {cell.points ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Star className="size-[54%] text-amber-400" fill="currentColor" />
                      <span className="absolute text-[10px] font-black text-amber-900">
                        {cell.points}
                      </span>
                    </span>
                  ) : null}
                  {RouteIcon && !here && (
                    <RouteIcon
                      className="absolute size-[52%] text-bit-400"
                      strokeWidth={3}
                    />
                  )}
                  {here && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Glyph
                        name={puzzle.character}
                        className="size-[88%] drop-shadow-[0_2px_6px_rgba(11,17,32,0.3)] transition-transform"
                        title={GLYPH_LABEL[puzzle.character]}
                      />
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>

        {/* Cards and controls */}
        <div className="w-full max-w-xs">
          {puzzle.scored && (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-amber-100 px-4 py-3">
              <span className="flex items-center gap-2 text-[15px] font-bold text-amber-800">
                <Star className="size-5" fill="currentColor" />
                Points
              </span>
              <span className="text-2xl font-black tabular-nums text-amber-900">
                {score}
              </span>
            </div>
          )}

          {!isFollow && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {ARROWS.map(({ dir, Icon, label }) => (
                  <button
                    key={dir}
                    onClick={() => addCard(dir)}
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

              {puzzle.allowJump && (
                <button
                  onClick={() => addCard("jump")}
                  disabled={path.length >= slots}
                  aria-label="jump over the cube"
                  className={cn(
                    "mt-2.5 flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-4 border-violet-500 bg-violet-100 text-violet-700 transition-all",
                    "hover:bg-violet-500 hover:text-white active:scale-95",
                    "disabled:cursor-default disabled:opacity-40",
                  )}
                >
                  <ChevronUp className="size-9" strokeWidth={3} />
                  <span className="text-lg font-black">JUMP</span>
                </button>
              )}

              {/* The path the child has built */}
              <div className="mt-4 flex min-h-16 flex-wrap gap-1.5 rounded-2xl border-2 border-dashed border-ink-200 p-2">
                {path.length === 0 && (
                  <span className="m-auto text-[13px] text-ink-300">
                    {isTrace ? "Write the path with cards" : "Tap the arrows"}
                  </span>
                )}
                {path.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => setPath((p) => p.filter((_, j) => j !== i))}
                    aria-label={`remove card ${i + 1}`}
                    className={cn(
                      "flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 transition-colors",
                      step !== null && i < (step ?? 0)
                        ? "border-mint-500 bg-mint-100 text-mint-700"
                        : card === "jump"
                          ? "border-violet-500 bg-white text-violet-700 hover:border-coral-500 hover:bg-coral-100"
                          : "border-brand-300 bg-white text-brand-700 hover:border-coral-500 hover:bg-coral-100",
                    )}
                  >
                    <CardFace card={card} className="size-6" />
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2.5">
            <button
              onClick={play}
              disabled={!isFollow && path.length === 0}
              className="flex h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint-500 text-white transition-all hover:bg-mint-600 active:scale-95 disabled:opacity-40"
              aria-label={isFollow ? "watch it walk" : "play"}
            >
              <Play className="size-8" fill="currentColor" />
            </button>
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
