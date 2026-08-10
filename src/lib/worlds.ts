import type { GradeId, GradeInfo, World } from "@/types/content";

export interface WorldInfo {
  id: World;
  name: string;
  grades: string;
  gradeNumbers: number[];
  tagline: string;
  /** CSS custom property values (hex) — applied by WorldTheme */
  accent: string;
  accentSoft: string;
  accentText: string;
}

export const WORLDS: Record<World, WorldInfo> = {
  explorer: {
    id: "explorer",
    name: "ZERO1 Explorer",
    grades: "Grades 0–2",
    gradeNumbers: [0, 1, 2],
    tagline: "Discover the digital world through play",
    accent: "#F0592A",
    accentSoft: "#FEEFE8",
    accentText: "#B23C17",
  },
  builder: {
    id: "builder",
    name: "ZERO1 Builder",
    grades: "Grades 3–5",
    gradeNumbers: [3, 4, 5],
    tagline: "Think in steps, build with logic",
    accent: "#0E9F6E",
    accentSoft: "#E6F7F0",
    accentText: "#046C4E",
  },
  creator: {
    id: "creator",
    name: "ZERO1 Creator",
    grades: "Grades 6–8",
    gradeNumbers: [6, 7, 8],
    tagline: "Code, connect and create real things",
    accent: "#0BA5C4",
    accentSoft: "#E5F8FC",
    accentText: "#077086",
  },
  innovator: {
    id: "innovator",
    name: "ZERO1 Innovator",
    grades: "Grades 9–12",
    gradeNumbers: [9, 10, 11, 12],
    tagline: "Engineer the future with professional tools",
    accent: "#7C5CFC",
    accentSoft: "#F0EDFE",
    accentText: "#5638C8",
  },
};

export function worldForGrade(grade: number): WorldInfo {
  if (grade <= 2) return WORLDS.explorer;
  if (grade <= 5) return WORLDS.builder;
  if (grade <= 8) return WORLDS.creator;
  return WORLDS.innovator;
}

export const GRADES: GradeInfo[] = Array.from({ length: 13 }, (_, n) => ({
  id: `g${n}` as GradeId,
  number: n,
  label: n === 0 ? "KG" : `Grade ${n}`,
  world: worldForGrade(n).id,
}));

export function gradeInfo(id: GradeId): GradeInfo {
  const g = GRADES.find((g) => g.id === id);
  if (!g) throw new Error(`Unknown grade ${id}`);
  return g;
}
