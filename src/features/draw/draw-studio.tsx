"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Layers,
  Lightbulb,
  ListRestart,
  Palette,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addOp,
  canRedo,
  canUndo,
  clearAll,
  clearLayer,
  commitDoc,
  createHistory,
  defaultTools,
  INK_LAYER,
  opCount,
  redo,
  setLayerVisible,
  toolMeta,
  undo,
  type DrawOp,
  type PaintTools,
  type ToolId,
} from "./canvas-model";
import {
  DrawCanvas,
  PaintRibbon,
  TOOL_ICONS,
  type DrawCanvasHandle,
} from "./draw-canvas";
import { guideUpTo, type DrawExercise } from "./exercises";

/**
 * The Cartoon Drawing studio: MS Paint on the left, the book's drawing steps
 * down the right.
 *
 * Chapter 3 teaches through pictures, so this instrument guides instead of
 * grading. The step rail carries the book's own stages — head shape, body,
 * limbs, features, costume — and the step you are on paints its construction
 * geometry faintly onto the canvas for the student to trace over. The guide
 * fades in and out with one button, because a teacher demonstrating on a
 * projector needs it strong and a student finishing a drawing needs it gone.
 *
 * Nothing here is auto-marked: drawing is not pass or fail. A step is finished
 * when the student says it is, and the work is finished when the picture is
 * saved as a PNG for their portfolio.
 */
