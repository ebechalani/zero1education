import { FEATURED_LESSONS } from "@/content/curriculum";
import {
  CLASS_TOPICS,
  ROSTER,
  classTopicAverage,
  questionCorrectRate,
  strugglingStudents,
  studentTopicMastery,
  type RosterStudent,
} from "@/content/demo/classroom";
import { DEMO_CLASS, DEMO_SCHOOL } from "@/content/demo/users";
import type { ClassGroup } from "@/types/user";
import type {
  ClassAnalytics,
  ClassroomService,
  QuestionStat,
  RosterEntry,
  TopicMastery,
} from "./types";

/**
 * Demo classroom adapter — seeded, deterministic, identical on server and
 * client. Only Grade 6 Section A carries a roster; the other sections exist so
 * the class list is realistic. Replaced by the Firestore adapter reading
 * `classes` + `classAnalytics` in live mode (docs/FIREBASE.md §1).
 */

const WIRED_CLASS_ID = DEMO_CLASS.id;
const WIRED_UNIT_ID = "g6-microbit";
const NEEDS_SUPPORT_THRESHOLD = 50;
const HARDEST_QUESTIONS = 6;

const DEMO_CLASSES: ClassGroup[] = [
  { ...DEMO_CLASS, studentIds: ROSTER.map((s) => s.uid) },
  {
    id: "cls-6b",
    schoolId: DEMO_SCHOOL.id,
    name: "Grade 6 — Section B",
    grade: 6,
    teacherIds: DEMO_CLASS.teacherIds,
    studentIds: [],
  },
  {
    id: "cls-7a",
    schoolId: DEMO_SCHOOL.id,
    name: "Grade 7 — Section A",
    grade: 7,
    teacherIds: DEMO_CLASS.teacherIds,
    studentIds: [],
  },
];

const classById = new Map(DEMO_CLASSES.map((c) => [c.id, c]));

const topicByLessonId = new Map<string, string>(
  CLASS_TOPICS.map((t) => [t.lessonId, t.id] as const),
);

function averageMastery(student: RosterStudent): number {
  const sum = CLASS_TOPICS.reduce(
    (acc, t) => acc + studentTopicMastery(student, t.id),
    0,
  );
  return Math.round(sum / CLASS_TOPICS.length);
}

function toRosterEntry(student: RosterStudent, grade: number): RosterEntry {
  return {
    uid: student.uid,
    firstName: student.firstName,
    lastName: student.lastName,
    avatarHue: student.avatarHue,
    grade,
    averageMastery: averageMastery(student),
  };
}

/** Checkpoint questions across the unit, hardest first. */
function hardestQuestions(): QuestionStat[] {
  return FEATURED_LESSONS.flatMap((lesson) => {
    const topicId = topicByLessonId.get(lesson.id);
    if (!topicId) return [];
    return lesson.stages
      .filter((stage) => stage.kind === "checkpoint")
      .flatMap((stage) =>
        stage.blocks.flatMap((block) =>
          block.type === "quiz"
            ? block.questions.map((q) => ({
                questionId: q.id,
                prompt: q.prompt.split("\n")[0],
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                correctPct: questionCorrectRate(q.id, topicId),
              }))
            : [],
        ),
      );
  })
    .sort((a, b) => a.correctPct - b.correctPct)
    .slice(0, HARDEST_QUESTIONS);
}

export const classroomService: ClassroomService = {
  async listClasses(teacherUid) {
    return DEMO_CLASSES.filter((c) => c.teacherIds.includes(teacherUid));
  },

  async getRoster(classId) {
    if (classId !== WIRED_CLASS_ID) return [];
    const grade = classById.get(classId)?.grade ?? DEMO_CLASS.grade;
    return ROSTER.map((student) => toRosterEntry(student, grade));
  },

  async getClassAnalytics(classId, unitId) {
    if (classId !== WIRED_CLASS_ID || unitId !== WIRED_UNIT_ID) return null;

    const topics: TopicMastery[] = CLASS_TOPICS.map((t) => ({
      topicId: t.id,
      label: t.label,
      lessonId: t.lessonId,
      average: classTopicAverage(t.id),
    }));

    const weakest = topics.reduce((lowest, t) =>
      t.average < lowest.average ? t : lowest,
    );
    const grade = classById.get(classId)?.grade ?? DEMO_CLASS.grade;

    return {
      classId,
      unitId,
      studentCount: ROSTER.length,
      overallMastery: Math.round(
        topics.reduce((acc, t) => acc + t.average, 0) / topics.length,
      ),
      topics,
      heatmap: ROSTER.map((student) => ({
        uid: student.uid,
        name: `${student.firstName} ${student.lastName}`,
        values: topics.map((t) => studentTopicMastery(student, t.topicId)),
      })),
      hardestQuestions: hardestQuestions(),
      needsSupport: strugglingStudents(weakest.topicId, NEEDS_SUPPORT_THRESHOLD)
        .map((student) => toRosterEntry(student, grade))
        .sort((a, b) => a.averageMastery - b.averageMastery),
      demo: true,
    } satisfies ClassAnalytics;
  },
};
