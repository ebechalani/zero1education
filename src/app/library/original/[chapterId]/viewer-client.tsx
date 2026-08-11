"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { BOOK_CHAPTERS, chapterById } from "@/content/books";
import { lessonsForUnit, unitById } from "@/content/curriculum";
import { PdfPageViewer } from "@/features/reader/pdf-page-viewer";
import { useBookFile } from "@/features/reader/use-book-file";
import { ArrowLeft, BookOpen, Library, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * The author's printed pages, exactly as published. The interactive lessons
 * built from a chapter are one click away, but this view never paraphrases —
 * some chapters (Cartoon Drawing especially) teach almost entirely through
 * their artwork, which no rewrite can carry.
 */
export default function ViewerClient() {
  const params = useParams<{ chapterId: string }>();
  const chapter =
    typeof params.chapterId === "string" ? chapterById(params.chapterId) : undefined;
  // Probe the file before loading pdf.js, so a missing book says so plainly
  // instead of the viewer trying to parse a 404 page.
  const { status } = useBookFile(chapter?.file ?? "");

  if (!chapter) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<BookOpen />}
          title="No such chapter"
          description={`The library knows ${BOOK_CHAPTERS.length} printed chapters. This address is not one of them.`}
          action={
            <Button href="/library" icon={<Library />}>
              Back to the library
            </Button>
          }
        />
      </div>
    );
  }

  const unit = unitById.get(chapter.unitId);
  const firstLesson = lessonsForUnit(chapter.unitId).find(
    (l) => l.status === "published",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-4" /> Back to the library
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip tone="bit" icon={<BookOpen />}>
              Printed edition · 2023
            </Chip>
            <span className="font-mono text-[11px] text-ink-400">
              Chapter {chapter.chapter}
            </span>
          </div>
          <h1 className="font-display mt-1.5 text-2xl font-bold text-ink-900">
            {chapter.title}
          </h1>
          {unit && (
            <p className="mt-1 max-w-2xl text-[14px] text-ink-500">{unit.summary}</p>
          )}
        </div>
        {firstLesson && (
          <Button
            href={`/library/${firstLesson.id}`}
            variant="secondary"
            icon={<Sparkles />}
          >
            Interactive version
          </Button>
        )}
      </div>

      {status === "missing" ? (
        <EmptyState
          icon={<BookOpen />}
          title="These pages aren't installed yet"
          description={`Put ${chapter.sourceFileName} in public${chapter.file.replace(/\/[^/]+$/, "")}/ and reload. The books are kept out of the repository on purpose — they are your copyrighted material.`}
          action={
            <Button href="/library" variant="secondary" icon={<Library />}>
              Back to the library
            </Button>
          }
        />
      ) : (
        // A fixed reading pane: the page turns inside it rather than the whole
        // document scrolling, which is what makes it feel like a book.
        <div className="h-[calc(100vh-15rem)] min-h-[520px]">
          <PdfPageViewer src={chapter.file} title={chapter.title} />
        </div>
      )}
    </div>
  );
}
