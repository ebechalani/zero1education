"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Chip } from "@/components/ui/chip";
import { ROSTER } from "@/content/demo/classroom";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";

const CLASSES = [
  {
    id: "cls-6a",
    name: "Grade 6 — Section A",
    grade: 6,
    students: ROSTER.length,
    unit: "Inside the Digital World",
    schedule: "Mon · Wed · Fri",
    live: true,
  },
  {
    id: "cls-6b",
    name: "Grade 6 — Section B",
    grade: 6,
    students: 22,
    unit: "Inside the Digital World",
    schedule: "Tue · Thu",
    live: false,
  },
  {
    id: "cls-7a",
    name: "Grade 7 — Section A",
    grade: 7,
    students: 26,
    unit: "HTML",
    schedule: "Mon · Thu",
    live: false,
  },
];

export default function ClassesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="My Classes"
        description="Three classes this year. The demo dataset is fully wired for Grade 6 — Section A."
      />
      <div className="space-y-3">
        {CLASSES.map((c) => (
          <Link
            key={c.id}
            href={c.live ? `/teacher/classes/${c.id}` : "#"}
            onClick={(e) => !c.live && e.preventDefault()}
            className={
              c.live
                ? "flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:border-brand-300 hover:shadow-pop"
                : "flex cursor-not-allowed items-center gap-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-5"
            }
          >
            <span
              className={
                "flex size-12 shrink-0 items-center justify-center rounded-xl " +
                (c.live ? "bg-ink-900 text-signal-400" : "bg-ink-100 text-ink-400")
              }
            >
              <Users className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-display text-[16px] font-bold text-ink-900">
                  {c.name}
                </span>
                {c.live ? (
                  <Chip tone="mint">Demo data wired</Chip>
                ) : (
                  <Chip tone="neutral">Sample</Chip>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-ink-500">
                {c.students} students · {c.unit} · {c.schedule}
              </span>
            </span>
            {c.live && <ArrowRight className="size-5 shrink-0 text-ink-300" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
