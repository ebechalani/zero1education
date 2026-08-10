import { MissionPlayer } from "@/features/mission/mission-player";
import { ALL_LESSONS, getLesson } from "@/content/curriculum";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "published").map((l) => ({
    lessonId: l.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  return { title: lesson ? `${lesson.title} — Mission` : "Mission" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson || lesson.status !== "published") notFound();
  return <MissionPlayer lesson={lesson} />;
}
