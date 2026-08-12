import type { BookAnchor } from "@/types/content";
import { KG_ANCHORS } from "./kg-anchors";

/**
 * Where each lesson sits in the printed PDFs.
 *
 * Read off the actual files, and the layout turned out to be strictly regular
 * in every Grade 6 chapter: page 1 is the chapter cover, then each lesson takes
 * a two-page spread, and the final lesson (an evaluation sheet or project page)
 * takes one. So lesson n occupies PDF pages 2n and 2n+1, clamped to the end of
 * the file.
 *
 * Encoding the rule rather than 36 hand-typed page numbers means a mis-set
 * chapter shows up as an obviously wrong lesson count, not a silently wrong
 * page. `printedOffset` converts a PDF position to the number printed on the
 * page, so citations can quote the book.
 */
interface ChapterLayout {
  chapterId: string;
  /** Catalog unit whose lessons this chapter holds */
  unitId: string;
  lessonCount: number;
  pdfPageCount: number;
  /** printed page number = PDF page + printedOffset */
  printedOffset: number;
}

const LAYOUTS: ChapterLayout[] = [
  { chapterId: "g6-ch1", unitId: "g6-microbit", lessonCount: 10, pdfPageCount: 20, printedOffset: 2 },
  { chapterId: "g6-ch2", unitId: "g6-excel", lessonCount: 7, pdfPageCount: 14, printedOffset: 22 },
  { chapterId: "g6-ch3", unitId: "g6-cartoon", lessonCount: 5, pdfPageCount: 10, printedOffset: 36 },
  { chapterId: "g6-ch4", unitId: "g6-robotics", lessonCount: 7, pdfPageCount: 14, printedOffset: 46 },
  { chapterId: "g6-ch5", unitId: "g6-scratch", lessonCount: 7, pdfPageCount: 14, printedOffset: 60 },
];

function anchorFor(layout: ChapterLayout, order: number): BookAnchor {
  const firstPage = 2 * order;
  const lastPage = Math.min(firstPage + 1, layout.pdfPageCount);
  const printedFirst = firstPage + layout.printedOffset;
  const printedLast = lastPage + layout.printedOffset;
  return {
    chapterId: layout.chapterId,
    firstPage,
    lastPage,
    printedPages:
      printedFirst === printedLast
        ? `${printedFirst}`
        : `${printedFirst}-${printedLast}`,
  };
}

/** unitId → (lesson order → anchor) */
const byUnit = new Map<string, Map<number, BookAnchor>>();
for (const layout of LAYOUTS) {
  const perOrder = new Map<number, BookAnchor>();
  for (let order = 1; order <= layout.lessonCount; order++) {
    perOrder.set(order, anchorFor(layout, order));
  }
  byUnit.set(layout.unitId, perOrder);
}

export function anchorForLesson(
  unitId: string,
  order: number,
): BookAnchor | undefined {
  // Kindergarten's pages do not follow a rule, so its anchors are listed.
  const kg = KG_ANCHORS[unitId]?.[order];
  if (kg) return kg;
  return byUnit.get(unitId)?.get(order);
}

export function chapterLayouts(): readonly ChapterLayout[] {
  return LAYOUTS;
}
