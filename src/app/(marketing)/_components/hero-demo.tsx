"use client";

import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

const PLACE_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];

/**
 * Hero teaser — a standalone 8-bit switchboard in the visual language of the
 * Binary Lab, tuned for the dark hero. Deliberately simpler than the real lab:
 * free exploration only, no targets, no scoring, no shared state.
 */
export function HeroDemo() {
  const [bits, setBits] = useState<boolean[]>(Array(8).fill(false));

  const decimal = bits.reduce(
    (sum, on, i) => sum + (on ? PLACE_VALUES[i] : 0),
    0,
  );
  const active = PLACE_VALUES.filter((_, i) => bits[i]);

  const flip = (index: number) =>
    setBits((prev) => prev.map((on, i) => (i === index ? !on : on)));

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-pop backdrop-blur-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-ink-300 uppercase">
          <span
            className="animate-blink size-1.5 rounded-full bg-signal-400"
            aria-hidden
          />
          Binary Lab
        </p>
        <button
          type="button"
          onClick={() => setBits(Array(8).fill(false))}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-3" aria-hidden />
          Reset
        </button>
      </div>

      <div className="mt-4 grid grid-cols-8 gap-1.5 sm:gap-2">
        {PLACE_VALUES.map((place, i) => (
          <div key={place} className="flex flex-col items-center gap-1.5">
            <span className="tnum font-mono text-[10px] text-ink-400">
              {place}
            </span>
            <button
              type="button"
              onClick={() => flip(i)}
              aria-pressed={bits[i]}
              aria-label={`Bit worth ${place}: ${bits[i] ? "on" : "off"}`}
              className={cn(
                "flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all duration-150 sm:h-20",
                bits[i]
                  ? "border-signal-400 bg-signal-400/15 shadow-[0_0_18px_-4px_var(--color-signal-400)]"
                  : "border-white/10 bg-white/5 hover:border-white/25",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full transition-colors",
                  bits[i] ? "bg-signal-300" : "bg-white/20",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "font-mono text-lg font-bold transition-colors sm:text-xl",
                  bits[i] ? "text-signal-300" : "text-ink-400",
                )}
                aria-hidden
              >
                {bits[i] ? 1 : 0}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 rounded-lg bg-ink-950/70 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-500 uppercase">
            Binary
          </p>
          <p className="tnum font-mono text-base font-semibold text-signal-300 sm:text-lg">
            {bits.map((on) => (on ? "1" : "0")).join("")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-500 uppercase">
            Decimal
          </p>
          <p className="tnum font-mono text-3xl font-bold text-white">
            {decimal}
          </p>
        </div>
      </div>

      <p
        className="mt-2 text-center font-mono text-[11px] text-ink-400"
        aria-live="polite"
      >
        {active.length > 0
          ? `${active.join(" + ")} = ${decimal}`
          : "Flip switches to build a number"}
      </p>
      <p className="mt-3 text-center text-[12.5px] text-ink-300">
        This is a ZERO1 Lab — try it.
      </p>
    </div>
  );
}
