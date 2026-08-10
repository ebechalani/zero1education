"use client";

import { Md } from "@/components/ui/md";
import { Illustration } from "@/features/illustrations";
import { ActivityPlayer, type ActivityOutcome } from "@/features/activities/activity-player";
import { LabRunner } from "@/features/labs/registry";
import type { Block, Challenge } from "@/types/content";
import type { ActivityResult } from "@/types/progress";
import { Play, Zap } from "lucide-react";
import type { ReactNode } from "react";
import {
  BlockAccordion,
  BlockTabs,
  Callout,
  Code,
  Definition,
  Flow,
  TeacherNote,
} from "./blocks";
import { QuizBlockView } from "./quiz-block";
import { ProjectBlockView, ReflectionBlockView } from "./project-block";

export interface BlockContext {
  role: "student" | "teacher";
  activityResults: Record<string, ActivityResult>;
  labsDone: string[];
  submittedProjects: string[];
  reflections: Record<string, string>;
  onActivityComplete: (
    activityId: string,
    outcome: ActivityOutcome,
    opts?: { xp?: number; skillIds?: string[] },
  ) => void;
  onLabComplete: (blockId: string, skillIds?: string[]) => void;
  onProjectSubmit: (projectId: string, title: string, payload: { text: string; link?: string }) => void;
  onReflectionSave: (blockId: string, prompt: string, text: string) => void;
  /** Teach Mode: reveal answers, disable recording */
  teacherReveal?: boolean;
}

function ChallengeFrame({
  challenge,
  children,
}: {
  challenge: Challenge;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-bit-300 shadow-card">
      <div className="flex items-center gap-3 bg-gradient-to-r from-bit-500 to-bit-400 px-5 py-3">
        <Zap className="size-5 text-white" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.25em] text-bit-100 uppercase">
            Challenge · +{challenge.xp} XP
          </p>
          <h3 className="truncate font-display text-[15px] font-bold text-white">
            {challenge.title}
          </h3>
        </div>
      </div>
      <div className="space-y-4 bg-bit-50/50 p-4">
        <p className="text-[14px] leading-relaxed text-ink-700">{challenge.brief}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * The one renderer for all curriculum. Feed it blocks + a context and it
 * renders any lesson, for any role — the student player, Teach Mode and
 * Studio previews all sit on top of this.
 */
export function BlockRenderer({
  blocks,
  ctx,
}: {
  blocks: Block[];
  ctx: BlockContext;
}) {
  return (
    <div className="space-y-5">
      {blocks.map((block) => (
        <div key={block.id}>{renderBlock(block, ctx)}</div>
      ))}
    </div>
  );
}

function renderBlock(block: Block, ctx: BlockContext): ReactNode {
  switch (block.type) {
    case "text":
      return <Md text={block.md} className="text-[15px]" />;
    case "heading": {
      const H = block.level === 3 ? "h3" : "h2";
      return (
        <H
          className={
            block.level === 3
              ? "font-display pt-1 text-[17px] font-bold text-ink-900"
              : "font-display border-b border-ink-100 pt-2 pb-2 text-xl font-bold text-ink-900"
          }
        >
          {block.text}
        </H>
      );
    }
    case "image":
      return (
        <figure className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
          <Illustration id={block.illustrationId} alt={block.alt} />
          {block.caption && (
            <figcaption className="border-t border-ink-100 px-4 py-2.5 text-center text-[13px] text-ink-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "callout":
      return <Callout block={block} />;
    case "definition":
      return <Definition block={block} />;
    case "teacherNote":
      return ctx.role === "teacher" ? <TeacherNote md={block.md} /> : null;
    case "tabs":
      return (
        <BlockTabs
          block={block}
          renderBlocks={(blocks) => <BlockRenderer blocks={blocks} ctx={ctx} />}
        />
      );
    case "accordion":
      return (
        <BlockAccordion
          block={block}
          renderBlocks={(blocks) => <BlockRenderer blocks={blocks} ctx={ctx} />}
        />
      );
    case "flow":
      return <Flow block={block} />;
    case "code":
      return <Code block={block} />;
    case "video":
      return (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-ink-200 bg-ink-900">
          <div className="text-center">
            <Play className="mx-auto size-10 text-ink-500" />
            <p className="mt-2 text-sm text-ink-400">{block.caption ?? "Video"}</p>
          </div>
        </div>
      );
    case "activity":
      return (
        <ActivityPlayer
          activity={block.activity}
          previousResult={ctx.activityResults[block.activity.id]}
          teacherReveal={ctx.teacherReveal}
          onComplete={(outcome) =>
            ctx.onActivityComplete(block.activity.id, outcome, {
              xp: block.activity.xp,
              skillIds: block.activity.skillIds,
            })
          }
        />
      );
    case "quiz":
      return (
        <QuizBlockView
          block={block}
          results={ctx.activityResults}
          teacherReveal={ctx.teacherReveal}
          onQuestionComplete={(activityId, outcome, skillIds) =>
            ctx.onActivityComplete(activityId, outcome, { skillIds })
          }
        />
      );
    case "lab":
      return (
        <LabRunner
          labId={block.labId}
          config={block.config}
          title={block.title}
          brief={block.brief}
          completed={ctx.labsDone.includes(block.id)}
          onComplete={() => ctx.onLabComplete(block.id)}
        />
      );
    case "challenge": {
      const ch = block.challenge;
      return (
        <ChallengeFrame challenge={ch}>
          {ch.activity ? (
            <ActivityPlayer
              activity={ch.activity}
              previousResult={ctx.activityResults[ch.activity.id]}
              teacherReveal={ctx.teacherReveal}
              onComplete={(outcome) =>
                ctx.onActivityComplete(ch.activity!.id, outcome, {
                  xp: ch.xp,
                  skillIds: ch.activity!.skillIds,
                })
              }
            />
          ) : ch.labId ? (
            <LabRunner
              labId={ch.labId}
              config={ch.labConfig}
              completed={ctx.labsDone.includes(block.id)}
              onComplete={() => ctx.onLabComplete(block.id)}
            />
          ) : null}
        </ChallengeFrame>
      );
    }
    case "project":
      return (
        <ProjectBlockView
          project={block.project}
          submitted={ctx.submittedProjects.includes(block.project.id)}
          onSubmit={(payload) =>
            ctx.onProjectSubmit(block.project.id, block.project.title, payload)
          }
        />
      );
    case "reflection":
      return (
        <ReflectionBlockView
          prompt={block.prompt}
          placeholder={block.placeholder}
          saved={ctx.reflections[block.id]}
          onSave={(text) => ctx.onReflectionSave(block.id, block.prompt, text)}
        />
      );
  }
}
