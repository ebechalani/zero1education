"use client";

import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLesson } from "@/content/curriculum";
import { STAGE_META } from "@/features/mission/mission-player";
import { BlockRenderer, type BlockContext } from "@/features/mission/block-renderer";
import type { Block } from "@/types/content";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Slide {
  stageIndex: number;
  stageTitle: string;
  kind: string;
  blocks: Block[];
  isStageCover?: boolean;
}

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return { display: `${mm}:${ss}`, running, setRunning, reset: () => setSeconds(0) };
}

export default function TeachModePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const timer = useTimer();

  const slides: Slide[] = useMemo(() => {
    if (!lesson) return [];
    const out: Slide[] = [];
    lesson.stages.forEach((stage, si) => {
      out.push({
        stageIndex: si,
        stageTitle: stage.title,
        kind: stage.kind,
        blocks: [],
        isStageCover: true,
      });
      // Group heading blocks with their following block
      let i = 0;
      const blocks = stage.blocks.filter(
        (b) => b.type !== "teacherNote" || true, // keep — renderer gates by role/notes toggle
      );
      while (i < blocks.length) {
        const group: Block[] = [blocks[i]];
        if (blocks[i].type === "heading" && i + 1 < blocks.length) {
          group.push(blocks[i + 1]);
          i += 1;
        }
        out.push({ stageIndex: si, stageTitle: stage.title, kind: stage.kind, blocks: group });
        i += 1;
      }
    });
    return out;
  }, [lesson]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, slides.length - 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  if (!lesson || lesson.status !== "published") notFound();
  const slide = slides[index];
  const meta = STAGE_META[slide.kind as keyof typeof STAGE_META];

  const ctx: BlockContext = {
    role: showNotes ? "teacher" : "student",
    activityResults: {},
    labsDone: [],
    submittedProjects: [],
    reflections: {},
    onActivityComplete: () => {},
    onLabComplete: () => {},
    onProjectSubmit: () => {},
    onReflectionSave: () => {},
    teacherReveal: reveal,
  };

  return (
    <RequireRole role="teacher">
      <WorldTheme world="creator">
        <div className="flex min-h-screen flex-col bg-ink-950">
          {/* Top bar */}
          <header className="flex items-center gap-4 border-b border-white/10 px-5 py-3">
            <Logo tone="light" size="sm" />
            <span className="hidden font-mono text-[10px] tracking-[0.3em] text-ink-400 uppercase sm:block">
              Teach Mode
            </span>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-white">
              {lesson.title}
              <span className="ml-2 text-ink-400">· {slide.stageTitle}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => timer.setRunning(!timer.running)}
                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 font-mono text-sm text-white hover:bg-white/20"
                aria-label={timer.running ? "Pause timer" : "Start timer"}
              >
                {timer.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                <Timer className="size-3.5 text-signal-400" />
                {timer.display}
              </button>
              <button
                onClick={timer.reset}
                className="cursor-pointer rounded-md bg-white/10 p-2 text-ink-300 hover:bg-white/20"
                aria-label="Reset timer"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={cn(
                  "cursor-pointer rounded-md p-2 transition-colors",
                  showNotes ? "bg-bit-500/20 text-bit-400" : "bg-white/10 text-ink-300 hover:bg-white/20",
                )}
                title={showNotes ? "Hide teacher notes" : "Show teacher notes"}
              >
                <GraduationCap className="size-4" />
              </button>
              <button
                onClick={() => setReveal(!reveal)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                  reveal ? "bg-mint-500/20 text-mint-400" : "bg-white/10 text-ink-200 hover:bg-white/20",
                )}
              >
                {reveal ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                {reveal ? "Answers shown" : "Answers hidden"}
              </button>
              <Button href={`/teacher/lesson/${lesson.id}`} variant="inverse" size="sm" icon={<X />}>
                Exit
              </Button>
            </div>
          </header>

          {/* Slide area */}
          <main className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16">
            {slide.isStageCover ? (
              <div className="animate-fade-up text-center" key={index}>
                <span
                  className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-white/10 [&>svg]:size-9"
                  style={{ color: "var(--world-accent)" }}
                >
                  {meta.icon}
                </span>
                <p className="font-mono text-xs tracking-[0.4em] text-signal-400 uppercase">
                  {meta.label}
                </p>
                <h1 className="font-display mx-auto mt-3 max-w-3xl text-4xl font-bold text-white lg:text-6xl">
                  {slide.stageTitle}
                </h1>
              </div>
            ) : (
              <div
                key={index}
                className="animate-fade-up thin-scroll max-h-[calc(100vh-180px)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-paper p-6 shadow-pop lg:p-10 [&_.text-\[15px\]]:text-[17px]"
              >
                <BlockRenderer blocks={slide.blocks} ctx={ctx} />
              </div>
            )}
          </main>

          {/* Bottom nav */}
          <footer className="flex items-center gap-4 border-t border-white/10 px-5 py-3">
            <span className="tnum font-mono text-xs text-ink-400">
              {index + 1} / {slides.length}
            </span>
            {/* stage dots */}
            <div className="flex flex-1 items-center gap-1">
              {lesson.stages.map((s, si) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(slides.findIndex((sl) => sl.stageIndex === si))}
                  title={s.title}
                  className={cn(
                    "h-1.5 flex-1 cursor-pointer rounded-full transition-colors",
                    si < slide.stageIndex
                      ? "bg-signal-600"
                      : si === slide.stageIndex
                        ? "[background:var(--world-accent)]"
                        : "bg-white/10 hover:bg-white/20",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="inverse"
                size="sm"
                icon={<ChevronLeft />}
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index === 0}
              >
                Prev
              </Button>
              <Button
                variant="world"
                size="sm"
                iconRight={<ChevronRight />}
                onClick={() => setIndex(Math.min(slides.length - 1, index + 1))}
                disabled={index === slides.length - 1}
              >
                Next
              </Button>
            </div>
          </footer>
        </div>
      </WorldTheme>
    </RequireRole>
  );
}
