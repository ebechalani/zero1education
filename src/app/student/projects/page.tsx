"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { IDW_LESSONS } from "@/content/curriculum";
import { useHydrated } from "@/lib/use-hydrated";
import { useProgress } from "@/stores/progress-store";
import type { Project } from "@/types/content";
import { ArrowRight, CheckCircle2, Rocket } from "lucide-react";

interface ProjectEntry {
  project: Project;
  lessonId: string;
  lessonTitle: string;
}

export default function ProjectsPage() {
  const hydrated = useHydrated();
  const { portfolio } = useProgress();

  const projects: ProjectEntry[] = IDW_LESSONS.flatMap((lesson) =>
    lesson.stages.flatMap((stage) =>
      stage.blocks
        .filter((b) => b.type === "project")
        .map((b) => ({
          project: (b as { project: Project }).project,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        })),
    ),
  );

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const submittedIds = new Set(portfolio.filter((p) => p.refId).map((p) => p.refId));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Projects"
        description="Every mission ends with a creation. Submit your work — it lands in your portfolio and your teacher reviews it."
        eyebrow={
          <Chip tone="world" icon={<Rocket />}>
            {submittedIds.size}/{projects.length} submitted
          </Chip>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map(({ project, lessonId, lessonTitle }) => {
          const done = submittedIds.has(project.id);
          return (
            <div
              key={project.id}
              className="flex flex-col rounded-xl border border-ink-100 bg-white p-5 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <Chip tone="neutral">{lessonTitle}</Chip>
                {done && (
                  <Chip tone="mint" icon={<CheckCircle2 />}>
                    Submitted
                  </Chip>
                )}
              </div>
              <h3 className="font-display mt-3 text-[16px] font-bold text-ink-900">
                {project.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-ink-600">
                {project.brief}
              </p>
              <div className="mt-4">
                <Button
                  href={`/student/lesson/${lessonId}`}
                  variant={done ? "secondary" : "primary"}
                  size="sm"
                  iconRight={<ArrowRight />}
                >
                  {done ? "Review in mission" : "Open mission"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
