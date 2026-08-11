import type { Lesson, Unit } from "@/types/content";
import { CATALOG, unitById, unitsForGrade } from "./catalog";
import { lessonSystems } from "./grade-6/idw/systems";
import { lessonBinary } from "./grade-6/idw/binary";
import { lessonAlgorithms } from "./grade-6/idw/algorithms";
import { lessonNetworks } from "./grade-6/idw/networks";
import { lessonCyber } from "./grade-6/idw/cyber";
import { microbitLessons } from "./grade-6/microbit";
import { excelLessons, cartoonLessons } from "./grade-6/ch2-ch3-lessons";
import { roboticsLessons, scratchLessons } from "./grade-6/ch4-ch5-lessons";

/**
 * Content service (bundled adapter). In production these functions are backed
 * by Firestore `lessons` + `units` collections behind the same signatures —
 * see docs/FIREBASE.md §7.
 */

export const IDW_LESSONS: Lesson[] = [
  lessonSystems,
  lessonBinary,
  lessonAlgorithms,
  lessonNetworks,
  lessonCyber,
];

export const ALL_LESSONS: Lesson[] = [
  ...IDW_LESSONS,
  ...microbitLessons,
  ...excelLessons,
  ...cartoonLessons,
  ...roboticsLessons,
  ...scratchLessons,
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