export function DrawStudio({
  exercise,
  onSaved,
  onComplete,
  className,
}: {
  /** When absent the studio is a plain Paint sandbox — the teacher's demo mode. */
  exercise?: DrawExercise;
  /** Called with the PNG data URL when the student saves their picture. */
  onSaved?: (pngDataUrl: string) => void;
  onComplete?: () => void;
  className?: string;
}) {
  const [history, setHistory] = useState(() => createHistory());
  const [tools, setTools] = useState<PaintTools>(defaultTools);
  const [activeLayerId, setActiveLayerId] = useState(INK_LAYER);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [guideOn, setGuideOn] = useState(true);
  const [guideStrength, setGuideStrength] = useState(70);
  const [saved, setSaved] = useState<string | null>(null);
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const finishedRef = useRef(false);

  const doc = history.present;
  const marks = opCount(doc);
  const steps = exercise?.steps ?? [];
  const step = steps[stepIndex];
  const allDone = steps.length > 0 && steps.every((s) => done.includes(s.id));

  const { current, echo } = useMemo(
    () => (exercise ? guideUpTo(exercise, stepIndex) : { current: [], echo: [] }),
    [exercise, stepIndex],
  );

  const change = (next: typeof doc) => setHistory((h) => commitDoc(h, next));
  const commit = (op: DrawOp) => change(addOp(doc, activeLayerId, op));

  const reset = () => {
    setHistory(createHistory());
    setSaved(null);
    setDone([]);
    setStepIndex(0);
  };

  const activeLayer = doc.layers.find((l) => l.id === activeLayerId);
  const hiddenWork = doc.layers.some((l) => !l.visible && l.ops.length > 0);

  const save = () => {
    const png = canvasRef.current?.exportPng();
    if (!png) return;
    setSaved(png);
    onSaved?.(png);
  };

  useEffect(() => {
    if (allDone && saved && !finishedRef.current) {
      finishedRef.current = true;
      onComplete?.();
    }
  }, [allDone, saved, onComplete]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const key = e.key.toLowerCase();
    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      setHistory(undo);
    } else if (key === "y" || (key === "z" && e.shiftKey)) {
      e.preventDefault();
      setHistory(redo);
    }
  };

  return (
    <div
      onKeyDown={onKeyDown}
      className={cn(
        "overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card",
        className,
      )}
    >
      {/* Studio bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-900 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          MS Paint
        </span>
        {exercise && <Chip tone="violet">{exercise.title}</Chip>}
        {allDone && (
          <Chip tone="mint" icon={<CheckCircle2 />}>
            All steps done
          </Chip>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {current.length + echo.length > 0 && (
            <span className="flex items-center gap-2 rounded-md border border-white/15 px-2 py-1">
              <button
                type="button"
                onClick={() => setGuideOn((on) => !on)}
                aria-pressed={guideOn}
                className={cn(
                  "flex h-7 cursor-pointer items-center gap-1.5 rounded px-2 text-[12px] font-semibold transition-colors",
                  guideOn ? "bg-white/15 text-white" : "text-ink-300 hover:bg-white/10",
                )}
              >
                {guideOn ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
                Guide
              </button>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={guideStrength}
                disabled={!guideOn}
                onChange={(e) => setGuideStrength(Number(e.target.value))}
                aria-label="How strong the tracing guide is"
                className="h-7 w-20 accent-signal-400 disabled:opacity-40"
              />
            </span>
          )}
          <Button variant="inverse" size="sm" icon={<ListRestart />} onClick={reset}>
            Start again
          </Button>
        </span>
      </div>

      {exercise && (
        <p className="border-b border-ink-100 bg-violet-100/50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-700">
          {exercise.brief}{" "}
          <span className="whitespace-nowrap text-ink-400">— {exercise.source}</span>
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_336px]">
        {/* The Paint window */}
        <div className="min-w-0 border-b border-ink-100 p-3 lg:border-r lg:border-b-0">
          <div className="overflow-hidden rounded-md border border-[#8fa8bf] shadow-card">
            {/* Title bar with the quick access toolbar */}
            <div className="flex items-center gap-1 border-b border-[#a3bdd4] bg-gradient-to-b from-[#f7fafd] to-[#e2edf8] px-2 py-1">
              <span
                className="flex size-5 items-center justify-center rounded-xs bg-[#2b6fb5] text-white"
                aria-hidden
              >
                <Palette className="size-3" />
              </span>
              <button
                type="button"
                onClick={() => setHistory(undo)}
                disabled={!canUndo(history)}
                aria-label="Undo the last thing you drew"
                title="Undo (Ctrl+Z)"
                className="flex size-8 cursor-pointer items-center justify-center rounded text-ink-700 hover:bg-[#cbe3fb] disabled:cursor-default disabled:opacity-35"
              >
                <Undo2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setHistory(redo)}
                disabled={!canRedo(history)}
                aria-label="Redo what you just undid"
                title="Redo (Ctrl+Y)"
                className="flex size-8 cursor-pointer items-center justify-center rounded text-ink-700 hover:bg-[#cbe3fb] disabled:cursor-default disabled:opacity-35"
              >
                <Redo2 className="size-4" />
              </button>
              <span className="mx-auto truncate text-[12px] text-ink-700">
                Untitled - Paint
              </span>
              <span
                className="font-mono text-[11px] tracking-widest text-ink-400"
                aria-hidden
              >
                — □ ✕
              </span>
            </div>

            {/* Ribbon tabs */}
            <div
              className="flex items-end gap-0.5 border-b border-[#a3bdd4] bg-[#dbe8f6] px-2 pt-1"
              aria-hidden
            >
              <span className="rounded-t bg-[#2b6fb5] px-3 py-1 text-[12px] font-medium text-white">
                File
              </span>
              <span className="rounded-t border border-b-0 border-[#a3bdd4] bg-[#f7fafd] px-3 py-1 text-[12px] font-semibold text-ink-800">
                Home
              </span>
              <span className="px-3 py-1 text-[12px] text-ink-600">View</span>
            </div>

            <PaintRibbon
              tools={tools}
              onChange={setTools}
              onClearImage={() => {
                change(clearAll(doc));
                setSaved(null);
              }}
            />

            <DrawCanvas
              ref={canvasRef}
              doc={doc}
              activeLayerId={activeLayerId}
              tools={tools}
              guide={current}
              guideEcho={echo}
              guideOpacity={guideOn ? guideStrength / 100 : 0}
              onCommit={commit}
            />

            {/* Layers — ZERO1's own addition to Paint, for tracing */}
            <div className="flex flex-wrap items-center gap-2 border-t border-[#a3bdd4] bg-[#f6fafd] px-3 py-2">
              <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
                <Layers className="size-3" aria-hidden /> Layers
              </span>
              {[...doc.layers].reverse().map((layer) => {
                const active = layer.id === activeLayerId;
                return (
                  <span
                    key={layer.id}
                    className={cn(
                      "flex items-center overflow-hidden rounded-md border",
                      active ? "border-[#5b93cd] bg-[#cbe3fb]" : "border-ink-200 bg-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLayerId(layer.id)}
                      aria-pressed={active}
                      title={layer.purpose}
                      className="h-8 cursor-pointer px-2.5 text-[12px] font-semibold text-ink-800"
                    >
                      {layer.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => change(setLayerVisible(doc, layer.id, !layer.visible))}
                      aria-label={`${layer.visible ? "Hide" : "Show"} the ${layer.name} layer`}
                      title={`${layer.visible ? "Hide" : "Show"} the ${layer.name} layer`}
                      className="flex size-8 cursor-pointer items-center justify-center text-ink-500 hover:bg-white/70"
                    >
                      {layer.visible ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => change(clearLayer(doc, layer.id))}
                      aria-label={`Clear everything on the ${layer.name} layer`}
                      title={`Clear the ${layer.name} layer`}
                      className="flex size-8 cursor-pointer items-center justify-center text-ink-500 hover:bg-white/70"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                );
              })}
              <span className="min-w-0 flex-1 text-[11.5px] text-ink-500">
                {activeLayer?.purpose}
              </span>
            </div>
          </div>
        </div>

        {/* The step rail */}
        <div className="thin-scroll min-w-0 p-4 lg:max-h-[760px] lg:overflow-y-auto">
          {exercise ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="font-display text-[15px] font-semibold text-ink-900">
                  Drawing steps
                </h4>
                <span className="tnum font-mono text-[11px] text-ink-400">
                  {done.length}/{steps.length} done
                </span>
              </div>

              <ol className="space-y-2">
                {steps.map((s, i) => {
                  const isCurrent = i === stepIndex;
                  const isDone = done.includes(s.id);
                  return (
                    <li key={s.id}>
                      <div
                        className={cn(
                          "rounded-lg border transition-colors",
                          isCurrent
                            ? "border-violet-500 bg-violet-100/40"
                            : "border-ink-100 bg-white",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setStepIndex(i)}
                          aria-current={isCurrent ? "step" : undefined}
                          className="flex w-full cursor-pointer items-start gap-2.5 p-3 text-left"
                        >
                          <span
                            className={cn(
                              "mt-px flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                              isDone
                                ? "bg-mint-500 text-white"
                                : isCurrent
                                  ? "bg-violet-500 text-white"
                                  : "bg-ink-100 text-ink-500",
                            )}
                            aria-hidden
                          >
                            {isDone ? <Check className="size-3.5" /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-ink-900">
                              {s.title}
                            </span>
                            {isCurrent && (
                              <span className="mt-1 block text-[13px] leading-relaxed text-ink-600">
                                {s.instruction}
                              </span>
                            )}
                          </span>
                        </button>

                        {isCurrent && (
                          <div className="flex flex-wrap items-center gap-1.5 border-t border-violet-200 px-3 py-2">
                            {s.tools.map((t) => (
                              <ToolChip
                                key={t}
                                tool={t}
                                active={tools.tool === t}
                                onPick={() => setTools({ ...tools, tool: t })}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setDone((list) =>
                                  list.includes(s.id)
                                    ? list.filter((id) => id !== s.id)
                                    : [...list, s.id],
                                )
                              }
                              aria-pressed={isDone}
                              className={cn(
                                "ml-auto flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-colors",
                                isDone
                                  ? "bg-mint-100 text-mint-700"
                                  : "bg-ink-900 text-white hover:bg-ink-800",
                              )}
                            >
                              <Check className="size-3.5" />
                              {isDone ? "Done" : "Mark done"}
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {step && stepIndex < steps.length - 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
                >
                  Next step
                </Button>
              )}

              {exercise.tips.length > 0 && (
                <details className="mt-3 rounded-lg border border-bit-200 bg-bit-50 p-3">
                  <summary className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-ink-800">
                    <Lightbulb className="size-3.5 text-bit-600" />
                    What the book says
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {exercise.tips.map((tip, i) => (
                      <li key={i} className="text-[12.5px] leading-relaxed text-ink-600">
                        · {tip}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 text-[13px] leading-relaxed text-ink-600">
              <p className="font-semibold text-ink-900">Free drawing</p>
              <p className="mt-1">
                The same Paint as the book: shapes, fill, eraser and the colour box.
                Sketch your construction shapes on the Sketch layer, draw the real
                outline on the Ink layer, then hide the sketch.
              </p>
            </div>
          )}

          {/* Saving — the only kind of "finished" this instrument has */}
          <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
            <p className="text-[12.5px] leading-relaxed text-ink-600">
              Nothing here is marked right or wrong — a drawing is not pass or fail.
              Work through the steps, then save your picture for your portfolio.
            </p>
            {hiddenWork && (
              <p className="mt-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-[12px] text-amber-700">
                One of your layers is hidden. What is on it will not be in the saved
                picture — show it again first if you want to keep it.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" icon={<Save />} onClick={save} disabled={marks === 0}>
                Save my picture
              </Button>
              {saved && (
                <a
                  href={saved}
                  download="my-cartoon-drawing.png"
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 text-[13px] font-medium text-ink-800 shadow-card hover:bg-ink-50"
                >
                  <Download className="size-4" />
                  Download PNG
                </a>
              )}
            </div>
            {saved && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={saved}
                  alt="The drawing you saved"
                  className="mt-2.5 w-full rounded-md border border-ink-200 bg-white"
                />
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-mint-700">
                  <CheckCircle2 className="size-3.5" />
                  Saved. Save again any time you change the drawing.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolChip({
  tool,
  active,
  onPick,
}: {
  tool: ToolId;
  active: boolean;
  onPick: () => void;
}) {
  const meta = toolMeta(tool);
  const Icon = TOOL_ICONS[tool];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      title={meta.hint}
      className={cn(
        "flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-500 text-white"
          : "border-ink-200 bg-white text-ink-700 hover:border-violet-300 hover:bg-violet-100/60",
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </button>
  );
}
