"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { BarChart } from "@/components/charts/bar-chart";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { DemoChip } from "@/components/brand/demo-chip";
import {
  CLASS_TOPICS,
  ROSTER,
  studentLessonStatus,
  studentTopicMastery,
  type RosterStudent,
} from "@/content/demo/classroom";
import { MonitorPlay, Radio } from "lucide-react";
import { useState } from "react";

const STATUS_CHIP = {
  completed: { label: "Completed", tone: "mint" as const },
  working: { label: "Working", tone: "signal" as const },
  "needs-help": { label: "Needs help", tone: "coral" as const },
  "not-started": { label: "Not started", tone: "neutral" as const },
};

export default function ClassDetailPage() {
  const [selected, setSelected] = useState<RosterStudent | null>(null);

  const avgFor = (s: RosterStudent) =>
    Math.round(
      CLASS_TOPICS.reduce((acc, t) => acc + studentTopicMastery(s, t.id), 0) /
        CLASS_TOPICS.length,
    );

  const columns: Column<RosterStudent>[] = [
    {
      key: "student",
      header: "Student",
      cell: (s) => (
        <span className="flex items-center gap-2.5">
          <Avatar firstName={s.firstName} lastName={s.lastName} hue={s.avatarHue} size="sm" />
          <span className="font-medium text-ink-800">
            {s.firstName} {s.lastName}
          </span>
        </span>
      ),
    },
    {
      key: "mastery",
      header: "Avg mastery",
      align: "center",
      cell: (s) => {
        const avg = avgFor(s);
        return (
          <span
            className={
              "tnum font-mono text-sm font-bold " +
              (avg < 50 ? "text-coral-600" : avg < 70 ? "text-amber-700" : "text-mint-600")
            }
          >
            {avg}%
          </span>
        );
      },
    },
    ...CLASS_TOPICS.slice(0, 4).map(
      (t, i): Column<RosterStudent> => ({
        key: t.id,
        header: t.label.split(" ")[0],
        align: "center",
        className: "hidden md:table-cell",
        cell: (s) => {
          const st = STATUS_CHIP[studentLessonStatus(s, i)];
          return <Chip tone={st.tone}>{st.label}</Chip>;
        },
      }),
    ),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Grade 6 — Section A"
        description="24 students · Unit: Inside the Digital World"
        eyebrow={<DemoChip />}
        actions={
          <>
            <Button href="/teacher/teach/g6-mb-06" variant="secondary" icon={<MonitorPlay />}>
              Teach Mode
            </Button>
            <Button href="/teacher/launch/g6-mb-06" icon={<Radio />}>
              Launch activity
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={[...ROSTER].sort((a, b) => avgFor(a) - avgFor(b))}
        rowKey={(s) => s.uid}
        onRowClick={setSelected}
        dense
      />
      <p className="mt-2 text-xs text-ink-400">
        Sorted by mastery — students needing support first. Click a row for the
        full competency picture.
      </p>

      {/* Student drill-down */}
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ""}
      >
        {selected && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                firstName={selected.firstName}
                lastName={selected.lastName}
                hue={selected.avatarHue}
                size="lg"
              />
              <div>
                <p className="text-sm text-ink-500">Grade 6 — Section A</p>
                <p className="tnum font-mono text-lg font-bold text-ink-900">
                  {avgFor(selected)}% average mastery
                </p>
              </div>
            </div>
            <BarChart
              data={CLASS_TOPICS.map((t) => ({
                label: t.label,
                value: studentTopicMastery(selected, t.id),
              }))}
              threshold={50}
            />
            <div className="mt-4 rounded-lg bg-ink-50 p-3.5 text-[13px] leading-relaxed text-ink-600">
              {avgFor(selected) < 55 ? (
                <>
                  <span className="font-semibold text-ink-800">Suggested support: </span>
                  pair {selected.firstName} with a strong peer for the next lab, and
                  assign the review activities for their weakest topic above.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink-800">On track. </span>
                  {selected.firstName} is progressing well — consider the stretch
                  challenge in the next mission.
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
