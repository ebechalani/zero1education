"use client";

import { WorldBadge } from "@/components/brand/world-badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBits, ProgressRing } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { badgeById } from "@/content/badges";
import { IDW_LESSONS, getUnit } from "@/content/curriculum";
import { DEMO_ANNOUNCEMENTS, DEMO_ASSIGNMENTS } from "@/content/demo/classroom";
import { useHydrated } from "@/lib/use-hydrated";
import { useProgress, summarize } from "@/stores/progress-store";
import { useSession } from "@/stores/session-store";
import { STAGE_META } from "@/features/mission/mission-player";
import {
  Award,
  CalendarClock,
  ChevronRight,
  Flame,
  Megaphone,
  Play,
  Rocket,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import * as Icons from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function LessonIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) || Rocket;
  return <Icon className={className} />;
}

export default function StudentDashboard() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const state = useProgress();

  if (!hydrated || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const s = summarize(state);
  const unit = getUnit("g6-idw")!;

  // Current mission = first published lesson not yet completed
  const currentLesson =
    IDW_LESSONS.find((l) => !state.lessons[l.id]?.completedAt) ?? IDW_LESSONS[0];
  const currentProgress = state.lessons[currentLesson.id];
  const stagePct = currentProgress
    ? (currentProgress.stagesDone.length / currentLesson.stages.length) * 100
    : 0;
  const currentStage =
    currentLesson.stages.find(
      (st) => !currentProgress?.stagesDone.includes(st.id),
    ) ?? currentLesson.stages[0];
  const unitDone = IDW_LESSONS.filter((l) => state.lessons[l.id]?.completedAt).length;

  const recentBadges = Object.entries(state.badges)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([id]) => badgeById.get(id))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">
            {greeting()}, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Grade 6 — ZERO1 ICT · Cedars International School
          </p>
        </div>
        <WorldBadge world="creator" showGrades />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Continue learning — hero card */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl bg-ink-900 p-6 shadow-pop">
            <div
              className="absolute -top-20 -right-20 size-64 rounded-full opacity-20 blur-3xl"
              style={{ background: "var(--world-accent)" }}
              aria-hidden
            />
            <p className="font-mono text-[10px] tracking-[0.25em] text-signal-400 uppercase">
              Continue learning · {unit.title}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <LessonIcon name={currentLesson.icon} className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold text-white">
                  Mission {currentLesson.order}: {currentLesson.title}
                </h2>
                <p className="mt-0.5 truncate text-sm text-ink-300">
                  {currentLesson.tagline}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-40">
                    <ProgressBits value={stagePct} tone="world" />
                  </div>
                  <span className="text-xs text-ink-300">
                    {currentProgress?.stagesDone.length ?? 0}/
                    {currentLesson.stages.length} stages
                  </span>
                  <Chip tone="world" icon={STAGE_META[currentStage.kind].icon}>
                    Next: {STAGE_META[currentStage.kind].label}
                  </Chip>
                </div>
              </div>
              <Button
                href={`/student/lesson/${currentLesson.id}`}
                variant="world"
                size="lg"
                icon={<Play />}
              >
                {currentProgress ? "Resume" : "Start"}
              </Button>
            </div>
          </div>

          {/* Unit progress + mission list */}
          <Card className="mt-5" padded={false}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="font-display text-[15px] font-semibold text-ink-900">
                {unit.title}
              </h3>
              <Link
                href="/student/journey"
                className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Full journey <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-ink-50">
              {IDW_LESSONS.map((l) => {
                const p = state.lessons[l.id];
                const done = Boolean(p?.completedAt);
                const started = Boolean(p?.startedAt);
                return (
                  <Link
                    key={l.id}
                    href={`/student/lesson/${l.id}`}
                    className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-brand-50/40"
                  >
                    <span
                      className={
                        "flex size-9 shrink-0 items-center justify-center rounded-lg " +
                        (done
                          ? "bg-mint-100 text-mint-600"
                          : started
                            ? "bg-signal-100 text-signal-700"
                            : "bg-ink-100 text-ink-400")
                      }
                    >
                      <LessonIcon name={l.icon} className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-800">
                        {l.order}. {l.title}
                      </span>
                      <span className="block text-xs text-ink-400">
                        {l.estimatedMinutes} min · {l.stages.length} stages
                      </span>
                    </span>
                    {done ? (
                      <Chip tone="mint">Complete</Chip>
                    ) : started ? (
                      <Chip tone="signal">In progress</Chip>
                    ) : (
                      <Chip tone="neutral">Not started</Chip>
                    )}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Level card */}
          <Card>
            <div className="flex items-center gap-4">
              <ProgressRing
                value={(s.xpIntoLevel / s.xpForNextLevel) * 100}
                size={72}
                tone="world"
              >
                <span className="text-center">
                  <span className="tnum block font-mono text-xl font-bold text-ink-900">
                    {s.level}
                  </span>
                  <span className="block text-[9px] tracking-wider text-ink-400 uppercase">
                    Level
                  </span>
                </span>
              </ProgressRing>
              <div className="flex-1 space-y-1.5">
                <p className="tnum font-mono text-sm font-semibold text-ink-900">
                  {s.xp} XP
                  <span className="ml-1.5 text-[11px] font-normal text-ink-400">
                    · {s.xpForNextLevel - s.xpIntoLevel} to level {s.level + 1}
                  </span>
                </p>
                <div className="flex gap-4 text-center">
                  <span>
                    <span className="tnum block font-mono text-lg font-bold text-coral-500">
                      <Flame className="mr-0.5 inline size-4 -translate-y-px" />
                      {s.streakDays}
                    </span>
                    <span className="block text-[10px] text-ink-400 uppercase">Streak</span>
                  </span>
                  <span>
                    <span className="tnum block font-mono text-lg font-bold text-ink-900">
                      {unitDone}
                    </span>
                    <span className="block text-[10px] text-ink-400 uppercase">Missions</span>
                  </span>
                  <span>
                    <span className="tnum block font-mono text-lg font-bold text-ink-900">
                      {s.skillsMastered}
                    </span>
                    <span className="block text-[10px] text-ink-400 uppercase">Mastered</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent achievements */}
          <Card>
            <CardTitle
              action={
                <Link href="/student/achievements" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                  All
                </Link>
              }
            >
              Achievements
            </CardTitle>
            {recentBadges.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ink-400">
                <Award className="size-4" /> Complete your first mission to earn
                badges.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {recentBadges.map((b) => (
                  <li key={b!.id} className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-bit-100 text-bit-600">
                      <Trophy className="size-4.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink-800">
                        {b!.title}
                      </span>
                      <span className="block text-xs text-ink-400">
                        {b!.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Assignments */}
          <Card>
            <CardTitle>Upcoming</CardTitle>
            <ul className="space-y-2.5">
              {DEMO_ASSIGNMENTS.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <CalendarClock className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/student/lesson/${a.lessonId}`}
                      className="block truncate text-sm font-semibold text-ink-800 hover:text-brand-700"
                    >
                      {a.title}
                    </Link>
                    <span className="block text-xs text-ink-400">
                      Due {new Date(a.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Announcements */}
          <Card>
            <CardTitle>From Ms. Khoury</CardTitle>
            <ul className="space-y-3">
              {DEMO_ANNOUNCEMENTS.map((a) => (
                <li key={a.id} className="rounded-lg bg-ink-50/70 p-3">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-800">
                    <Megaphone className="size-3.5 text-brand-500" /> {a.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{a.body}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Link
            href="/student/skills"
            className="flex items-center justify-between rounded-xl border border-ink-100 bg-gradient-to-r from-brand-600 to-signal-600 p-4 text-white shadow-card transition-transform hover:scale-[1.01]"
          >
            <span>
              <span className="flex items-center gap-1.5 font-display text-[15px] font-bold">
                <Sparkles className="size-4" /> ZERO1 Digital Passport
              </span>
              <span className="text-xs text-white/80">
                {s.skillsMastered} skills mastered — see your competency map
              </span>
            </span>
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
