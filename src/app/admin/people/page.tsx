"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/chip";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { ROSTER } from "@/content/demo/classroom";
import { DEMO_USERS } from "@/content/demo/users";
import { useState } from "react";

interface PersonRow {
  uid: string;
  name: string;
  first: string;
  last: string;
  hue: number;
  role: string;
  detail: string;
  status: "active" | "invited";
}

const PEOPLE: PersonRow[] = [
  ...DEMO_USERS.filter((u) => u.role !== "zero1_admin").map((u) => ({
    uid: u.uid,
    name: `${u.firstName} ${u.lastName}`,
    first: u.firstName,
    last: u.lastName,
    hue: u.avatarHue,
    role: u.role === "school_admin" ? "School admin" : u.role === "teacher" ? "Teacher" : "Student",
    detail: u.title ?? (u.grade ? `Grade ${u.grade} — Section A` : ""),
    status: "active" as const,
  })),
  ...ROSTER.slice(1).map((s, i) => ({
    uid: s.uid,
    name: `${s.firstName} ${s.lastName}`,
    first: s.firstName,
    last: s.lastName,
    hue: s.avatarHue,
    role: "Student",
    detail: "Grade 6 — Section A",
    status: (i % 9 === 8 ? "invited" : "active") as "active" | "invited",
  })),
];

export default function PeoplePage() {
  const [tab, setTab] = useState("all");
  const rows = PEOPLE.filter((p) =>
    tab === "all" ? true : tab === "students" ? p.role === "Student" : p.role !== "Student",
  );

  const columns: Column<PersonRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (p) => (
        <span className="flex items-center gap-2.5">
          <Avatar firstName={p.first} lastName={p.last} hue={p.hue} size="sm" />
          <span className="font-medium text-ink-800">{p.name}</span>
        </span>
      ),
    },
    { key: "role", header: "Role", cell: (p) => <Chip tone={p.role === "Student" ? "neutral" : "brand"}>{p.role}</Chip> },
    { key: "detail", header: "Class / Title", cell: (p) => <span className="text-ink-600">{p.detail}</span> },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (p) => (
        <Chip tone={p.status === "active" ? "mint" : "amber"}>{p.status}</Chip>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="People"
        description="Everyone in the school's ZERO1 workspace. Data stays inside your school — tenant isolation is enforced at the database rule level."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All", count: PEOPLE.length },
          { id: "students", label: "Students", count: PEOPLE.filter((p) => p.role === "Student").length },
          { id: "staff", label: "Staff", count: PEOPLE.filter((p) => p.role !== "Student").length },
        ]}
      />
      <DataTable columns={columns} rows={rows} rowKey={(p) => p.uid} dense />
    </div>
  );
}
