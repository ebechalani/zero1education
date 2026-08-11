"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLesson, lessonsForUnit } from "@/content/curriculum";
import { BookLessonPlayer } from "@/features/reader/book-lesson-player";
import { BookOpen, Library } from "lucide-react";
import { useParams } from "next/navigation";

export default function BookLessonClient() {
  const params = useParams<{ lessonId: string }>();
  const lesson =
    typeof params.lessonId === "string" ? getLesson(params.lessonId) : undefined;

  if (!lesson || !lesson.bookAnchor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<BookOpen />}
          title="This lesson has no printed pages"
          description="Only lessons converted from the printed edition can be studied from the book. Others are read in the interactive library."
          action={
            <Button href="/library" icon={<Library />}>
              Back to the library
            </Button>
          }
        />
      </div>
    );
  }

  // Neighbours in the same chapter, so the pager walks the book in order
  const siblings = lessonsForUnit(lesson.unitId).filter((l) => l.bookAnchor);
  const i = siblings.findIndex((l) => l.id === lesson.id);
  const prev = i > 0 ? siblings[i - 1] : undefined;
  const next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined;

  return (
    <BookLessonPlayer
      lesson={lesson}
      prev={prev && { id: prev.id, title: prev.title }}
      next={next && { id: next.id, title: next.title }}
    />
  );
}
