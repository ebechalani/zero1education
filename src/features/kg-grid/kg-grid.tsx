"use client";

import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronUp,
  CornerUpLeft,
  CornerUpRight,
  Play,
  RotateCcw,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Glyph, GLYPH_LABEL } from "./glyphs";
import {
  addressOf,
  DELTA,
  isSolved,
  isTurn,
  landingGlyph,
  landingSquare,
  readStep,
  route,
  walk,
  type KgCommand,
  type KgCount,
  type KgDirection,
  type KgGlyph,
  type KgPosition,
  type KgPuzzle,
} from "./grid-model";

const ARROWS: { dir: KgDirection; Icon: typeof ArrowUp; label: string }[] = [
  { dir: "up", Icon: ArrowUp, label: "up" },
  { dir: "down", Icon: ArrowDown, label: "down" },
  { dir: "left", Icon: ArrowLeft, label: "left" },
  { dir: "right", Icon: ArrowRight, label: "right" },
];

/** How far the character is turned on screen, so a child can see where it looks. */
const SPIN: Record<KgDirection, string> = {
  right: "rotate(0deg)",
  down: "rotate(90deg)",
  left: "rotate(180deg)",
  up: "rotate(270deg)",
};

const CARD_LABEL = (card: KgCommand): string => {
  if (card === "jump") return "jump over";
  if (card === "turn-left") return "turn left";
  if (card === "turn-right") return "turn right";
  if (card.startsWith("forward") || card.startsWith("back")) {
    const { move, count } = readStep(card as never);
    return count === 1 ? `move ${move}` : `move ${move} ${count} squares`;
  }
  return `move ${card}`;
};

/** The picture on a card. Step cards carry their count, as they do in the book. */
function CardFace({ card, className }: { card: KgCommand; className?: string }) {
  if (card === "jump") return <ChevronUp className={className} strokeWidth={3} />;
  if (card === "turn-left") return <CornerUpLeft className={className} strokeWidth={3} />;
  if (card === "turn-right") return <CornerUpRight className={className} strokeWidth={3} />;

  if (card.startsWith("forward") || card.startsWith("back")) {
    const { move, count } = readStep(card as never);
    const Icon = move === "forward" ? ArrowUp : ArrowDown;
    return (
      <span className="flex items-center gap-0.5">
        <Icon className={className} strokeWidth={3} />
        {count > 1 && <span className="text-sm font-black tabular-nums">{count}</span>}
      </span>
    );
  }
  const A = ARROWS.find((a) => a.dir === card)!;
  return <A.Icon className={className} strokeWidth={3} />;
}

