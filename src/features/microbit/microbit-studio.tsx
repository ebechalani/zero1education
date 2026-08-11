"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  Gauge,
  Lightbulb,
  ListRestart,
  Play,
  Square,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlockEditor } from "./block-editor";
import { MicrobitDevice } from "./microbit-device";
import {
  createRuntime,
  describeProgram,
  type MbIssue,
  type MbRuntime,
  type MbSpeed,
} from "./interpreter";
import {
  emptyProgram,
  initialDeviceState,
  type MbButton,
  type MbDeviceState,
  type MbProgram,
} from "./program";
import { checkRun, type MbExercise } from "./exercises";
import { recordRuns } from "./record-run";

const SPEEDS: { id: MbSpeed; label: string; hint: string }[] = [
  { id: "slow", label: "Slow", hint: "One block at a time — good for explaining" },
  { id: "normal", label: "Normal", hint: "Watch it run" },
  { id: "fast", label: "Fast", hint: "Full speed" },
];

/**
 * The micro:bit instrument: build a program from blocks on the left, watch it
 * run on the board on the right.
 *
 * Two jobs, one component. A teacher opens it on the projector and drags
 * blocks while explaining, with execution slowed so the class can see the
 * program stepping. A student opens it inside a lesson to build the book's
 * project and have the *behaviour* of their program checked — not the shape of
 * their blocks, because the book's projects have many correct solutions.
 */
export function MicrobitStudio({
  exercise,
  initialProgram,
  onSolved,
  className,
}: {
  /** When present, the studio runs in exercise mode with checking */
  exercise?: MbExercise;
  initialProgram?: MbProgram;
  onSolved?: () => void;
  className?: string;
}) {
  const [program, setProgram] = useState<MbProgram>(
    () => exercise?.starter ?? initialProgram ?? emptyProgram(),
  );
  const [device, setDevice] = useState<MbDeviceState>(initialDeviceState);
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<MbIssue[]>([]);
  const [speed, setSpeed] = useState<MbSpeed>("normal");
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<
    { ok: boolean; messages: string[] } | null
  >(null);
  const runtimeRef = useRef<MbRuntime | null>(null);
  const solvedRef = useRef(false);

  // One runtime per program+speed; tearing it down is what makes Stop instant.
  useEffect(() => {
    const runtime = createRuntime(program, { speed });
    runtimeRef.current = runtime;
    const unsubscribe = runtime.subscribe((status) => {
      setDevice(status.device);
      setRunning(status.running);
      setIssues(status.issues);
    });
    return () => {
      unsubscribe();
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [program, speed]);

  const run = useCallback(() => {
    setVerdict(null);
    runtimeRef.current?.reset();
    runtimeRef.current?.start();
  }, []);

  const stop = useCallback(() => runtimeRef.current?.stop(), []);

  const reset = useCallback(() => {
    runtimeRef.current?.stop();
    runtimeRef.current?.reset();
    setVerdict(null);
  }, []);

  const pressButton = useCallback((b: MbButton) => {
    runtimeRef.current?.pressButton(b);
  }, []);

  const setSensor = useCallback((name: string, value: number) => {
    runtimeRef.current?.setSensor(name as never, value);
  }, []);

  const fatal = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity !== "error");
  const blockCount = program.events.reduce(
    (acc, e) => acc + countStatements(e.body),
    0,
  );

  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white shadow-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-900 px-4 py-3">
        <span className="font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          micro:bit
        </span>
        {exercise && (
          <Chip tone="bit">{exercise.title}</Chip>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {/* Speed — the teaching control */}
          <span className="flex items-center overflow-hidden rounded-md border border-white/15">
            <Gauge className="mx-2 size-3.5 text-ink-400" aria-hidden />
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSpeed(s.id)}
                title={s.hint}
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
          <Button variant="inverse" size="sm" icon={<ListRestart />} onClick={reset}>
            Reset
          </Button>
          {running ? (
            <Button variant="danger" size="sm" icon={<Square />} onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button
              variant="world"
              size="sm"
              icon={<Play />}
              onClick={run}
              disabled={blockCount === 0}
            >
              Run
            </Button>
          )}
        </span>
      </div>

      {exercise && (
        <p className="border-b border-ink-100 bg-bit-50 px-4 py-3 text-[13.5px] leading-relaxed text-ink-700">
          {exercise.brief}
        </p>
      )}

      {/* Editor | Device */}
      <div className="grid lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 border-b border-ink-100 lg:border-r lg:border-b-0">
          <BlockEditor program={program} onChange={setProgram} readOnly={running} />
        </div>

        <div className="p-4">
          <MicrobitDevice
            state={device}
            size="md"
            onButton={pressButton}
            showSensors
            onSensorChange={setSensor}
          />

          {/* What the program says, in words — used while explaining */}
          {blockCount > 0 && (
            <details className="mt-4 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-700">
                Read the program in words
              </summary>
              <ol className="mt-2 space-y-0.5 font-mono text-[11.5px] leading-relaxed text-ink-600">
                {describeProgram(program).map((line, i) => (
                  <li key={i}>{line}</li>
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
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
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
                    <CheckCircle2 className="size-4.5" /> That works — well done.
                  </>
                ) : (
                  <>
                    <XCircle className="size-4.5" /> Not yet
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
                  className="flex items-start gap-2 rounded-lg border border-bit-200 bg-bit-50 px-3 py-2 text-[13px] text-ink-700"
                >
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-bit-600" />
                  {h}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                setChecking(true);
                setVerdict(null);
                stop();
                try {
                  const runs = await recordRuns(program, exercise.check);
                  const result = checkRun(exercise.check, runs);
                  const failures = result.trials
                    .filter((t) => !t.passed)
                    .flatMap((t) =>
                      t.assertions
                        .filter((a) => !a.passed)
                        .map((a) => `${t.label}: ${a.detail}`),
                    );
                  setVerdict({ ok: result.passed, messages: failures.slice(0, 4) });
                  if (result.passed && !solvedRef.current) {
                    solvedRef.current = true;
                    onSolved?.();
                  }
                } finally {
                  setChecking(false);
                }
              }}
              disabled={blockCount === 0 || checking}
            >
              {checking ? "Checking…" : "Check my program"}
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
                  setProgram(exercise.solution);
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
          </div>
        </div>
      )}
    </div>
  );
}

function countStatements(body: { body?: unknown }[] | unknown[]): number {
  if (!Array.isArray(body)) return 0;
  let n = 0;
  for (const s of body as Record<string, unknown>[]) {
    n += 1;
    for (const key of ["body", "then", "otherwise"]) {
      if (Array.isArray(s[key])) n += countStatements(s[key] as unknown[]);
    }
  }
  return n;
}

