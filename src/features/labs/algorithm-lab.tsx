"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AlgorithmLabConfig } from "@/types/content";
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Minus,
  Play,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LabShell } from "./lab-shell";

type Dir = "up" | "right" | "down" | "left";
interface Instr {
  id: number;
  op: "move" | "left" | "right";
  n: number;
}

const DIRS: Dir[] = ["up", "right", "down", "left"];
const DELTA: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};
const ROT: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

const DEFAULT_CONFIG: AlgorithmLabConfig = {
  size: 5,
  start: { x: 0, y: 4, dir: "up" },
  goal: { x: 4, y: 0 },
  obstacles: [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ],
  par: 10,
};

/**
 * Robot Maze — build an algorithm from blocks, run it, watch the rover
 * execute literally. Crashing teaches debugging; the par count teaches
 * efficiency (that's where "×3" loops shine).
 */
export function AlgorithmLab({
  config,
  title = "Algorithm Lab",
  brief,
  onComplete,
  completed,
}: {
  config?: AlgorithmLabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const size = cfg.size ?? 5;
  const [program, setProgram] = useState<Instr[]>([]);
  const [robot, setRobot] = useState({ ...cfg.start });
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [outcome, setOutcome] = useState<"none" | "crash" | "goal">("none");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(1);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  // Stop the run loop if the lab unmounts mid-execution
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const blockCount = program.length;
  const isObstacle = (x: number, y: number) =>
    (cfg.obstacles ?? []).some((o) => o.x === x && o.y === y);

  const add = (op: Instr["op"]) => {
    if (running) return;
    setOutcome("none");
    setProgram((p) => [...p, { id: idRef.current++, op, n: 1 }]);
  };
  const remove = (id: number) =>
    !running && setProgram((p) => p.filter((i) => i.id !== id));
  const bump = (id: number, delta: number) =>
    !running &&
    setProgram((p) =>
      p.map((i) =>
        i.id === id ? { ...i, n: Math.min(6, Math.max(1, i.n + delta)) } : i,
      ),
    );

  const stop = () => {
    clearTimer();
    setRunning(false);
    setActiveStep(-1);
  };

  const run = () => {
    if (program.length === 0) return;
    clearTimer();
    setOutcome("none");
    setRunning(true);
    // Expand ×n moves into atomic steps tagged with their block index
    const steps: { op: Instr["op"]; blockIndex: number }[] = [];
    program.forEach((instr, bi) => {
      const times = instr.op === "move" ? instr.n : 1;
      for (let k = 0; k < times; k++) steps.push({ op: instr.op, blockIndex: bi });
    });

    let state = { ...cfg.start };
    setRobot(state);
    let i = 0;

    const tick = () => {
      if (i >= steps.length) {
        setRunning(false);
        setActiveStep(-1);
        if (state.x === cfg.goal.x && state.y === cfg.goal.y) {
          setOutcome("goal");
          onComplete?.();
        } else {
          setOutcome("crash");
        }
        return;
      }
      const step = steps[i];
      setActiveStep(step.blockIndex);
      if (step.op === "move") {
        const d = DELTA[state.dir];
        const nx = state.x + d.dx;
        const ny = state.y + d.dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || isObstacle(nx, ny)) {
          setRunning(false);
          setActiveStep(-1);
          setOutcome("crash");
          return;
        }
        state = { ...state, x: nx, y: ny };
      } else {
        const turn = step.op === "left" ? 3 : 1;
        state = { ...state, dir: DIRS[(DIRS.indexOf(state.dir) + turn) % 4] };
      }
      setRobot({ ...state });
      // Early win: stop as soon as the goal is reached
      if (state.x === cfg.goal.x && state.y === cfg.goal.y) {
        setRunning(false);
        setActiveStep(-1);
        setOutcome("goal");
        onComplete?.();
        return;
      }
      i++;
      timerRef.current = setTimeout(tick, 360);
    };
    timerRef.current = setTimeout(tick, 300);
  };

  const reset = () => {
    stop();
    setProgram([]);
    setRobot({ ...cfg.start });
    setOutcome("none");
  };

  const cellPct = 100 / size;

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || outcome === "goal"}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Grid world */}
        <div>
          <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-xl border-2 border-ink-200 bg-ink-50">
            {/* cells */}
            {Array.from({ length: size * size }).map((_, i) => {
              const x = i % size;
              const y = Math.floor(i / size);
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute border border-ink-100/70",
                    isObstacle(x, y) && "bg-ink-800",
                  )}
                  style={{
                    left: `${x * cellPct}%`,
                    top: `${y * cellPct}%`,
                    width: `${cellPct}%`,
                    height: `${cellPct}%`,
                  }}
                >
                  {isObstacle(x, y) && (
                    <X className="absolute inset-0 m-auto size-1/3 text-ink-500" />
                  )}
                </div>
              );
            })}
            {/* goal */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: `${cfg.goal.x * cellPct}%`,
                top: `${cfg.goal.y * cellPct}%`,
                width: `${cellPct}%`,
                height: `${cellPct}%`,
              }}
            >
              <div className="flex size-3/4 items-center justify-center rounded-lg bg-mint-100 ring-2 ring-mint-500">
                <Flag className="size-1/2 text-mint-600" />
              </div>
            </div>
            {/* robot */}
            <div
              className="absolute transition-all duration-300 ease-out"
              style={{
                left: `${robot.x * cellPct}%`,
                top: `${robot.y * cellPct}%`,
                width: `${cellPct}%`,
                height: `${cellPct}%`,
              }}
            >
              <div
                className={cn(
                  "absolute inset-[12%] flex items-center justify-center rounded-xl bg-brand-600 shadow-pop transition-transform duration-300",
                  outcome === "crash" && "bg-coral-500",
                  outcome === "goal" && "bg-mint-500",
                )}
                style={{ transform: `rotate(${ROT[robot.dir]}deg)` }}
              >
                <ArrowUp className="size-1/2 text-white" />
              </div>
            </div>
          </div>

          {/* Outcome */}
          {outcome === "crash" && (
            <p className="animate-pop mt-3 rounded-lg bg-coral-100 px-4 py-2.5 text-center text-sm font-semibold text-coral-700">
              The rover stopped — it hit something or ran out of instructions.
              Debug your algorithm and run it again!
            </p>
          )}
          {outcome === "goal" && (
            <p className="animate-pop mt-3 rounded-lg bg-mint-100 px-4 py-2.5 text-center text-sm font-semibold text-mint-700">
              Charging station reached!{" "}
              {cfg.par && blockCount <= cfg.par
                ? `And in ${blockCount} blocks — under par. Elegant!`
                : cfg.par
                  ? `Now can you do it in ${cfg.par} blocks or fewer?`
                  : ""}
            </p>
          )}
        </div>

        {/* Program panel */}
        <div className="flex flex-col">
          <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
            Blocks
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<ArrowUp />} onClick={() => add("move")}>
              Move
            </Button>
            <Button size="sm" variant="secondary" icon={<CornerUpLeft />} onClick={() => add("left")}>
              Turn left
            </Button>
            <Button size="sm" variant="secondary" icon={<CornerUpRight />} onClick={() => add("right")}>
              Turn right
            </Button>
          </div>

          <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
            Your algorithm{" "}
            <span className="tnum font-mono text-ink-400">
              ({blockCount} block{blockCount === 1 ? "" : "s"}
              {cfg.par ? ` · par ${cfg.par}` : ""})
            </span>
          </p>
          <div className="thin-scroll min-h-40 flex-1 space-y-1.5 overflow-y-auto rounded-lg border border-ink-100 bg-ink-50/60 p-2">
            <div className="rounded-md bg-ink-900 px-3 py-1.5 text-center font-mono text-[11px] tracking-widest text-signal-400 uppercase">
              Start
            </div>
            {program.map((instr, i) => (
              <div
                key={instr.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 text-[13px] font-medium text-ink-800 transition-colors",
                  activeStep === i
                    ? "border-brand-500 bg-brand-50 shadow-glow"
                    : "border-ink-100",
                )}
              >
                {instr.op === "move" && <ArrowUp className="size-3.5 text-brand-600" />}
                {instr.op === "left" && <CornerUpLeft className="size-3.5 text-violet-500" />}
                {instr.op === "right" && <CornerUpRight className="size-3.5 text-violet-500" />}
                <span className="flex-1">
                  {instr.op === "move" ? "Move forward" : instr.op === "left" ? "Turn left" : "Turn right"}
                </span>
                {instr.op === "move" && (
                  <span className="flex items-center gap-0.5">
                    <button onClick={() => bump(instr.id, -1)} aria-label="Fewer steps" className="cursor-pointer rounded p-0.5 text-ink-400 hover:bg-ink-100">
                      <Minus className="size-3" />
                    </button>
                    <span className="tnum w-7 text-center font-mono text-xs font-bold text-brand-700">
                      ×{instr.n}
                    </span>
                    <button onClick={() => bump(instr.id, 1)} aria-label="More steps" className="cursor-pointer rounded p-0.5 text-ink-400 hover:bg-ink-100">
                      <Plus className="size-3" />
                    </button>
                  </span>
                )}
                <button onClick={() => remove(instr.id)} aria-label="Delete block" className="cursor-pointer rounded p-0.5 text-ink-300 hover:bg-coral-100 hover:text-coral-600">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="rounded-md bg-ink-900 px-3 py-1.5 text-center font-mono text-[11px] tracking-widest text-signal-400 uppercase">
              End
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {!running ? (
              <Button onClick={run} disabled={program.length === 0} icon={<Play />} className="flex-1">
                Run
              </Button>
            ) : (
              <Button onClick={stop} variant="danger" icon={<Square />} className="flex-1">
                Stop
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-ink-400">
            Tip: <span className="font-mono font-semibold">Move ×3</span> is a
            loop — one block, three steps.
          </p>
        </div>
      </div>
    </LabShell>
  );
}
