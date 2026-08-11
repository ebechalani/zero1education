"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  Flag,
  Gauge,
  Grid3x3,
  Lightbulb,
  ListRestart,
  Octagon,
  Plus,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ScratchBlocks, type ScEditorContext } from "./scratch-blocks";
import { BackdropThumb, ScratchStage, SpriteGlyph } from "./scratch-stage";
import {
  createScratchRuntime,
  describeScripts,
  type ScIssue,
  type ScRuntime,
  type ScSpeed,
} from "./scratch-engine";
import { checkExercise, type ScExercise } from "./exercises";
import {
  addBackdrop,
  addSprite,
  countBlocks,
  emptyProject,
  initialStageState,
  projectVariables,
  removeBackdrop,
  removeSprite,
  SC_BACKDROP_LIBRARY,
  SC_SPRITE_LIBRARY,
  setSpriteScripts,
  setStageScripts,
  type ScHat,
  type ScKey,
  type ScProject,
  type ScStageState,
} from "./scratch-model";

/**
 * The Scratch 3.0 instrument: the palette and the scripts on the left, the
 * stage and its trays on the right, the green flag and the stop sign on top.
 *
 * Two jobs, one component. A teacher opens it on the projector, sets the speed
 * to Slow so the class can watch each block light up as it runs, and adds
 * backdrops and sprites while explaining. A student opens it inside a lesson to
 * build the book's project and have the RESULT checked — where the sprites
 * ended up, what was said and when, what the pen drew — because every project
 * in Chapter 5 has many correct scripts and the book only ever cares about what
 * happens on the stage.
 */

const SPEEDS: { id: ScSpeed; label: string; hint: string }[] = [
  { id: "slow", label: "Slow", hint: "One block at a time — good for explaining" },
  { id: "normal", label: "Normal", hint: "Scratch's own speed" },
  { id: "fast", label: "Fast", hint: "Skip through the waiting" },
];

/** Browser keys → the key names Scratch's `when … key pressed` block uses. */
const KEY_NAMES: Record<string, ScKey> = {
  " ": "space",
  ArrowUp: "up arrow",
  ArrowDown: "down arrow",
  ArrowLeft: "left arrow",
  ArrowRight: "right arrow",
  a: "a",
  s: "s",
  d: "d",
  w: "w",
};

const scratchKey = (raw: string): ScKey | undefined =>
  KEY_NAMES[raw] ?? KEY_NAMES[raw.toLowerCase()];

/**
 * A stable empty list. At Normal and Fast speed the running block changes
 * faster than an eye can follow, so the editor is not told about it at all —
 * which keeps its props identical and its whole tree out of the render.
 */
const NO_HIGHLIGHT: string[] = [];

