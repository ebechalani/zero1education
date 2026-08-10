import { CATALOG } from "./catalog";

/**
 * Light unitId → lessonIds map used by the gamification engine.
 * Kept separate from the full lesson content so the progress store never
 * pulls curriculum blocks into shared bundles.
 */
export const UNIT_LESSON_MAP: Record<string, string[]> = Object.fromEntries(
  CATALOG.filter((u) => u.lessonIds.length > 0).map((u) => [u.id, u.lessonIds]),
);
