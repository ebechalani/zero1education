"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ProgressBits } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgress } from "@/stores/progress-store";
import type { Block, Lesson, MissionStage, StageKind } from "@/types/content";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  FlaskConical,
  Lock,
  MousePointerClick,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { BlockRenderer, type BlockContext } from "./block-renderer";
import { Skeleton } from "@/components/ui/skeleton";

export const STAGE_META: Record<StageKind, { label: string; icon: ReactNode }> = {
  discover: { label: "Discover", icon: <Compass className="size-4" /> },
  learn: { label: "Learn", icon: <BookOpen className="size-4" /> },
  tryit: { label: "Try It", icon: <MousePointerClick className="size-4" /> },
  lab: { label: "ZERO1 Lab", icon: <FlaskConical className="size-4" /> },
  challenge: { label: "Challenge", icon: <Zap className="size-4" /> },
  checkpoint: { label: "Checkpoint", icon: <Target className="size-4" /> },
  create: { label: "Create", icon: <Rocket className="size-4" /> },
};

/** Recursively collect interactive requirements from a stage's blocks. */
function collectRequirements(blocks: Block[]): {
  activityIds: string[];
  labBlockIds: string[];
} {
  const activityIds: string[] = [];
  const labBlockIds: string[] = [];
  const walk = (list: Block[]) => {
    for (const b of list) {
      switch (b.type) {
        case "activity":
          activityIds.push(b.activity.id);
          break;
        case "quiz":
          b.questions.forEach((q) => activityIds.push(q.id));
          break;
        case "lab":
          labBlockIds.push(b.id);
          break;
        case "challenge":
          if (b.challenge.activity) activityIds.push(b.challenge.activity.id);
          if (b.challenge.labId) labBlockIds.push(b.id);
          break;
        case "tabs":
          b.tabs.forEach((t) => walk(t.blocks));
          break;
        case "accordion":
          b.items.forEach((i) => walk(i.blocks));
          break;
        default:
          break;
      }
    }
  };
  walk(blocks);
  return { activityIds, labBlockIds };
}

