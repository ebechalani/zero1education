import { CATALOG } from "../src/content/curriculum/catalog";
import { ALL_LESSONS } from "../src/content/curriculum";

const grades = [...new Set(CATALOG.map((u) => u.gradeId))];
const out: Record<string, { title: string; ref?: string; lessons: number }[]> = {};
for (const g of grades) {
  out[g] = CATALOG.filter((u) => u.gradeId === g)
    .sort((a, b) => a.order - b.order)
    .map((u) => {
      const authored = ALL_LESSONS.filter((l) => l.unitId === u.id).length;
      return {
        title: u.title,
        ref: u.bookRef,
        lessons: authored || u.plannedLessons || u.lessonIds.length || 0,
      };
    });
}
console.log(JSON.stringify(out, null, 1));
