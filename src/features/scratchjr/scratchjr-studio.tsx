"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Flag, Grid3x3, RotateCcw, Square, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkExercise, type SjCheckResult, type SjExercise } from "./sj-check";
import { SjEditor } from "./sj-editor";
import { finalPosition, runProject, SJ_STEP_MS, type SjRun } from "./sj-engine";
import { SjArt, SJ_BLOCK_NAME, type SjArtKind } from "./sj-blocks";
import { SjStage } from "./sj-stage";
import { SjSpriteArt } from "./sj-sprite-art";
import { sjExerciseById } from "./exercises";
import {
  sjId,
  sjInitialStage,
  sjSetScripts,
  SJ_BLOCK_CATEGORY,
  SJ_CATEGORIES,
  type SjProject,
  type SjScript,
  type SjSpriteState,
} from "./sj-model";

/**
 * The ScratchJr instrument.
 *
 * The layout follows the app a child will meet on a tablet: the stage on top
 * with the green flag beside it, the cast underneath, and the blocks below
 * that. Not Scratch's — ScratchJr puts scripts in horizontal rows and the
 * books are printed with its screenshots.
 */
export function ScratchJrStudio({
  exercise,
  onSolved,
  className,
}: {
  /** An SjExercise, or its id — the registry passes whatever it resolved. */
  exercise?: unknown;
  onSolved?: () => void;
  className?: string;
}) {
  const task = useMemo<SjExercise | undefined>(() => {
    if (typeof exercise === "string") return sjExerciseById(exercise);
    const maybe = exercise as SjExercise | undefined;
    return maybe?.id ? maybe : undefined;
  }, [exercise]);

  const [project, setProject] = useState<SjProject>(
    () => task?.project ?? blankProject(),
  );
  const [spriteId, setSpriteId] = useState<string>(
    () => (task?.project ?? blankProject()).sprites[0].id,
  );
  const [scriptIndex, setScriptIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(Boolean(task?.check.summary));
  const [run, setRun] = useState<SjRun | null>(null);
  const [frame, setFrame] = useState(0);
  const [result, setResult] = useState<SjCheckResult | null>(null);
  const [picked, setPicked] = useState<{ x: number; y: number; right: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const solved = useRef(false);

  /** Where the printed script actually finishes — the answer, never stored. */
  const answer = useMemo(
    () => (task?.predict ? finalPosition(task.project, task.predict.sprite) : null),
    [task],
  );

  const sprite = project.sprites.find((s) => s.id === spriteId) ?? project.sprites[0];
  const script: SjScript = sprite.scripts[scriptIndex] ?? {
    id: sjId("s"),
    trigger: { id: sjId("t"), kind: "on-flag" },
    blocks: [],
  };

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRun(null);
    setFrame(0);
  }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const play = useCallback(
    (start: Parameters<typeof runProject>[1] = { kind: "flag" }) => {
      if (timer.current) clearInterval(timer.current);
      setResult(null);
      const next = runProject(project, start);
      setRun(next);
      setFrame(0);
      let i = 0;
      timer.current = setInterval(() => {
        i += 1;
        if (i >= next.frames.length) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          return;
        }
        setFrame(i);
      }, SJ_STEP_MS.normal);
    },
    [project],
  );

  /** What the stage shows: a frame mid-run, or the project at rest. */
  const shown: SjSpriteState[] = run
    ? (run.frames[Math.min(frame, run.frames.length - 1)]?.sprites ??
       sjInitialStage(project).sprites)
    : sjInitialStage(project).sprites;

  const runningId = run
    ? (run.frames[Math.min(frame, run.frames.length - 1)]?.active[sprite.id] ?? null)
    : null;

  /**
   * Applied against the project as it stands, not as it was rendered: several
   * taps of + land in one React batch, and reading the old script would throw
   * all but the first of them away.
   */
  const setScript = (update: (s: SjScript) => SjScript) => {
    setProject((prev) => {
      const target = prev.sprites.find((s) => s.id === sprite.id);
      if (!target) return prev;
      const scripts = [...target.scripts];
      scripts[scriptIndex] = update(scripts[scriptIndex] ?? script);
      return sjSetScripts(prev, sprite.id, scripts);
    });
    setRun(null);
    setResult(null);
  };

  const check = () => {
    if (!task) return;
    const outcome = checkExercise(task, project);
    setResult(outcome);
    if (outcome.passed && !solved.current) {
      solved.current = true;
      onSolved?.();
    }
  };

  const reset = () => {
    stop();
    setResult(null);
    setProject(task?.project ?? blankProject());
  };

  return (
    <div className={cn("grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", className)}>
      {/* The stage and its cast */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => play()}
            aria-label="green flag — run the scripts"
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-mint-500 text-white transition-all hover:bg-mint-600 active:scale-95"
          >
            <Flag className="size-6" fill="currentColor" />
          </button>
          <button
            onClick={stop}
            aria-label="stop"
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-coral-500 text-white transition-all hover:bg-coral-600 active:scale-95"
          >
            <Square className="size-5" fill="currentColor" />
          </button>
          <button
            onClick={() => setShowGrid((g) => !g)}
            aria-pressed={showGrid}
            aria-label="show the grid"
            className={cn(
              "flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 transition-all active:scale-95",
              showGrid
                ? "border-brand-500 bg-brand-100 text-brand-700"
                : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50",
            )}
          >
            <Grid3x3 className="size-5" />
          </button>
          <button
            onClick={reset}
            aria-label="start again"
            className="ml-auto flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 active:scale-95"
          >
            <RotateCcw className="size-5" />
          </button>
        </div>

        <SjStage
          background={project.background}
          sprites={shown}
          showGrid={showGrid}
          highlight={task?.predict ? null : sprite.id}
          onTapSprite={task?.predict ? undefined : (id) => play({ kind: "tap", spriteId: id })}
          picked={picked}
          onTapSquare={
            task?.predict && answer
              ? (p) => {
                  const right = p.x === answer.x && p.y === answer.y;
                  setPicked({ ...p, right });
                  if (right && !solved.current) {
                    solved.current = true;
                    onSolved?.();
                  }
                }
              : undefined
          }
        />

        {/* The cast — tap one to program it */}
        <div className="flex flex-wrap gap-2">
          {project.sprites.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSpriteId(s.id);
                setScriptIndex(0);
              }}
              aria-label={`program ${s.name}`}
              aria-pressed={s.id === sprite.id}
              className={cn(
                "flex w-16 cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 p-1.5 transition-all active:scale-95",
                s.id === sprite.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-200 bg-white hover:border-brand-300",
              )}
            >
              <SjSpriteArt glyph={s.glyph} colour={s.colour} accent={s.accent} className="size-9" />
              <span className="truncate text-[10px] font-bold text-ink-600">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* The blocks */}
      <div className="space-y-3">
        {task && (
          <div className="rounded-2xl border-2 border-bit-200 bg-bit-50 p-3.5">
            <p className="font-display text-[15px] font-bold text-ink-900">{task.title}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-ink-600">{task.brief}</p>
          </div>
        )}

        {/* Which of this sprite's scripts is being edited */}
        {sprite.scripts.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {sprite.scripts.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setScriptIndex(i)}
                aria-pressed={i === scriptIndex}
                className={cn(
                  "cursor-pointer rounded-lg border-2 px-3 py-1.5 text-[12px] font-bold",
                  i === scriptIndex
                    ? "border-brand-500 bg-brand-100 text-brand-700"
                    : "border-ink-200 bg-white text-ink-500",
                )}
              >
                Script {i + 1}
              </button>
            ))}
          </div>
        )}

        {task?.predict ? (
          /* The script is printed, not written: the child reads it and names
             the square. Showing the editor here would invite them to change
             the very thing they are being asked to read. */
          <SjReadOnlyScript script={script} runningId={runningId} />
        ) : (
          <SjEditor
            key={`${sprite.id}-${scriptIndex}`}
            script={script}
            onChange={setScript}
            runningId={runningId}
            allowed={task?.allowed}
          />
        )}

        {task?.predict && (
          <div
            className={cn(
              "rounded-2xl border-2 p-3.5 text-[14px] font-semibold",
              picked
                ? picked.right
                  ? "border-mint-500 bg-mint-100 text-mint-700"
                  : "border-amber-500 bg-amber-100 text-amber-700"
                : "border-ink-200 bg-white text-ink-500",
            )}
            role="status"
          >
            {!picked
              ? "Tap the square where you think it stops."
              : picked.right
                ? `Yes — it stops at (${picked.x}, ${picked.y}). Tap the green flag to watch it.`
                : `Not (${picked.x}, ${picked.y}). Count the squares again, one block at a time.`}
          </div>
        )}

        {task && !task.predict && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Button onClick={check} icon={<Check />}>
                Check my work
              </Button>
              <span className="text-[12.5px] text-ink-400">{task.check.summary}</span>
            </div>

            {result && (
              <div
                className={cn(
                  "animate-pop rounded-2xl border-2 p-3.5",
                  result.passed
                    ? "border-mint-500 bg-mint-100"
                    : "border-amber-500 bg-amber-100",
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-2 text-[15px] font-bold",
                    result.passed ? "text-mint-700" : "text-amber-700",
                  )}
                >
                  {result.passed ? <Check className="size-5" /> : <X className="size-5" />}
                  {result.passed ? "That works!" : "Not yet — look at what happened"}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {result.trials.flatMap((t) =>
                    t.assertions
                      .filter((a) => !a.passed || result.passed)
                      .map((a, i) => (
                        <li
                          key={`${t.trialId}-${i}`}
                          className="flex items-start gap-2 text-[13px] text-ink-700"
                        >
                          <span className={a.passed ? "text-mint-600" : "text-amber-600"}>
                            {a.passed ? "✓" : "•"}
                          </span>
                          {a.detail}
                        </li>
                      )),
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A script as printed on the page: readable, runnable, not editable.
 *
 * Used by the "where does it stop?" tasks, where changing the blocks would
 * change the answer the child is being asked to work out.
 */
function SjReadOnlyScript({
  script,
  runningId,
}: {
  script: SjScript;
  runningId: string | null;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink-200 bg-white p-2.5">
      <p className="mb-2 text-[11px] font-bold tracking-wide text-ink-400 uppercase">
        The script, as it is printed
      </p>
      <div className="thin-scroll flex items-center gap-1 overflow-x-auto pb-1">
        <SjBlockChip kind={script.trigger.kind} />
        <span className="h-10 w-px shrink-0 bg-ink-200" />
        {script.blocks.map((b) => (
          <SjBlockChip
            key={b.id}
            kind={b.kind}
            n={"n" in b ? b.n : undefined}
            running={runningId === b.id}
          />
        ))}
      </div>
    </div>
  );
}

function SjBlockChip({
  kind,
  n,
  running,
}: {
  kind: SjArtKind;
  n?: number;
  running?: boolean;
}) {
  const { hex, ink } = SJ_CATEGORIES[SJ_BLOCK_CATEGORY[kind]];
  return (
    <span
      role="img"
      aria-label={SJ_BLOCK_NAME[kind] + (n !== undefined ? ` ${n}` : "")}
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center rounded-xl",
        running && "ring-3 ring-ink-900 ring-offset-2",
      )}
      style={{ background: hex, color: ink }}
    >
      <SjArt kind={kind} className="size-8" />
      {n !== undefined && (
        <span className="absolute right-0.5 bottom-0.5 flex min-w-5 items-center justify-center rounded-md bg-white px-1 font-mono text-[11px] font-black text-ink-900 tabular-nums">
          {n}
        </span>
      )}
    </span>
  );
}

/** What ScratchJr opens on: a blank white stage and the cat it calls TIC. */
function blankProject(): SjProject {
  return {
    background: { id: "blank", name: "Blank", bands: [{ from: 0, to: 1, colour: "#FFFFFF" }] },
    sprites: [
      {
        id: "tic",
        name: "TIC",
        glyph: "cat",
        home: { x: 6, y: 8 },
        size: 100,
        flipped: false,
        scripts: [
          { id: sjId("s"), trigger: { id: sjId("t"), kind: "on-flag" }, blocks: [] },
        ],
      },
    ],
  };
}
