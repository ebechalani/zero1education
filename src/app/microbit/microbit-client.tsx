"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { MB_EXERCISES } from "@/features/microbit/exercises";
import { MicrobitStudio } from "@/features/microbit/microbit-studio";
import { getLesson } from "@/content/curriculum";
import { ArrowLeft, GraduationCap, Presentation } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * The micro:bit instrument on its own page.
 *
 * "Explain" is the projector mode a teacher opens mid-lesson: a blank board,
 * nothing to mark, drag a block and press Run. "Build" loads one of the book's
 * own projects and checks the student's program by what it does.
 */
export default function MicrobitClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <MicrobitStudioPage />
    </Suspense>
  );
}

function MicrobitStudioPage() {
  const params = useSearchParams();
  // A lesson links straight to its project: /microbit?exercise=…
  // Derived from the URL rather than copied into state, so "Back to explaining"
  // can clear it without the effect immediately putting it back.
  const requested = params.get("exercise");
  const [cleared, setCleared] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const exerciseId =
    picked ?? (requested && requested !== cleared ? requested : null);
  const exercise = MB_EXERCISES.find((e) => e.id === exerciseId);

  const setExerciseId = (id: string | null) => {
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
            micro:bit Studio
          </span>
          <div className="ml-auto flex items-center gap-2">
            {exercise && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft />}
                onClick={() => setExerciseId(null)}
              >
                Back to explaining
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
          <Chip tone={exercise ? "bit" : "signal"} icon={exercise ? <GraduationCap /> : <Presentation />}>
            {exercise ? "Building a project from the book" : "Explain mode"}
          </Chip>
          <h1 className="font-display mt-2 text-2xl font-bold text-ink-900">
            {exercise ? exercise.title : "micro:bit Studio"}
          </h1>
          <p className="mt-1 max-w-3xl text-[14.5px] text-ink-500">
            {exercise
              ? "Build the program, press Run to watch it, then check it. Your blocks do not have to match anyone else's — the check looks at what your program does."
              : "Drag blocks, press Run, and the board runs your program. Set the speed to Slow so a class can watch it step through, and move the sensor sliders to show a program reacting."}
          </p>
        </div>

        <MicrobitStudio
          key={exercise?.id ?? "free"}
          exercise={exercise}
          onSolved={() => {}}
        />

        {/* The book's projects */}
        <section className="mt-8">
          <h2 className="font-display mb-1 text-lg font-bold text-ink-900">
            Projects from Chapter 1
          </h2>
          <p className="mb-4 text-[13.5px] text-ink-500">
            Every one of these is a task printed in the book — same numbers, same
            variable names.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MB_EXERCISES.map((ex) => {
              const lesson = getLesson(ex.lessonId);
              const active = ex.id === exerciseId;
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    setExerciseId(ex.id);
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
                    {lesson ? `Lesson ${lesson.order}` : "Project"}
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
