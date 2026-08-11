"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CATALOG, lessonsForUnit } from "@/content/curriculum";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { GRADES, worldForGrade } from "@/lib/worlds";
import { useStudio } from "@/stores/studio-store";
import { ChevronDown, ChevronRight, FileEdit, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function StudioCurriculumPage() {
  const hydrated = useHydrated();
  const { drafts } = useStudio();
  const [openGrades, setOpenGrades] = useState<Set<string>>(new Set(["g6"]));
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set(["g6-microbit"]));

  const toggle = (set: Set<string>, id: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Curriculum"
        description="The whole ZERO1 scope as a tree: grades → units → lessons. Edit any lesson in the block-based builder."
        actions={
          <Button
            variant="secondary"
            icon={<Plus />}
            onClick={() => alert("New unit: creates a draft unit in Firestore in production.")}
          >
            New unit
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
        {GRADES.map((g) => {
          const units = CATALOG.filter((u) => u.gradeId === g.id);
          const gradeOpen = openGrades.has(g.id);
          const w = worldForGrade(g.number);
          const live = units.filter((u) => u.status === "published").length;
          return (
            <div key={g.id} className="border-b border-ink-50 last:border-0">
              <button
                onClick={() => toggle(openGrades, g.id, setOpenGrades)}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50/60"
              >
                {gradeOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-ink-400" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-ink-400" />
                )}
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: w.accent }}
                />
                <span className="font-display text-[15px] font-bold text-ink-900">
                  {g.label}
                </span>
                <span className="text-xs text-ink-400">
                  {w.name.replace("ZERO1 ", "")} · {units.length} units
                </span>
                {live > 0 && (
                  <Chip tone="mint" className="ml-auto">
                    {live} live
                  </Chip>
                )}
              </button>

              {gradeOpen && (
                <div className="pb-2 pl-11">
                  {units.map((unit) => {
                    const lessons = lessonsForUnit(unit.id);
                    const unitOpen = openUnits.has(unit.id);
                    return (
                      <div key={unit.id}>
                        <button
                          onClick={() => toggle(openUnits, unit.id, setOpenUnits)}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-ink-50"
                        >
                          {lessons.length > 0 ? (
                            unitOpen ? (
                              <ChevronDown className="size-3.5 shrink-0 text-ink-300" />
                            ) : (
                              <ChevronRight className="size-3.5 shrink-0 text-ink-300" />
                            )
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-700">
                            {unit.order}. {unit.title}
                          </span>
                          {unit.bookRef && (
                            <span className="shrink-0 font-mono text-[11px] text-ink-400">
                              {unit.bookRef}
                            </span>
                          )}
                          <Chip tone={unit.status === "published" ? "mint" : "neutral"}>
                            {unit.status === "published" ? "published" : "print only"}
                          </Chip>
                        </button>

                        {unitOpen && lessons.length > 0 && (
                          <ul className="mb-1 ml-6 border-l border-ink-100">
                            {lessons.map((l) => {
                              const draft = hydrated ? drafts[l.id] : undefined;
                              const editable = l.status === "published";
                              return (
                                <li
                                  key={l.id}
                                  className="flex items-center gap-2 py-1.5 pl-3"
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 shrink-0 rounded-full",
                                      l.status === "published" ? "bg-mint-500" : "bg-ink-200",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "min-w-0 flex-1 truncate text-[13px]",
                                      l.status === "published" ? "text-ink-700" : "text-ink-400",
                                    )}
                                  >
                                    {l.title}
                                  </span>
                                  {draft && (
                                    <Chip tone="bit" icon={<FileEdit />}>
                                      {draft.status === "published" ? "republished" : "draft"}
                                    </Chip>
                                  )}
                                  {editable ? (
                                    <Link
                                      href={`/studio/lessons/${l.id}/edit`}
                                      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-semibold text-brand-600 hover:bg-brand-50"
                                    >
                                      <Pencil className="size-3.5" /> Edit
                                    </Link>
                                  ) : (
                                    <span className="shrink-0 px-2 text-[12px] text-ink-300">
                                      not authored
                                    </span>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
