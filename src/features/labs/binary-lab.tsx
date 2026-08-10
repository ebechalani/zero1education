"use client";

import { cn } from "@/lib/utils";
import type { BinaryLabConfig } from "@/types/content";
import { CheckCircle2, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { LabShell } from "./lab-shell";

/**
 * The Bit Switchboard — flip switches, watch the decimal react.
 * Free mode explores; target mode drills through a sequence of numbers.
 */
export function BinaryLab({
  config,
  title = "Binary Lab",
  brief,
  onComplete,
  completed,
}: {
  config?: BinaryLabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const bitCount = config?.bits ?? 8;
  const targets = useMemo(
    () => (config?.mode === "target" ? (config.targets ?? [9, 21, 42]) : []),
    [config],
  );
  const [bits, setBits] = useState<boolean[]>(Array(bitCount).fill(false));
  const [targetIndex, setTargetIndex] = useState(0);
  const [justHit, setJustHit] = useState(false);

  const placeValues = Array.from({ length: bitCount }, (_, i) =>
    Math.pow(2, bitCount - 1 - i),
  );
  const decimal = bits.reduce(
    (acc, on, i) => acc + (on ? placeValues[i] : 0),
    0,
  );
  const allTargetsDone = targets.length > 0 && targetIndex >= targets.length;
  const currentTarget = targets[targetIndex];

  const flip = (i: number) => {
    if (justHit) return;
    const next = [...bits];
    next[i] = !next[i];
    setBits(next);
    const value = next.reduce((acc, on, j) => acc + (on ? placeValues[j] : 0), 0);
    if (targets.length > 0 && value === currentTarget) {
      setJustHit(true);
      setTimeout(() => {
        setJustHit(false);
        setBits(Array(bitCount).fill(false));
        const nextIndex = targetIndex + 1;
        setTargetIndex(nextIndex);
        if (nextIndex >= targets.length) onComplete?.();
      }, 900);
    }
  };

  const reset = () => {
    setBits(Array(bitCount).fill(false));
    setTargetIndex(0);
    setJustHit(false);
  };

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || allTargetsDone}
    >
      {/* Target strip */}
      {targets.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Target className="size-4 text-ink-400" />
          {targets.map((t, i) => (
            <span
              key={t}
              className={cn(
                "tnum rounded-md px-2.5 py-1 font-mono text-sm font-semibold transition-colors",
                i < targetIndex && "bg-mint-100 text-mint-700",
                i === targetIndex && !allTargetsDone && "bg-brand-600 text-white shadow-glow",
                i > targetIndex && "bg-ink-100 text-ink-400",
              )}
            >
              {i < targetIndex ? "✓ " : ""}
              {t}
            </span>
          ))}
          {allTargetsDone && (
            <span className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-mint-600">
              <CheckCircle2 className="size-4" /> All targets hit!
            </span>
          )}
        </div>
      )}

      {/* Switchboard */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-fit gap-2"
          style={{ gridTemplateColumns: `repeat(${bitCount}, minmax(52px, 1fr))` }}
        >
          {placeValues.map((pv, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="tnum font-mono text-[11px] text-ink-400">{pv}</span>
              <button
                onClick={() => flip(i)}
                aria-label={`Bit worth ${pv}: ${bits[i] ? "on" : "off"}`}
                aria-pressed={bits[i]}
                className={cn(
                  "flex h-20 w-full cursor-pointer flex-col items-center justify-between rounded-lg border-2 p-1.5 transition-all duration-200",
                  bits[i]
                    ? "border-signal-500 bg-signal-500/10 shadow-[0_0_16px_-2px_var(--color-signal-400)]"
                    : "border-ink-200 bg-ink-50",
                )}
              >
                <span
                  className={cn(
                    "size-3 rounded-full transition-all",
                    bits[i] ? "bg-signal-500" : "bg-ink-200",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-mono text-xl font-bold",
                    bits[i] ? "text-signal-600" : "text-ink-300",
                  )}
                >
                  {bits[i] ? 1 : 0}
                </span>
                <span
                  className={cn(
                    "h-5 w-3.5 rounded-sm border transition-all",
                    bits[i]
                      ? "translate-y-0 border-signal-600 bg-signal-500"
                      : "translate-y-0 border-ink-300 bg-white",
                  )}
                  aria-hidden
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Readout */}
      <div
        className={cn(
          "mt-5 flex items-center justify-between rounded-lg bg-ink-900 px-5 py-4 transition-all",
          justHit && "bg-mint-600",
        )}
      >
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
            Binary
          </p>
          <p className="tnum font-mono text-lg font-semibold text-signal-300">
            {bits.map((b) => (b ? "1" : "0")).join("")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
            Decimal
          </p>
          <p className="tnum font-mono text-3xl font-bold text-white">
            {justHit ? "✓ " : ""}
            {decimal}
          </p>
        </div>
      </div>
      <p className="mt-2 text-center font-mono text-xs text-ink-400">
        {bits.filter(Boolean).length > 0
          ? placeValues.filter((_, i) => bits[i]).join(" + ") + ` = ${decimal}`
          : "Flip switches to build a number"}
      </p>
    </LabShell>
  );
}