const TINT: Record<NonNullable<KgPuzzle["cells"][number][number]["tint"]>, string> = {
  blue: "bg-brand-300 border-brand-500",
  green: "bg-mint-500 border-mint-700",
  red: "bg-coral-500 border-coral-700",
  yellow: "bg-bit-400 border-bit-600",
  magenta: "bg-violet-500 border-violet-700",
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
 * The picture-grid instrument: Kindergarten's dog, Grade 1's robot and Grade
 * 2's cat, which are the same apparatus three years apart.
 *
 * A four-year-old drives the smallest version, so: every target is
 * finger-sized, the only words are spoken aloud, mistakes are never scored, and
 * the character moves slowly enough to follow with a finger.
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
  const [tappedGlyph, setTappedGlyph] = useState<KgGlyph | null>(null);
  const [tappedSquare, setTappedSquare] = useState<KgPosition | null>(null);
  const [outcome, setOutcome] = useState<"none" | "yes" | "again">("none");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedRef = useRef(false);

  const slots = puzzle.slots ?? 6;
  const isFollow = puzzle.mode === "follow-path";
  const isFind = puzzle.mode === "find-square";
  const isTrace = puzzle.mode === "trace-path";
  // A given program is watched, not written.
  const watching = isFollow || isFind;
  const shown = useMemo(
    () => (watching ? (puzzle.given ?? []) : path),
    [watching, puzzle.given, path],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Where the character stands right now: mid-run, or back at the start.
  const run = walk(puzzle, shown);
  const frame = step === null ? 0 : Math.min(step, run.positions.length - 1);
  const at = run.positions[frame] ?? puzzle.start;
  const facing = run.facings[frame] ?? puzzle.facing ?? "right";
  // The total as it stands at this frame, so it counts up with the character.
  const score = step === null ? (run.scores[0] ?? 0) : (run.scores[frame] ?? 0);

  /**
   * The route printed on the page, as an arrow leaving each square it crosses.
   * Trace-path lessons ask the child to read this off and write it out, so it
   * has to be legible without any words.
   */
  const drawnRoute = useMemo(() => {
    if (!isTrace || !puzzle.route) return new Map<string, KgDirection>();
    const walked = route(walk(puzzle, puzzle.route));
    const marks = new Map<string, KgDirection>();
    for (let i = 0; i < walked.length - 1; i++) {
      const a = walked[i];
      const b = walked[i + 1];
      const dir = (Object.keys(DELTA) as KgDirection[]).find(
        (d) => a.x + DELTA[d].dx === b.x && a.y + DELTA[d].dy === b.y,
      );
      if (dir) marks.set(`${a.x},${a.y}`, dir);
    }
    return marks;
  }, [isTrace, puzzle]);

  const win = useCallback(() => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    onSolved?.();
  }, [onSolved]);

  const finish = useCallback(() => {
    const won = isSolved(puzzle, shown);
    setOutcome(won ? "yes" : "again");
    speak(won ? "Yes! You did it." : "Not yet. Try again.");
    if (won) win();
  }, [puzzle, shown, win]);

  const play = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOutcome("none");
    const frames = walk(puzzle, shown).positions;
    let i = 0;
    setStep(0);
    const tick = () => {
      i++;
      if (i >= frames.length) {
        setStep(frames.length - 1);
        if (!watching) finish();
        return;
      }
      setStep(i);
      timer.current = setTimeout(tick, 620);
    };
    timer.current = setTimeout(tick, 620);
  }, [puzzle, shown, watching, finish]);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPath([]);
    setStep(null);
    setTappedGlyph(null);
    setTappedSquare(null);
    setOutcome("none");
  };

  const addCard = (card: KgCommand) => {
    if (watching || path.length >= slots) return;
    setOutcome("none");
    setStep(null);
    setPath((p) => [...p, card]);
  };

  const tapCell = (x: number, y: number, glyph: KgGlyph | undefined) => {
    if (isFind) {
      const target = landingSquare(puzzle);
      const right = target.x === x && target.y === y;
      setTappedSquare({ x, y });
      setOutcome(right ? "yes" : "again");
      speak(
        right
          ? `Yes! It stops on ${addressOf(target)}.`
          : "Not that square. Watch it again.",
      );
      if (right) win();
      return;
    }
    if (!isFollow || !glyph) return;
    setTappedGlyph(glyph);
    const right = glyph === landingGlyph(puzzle);
    setOutcome(right ? "yes" : "again");
    speak(right ? "Yes! That is right." : "Not that one. Look again.");
    if (right) win();
  };

  // Big squares for a four-year-old's four-column board; smaller ones for the
  // older grades' ten-column board, which still has to fit a phone.
  const cellSize = `min(${Math.floor(84 / puzzle.width)}vw, ${Math.floor(
    520 / Math.max(puzzle.width, puzzle.height),
  )}px)`;
  const big = puzzle.width <= 6;
  const counts: KgCount[] = puzzle.counts ?? [1, 2, 3];

  const waypointAt = (x: number, y: number) =>
    (puzzle.waypoints ?? []).findIndex((w) => w.x === x && w.y === y);

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
        {/* The board, with its addresses down the side and across the top */}
        <div className="overflow-x-auto">
          <div
            className="grid gap-1.5 rounded-2xl bg-ink-50 p-2"
            style={{
              gridTemplateColumns: puzzle.addressed
                ? `1.6rem repeat(${puzzle.width}, ${cellSize})`
                : `repeat(${puzzle.width}, ${cellSize})`,
            }}
          >
            {puzzle.addressed && (
              <>
                <span />
                {Array.from({ length: puzzle.width }, (_, x) => (
                  <span
                    key={`col-${x}`}
                    aria-hidden
                    className="flex items-center justify-center font-mono text-[11px] font-bold text-ink-400"
                  >
                    {x + 1}
                  </span>
                ))}
              </>
            )}

            {puzzle.cells.map((row, y) => (
              <Fragment key={`row-${y}`}>
                {puzzle.addressed && (
                  <span
                    aria-hidden
                    className="flex items-center justify-center font-mono text-[11px] font-bold text-ink-400"
                  >
                    {String.fromCharCode(65 + y)}
                  </span>
                )}
                {row.map((cell, x) => {
                  const here = at.x === x && at.y === y;
                  const isGoal = puzzle.goal?.x === x && puzzle.goal?.y === y;
                  const walked = run.positions
                    .slice(0, frame + 1)
                    .some((p) => p.x === x && p.y === y);
                  const tappable = isFind || (isFollow && Boolean(cell.glyph));
                  const routeDir = drawnRoute.get(`${x},${y}`);
                  const RouteIcon = routeDir
                    ? ARROWS.find((a) => a.dir === routeDir)!.Icon
                    : null;
                  const wp = waypointAt(x, y);
                  const picked =
                    tappedSquare?.x === x && tappedSquare?.y === y;
                  return (
                    <button
                      key={`${x},${y}`}
                      disabled={!tappable}
                      onClick={() => tapCell(x, y, cell.glyph)}
                      style={{ height: cellSize }}
                      aria-label={
                        (cell.glyph ? GLYPH_LABEL[cell.glyph] : "empty square") +
                        (puzzle.addressed ? ` ${addressOf({ x, y })}` : ` ${x + 1}, ${y + 1}`)
                      }
                      className={cn(
                        "relative flex items-center justify-center border-2 transition-all",
                        big ? "rounded-xl" : "rounded-md",
                        cell.tint
                          ? TINT[cell.tint]
                          : cell.blocked
                            ? "border-ink-300 bg-ink-200"
                            : walked && step !== null
                              ? "border-mint-500 bg-mint-100"
                              : routeDir
                                ? "border-bit-200 bg-bit-50"
                                : "border-ink-100 bg-white",
                        tappable && "cursor-pointer hover:border-brand-400 hover:bg-brand-50",
                        tappedGlyph && cell.glyph === tappedGlyph && "border-brand-500 bg-brand-100",
                        picked && "border-brand-500 bg-brand-100",
                        isGoal && "border-bit-500 bg-bit-50",
                      )}
                    >
                      {cell.glyph && <Glyph name={cell.glyph} className="size-[78%]" />}
                      {/* Points a child can see before deciding to go that way */}
                      {cell.points ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Star className="size-[54%] text-amber-500" fill="currentColor" />
                          <span className="absolute text-[10px] font-black text-white">
                            {cell.points}
                          </span>
                        </span>
                      ) : null}
                      {/* Errands to run before the goal, numbered in order */}
                      {wp >= 0 && (
                        <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-ink-800 font-mono text-[9px] font-bold text-white">
                          {wp + 1}
                        </span>
                      )}
                      {RouteIcon && !here && (
                        <RouteIcon className="absolute size-[52%] text-bit-400" strokeWidth={3} />
                      )}
                      {here && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Glyph
                            name={puzzle.character}
                            className="size-[88%] drop-shadow-[0_2px_6px_rgba(11,17,32,0.3)] transition-transform duration-300"
                            title={GLYPH_LABEL[puzzle.character]}
                          />
                          {/* Which way it is looking — only where that matters */}
                          {puzzle.relative && (
                            <span
                              aria-hidden
                              className="absolute inset-0 flex items-center justify-end pr-0.5 transition-transform duration-300"
                              style={{ transform: SPIN[facing] }}
                            >
                              <ArrowRight
                                className="size-[28%] text-brand-600"
                                strokeWidth={4}
                              />
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Cards and controls */}
        <div className="w-full max-w-xs">
          {puzzle.scored && (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-amber-100 px-4 py-3">
              <span className="flex items-center gap-2 text-[15px] font-bold text-amber-700">
                <Star className="size-5" fill="currentColor" />
                Points
              </span>
              <span className="text-2xl font-black tabular-nums text-amber-700">
                {score}
              </span>
            </div>
          )}

          {!watching && (
            <>
              {puzzle.relative ? (
                <>
                  {/* Turn cards change the facing; step cards move along it. */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["turn-left", "turn-right"] as const).map((card) => (
                      <button
                        key={card}
                        onClick={() => addCard(card)}
                        disabled={path.length >= slots}
                        aria-label={CARD_LABEL(card)}
                        className={cn(
                          "flex h-16 cursor-pointer items-center justify-center rounded-2xl border-4 border-violet-500 bg-violet-100 text-violet-700 transition-all",
                          "hover:bg-violet-500 hover:text-white active:scale-95",
                          "disabled:cursor-default disabled:opacity-40",
                        )}
                      >
                        <CardFace card={card} className="size-8" />
                      </button>
                    ))}
                  </div>
                  {(["forward", "back"] as const).map((move) => (
                    <div key={move} className="mt-2.5 grid grid-cols-3 gap-2.5">
                      {counts.map((n) => {
                        const card = (n === 1 ? move : `${move}:${n}`) as KgCommand;
                        return (
                          <button
                            key={n}
                            onClick={() => addCard(card)}
                            disabled={path.length >= slots}
                            aria-label={CARD_LABEL(card)}
                            className={cn(
                              "flex h-16 cursor-pointer items-center justify-center rounded-2xl border-4 border-brand-200 bg-brand-50 text-brand-700 transition-all",
                              "hover:border-brand-400 hover:bg-brand-100 active:scale-95",
                              "disabled:cursor-default disabled:opacity-40",
                            )}
                          >
                            <CardFace card={card} className="size-7" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              ) : (
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
              )}

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

              {/* The program the child has built */}
              <div className="mt-4 flex min-h-16 flex-wrap gap-1.5 rounded-2xl border-2 border-dashed border-ink-200 p-2">
                {path.length === 0 && (
                  <span className="m-auto text-[13px] text-ink-300">
                    {isTrace ? "Write the path with cards" : "Tap the cards"}
                  </span>
                )}
                {path.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => setPath((p) => p.filter((_, j) => j !== i))}
                    aria-label={`remove ${CARD_LABEL(card)}`}
                    className={cn(
                      "flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 transition-colors",
                      step !== null && i < (step ?? 0)
                        ? "border-mint-500 bg-mint-100 text-mint-700"
                        : card === "jump" || isTurn(card)
                          ? "border-violet-500 bg-white text-violet-700 hover:border-coral-500 hover:bg-coral-100"
                          : "border-brand-300 bg-white text-brand-700 hover:border-coral-500 hover:bg-coral-100",
                    )}
                  >
                    <CardFace card={card} className="size-5" />
                  </button>
                ))}
                {slots - path.length > 0 && path.length > 0 && (
                  <span className="flex size-11 items-center justify-center rounded-xl border-2 border-dashed border-ink-200 font-mono text-[11px] text-ink-300">
                    +{slots - path.length}
                  </span>
                )}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-2.5">
            <button
              onClick={play}
              disabled={!watching && path.length === 0}
              className="flex h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint-500 text-white transition-all hover:bg-mint-600 active:scale-95 disabled:opacity-40"
              aria-label={watching ? "watch it move" : "play"}
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

          {isFind && (
            <p className="mt-3 text-center text-[13px] text-ink-400">
              Tap the square it stops on.
            </p>
          )}

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
