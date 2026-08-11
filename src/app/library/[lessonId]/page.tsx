import { ALL_LESSONS, getLesson } from "@/content/curriculum";
import type { Metadata } from "next";
import ReaderClient from "./reader-client";

export function generateStaticParams() {
  return ALL_LESSONS.map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  return {
    title: lesson ? `${lesson.title} — Read` : "Lesson",
    description: lesson?.description,
  };
}

export default function LibraryLessonPage() {
  return <ReaderClient />;
}
