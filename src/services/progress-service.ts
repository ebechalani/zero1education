import { isLiveMode } from "@/lib/firebase/config";
import { levelFromXp } from "@/lib/xp";
import type {
  ActivityRecord,
  LabRecord,
  LessonCompletion,
  ProgressService,
  StageRecord,
} from "./types";
import type { StudentSummary } from "@/types/progress";

/**
 * Progress persistence.
 *
 * Demo mode: the zustand store already persists to localStorage, so this
 * adapter is a no-op — the store is the source of truth.
 *
 * Live mode: writes go to two places per docs/FIREBASE.md §1 —
 *  · `progress/{uid}_{lessonId}`  the per-lesson record (merged)
 *  · `progressEvents/{autoId}`    an append-only event
 * XP, levels, streaks, skills and badges are then computed by the
 * `onProgressEvent` Cloud Function, never by the client. That's why the
 * security rules reject client writes to those fields: a student cannot
 * award themselves XP.
 */

const EMPTY_SUMMARY: StudentSummary = {
  xp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 120,
  streakDays: 0,
  missionsCompleted: 0,
  skillsMastered: 0,
  badgesEarned: 0,
};

const demoProgressService: ProgressService = {
  async getSummary() {
    return EMPTY_SUMMARY;
  },
  async recordStage() {},
  async recordActivity() {},
  async recordLab() {},
  async completeLesson() {},
};

async function firestore() {
  const [{ getDb }, fs] = await Promise.all([
    import("@/lib/firebase/client"),
    import("firebase/firestore"),
  ]);
  const db = getDb();
  if (!db) throw new Error("Firestore unavailable");
  return { db, ...fs };
}

/** Emit the append-only event the aggregation function listens to. */
async function emitEvent(
  uid: string,
  type: string,
  payload: Record<string, unknown>,
) {
  const { db, collection, addDoc, serverTimestamp } = await firestore();
  await addDoc(collection(db, "progressEvents"), {
    uid,
    type,
    ...payload,
    ts: serverTimestamp(),
  });
}

const liveProgressService: ProgressService = {
  async getSummary(uid) {
    const { db, doc, getDoc } = await firestore();
    const snap = await getDoc(doc(db, "studentSummaries", uid));
    if (!snap.exists()) return EMPTY_SUMMARY;
    const data = snap.data() as Partial<StudentSummary> & { xp?: number };
    const xp = data.xp ?? 0;
    const lvl = levelFromXp(xp);
    return {
      ...EMPTY_SUMMARY,
      ...data,
      xp,
      level: lvl.level,
      xpIntoLevel: lvl.xpIntoLevel,
      xpForNextLevel: lvl.xpForNextLevel,
    };
  },

  async recordStage({ uid, lessonId, stageId }: StageRecord) {
    const { db, doc, setDoc, arrayUnion, serverTimestamp } = await firestore();
    await setDoc(
      doc(db, "progress", `${uid}_${lessonId}`),
      {
        uid,
        lessonId,
        stagesDone: arrayUnion(stageId),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await emitEvent(uid, "stage", { lessonId, stageId });
  },

  async recordActivity({ uid, lessonId, activityId, result, skillIds }: ActivityRecord) {
    const { db, doc, setDoc, serverTimestamp } = await firestore();
    await setDoc(
      doc(db, "progress", `${uid}_${lessonId}`),
      {
        uid,
        lessonId,
        activityResults: {
          [activityId]: { ...result, activityId, completedAt: new Date().toISOString() },
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await emitEvent(uid, "activity", {
      lessonId,
      activityId,
      correct: result.correct,
      score: result.score,
      firstTry: result.firstTry,
      skillIds: skillIds ?? [],
    });
  },

  async recordLab({ uid, lessonId, blockId, skillIds }: LabRecord) {
    const { db, doc, setDoc, arrayUnion, serverTimestamp } = await firestore();
    await setDoc(
      doc(db, "progress", `${uid}_${lessonId}`),
      {
        uid,
        lessonId,
        labsDone: arrayUnion(blockId),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    await emitEvent(uid, "lab", { lessonId, blockId, skillIds: skillIds ?? [] });
  },

  async completeLesson({ uid, lessonId, skillIds }: LessonCompletion) {
    const { db, doc, setDoc, serverTimestamp } = await firestore();
    await setDoc(
      doc(db, "progress", `${uid}_${lessonId}`),
      { uid, lessonId, completedAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true },
    );
    await emitEvent(uid, "lesson-complete", { lessonId, skillIds: skillIds ?? [] });
  },
};

export const progressService: ProgressService = isLiveMode()
  ? liveProgressService
  : demoProgressService;

export { demoProgressService, liveProgressService };
