"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { BADGES } from "@/content/badges";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { toBinary } from "@/lib/xp";
import { summarize, useProgress } from "@/stores/progress-store";
import * as Icons from "lucide-react";
import { Award, Flame, Lock, Sparkles } from "lucide-react";

const tierStyles = {
  bronze: "from-[#B08D57] to-[#8a6a3f]",
  silver: "from-[#9aa5b1] to-[#6b7684]",
  gold: "from-bit-400 to-bit-600",
};

function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Award;
  return <Icon className={className} />;
}

export default function AchievementsPage() {
  const hydrated = useHydrated();
  const state = useProgress();

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  const s = summarize(state);
  const earned = BADGES.filter((b) => state.badges[b.id]);
  const locked = BADGES.filter((b) => !state.badges[b.id]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Achievements"
        description="Badges mark real milestones — missions completed, skills mastered, streaks kept. Mastery first, points second."
        eyebrow={
          <Chip tone="bit" icon={<Award />}>
            {earned.length}/{BADGES.length} earned
          </Chip>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {earned.length > 0 && (
            <div>
              <h2 className="font-display mb-3 text-lg font-bold text-ink-900">Earned</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {earned.map((b) => (
                  <div
                    key={b.id}
                    className="animate-pop rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card"
                  >
                    <span
                      className={cn(
                        "mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-pop",
                        tierStyles[b.tier],
                      )}
                    >
                      <BadgeIcon name={b.icon} className="size-7" />
                    </span>
                    <p className="font-display mt-3 text-[14.5px] font-bold text-ink-900">
                      {b.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-ink-500">{b.description}</p>
                    <p className="mt-2 text-[10px] tracking-wider text-ink-400 uppercase">
                      {new Date(state.badges[b.id]).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {b.tier}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display mb-3 text-lg font-bold text-ink-900">
              Still locked
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locked.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-4 text-center"
                >
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-300">
                    <Lock className="size-6" />
                  </span>
                  <p className="font-display mt-3 text-[14.5px] font-bold text-ink-500">
                    {b.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-400">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side stats */}
        <div className="space-y-4">
          <Card>
            <CardTitle>Level</CardTitle>
            <p className="tnum font-mono text-4xl font-bold text-ink-900">
              {s.level}
              <span className="ml-2 align-middle font-mono text-sm text-signal-600">
                {toBinary(s.level)}₂
              </span>
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {s.xpIntoLevel}/{s.xpForNextLevel} XP into this level
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-signal-500"
                style={{ width: `${(s.xpIntoLevel / s.xpForNextLevel) * 100}%` }}
              />
            </div>
          </Card>
          <Card>
            <CardTitle>Streak</CardTitle>
            <p className="flex items-center gap-2">
              <Flame className="size-8 text-coral-500" />
              <span className="tnum font-mono text-4xl font-bold text-ink-900">
                {s.streakDays}
              </span>
              <span className="text-sm text-ink-500">day{s.streakDays === 1 ? "" : "s"}</span>
            </p>
            <p className="mt-1.5 text-xs text-ink-400">
              Learn on consecutive days to grow it — 3 and 7 days earn badges.
            </p>
          </Card>
          <Card>
            <CardTitle>Recent XP</CardTitle>
            {state.recentXp.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-ink-400">
                <Sparkles className="size-4" /> XP appears as you learn.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {state.recentXp.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-600">{e.reason}</span>
                    <span className="tnum font-mono font-bold text-bit-600">+{e.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
