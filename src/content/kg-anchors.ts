/**
 * Kindergarten page anchors, listed rather than derived.
 *
 * Grade 6 could use a rule — cover page, then a two-page spread per lesson.
 * KG cannot: Cartoon Drawing runs four pages a lesson, Paint and the rest run
 * two, and several chapters end on a single page. These were read off the
 * pages, so they are written out.
 */
export const KG_ANCHORS: Record<string, Record<number, {
  chapterId: string;
  firstPage: number;
  lastPage: number;
  printedPages?: string;
}>> = {
  "g0-knowing-computer": {
    1: { chapterId: "kg-ch1", firstPage: 2, lastPage: 3, printedPages: "4-5" },
    2: { chapterId: "kg-ch1", firstPage: 4, lastPage: 5, printedPages: "6-7" },
    3: { chapterId: "kg-ch1", firstPage: 6, lastPage: 7, printedPages: "8-9" },
    4: { chapterId: "kg-ch1", firstPage: 8, lastPage: 9, printedPages: "10-11" },
    5: { chapterId: "kg-ch1", firstPage: 10, lastPage: 11, printedPages: "12-13" },
    6: { chapterId: "kg-ch1", firstPage: 12, lastPage: 13, printedPages: "14-15" },
    7: { chapterId: "kg-ch1", firstPage: 14, lastPage: 14, printedPages: "16" },
  },
  "g0-cartoon-drawing": {
    1: { chapterId: "kg-ch2", firstPage: 2, lastPage: 5, printedPages: "20-23" },
    2: { chapterId: "kg-ch2", firstPage: 6, lastPage: 9, printedPages: "24-27" },
    3: { chapterId: "kg-ch2", firstPage: 10, lastPage: 13, printedPages: "28-31" },
    4: { chapterId: "kg-ch2", firstPage: 14, lastPage: 18, printedPages: "32-36" },
  },
  "g0-keyboard": {
    1: { chapterId: "kg-ch3", firstPage: 2, lastPage: 3, printedPages: "38-39" },
    2: { chapterId: "kg-ch3", firstPage: 4, lastPage: 5, printedPages: "40-41" },
    3: { chapterId: "kg-ch3", firstPage: 6, lastPage: 7, printedPages: "42-43" },
    4: { chapterId: "kg-ch3", firstPage: 8, lastPage: 9, printedPages: "44-45" },
    5: { chapterId: "kg-ch3", firstPage: 10, lastPage: 10, printedPages: "46" },
  },
  "g0-paint": {
    1: { chapterId: "kg-ch4", firstPage: 2, lastPage: 3, printedPages: "48-49" },
    2: { chapterId: "kg-ch4", firstPage: 4, lastPage: 5, printedPages: "50-51" },
    3: { chapterId: "kg-ch4", firstPage: 6, lastPage: 7, printedPages: "52-53" },
    4: { chapterId: "kg-ch4", firstPage: 8, lastPage: 9, printedPages: "54-55" },
    5: { chapterId: "kg-ch4", firstPage: 10, lastPage: 11, printedPages: "56-57" },
    6: { chapterId: "kg-ch4", firstPage: 12, lastPage: 13, printedPages: "58-59" },
    7: { chapterId: "kg-ch4", firstPage: 14, lastPage: 15, printedPages: "60-61" },
    8: { chapterId: "kg-ch4", firstPage: 16, lastPage: 16, printedPages: "62" },
  },
  "g0-algorithms": {
    1: { chapterId: "kg-ch5", firstPage: 2, lastPage: 3, printedPages: "64-65" },
    2: { chapterId: "kg-ch5", firstPage: 4, lastPage: 5, printedPages: "66-67" },
    3: { chapterId: "kg-ch5", firstPage: 6, lastPage: 7, printedPages: "68-69" },
    4: { chapterId: "kg-ch5", firstPage: 8, lastPage: 8, printedPages: "70" },
  },
  "g0-scratchjr": {
    1: { chapterId: "kg-ch6", firstPage: 2, lastPage: 3, printedPages: "72-73" },
    2: { chapterId: "kg-ch6", firstPage: 4, lastPage: 5, printedPages: "74-75" },
    3: { chapterId: "kg-ch6", firstPage: 6, lastPage: 7, printedPages: "76-77" },
    4: { chapterId: "kg-ch6", firstPage: 8, lastPage: 9, printedPages: "78-79" },
    5: { chapterId: "kg-ch6", firstPage: 10, lastPage: 10, printedPages: "80" },
  },
};
