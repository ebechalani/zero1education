import type { GradeId, Lesson, Unit } from "@/types/content";
import type { ActivityResult, StudentSummary } from "@/types/progress";
import type { AppUser, ClassGroup, Role } from "@/types/user";

/**
 * Service interfaces — the only contract the UI knows about
 * (docs/ARCHITECTURE.md §4). Each has a demo adapter today and a Firestore
 * adapter in production; screens never learn which one is active.
 */

// ── Content ─────────────────────────────────────────────────────────────────

export interface ContentQuery {
  /**
   * Include draft / coming-soon records. Mirrors the Firestore rule that
   * limits non-authors to `status == 'published'` (docs/FIREBASE.md §4).
   */
  includeUnpublished?: boolean;
}

export interface ContentService {
  getUnit(unitId: string): Promise<Unit | null>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  listLessons(unitId: string, query?: ContentQuery): Promise<Lesson[]>;
  listUnitsForGrade(gradeId: GradeId, query?: ContentQuery): Promise<Unit[]>;
}

// ── Progress ────────────────────────────────────────────────────────────────

/** Every write carries the owner so the Firestore adapter can scope the doc id. */
interface ProgressWrite {
  uid: string;
  lessonId: string;
}

export interface StageRecord extends ProgressWrite {
  stageId: string;
  /** Overrides the default stage award; ignored server-side in live mode. */
  xp?: number;
}

export interface ActivityRecord extends ProgressWrite {
  activityId: string;
  result: Omit<ActivityResult, "activityId" | "completedAt">;
  xp?: number;
  skillIds?: string[];
}

export interface LabRecord extends ProgressWrite {
  /** Block id of the lab inside the lesson — labs repeat across lessons. */
  blockId: string;
  skillIds?: string[];
}

export interface LessonCompletion extends ProgressWrite {
  skillIds?: string[];
}

export interface ProgressService {
  getSummary(uid: string): Promise<StudentSummary>;
  recordStage(record: StageRecord): Promise<void>;
  recordActivity(record: ActivityRecord): Promise<void>;
  recordLab(record: LabRecord): Promise<void>;
  completeLesson(completion: LessonCompletion): Promise<void>;
}

// ── Auth ────────────────────────────────────────────────────────────────────

/** Mirrors the custom claims a Cloud Function stamps (docs/FIREBASE.md §2). */
export interface SessionClaims {
  role: Role;
  schoolId: string;
}

export interface Session {
  user: AppUser;
  claims: SessionClaims;
}

export type Credentials =
  | { kind: "password"; email: string; password: string }
  | { kind: "demo-role"; role: Role };

export interface AuthService {
  getSession(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signOut(): Promise<void>;
}

// ── Classroom ───────────────────────────────────────────────────────────────

export interface RosterEntry
  extends Pick<AppUser, "uid" | "firstName" | "lastName" | "avatarHue"> {
  grade: number;
  /** Mean mastery across the unit's topics, 0–100 */
  averageMastery: number;
}

export interface TopicMastery {
  topicId: string;
  label: string;
  lessonId: string;
  /** Class average, 0–100 */
  average: number;
}

export interface QuestionStat {
  questionId: string;
  prompt: string;
  lessonId: string;
  lessonTitle: string;
  /** Share of the class answering correctly, 0–100 */
  correctPct: number;
}

export interface MasteryRow {
  uid: string;
  name: string;
  /** Aligned to ClassAnalytics.topics, same order */
  values: number[];
}

export interface ClassAnalytics {
  classId: string;
  unitId: string;
  studentCount: number;
  /** Class average across every topic, 0–100 */
  overallMastery: number;
  topics: TopicMastery[];
  heatmap: MasteryRow[];
  hardestQuestions: QuestionStat[];
  needsSupport: RosterEntry[];
  /** True while the numbers come from the seeded dataset — drives <DemoChip />. */
  demo: boolean;
}

export interface ClassroomService {
  listClasses(teacherUid: string): Promise<ClassGroup[]>;
  getRoster(classId: string): Promise<RosterEntry[]>;
  getClassAnalytics(classId: string, unitId: string): Promise<ClassAnalytics | null>;
}
