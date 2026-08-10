"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { WorldBadge } from "@/components/brand/world-badge";
import { Chip } from "@/components/ui/chip";
import { lessonsForUnit, unitsForGrade } from "@/content/curriculum";
import { GRADES, worldForGrade } from "@/lib/worlds";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { BookOpen, ChevronRight, MonitorPlay, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function UIcon({ name, className }: { name?: string; className?: string }) {
  const Icon =
    (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) || BookOpen;
  return <Icon className={className} />;
}

export default function CurriculumPage() {
  const [grade, setGrade] = useState(6);
  const units = unitsForGrade(grade);
  const world = worldForGrade(grade);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Curriculum"
        description="The full ZERO1 scope — Grade 0 to Grade 12, mirroring the printed editions. Interactive units are marked live."
        eyebrow={<WorldBadge world={world.id} showGrades />}
      />

      {/* Grade rail */}
      <div className="thin-scroll mb-6 flex gap-1.5 overflow-x-auto pb-2">
        {GRADES.map((g) => {
          const w = worldForGrade(g.number);
          const active = g.number === grade;
          return (
            <button
              key={g.id}
              onClick={() => setGrade(g.number)}
              className={cn(
                "shrink-0 cursor-pointer rounded-lg border-2 px-3.5 py-1.5 text-sm font-semibold transition-all",
                active
                  ? "border-transparent text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
              )}
              style={active ? { background: w.accent } : undefined}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Units */}
      <div className="space-y-3">
        {units.map((unit) => {
          const lessons = lessonsForUnit(unit.id);
          const live = unit.status === "published";
          return (
            <div
              key={unit.id}
              className={cn(
                "rounded-xl border bg-white shadow-card",
                live ? "border-brand-200" : "border-ink-100",
              )}
            >
              <div className="flex items-center gap-4 p-4">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    live ? "bg-ink-900" : "bg-ink-100 text-ink-500",
                  )}
                  style={live ? { color: world.accent } : undefined}
                >
                  <UIcon name={unit.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[15.5px] font-bold text-ink-900">
                      Unit {unit.order}: {unit.title}
                    </h3>
                    {live ? (
                      <Chip tone="mint">Interactive · live</Chip>
                    ) : (
                      <Chip tone="neutral">
                        {unit.bookRef} · {unit.plannedLessons ? `${unit.plannedLessons} lessons · ` : ""}coming soon
                      </Chip>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-ink-500">{unit.summary}</p>
                </div>
              </div>

              {lessons.length > 0 && (
                <div className="divide-y divide-ink-50 border-t border-ink-100">
                  {lessons.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 pl-[76px]">
                      <span className="tnum w-5 font-mono text-xs text-ink-400">
                        {l.order}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            l.status === "published" ? "text-ink-800" : "text-ink-400",
                          )}
                        >
                          {l.title}
                        </span>
                        <span className="block truncate text-xs text-ink-400">
                          {l.description}
                        </span>
                      </span>
                      {l.status === "published" ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <Link
                            href={`/teacher/lesson/${l.id}`}
                            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-brand-600 hover:bg-brand-50"
                          >
                            Lesson kit <ChevronRight className="size-3.5" />
                          </Link>
                          <Link
                            href={`/teacher/teach/${l.id}`}
                            title="Open in Teach Mode"
                            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-ink-600 hover:bg-ink-100"
                          >
                            <MonitorPlay className="size-4" />
                          </Link>
                          <Link
                            href={`/student/lesson/${l.id}`}
                            title="Preview as student"
                            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-ink-600 hover:bg-ink-100"
                          >
                            <PlayCircle className="size-4" />
                          </Link>
                        </span>
                      ) : (
                        <Chip tone="neutral">Authoring in Studio</Chip>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
