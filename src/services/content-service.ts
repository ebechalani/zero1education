import {
  getLesson as bundledLesson,
  getUnit as bundledUnit,
  lessonsForUnit,
  unitsForGrade,
} from "@/content/curriculum";
import type { GradeId } from "@/types/content";
import type { ContentService } from "./types";

/**
 * Bundled-content adapter. Curriculum ships as typed data, so every call is a
 * map lookup — zero reads, zero latency. The Firestore adapter replaces this
 * object behind the identical signatures (docs/FIREBASE.md §7).
 */

const gradeNumber = (gradeId: GradeId) => Number(gradeId.slice(1));

export const contentService: ContentService = {
  async getUnit(unitId) {
    return bundledUnit(unitId) ?? null;
  },

  async getLesson(lessonId) {
    return bundledLesson(lessonId) ?? null;
  },

  async listLessons(unitId, query) {
    const lessons = lessonsForUnit(unitId);
    return query?.includeUnpublished
      ? lessons
      : lessons.filter((lesson) => lesson.status === "published");
  },

  async listUnitsForGrade(gradeId, query) {
    const units = unitsForGrade(gradeNumber(gradeId));
    return query?.includeUnpublished
      ? units
      : units.filter((unit) => unit.status === "published");
  },
};
