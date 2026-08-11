import { ALL_LESSONS, getLesson } from "@/content/curriculum";
import type { Metadata } from "next";
import BookLessonClient from "./lesson-client";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.bookAnchor).map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  return {
    title: lesson ? `${lesson.title} — from the book` : "Lesson",
    description: lesson?.description,
    robots: { index: false, follow: false },
  };
}

export default function BookLessonPage() {
  return <BookLessonClient />;
}
