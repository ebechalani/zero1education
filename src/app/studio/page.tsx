"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Stat } from "@/components/ui/stat";
import { CATALOG, ALL_LESSONS } from "@/content/curriculum";
import { useHydrated } from "@/lib/use-hydrated";
import { useStudio } from "@/stores/studio-store";
import { GRADES, worldForGrade } from "@/lib/worlds";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  FileEdit,
  Library,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function StudioDashboard() {
  const hydrated = useHydrated();
  const { drafts } = useStudio();
  const published = CATALOG.filter((u) => u.status === "published").length;
  const draftCount = hydrated ? Object.keys(drafts).length : 0;
  const publishedLessons = ALL_LESSONS.filter((l) => l.status === "published").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="ZERO1 HQ"
        description="Author the curriculum, publish releases, and run the network of schools — without touching code."
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Units in catalog" value={CATALOG.length} icon={<Library />} hint="Grade 0 → Grade 12" />
        <Stat label="Interactive units live" value={published} tone="mint" icon={<BookOpenCheck />} hint={`${publishedLessons} mission lessons`} />
        <Stat label="Open drafts" value={draftCount} tone="bit" icon={<FileEdit />} hint="In the Lesson Builder" />
        <Stat label="Schools" value={3} tone="brand" icon={<Building2 />} hint="1 active · 2 in pilot" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Coverage map */}
        <Card className="lg:col-span-2">
          <CardTitle
            action={
              <Link href="/studio/curriculum" className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Open curriculum <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            Conversion pipeline — print to interactive
          </CardTitle>
          <div className="space-y-2">
            {GRADES.map((g) => {
              const units = CATALOG.filter((u) => u.gradeId === g.id);
              const live = units.filter((u) => u.status === "published").length;
              const w = worldForGrade(g.number);
              return (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-[13px] font-semibold text-ink-600">
                    {g.label}
                  </span>
                  <div className="flex flex-1 gap-1">
                    {units.map((u) => (
                      <span
                        key={u.id}
                        title={`${u.title} — ${u.status === "published" ? "live" : "print edition, conversion pending"}`}
                        className="h-4 flex-1 rounded-[3px]"
                        style={{
                          background:
                            u.status === "published" ? w.accent : "var(--color-ink-100)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="tnum w-12 shrink-0 text-right font-mono text-xs text-ink-400">
                    {live}/{units.length}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Each cell is a unit from the printed 2023 edition. Colored = converted
            to an interactive ZERO1 unit. The Grade 6 flagship leads the way.
          </p>
        </Card>

        {/* Right rail */}
        <div className="space-y-5">
          <Card>
            <CardTitle>Recent drafts</CardTitle>
            {!hydrated || draftCount === 0 ? (
              <p className="text-sm text-ink-400">
                No open drafts. Edit any published lesson in the Lesson Builder to
                start one.
              </p>
            ) : (
              <ul className="space-y-2">
                {Object.values(drafts)
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .slice(0, 5)
                  .map((d) => (
                    <li key={d.lessonId}>
                      <Link
                        href={`/studio/lessons/${d.lessonId}/edit`}
                        className="flex items-center gap-2.5 rounded-lg border border-ink-100 px-3 py-2.5 transition-colors hover:border-brand-300"
                      >
                        <FileEdit className="size-4 shrink-0 text-bit-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-800">
                            {d.title}
                          </span>
                          <span className="block text-[11px] text-ink-400">
                            {new Date(d.updatedAt).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                        <Chip tone={d.status === "published" ? "mint" : "bit"}>
                          {d.status}
                        </Chip>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardTitle>Network</CardTitle>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-700">
                  <Users className="size-4 text-ink-400" /> Students on platform
                </span>
                <span className="tnum font-mono font-bold text-ink-900">812</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-700">
                  <Building2 className="size-4 text-ink-400" /> Active school
                </span>
                <span className="font-semibold text-ink-900">Cedars Intl.</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-700">Pilot pipeline</span>
                <Chip tone="signal">2 schools</Chip>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
