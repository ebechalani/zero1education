"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getLesson } from "@/content/curriculum";
import { skillById } from "@/content/skills";
import { STAGE_META } from "@/features/mission/mission-player";
import type { Activity, Block } from "@/types/content";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lightbulb,
  MonitorPlay,
  PlayCircle,
  Radio,
  Target,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";

function answerSummary(a: Activity): string {
  switch (a.kind) {
    case "mcq":
      return a.options.find((o) => o.id === a.answerId)?.text ?? "";
    case "truefalse":
      return a.answer ? "TRUE" : "FALSE";
    case "multi":
      return a.options
        .filter((o) => a.answerIds.includes(o.id))
        .map((o) => o.text)
        .join(" · ");
    case "match":
      return a.pairs.map((p) => `${p.left} → ${p.right}`).join(" · ");
    case "sort":
      return a.correctOrder
        .map((id) => a.items.find((i) => i.id === id)?.text)
        .join(" → ");
    case "classify":
      return a.categories
        .map(
          (c) =>
            `${c.label}: ${a.items
              .filter((i) => i.categoryId === c.id)
              .map((i) => i.text)
              .join(", ")}`,
        )
        .join(" | ");
    case "fillblank":
      return Object.values(a.blanks)
        .map((accepted) => accepted[0])
        .join(" · ");
  }
}

function collectQuestions(blocks: Block[]): Activity[] {
  const out: Activity[] = [];
  const walk = (list: Block[]) => {
    for (const b of list) {
      if (b.type === "activity") out.push(b.activity);
      if (b.type === "quiz") out.push(...b.questions);
      if (b.type === "challenge" && b.challenge.activity) out.push(b.challenge.activity);
      if (b.type === "tabs") b.tabs.forEach((t) => walk(t.blocks));
      if (b.type === "accordion") b.items.forEach((i) => walk(i.blocks));
    }
  };
  walk(blocks);
  return out;
}

export default function TeacherLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  const [showAnswers, setShowAnswers] = useState(false);
  if (!lesson || lesson.status !== "published") notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={<Chip tone="world">Mission {lesson.order} · Inside the Digital World</Chip>}
        title={lesson.title}
        description={lesson.description}
        actions={
          <>
            <Button href={`/student/lesson/${lesson.id}`} variant="ghost" icon={<PlayCircle />}>
              Student view
            </Button>
            <Button href={`/teacher/teach/${lesson.id}`} variant="secondary" icon={<MonitorPlay />}>
              Teach Mode
            </Button>
            <Button href={`/teacher/launch/${lesson.id}`} icon={<Radio />}>
              Launch to Class
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Objectives */}
          <Card>
            <CardTitle>Learning objectives</CardTitle>
            <ul className="space-y-2">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Target className="mt-0.5 size-4 shrink-0 text-brand-500" />
                  {o}
                </li>
              ))}
            </ul>
          </Card>

          {/* Mission flow */}
          <Card>
            <CardTitle>Mission flow · {lesson.estimatedMinutes} min</CardTitle>
            <ol className="space-y-2">
              {lesson.stages.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg bg-ink-50/70 px-3.5 py-2.5">
                  <span className="tnum font-mono text-xs font-bold text-ink-400">
                    {i + 1}
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-md bg-white text-brand-600 shadow-card">
                    {STAGE_META[s.kind].icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[9px] tracking-[0.2em] text-ink-400 uppercase">
                      {STAGE_META[s.kind].label}
                    </span>
                    <span className="block truncate text-sm font-semibold text-ink-800">
                      {s.title}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Answer key */}
          <Card>
            <CardTitle
              action={
                <Button
                  size="sm"
                  variant={showAnswers ? "secondary" : "primary"}
                  icon={showAnswers ? <EyeOff /> : <Eye />}
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? "Hide answers" : "Reveal answers"}
                </Button>
              }
            >
              Answer key
            </CardTitle>
            {!showAnswers ? (
              <p className="text-sm text-ink-400">
                Answers stay hidden until revealed — safe to open this page on a
                projector.
              </p>
            ) : (
              <ol className="space-y-3">
                {lesson.stages.flatMap((stage) =>
                  collectQuestions(stage.blocks).map((q) => (
                    <li key={q.id} className="rounded-lg border border-ink-100 p-3.5">
                      <p className="text-[13px] font-medium whitespace-pre-line text-ink-800">
                        {q.prompt}
                      </p>
                      <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-semibold text-mint-700">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                        {answerSummary(q)}
                      </p>
                    </li>
                  )),
                )}
              </ol>
            )}
          </Card>
        </div>

        {/* Right rail: guide + skills */}
        <div className="space-y-5">
          {lesson.teacherGuide && (
            <Card>
              <CardTitle>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-brand-600" /> Teacher guide
                </span>
              </CardTitle>
              <p className="text-[13.5px] leading-relaxed text-ink-600">
                {lesson.teacherGuide.overview}
              </p>
              <ul className="mt-3 space-y-2">
                {lesson.teacherGuide.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-bit-50 p-2.5 text-[13px] text-ink-700">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-bit-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardTitle>Competencies developed</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {lesson.skillIds.map((id) => {
                const skill = skillById.get(id);
                return skill ? (
                  <Chip key={id} tone="brand">
                    {skill.title}
                  </Chip>
                ) : null;
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
