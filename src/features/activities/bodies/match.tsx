"use client";

import { cn, shuffleSeeded, hashString } from "@/lib/utils";
import { Inline } from "@/components/ui/md";
import type { MatchActivity } from "@/types/content";
import { useMemo } from "react";

/**
 * Matching via per-row selects — reliable on touch, keyboard-accessible,
 * and honest on small screens where drawing lines fails.
 */
export function MatchBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
  perItem,
}: {
  activity: MatchActivity;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  locked: boolean;
  showAnswer: boolean;
  perItem?: Record<string, boolean>;
}) {
  const rightOptions = useMemo(
    () =>
      shuffleSeeded(
        activity.pairs.map((p) => p.right),
        hashString(activity.id) + 7,
      ),
    [activity],
  );

  return (
    <div className="space-y-2.5">
      {activity.pairs.map((pair) => {
        const chosen = value[pair.id] ?? "";
        const verdict = showAnswer ? perItem?.[pair.id] : undefined;
        return (
          <div
            key={pair.id}
            className={cn(
              "grid grid-cols-1 items-center gap-2 rounded-lg border-2 p-3 transition-colors sm:grid-cols-[1fr_auto_1fr]",
              verdict === true && "border-mint-500 bg-mint-100/50",
              verdict === false && "border-coral-500 bg-coral-100/50",
              verdict === undefined && "border-ink-100 bg-white",
            )}
          >
            <span className="text-sm font-medium text-ink-800">
              <Inline text={pair.left} />
            </span>
            <span className="hidden text-ink-300 sm:block" aria-hidden>
              →
            </span>
            <select
              value={chosen}
              disabled={locked}
              onChange={(e) => onChange({ ...value, [pair.id]: e.target.value })}
              aria-label={`Match for: ${pair.left}`}
              className={cn(
                "w-full cursor-pointer rounded-md border border-ink-200 bg-white px-2.5 py-2 text-sm",
                "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none",
                !chosen && "text-ink-400",
              )}
            >
              <option value="" disabled>
                Choose a match…
              </option>
              {rightOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {showAnswer && verdict === false && (
              <p className="text-xs font-medium text-coral-700 sm:col-span-3">
                Correct answer: {pair.right}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
