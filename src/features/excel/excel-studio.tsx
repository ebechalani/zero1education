"use client";

/**
 * Chapter 2 · Microsoft Excel — the instrument itself.
 *
 * Everything underneath is already written: `sheet-model.ts` holds the grid and
 * the formula engine, `sheet-grid.tsx` draws the Home ribbon, the formula bar
 * and the cells, `exercises.ts` carries the book's own tables and checks them.
 * This file is the panel that puts those three together and gives each of its
 * two audiences what it needs.
 *
 * A teacher on a projector gets a dark toolbar with one teaching control:
 * **Trace formulas** walks the sheet one calculation at a time, at a speed the
 * class can follow, saying out loud what each cell holds and what it works out
 * to. It is the spreadsheet's equivalent of stepping through a program.
 *
 * A student gets the book's task, the sheet it starts from, and a Check that
 * judges the RESULT — the value a cell ends up showing and, where the lesson is
 * about formatting, the format it carries. A total may be reached with
 * =C5+D5+E5 or with =SUM(C5:E5), because page 30 prints both. Every failing
 * line is written in the student's own words by `checkSheet`, and each one
 * carries a button that walks the selection over to the cell it is talking
 * about.
 */

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  BookOpenCheck,
  CheckCircle2,
  CircleDashed,
  Eye,
  Gauge,
  Info,
  Lightbulb,
  ListRestart,
  Play,
  Sigma,
  Square,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { checkSheet, type SheetCheckResult, type XlExercise } from "./exercises";
import {
  CellReadout,
  FormulaBar,
  SheetGrid,
  SheetRibbon,
  useSheetController,
} from "./sheet-grid";
import {
  BOOK_TODAY,
  FUNCTIONS,
  FUNCTION_HELP,
  makeSheet,
  parseRef,
  todaySerial,
  type EvalContext,
  type FunctionName,
  type Sheet,
} from "./sheet-model";

type Pace = "slow" | "normal" | "fast";

/** How long the class gets to look at one cell while the sheet is traced. */
const SPEEDS: { id: Pace; label: string; hint: string; ms: number }[] = [
  {
    id: "slow",
    label: "Slow",
    hint: "One formula every 2.5 seconds — good for explaining",
    ms: 2500,
  },
  { id: "normal", label: "Normal", hint: "One formula every 1.2 seconds", ms: 1200 },
  { id: "fast", label: "Fast", hint: "Straight down the sheet", ms: 550 },
];

/** Free exploration opens on a small empty sheet a teacher can type into. */
const blankSheet = (): Sheet =>
  makeSheet({ name: "Sheet1", rowCount: 16, colCount: 8 });

/**
 * What TODAY() answers with.
 *
 * The date never changes while the studio is open, so there is nothing to
 * subscribe to; what this buys is a different answer on the prerendered page
 * (the date printed in the book) and in the browser (the day the student is
 * actually working on), with no mismatch in between.
 */
const noChanges = () => () => {};
const realToday = () => todaySerial();
const printedToday = () => BOOK_TODAY;

interface TraceStep {
  ref: string;
  row: number;
  col: number;
  raw: string;
}

