import { CATALOG } from "../src/content/curriculum/catalog";
import { ALL_LESSONS } from "../src/content/curriculum";
import { MONTHS, TOTAL_WEEKS } from "./repartition";

/**
 * The detailed scheme of work: one row per teaching period, carrying the
 * lesson's own objectives — the form a teacher actually submits.
 *
 * Lessons are laid out one per period in the book's order. Where a grade's
 * lessons have not been read in yet, the chapter is carried as a single block
 * so the document still shows the year, and says plainly that the detail is
 * pending.
 */

export interface PeriodRow {
  week: number;
  month: string;
  chapter: string;
  ref?: string;
  lesson?: string;
  pages?: string;
  objectives: string[];
}

/** Week number → month label, following the calendar. */
function weekMonths(): string[] {
  const out: string[] = [];
  for (const m of MONTHS) for (let i = 0; i < m.weeks; i++) out.push(m.label);
  return out;
}

export function detailForGrade(gradeId: string): {
  rows: PeriodRow[];
  detailed: boolean;
  lessonCount: number;
  overflow: number;
} {
  const units = CATALOG.filter((u) => u.gradeId === gradeId).sort((a, b) => a.order - b.order);
  const wm = weekMonths();
  const rows: PeriodRow[] = [];

  const lessons = units.flatMap((u) =>
    ALL_LESSONS.filter((l) => l.unitId === u.id)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ unit: u, lesson: l })),
  );

  if (lessons.length > 0) {
    lessons.forEach((entry, i) => {
      const a = entry.lesson.bookAnchor;
      rows.push({
        week: i + 1,
        month: wm[i] ?? "Extra",
        chapter: entry.unit.title,
        ref: entry.unit.bookRef,
        lesson: entry.lesson.title,
        pages: a?.printedPages ?? (a ? `${a.firstPage}-${a.lastPage}` : undefined),
        objectives: entry.lesson.objectives ?? [],
      });
    });
    return {
      rows,
      detailed: true,
      lessonCount: lessons.length,
      overflow: Math.max(0, lessons.length - TOTAL_WEEKS),
    };
  }

  // No lessons read yet — carry the chapters so the year still reads.
  let week = 1;
  const per = Math.max(1, Math.floor(TOTAL_WEEKS / Math.max(units.length, 1)));
  for (const u of units) {
    rows.push({
      week,
      month: wm[week - 1] ?? "Extra",
      chapter: u.title,
      ref: u.bookRef,
      objectives: [],
    });
    week += per;
  }
  return { rows, detailed: false, lessonCount: 0, overflow: 0 };
}

if (require.main === module) {
  const grades = [...new Set(CATALOG.map((u) => u.gradeId))];
  const out: Record<string, ReturnType<typeof detailForGrade>> = {};
  for (const g of grades) out[g] = detailForGrade(g);
  console.log(JSON.stringify({ months: MONTHS, totalWeeks: TOTAL_WEEKS, grades: out }, null, 1));
}
