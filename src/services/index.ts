import { isLiveMode } from "@/lib/firebase/config";
import { classroomService } from "./classroom-service";
import { contentService } from "./content-service";

/**
 * Adapter selection (docs/ARCHITECTURE.md §4).
 *
 * Today every export below resolves to the demo adapter: content comes from
 * the bundled curriculum, classroom data from the seeded demo dataset, and
 * progress + session from the client stores (`stores/progress-store.ts`,
 * `stores/session-store.ts`) which already satisfy ProgressService and
 * AuthService.
 *
 * Going live changes this file and nothing else. Once `isLiveMode()` is true
 * — NEXT_PUBLIC_ZERO1_MODE=live plus the Firebase keys — the Firestore
 * adapters plug in here:
 *
 *   content    → src/services/firestore/content-service.ts     lessons + units
 *   classroom  → src/services/firestore/classroom-service.ts   classes + classAnalytics
 *   progress   → src/services/firestore/progress-service.ts    progressEvents + studentSummaries
 *   auth       → src/services/firestore/auth-service.ts        Firebase Auth + custom claims
 *
 *   export const services = isLiveMode() ? firestoreServices : demoServices;
 *
 * Interfaces and call sites stay byte-identical — production mode swaps
 * adapters, not screens.
 */

export const services = {
  content: contentService,
  classroom: classroomService,
} as const;

/** True while screens are rendering seeded numbers — gates <DemoChip />. */
export const isDemoData = !isLiveMode();

export { classroomService, contentService };

export type {
  ActivityRecord,
  AuthService,
  ClassAnalytics,
  ClassroomService,
  ContentQuery,
  ContentService,
  Credentials,
  LabRecord,
  LessonCompletion,
  MasteryRow,
  ProgressService,
  QuestionStat,
  RosterEntry,
  Session,
  SessionClaims,
  StageRecord,
  TopicMastery,
} from "./types";
