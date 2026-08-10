"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LessonProgress,
  PortfolioItem,
  StudentState,
  StudentSummary,
} from "@/types/progress";
import { levelFromXp, XP } from "@/lib/xp";
import { todayKey } from "@/lib/utils";
import { evaluateBadges } from "@/lib/gamification";
import { UNIT_LESSON_MAP } from "@/content/curriculum/unit-map";
import { progressService } from "@/services/progress-service";
import { isLiveMode } from "@/lib/firebase/config";
import { useSession } from "./session-store";

const SKILL_GAIN_ACTIVITY = 6;
const SKILL_GAIN_LAB = 10;
const SKILL_GAIN_LESSON = 14;

interface ProgressActions {
  startLesson: (lessonId: string) => void;
  completeStage: (lessonId: string, stageId: string, xp?: number) => void;
  recordActivity: (
    lessonId: string,
    activityId: string,
    result: { correct: boolean; score: number; attempts: number; firstTry: boolean },
    opts?: { xp?: number; skillIds?: string[] },
  ) => void;
  completeLab: (lessonId: string, blockId: string, skillIds?: string[]) => void;
  completeLesson: (lessonId: string, skillIds?: string[]) => void;
  addPortfolioItem: (item: Omit<PortfolioItem, "id" | "createdAt">) => void;
  toggleShowcase: (itemId: string) => void;
  resetAll: () => void;
}

export type ProgressStore = StudentState & ProgressActions;

const emptyLesson = (lessonId: string): LessonProgress => ({
  lessonId,
  stagesDone: [],
  activityResults: {},
  labsDone: [],
  xpEarned: 0,
});

const initialState: StudentState = {
  xp: 0,
  streakDays: 0,
  lastActiveDay: undefined,
  badges: {},
  skills: {},
  lessons: {},
  portfolio: [],
  recentXp: [],
};

let xpEventId = 1;

/**
 * Mirror a local progress mutation to Firestore in live mode. The local store
 * stays the optimistic source of truth for the UI; the server recomputes XP,
 * skills and badges from the event stream (docs/FIREBASE.md §1). Failures are
 * swallowed on purpose — a dropped sync must never block a student's lesson.
 */
