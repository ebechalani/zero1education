"use client";

import { ProgressBits } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QuizBlock as QuizBlockType } from "@/types/content";
import type { ActivityResult } from "@/types/progress";
import { Target, Trophy } from "lucide-react";
import { ActivityPlayer, type ActivityOutcome } from "@/features/activities/activity-player";

/**
 * Checkpoint quiz — a sequence of activities with a mastery bar.
 * Pass threshold defaults to 70%. Results flow through the same generic
 * activity pipeline as everything else.
 */
export function QuizBlockView({
  block,
  results,
  onQuestionComplete,
  teacherReveal,
}: {
  block: QuizBlockType;
  results: Record<string, ActivityResult>;
  onQuestionComplete: (activityId: string, outcome: ActivityOutcome, skillIds?: string[]) => void;
  teacherReveal?: boolean;
}) {
  const passPct = block.passPct ?? 70;
  const total = block.questions.length;
  const answered = block.questions.filter((q) => results[q.id]).length;
  const correct = block.questions.filter((q) => results[q.id]?.correct).length;
  const done = answered === total;
  const scorePct = total ? Math.round((correct / total) * 100) : 0;
  const passed = scorePct >= passPct;

  return (
    <div>
      {/* Status header */}
      <div className="mb-4 flex items-center gap-4 rounded-lg border border-ink-100 bg-white px-4 py-3 shadow-card">
        <Target className="size-5 shrink-0 text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900">
            {block.title ?? "Checkpoint"}
          </p>
          <p className="text-xs text-ink-500">
            {done
              ? `Finished — ${correct}/${total} correct (${scorePct}%)`
              : `${answered}/${total} answered · pass at ${passPct}%`}
          </p>
        </div>
        <div className="w-28">
          <ProgressBits
            value={(answered / Math.max(total, 1)) * 100}
            tone={done ? (passed ? "mint" : "bit") : "brand"}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {block.questions.map((q, i) => (
          <div key={q.id}>
            <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
              Question {i + 1} / {total}
            </p>
            <ActivityPlayer
              activity={q}
              previousResult={results[q.id]}
              teacherReveal={teacherReveal}
              onComplete={(outcome) => onQuestionComplete(q.id, outcome, q.skillIds)}
            />
          </div>
        ))}
      </div>

      {/* Result banner */}
      {done && (
        <div
          className={cn(
            "animate-pop mt-5 flex items-center gap-3 rounded-lg px-5 py-4",
            passed ? "bg-mint-100" : "bg-bit-100",
          )}
        >
          <Trophy className={cn("size-6", passed ? "text-mint-600" : "text-bit-600")} />
          <div>
            <p className={cn("font-display text-[15px] font-bold", passed ? "text-mint-700" : "text-bit-700")}>
              {passed
                ? scorePct === 100
                  ? "Perfect checkpoint — flawless!"
                  : "Checkpoint passed!"
                : "Checkpoint finished — keep training"}
            </p>
            <p className="text-[13px] text-ink-600">
              {passed
                ? `You scored ${scorePct}%. Mastery recorded in your Digital Passport.`
                : `You scored ${scorePct}% — review the explanations above, the skills will count once you strengthen them.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
