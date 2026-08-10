"use client";

import { Button } from "@/components/ui/button";
import { Inline, Md } from "@/components/ui/md";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/content";
import type { ActivityResult } from "@/types/progress";
import {
  CheckCircle2,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { McqBody, MultiBody, TrueFalseBody } from "./bodies/choice";
import { MatchBody } from "./bodies/match";
import { SortBody } from "./bodies/sort";
import { ClassifyBody } from "./bodies/classify";
import { FillBlankBody } from "./bodies/fillblank";
import {
  isAnswerable,
  validateActivity,
  type ActivityValue,
  type Verdict,
} from "./validate";

const MAX_ATTEMPTS_BEFORE_REVEAL = 3;

export interface ActivityOutcome {
  correct: boolean;
  score: number;
  attempts: number;
  firstTry: boolean;
}

/**
 * One engine for every interaction type. Owns the attempt flow:
 * answer → check → feedback → hint/retry → explanation.
 * Answers are never revealed before the third failed attempt.
 */
export function ActivityPlayer({
  activity,
  onComplete,
  previousResult,
  teacherReveal = false,
}: {
  activity: Activity;
  onComplete?: (outcome: ActivityOutcome) => void;
  /** Prior stored result — locks the activity in its completed state */
  previousResult?: ActivityResult;
  /** Teach Mode: show the answer immediately without recording */
  teacherReveal?: boolean;
}) {
  // Captured at mount only: solving it *now* must show the celebration, not
  // flip straight to the "already solved" state as the result is stored.
  const [alreadyDone] = useState(() => Boolean(previousResult?.correct));
  const [value, setValue] = useState<ActivityValue>(
    activity.kind === "multi" || activity.kind === "sort" ? [] : null,
  );
  const [attempts, setAttempts] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [phase, setPhase] = useState<"answering" | "wrong" | "done">(
    alreadyDone ? "done" : "answering",
  );
  const [hintsShown, setHintsShown] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const showAnswer = teacherReveal || revealed || (phase === "done" && verdict !== null) || alreadyDone;
  const locked = phase === "done" || teacherReveal;

  const check = () => {
    const v = validateActivity(activity, value);
    const attemptCount = attempts + 1;
    setAttempts(attemptCount);
    setVerdict(v);
    if (v.correct) {
      setPhase("done");
      onComplete?.({
        correct: true,
        score: 100,
        attempts: attemptCount,
        firstTry: attemptCount === 1,
      });
    } else {
      setPhase("wrong");
    }
  };

  const reveal = () => {
    const v = validateActivity(activity, value);
    setRevealed(true);
    setVerdict(v);
    setPhase("done");
    onComplete?.({
      correct: false,
      score: v.score,
      attempts,
      firstTry: false,
    });
  };

  const retry = () => {
    setPhase("answering");
    setVerdict(null);
    if (activity.kind === "mcq" || activity.kind === "truefalse") setValue(null);
  };

  const body = (() => {
    const common = { locked, showAnswer };
    switch (activity.kind) {
      case "mcq":
        return (
          <McqBody
            activity={activity}
            value={value as string | null}
            onChange={(v) => setValue(v)}
            {...common}
          />
        );
      case "multi":
        return (
          <MultiBody
            activity={activity}
            value={(value as string[]) ?? []}
            onChange={(v) => setValue(v)}
            {...common}
          />
        );
      case "truefalse":
        return (
          <TrueFalseBody
            activity={activity}
            value={value as boolean | null}
            onChange={(v) => setValue(v)}
            {...common}
          />
        );
      case "match":
        return (
          <MatchBody
            activity={activity}
            value={(value as Record<string, string>) ?? {}}
            onChange={(v) => setValue(v)}
            perItem={verdict?.perItem}
            {...common}
          />
        );
      case "sort":
        return (
          <SortBody
            activity={activity}
            value={(value as string[]) ?? []}
            onChange={(v) => setValue(v)}
            perItem={verdict?.perItem}
            {...common}
          />
        );
      case "classify":
        return (
          <ClassifyBody
            activity={activity}
            value={(value as Record<string, string>) ?? {}}
            onChange={(v) => setValue(v)}
            perItem={verdict?.perItem}
            {...common}
          />
        );
      case "fillblank":
        return (
          <FillBlankBody
            activity={activity}
            value={(value as Record<string, string>) ?? {}}
            onChange={(v) => setValue(v)}
            perItem={verdict?.perItem}
            {...common}
          />
        );
    }
  })();

  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <p className="mb-4 text-[15px] leading-relaxed font-medium whitespace-pre-line text-ink-900">
        <Inline text={activity.prompt} />
      </p>

      {body}

      {/* Feedback banner */}
      {phase === "done" && !alreadyDone && verdict?.correct && (
        <div className="animate-pop mt-4 flex items-center gap-2.5 rounded-lg bg-mint-100 px-4 py-3 text-sm font-semibold text-mint-700">
          <CheckCircle2 className="size-5 shrink-0" />
          {attempts === 1 ? "Perfect — first try!" : "Correct — well done!"}
          <Sparkles className="ml-auto size-4 text-bit-500" />
        </div>
      )}
      {alreadyDone && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-mint-100/60 px-4 py-3 text-sm font-medium text-mint-700">
          <CheckCircle2 className="size-5 shrink-0" />
          Already solved — nice work.
        </div>
      )}
      {phase === "done" && revealed && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-amber-100 px-4 py-3 text-sm font-medium text-amber-700">
          <Eye className="size-5 shrink-0" />
          Solution revealed — review it, you&apos;ll get it next time.
        </div>
      )}
      {phase === "wrong" && (
        <div className="animate-pop mt-4 flex items-center gap-2.5 rounded-lg bg-coral-100 px-4 py-3 text-sm font-semibold text-coral-700">
          <XCircle className="size-5 shrink-0" />
          Not quite{verdict && verdict.score > 0 ? ` — ${verdict.score}% right` : ""}.
          Adjust and try again.
        </div>
      )}

      {/* Hint */}
      {hintsShown > 0 && activity.hints && (
        <div className="mt-3 space-y-2">
          {activity.hints.slice(0, hintsShown).map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-bit-200 bg-bit-50 px-3.5 py-2.5 text-[13px] text-ink-700"
            >
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-bit-600" />
              <Inline text={h} />
            </div>
          ))}
        </div>
      )}

      {/* Explanation after completion */}
      {phase === "done" && activity.explanation && (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
          <p className="mb-1 text-xs font-bold tracking-wide text-brand-700 uppercase">
            Why
          </p>
          <Md text={activity.explanation} className="text-sm" />
        </div>
      )}

      {/* Controls */}
      {!teacherReveal && phase !== "done" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {phase === "answering" && (
            <Button
              onClick={check}
              disabled={!isAnswerable(activity, value)}
              size="md"
            >
              Check answer
            </Button>
          )}
          {phase === "wrong" && (
            <Button onClick={retry} icon={<RotateCcw />} size="md">
              Try again
            </Button>
          )}
          {activity.hints && hintsShown < activity.hints.length && (
            <Button
              variant="secondary"
              size="md"
              icon={<Lightbulb />}
              onClick={() => setHintsShown((h) => h + 1)}
            >
              Hint {activity.hints.length > 1 ? `(${hintsShown + 1}/${activity.hints.length})` : ""}
            </Button>
          )}
          {phase === "wrong" && attempts >= MAX_ATTEMPTS_BEFORE_REVEAL && (
            <Button variant="ghost" size="md" icon={<Eye />} onClick={reveal}>
              Show solution
            </Button>
          )}
          <span
            className={cn(
              "ml-auto font-mono text-xs text-ink-400",
              attempts >= MAX_ATTEMPTS_BEFORE_REVEAL && "text-amber-700",
            )}
          >
            {attempts > 0 && `Attempt ${attempts}`}
          </span>
        </div>
      )}
    </div>
  );
}
