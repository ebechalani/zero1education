"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { getLesson } from "@/content/curriculum";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress-store";
import {
  Eye,
  EyeOff,
  FlaskConical,
  FolderKanban,
  MessageSquareQuote,
  Rocket,
  Zap,
} from "lucide-react";

const KIND_META = {
  project: { icon: <Rocket className="size-4" />, tone: "brand" as const, label: "Project" },
  lab: { icon: <FlaskConical className="size-4" />, tone: "signal" as const, label: "Lab" },
  challenge: { icon: <Zap className="size-4" />, tone: "bit" as const, label: "Challenge" },
  reflection: { icon: <MessageSquareQuote className="size-4" />, tone: "violet" as const, label: "Reflection" },
};

export default function PortfolioPage() {
  const hydrated = useHydrated();
  const { portfolio, toggleShowcase } = useProgress();

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const byGrade = new Map<string, typeof portfolio>();
  for (const item of portfolio) {
    const list = byGrade.get(item.gradeLabel) ?? [];
    list.push(item);
    byGrade.set(item.gradeLabel, list);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My ZERO1 Portfolio"
        description="Every project, reflection and creation you make is collected here automatically — a record of your work that grows across the years."
        eyebrow={<Chip tone="world" icon={<FolderKanban />}>{portfolio.length} artifacts</Chip>}
      />

      {portfolio.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="Your portfolio starts with your first creation"
          description="Complete the Create stage of any mission — submit a project or save a reflection — and it appears here."
          action={
            <a
              href="/student/journey"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Go to your Journey →
            </a>
          }
        />
      ) : (
        [...byGrade.entries()].map(([grade, items]) => (
          <section key={grade} className="mb-8">
            <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-ink-900">
              {grade}
              <span className="text-sm font-normal text-ink-400">
                · {items.length} piece{items.length === 1 ? "" : "s"}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => {
                const meta = KIND_META[item.kind];
                const lesson = item.lessonId ? getLesson(item.lessonId) : undefined;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border bg-white p-4 shadow-card transition-colors",
                      item.showcased ? "border-bit-400" : "border-ink-100",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Chip tone={meta.tone} icon={meta.icon}>
                        {meta.label}
                      </Chip>
                      <Tooltip
                        label={
                          item.showcased
                            ? "Remove from showcase"
                            : "Add to showcase — highlighted work visible to your teacher"
                        }
                      >
                        <button
                          onClick={() => toggleShowcase(item.id)}
                          aria-pressed={item.showcased}
                          className={cn(
                            "cursor-pointer rounded-md p-1.5 transition-colors",
                            item.showcased
                              ? "bg-bit-100 text-bit-600"
                              : "text-ink-300 hover:bg-ink-100 hover:text-ink-600",
                          )}
                        >
                          {item.showcased ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>
                      </Tooltip>
                    </div>
                    <h3 className="font-display mt-2.5 text-[15px] font-bold text-ink-900">
                      {item.title}
                    </h3>
                    {lesson && (
                      <p className="text-xs text-ink-400">from {lesson.title}</p>
                    )}
                    <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-600">
                      {item.content ?? item.summary}
                    </p>
                    <p className="mt-2.5 text-[11px] text-ink-400">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
