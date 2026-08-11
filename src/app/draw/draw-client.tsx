"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getLesson } from "@/content/curriculum";
import { DRAW_EXERCISES } from "@/features/draw/exercises";
import { DrawStudio } from "@/features/draw/draw-studio";
import { useProgress } from "@/stores/progress-store";
import { ArrowLeft, Brush, Presentation } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * The drawing instrument for Chapter 3.
 *
 * Nothing here is graded. The chapter teaches drawing through step-by-step
 * plates, so the platform's job is to show the construction lines and then get
 * out of the way — the student traces, marks the step done, and saves the
 * picture to their portfolio.
 */
export default function DrawClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <DrawStudioPage />
    </Suspense>
  );
}

function DrawStudioPage() {
  const params = useSearchParams();
  const requested = params.get("exercise");
  const [cleared, setCleared] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const exerciseId =
    picked ?? (requested && requested !== cleared ? requested : null);
  const exercise = DRAW_EXERCISES.find((e) => e.id === exerciseId);
  const addPortfolioItem = useProgress((s) => s.addPortfolioItem);

  const choose = (id: string | null) => {
    setPicked(id);
    if (id === null && requested) setCleared(requested);
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-4 px-4 lg:px-6">
          <Link href="/library" aria-label="ZERO1 library">
            <Logo size="sm" />
          </Link>
          <span className="hidden font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase sm:block">
            Drawing Studio
          </span>
          <div className="ml-auto flex items-center gap-2">
            {exercise && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft />}
                onClick={() => choose(null)}
              >
                Free drawing
              </Button>
            )}
            <Button href="/library" variant="ghost" size="sm">
              Library
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6">
        <div className="mb-5">
          <Chip tone={exercise ? "bit" : "signal"} icon={exercise ? <Brush /> : <Presentation />}>
            {exercise ? "Drawing from the book" : "Free drawing"}
          </Chip>
          <h1 className="font-display mt-2 text-2xl font-bold text-ink-900">
            {exercise ? exercise.title : "Drawing Studio"}
          </h1>
          <p className="mt-1 max-w-3xl text-[14.5px] text-ink-500">
            {exercise
              ? "Follow the steps down the side. The faint guide lines show the shapes underneath — trace over them, then fade them away when you no longer need them."
              : "A blank canvas with the tools from the chapter. Draw freely, or pick one of the book's step-by-step drawings below."}
          </p>
        </div>

        <DrawStudio
          key={exercise?.id ?? "free"}
          exercise={exercise}
          onSaved={(png) => {
            addPortfolioItem({
              title: exercise?.title ?? "My drawing",
              kind: "project",
              refId: exercise?.id,
              lessonId: exercise?.lessonId,
              gradeLabel: "Grade 6",
              summary: exercise
                ? `Drawing from ${exercise.title}`
                : "Free drawing",
              content: png,
              submitType: "image",
              showcased: false,
            });
            toast("Saved to your portfolio", {
              description: "Your drawing is in My Portfolio.",
              tone: "success",
            });
          }}
        />

        <section className="mt-8">
          <h2 className="font-display mb-1 text-lg font-bold text-ink-900">
            Drawings from Chapter 3
          </h2>
          <p className="mb-4 text-[13.5px] text-ink-500">
            Each one follows the steps printed in the book.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DRAW_EXERCISES.map((ex) => {
              const lesson = getLesson(ex.lessonId);
              const active = ex.id === exerciseId;
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    choose(ex.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 bg-white p-4 text-left transition-all",
                    active
                      ? "border-brand-500 shadow-glow"
                      : "border-ink-100 hover:border-brand-300 hover:shadow-card",
                  )}
                >
                  <span className="font-mono text-[10px] tracking-wide text-ink-400 uppercase">
                    {lesson ? `Lesson ${lesson.order}` : "Drawing"}
                  </span>
                  <span className="font-display mt-1 block text-[14.5px] font-bold text-ink-900">
                    {ex.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-ink-500">
                    {ex.brief}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
