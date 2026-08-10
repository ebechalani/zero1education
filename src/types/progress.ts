/**
 * Generic progress model — every activity type and lab reports the same
 * result shape, so dashboards, the passport, portfolio and analytics are
 * projections of one stream rather than per-feature systems.
 */

export interface ActivityResult {
  activityId: string;
  attempts: number;
  correct: boolean;
  /** 0–100 */
  score: number;
  firstTry: boolean;
  completedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  startedAt?: string;
  completedAt?: string;
  /** Stage ids completed, in order */
  stagesDone: string[];
  activityResults: Record<string, ActivityResult>;
  /** Lab runs completed within this lesson, by block id */
  labsDone: string[];
  xpEarned: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  kind: "project" | "lab" | "challenge" | "reflection";
  /** Source block/project id — used to mark blocks as submitted */
  refId?: string;
  lessonId?: string;
  gradeLabel: string;
  summary: string;
  /** Submitted content (text/link/code snippet) in demo mode */
  content?: string;
  submitType?: string;
  createdAt: string;
  showcased: boolean;
}

export interface XpEvent {
  id: string;
  amount: number;
  reason: string;
  ts: string;
}

export interface StudentState {
  xp: number;
  /** Consecutive learning days */
  streakDays: number;
  lastActiveDay?: string;
  /** badgeId → earnedAt ISO */
  badges: Record<string, string>;
  /** skillId → 0–100 */
  skills: Record<string, number>;
  lessons: Record<string, LessonProgress>;
  portfolio: PortfolioItem[];
  recentXp: XpEvent[];
}

export type StageStatus = "locked" | "available" | "complete";

/** Summary used by dashboards (projection of StudentState) */
export interface StudentSummary {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streakDays: number;
  missionsCompleted: number;
  skillsMastered: number;
  badgesEarned: number;
}
