/**
 * What is actually on the platform, per grade.
 *
 * The catalog lists unit ids and the lesson files export lessons; a lesson
 * named in a unit but never exported disappears silently, and so does a lesson
 * exported but never named. This counts what survives the join, which is what
 * a child can open.
 *
 *   npx tsx scripts/count-lessons.ts
 */

import { ALL_LESSONS, CATALOG, lessonsForUnit } from "../src/content/curriculum";
import { anchorForLesson } from "../src/content/page-anchors";

const byGrade = new Map<string, { units: number; lessons: number; anchored: number }>();
const orphans: string[] = [];
const empty: string[] = [];

for (const unit of CATALOG) {
  const lessons = lessonsForUnit(unit.id);
  const row = byGrade.get(unit.gradeId) ?? { units: 0, lessons: 0, anchored: 0 };
  row.units++;
  row.lessons += lessons.length;
  row.anchored += lessons.filter((l) => anchorForLesson(l.unitId, l.order)).length;
  byGrade.set(unit.gradeId, row);

  if (unit.lessonIds.length && !lessons.length) empty.push(unit.id);
  const found = new Set(lessons.map((l) => l.id));
  for (const id of unit.lessonIds) {
    if (!found.has(id)) orphans.push(`${unit.id} names ${id}, which no file exports`);
  }
}

const named = new Set(CATALOG.flatMap((u) => u.lessonIds));
for (const l of ALL_LESSONS) {
  if (!named.has(l.id)) orphans.push(`${l.id} is exported but no unit names it`);
}

console.log("  grade  units  lessons  anchored to the book");
let totalLessons = 0;
const num = (g: string) => Number(g.slice(1));
for (const grade of [...byGrade.keys()].sort((a, b) => num(a) - num(b))) {
  const r = byGrade.get(grade)!;
  totalLessons += r.lessons;
  const label = grade === "g0" ? "KG" : grade.toUpperCase();
  console.log(
    `  ${label.padEnd(6)} ${String(r.units).padStart(5)}  ${String(r.lessons).padStart(7)}  ${
      r.lessons ? String(r.anchored).padStart(4) : "   —"
    }`,
  );
}
console.log(`\n  ${totalLessons} lessons across ${CATALOG.length} units.`);

if (empty.length) {
  console.log(`\n  Units naming lessons that did not load: ${empty.join(", ")}`);
}
if (orphans.length) {
  console.error(`\n  ${orphans.length} mismatch(es):`);
  for (const o of orphans) console.error(`    x ${o}`);
  process.exit(1);
}
console.log("  Every named lesson loaded, and every loaded lesson is named.");
