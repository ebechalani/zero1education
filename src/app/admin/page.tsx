"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { BarChart } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Stat } from "@/components/ui/stat";
import { toast } from "@/components/ui/toast";
import { DEMO_SCHOOL } from "@/content/demo/users";
import { weeklyActivity } from "@/content/demo/classroom";
import {
  Download,
  GraduationCap,
  KeyRound,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

const GRADE_ENGAGEMENT = [
  { label: "KG–2 · Explorer", value: 71 },
  { label: "3–5 · Builder", value: 78 },
  { label: "6–8 · Creator", value: 84 },
  { label: "9–12 · Innovator", value: 62 },
];

export default function AdminOverview() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={DEMO_SCHOOL.name}
        description="School-wide view: engagement, curriculum usage and licensing at a glance."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Upload />}
              onClick={() =>
                toast("Import users", {
                  description:
                    "In production: CSV upload with column mapping and dry-run preview.",
                })
              }
            >
              Import users
            </Button>
            <Button
              icon={<Download />}
              onClick={() =>
                toast("Report queued", {
                  description: "School progress report will download as PDF/CSV in production.",
                  tone: "success",
                })
              }
            >
              Export report
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={786} icon={<Users />} hint="Across 32 classes" />
        <Stat label="Teachers" value={14} icon={<GraduationCap />} hint="8 ICT · 6 homeroom" />
        <Stat
          label="Seats used"
          value={`${DEMO_SCHOOL.seatsUsed}/${DEMO_SCHOOL.seats}`}
          tone="brand"
          icon={<KeyRound />}
          hint="Premium plan · renews Sep 2026"
        />
        <Stat label="Avg progress" value="67%" tone="mint" icon={<TrendingUp />} hint="Curriculum completion this term" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Engagement by learning world</CardTitle>
          <BarChart data={GRADE_ENGAGEMENT} threshold={65} />
          <p className="mt-3 text-xs text-ink-400">
            Engagement = weekly active students ÷ enrolled. Innovator grades dip
            during official-exam season — consistent with last year.
          </p>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardTitle>Weekly activity</CardTitle>
            <Sparkline values={weeklyActivity("school")} width={240} height={56} />
            <p className="mt-2 text-xs text-ink-400">
              Missions + labs completed school-wide, last 8 weeks.
            </p>
          </Card>
          <Card>
            <CardTitle>Curriculum in use</CardTitle>
            <ul className="space-y-2 text-sm text-ink-700">
              <li className="flex justify-between">
                <span>Interactive units live</span>
                <Chip tone="mint">1 · Grade 6</Chip>
              </li>
              <li className="flex justify-between">
                <span>Book units (2023 ed.)</span>
                <Chip tone="neutral">60+ across G0–12</Chip>
              </li>
              <li className="flex justify-between">
                <span>Next release</span>
                <Chip tone="signal">micro:bit · G6</Chip>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
