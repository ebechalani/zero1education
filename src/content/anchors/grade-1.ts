/**
 * Grade 1 page anchors — listed, not derived.
 *
 * Read off the pages: chapters vary in how many pages a lesson takes, so a
 * formula would quietly point a child at the wrong spread.
 */
export const GRADE_1_ANCHORS: Record<string, Record<number, {
  chapterId: string;
  firstPage: number;
  lastPage: number;
  printedPages?: string;
}>> = {
  "g1-intro-computers": {
    1: { chapterId: "g1-ch1", firstPage: 2, lastPage: 3, printedPages: "4-5" },
    2: { chapterId: "g1-ch1", firstPage: 4, lastPage: 5, printedPages: "6-7" },
    3: { chapterId: "g1-ch1", firstPage: 6, lastPage: 7, printedPages: "8-9" },
    4: { chapterId: "g1-ch1", firstPage: 8, lastPage: 9, printedPages: "10-11" },
    5: { chapterId: "g1-ch1", firstPage: 10, lastPage: 11, printedPages: "12-13" },
    6: { chapterId: "g1-ch1", firstPage: 12, lastPage: 13, printedPages: "14-15" },
    7: { chapterId: "g1-ch1", firstPage: 14, lastPage: 15, printedPages: "16-17" },
    8: { chapterId: "g1-ch1", firstPage: 16, lastPage: 16, printedPages: "18" },
  },
  "g1-paint": {
    1: { chapterId: "g1-ch2", firstPage: 2, lastPage: 3, printedPages: "20-21" },
    2: { chapterId: "g1-ch2", firstPage: 4, lastPage: 5, printedPages: "22-23" },
    3: { chapterId: "g1-ch2", firstPage: 6, lastPage: 7, printedPages: "24-25" },
    4: { chapterId: "g1-ch2", firstPage: 8, lastPage: 9, printedPages: "26-27" },
    5: { chapterId: "g1-ch2", firstPage: 10, lastPage: 11, printedPages: "28-29" },
    6: { chapterId: "g1-ch2", firstPage: 12, lastPage: 12, printedPages: "30" },
  },
  "g1-algorithms": {
    1: { chapterId: "g1-ch4", firstPage: 2, lastPage: 3, printedPages: "48-49" },
    2: { chapterId: "g1-ch4", firstPage: 4, lastPage: 5, printedPages: "50-51" },
    3: { chapterId: "g1-ch4", firstPage: 6, lastPage: 7, printedPages: "52-53" },
    4: { chapterId: "g1-ch4", firstPage: 8, lastPage: 9, printedPages: "54-55" },
    5: { chapterId: "g1-ch4", firstPage: 10, lastPage: 11, printedPages: "56-57" },
    6: { chapterId: "g1-ch4", firstPage: 12, lastPage: 13, printedPages: "58-59" },
    7: { chapterId: "g1-ch4", firstPage: 14, lastPage: 15, printedPages: "60-61" },
    8: { chapterId: "g1-ch4", firstPage: 16, lastPage: 17, printedPages: "62-63" },
    9: { chapterId: "g1-ch4", firstPage: 18, lastPage: 19, printedPages: "64-65" },
    10: { chapterId: "g1-ch4", firstPage: 20, lastPage: 21, printedPages: "66-67" },
    11: { chapterId: "g1-ch4", firstPage: 22, lastPage: 22, printedPages: "68" },
  },
  "g1-scratchjr": {
    1: { chapterId: "g1-ch5", firstPage: 2, lastPage: 3, printedPages: "70-71" },
    2: { chapterId: "g1-ch5", firstPage: 4, lastPage: 5, printedPages: "72-73" },
    3: { chapterId: "g1-ch5", firstPage: 6, lastPage: 7, printedPages: "74-75" },
    4: { chapterId: "g1-ch5", firstPage: 8, lastPage: 9, printedPages: "76-77" },
    5: { chapterId: "g1-ch5", firstPage: 10, lastPage: 11, printedPages: "78-79" },
    6: { chapterId: "g1-ch5", firstPage: 12, lastPage: 12, printedPages: "80" },
  },
};
