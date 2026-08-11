"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ProgressBits } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";
import { useProgress } from "@/stores/progress-store";
import { chapterById } from "@/content/books";
import { BlockRenderer, type BlockContext } from "@/features/mission/block-renderer";
import { STAGE_META } from "@/features/mission/mission-player";
import { PdfPageViewer } from "./pdf-page-viewer";
import { describeInteractive, interactiveBlocks } from "./block-split";
import type { Block, Lesson } from "@/types/content";
import * as Icons from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <C className={className} />;
}

/**
 * The lesson as the author actually wrote it: his printed pages on one side,
 * the platform's activities on the other. Nothing about the book is
 * paraphrased here — the page image *is* the content, and the interactive work
 * is attached beside it rather than replacing it.
 */
export function BookLessonPlayer({
  lesson,
  prev,
  next,
}: {
  lesson: Lesson;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
}) {
  const hydrated = useHydrated();
  const store = useProgress();
  const [showPanel, setShowPanel] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const anchor = lesson.bookAnchor;
  const chapter = anchor ? chapterById(anchor.chapterId) : undefined;
  const progress = hydrated ? store.lessons[lesson.id] : undefined;

  // Every interactive block in the lesson, in stage order
  const activities = useMemo(() => {
    const out: { stageTitle: string; stageKind: Block["type"] | string; block: Block }[] = [];
    for (const stage of lesson.stages) {
      for (const block of interactiveBlocks(stage.blocks)) {
        out.push({ stageTitle: stage.title, stageKind: stage.kind, block });
      }
    }
    return out;
  }, [lesson]);

  const ctx: BlockContext = {
    role: "student",
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

  const isDone = (block: Block) =>
    (block.type === "activity" && ctx.activityResults[block.activity.id]?.correct) ||
    (block.type === "lab" && ctx.labsDone.includes(block.id)) ||
    (block.type === "quiz" &&
      block.questions.every((q) => ctx.activityResults[q.id]?.correct));

  const doneCount = activities.filter((a) => isDone(a.block)).length;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-10 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 py-5">
        <div className="min-w-0">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-4" /> Library
          </Link>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Chip tone="bit" icon={<BookOpen />}>
              Printed edition
            </Chip>
            {chapter && anchor && (
              <span className="font-mono text-[11px] text-ink-400">
                Ch {chapter.chapter} · pages {anchor.firstPage}–{anchor.lastPage}
                {anchor.printedPages ? ` (printed ${anchor.printedPages})` : ""}
              </span>
            )}
          </div>
          <h1 className="font-display mt-1 text-2xl font-bold text-ink-900">
            {lesson.order}. {lesson.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {activities.length > 0 && (
            <div className="hidden sm:block">
              <p className="mb-1 text-right text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                {doneCount}/{activities.length} activities
              </p>
              <div className="w-32">
                <ProgressBits
                  value={(doneCount / Math.max(activities.length, 1)) * 100}
                  tone="mint"
                />
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={showPanel ? <PanelRightClose /> : <PanelRightOpen />}
            onClick={() => setShowPanel(!showPanel)}
          >
            {showPanel ? "Hide activities" : "Show activities"}
          </Button>
        </div>
      </div>

      {/* Objectives */}
      {lesson.objectives.length > 0 && (
        <div className="mt-4 rounded-lg border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-500 uppercase">
            <Target className="size-3.5" /> Objectives — from the book
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {lesson.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px] text-ink-700">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-bit-500" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Split: the real pages | the activities */}
      <div
        className={cn(
          "mt-4 grid gap-5",
          showPanel && activities.length > 0 ? "lg:grid-cols-[1fr_400px]" : "grid-cols-1",
        )}
      >
        <div className="h-[calc(100vh-13rem)] min-h-[520px]">
          {anchor && chapter ? (
            <PdfPageViewer
              src={chapter.file}
              title={`${lesson.title} — pages ${anchor.firstPage}–${anchor.lastPage}`}
              startPage={anchor.firstPage}
              pageRange={[anchor.firstPage, anchor.lastPage]}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white p-8 text-center">
              <p className="max-w-sm text-sm text-ink-500">
                This lesson has no printed pages linked yet. Open the chapter from the
                library to read it, or use the interactive version.
              </p>
            </div>
          )}
        </div>

        {showPanel && activities.length > 0 && (
          <aside className="thin-scroll lg:h-[calc(100vh-13rem)] lg:overflow-y-auto">
            <p className="mb-2.5 text-[11px] font-bold tracking-wide text-ink-400 uppercase">
              Practise what this lesson teaches
            </p>
            <div className="space-y-2.5">
              {activities.map(({ block, stageTitle, stageKind }) => {
                const meta = describeInteractive(block);
                const isOpen = open.has(block.id);
                const done = isDone(block);
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "overflow-hidden rounded-xl border bg-white transition-colors",
                      isOpen ? "border-brand-300" : "border-ink-100",
                    )}
                  >
                    <button
                      onClick={() => toggle(block.id)}
                      aria-expanded={isOpen}
                      className="flex w-full cursor-pointer items-start gap-3 p-3.5 text-left"
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          done ? "bg-mint-100 text-mint-600" : "bg-ink-100 text-ink-500",
                        )}
                      >
                        {done ? <Check className="size-4" /> : <Icon name={meta.icon} className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-ink-900">
                            {meta.label}
                          </span>
                          <span className="font-mono text-[10px] tracking-wide text-ink-400 uppercase">
                            {STAGE_META[stageKind as keyof typeof STAGE_META]?.label ?? stageTitle}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-ink-500">
                          {meta.verb}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "mt-1 size-4 shrink-0 text-ink-400 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="animate-fade-up border-t border-ink-100 bg-ink-50/40 p-3">
                        <BlockRenderer blocks={[block]} ctx={ctx} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Pager */}
      <nav className="mt-6 flex items-center justify-between gap-4 border-t border-ink-100 pt-5">
        {prev ? (
          <Button href={`/library/lesson/${prev.id}`} variant="secondary" icon={<ArrowLeft />}>
            <span className="max-w-40 truncate">{prev.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button href={`/library/lesson/${next.id}`} iconRight={<Icons.ArrowRight />}>
            <span className="max-w-40 truncate">{next.title}</span>
          </Button>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