function sync(write: (uid: string) => Promise<void>) {
  if (!isLiveMode()) return;
  const uid = useSession.getState().user?.uid;
  if (!uid) return;
  void write(uid).catch((err) => {
    console.error("ZERO1 progress sync failed:", err);
  });
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => {
      /** Award XP + touch streak + re-evaluate badges. Call inside set-less flow. */
      const award = (amount: number, reason: string) => {
        const s = get();
        // Streak
        const today = todayKey();
        let { streakDays, lastActiveDay } = s;
        if (lastActiveDay !== today) {
          const yesterday = todayKey(new Date(Date.now() - 86400000));
          streakDays = lastActiveDay === yesterday ? streakDays + 1 : 1;
          lastActiveDay = today;
        }
        const recentXp = [
          { id: `xp-${xpEventId++}`, amount, reason, ts: new Date().toISOString() },
          ...s.recentXp,
        ].slice(0, 20);
        set({ xp: s.xp + amount, streakDays, lastActiveDay, recentXp });
        // Badges (after xp/streak update)
        const after = get();
        const earned = evaluateBadges(after, { unitLessonMap: UNIT_LESSON_MAP });
        if (earned.length) {
          const badges = { ...after.badges };
          const now = new Date().toISOString();
          earned.forEach((id) => (badges[id] = now));
          set({ badges });
        }
      };

      const bumpSkills = (skillIds: string[] | undefined, gain: number) => {
        if (!skillIds?.length) return;
        const skills = { ...get().skills };
        for (const id of skillIds) {
          skills[id] = Math.min(100, (skills[id] ?? 0) + gain);
        }
        set({ skills });
      };

      const withLesson = (
        lessonId: string,
        fn: (l: LessonProgress) => LessonProgress,
      ) => {
        const lessons = { ...get().lessons };
        lessons[lessonId] = fn(lessons[lessonId] ?? emptyLesson(lessonId));
        set({ lessons });
      };

      return {
        ...initialState,

        startLesson: (lessonId) =>
          withLesson(lessonId, (l) => ({
            ...l,
            startedAt: l.startedAt ?? new Date().toISOString(),
          })),

        completeStage: (lessonId, stageId, xp) => {
          const l = get().lessons[lessonId];
          if (l?.stagesDone.includes(stageId)) return;
          const amount = xp ?? XP.stage;
          withLesson(lessonId, (lp) => ({
            ...lp,
            stagesDone: [...lp.stagesDone, stageId],
            xpEarned: lp.xpEarned + amount,
          }));
          award(amount, "Stage complete");
          sync((uid) => progressService.recordStage({ uid, lessonId, stageId, xp }));
        },

        recordActivity: (lessonId, activityId, result, opts) => {
          const prev = get().lessons[lessonId]?.activityResults[activityId];
          const newlyCorrect = result.correct && !prev?.correct;
          withLesson(lessonId, (lp) => ({
            ...lp,
            activityResults: {
              ...lp.activityResults,
              [activityId]: {
                activityId,
                attempts: (prev?.attempts ?? 0) + result.attempts,
                correct: result.correct || (prev?.correct ?? false),
                score: Math.max(result.score, prev?.score ?? 0),
                firstTry: prev ? prev.firstTry : result.firstTry,
                completedAt: new Date().toISOString(),
              },
            },
          }));
          if (newlyCorrect) {
            const amount =
              opts?.xp ?? (result.firstTry ? XP.activityFirstTry : XP.activity);
            withLesson(lessonId, (lp) => ({ ...lp, xpEarned: lp.xpEarned + amount }));
            bumpSkills(opts?.skillIds, SKILL_GAIN_ACTIVITY);
            award(amount, "Activity solved");
          }
          sync((uid) =>
            progressService.recordActivity({
              uid,
              lessonId,
              activityId,
              result,
              xp: opts?.xp,
              skillIds: opts?.skillIds,
            }),
          );
        },

        completeLab: (lessonId, blockId, skillIds) => {
          const l = get().lessons[lessonId];
          if (l?.labsDone.includes(blockId)) return;
          withLesson(lessonId, (lp) => ({
            ...lp,
            labsDone: [...lp.labsDone, blockId],
            xpEarned: lp.xpEarned + XP.lab,
          }));
          bumpSkills(skillIds, SKILL_GAIN_LAB);
          award(XP.lab, "Lab completed");
          sync((uid) =>
            progressService.recordLab({ uid, lessonId, blockId, skillIds }),
          );
        },

        completeLesson: (lessonId, skillIds) => {
          const l = get().lessons[lessonId];
          if (l?.completedAt) return;
          withLesson(lessonId, (lp) => ({
            ...lp,
            completedAt: new Date().toISOString(),
            xpEarned: lp.xpEarned + XP.lesson,
          }));
          bumpSkills(skillIds, SKILL_GAIN_LESSON);
          award(XP.lesson, "Mission complete");
          sync((uid) =>
            progressService.completeLesson({ uid, lessonId, skillIds }),
          );
        },

        addPortfolioItem: (item) =>
          set((s) => ({
            portfolio: [
              {
                ...item,
                id: `pf-${Date.now().toString(36)}`,
                createdAt: new Date().toISOString(),
              },
              ...s.portfolio,
            ],
          })),

        toggleShowcase: (itemId) =>
          set((s) => ({
            portfolio: s.portfolio.map((p) =>
              p.id === itemId ? { ...p, showcased: !p.showcased } : p,
            ),
          })),

        resetAll: () => set({ ...initialState, lessons: {}, badges: {}, skills: {} }),
      };
    },
    { name: "zero1-progress-v1" },
  ),
);

export function summarize(s: StudentState): StudentSummary {
  const lvl = levelFromXp(s.xp);
  return {
    xp: s.xp,
    level: lvl.level,
    xpIntoLevel: lvl.xpIntoLevel,
    xpForNextLevel: lvl.xpForNextLevel,
    streakDays: s.streakDays,
    missionsCompleted: Object.values(s.lessons).filter((l) => l.completedAt)
      .length,
    skillsMastered: Object.values(s.skills).filter((v) => v >= 80).length,
    badgesEarned: Object.keys(s.badges).length,
  };
}
