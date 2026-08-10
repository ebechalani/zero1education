import { BADGES } from "@/content/badges";
import type { StudentState } from "@/types/progress";

export interface BadgeContext {
  /** unitId → lessonIds required for completion */
  unitLessonMap: Record<string, string[]>;
}

/** Returns IDs of badges newly earned given the current state. */
export function evaluateBadges(
  state: StudentState,
  ctx: BadgeContext,
): string[] {
  const completedLessons = new Set(
    Object.values(state.lessons)
      .filter((l) => l.completedAt)
      .map((l) => l.lessonId),
  );
  const perfectCheckpoints = Object.values(state.lessons).reduce(
    (acc, l) =>
      acc +
      Object.values(l.activityResults).filter(
        (r) => r.firstTry && r.score === 100,
      ).length,
    0,
  );

  const earned: string[] = [];
  for (const badge of BADGES) {
    if (state.badges[badge.id]) continue;
    const r = badge.rule;
    let ok = false;
    switch (r.type) {
      case "lesson-complete":
        ok = completedLessons.has(r.lessonId);
        break;
      case "unit-complete": {
        const ids = ctx.unitLessonMap[r.unitId] ?? [];
        ok = ids.length > 0 && ids.every((id) => completedLessons.has(id));
        break;
      }
      case "lessons-count":
        ok = completedLessons.size >= r.count;
        break;
      case "xp":
        ok = state.xp >= r.amount;
        break;
      case "streak":
        ok = state.streakDays >= r.days;
        break;
      case "skill-level":
        ok = (state.skills[r.skillId] ?? 0) >= r.level;
        break;
      case "perfect-checkpoint":
        // Counts perfect first-try results across checkpoints
        ok = perfectCheckpoints >= r.count;
        break;
    }
    if (ok) earned.push(badge.id);
  }
  return earned;
}
