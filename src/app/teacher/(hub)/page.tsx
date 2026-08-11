"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { BarChart } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Stat } from "@/components/ui/stat";
import {
  CLASS_TOPICS,
  ROSTER,
  classTopicAverage,
  strugglingStudents,
  weeklyActivity,
} from "@/content/demo/classroom";
import { useSession } from "@/stores/session-store";
import {
  AlertTriangle,
  ArrowRight,
  MonitorPlay,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user } = useSession();

  const topicData = CLASS_TOPICS.map((t) => ({
    label: t.label,
    value: classTopicAverage(t.id),
  }));
  const cyberStruggling = strugglingStudents("cyber");
  const netStruggling = strugglingStudents("networks");
  const activity = weeklyActivity("class-6a");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "teacher"}`}
        description="Grade 6 — Section A · Inside the Digital World · Week 8"
        actions={
          <>
            <Button
              href="/teacher/teach/g6-mb-08"
              variant="secondary"
              icon={<MonitorPlay />}
            >
              Teach Mode
            </Button>
            <Button href="/teacher/launch/g6-mb-06" icon={<Radio />}>
              Launch to Class
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={ROSTER.length} icon={<Users />} hint="Grade 6 — Section A" />
        <Stat
          label="Class mastery"
          value={`${Math.round(topicData.reduce((a, d) => a + d.value, 0) / topicData.length)}%`}
          tone="brand"
          icon={<TrendingUp />}
          hint="Across 5 mission topics"
        />
        <Stat
          label="Need support"
          value={cyberStruggling.length}
          tone="coral"
          icon={<AlertTriangle />}
          hint="Below 50% in Cybersecurity"
        />
        <Stat
          label="Missions live"
          value="4/5"
          tone="signal"
          hint="Cybersecurity starts Monday"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Class understanding */}
        <Card className="lg:col-span-2">
          <CardTitle
            action={
              <Link
                href="/teacher/analytics"
                className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Full analytics <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            Class understanding — Inside the Digital World
          </CardTitle>
          <BarChart data={topicData} threshold={60} />
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-ink-50 px-4 py-3">
            <span className="text-ink-400">
              <TrendingUp className="size-4" />
            </span>
            <p className="text-[13px] text-ink-600">
              Weekly activity across the class
            </p>
            <span className="ml-auto">
              <Sparkline values={activity} width={140} height={36} />
            </span>
          </div>
        </Card>

        {/* Insights */}
        <Card padded={false}>
          <div className="border-b border-ink-100 px-5 py-3.5">
            <h3 className="font-display text-[15px] font-semibold text-ink-900">
              Needs your attention
            </h3>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-lg border border-amber-500/25 bg-amber-100/50 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-700">
                <AlertTriangle className="size-4" />
                {cyberStruggling.length} students struggled with identifying
                phishing URLs
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                Most misses were look-alike domains (paypa1 / arnazon).
              </p>
              <p className="mt-2 text-xs font-semibold text-ink-700">
                Suggested action: replay the URL X-Ray challenge in Teach Mode
                before starting Lesson 5.
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-amber-100/50 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-700">
                <AlertTriangle className="size-4" />
                {netStruggling.length} students need support with network devices
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                Router vs switch confusion shows up across checkpoint question 1.
              </p>
              <p className="mt-2 text-xs font-semibold text-ink-700">
                Suggested action: review Lesson 4&apos;s device accordion, then relaunch
                the checkpoint.
              </p>
            </div>
            <Button
              href="/teacher/analytics"
              variant="secondary"
              size="sm"
              className="w-full"
            >
              See who needs help
            </Button>
          </div>
        </Card>
      </div>

      {/* Classes strip */}
      <h3 className="font-display mt-7 mb-3 text-lg font-bold text-ink-900">
        My classes
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { id: "cls-6a", name: "Grade 6 — Section A", students: 24, unit: "Inside the Digital World", pct: 64 },
          { id: "cls-6b", name: "Grade 6 — Section B", students: 22, unit: "Inside the Digital World", pct: 58 },
          { id: "cls-7a", name: "Grade 7 — Section A", students: 26, unit: "HTML", pct: 31 },
        ].map((c) => (
          <Link
            key={c.id}
            href={c.id === "cls-6a" ? "/teacher/classes/cls-6a" : "/teacher/classes"}
            className="rounded-xl border border-ink-100 bg-white p-4 shadow-card transition-all hover:border-brand-300 hover:shadow-pop"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-bold text-ink-900">{c.name}</p>
              <Chip tone="neutral">{c.students}</Chip>
            </div>
            <p className="mt-1 text-xs text-ink-400">Current unit: {c.unit}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${c.pct}%` }}
              />
            </div>
            <p className="tnum mt-1 font-mono text-xs text-ink-400">{c.pct}% through unit</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
