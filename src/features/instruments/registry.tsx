"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { exercisesForLesson } from "@/features/microbit/exercises";
import { exercisesForLesson as drawExercisesForLesson } from "@/features/draw/exercises";
import type { ComponentType } from "react";

/**
 * The instrument each chapter is taught with.
 *
 * A ZERO1 chapter is not a slideshow — it has a thing you operate. Chapter 1
 * has a micro:bit, Chapter 2 a spreadsheet, Chapter 5 a Scratch stage. Lessons,
 * Teach Mode and the sidebars all read this map, so adding a chapter's
 * instrument is one entry here rather than an edit in every surface.
 *
 * Components are loaded lazily: a student reading the Excel chapter should not
 * download a robot simulator.
 */

export interface InstrumentMeta {
  /** Catalog unit this instrument belongs to */
  unitId: string;
  /** Shown on buttons and cards */
  label: string;
  /** lucide icon name */
  icon: string;
  /** Standalone page for free exploration */
  route: string;
  /** One line: what a teacher does with it on the board */
  teachHint: string;
  Component: ComponentType<{ className?: string }>;
  /**
   * The chapter's own exercises for one lesson, flattened to what a card needs.
   * Each chapter stores exercises in its own shape; this is the common view of
   * them, so the lesson player does not need to know which chapter it is in.
   */
  listExercises: (lessonId: string) => InstrumentExercise[];
}

export interface InstrumentExercise {
  id: string;
  title: string;
  brief: string;
  /** Deep link that opens this exercise in the instrument */
  href: string;
}

const loading = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const MicrobitStudio = dynamic(
  () => import("@/features/microbit/microbit-studio").then((m) => m.MicrobitStudio),
  { ssr: false, loading },
);

const DrawStudio = dynamic(
  () => import("@/features/draw/draw-studio").then((m) => m.DrawStudio),
  { ssr: false, loading },
);

export const INSTRUMENTS: InstrumentMeta[] = [
  {
    unitId: "g6-microbit",
    label: "micro:bit",
    icon: "CircuitBoard",
    route: "/microbit",
    teachHint:
      "Set the speed to Slow so the class can watch each block run, and move the sensor sliders to show the program reacting.",
    Component: MicrobitStudio,
    listExercises: (lessonId) =>
      exercisesForLesson(lessonId).map((e) => ({
        id: e.id,
        title: e.title,
        brief: e.brief,
        href: `/microbit?exercise=${e.id}`,
      })),
  },
  {
    unitId: "g6-cartoon",
    label: "Drawing Studio",
    icon: "Brush",
    route: "/draw",
    teachHint:
      "Step through the drawing on the board and fade the guide lines in and out, so the class sees the shapes underneath before the detail goes on.",
    Component: DrawStudio,
    listExercises: (lessonId) =>
      drawExercisesForLesson(lessonId).map((e) => ({
        id: e.id,
        title: e.title,
        brief: e.brief,
        href: `/draw?exercise=${e.id}`,
      })),
  },
];

const byUnit = new Map(INSTRUMENTS.map((i) => [i.unitId, i]));

export function instrumentForUnit(unitId: string): InstrumentMeta | undefined {
  return byUnit.get(unitId);
}
