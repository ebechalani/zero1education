"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { IDW_LESSONS, unitsForGrade } from "@/content/curriculum";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress-store";
import { BookOpen, Check, Lock, Play, Star } from "lucide-react";
import * as Icons from "lucide-react";
import Link from "next/link";

function UnitIcon({ name, className }: { name?: string; className?: string }) {
  const Icon =
    (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) ||
    BookOpen;
  return <Icon className={className} />;
}

export default function JourneyPage() {
  const hydrated = useHydrated();
  const state = useProgress();
  const units = unitsForGrade(6);
  const flagship = units.find((u) => u.id === "g6-idw")!;
  const bookUnits = units.filter((u) => u.id !== "g6-idw");

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Node states along the path
  const nodes = IDW_LESSONS.map((lesson, i) => {
    const p = state.lessons[lesson.id];
    const done = Boolean(p?.completedAt);
    const prevDone =
      i === 0 || Boolean(state.lessons[IDW_LESSONS[i - 1].id]?.completedAt);
    const status: "done" | "current" | "locked" = done
      ? "done"
      : prevDone
        ? "current"
        : "locked";
    return { lesson, progress: p, status };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="ZERO1 Journey"
        description="Your Grade 6 learning path. Complete each mission to unlock the next."
        eyebrow={<Chip tone="world">Grade 6 · ZERO1 Creator</Chip>}
      />

      {/* Flagship unit — mission path */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-signal-600 uppercase">
              Unit 1 · Interactive
            </p>
            <h2 className="font-display text-xl font-bold text-ink-900">
              {flagship.title}
            </h2>
            <p className="mt-0.5 max-w-xl text-sm text-ink-500">{flagship.summary}</p>
          </div>
          <Chip tone="mint">
            {nodes.filter((n) => n.status === "done").length}/{nodes.length} missions
          </Chip>
        </div>

        {/* The path */}
        <ol className="relative mx-auto max-w-2xl">
          {nodes.map(({ lesson, progress, status }, i) => {
            const left = i % 2 === 0;
            const stagePct = progress
              ? (progress.stagesDone.length / lesson.stages.length) * 100
              : 0;
            return (
              <li key={lesson.id} className="relative">
                {/* Connector */}
                {i > 0 && (
                  <div
                    className={cn(
                      "absolute -top-8 h-8 w-0.5",
                      left ? "left-[22%]" : "left-[78%]",
                      nodes[i - 1].status === "done" ? "bg-mint-300" : "bg-ink-100",
                    )}
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    "mb-8 flex items-center gap-4",
                    left ? "flex-row" : "flex-row-reverse text-right",
                  )}
                  style={{ [left ? "marginLeft" : "marginRight"]: "6%" } as React.CSSProperties}
                >
                  {/* Node */}
                  <Link
                    href={status === "locked" ? "#" : `/student/lesson/${lesson.id}`}
                    aria-disabled={status === "locked"}
                    onClick={(e) => status === "locked" && e.preventDefault()}
                    className={cn(
                      "relative flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-all",
                      status === "done" &&
                        "border-mint-500 bg-mint-100 text-mint-600 hover:scale-105",
                      status === "current" &&
                        "border-transparent text-white shadow-glow [background:var(--world-accent)] hover:scale-105",
                      status === "locked" &&
                        "cursor-not-allowed border-ink-200 bg-ink-50 text-ink-300",
                    )}
                  >
                    {status === "done" ? (
                      <Check className="size-7" />
                    ) : status === "locked" ? (
                      <Lock className="size-6" />
                    ) : (
                      <UnitIcon name={lesson.icon} className="size-7" />
                    )}
                    {status === "current" && (
                      <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-bit-500 text-white shadow">
                        <Play className="size-2.5" />
                      </span>
                    )}
                  </Link>
                  {/* Card */}
                  <Link
                    href={status === "locked" ? "#" : `/student/lesson/${lesson.id}`}
                    onClick={(e) => status === "locked" && e.preventDefault()}
                    className={cn(
                      "min-w-0 flex-1 rounded-xl border p-3.5 transition-colors",
                      status === "locked"
                        ? "cursor-not-allowed border-ink-100 bg-ink-50/50"
                        : "border-ink-100 bg-white shadow-card hover:border-brand-300",
                    )}
                  >
                    <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
                      Mission {lesson.order}
                    </p>
                    <p
                      className={cn(
                        "font-display text-[15px] font-bold",
                        status === "locked" ? "text-ink-400" : "text-ink-900",
                      )}
                    >
                      {lesson.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      {lesson.tagline}
                    </p>
                    {status !== "locked" && stagePct > 0 && status !== "done" && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full [background:var(--world-accent)]"
                          style={{ width: `${stagePct}%` }}
                        />
                      </div>
                    )}
                  </Link>
                </div>
              </li>
            );
          })}
          {/* Unit trophy */}
          <li className="flex justify-center">
            <div
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-8 py-4",
                nodes.every((n) => n.status === "done")
                  ? "border-bit-500 bg-bit-50"
                  : "border-ink-200",
              )}
            >
              <Star
                className={cn(
                  "size-8",
                  nodes.every((n) => n.status === "done")
                    ? "fill-bit-500 text-bit-500"
                    : "text-ink-300",
                )}
              />
              <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">
                Digital World Champion
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Book units */}
      <h3 className="font-display mt-8 mb-3 text-lg font-bold text-ink-900">
        The rest of your Grade 6 year
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bookUnits.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-ink-100 bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                <UnitIcon name={u.icon} className="size-5" />
              </span>
              <Chip tone="neutral">Coming soon</Chip>
            </div>
            <p className="font-display mt-3 text-[15px] font-bold text-ink-900">
              {u.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] text-ink-500">{u.summary}</p>
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-400">
              <BookOpen className="size-3.5" />
              {u.bookRef} — printed edition
              {u.plannedLessons ? ` · ${u.plannedLessons} lessons` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
