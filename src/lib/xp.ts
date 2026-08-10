/**
 * XP & level math. Levels grow linearly harder:
 * level n → n+1 requires 120 + (n−1)·80 XP.
 * Competency mastery matters more than XP — XP exists for momentum, levels
 * are displayed with their binary form as a brand touch (Level 5 = 101₂).
 */

export function xpRequiredFor(level: number): number {
  return 120 + (level - 1) * 80;
}

export function levelFromXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpRequiredFor(level)) {
    remaining -= xpRequiredFor(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpRequiredFor(level) };
}

export function toBinary(n: number): string {
  return n.toString(2);
}

/** Default XP awards used by the mission engine */
export const XP = {
  activity: 10,
  activityFirstTry: 15,
  stage: 15,
  lab: 25,
  challenge: 30,
  checkpointPass: 25,
  create: 20,
  lesson: 50,
} as const;
