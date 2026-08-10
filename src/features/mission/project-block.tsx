"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Label, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Project } from "@/types/content";
import { CheckCircle2, ClipboardList, Link2, Rocket, Type } from "lucide-react";
import { useState } from "react";

/**
 * Project brief + submission. In demo mode submissions land in the local
 * portfolio; in production they create `submissions` docs for teacher review.
 */
export function ProjectBlockView({
  project,
  submitted,
  onSubmit,
}: {
  project: Project;
  submitted: boolean;
  onSubmit: (payload: { text: string; link?: string }) => void;
}) {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [mode, setMode] = useState<"text" | "link">("text");
  const canLink = project.submitTypes.includes("link");

  const submit = () => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), link: link.trim() || undefined });
    toast("Project submitted", {
      description: "Added to your portfolio — your teacher can now review it.",
      tone: "success",
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 shadow-card">
      <div className="border-b border-ink-100 bg-ink-900 px-5 py-4">
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase">
          <Rocket className="size-3.5" style={{ color: "var(--world-accent)" }} />
          Mission project
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-white">
          {project.title}
        </h3>
      </div>
      <div className="space-y-4 bg-white p-5">
        <p className="text-[14.5px] leading-relaxed text-ink-700">{project.brief}</p>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-500 uppercase">
            <ClipboardList className="size-3.5" /> Deliverables
          </p>
          <ul className="space-y-1.5">
            {project.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="tnum mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-100 font-mono text-[11px] font-bold text-brand-700">
                  {i + 1}
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        {project.rubric && (
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
              How it&apos;s graded
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {project.rubric.map((r) => (
                <div key={r.criterion} className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[13px] font-semibold text-ink-800">{r.criterion}</p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-500">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {submitted ? (
          <div className="flex items-center gap-2.5 rounded-lg bg-mint-100 px-4 py-3 text-sm font-semibold text-mint-700">
            <CheckCircle2 className="size-5" />
            Submitted — it&apos;s in your portfolio and awaiting your teacher&apos;s review.
          </div>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-4">
            <div className="mb-3 flex gap-2">
              <Chip
                tone={mode === "text" ? "brand" : "neutral"}
                icon={<Type />}
                className="cursor-pointer"
              >
                <button onClick={() => setMode("text")} className="cursor-pointer">
                  Write it
                </button>
              </Chip>
              {canLink && (
                <Chip
                  tone={mode === "link" ? "brand" : "neutral"}
                  icon={<Link2 />}
                  className="cursor-pointer"
                >
                  <button onClick={() => setMode("link")} className="cursor-pointer">
                    Attach a link
                  </button>
                </Chip>
              )}
            </div>
            <Label htmlFor={`prj-${project.id}`}>Your work</Label>
            <Textarea
              id={`prj-${project.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe or paste your work here…"
            />
            {mode === "link" && (
              <div className="mt-3">
                <Label htmlFor={`prj-link-${project.id}`}>Link (optional)</Label>
                <Input
                  id={`prj-link-${project.id}`}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
              </div>
            )}
            <Button className="mt-3" onClick={submit} disabled={!text.trim()}>
              Submit project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReflectionBlockView({
  prompt,
  placeholder,
  saved,
  onSave,
}: {
  prompt: string;
  placeholder?: string;
  saved?: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(saved ?? "");
  const [done, setDone] = useState(Boolean(saved));
  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-100/40 p-4">
      <p className="text-[13px] font-bold tracking-wide text-violet-700 uppercase">
        Reflection
      </p>
      <p className="mt-1.5 text-[14.5px] font-medium text-ink-800">{prompt}</p>
      <Textarea
        className="mt-3 bg-white"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDone(false);
        }}
        placeholder={placeholder ?? "Write your thoughts…"}
      />
      <div className="mt-2.5 flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => { onSave(text.trim()); setDone(true); }} disabled={!text.trim() || done}>
          {done ? "Saved" : "Save reflection"}
        </Button>
        {done && (
          <span className="flex items-center gap-1 text-xs font-medium text-mint-600">
            <CheckCircle2 className="size-3.5" /> In your portfolio
          </span>
        )}
      </div>
    </div>
  );
}