export function ExcelStudio({
  exercise,
  onSolved,
  className,
}: {
  /** When present, the studio runs the book's task and checks it. */
  exercise?: XlExercise;
  /** Called once, the first time the sheet passes every task. */
  onSolved?: () => void;
  className?: string;
}) {
  // The sheet and the check share one reading of "today", so a cell holding
  // =TODAY() is judged against the day the student is sitting at the computer.
  const today = useSyncExternalStore(noChanges, realToday, printedToday);
  const ctx = useMemo<EvalContext>(() => ({ today }), [today]);

  const starter = useMemo<Sheet>(
    () => exercise?.starter ?? blankSheet(),
    [exercise],
  );
  const ctl = useSheetController(starter, ctx);

  const [speed, setSpeed] = useState<Pace>("normal");
  const [trace, setTrace] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [verdict, setVerdict] = useState<SheetCheckResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [loaded, setLoaded] = useState<Sheet>(starter);
  const gridWrap = useRef<HTMLDivElement>(null);

  const { reset: resetSheet, select, beginEdit } = ctl;

  /** Select a cell and, if it is off screen, bring it into view. */
  const reveal = useCallback(
    (ref: string) => {
      const addr = parseRef(ref);
      if (!addr) return;
      select(addr.row, addr.col);
      gridWrap.current
        ?.querySelector<HTMLElement>(`[role="gridcell"][aria-label^="${ref} "]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
    [select],
  );

  /** Every formula in the sheet, in reading order: across, then down. */
  const traceSteps = useMemo<TraceStep[]>(() => {
    const steps: TraceStep[] = [];
    for (const [ref, cell] of Object.entries(ctl.sheet.cells)) {
      if (!cell.raw.startsWith("=")) continue;
      const addr = parseRef(ref);
      if (addr) steps.push({ ref, row: addr.row, col: addr.col, raw: cell.raw });
    }
    return steps.sort((a, b) => a.row - b.row || a.col - b.col);
  }, [ctl.sheet]);

  const pace = SPEEDS.find((s) => s.id === speed)?.ms ?? 1200;

  // The trace: one cell per tick, each one selected so the formula bar, the
  // status bar and the read-out all say what it holds.
  useEffect(() => {
    if (trace === null) return;
    const step = traceSteps[trace];
    if (step) reveal(step.ref);
    // The last formula — or a formula deleted while the trace was running —
    // ends the walk instead of stepping past the end of the sheet.
    const id = window.setTimeout(
      () =>
        setTrace((current) =>
          current === null || !step || current + 1 >= traceSteps.length
            ? null
            : current + 1,
        ),
      step ? pace : 0,
    );
    return () => window.clearTimeout(id);
  }, [trace, traceSteps, reveal, pace]);

  // Reset only asks twice for a few seconds — long enough to mean it.
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(id);
  }, [armed]);

  // Being handed a different exercise starts everything clean — React's own
  // way of adjusting state when a prop changes, so the student never sees one
  // frame of somebody else's sheet.
  if (loaded !== starter) {
    setLoaded(starter);
    resetSheet(starter);
    setTrace(null);
    setVerdict(null);
    setHintsShown(0);
    setShowSolution(false);
    setSolved(false);
  }

  const startOver = () => {
    setTrace(null);
    setVerdict(null);
    resetSheet(starter);
  };

  const runCheck = () => {
    if (!exercise) return;
    setTrace(null);
    const result = checkSheet(exercise.check, ctl.sheet, ctx);
    setVerdict(result);
    if (result.passed && !solved) {
      setSolved(true);
      onSolved?.();
    }
  };

  const tracing = trace !== null;
  const current = trace === null ? null : traceSteps[trace];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-900 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          Excel
        </span>
        {exercise && <Chip tone="mint">{exercise.title}</Chip>}
        {exercise && (
          <Chip tone="ink" className="hidden sm:inline-flex">
            Book page {exercise.page}
          </Chip>
        )}

        <span className="ml-auto flex flex-wrap items-center gap-2">
          {/* Speed — the teaching control */}
          <span className="flex items-center overflow-hidden rounded-md border border-white/15">
            <Gauge className="mx-2 size-3.5 text-ink-400" aria-hidden />
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeed(s.id)}
                title={s.hint}
                aria-label={`Trace speed: ${s.label}. ${s.hint}`}
                aria-pressed={speed === s.id}
                className={cn(
                  "cursor-pointer px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  speed === s.id
                    ? "bg-white/15 text-white"
                    : "text-ink-300 hover:bg-white/10",
                )}
              >
                {s.label}
              </button>
            ))}
          </span>

          <Button
            variant={armed ? "danger" : "inverse"}
            size="sm"
            icon={<ListRestart />}
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              setArmed(false);
              startOver();
            }}
            aria-label={
              armed
                ? "Press again to clear the sheet and start from the beginning"
                : "Reset the sheet to how it started"
            }
            title={
              armed
                ? "Press again and everything you typed goes back to the start"
                : "Put the sheet back to how it started"
            }
          >
            {armed ? "Press again" : "Reset"}
          </Button>

          {tracing ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Square />}
              onClick={() => setTrace(null)}
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="world"
              size="sm"
              icon={<Play />}
              onClick={() => setTrace(0)}
              disabled={traceSteps.length === 0}
              title={
                traceSteps.length === 0
                  ? "There is no formula in this sheet yet. A formula starts with the = sign."
                  : traceSteps.length === 1
                    ? "Stop on the one formula of this sheet and read it out"
                    : `Walk through the ${traceSteps.length} formulas of this sheet, one at a time`
              }
            >
              Trace formulas
            </Button>
          )}
        </span>
      </div>

      {/* The book's task */}
      {exercise && (
        <div className="border-b border-ink-100 bg-mint-100/70 px-4 py-3">
          <p className="text-[13.5px] leading-relaxed text-ink-700">
            {exercise.brief}
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-500">
            <BookOpenCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {exercise.check.summary}
          </p>
          {exercise.alsoInExcel && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-[12.5px] leading-relaxed text-amber-700">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {exercise.alsoInExcel}
            </p>
          )}
        </div>
      )}

      {/* The sheet | what the sheet says */}
      <div className="grid lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 border-b border-ink-100 lg:border-r lg:border-b-0">
          <SheetRibbon ctl={ctl} />
          <FormulaBar ctl={ctl} />
          <div ref={gridWrap}>
            <SheetGrid ctl={ctl} height={470} />
          </div>
        </div>

        <div className="space-y-4 p-4">
          <section>
            <h3 className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
              This cell
            </h3>
            <div className="mt-1.5">
              <CellReadout ctl={ctl} />
            </div>
          </section>

          {/* The formulas, and the trace walking through them */}
          <section>
            <h3 className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
              <Sigma className="size-3" aria-hidden />
              Formulas in this sheet ({traceSteps.length})
            </h3>
            <p className="sr-only" role="status" aria-live="polite">
              {current
                ? `Tracing ${current.ref}, formula ${(trace ?? 0) + 1} of ${traceSteps.length}.`
                : ""}
            </p>
            {traceSteps.length === 0 ? (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
                No formula yet. A formula always starts with the = sign, and it
                never contains spaces — try{" "}
                <span className="font-mono text-ink-700">=SUM(C5:E5)</span>.
              </p>
            ) : (
              <ul className="thin-scroll mt-1.5 max-h-44 space-y-0.5 overflow-y-auto pr-1">
                {traceSteps.map((step, i) => {
                  const active = trace === i;
                  return (
                    <li key={step.ref}>
                      <button
                        type="button"
                        onClick={() => {
                          setTrace(null);
                          reveal(step.ref);
                        }}
                        aria-label={`Go to cell ${step.ref}, which holds ${step.raw}`}
                        className={cn(
                          "flex w-full cursor-pointer items-baseline gap-2 rounded px-2 py-1 text-left transition-colors",
                          active
                            ? "bg-ink-900 text-white"
                            : "hover:bg-ink-50 text-ink-600",
                        )}
                      >
                        <span
                          className={cn(
                            "tnum w-9 shrink-0 font-mono text-[11.5px] font-bold",
                            active ? "text-white" : "text-ink-900",
                          )}
                        >
                          {step.ref}
                        </span>
                        <span className="truncate font-mono text-[11.5px]">
                          {step.raw}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {tracing && (
              <p className="mt-1.5 text-[11.5px] text-ink-400">
                Tracing at {SPEEDS.find((s) => s.id === speed)?.label.toLowerCase()}{" "}
                speed — press Stop whenever you want to talk about one cell.
              </p>
            )}
          </section>

          {/* The chapter's functions, one click away from the selected cell */}
          <details className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
            <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-700">
              The functions this chapter uses
            </summary>
            <ul className="thin-scroll mt-2 max-h-56 space-y-0.5 overflow-y-auto pr-1">
              {FUNCTIONS.map((fn) => (
                <li key={fn}>
                  <button
                    type="button"
                    onClick={() => insertFunction(beginEdit, fn)}
                    aria-label={`Start the formula ${seedFor(fn)} in cell ${ctl.activeRef}`}
                    title={`Start it in ${ctl.activeRef}`}
                    className="w-full cursor-pointer rounded px-2 py-1 text-left hover:bg-white"
                  >
                    <span className="font-mono text-[11.5px] font-bold text-ink-900">
                      {fn}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-500">
                      {FUNCTION_HELP[fn]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* Exercise footer */}
      {exercise && (
        <div className="border-t border-ink-100 p-4">
          {verdict && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "animate-pop mb-3 rounded-lg px-4 py-3",
                verdict.passed ? "bg-mint-100" : "bg-coral-100",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  verdict.passed ? "text-mint-700" : "text-coral-700",
                )}
              >
                {verdict.passed ? (
                  <>
                    <CheckCircle2 className="size-4.5" aria-hidden /> Every task is
                    done — well done.
                  </>
                ) : (
                  <>
                    <XCircle className="size-4.5" aria-hidden /> Not yet — here is
                    what to look at.
                  </>
                )}
              </p>
              <ul className="mt-2 space-y-2">
                {verdict.tasks.map((task) => (
                  <li key={task.id}>
                    <p className="flex items-start gap-2 text-[13px] font-semibold text-ink-800">
                      {task.passed ? (
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-mint-600"
                          aria-hidden
                        />
                      ) : (
                        <CircleDashed
                          className="mt-0.5 size-3.5 shrink-0 text-coral-600"
                          aria-hidden
                        />
                      )}
                      {task.label}
                    </p>
                    {!task.passed && (
                      <ul className="mt-1 ml-5.5 space-y-1">
                        {task.assertions
                          .filter((a) => !a.passed)
                          .slice(0, 2)
                          .map((a, i) => {
                            const ref = refInDetail(a.detail);
                            return (
                              <li
                                key={i}
                                className="text-[12.5px] leading-relaxed text-ink-700"
                              >
                                {a.detail}
                                {ref && (
                                  <button
                                    type="button"
                                    onClick={() => reveal(ref)}
                                    aria-label={`Go to cell ${ref}`}
                                    className="ml-1 cursor-pointer rounded px-1 text-[11.5px] font-semibold text-ink-500 underline underline-offset-2 hover:text-ink-900"
                                  >
                                    Show me {ref}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hintsShown > 0 && (
            <div className="mb-3 space-y-1.5">
              {exercise.hints.slice(0, hintsShown).map((h, i) => (
                <p
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-bit-200 bg-bit-50 px-3 py-2 text-[13px] leading-relaxed text-ink-700"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-bit-600" aria-hidden />
                  {h}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={runCheck} icon={<BookOpenCheck />}>
              Check my sheet
            </Button>
            {hintsShown < exercise.hints.length && (
              <Button
                variant="secondary"
                icon={<Lightbulb />}
                onClick={() => setHintsShown((h) => h + 1)}
              >
                Hint {hintsShown + 1}/{exercise.hints.length}
              </Button>
            )}
            {hintsShown >= exercise.hints.length && !showSolution && (
              <Button
                variant="ghost"
                icon={<Eye />}
                onClick={() => {
                  setTrace(null);
                  setVerdict(null);
                  setShowSolution(true);
                  resetSheet(exercise.solution);
                }}
              >
                Show me one answer
              </Button>
            )}
            {showSolution && (
              <span className="text-[12.5px] text-ink-400">
                This is one correct answer — yours may look different and still be
                right. Press Trace formulas to walk through it cell by cell.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** TODAY() takes nothing between its brackets; everything else waits for a range. */
const seedFor = (fn: FunctionName): string =>
  fn === "TODAY" ? "=TODAY()" : `=${fn}(`;

const insertFunction = (
  beginEdit: (seed?: string) => void,
  fn: FunctionName,
): void => beginEdit(seedFor(fn));

const REF_IN_TEXT = /\b([A-Z]{1,3}[0-9]{1,4})\b/;

/**
 * The address a failing line is talking about, so the student can be taken
 * there. `checkSheet` writes "<what the task is> — <what the sheet says>", and
 * the cell that is wrong lives in the second half.
 */
function refInDetail(detail: string): string | null {
  const dash = detail.indexOf(" — ");
  const parts = dash < 0 ? [detail] : [detail.slice(dash + 3), detail];
  for (const part of parts) {
    const found = REF_IN_TEXT.exec(part);
    if (found && parseRef(found[1])) return found[1];
  }
  return null;
}
