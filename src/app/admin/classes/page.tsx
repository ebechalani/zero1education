"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Chip } from "@/components/ui/chip";
import { DataTable, type Column } from "@/components/ui/data-table";
import { worldForGrade } from "@/lib/worlds";

interface ClassRow {
  id: string;
  name: string;
  grade: number;
  students: number;
  teacher: string;
  progress: number;
}

const CLASS_ROWS: ClassRow[] = [
  { id: "c1", name: "KG — Butterflies", grade: 0, students: 18, teacher: "M. Aoun", progress: 74 },
  { id: "c2", name: "Grade 1 — A", grade: 1, students: 21, teacher: "L. Saad", progress: 68 },
  { id: "c3", name: "Grade 3 — B", grade: 3, students: 23, teacher: "P. Sassine", progress: 71 },
  { id: "c4", name: "Grade 5 — A", grade: 5, students: 24, teacher: "L. Saad", progress: 80 },
  { id: "c5", name: "Grade 6 — A", grade: 6, students: 24, teacher: "R. Khoury", progress: 64 },
  { id: "c6", name: "Grade 6 — B", grade: 6, students: 22, teacher: "R. Khoury", progress: 58 },
  { id: "c7", name: "Grade 7 — A", grade: 7, students: 26, teacher: "R. Khoury", progress: 31 },
  { id: "c8", name: "Grade 9 — A", grade: 9, students: 27, teacher: "J. Hayek", progress: 44 },
  { id: "c9", name: "Grade 11 — SE", grade: 11, students: 19, teacher: "J. Hayek", progress: 52 },
];

export default function AdminClassesPage() {
  const columns: Column<ClassRow>[] = [
    { key: "name", header: "Class", cell: (c) => <span className="font-medium text-ink-800">{c.name}</span> },
    {
      key: "world",
      header: "World",
      cell: (c) => {
        const w = worldForGrade(c.grade);
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: w.accentText }}>
            <span className="size-2 rounded-full" style={{ background: w.accent }} />
            {w.name.replace("ZERO1 ", "")}
          </span>
        );
      },
    },
    { key: "students", header: "Students", align: "center", cell: (c) => <span className="tnum font-mono">{c.students}</span> },
    { key: "teacher", header: "ICT teacher", cell: (c) => <span className="text-ink-600">{c.teacher}</span> },
    {
      key: "progress",
      header: "Unit progress",
      align: "right",
      cell: (c) => (
        <span className="flex items-center justify-end gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
            <span
              className="block h-full rounded-full bg-brand-500"
              style={{ width: `${c.progress}%` }}
            />
          </span>
          <Chip tone={c.progress < 40 ? "amber" : "neutral"}>{c.progress}%</Chip>
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Classes"
        description="All classes using ZERO1 this year, across every grade level."
      />
      <DataTable columns={columns} rows={CLASS_ROWS} rowKey={(c) => c.id} />
    </div>
  );
}
