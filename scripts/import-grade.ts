import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

/**
 * Turns a chapter reading into real curriculum files.
 *
 *   npm run import:grade -- imports/grade-1.json
 *
 * The reading agents return one JSON document per grade describing what is
 * actually printed: lesson titles, objectives and the pages each lesson
 * occupies. This writes that out as
 *
 *   src/content/curriculum/grade-N/lessons.ts   — the Lesson objects
 *   src/content/anchors/grade-N.ts              — page anchors, listed
 *
 * and prints the lessonIds to paste into the catalog.
 *
 * Anchors are listed rather than derived on purpose. Grade 6 happens to follow
 * a rule — cover page, then a spread per lesson — but Kindergarten does not,
 * and a formula that is quietly wrong points a child at someone else's page.
 */

interface ReadLesson {
  order: number;
  title: string;
  description?: string;
  objectives?: string[];
  firstPage: number;
  lastPage: number;
  printedPages?: string;
  confidence?: string;
}

interface ReadChapter {
  chapterId: string;
  unitId: string;
  chapterSummary?: string;
  lessons: ReadLesson[];
  instrument?: { verdict?: string; reuse?: string; sketch?: string };
}

const SKILLS: Record<string, string[]> = {
  scratchjr: ["prog-blocks", "algo-sequence"],
  scratch: ["prog-blocks", "algo-iteration"],
  paint: ["cr-projects", "dl-files"],
  cartoon: ["cr-projects"],
  algorithms: ["algo-sequence", "ct-patterns"],
  computers: ["sys-hardware", "dl-files"],
  components: ["sys-hardware"],
  robotics: ["rob-build", "prog-blocks"],
  microbit: ["pc-microbit", "prog-blocks"],
  makecode: ["pc-microbit", "prog-blocks"],
  word: ["dl-files"],
  powerpoint: ["dl-files", "cr-projects"],
  excel: ["data-analysis"],
  python: ["prog-python"],
  html: ["web-html"],
  php: ["web-html"],
  mysql: ["data-analysis"],
  access: ["data-analysis"],
  arduino: ["pc-microbit"],
  photoshop: ["cr-projects"],
  keyboard: ["dl-files", "ct-patterns"],
};

const ICONS: Record<string, string> = {
  scratchjr: "Cat", scratch: "Blocks", paint: "Brush", cartoon: "Palette",
  algorithms: "Footprints", computers: "Monitor", components: "Cpu",
  robotics: "Bot", microbit: "CircuitBoard", makecode: "CircuitBoard",
  word: "FileText", powerpoint: "Presentation", excel: "Table",
  python: "Terminal", html: "Code2", php: "Globe", mysql: "Database",
  access: "Database", arduino: "CircuitBoard", photoshop: "Image",
  keyboard: "Keyboard",
};

/** Pick skills/icon from whatever the unit slug contains. */
function traits(unitId: string): { skills: string[]; icon: string } {
  const slug = unitId.replace(/^g\d+-/, "");
  for (const key of Object.keys(SKILLS)) {
    if (slug.includes(key)) return { skills: SKILLS[key], icon: ICONS[key] };
  }
  return { skills: ["dl-files"], icon: "BookOpen" };
}

const esc = (s: string) =>
  '"' + (s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\s+/g, " ").trim() + '"';

const slugify = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "lesson";

