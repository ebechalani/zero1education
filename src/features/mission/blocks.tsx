"use client";

import { Md } from "@/components/ui/md";
import { cn } from "@/lib/utils";
import type {
  AccordionBlock,
  CalloutBlock,
  CodeBlock,
  DefinitionBlock,
  FlowBlock,
  TabsBlock,
} from "@/types/content";
import {
  BookMarked,
  ChevronDown,
  GraduationCap,
  Info,
  Lightbulb,
  ScrollText,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useState, type ReactNode } from "react";

// ── Callout ─────────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info: { border: "border-brand-200", bg: "bg-brand-50", icon: <Info className="size-4.5 text-brand-600" />, label: "text-brand-700" },
  tip: { border: "border-bit-200", bg: "bg-bit-50", icon: <Lightbulb className="size-4.5 text-bit-600" />, label: "text-bit-700" },
  warning: { border: "border-amber-500/30", bg: "bg-amber-100/60", icon: <TriangleAlert className="size-4.5 text-amber-700" />, label: "text-amber-700" },
  story: { border: "border-violet-500/25", bg: "bg-violet-100/50", icon: <ScrollText className="size-4.5 text-violet-700" />, label: "text-violet-700" },
  fact: { border: "border-signal-200", bg: "bg-signal-50", icon: <Sparkles className="size-4.5 text-signal-600" />, label: "text-signal-700" },
} as const;

export function Callout({ block }: { block: CalloutBlock }) {
  const s = CALLOUT_STYLES[block.variant];
  return (
    <div className={cn("rounded-lg border p-4", s.border, s.bg)}>
      <div className="flex items-center gap-2">
        {s.icon}
        <p className={cn("text-[13px] font-bold tracking-wide uppercase", s.label)}>
          {block.title ?? block.variant}
        </p>
      </div>
      <Md text={block.md} className="mt-2 text-[14.5px]" />
    </div>
  );
}

// ── Definition ──────────────────────────────────────────────────────────────

export function Definition({ block }: { block: DefinitionBlock }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-2">
        <BookMarked className="size-4 text-brand-600" />
        <span className="font-display text-[15px] font-bold text-ink-900">
          {block.term}
        </span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-ink-300 uppercase">
          Definition
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-[14.5px] leading-relaxed text-ink-700">{block.definition}</p>
        {block.example && (
          <p className="mt-1.5 text-[13px] text-ink-500">
            <span className="font-semibold text-ink-600">Example: </span>
            {block.example}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Teacher note (role-gated by the renderer) ──────────────────────────────

export function TeacherNote({ md }: { md: string }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-100/40 p-4">
      <p className="mb-1.5 flex items-center gap-2 text-[12px] font-bold tracking-wide text-amber-700 uppercase">
        <GraduationCap className="size-4" /> Teacher note — not shown to students
      </p>
      <Md text={md} className="text-[13.5px]" />
    </div>
  );
}

// ── Flow diagram ────────────────────────────────────────────────────────────

export function Flow({ block }: { block: FlowBlock }) {
  return (
    <div className="flex flex-col items-center gap-0 py-1">
      {block.steps.map((step, i) => {
        const isTerminal = step.label === "START" || step.label === "END";
        const isDecision = step.branch === "decision";
        const isBranch = step.branch === "yes" || step.branch === "no";
        return (
          <div key={step.id} className="flex flex-col items-center">
            {i > 0 && (
              <div className="flex h-6 flex-col items-center" aria-hidden>
                <div className="w-0.5 flex-1 bg-ink-200" />
                <ChevronDown className="-mt-1.5 size-3.5 text-ink-300" />
              </div>
            )}
            <div
              className={cn(
                "max-w-md px-4 py-2 text-center text-[13.5px] font-medium shadow-card",
                isTerminal &&
                  "rounded-full bg-ink-900 font-mono text-[11px] tracking-[0.25em] text-signal-400 uppercase",
                isDecision &&
                  "rounded-lg border-2 border-amber-500/50 bg-amber-100/70 text-amber-700",
                isBranch &&
                  cn(
                    "rounded-lg border",
                    step.branch === "yes"
                      ? "border-mint-500/40 bg-mint-100/70 text-mint-700"
                      : "border-ink-200 bg-white text-ink-700",
                  ),
                !isTerminal && !isDecision && !isBranch &&
                  "rounded-lg border border-ink-100 bg-white text-ink-800",
              )}
            >
              {step.label}
              {step.detail && (
                <span className="block text-[11.5px] font-normal text-ink-400">
                  {step.detail}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Code display ────────────────────────────────────────────────────────────

export function Code({ block }: { block: CodeBlock }) {
  return (
    <figure>
      <div className="overflow-hidden rounded-lg border border-ink-800 bg-ink-950">
        <div className="flex items-center justify-between border-b border-ink-800 px-4 py-1.5">
          <span className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">
            {block.language}
          </span>
          <span className="flex gap-1.5" aria-hidden>
            {["bg-coral-500", "bg-bit-500", "bg-mint-500"].map((c) => (
              <span key={c} className={cn("size-2 rounded-full opacity-70", c)} />
            ))}
          </span>
        </div>
        <pre className="thin-scroll overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-signal-100">
          <code>{block.code}</code>
        </pre>
      </div>
      {block.caption && (
        <figcaption className="mt-1.5 text-center text-xs text-ink-400">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Tabs & accordion (nested blocks rendered by caller) ────────────────────

export function BlockTabs({
  block,
  renderBlocks,
}: {
  block: TabsBlock;
  renderBlocks: (blocks: TabsBlock["tabs"][number]["blocks"]) => ReactNode;
}) {
  const [active, setActive] = useState(block.tabs[0]?.id);
  return (
    <div className="rounded-lg border border-ink-100 bg-white shadow-card">
      <div className="flex border-b border-ink-100" role="tablist">
        {block.tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              active === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {block.tabs.map(
        (t) =>
          t.id === active && (
            <div key={t.id} className="animate-fade-up space-y-4 p-4">
              {renderBlocks(t.blocks)}
            </div>
          ),
      )}
    </div>
  );
}

export function BlockAccordion({
  block,
  renderBlocks,
}: {
  block: AccordionBlock;
  renderBlocks: (blocks: AccordionBlock["items"][number]["blocks"]) => ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(block.items[0]?.id ?? null);
  return (
    <div className="divide-y divide-ink-100 rounded-lg border border-ink-100 bg-white shadow-card">
      {block.items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="text-[14.5px] font-semibold text-ink-800">
                {item.title}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-ink-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            {isOpen && (
              <div className="animate-fade-up space-y-4 px-4 pb-4">
                {renderBlocks(item.blocks)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
