import { mulberry32, hashString, clamp } from "@/lib/utils";

/**
 * DEMO MODE ONLY — deterministic synthetic classroom data.
 * Seeded PRNG → identical on server and client, stable between reloads.
 * Every screen showing these numbers renders a <DemoChip />.
 */

export interface RosterStudent {
  uid: string;
  firstName: string;
  lastName: string;
  avatarHue: number;
  /** 0–1 latent ability that drives all generated stats */
  ability: number;
}

const NAMES: [string, string][] = [
  ["Maya", "Haddad"], ["Karim", "Nassar"], ["Lea", "Azar"], ["Omar", "Sleiman"],
  ["Nour", "Khalil"], ["Jad", "Abou Jaoude"], ["Yasmine", "Saab"], ["Rami", "Chidiac"],
  ["Tala", "Gerges"], ["Marc", "Bou Khalil"], ["Sara", "Mansour"], ["Elio", "Tannous"],
  ["Lina", "Barakat"], ["Hadi", "Fares"], ["Mia", "Rahme"], ["Charbel", "Aoun"],
  ["Dana", "Youssef"], ["Anthony", "Sfeir"], ["Zeina", "Matar"], ["Joe", "Hachem"],
  ["Aya", "Kanaan"], ["Georges", "Abi Saab"], ["Maria", "Salame"], ["Adam", "Zgheib"],
];

export const ROSTER: RosterStudent[] = NAMES.map(([firstName, lastName], i) => {
  const rand = mulberry32(hashString(`${firstName}${lastName}`));
  return {
    uid: i === 0 ? "usr-student" : `stu-${i.toString().padStart(2, "0")}`,
    firstName,
    lastName,
    avatarHue: Math.round(rand() * 360),
    ability: clamp(0.38 + rand() * 0.55, 0, 1),
  };
});

/** Topics tracked for class analytics, following Grade 6 Chapter 1. */
export const CLASS_TOPICS = [
  { id: "micro", label: "Microcontrollers", lessonId: "g6-mb-01" },
  { id: "iot", label: "Smart Objects & IoT", lessonId: "g6-mb-02" },
  { id: "variables", label: "Variables", lessonId: "g6-mb-04" },
  { id: "matrix", label: "LED Matrix", lessonId: "g6-mb-06" },
  { id: "loops", label: "Loops", lessonId: "g6-mb-07" },
] as const;

/** Per-topic difficulty modifier (loops run hardest in this class). */
const TOPIC_DIFFICULTY: Record<string, number> = {
  micro: 0.08,
  iot: 0.0,
  variables: -0.02,
  matrix: -0.12,
  loops: -0.26,
};

export function studentTopicMastery(s: RosterStudent, topicId: string): number {
  const rand = mulberry32(hashString(`${s.uid}:${topicId}`));
  const noise = (rand() - 0.5) * 0.28;
  const v = (s.ability + (TOPIC_DIFFICULTY[topicId] ?? 0) + noise) * 100;
  return Math.round(clamp(v, 8, 99));
}

export function classTopicAverage(topicId: string): number {
  const sum = ROSTER.reduce(
    (acc, s) => acc + studentTopicMastery(s, topicId),
    0,
  );
  return Math.round(sum / ROSTER.length);
}

export type LessonStatus = "completed" | "working" | "not-started" | "needs-help";

export function studentLessonStatus(
  s: RosterStudent,
  topicIndex: number,
): LessonStatus {
  const rand = mulberry32(hashString(`${s.uid}:status:${topicIndex}`));
  // Later lessons are less advanced class-wide
  const progressFrontier = 0.92 - topicIndex * 0.18;
  const p = s.ability * 0.6 + rand() * 0.4;
  if (p > progressFrontier + 0.12) return "completed";
  if (p > progressFrontier - 0.1)
    return rand() > 0.82 ? "needs-help" : "working";
  return "not-started";
}

/** Struggling students for a topic (mastery < threshold). */
export function strugglingStudents(topicId: string, threshold = 50) {
  return ROSTER.filter((s) => studentTopicMastery(s, topicId) < threshold);
}

/** Seeded per-question correct-rate for checkpoint analysis. */
export function questionCorrectRate(questionId: string, topicId: string): number {
  const rand = mulberry32(hashString(`q:${questionId}`));
  const base = classTopicAverage(topicId) / 100;
  return Math.round(clamp(base + (rand() - 0.5) * 0.42, 0.12, 0.97) * 100);
}

/** Weekly activity counts for sparklines (deterministic). */
export function weeklyActivity(seedKey: string, weeks = 8): number[] {
  const rand = mulberry32(hashString(`wk:${seedKey}`));
  return Array.from({ length: weeks }, (_, i) =>
    Math.round(8 + rand() * 30 + i * rand() * 4),
  );
}

// ── Teacher-facing demo content ────────────────────────────────────────────

export const DEMO_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Air quality station arrives Monday",
    body: "We start the Kitronik lessons next week. Finish the LED matrix project before Friday so everyone begins together.",
    from: "Ms. Khoury",
    date: "2026-08-06",
  },
  {
    id: "ann-2",
    title: "Robotics club — new season",
    body: "mBot2 robotics club signs up this week in the lab. Limited seats!",
    from: "Ms. Khoury",
    date: "2026-08-03",
  },
];

export const DEMO_ASSIGNMENTS = [
  {
    id: "asg-1",
    title: "LED matrix project",
    lessonId: "g6-mb-06",
    due: "2026-08-14",
    kind: "project" as const,
  },
  {
    id: "asg-2",
    title: "Chapter 1 evaluation sheet",
    lessonId: "g6-mb-10",
    due: "2026-08-21",
    kind: "checkpoint" as const,
  },
];