export function MissionPlayer({ lesson }: { lesson: Lesson }) {
  const hydrated = useHydrated();
  const store = useProgress();
  const progress = store.lessons[lesson.id];
  const stages = lesson.stages;

  const firstIncomplete = useMemo(() => {
    const done = new Set(progress?.stagesDone ?? []);
    const idx = stages.findIndex((s) => !done.has(s.id));
    return idx === -1 ? stages.length : idx;
  }, [progress?.stagesDone, stages]);

  const [current, setCurrent] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const index = current ?? Math.min(firstIncomplete, stages.length - 1);
  const missionDone = Boolean(progress?.completedAt);
  const showComplete = celebrate || (missionDone && current === null);

  const stage: MissionStage | undefined = stages[index];
  const stagesDone = progress?.stagesDone ?? [];
  const results = progress?.activityResults ?? {};
  const labsDone = progress?.labsDone ?? [];

  const requirements = useMemo(
    () => (stage ? collectRequirements(stage.blocks) : { activityIds: [], labBlockIds: [] }),
    [stage],
  );

  const submittedProjects = store.portfolio
    .filter((p) => p.refId)
    .map((p) => p.refId!) as string[];
  const reflections: Record<string, string> = Object.fromEntries(
    store.portfolio
      .filter((p) => p.kind === "reflection" && p.refId)
      .map((p) => [p.refId!, p.content ?? ""]),
  );

  const hasCreateWork = (blocks: Block[]) =>
    blocks.some((b) => b.type === "project" || b.type === "reflection");
  const createSatisfied =
    !stage ||
    !hasCreateWork(stage.blocks) ||
    stage.blocks.some(
      (b) =>
        (b.type === "project" && submittedProjects.includes(b.project.id)) ||
        (b.type === "reflection" && reflections[b.id]),
    );

  const stageMet =
    requirements.activityIds.every((id) => results[id]) &&
    requirements.labBlockIds.every((id) => labsDone.includes(id)) &&
    (stage?.kind !== "create" || createSatisfied);

  const ctx: BlockContext = {
    role: "student",
    activityResults: results,
    labsDone,
    submittedProjects,
    reflections,
    onActivityComplete: (activityId, outcome, opts) => {
      store.startLesson(lesson.id);
      store.recordActivity(lesson.id, activityId, outcome, opts);
    },
    onLabComplete: (blockId) => {
      store.startLesson(lesson.id);
      store.completeLab(lesson.id, blockId, lesson.skillIds);
      toast("Lab completed!", { description: "+25 XP earned.", tone: "success" });
    },
    onProjectSubmit: (projectId, title, payload) => {
      store.addPortfolioItem({
        title,
        kind: "project",
        refId: projectId,
        lessonId: lesson.id,
        gradeLabel: "Grade 6",
        summary: payload.text.slice(0, 140),
        content: payload.link ? `${payload.text}\n\nLink: ${payload.link}` : payload.text,
        submitType: payload.link ? "link" : "text",
        showcased: false,
      });
    },
    onReflectionSave: (blockId, prompt, text) => {
      store.addPortfolioItem({
        title: prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt,
        kind: "reflection",
        refId: blockId,
        lessonId: lesson.id,
        gradeLabel: "Grade 6",
        summary: text.slice(0, 140),
        content: text,
        showcased: false,
      });
      toast("Reflection saved", { tone: "success" });
    },
  };

  const advance = () => {
    if (!stage) return;
    store.startLesson(lesson.id);
    store.completeStage(lesson.id, stage.id, stage.xp);
    if (index >= stages.length - 1) {
      store.completeLesson(lesson.id, lesson.skillIds);
      setCelebrate(true);
      setCurrent(null);
    } else {
      setCurrent(index + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  // ── Mission complete screen ──────────────────────────────────────────────
  if (showComplete) {
    const xpEarned = progress?.xpEarned ?? 0;
    return (
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-10">
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-900 text-center shadow-pop">
          <div className="px-8 pt-10 pb-8">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-bit-400 to-bit-600 shadow-[0_0_40px_-8px_var(--color-bit-400)]">
              <Trophy className="size-10 text-white" />
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-[0.3em] text-signal-400 uppercase">
              Mission complete
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold text-white">
              {lesson.title}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-300">
              {lesson.tagline}
            </p>
            <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-6">
              <div>
                <p className="tnum font-mono text-3xl font-bold text-bit-400">
                  +{xpEarned}
                </p>
                <p className="text-[11px] tracking-wide text-ink-400 uppercase">XP earned</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="tnum font-mono text-3xl font-bold text-signal-400">
                  {stagesDone.length}/{stages.length}
                </p>
                <p className="text-[11px] tracking-wide text-ink-400 uppercase">Stages</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 bg-white/5 px-8 py-5">
            <Button href="/student/journey" variant="inverse" icon={<ArrowLeft />}>
              Back to Journey
            </Button>
            <Button href="/student/skills" variant="world" icon={<Sparkles />}>
              See your Passport
            </Button>
          </div>
        </div>
        <button
          onClick={() => { setCelebrate(false); setCurrent(0); }}
          className="mx-auto mt-4 block cursor-pointer text-sm text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline"
        >
          Review the mission again
        </button>
      </div>
    );
  }

  if (!stage) return null;

  // ── Player ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-ink-100 bg-paper/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Link
            href="/student/journey"
            className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-4" /> Journey
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-[15px] font-bold text-ink-900">
              {lesson.title}
            </p>
          </div>
          <div className="w-28">
            <ProgressBits
              value={(stagesDone.length / stages.length) * 100}
              tone="world"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* Stage rail */}
        <nav aria-label="Mission stages" className="lg:sticky lg:top-20 lg:self-start">
          <ol className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {stages.map((s, i) => {
              const done = stagesDone.includes(s.id);
              const isCurrent = i === index;
              const reachable = done || i <= firstIncomplete;
              const meta = STAGE_META[s.kind];
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    disabled={!reachable}
                    onClick={() => reachable && setCurrent(i)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                      isCurrent
                        ? "text-white [background:var(--world-accent)] shadow-card"
                        : done
                          ? "text-ink-700 hover:bg-ink-100"
                          : reachable
                            ? "text-ink-500 hover:bg-ink-100"
                            : "cursor-not-allowed text-ink-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        isCurrent
                          ? "bg-white/20 text-white"
                          : done
                            ? "bg-mint-100 text-mint-600"
                            : "bg-ink-100 text-ink-400",
                      )}
                    >
                      {done && !isCurrent ? (
                        <Check className="size-3.5" />
                      ) : !reachable ? (
                        <Lock className="size-3" />
                      ) : (
                        meta.icon
                      )}
                    </span>
                    <span className="hidden lg:block">
                      <span className="block font-mono text-[9px] tracking-[0.15em] uppercase opacity-70">
                        {meta.label}
                      </span>
                      {s.title}
                    </span>
                    <span className="lg:hidden">{meta.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Stage content */}
        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-3">
            <Chip tone="world" icon={STAGE_META[stage.kind].icon}>
              {STAGE_META[stage.kind].label}
            </Chip>
            <h2 className="font-display text-xl font-bold text-ink-900">
              {stage.title}
            </h2>
          </div>

          <BlockRenderer blocks={stage.blocks} ctx={ctx} />

          {/* Continue */}
          <div className="mt-8 flex items-center justify-between rounded-xl border border-ink-100 bg-white p-4 shadow-card">
            <p className="text-sm text-ink-500">
              {stagesDone.includes(stage.id)
                ? "Stage complete — continue when ready."
                : stageMet
                  ? "Everything done here. Onward!"
                  : stage.kind === "create"
                    ? "Submit the project or save a reflection to finish the mission."
                    : "Complete the activities above to continue."}
            </p>
            {stagesDone.includes(stage.id) && index < stages.length - 1 ? (
              <Button variant="secondary" iconRight={<ArrowRight />} onClick={() => setCurrent(index + 1)}>
                Next stage
              </Button>
            ) : (
              <Button
                variant="world"
                size="lg"
                iconRight={index >= stages.length - 1 ? <Trophy /> : <ArrowRight />}
                disabled={!stageMet}
                onClick={advance}
              >
                {index >= stages.length - 1 ? "Complete Mission" : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
