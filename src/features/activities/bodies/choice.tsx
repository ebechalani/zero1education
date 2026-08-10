"use client";

import { cn, shuffleSeeded, hashString } from "@/lib/utils";
import { Inline } from "@/components/ui/md";
import { Check, X } from "lucide-react";
import type {
  McqActivity,
  MultiActivity,
  TrueFalseActivity,
} from "@/types/content";
import { useMemo } from "react";

const optionBase =
  "w-full cursor-pointer rounded-lg border-2 px-4 py-3 text-left text-sm transition-all duration-150 disabled:cursor-default";

function optionCls(state: "idle" | "selected" | "correct" | "wrong") {
  switch (state) {
    case "selected":
      return "border-brand-500 bg-brand-50 text-ink-900";
    case "correct":
      return "border-mint-500 bg-mint-100 text-mint-700";
    case "wrong":
      return "border-coral-500 bg-coral-100 text-coral-700";
    default:
      return "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/40";
  }
}

export function McqBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
}: {
  activity: McqActivity;
  value: string | null;
  onChange: (v: string) => void;
  locked: boolean;
  showAnswer: boolean;
}) {
  const options = useMemo(
    () => shuffleSeeded(activity.options, hashString(activity.id)),
    [activity],
  );
  return (
    <div className="space-y-2" role="radiogroup" aria-label={activity.prompt}>
      {options.map((opt) => {
        const selected = value === opt.id;
        const state = showAnswer
          ? opt.id === activity.answerId
            ? "correct"
            : selected
              ? "wrong"
              : "idle"
          : selected
            ? "selected"
            : "idle";
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChange(opt.id)}
            className={cn(optionBase, optionCls(state))}
          >
            <span className="flex items-center justify-between gap-2">
              <Inline text={opt.text} />
              {state === "correct" && <Check className="size-4 shrink-0" />}
              {state === "wrong" && <X className="size-4 shrink-0" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
}: {
  activity: MultiActivity;
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
  showAnswer: boolean;
}) {
  const options = useMemo(
    () => shuffleSeeded(activity.options, hashString(activity.id)),
    [activity],
  );
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value.includes(opt.id);
        const shouldPick = activity.answerIds.includes(opt.id);
        const state = showAnswer
          ? shouldPick
            ? "correct"
            : selected
              ? "wrong"
              : "idle"
          : selected
            ? "selected"
            : "idle";
        return (
          <button
            key={opt.id}
            role="checkbox"
            aria-checked={selected}
            disabled={locked}
            onClick={() => toggle(opt.id)}
            className={cn(optionBase, optionCls(state))}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-4.5 shrink-0 items-center justify-center rounded border-2",
                  selected || (showAnswer && shouldPick)
                    ? "border-current bg-current/10"
                    : "border-ink-300",
                )}
                aria-hidden
              >
                {(selected || (showAnswer && shouldPick)) && (
                  <Check className="size-3" />
                )}
              </span>
              <Inline text={opt.text} />
            </span>
          </button>
        );
      })}
      <p className="text-xs text-ink-400">Select every answer that applies.</p>
    </div>
  );
}

export function TrueFalseBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
}: {
  activity: TrueFalseActivity;
  value: boolean | null;
  onChange: (v: boolean) => void;
  locked: boolean;
  showAnswer: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {([true, false] as const).map((v) => {
        const selected = value === v;
        const state = showAnswer
          ? v === activity.answer
            ? "correct"
            : selected
              ? "wrong"
              : "idle"
          : selected
            ? "selected"
            : "idle";
        return (
          <button
            key={String(v)}
            disabled={locked}
            onClick={() => onChange(v)}
            aria-pressed={selected}
            className={cn(
              optionBase,
              "py-4 text-center font-display text-base font-semibold",
              optionCls(state),
            )}
          >
            {v ? "TRUE" : "FALSE"}
          </button>
        );
      })}
    </div>
  );
}
