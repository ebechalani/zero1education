import { CATALOG } from "../src/content/curriculum/catalog";
import { ALL_LESSONS } from "../src/content/curriculum";

/**
 * Annual scheme of work — spreads each grade's chapters across the teaching
 * weeks of one school year.
 *
 * Assumes one ICT period per week, which is what the timetable gives most
 * grades. Where a grade's lesson count is not yet known (its chapters have not
 * been read into the platform), chapters are split by their share of the
 * printed pages instead, and flagged.
 */

/** Teaching weeks per month, Sept 2026 → June 2027, holidays already removed. */
export const MONTHS = [
  { key: "sep", label: "September", weeks: 3, note: "Term starts mid-month" },
  { key: "oct", label: "October", weeks: 4 },
  { key: "nov", label: "November", weeks: 4 },
  { key: "dec", label: "December", weeks: 3, note: "Christmas break from ~19 Dec" },
  { key: "jan", label: "January", weeks: 3, note: "Return ~5 Jan" },
  { key: "feb", label: "February", weeks: 3, note: "Mid-year exams" },
  { key: "mar", label: "March", weeks: 4 },
  { key: "apr", label: "April", weeks: 3, note: "Easter break" },
  { key: "may", label: "May", weeks: 4 },
  { key: "jun", label: "June", weeks: 2, note: "Final exams, year ends" },
] as const;

export const TOTAL_WEEKS = MONTHS.reduce((n, m) => n + m.weeks, 0);

export interface Slot {
  month: string;
  weeks: number;
  chapter: string;
  ref?: string;
  lessons: number;
  estimated: boolean;
}

export function planForGrade(gradeId: string): {
  slots: Slot[];
  totalLessons: number;
  estimated: boolean;
} {
  const units = CATALOG.filter((u) => u.gradeId === gradeId).sort(
    (a, b) => a.order - b.order,
  );
  const counts = units.map((u) => {
    const authored = ALL_LESSONS.filter((l) => l.unitId === u.id).length;
    return authored || u.plannedLessons || u.lessonIds.length || 0;
  });
  const known = counts.every((c) => c > 0);
  // Unknown chapters share the year equally — honest, and easy to correct later.
  const weights = known ? counts : units.map(() => 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Give each chapter its share of the teaching weeks, never less than one.
  const raw = weights.map((w) => (w / totalWeight) * TOTAL_WEEKS);
  const alloc = raw.map((r) => Math.max(1, Math.round(r)));
  // Trim or pad so the total matches the year exactly.
  let diff = alloc.reduce((a, b) => a + b, 0) - TOTAL_WEEKS;
  while (diff !== 0) {
    const i = diff > 0
      ? alloc.indexOf(Math.max(...alloc))
      : alloc.indexOf(Math.min(...alloc));
    alloc[i] += diff > 0 ? -1 : 1;
    diff = alloc.reduce((a, b) => a + b, 0) - TOTAL_WEEKS;
  }

  // Walk the calendar handing weeks out in order.
  const slots: Slot[] = [];
  let unit = 0;
  let left = alloc[0];
  for (const m of MONTHS) {
    let weeksLeft = m.weeks;
    while (weeksLeft > 0 && unit < units.length) {
      const take = Math.min(weeksLeft, left);
      const existing = slots.find(
        (s) => s.month === m.label && s.chapter === units[unit].title,
      );
      if (existing) existing.weeks += take;
      else
        slots.push({
          month: m.label,
          weeks: take,
          chapter: units[unit].title,
          ref: units[unit].bookRef,
          lessons: counts[unit],
          estimated: !known,
        });
      weeksLeft -= take;
      left -= take;
      if (left === 0) {
        unit++;
        left = alloc[unit] ?? 0;
      }
    }
  }
  return {
    slots,
    totalLessons: counts.reduce((a, b) => a + b, 0),
    estimated: !known,
  };
}

if (require.main === module) {
  const grades = [...new Set(CATALOG.map((u) => u.gradeId))];
  const out: Record<string, ReturnType<typeof planForGrade>> = {};
  for (const g of grades) out[g] = planForGrade(g);
  console.log(JSON.stringify({ months: MONTHS, totalWeeks: TOTAL_WEEKS, grades: out }, null, 1));
}
