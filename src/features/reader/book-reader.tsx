"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress-store";
import { useHydrated } from "@/lib/use-hydrated";
import { BlockRenderer, type BlockContext } from "@/features/mission/block-renderer";
import { STAGE_META } from "@/features/mission/mission-player";
import type { Lesson } from "@/types/content";
import * as Icons from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  GraduationCap,
  Printer,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  describeInteractive,
  interactiveBlocks,
  readableBlocks,
} from "./block-split";

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <C className={className} />;
}

/**
 * Reads a lesson like a book: every page of content, top to bottom, nothing
 * locked. Activities are lifted out of the prose and offered at the end of
 * each section, so reading never turns into a quiz.
 */
export function BookReader({
  lesson,
  prev,
  next,
  showTeacherNotes,
  backHref = "/library",
}: {
  lesson: Lesson;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
  /** Teachers and authors see the guidance blocks; students do not */
  showTeacherNotes: boolean;
  backHref?: string;
}) {
  const hydrated = useHydrated();
  const store = useProgress();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const progress = hydrated ? store.lessons[lesson.id] : undefined;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ctx: BlockContext = {
    role: showTeacherNotes ? "teacher" : "student",
    activityResults: progress?.activityResults ?? {},
    labsDone: progress?.labsDone ?? [],
    submittedProjects: store.portfolio.filter((p) => p.refId).map((p) => p.refId!),
    reflections: Object.fromEntries(
      store.portfolio
        .filter((p) => p.kind === "reflection" && p.refId)
        .map((p) => [p.refId!, p.content ?? ""]),
    ),
    onActivityComplete: (activityId, outcome, opts) => {
      store.startLesson(lesson.id);
      store.recordActivity(lesson.id, activityId, outcome, opts);
    },
    onLabComplete: (blockId) => {
      store.startLesson(lesson.id);
      store.completeLab(lesson.id, blockId, lesson.skillIds);
    },
    onProjectSubmit: (projectId, title, payload) =>
      store.addPortfolioItem({
        title,
        kind: "project",
        refId: projectId,
        lessonId: lesson.id,
        gradeLabel: "Grade 6",
        summary: payload.text.slice(0, 140),
        content: payload.text,
        showcased: false,
      }),
    onReflectionSave: (blockId, prompt, text) =>
      store.addPortfolioItem({
        title: prompt.slice(0, 60),
        kind: "reflection",
        refId: blockId,
        lessonId: lesson.id,
        gradeLabel: "Grade 6",
        summary: text.slice(0, 140),
        content: text,
        showcased: false,
      }),
  };

  const sections = lesson.stages.map((stage) => ({
    stage,
    read: readableBlocks(stage.blocks),
    doing: interactiveBlocks(stage.blocks),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
      {/* Header */}
      <div className="border-b border-ink-100 py-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="size-4" /> Back to the library
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.2em] text-ink-400 uppercase">
              Lesson {lesson.order}
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold text-ink-900">
              {lesson.title}
            </h1>
            {lesson.tagline && (
              <p className="mt-1 text-[15px] text-ink-500">{lesson.tagline}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              href={`/student/lesson/${lesson.id}`}
              size="sm"
              iconRight={<ArrowRight />}
            >
              Play as mission
            </Button>
          </div>
        </div>

        {lesson.objectives.length > 0 && (
          <div className="mt-5 rounded-lg border border-ink-100 bg-white p-4 shadow-card">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-500 uppercase">
              <Target className="size-3.5" /> By the end of this lesson
            </p>
            <ul className="space-y-1.5">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-[14.5px] text-ink-700">
                  <span className="mt-2 block size-1.5 shrink-0 rounded-full bg-brand-400" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        {/* Contents rail */}
        <nav
          aria-label="Lesson contents"
          className="hidden lg:sticky lg:top-20 lg:block lg:self-start lg:pt-8"
        >
          <p className="mb-2.5 text-[11px] font-bold tracking-wide text-ink-400 uppercase">
            In this lesson
          </p>
          <ol className="space-y-0.5">
            {sections.map(({ stage, doing }) => (
              <li key={stage.id}>
                <a
                  href={`#${stage.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  <span className="text-ink-400">{STAGE_META[stage.kind].icon}</span>
                  <span className="min-w-0 flex-1 truncate">{stage.title}</span>
                  {doing.length > 0 && (
                    <span className="tnum rounded-full bg-ink-100 px-1.5 font-mono text-[10px] text-ink-500">
                      {doing.length}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* The book */}
        <article className="min-w-0 pt-8">
          {sections.map(({ stage, read, doing }) => (
            <section key={stage.id} id={stage.id} className="mb-12 scroll-mt-20">
              <div className="mb-5 flex items-center gap-2.5 border-b border-ink-100 pb-2.5">
                <span className="flex size-7 items-center justify-center rounded-md bg-ink-100 text-ink-500">
                  {STAGE_META[stage.kind].icon}
                </span>
                <h2 className="font-display text-xl font-bold text-ink-900">
                  {stage.title}
                </h2>
                <Chip tone="neutral" className="ml-auto">
                  {STAGE_META[stage.kind].label}
                </Chip>
              </div>

              {/* Readable content — the book itself */}
              {read.length > 0 ? (
                <BlockRenderer blocks={read} ctx={ctx} />
              ) : (
                <p className="text-[14.5px] text-ink-400">
                  This section is entirely hands-on — see the activities below.
                </p>
              )}

              {/* Activities, kept out of the prose */}
              {doing.length > 0 && (
                <div className="mt-6 space-y-2.5">
                  <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                    {doing.length === 1 ? "Activity" : `${doing.length} activities`} in this
                    section
                  </p>
                  {doing.map((block) => {
                    const meta = describeInteractive(block);
                    const isOpen = open.has(block.id);
                    const done =
                      (block.type === "activity" &&
                        ctx.activityResults[block.activity.id]?.correct) ||
                      (block.type === "lab" && ctx.labsDone.includes(block.id));
                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "overflow-hidden rounded-xl border transition-colors",
                          isOpen ? "border-brand-300 bg-white" : "border-ink-100 bg-white",
                        )}
                      >
                        <button
                          onClick={() => toggle(block.id)}
                          aria-expanded={isOpen}
                          className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              done
                                ? "bg-mint-100 text-mint-600"
                                : meta.tone === "bit"
                                  ? "bg-bit-100 text-bit-700"
                                  : meta.tone === "violet"
                                    ? "bg-violet-100 text-violet-700"
                                    : meta.tone === "mint"
                                      ? "bg-mint-100 text-mint-700"
                                      : meta.tone === "signal"
                                        ? "bg-signal-100 text-signal-700"
                                        : "bg-brand-100 text-brand-700",
                            )}
                          >
                            <Icon name={meta.icon} className="size-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-ink-900">
                                {meta.label}
                              </span>
                              {done && <Chip tone="mint">Done</Chip>}
                            </span>
                            <span className="mt-0.5 line-clamp-1 block text-[13px] text-ink-500">
                              {meta.verb}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-brand-600">
                            {isOpen ? "Hide" : "Try it"}
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="animate-fade-up border-t border-ink-100 bg-ink-50/40 p-4">
                            <BlockRenderer blocks={[block]} ctx={ctx} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {showTeacherNotes && (
            <p className="mb-8 flex items-center gap-2 rounded-lg bg-amber-100/50 px-4 py-2.5 text-[13px] text-amber-700">
              <GraduationCap className="size-4 shrink-0" />
              You are reading with teacher notes visible. Students do not see those blocks.
            </p>
          )}

          {/* Pager */}
          <nav className="flex items-center justify-between gap-4 border-t border-ink-100 pt-6">
            {prev ? (
              <Link
                href={`/library/${prev.id}`}
                className="group min-w-0 flex-1 rounded-lg border border-ink-100 p-3 transition-colors hover:border-brand-300"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  <ArrowLeft className="size-3" /> Previous
                </span>
                <span className="mt-0.5 block truncate text-[14px] font-semibold text-ink-800 group-hover:text-brand-700">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {next ? (
              <Link
                href={`/library/${next.id}`}
                className="group min-w-0 flex-1 rounded-lg border border-ink-100 p-3 text-right transition-colors hover:border-brand-300"
              >
                <span className="flex items-center justify-end gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  Next <ArrowRight className="size-3" />
                </span>
                <span className="mt-0.5 block truncate text-[14px] font-semibold text-ink-800 group-hover:text-brand-700">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
