"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { getLesson } from "@/content/curriculum";
import {
  puzzleById as kgPuzzleById,
  puzzlesForLesson,
} from "@/features/kg-grid/puzzles";
import {
  exerciseById as microbitExerciseById,
  exercisesForLesson,
} from "@/features/microbit/exercises";
import {
  exerciseById as drawExerciseById,
  exercisesForLesson as drawExercisesForLesson,
} from "@/features/draw/exercises";
import {
  exerciseById as excelExerciseById,
  exercisesForLesson as excelExercisesForLesson,
} from "@/features/excel/exercises";
import {
  exerciseById as mbotExerciseById,
  exercisesForLesson as mbotExercisesForLesson,
} from "@/features/mbot/exercises";
import {
  exerciseById as scratchExerciseById,
  exercisesForLesson as scratchExercisesForLesson,
} from "@/features/scratch/exercises";
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
  /**
   * The chapter's OWN exercise object for an id. Each chapter types its
   * exercises differently, so this stays opaque here — only that chapter's
   * studio knows how to read it.
   */
  resolveExercise: (id: string) => unknown;
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

const KgGridStudio = dynamic(
  () => import("@/features/kg-grid/kg-grid-studio").then((m) => m.KgGridStudio),
  { ssr: false, loading },
);

const MicrobitStudio = dynamic(
  () => import("@/features/microbit/microbit-studio").then((m) => m.MicrobitStudio),
  { ssr: false, loading },
);

const DrawStudio = dynamic(
  () => import("@/features/draw/draw-studio").then((m) => m.DrawStudio),
  { ssr: false, loading },
);

const ExcelStudio = dynamic(
  () => import("@/features/excel/excel-studio").then((m) => m.ExcelStudio),
  { ssr: false, loading },
);

const MbotStudio = dynamic(
  () => import("@/features/mbot/mbot-studio").then((m) => m.MbotStudio),
  { ssr: false, loading },
);

const ScratchStudio = dynamic(
  () => import("@/features/scratch/scratch-studio").then((m) => m.ScratchStudio),
  { ssr: false, loading },
);

/**
 * The picture-grid board, which several chapters across the early grades all
 * teach with — Kindergarten's dog and Grade 1's robot are the same apparatus a
 * year apart. Only the unit, the name on the button and the teacher's hint
 * change, so they are the only arguments.
 */
function gridInstrument(
  unitId: string,
  label: string,
  teachHint: string,
): InstrumentMeta {
  return {
    unitId,
    label,
    icon: "Footprints",
    route: "/kg-grid",
    teachHint,
    Component: KgGridStudio,
    listExercises: (lessonId) =>
      puzzlesForLesson(lessonId).map((p) => ({
        id: p.id,
        title: p.title,
        brief: p.spoken,
        href: `/kg-grid?exercise=${p.id}`,
      })),
    resolveExercise: (id) => kgPuzzleById(id),
  };
}

export const INSTRUMENTS: InstrumentMeta[] = [
  gridInstrument(
    "g0-knowing-computer",
    "Moving the Dog",
    "Put one arrow up on the board and press play, so the class sees a single step before you build a whole path.",
  ),
  gridInstrument(
    "g0-keyboard",
    "Moving the Dog",
    "Play the given arrows and let the class call out where the dog will land before it gets there.",
  ),
  gridInstrument(
    "g0-algorithms",
    "Moving the Dog",
    "Build a path with the class one arrow at a time, pressing play after each, so they see the plan grow.",
  ),
  gridInstrument(
    "g1-algorithms",
    "Robot Grid",
    "On the square, write only the first four cards with the class and ask what comes next — the answer is the same four again, which is the loop the next lesson names.",
  ),
  gridInstrument(
    "g2-algorithms",
    "Cat Grid",
    "Face the cat the wrong way on purpose and run the class's program anyway — turn cards only make sense once a child has watched one go wrong.",
  ),
  // Only lessons 3 and 9 of the ScratchJr chapter are grid work; the lesson
  // panel hides itself on the eight that are project builds, which still have
  // no instrument.
  gridInstrument(
    "g2-scratchjr",
    "Sprite Grid",
    "Read the script aloud one block at a time and let the class call the landing square before you press play.",
  ),
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
    resolveExercise: (id) => microbitExerciseById(id),
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
    resolveExercise: (id) => drawExerciseById(id),
  },
  {
    unitId: "g6-excel",
    label: "Spreadsheet",
    icon: "Table",
    route: "/excel",
    teachHint:
      "Type a formula into a cell and change the numbers it depends on — the class watches the result recalculate.",
    Component: ExcelStudio,
    listExercises: (lessonId) =>
      excelExercisesForLesson(lessonId).map((e) => ({
        id: e.id,
        title: e.title,
        brief: e.brief,
        href: `/excel?exercise=${e.id}`,
      })),
    resolveExercise: (id) => excelExerciseById(id),
  },
  {
    unitId: "g6-robotics",
    label: "mBot2 Arena",
    icon: "Bot",
    route: "/robot",
    teachHint:
      "Run the mission and point at the ultrasonic beam as the distance drops — that is why the robot stops where it does.",
    Component: MbotStudio,
    // The robotics exercises are keyed by the lesson's number in the chapter,
    // not its id, so the order comes from the catalog rather than the string.
    listExercises: (lessonId) =>
      mbotExercisesForLesson(getLesson(lessonId)?.order ?? -1).map((e) => ({
        id: e.id,
        title: e.title,
        brief: e.brief,
        href: `/robot?exercise=${e.id}`,
      })),
    resolveExercise: (id) => mbotExerciseById(id),
  },
  {
    unitId: "g6-scratch",
    label: "Scratch Stage",
    icon: "Cat",
    route: "/scratch",
    teachHint:
      "Press the green flag and let the class watch the sprite follow each block, then change one number and run it again.",
    Component: ScratchStudio,
    listExercises: (lessonId) =>
      scratchExercisesForLesson(lessonId).map((e) => ({
        id: e.id,
        title: e.title,
        brief: e.brief,
        href: `/scratch?exercise=${e.id}`,
      })),
    resolveExercise: (id) => scratchExerciseById(id),
  },
];

const byUnit = new Map(INSTRUMENTS.map((i) => [i.unitId, i]));

export function instrumentForUnit(unitId: string): InstrumentMeta | undefined {
  return byUnit.get(unitId);
}
