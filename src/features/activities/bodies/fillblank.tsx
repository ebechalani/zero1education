"use client";

import { cn, shuffleSeeded, hashString } from "@/lib/utils";
import { Inline } from "@/components/ui/md";
import type { FillBlankActivity } from "@/types/content";
import { useMemo, type ReactNode } from "react";

/**
 * Fill-in-the-blank. With a word bank, blanks fill by tapping chips;
 * without one, students type into inline inputs.
 */
export function FillBlankBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
  perItem,
}: {
  activity: FillBlankActivity;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  locked: boolean;
  showAnswer: boolean;
  perItem?: Record<string, boolean>;
}) {
  const bank = useMemo(
    () =>
      activity.bank
        ? shuffleSeeded(activity.bank, hashString(activity.id) + 3)
        : null,
    [activity],
  );
  const usedWords = Object.values(value);

  const fillNext = (word: string) => {
    const blankIds = Object.keys(activity.blanks);
    const target = blankIds.find((id) => !value[id]);
    if (target) onChange({ ...value, [target]: word });
  };
  const clearBlank = (id: string) => {
    if (locked) return;
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  // Parse template into segments around [[blankId]] markers
  const segments: ReactNode[] = [];
  const re = /\[\[(\w+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(activity.template)) !== null) {
    if (m.index > last) {
      segments.push(
        <Inline key={key++} text={activity.template.slice(last, m.index)} />,
      );
    }
    const blankId = m[1];
    const filled = value[blankId] ?? "";
    const verdict = showAnswer ? perItem?.[blankId] : undefined;
    if (bank) {
      segments.push(
        <button
          key={key++}
          onClick={() => clearBlank(blankId)}
          disabled={locked || !filled}
          aria-label={filled ? `Filled: ${filled}. Tap to clear` : "Empty blank"}
          className={cn(
            "mx-1 inline-flex h-8 min-w-24 cursor-pointer items-center justify-center rounded-md border-2 px-2 align-middle text-sm font-semibold transition-colors",
            verdict === true && "border-mint-500 bg-mint-100 text-mint-700",
            verdict === false && "border-coral-500 bg-coral-100 text-coral-700",
            verdict === undefined &&
              (filled
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-dashed border-ink-300 bg-ink-50 text-ink-300"),
          )}
        >
          {filled || "………"}
        </button>,
      );
    } else {
      segments.push(
        <input
          key={key++}
          type="text"
          value={filled}
          disabled={locked}
          onChange={(e) => onChange({ ...value, [blankId]: e.target.value })}
          aria-label="Fill in the blank"
          size={Math.max(6, (activity.blanks[blankId]?.[0]?.length ?? 6) + 2)}
          className={cn(
            "mx-1 inline-block rounded-md border-2 px-2 py-1 align-middle font-mono text-sm font-semibold focus:outline-none",
            verdict === true && "border-mint-500 bg-mint-100 text-mint-700",
            verdict === false && "border-coral-500 bg-coral-100 text-coral-700",
            verdict === undefined &&
              "border-ink-300 bg-white text-ink-900 focus:border-brand-500",
          )}
        />,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < activity.template.length) {
    segments.push(<Inline key={key++} text={activity.template.slice(last)} />);
  }

  return (
    <div>
      <p className="text-[15px] leading-loose text-ink-800">{segments}</p>
      {bank && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-ink-100 bg-white p-3">
          {bank.map((word, i) => {
            const used = usedWords.includes(word);
            return (
              <button
                key={`${word}-${i}`}
                disabled={locked || used}
                onClick={() => fillNext(word)}
                className={cn(
                  "cursor-pointer rounded-full border-2 px-3 py-1.5 text-[13px] font-medium transition-all",
                  used
                    ? "border-ink-100 bg-ink-50 text-ink-300 line-through"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50",
                )}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
