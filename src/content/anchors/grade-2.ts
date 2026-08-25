/**
 * Grade 2 page anchors — listed, not derived.
 *
 * Read off the pages: chapters vary in how many pages a lesson takes, so a
 * formula would quietly point a child at the wrong spread.
 */
export const GRADE_2_ANCHORS: Record<string, Record<number, {
  chapterId: string;
  firstPage: number;
  lastPage: number;
  printedPages?: string;
}>> = {
  "g2-components": {
    1: { chapterId: "g2-ch1", firstPage: 2, lastPage: 3, printedPages: "4-5" },
    2: { chapterId: "g2-ch1", firstPage: 4, lastPage: 5, printedPages: "6-7" },
    3: { chapterId: "g2-ch1", firstPage: 6, lastPage: 7, printedPages: "8-9" },
    4: { chapterId: "g2-ch1", firstPage: 8, lastPage: 9, printedPages: "10-11" },
    5: { chapterId: "g2-ch1", firstPage: 10, lastPage: 10, printedPages: "12" },
  },
  "g2-algorithms": {
    1: { chapterId: "g2-ch3", firstPage: 2, lastPage: 3, printedPages: "26-27" },
    2: { chapterId: "g2-ch3", firstPage: 4, lastPage: 5, printedPages: "28-29" },
    3: { chapterId: "g2-ch3", firstPage: 6, lastPage: 7, printedPages: "30-31" },
    4: { chapterId: "g2-ch3", firstPage: 8, lastPage: 9, printedPages: "32-33" },
    5: { chapterId: "g2-ch3", firstPage: 10, lastPage: 11, printedPages: "34-35" },
    6: { chapterId: "g2-ch3", firstPage: 12, lastPage: 13, printedPages: "36-37" },
    7: { chapterId: "g2-ch3", firstPage: 14, lastPage: 15, printedPages: "38-39" },
    8: { chapterId: "g2-ch3", firstPage: 16, lastPage: 17, printedPages: "40-41" },
    9: { chapterId: "g2-ch3", firstPage: 18, lastPage: 18, printedPages: "42" },
  },
  "g2-scratchjr": {
    1: { chapterId: "g2-ch4", firstPage: 2, lastPage: 3, printedPages: "44-45" },
    2: { chapterId: "g2-ch4", firstPage: 4, lastPage: 5, printedPages: "46-47" },
    3: { chapterId: "g2-ch4", firstPage: 6, lastPage: 7, printedPages: "48-49" },
    4: { chapterId: "g2-ch4", firstPage: 8, lastPage: 9, printedPages: "50-51" },
    5: { chapterId: "g2-ch4", firstPage: 10, lastPage: 11, printedPages: "52-53" },
    6: { chapterId: "g2-ch4", firstPage: 12, lastPage: 13, printedPages: "54-55" },
    7: { chapterId: "g2-ch4", firstPage: 14, lastPage: 15, printedPages: "56-57" },
    8: { chapterId: "g2-ch4", firstPage: 16, lastPage: 17, printedPages: "58-59" },
    9: { chapterId: "g2-ch4", firstPage: 18, lastPage: 19, printedPages: "60-61" },
    10: { chapterId: "g2-ch4", firstPage: 20, lastPage: 20, printedPages: "62" },
  },
  "g2-robotics": {
    1: { chapterId: "g2-ch5", firstPage: 2, lastPage: 3, printedPages: "64-65" },
    2: { chapterId: "g2-ch5", firstPage: 4, lastPage: 5, printedPages: "66-67" },
    3: { chapterId: "g2-ch5", firstPage: 6, lastPage: 7, printedPages: "68-69" },
    4: { chapterId: "g2-ch5", firstPage: 8, lastPage: 9, printedPages: "70-71" },
    5: { chapterId: "g2-ch5", firstPage: 10, lastPage: 11, printedPages: "72-73" },
    6: { chapterId: "g2-ch5", firstPage: 12, lastPage: 13, printedPages: "74-75" },
    7: { chapterId: "g2-ch5", firstPage: 14, lastPage: 15, printedPages: "76-77" },
    8: { chapterId: "g2-ch5", firstPage: 16, lastPage: 17, printedPages: "78-79" },
    9: { chapterId: "g2-ch5", firstPage: 18, lastPage: 18, printedPages: "80" },
  },
};
