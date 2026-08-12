import type { GradeId } from "@/types/content";

/**
 * The printed edition, chapter by chapter.
 *
 * The catalog (`content/curriculum/catalog.ts`) describes what each chapter
 * *teaches*; this manifest describes where the author's original printed pages
 * live so the reader can show them as-is. One entry per PDF — the files are
 * dropped into `public/books/<grade>/` and served statically, never uploaded or
 * fetched from a server, because the whole app is a static export.
 *
 * `unitId` is the bridge: every chapter points at the catalog unit built from
 * it, so a reader can jump from the scanned page to the interactive version.
 */
export interface BookChapter {
  /** Stable id used in the /library/original/[chapterId] route */
  id: string;
  gradeId: GradeId;
  /** The catalog unit this chapter was converted into */
  unitId: string;
  /** Chapter number as printed in the book */
  chapter: number;
  title: string;
  /** Public path of the PDF, relative to the site root (no basePath) */
  file: string;
  /** The original filename in the author's archive — kept for traceability */
  sourceFileName: string;
}

export const BOOK_CHAPTERS: BookChapter[] = [
  // ── Kindergarten ──────────────────────────────────────────────────────────
  {
    id: "kg-ch1",
    gradeId: "g0",
    unitId: "g0-knowing-computer",
    chapter: 1,
    title: "Knowing My Computer",
    file: "/books/grade-0/kg-ch1-computer.pdf",
    sourceFileName: "KG_2023_CH1_knowing_my_computer.pdf",
  },
  {
    id: "kg-ch2",
    gradeId: "g0",
    unitId: "g0-cartoon-drawing",
    chapter: 2,
    title: "Cartoon Drawing",
    file: "/books/grade-0/kg-ch2-cartoon.pdf",
    sourceFileName: "KG_2023_CH2_cartoon_drawing.pdf",
  },
  {
    id: "kg-ch3",
    gradeId: "g0",
    unitId: "g0-keyboard",
    chapter: 3,
    title: "Using My Keyboard",
    file: "/books/grade-0/kg-ch3-keyboard.pdf",
    sourceFileName: "KG_2023_CH3_using_my_keyboard.pdf",
  },
  {
    id: "kg-ch4",
    gradeId: "g0",
    unitId: "g0-paint",
    chapter: 4,
    title: "Drawing with Paint",
    file: "/books/grade-0/kg-ch4-paint.pdf",
    sourceFileName: "KG_2023_CH4_drawing_with_paint.pdf",
  },
  {
    id: "kg-ch5",
    gradeId: "g0",
    unitId: "g0-algorithms",
    chapter: 5,
    title: "Coding with Algorithms",
    file: "/books/grade-0/kg-ch5-algorithms.pdf",
    sourceFileName: "KG_2023_CH5_coding_with_algorithm.pdf",
  },
  {
    id: "kg-ch6",
    gradeId: "g0",
    unitId: "g0-scratchjr",
    chapter: 6,
    title: "ScratchJr",
    file: "/books/grade-0/kg-ch6-scratchjr.pdf",
    sourceFileName: "KG_2023_CH6_scratch_junior.pdf",
  },

  // ── Grade 6 ───────────────────────────────────────────────────────────────
  {
    id: "g6-ch1",
    gradeId: "g6",
    unitId: "g6-microbit",
    chapter: 1,
    title: "MakeCode for micro:bit",
    file: "/books/grade-6/g6-ch1-microbit.pdf",
    sourceFileName: "G6_2023_ch1_microbit.pdf",
  },
  {
    id: "g6-ch2",
    gradeId: "g6",
    unitId: "g6-excel",
    chapter: 2,
    title: "Microsoft Excel",
    file: "/books/grade-6/g6-ch2-excel.pdf",
    sourceFileName: "G6_2023_ch2_excel.pdf",
  },
  {
    id: "g6-ch3",
    gradeId: "g6",
    unitId: "g6-cartoon",
    chapter: 3,
    title: "Cartoon Drawing",
    file: "/books/grade-6/g6-ch3-cartoon.pdf",
    sourceFileName: "G6_2023_ch3_cartoon.pdf",
  },
  {
    id: "g6-ch4",
    gradeId: "g6",
    unitId: "g6-robotics",
    chapter: 4,
    title: "Robotics with mBot2",
    file: "/books/grade-6/g6-ch4-robotics.pdf",
    sourceFileName: "G6_2023_ch4_robotics.pdf",
  },
  {
    id: "g6-ch5",
    gradeId: "g6",
    unitId: "g6-scratch",
    chapter: 5,
    title: "Scratch",
    file: "/books/grade-6/g6-ch5-scratch.pdf",
    sourceFileName: "G6_2023_ch5_Scratch.pdf",
  },
];

const chapterIndex = new Map(BOOK_CHAPTERS.map((c) => [c.id, c]));
const unitIndex = new Map(BOOK_CHAPTERS.map((c) => [c.unitId, c]));

/** Chapters of one grade, in printed order. */
export function chaptersForGrade(g: number): BookChapter[] {
  return BOOK_CHAPTERS.filter((c) => c.gradeId === `g${g}`).sort(
    (a, b) => a.chapter - b.chapter,
  );
}

/** The printed chapter a catalog unit came from, if it has been scanned. */
export function chapterForUnit(unitId: string): BookChapter | undefined {
  return unitIndex.get(unitId);
}

export function chapterById(id: string): BookChapter | undefined {
  return chapterIndex.get(id);
}