const camel = (s: string) =>
  s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("\n  Usage: npm run import:grade -- imports/grade-1.json\n");
    process.exit(1);
  }
  const chapters: ReadChapter[] = JSON.parse(
    readFileSync(resolve(process.cwd(), input), "utf8"),
  ).chapters ?? JSON.parse(readFileSync(resolve(process.cwd(), input), "utf8"));

  const gradeNum = chapters[0].unitId.match(/^g(\d+)-/)?.[1];
  if (!gradeNum) throw new Error("Cannot read grade number from unitId");

  const out: string[] = [
    'import type { Lesson } from "@/types/content";',
    "",
    "/**",
    ` * Grade ${gradeNum} — the printed 2023 edition, chapter by chapter.`,
    " *",
    " * Titles, descriptions and objectives are read off the pages. Where the book",
    " * prints no lesson title of its own, the title is its first stated objective",
    " * or a heading printed on the page — never invented.",
    " */",
    "",
  ];
  const anchorRows: string[] = [];
  const catalogHints: string[] = [];

  for (const ch of chapters) {
    const { skills, icon } = traits(ch.unitId);
    const short = ch.unitId.replace(/^g\d+-/, "");
    const exportName = camel(short) + "Lessons";
    const prefix = short.slice(0, 2);

    out.push("// " + "-".repeat(72));
    out.push(`// ${ch.chapterId} — ${exportName}`);
    out.push("// " + "-".repeat(72), "");
    if (ch.chapterSummary) {
      out.push(`export const ${camel(short)}ChapterSummary: string =`);
      out.push("  " + esc(ch.chapterSummary) + ";", "");
    }
    out.push(`export const ${exportName}: Lesson[] = [`);

    const ids: string[] = [];
    for (const l of ch.lessons) {
      const id = `g${gradeNum}-${prefix}-${String(l.order).padStart(2, "0")}`;
      ids.push(`"${id}"`);
      out.push("  {");
      out.push(`    id: "${id}",`);
      out.push(`    slug: "${slugify(l.title)}",`);
      out.push(`    gradeId: "g${gradeNum}",`);
      out.push(`    unitId: "${ch.unitId}",`);
      out.push(`    order: ${l.order},`);
      out.push(`    title: ${esc(l.title)},`);
      out.push(`    description: ${esc(l.description ?? l.title)},`);
      const objs = (l.objectives ?? []).filter((o) => o && o.length < 400).slice(0, 6);
      if (objs.length) {
        out.push("    objectives: [");
        for (const o of objs) out.push(`      ${esc(o)},`);
        out.push("    ],");
      } else {
        out.push("    objectives: [],");
      }
      out.push(`    skillIds: [${skills.map((s) => `"${s}"`).join(", ")}],`);
      out.push(`    estimatedMinutes: ${Number(gradeNum) <= 2 ? 30 : 40},`);
      out.push(`    difficulty: "${Number(gradeNum) <= 5 ? "intro" : "core"}",`);
      out.push(`    icon: "${icon}",`);
      out.push(`    status: "coming-soon",`);
      out.push("    stages: [],");
      out.push("  },");

      const printed = l.printedPages ? `, printedPages: "${l.printedPages}"` : "";
      anchorRows.push(
        `    ${l.order}: { chapterId: "${ch.chapterId}", firstPage: ${l.firstPage}, lastPage: ${l.lastPage}${printed} },`,
      );
      if (l.order === ch.lessons[ch.lessons.length - 1].order) {
        anchorRows.push("  },");
      }
      if (l.order === ch.lessons[0].order) {
        anchorRows.splice(anchorRows.length - 1, 0);
      }
    }
    out.push("];", "");
    catalogHints.push(`  ${ch.unitId}: lessonIds: [${ids.join(", ")}]`);
  }

  // Anchors, grouped per unit
  const anchors: string[] = [
    "/**",
    ` * Grade ${gradeNum} page anchors — listed, not derived.`,
    " *",
    " * Read off the pages: chapters vary in how many pages a lesson takes, so a",
    " * formula would quietly point a child at the wrong spread.",
    " */",
    `export const GRADE_${gradeNum}_ANCHORS: Record<string, Record<number, {`,
    "  chapterId: string;",
    "  firstPage: number;",
    "  lastPage: number;",
    "  printedPages?: string;",
    "}>> = {",
  ];
  for (const ch of chapters) {
    anchors.push(`  "${ch.unitId}": {`);
    for (const l of ch.lessons) {
      const printed = l.printedPages ? `, printedPages: "${l.printedPages}"` : "";
      anchors.push(
        `    ${l.order}: { chapterId: "${ch.chapterId}", firstPage: ${l.firstPage}, lastPage: ${l.lastPage}${printed} },`,
      );
    }
    anchors.push("  },");
  }
  anchors.push("};", "");

  const lessonsPath = resolve(
    process.cwd(),
    `src/content/curriculum/grade-${gradeNum}/lessons.ts`,
  );
  const anchorsPath = resolve(process.cwd(), `src/content/anchors/grade-${gradeNum}.ts`);
  for (const p of [lessonsPath, anchorsPath]) mkdirSync(dirname(p), { recursive: true });
  writeFileSync(lessonsPath, out.join("\n"), "utf8");
  writeFileSync(anchorsPath, anchors.join("\n"), "utf8");

  const total = chapters.reduce((n, c) => n + c.lessons.length, 0);
  console.log(`\n  Grade ${gradeNum}: ${chapters.length} chapters, ${total} lessons\n`);
  console.log(`    wrote ${lessonsPath.replace(process.cwd(), ".")}`);
  console.log(`    wrote ${anchorsPath.replace(process.cwd(), ".")}\n`);
  console.log("  Catalog lessonIds:");
  for (const h of catalogHints) console.log(h);

  const flagged = chapters.flatMap((c) =>
    c.lessons.filter((l) => l.confidence && l.confidence !== "high")
      .map((l) => `    ${c.chapterId} lesson ${l.order} (${l.confidence}): ${l.title}`),
  );
  if (flagged.length) {
    console.log("\n  Read with less than full confidence — worth checking against the book:");
    for (const f of flagged) console.log(f);
  }

  const news = chapters.filter((c) => c.instrument?.verdict === "new");
  if (news.length) {
    console.log("\n  Chapters asking for a new instrument:");
    for (const c of news) console.log(`    ${c.chapterId}: ${c.instrument?.sketch?.slice(0, 120)}`);
  }
  console.log("");
}

main();
