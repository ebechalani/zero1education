import { ALL_LESSONS } from "@/content/curriculum";
import LessonClient from "./lesson-client";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "published").map((l) => ({
    lessonId: l.id,
  }));
}

export default function TeacherLessonPage() {
  return <LessonClient />;
}
