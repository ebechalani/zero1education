import { BOOK_CHAPTERS, chapterById } from "@/content/books";
import type { Metadata } from "next";
import ViewerClient from "./viewer-client";

export function generateStaticParams() {
  return BOOK_CHAPTERS.map((c) => ({ chapterId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = chapterById(chapterId);
  return {
    title: chapter ? `${chapter.title} — original pages` : "Original pages",
    description: chapter
      ? `Chapter ${chapter.chapter} of the printed ZERO1 edition, read online.`
      : undefined,
    robots: { index: false, follow: false },
  };
}

export default function OriginalChapterPage() {
  return <ViewerClient />;
}
