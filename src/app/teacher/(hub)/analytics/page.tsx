"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { BarChart } from "@/components/charts/bar-chart";
import { Heatmap } from "@/components/charts/heatmap";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { DemoChip } from "@/components/brand/demo-chip";
import {
  CLASS_TOPICS,
  ROSTER,
  classTopicAverage,
  questionCorrectRate,
  strugglingStudents,
  studentTopicMastery,
} from "@/content/demo/classroom";
import { FEATURED_LESSONS } from "@/content/curriculum";
import { AlertTriangle, Award, TrendingDown } from "lucide-react";

export default function AnalyticsPage() {
  const topicData = CLASS_TOPICS.map((t) => ({
    label: t.label,
    value: classTopicAverage(t.id),
  }));

  // Question analysis: checkpoint questions of each lesson with seeded rates
  const questionRows = FEATURED_LESSONS.flatMap((lesson, li) => {
    const topic = CLASS_TOPICS[li];
    return lesson.stages
      .filter((s) => s.kind === "checkpoint")
      .flatMap((s) =>
        s.blocks.flatMap((b) =>
          b.type === "quiz"
            ? b.questions.map((q) => ({
                id: q.id,
                prompt: q.prompt.split("\n")[0],
                lesson: lesson.title,
                rate: questionCorrectRate(q.id, topic.id),
              }))
            : [],
        ),
      );
  })
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 6);

  const heatValues = ROSTER.map((s) =>
    CLASS_TOPICS.map((t) => studentTopicMastery(s, t.id)),
  );

  const topPerformers = [...ROSTER]
    .sort(
      (a, b) =>
        CLASS_TOPICS.reduce((acc, t) => acc + studentTopicMastery(b, t.id), 0) -
        CLASS_TOPICS.reduce((acc, t) => acc + studentTopicMastery(a, t.id), 0),
    )
    .slice(0, 3);
  const struggling = strugglingStudents("cyber").slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Class Analytics"
        description="Understanding, not just grades — mastery by topic, question-level diagnosis, and who needs you next."
        eyebrow={<DemoChip />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Topic mastery */}
        <Card className="lg:col-span-2">
          <CardTitle>Class understanding by topic</CardTitle>
          <BarChart data={topicData} threshold={60} />
        </Card>

        {/* Highlights */}
        <div className="space-y-5">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-1.5">
                <Award className="size-4 text-bit-500" /> High performers
              </span>
            </CardTitle>
            <ul className="space-y-2">
              {topPerformers.map((s) => (
                <li key={s.uid} className="flex items-center gap-2.5">
                  <Avatar firstName={s.firstName} lastName={s.lastName} hue={s.avatarHue} size="sm" />
                  <span className="flex-1 text-sm font-medium text-ink-800">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="tnum font-mono text-sm font-bold text-mint-600">
                    {Math.round(
                      CLASS_TOPICS.reduce((acc, t) => acc + studentTopicMastery(s, t.id), 0) /
                        CLASS_TOPICS.length,
                    )}
                    %
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-500" /> Cyber — needs support
              </span>
            </CardTitle>
            <ul className="space-y-2">
              {struggling.map((s) => (
                <li key={s.uid} className="flex items-center gap-2.5">
                  <Avatar firstName={s.firstName} lastName={s.lastName} hue={s.avatarHue} size="sm" />
                  <span className="flex-1 text-sm font-medium text-ink-800">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="tnum font-mono text-sm font-bold text-coral-600">
                    {studentTopicMastery(s, "cyber")}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 text-xs leading-relaxed text-amber-700">
              Suggested action: review Lesson 5&apos;s URL X-Ray challenge together
              before the checkpoint retake.
            </p>
          </Card>
        </div>
      </div>

      {/* Question analysis */}
      <Card className="mt-5">
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <TrendingDown className="size-4 text-coral-500" /> Hardest questions right now
          </span>
        </CardTitle>
        <div className="space-y-2.5">
          {questionRows.map((q) => (
            <div key={q.id} className="flex items-center gap-4 rounded-lg border border-ink-100 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink-800">{q.prompt}</p>
                <p className="text-xs text-ink-400">{q.lesson}</p>
              </div>
              <Chip tone={q.rate < 50 ? "coral" : q.rate < 70 ? "amber" : "mint"}>
                {q.rate}% correct
              </Chip>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill heatmap */}
      <Card className="mt-5">
        <CardTitle>Student × topic heatmap</CardTitle>
        <Heatmap
          rowLabels={ROSTER.map((s) => `${s.firstName} ${s.lastName[0]}.`)}
          colLabels={CLASS_TOPICS.map((t) => t.label.split(" ")[0])}
          values={heatValues}
          flagBelow={45}
        />
        <p className="mt-2 text-xs text-ink-400">
          Amber cells are below 45% — the fastest way to spot who needs help,
          where.
        </p>
      </Card>
    </div>
  );
}
