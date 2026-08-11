import type { Lesson, Unit } from "@/types/content";
import { CATALOG, unitById, unitsForGrade } from "./catalog";
import { microbitLessons } from "./grade-6/microbit";
import { excelLessons, cartoonLessons } from "./grade-6/ch2-ch3-lessons";
import { roboticsLessons, scratchLessons } from "./grade-6/ch4-ch5-lessons";
import { anchorForLesson } from "../page-anchors";

/**
 * Content service (bundled adapter). In production these functions are backed
 * by Firestore `lessons` + `units` collections behind the same signatures —
 * see docs/FIREBASE.md §7.
 */

/**
 * Lessons converted from the printed edition carry a page anchor, so the
 * platform can show the author's real pages instead of a rewrite of them.
 * Attached here rather than typed into 36 lesson files: the anchors are
 * derived from the chapters' page layout, and one source of truth is easier to
 * correct than thirty-six.
 */
function withBookAnchors(lessons: Lesson[]): Lesson[] {
  return lessons.map((lesson) => {
    const bookAnchor = anchorForLesson(lesson.unitId, lesson.order);
    return bookAnchor ? { ...lesson, bookAnchor } : lesson;
  });
}

/**
 * The lesson set the demo experience showcases: Chapter 1, the fully authored
 * one. Dashboards and analytics build on this rather than naming a unit id in
 * a dozen screens.
 */
export const FEATURED_LESSONS: Lesson[] = withBookAnchors(microbitLessons);
export const FEATURED_UNIT_ID = "g6-microbit";

export const ALL_LESSONS: Lesson[] = [
  ...FEATURED_LESSONS,
  ...withBookAnchors(excelLessons),
  ...withBookAnchors(cartoonLessons),
  ...withBookAnchors(roboticsLessons),
  ...withBookAnchors(scratchLessons),
];

const lessonById = new Map(ALL_LESSONS.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

export function getUnit(id: string): Unit | undefined {
  return unitById.get(id);
}

export function lessonsForUnit(unitId: string): Lesson[] {
  const unit = unitById.get(unitId);
  if (!unit) return [];
  return unit.lessonIds
    .map((id) => lessonById.get(id))
    .filter((l): l is Lesson => Boolean(l))
    .sort((a, b) => a.order - b.order);
}

export function publishedLessonsForUnit(unitId: string): Lesson[] {
  return lessonsForUnit(unitId).filter((l) => l.status === "published");
}

export function nextLessonAfter(lessonId: string): Lesson | undefined {
  const lesson = lessonById.get(lessonId);
  if (!lesson) return undefined;
  const siblings = publishedLessonsForUnit(lesson.unitId);
  const i = siblings.findIndex((l) => l.id === lessonId);
  return i >= 0 ? siblings[i + 1] : undefined;
}

export { CATALOG, unitById, unitsForGrade };
