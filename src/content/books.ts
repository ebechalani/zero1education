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
  /**
   * Grades 8, 9 and 12 were only ever exported as one file per year, so every
   * chapter of those grades points at the same PDF. The reader opens the whole
   * book rather than pretending to know where a chapter starts.
   */
  wholeBook?: boolean;
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

  // ──────── Grade 1 ───────────────────────────────────────────────────
  {
    id: "g1-ch1",
    gradeId: "g1",
    unitId: "g1-intro-computers",
    chapter: 1,
    title: "Intro to Computers",
    file: "/books/grade-1/g1-ch1-intro-to-computers.pdf",
    sourceFileName: "g1-ch1-intro-to-computers.pdf",
  },
  {
    id: "g1-ch2",
    gradeId: "g1",
    unitId: "g1-paint",
    chapter: 2,
    title: "Draw with Paint",
    file: "/books/grade-1/g1-ch2-draw-with-paint.pdf",
    sourceFileName: "g1-ch2-draw-with-paint.pdf",
  },
  {
    id: "g1-ch4",
    gradeId: "g1",
    unitId: "g1-algorithms",
    chapter: 4,
    title: "Algorithms",
    file: "/books/grade-1/g1-ch4-algorithm.pdf",
    sourceFileName: "g1-ch4-algorithm.pdf",
  },
  {
    id: "g1-ch5",
    gradeId: "g1",
    unitId: "g1-scratchjr",
    chapter: 5,
    title: "ScratchJr",
    file: "/books/grade-1/g1-ch5-scratch-jr.pdf",
    sourceFileName: "g1-ch5-scratch-jr.pdf",
  },

  // ──────── Grade 2 ───────────────────────────────────────────────────
  {
    id: "g2-ch1",
    gradeId: "g2",
    unitId: "g2-components",
    chapter: 1,
    title: "Computer Components",
    file: "/books/grade-2/g2-ch1-computer-components.pdf",
    sourceFileName: "g2-ch1-computer-components.pdf",
  },
  {
    id: "g2-ch3",
    gradeId: "g2",
    unitId: "g2-algorithms",
    chapter: 3,
    title: "Algorithms",
    file: "/books/grade-2/g2-ch3-algorithm.pdf",
    sourceFileName: "g2-ch3-algorithm.pdf",
  },
  {
    id: "g2-ch4",
    gradeId: "g2",
    unitId: "g2-scratchjr",
    chapter: 4,
    title: "ScratchJr",
    file: "/books/grade-2/g2-ch4-scratch-jr.pdf",
    sourceFileName: "g2-ch4-scratch-jr.pdf",
  },
  {
    id: "g2-ch5",
    gradeId: "g2",
    unitId: "g2-robotics",
    chapter: 5,
    title: "Robotics",
    file: "/books/grade-2/g2-ch5-robotics.pdf",
    sourceFileName: "g2-ch5-robotics.pdf",
  },

  // ──────── Grade 3 ───────────────────────────────────────────────────
  {
    id: "g3-ch1",
    gradeId: "g3",
    unitId: "g3-scratchjr",
    chapter: 1,
    title: "ScratchJr Projects",
    file: "/books/grade-3/g3-ch1-scratchjr.pdf",
    sourceFileName: "g3-ch1-scratchjr.pdf",
  },
  {
    id: "g3-ch2",
    gradeId: "g3",
    unitId: "g3-cartoon",
    chapter: 2,
    title: "Cartoon Drawing",
    file: "/books/grade-3/g3-ch2-cartoon-drawing.pdf",
    sourceFileName: "g3-ch2-cartoon-drawing.pdf",
  },
  {
    id: "g3-ch3",
    gradeId: "g3",
    unitId: "g3-discovering-computer",
    chapter: 3,
    title: "Discovering My Computer",
    file: "/books/grade-3/g3-ch3-discovering-my-computer.pdf",
    sourceFileName: "g3-ch3-discovering-my-computer.pdf",
  },
  {
    id: "g3-ch4",
    gradeId: "g3",
    unitId: "g3-robotics",
    chapter: 4,
    title: "Robotics",
    file: "/books/grade-3/g3-ch4-robotics.pdf",
    sourceFileName: "g3-ch4-robotics.pdf",
  },
  {
    id: "g3-ch5",
    gradeId: "g3",
    unitId: "g3-microbit",
    chapter: 5,
    title: "micro:bit",
    file: "/books/grade-3/g3-ch5-microbit.pdf",
    sourceFileName: "g3-ch5-microbit.pdf",
  },
  {
    id: "g3-ch6",
    gradeId: "g3",
    unitId: "g3-word",
    chapter: 6,
    title: "Microsoft Word",
    file: "/books/grade-3/g3-ch6-microsoft-word.pdf",
    sourceFileName: "g3-ch6-microsoft-word.pdf",
  },

  // ──────── Grade 4 ───────────────────────────────────────────────────
  {
    id: "g4-ch1",
    gradeId: "g4",
    unitId: "g4-scratch",
    chapter: 1,
    title: "Coding with Scratch",
    file: "/books/grade-4/g4-ch1-coding-with-scratch.pdf",
    sourceFileName: "g4-ch1-coding-with-scratch.pdf",
  },
  {
    id: "g4-ch2",
    gradeId: "g4",
    unitId: "g4-cartoon",
    chapter: 2,
    title: "Cartoon Drawing",
    file: "/books/grade-4/g4-ch2-cartoon-drawing.pdf",
    sourceFileName: "g4-ch2-cartoon-drawing.pdf",
  },
  {
    id: "g4-ch3",
    gradeId: "g4",
    unitId: "g4-makecode",
    chapter: 3,
    title: "MakeCode for micro:bit",
    file: "/books/grade-4/g4-ch3-makecode-for-microbit.pdf",
    sourceFileName: "g4-ch3-makecode-for-microbit.pdf",
  },
  {
    id: "g4-ch4",
    gradeId: "g4",
    unitId: "g4-powerpoint",
    chapter: 4,
    title: "PowerPoint",
    file: "/books/grade-4/g4-ch4-power-point.pdf",
    sourceFileName: "g4-ch4-power-point.pdf",
  },
  {
    id: "g4-ch5",
    gradeId: "g4",
    unitId: "g4-mbot2",
    chapter: 5,
    title: "Robotics with mBot2",
    file: "/books/grade-4/g4-ch5-robotics-with-mbot2.pdf",
    sourceFileName: "g4-ch5-robotics-with-mbot2.pdf",
  },

  // ──────── Grade 5 ───────────────────────────────────────────────────
  {
    id: "g5-ch1",
    gradeId: "g5",
    unitId: "g5-makecode",
    chapter: 1,
    title: "MakeCode for micro:bit",
    file: "/books/grade-5/g5-ch1-makecode-for-microbit.pdf",
    sourceFileName: "g5-ch1-makecode-for-microbit.pdf",
  },
  {
    id: "g5-ch2",
    gradeId: "g5",
    unitId: "g5-scratch",
    chapter: 2,
    title: "Scratch",
    file: "/books/grade-5/g5-ch2-scratch.pdf",
    sourceFileName: "g5-ch2-scratch.pdf",
  },
  {
    id: "g5-ch3",
    gradeId: "g5",
    unitId: "g5-cartoon",
    chapter: 3,
    title: "Cartoon Drawing",
    file: "/books/grade-5/g5-ch3-cartoon-drawing.pdf",
    sourceFileName: "g5-ch3-cartoon-drawing.pdf",
  },
  {
    id: "g5-ch4",
    gradeId: "g5",
    unitId: "g5-excel",
    chapter: 4,
    title: "Excel",
    file: "/books/grade-5/g5-ch4-excel.pdf",
    sourceFileName: "g5-ch4-excel.pdf",
  },
  {
    id: "g5-ch5",
    gradeId: "g5",
    unitId: "g5-robotics",
    chapter: 5,
    title: "Robotics",
    file: "/books/grade-5/g5-ch5-robotics.pdf",
    sourceFileName: "g5-ch5-robotics.pdf",
  },

  // ──────── Grade 7 ───────────────────────────────────────────────────
  {
    id: "g7-ch2",
    gradeId: "g7",
    unitId: "g7-photoshop",
    chapter: 2,
    title: "Photoshop",
    file: "/books/grade-7/g7-ch2-photoshop.pdf",
    sourceFileName: "g7-ch2-photoshop.pdf",
  },
  {
    id: "g7-ch3",
    gradeId: "g7",
    unitId: "g7-html",
    chapter: 3,
    title: "HTML",
    file: "/books/grade-7/g7-ch3-html.pdf",
    sourceFileName: "g7-ch3-html.pdf",
  },
  {
    id: "g7-ch4",
    gradeId: "g7",
    unitId: "g7-mbot2",
    chapter: 4,
    title: "mBot2",
    file: "/books/grade-7/g7-ch4-mbot2.pdf",
    sourceFileName: "g7-ch4-mbot2.pdf",
  },
  {
    id: "g7-ch5",
    gradeId: "g7",
    unitId: "g7-python",
    chapter: 5,
    title: "Python",
    file: "/books/grade-7/g7-ch5-python.pdf",
    sourceFileName: "g7-ch5-python.pdf",
  },
  {
    id: "g7-ch6",
    gradeId: "g7",
    unitId: "g7-arduino",
    chapter: 6,
    title: "Arduino",
    file: "/books/grade-7/g7-ch6-arduino.pdf",
    sourceFileName: "g7-ch6-arduino.pdf",
  },

  // ──────── Grade 10 ──────────────────────────────────────────────────
  {
    id: "g10-ch1",
    gradeId: "g10",
    unitId: "g10-python",
    chapter: 1,
    title: "Python",
    file: "/books/grade-10/g10-ch1-python.pdf",
    sourceFileName: "g10-ch1-python.pdf",
  },
  {
    id: "g10-ch2",
    gradeId: "g10",
    unitId: "g10-photoshop",
    chapter: 2,
    title: "Photoshop",
    file: "/books/grade-10/g10-ch2-photoshop.pdf",
    sourceFileName: "g10-ch2-photoshop.pdf",
  },
  {
    id: "g10-ch3",
    gradeId: "g10",
    unitId: "g10-excel",
    chapter: 3,
    title: "Excel",
    file: "/books/grade-10/g10-ch3-excel.pdf",
    sourceFileName: "g10-ch3-excel.pdf",
  },
  {
    id: "g10-ch4",
    gradeId: "g10",
    unitId: "g10-access",
    chapter: 4,
    title: "Access",
    file: "/books/grade-10/g10-ch4-access.pdf",
    sourceFileName: "g10-ch4-access.pdf",
  },
  {
    id: "g10-ch5",
    gradeId: "g10",
    unitId: "g10-arduino",
    chapter: 5,
    title: "Arduino",
    file: "/books/grade-10/g10-ch5-arduino.pdf",
    sourceFileName: "g10-ch5-arduino.pdf",
  },

  // ──────── Grade 11 ──────────────────────────────────────────────────
  {
    id: "g11-ch1",
    gradeId: "g11",
    unitId: "g11-arduino",
    chapter: 1,
    title: "Arduino",
    file: "/books/grade-11/g11-ch1-arduino.pdf",
    sourceFileName: "g11-ch1-arduino.pdf",
  },
  {
    id: "g11-ch2",
    gradeId: "g11",
    unitId: "g11-python",
    chapter: 2,
    title: "Python",
    file: "/books/grade-11/g11-ch2-python.pdf",
    sourceFileName: "g11-ch2-python.pdf",
  },
  {
    id: "g11-ch3",
    gradeId: "g11",
    unitId: "g11-access",
    chapter: 3,
    title: "Access",
    file: "/books/grade-11/g11-ch3-access.pdf",
    sourceFileName: "g11-ch3-access.pdf",
  },
  {
    id: "g11-ch4",
    gradeId: "g11",
    unitId: "g11-php",
    chapter: 4,
    title: "PHP",
    file: "/books/grade-11/g11-ch4-php.pdf",
    sourceFileName: "g11-ch4-php.pdf",
  },
  {
    id: "g11-ch5",
    gradeId: "g11",
    unitId: "g11-mysql",
    chapter: 5,
    title: "MySQL",
    file: "/books/grade-11/g11-ch5-mysql.pdf",
    sourceFileName: "g11-ch5-mysql.pdf",
  },
  {
    id: "g11-ch6",
    gradeId: "g11",
    unitId: "g11-python-revision",
    chapter: 6,
    title: "Python Revision",
    file: "/books/grade-11/g11-ch6-python-revision.pdf",
    sourceFileName: "g11-ch6-python-revision.pdf",
  },

  // ──────── Grade 8 ───────────────────────────────────────────────────
  {
    id: "g8-ch1",
    gradeId: "g8",
    unitId: "g8-html",
    chapter: 1,
    title: "Chapter 1",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g8-ch2",
    gradeId: "g8",
    unitId: "g8-mbot2",
    chapter: 2,
    title: "Chapter 2",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g8-ch3",
    gradeId: "g8",
    unitId: "g8-smallbasic",
    chapter: 3,
    title: "Chapter 3",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g8-ch4",
    gradeId: "g8",
    unitId: "g8-photoshop",
    chapter: 4,
    title: "Chapter 4",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g8-ch5",
    gradeId: "g8",
    unitId: "g8-arduino",
    chapter: 5,
    title: "Chapter 5",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g8-ch6",
    gradeId: "g8",
    unitId: "g8-python",
    chapter: 6,
    title: "Chapter 6",
    file: "/books/grade-8/g8-all.pdf",
    sourceFileName: "G8_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },

  // ──────── Grade 9 ───────────────────────────────────────────────────
  {
    id: "g9-ch1",
    gradeId: "g9",
    unitId: "g9-smallbasic",
    chapter: 1,
    title: "Chapter 1",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch2",
    gradeId: "g9",
    unitId: "g9-mbot2",
    chapter: 2,
    title: "Chapter 2",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch3",
    gradeId: "g9",
    unitId: "g9-mailmerge",
    chapter: 3,
    title: "Chapter 3",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch4",
    gradeId: "g9",
    unitId: "g9-arduino",
    chapter: 4,
    title: "Chapter 4",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch5",
    gradeId: "g9",
    unitId: "g9-access",
    chapter: 5,
    title: "Chapter 5",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch6",
    gradeId: "g9",
    unitId: "g9-codeblock",
    chapter: 6,
    title: "Chapter 6",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g9-ch7",
    gradeId: "g9",
    unitId: "g9-python",
    chapter: 7,
    title: "Chapter 7",
    file: "/books/grade-9/g9-all.pdf",
    sourceFileName: "G9_2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },

  // ──────── Grade 12 ──────────────────────────────────────────────────
  {
    id: "g12-ch1",
    gradeId: "g12",
    unitId: "g12-python",
    chapter: 1,
    title: "Chapter 1",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g12-ch2",
    gradeId: "g12",
    unitId: "g12-php",
    chapter: 2,
    title: "Chapter 2",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g12-ch3",
    gradeId: "g12",
    unitId: "g12-mysql",
    chapter: 3,
    title: "Chapter 3",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g12-ch4",
    gradeId: "g12",
    unitId: "g12-arduino-1",
    chapter: 4,
    title: "Chapter 4",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g12-ch5",
    gradeId: "g12",
    unitId: "g12-arduino-2",
    chapter: 5,
    title: "Chapter 5",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
  },
  {
    id: "g12-ch6",
    gradeId: "g12",
    unitId: "g12-sketchup",
    chapter: 6,
    title: "Chapter 6",
    file: "/books/grade-12/g12-all.pdf",
    sourceFileName: "G12-2023_all.pdf",
    /** This grade ships as one file covering every chapter. */
    wholeBook: true,
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
