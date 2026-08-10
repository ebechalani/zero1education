"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBits } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SKILLS, SKILL_CATEGORIES } from "@/content/skills";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { summarize, useProgress } from "@/stores/progress-store";
import { useSession } from "@/stores/session-store";
import type { SkillCategory } from "@/types/content";
import * as Icons from "lucide-react";
import { BadgeCheck, Fingerprint } from "lucide-react";

function levelLabel(v: number) {
  if (v >= 80) return { text: "Mastered", tone: "mint" as const };
  if (v >= 50) return { text: "Developing", tone: "signal" as const };
  if (v > 0) return { text: "Learning", tone: "brand" as const };
  return { text: "Not started", tone: "neutral" as const };
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Icons.Circle;
  return <Icon className={className} />;
}

export default function PassportPage() {
  const hydrated = useHydrated();
  const { user } = useSession();
  const state = useProgress();

  if (!hydrated || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  const s = summarize(state);

  // Group skills by category, only categories with tracked or touched skills
  const grouped = new Map<SkillCategory, { skillId: string; title: string; blurb: string; value: number }[]>();
  for (const skill of SKILLS) {
    const value = state.skills[skill.id] ?? 0;
    const list = grouped.get(skill.category) ?? [];
    list.push({ skillId: skill.id, title: skill.title, blurb: skill.blurb, value });
    grouped.set(skill.category, list);
  }
  const categories = [...grouped.entries()].sort((a, b) => {
    const avg = (l: { value: number }[]) =>
      l.reduce((acc, x) => acc + x.value, 0) / l.length;
    return avg(b[1]) - avg(a[1]);
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="ZERO1 Digital Passport"
        description="Your competency profile — it grows with every mission, lab and checkpoint, and follows you from grade to grade."
        eyebrow={
          <Chip tone="world" icon={<Fingerprint />}>
            Competency profile
          </Chip>
        }
      />

      {/* Passport identity card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-ink-200 shadow-card">
        <div className="flex flex-wrap items-center gap-5 bg-ink-900 px-6 py-5">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            hue={user.avatarHue}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.3em] text-signal-400 uppercase">
              ZERO1 · Digital Passport
            </p>
            <h2 className="font-display text-xl font-bold text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-ink-300">
              Grade 6 · Cedars International School
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="tnum font-mono text-2xl font-bold text-white">{s.level}</p>
              <p className="text-[10px] tracking-wide text-ink-400 uppercase">Level</p>
            </div>
            <div>
              <p className="tnum font-mono text-2xl font-bold text-bit-400">
                {s.skillsMastered}
              </p>
              <p className="text-[10px] tracking-wide text-ink-400 uppercase">Mastered</p>
            </div>
            <div>
              <p className="tnum font-mono text-2xl font-bold text-signal-400">
                {s.badgesEarned}
              </p>
              <p className="text-[10px] tracking-wide text-ink-400 uppercase">Badges</p>
            </div>
          </div>
        </div>
        {/* passport machine-readable strip — a playful brand touch */}
        <div className="bg-ink-950 px-6 py-2 font-mono text-[10px] tracking-[0.2em] text-ink-500 uppercase">
          Z1&lt;&lt;{user.lastName.toUpperCase().replace(/\s/g, "")}&lt;&lt;{user.firstName.toUpperCase()}&lt;&lt;G6&lt;&lt;LVL{s.level}&lt;&lt;XP{s.xp}
        </div>
      </div>

      {/* Competency map */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(([cat, skills]) => {
          const meta = SKILL_CATEGORIES[cat];
          const avg = Math.round(
            skills.reduce((acc, s) => acc + s.value, 0) / skills.length,
          );
          return (
            <Card key={cat} padded={false}>
              <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    avg >= 50 ? "bg-brand-100 text-brand-600" : "bg-ink-100 text-ink-400",
                  )}
                >
                  <CategoryIcon name={meta.icon} className="size-4" />
                </span>
                <h3 className="font-display flex-1 text-[14.5px] font-bold text-ink-900">
                  {meta.label}
                </h3>
                <span className="tnum font-mono text-sm font-bold text-ink-600">{avg}%</span>
              </div>
              <ul className="divide-y divide-ink-50 px-4">
                {skills.map((skill) => {
                  const lvl = levelLabel(skill.value);
                  return (
                    <li key={skill.skillId} className="py-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-800">
                          {skill.value >= 80 && (
                            <BadgeCheck className="size-4 text-mint-500" />
                          )}
                          {skill.title}
                        </span>
                        <Chip tone={lvl.tone}>{lvl.text}</Chip>
                      </div>
                      <ProgressBits
                        value={skill.value}
                        tone={skill.value >= 80 ? "mint" : "world"}
                      />
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">
        Mastery is earned through evidence — solved activities, completed labs and
        passed checkpoints — never just time spent.
      </p>
    </div>
  );
}