export function ScratchStudio({
  exercise,
  initialProject,
  onSolved,
  className,
}: {
  /** When present, the studio runs in exercise mode with checking. */
  exercise?: ScExercise;
  initialProject?: ScProject;
  onSolved?: () => void;
  className?: string;
}) {
  const [project, setProject] = useState<ScProject>(
    () => exercise?.starter ?? initialProject ?? emptyProject(),
  );
  const [target, setTarget] = useState<string>(
    () => exercise?.focus ?? (initialProject ?? emptyProject()).sprites[0]?.id ?? "stage",
  );
  const [state, setState] = useState<ScStageState>(() =>
    initialStageState(exercise?.starter ?? initialProject ?? emptyProject()),
  );
  const [running, setRunning] = useState(false);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [issues, setIssues] = useState<ScIssue[]>([]);
  const [speed, setSpeed] = useState<ScSpeed>("normal");
  const [showGrid, setShowGrid] = useState(false);
  const [adding, setAdding] = useState<"sprite" | "backdrop" | null>(null);
  /** Variables made in the palette that no block mentions yet. */
  const [declared, setDeclared] = useState<string[]>([]);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean; messages: string[] } | null>(null);

  const runtimeRef = useRef<ScRuntime | null>(null);
  const speedRef = useRef<ScSpeed>(speed);
  const heldKeys = useRef(new Set<ScKey>());
  const solvedRef = useRef(false);

  // One runtime per project: rebuilding it is what makes an edit take effect,
  // and tearing it down is what makes the stop sign instant.
  useEffect(() => {
    const runtime = createScratchRuntime(project, { speed: speedRef.current });
    runtimeRef.current = runtime;
    const unsubscribe = runtime.subscribe((status) => {
      setState(status.state);
      setRunning(status.running);
      setActiveIds(status.activeIds);
      setIssues(status.issues);
    });
    return () => {
      unsubscribe();
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [project]);

  useEffect(() => {
    speedRef.current = speed;
    runtimeRef.current?.setSpeed(speed);
  }, [speed]);

  const greenFlag = useCallback(() => {
    setVerdict(null);
    runtimeRef.current?.greenFlag();
  }, []);

  const stopAll = useCallback(() => runtimeRef.current?.stopAll(), []);

  const resetStage = useCallback(() => {
    runtimeRef.current?.reset();
    setVerdict(null);
  }, []);

  // ── What the editor is looking at ────────────────────────────────────────

  const sprite = project.sprites.find((s) => s.id === target);
  const isStage = sprite === undefined;
  const scripts = isStage ? project.stage.scripts : sprite.scripts;

  const variables = useMemo(() => {
    const names = projectVariables(project);
    for (const name of declared) if (!names.includes(name)) names.push(name);
    return names;
  }, [project, declared]);

  const editorContext: ScEditorContext = useMemo(
    () => ({
      isStage,
      targetName: isStage ? "Stage" : sprite.name,
      sprites: project.sprites.map((s) => ({ id: s.id, name: s.name })),
      backdrops: project.backdrops.map((b) => b.name),
      costumes: sprite?.costumes.map((c) => c.name) ?? [],
      sounds: (isStage ? project.stage.sounds : sprite.sounds).map((s) => s.name),
      variables,
    }),
    [isStage, sprite, project, variables],
  );

  const setScripts = useCallback(
    (next: ScHat[]) => {
      setProject((current) =>
        isStage ? setStageScripts(current, next) : setSpriteScripts(current, target, next),
      );
    },
    [isStage, target],
  );

  const makeVariable = useCallback(
    (name: string) =>
      setDeclared((current) => (current.includes(name) ? current : [...current, name])),
    [],
  );

  const blockCount = countBlocks(project);
  const lines = useMemo(() => describeScripts(scripts), [scripts]);
  const live = state.sprites.find((s) => s.id === target);

  // ── Keys and clicks on the stage ─────────────────────────────────────────

  const onStageKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const key = scratchKey(e.key);
    if (!key) return;
    // The arrows and the space bar would otherwise scroll the lesson away.
    e.preventDefault();
    if (heldKeys.current.has(key)) return;
    heldKeys.current.add(key);
    runtimeRef.current?.keyDown(key);
  };

  const onStageKeyUp = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const key = scratchKey(e.key);
    if (!key) return;
    heldKeys.current.delete(key);
    runtimeRef.current?.keyUp(key);
  };

  const releaseKeys = () => {
    for (const key of heldKeys.current) runtimeRef.current?.keyUp(key);
    heldKeys.current.clear();
  };

  // ── Trays ────────────────────────────────────────────────────────────────

  const chooseSprite = (templateId: string) => {
    setProject((current) => addSprite(current, templateId));
    setAdding(null);
  };

  const chooseBackdrop = (templateId: string) => {
    setProject((current) => addBackdrop(current, templateId));
    setAdding(null);
  };

  const dropSprite = (id: string) => {
    setProject((current) => removeSprite(current, id));
    if (target === id) setTarget("stage");
  };

  const fatal = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity !== "error");

  const check = async () => {
    if (!exercise) return;
    setChecking(true);
    setVerdict(null);
    stopAll();
    // One tick so the button can paint "Checking…" before the trials replay.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const result = checkExercise(exercise, project);
      const failures = result.trials
        .filter((t) => !t.passed)
        .flatMap((t) =>
          t.assertions.filter((a) => !a.passed).map((a) => `${t.label}: ${a.detail}`),
        );
      setVerdict({ ok: result.passed, messages: failures.slice(0, 4) });
      if (result.passed && !solvedRef.current) {
        solvedRef.current = true;
        onSolved?.();
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white shadow-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-900 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          Scratch 3.0
        </span>
        {exercise && <Chip tone="violet">{exercise.title}</Chip>}
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
                aria-pressed={speed === s.id}
                className={cn(
                  "cursor-pointer px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  speed === s.id ? "bg-white/15 text-white" : "text-ink-300 hover:bg-white/10",
                )}
              >
                {s.label}
              </button>
            ))}
          </span>
          <Button
            variant="inverse"
            size="sm"
            icon={<Grid3x3 />}
            aria-pressed={showGrid}
            title="Show the x and y lines of the stage"
            onClick={() => setShowGrid((g) => !g)}
            className={cn(showGrid && "bg-white/25")}
          >
            Grid
          </Button>
          <Button variant="inverse" size="sm" icon={<ListRestart />} onClick={resetStage}>
            Reset
          </Button>
          <Button
            size="sm"
            icon={<Flag className="fill-white" />}
            onClick={greenFlag}
            disabled={blockCount === 0}
            title="Run the project, as the green flag does in Scratch"
            className="bg-mint-600 hover:bg-mint-700"
          >
            Green flag
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Octagon className="fill-white" />}
            onClick={stopAll}
            disabled={!running}
          >
            Stop
          </Button>
        </span>
      </div>

      {exercise && (
        <p className="border-b border-ink-100 bg-violet-100/60 px-4 py-3 text-[13.5px] leading-relaxed text-ink-700">
          {exercise.brief}
        </p>
      )}

      {/* Blocks | Stage */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 border-b border-ink-100 p-3 lg:border-r lg:border-b-0">
          <ScratchBlocks
            scripts={scripts}
            onChange={setScripts}
            context={editorContext}
            categories={exercise?.allowed}
            readOnly={running}
            activeIds={speed === "slow" ? activeIds : NO_HIGHLIGHT}
            onMakeVariable={makeVariable}
          />
        </div>

        <div className="min-w-0 p-4">
          {/* The stage takes the keys, so a project with `when key pressed`
              works — click it first, which is what Scratch asks for too. */}
          <div
            tabIndex={0}
            role="group"
            aria-label="Scratch stage. Click it, then use the keys your project listens for."
            onKeyDown={onStageKeyDown}
            onKeyUp={onStageKeyUp}
            onBlur={releaseKeys}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <ScratchStage
              project={project}
              state={state}
              showGrid={showGrid}
              onSpriteClick={(id) => {
                setTarget(id);
                runtimeRef.current?.clickSprite(id);
              }}
              onMouse={(x, y) => runtimeRef.current?.setMouse(x, y)}
              onMouseDown={(down) => runtimeRef.current?.setMouseDown(down)}
            />
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-400">
            <span className="tnum">
              mouse x {state.mouse.x}, y {state.mouse.y}
            </span>
            {live && (
              <span className="tnum">
                {live.name}: x {Math.round(live.x)}, y {Math.round(live.y)}, direction{" "}
                {Math.round(live.direction)}
              </span>
            )}
            {running && (
              <span className="font-semibold text-mint-700">running…</span>
            )}
          </p>

          {/* The sprite tray: which target the Code area is editing. */}
          <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[12px] font-semibold tracking-wide text-ink-500 uppercase">
                Sprites
              </h4>
              <button
                type="button"
                onClick={() => setAdding(adding === "sprite" ? null : "sprite")}
                aria-expanded={adding === "sprite"}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-50"
              >
                <Plus className="size-3.5" aria-hidden />
                Choose a Sprite
              </button>
            </div>

            {adding === "sprite" && (
              <div className="mt-2 grid grid-cols-4 gap-1.5 rounded-md border border-ink-200 bg-white p-2">
                {SC_SPRITE_LIBRARY.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => chooseSprite(template.id)}
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-md p-1.5 hover:bg-ink-50"
                  >
                    <SpriteGlyph
                      costume={template.costumes[0]}
                      width={template.width}
                      height={template.height}
                      size={34}
                    />
                    <span className="text-[11px] font-medium text-ink-600">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.sprites.map((s) => {
                const on = s.id === target;
                return (
                  <span key={s.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setTarget(s.id)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "flex w-[74px] cursor-pointer flex-col items-center gap-0.5 rounded-md border-2 bg-white px-1 py-1.5 transition-colors",
                        on
                          ? "border-brand-500 shadow-card"
                          : "border-transparent hover:border-ink-200",
                      )}
                    >
                      <SpriteGlyph
                        costume={s.costumes[Math.min(s.costume, s.costumes.length - 1)]}
                        width={s.width}
                        height={s.height}
                        size={30}
                      />
                      <span className="w-full truncate text-center text-[11.5px] font-semibold text-ink-700">
                        {s.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete the sprite ${s.name}`}
                      onClick={() => dropSprite(s.id)}
                      className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink-700 text-white hover:bg-coral-600"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                );
              })}
              {project.sprites.length === 0 && (
                <p className="px-1 py-2 text-[12.5px] text-ink-400">
                  No sprites yet — choose one to start.
                </p>
              )}
            </div>
          </div>

          {/* The Stage tray: its backdrops, and its own Code. */}
          <div className="mt-2.5 rounded-lg border border-ink-100 bg-ink-50/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[12px] font-semibold tracking-wide text-ink-500 uppercase">
                Stage
              </h4>
              <button
                type="button"
                onClick={() => setAdding(adding === "backdrop" ? null : "backdrop")}
                aria-expanded={adding === "backdrop"}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-50"
              >
                <Plus className="size-3.5" aria-hidden />
                Choose a Backdrop
              </button>
            </div>

            {adding === "backdrop" && (
              <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-md border border-ink-200 bg-white p-2">
                {SC_BACKDROP_LIBRARY.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => chooseBackdrop(template.id)}
                    className="cursor-pointer overflow-hidden rounded-md border border-ink-100 hover:border-brand-400"
                  >
                    <span className="block h-9 w-full">
                      <BackdropThumb backdrop={template} />
                    </span>
                    <span className="block truncate px-1 py-0.5 text-[10.5px] font-medium text-ink-600">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-start gap-2">
              <button
                type="button"
                onClick={() => setTarget("stage")}
                aria-current={isStage ? "true" : undefined}
                className={cn(
                  "w-[74px] shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-white transition-colors",
                  isStage ? "border-brand-500 shadow-card" : "border-transparent hover:border-ink-200",
                )}
              >
                <span className="block h-9 w-full">
                  {project.backdrops[state.backdrop] && (
                    <BackdropThumb backdrop={project.backdrops[state.backdrop]} />
                  )}
                </span>
                <span className="block py-0.5 text-center text-[11.5px] font-semibold text-ink-700">
                  Stage
                </span>
              </button>

              <ul className="thin-scroll flex max-h-24 min-w-0 flex-1 flex-wrap gap-1 overflow-y-auto">
                {project.backdrops.map((b) => (
                  <li key={b.id}>
                    <span className="flex items-center gap-1 rounded-full border border-ink-200 bg-white py-0.5 pr-1 pl-2">
                      <span className="text-[11.5px] font-medium text-ink-700">{b.name}</span>
                      <button
                        type="button"
                        aria-label={`Delete the backdrop ${b.name}`}
                        disabled={project.backdrops.length <= 1}
                        onClick={() => setProject((c) => removeBackdrop(c, b.id))}
                        className="flex size-4 cursor-pointer items-center justify-center rounded-full text-ink-400 hover:bg-coral-100 hover:text-coral-700 disabled:cursor-default disabled:opacity-30"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What the scripts say, in words — used while explaining */}
          {lines.length > 0 && (
            <details className="mt-2.5 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-700">
                Read {isStage ? "the Stage's" : `${sprite.name}'s`} script in words
              </summary>
              <ol className="mt-2 space-y-0.5 font-mono text-[11.5px] leading-relaxed text-ink-600">
                {lines.map((line) => (
                  <li key={line.id} style={{ paddingLeft: `${line.depth * 12}px` }}>
                    {line.text}
                  </li>
                ))}
              </ol>
            </details>
          )}

          {/* Issues — teaching feedback, never a stack trace */}
          {(fatal.length > 0 || warnings.length > 0) && (
            <div className="mt-3 space-y-1.5">
              {[...fatal, ...warnings].slice(0, 4).map((issue, i) => (
                <p
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]",
                    issue.severity === "error"
                      ? "bg-coral-100 text-coral-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise footer */}
      {exercise && (
        <div className="border-t border-ink-100 p-4">
          {verdict && (
            <div
              className={cn(
                "animate-pop mb-3 rounded-lg px-4 py-3",
                verdict.ok ? "bg-mint-100" : "bg-coral-100",
              )}
            >
              <p
                className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  verdict.ok ? "text-mint-700" : "text-coral-700",
                )}
              >
                {verdict.ok ? (
                  <>
                    <CheckCircle2 className="size-4.5" aria-hidden /> That works — well done.
                  </>
                ) : (
                  <>
                    <XCircle className="size-4.5" aria-hidden /> Not yet
                  </>
                )}
              </p>
              {verdict.messages.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {verdict.messages.map((m, i) => (
                    <li key={i} className="text-[13px] text-ink-700">
                      · {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hintsShown > 0 && (
            <div className="mb-3 space-y-1.5">
              {exercise.hints.slice(0, hintsShown).map((h, i) => (
                <p
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-100/50 px-3 py-2 text-[13px] text-ink-700"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-violet-700" aria-hidden />
                  {h}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={check} disabled={checking}>
              {checking ? "Checking…" : "Check my project"}
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
                  setShowSolution(true);
                  setProject(exercise.solution);
                  setTarget(exercise.focus);
                  setVerdict(null);
                }}
              >
                Show me one answer
              </Button>
            )}
            {showSolution && (
              <span className="text-[12.5px] text-ink-400">
                This is one correct answer — yours may look different and still work.
              </span>
            )}
            <span className="ml-auto text-[12px] text-ink-400">
              {exercise.check.summary}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
