"use client";

import { Chip } from "@/components/ui/chip";
import { WorldBadge } from "@/components/brand/world-badge";
import { CATALOG, lessonsForUnit } from "@/content/curriculum";
import { chapterForUnit } from "@/content/books";
import { GRADES, worldForGrade } from "@/lib/worlds";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { BookMarked, BookOpen, ChevronRight, Library, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function UIcon({ name, className }: { name?: string; className?: string }) {
  const C =
    (name && (Icons as unknown as Record<string, Icons.LucideIcon>)[name]) || BookOpen;
  return <C className={className} />;
}

export default function LibraryPage() {
  const [grade, setGrade] = useState(6);
  const units = CATALOG.filter((u) => u.gradeId === `g${grade}`).sort(
    (a, b) => a.order - b.order,
  );
  const world = worldForGrade(grade);
  const readableCount = units.reduce(
    (acc, u) => acc + lessonsForUnit(u.id).filter((l) => l.status === "published").length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <div className="mb-6">
        <Chip tone="brand" icon={<Library />}>
          The ZERO1 book, online
        </Chip>
        <h1 className="font-display mt-3 text-3xl font-bold text-ink-900">
          Curriculum Library
        </h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-ink-500">
          Every lesson, readable end to end — no downloads, nothing locked. The
          activities sit alongside the reading, not in the middle of it.
        </p>
      </div>

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

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <WorldBadge world={world.id} showGrades />
        <span className="text-sm text-ink-500">
          {units.length} chapters ·{" "}
          <span className="font-semibold text-ink-700">{readableCount} readable now</span>
        </span>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {units.map((unit) => {
          const lessons = lessonsForUnit(unit.id);
          const readable = lessons.filter((l) => l.status === "published");
          return (
            <div
              key={unit.id}
              className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card"
            >
              <div className="flex items-start gap-4 p-4">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    readable.length > 0 ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-400",
                  )}
                  style={readable.length > 0 ? { color: world.accent } : undefined}
                >
                  <UIcon name={unit.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[16px] font-bold text-ink-900">
                      {unit.title}
                    </h2>
                    {unit.bookRef && (
                      <span className="font-mono text-[11px] text-ink-400">
                        {unit.bookRef}
                      </span>
                    )}
                    {readable.length > 0 ? (
                      <Chip tone="mint">{readable.length} lessons readable</Chip>
                    ) : (
                      <Chip tone="neutral">
                        {lessons.length || unit.plannedLessons || "?"} lessons · not yet online
                      </Chip>
                    )}
                  </div>
                  <p className="mt-1 text-[13.5px] text-ink-500">{unit.summary}</p>
                </div>
                {chapterForUnit(unit.id) && (
                  <Link
                    href={`/library/original/${chapterForUnit(unit.id)!.id}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-bit-300 bg-bit-50 px-3 py-1.5 text-[13px] font-semibold text-bit-700 transition-colors hover:bg-bit-100"
                  >
                    <BookMarked className="size-3.5" />
                    Original pages
                  </Link>
                )}
              </div>

              {lessons.length > 0 && (
                <ul className="divide-y divide-ink-50 border-t border-ink-100">
                  {lessons.map((l) => {
                    const open = l.status === "published";
                    const inner = (
                      <>
                        <span className="tnum w-6 shrink-0 font-mono text-xs text-ink-400">
                          {l.order}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[14px] font-semibold",
                              open ? "text-ink-800" : "text-ink-400",
                            )}
                          >
                            {l.title}
                          </span>
                          <span className="block truncate text-[12.5px] text-ink-400">
                            {l.description}
                          </span>
                        </span>
                        {open ? (
                          <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand-600">
                            Read <ChevronRight className="size-3.5" />
                          </span>
                        ) : (
                          <Lock className="size-3.5 shrink-0 text-ink-300" />
                        )}
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {open ? (
                          <Link
                            href={`/library/${l.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 pl-[76px] transition-colors hover:bg-brand-50/50"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div
                            className="flex cursor-not-allowed items-center gap-3 px-4 py-2.5 pl-[76px]"
                            title="This chapter has not been brought online yet"
                          >
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
