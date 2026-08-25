"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { unitById } from "@/content/curriculum";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { ArrowLeft, Presentation, Wrench } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { instrumentForUnit, type InstrumentExercise } from "./registry";

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Wrench;
  return <C className={className} />;
}

/**
 * The standalone page for a chapter's instrument.
 *
 * Every chapter's page is the same shape — a teacher opens it blank to
 * demonstrate, or a lesson deep-links into one of the book's tasks with
 * `?exercise=`. So it lives here once rather than being copied per chapter.
 */
export default function InstrumentPage({ unitId }: { unitId: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <InstrumentPageInner unitId={unitId} />
    </Suspense>
  );
}

function InstrumentPageInner({ unitId }: { unitId: string }) {
  const params = useSearchParams();
  const instrument = instrumentForUnit(unitId);
  const unit = unitById.get(unitId);

  const requested = params.get("exercise");
  const [cleared, setCleared] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const exerciseId =
    picked ?? (requested && requested !== cleared ? requested : null);

  if (!instrument) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<Wrench />}
          title="No instrument for this chapter yet"
          description="This chapter is still studied from its printed pages."
          action={
            <Button href="/library" icon={<ArrowLeft />}>
              Back to the library
            </Button>
          }
        />
      </div>
    );
  }

  // Every exercise in the chapter, gathered from its lessons.
  const all: InstrumentExercise[] = (unit?.lessonIds ?? []).flatMap((id) =>
    instrument.listExercises(id),
  );
  const exercise = all.find((e) => e.id === exerciseId);

  const choose = (id: string | null) => {
    setPicked(id);
    if (id === null && requested) setCleared(requested);
  };

  const Studio = instrument.Component as React.ComponentType<{
    exercise?: unknown;
    className?: string;
  }>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-4 px-4 lg:px-6">
          <Link href="/library" aria-label="ZERO1 library">
            <Logo size="sm" />
          </Link>
          <span className="hidden font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase sm:block">
            {instrument.label}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {exercise && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft />}
                onClick={() => choose(null)}
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
          <Chip
            tone={exercise ? "bit" : "signal"}
            icon={exercise ? <Icon name={instrument.icon} /> : <Presentation />}
          >
            {exercise ? "A task from the book" : "Explain mode"}
          </Chip>
          <h1 className="font-display mt-2 text-2xl font-bold text-ink-900">
            {exercise ? exercise.title : instrument.label}
          </h1>
          <p className="mt-1 max-w-3xl text-[14.5px] text-ink-500">
            {exercise ? exercise.brief : instrument.teachHint}
          </p>
        </div>

        {/* Remounted per exercise so no state leaks between tasks */}
        <Studio
          key={exercise?.id ?? "free"}
          exercise={exerciseId ? instrument.resolveExercise(exerciseId) : undefined}
        />

        {all.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display mb-1 text-lg font-bold text-ink-900">
              Tasks from {unit?.title ?? "this chapter"}
            </h2>
            <p className="mb-4 text-[13.5px] text-ink-500">
              Each one is printed in the book — same numbers, same wording.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {all.map((ex) => {
                const active = ex.id === exerciseId;
                return (
                  <Link
                    key={ex.id}
                    href={ex.href}
                    className={cn(
                      "rounded-xl border-2 bg-white p-4 transition-all",
                      active
                        ? "border-brand-500 shadow-glow"
                        : "border-ink-100 hover:border-brand-300 hover:shadow-card",
                    )}
                  >
                    <span className="font-display block text-[14.5px] font-bold text-ink-900">
                      {ex.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-ink-500">
                      {ex.brief}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
