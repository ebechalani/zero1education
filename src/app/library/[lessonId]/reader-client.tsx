"use client";

import { BookReader } from "@/features/reader/book-reader";
import { getLesson, lessonsForUnit } from "@/content/curriculum";
import { useSession } from "@/stores/session-store";
import { useParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BookOpen, Library } from "lucide-react";

export default function ReaderClient() {
  const params = useParams<{ lessonId: string }>();
  const { user } = useSession();
  const lesson =
    typeof params.lessonId === "string" ? getLesson(params.lessonId) : undefined;

  if (!lesson || lesson.status !== "published") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<BookOpen />}
          title="This lesson isn't online yet"
          description="Its chapter is catalogued from the printed edition, but the pages have not been brought into the platform. Chapters are converted one at a time in ZERO1 Studio."
          action={
            <Button href="/library" icon={<Library />}>
              Back to the library
            </Button>
          }
        />
      </div>
    );
  }

  // Neighbours within the same chapter, for the pager
  const siblings = lessonsForUnit(lesson.unitId).filter(
    (l) => l.status === "published",
  );
  const i = siblings.findIndex((l) => l.id === lesson.id);
  const prev = i > 0 ? siblings[i - 1] : undefined;
  const next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined;

  return (
    <BookReader
      lesson={lesson}
      prev={prev && { id: prev.id, title: prev.title }}
      next={next && { id: next.id, title: next.title }}
      showTeacherNotes={user?.role === "teacher" || user?.role === "zero1_admin"}
    />
  );
}
