"use client";

import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { DemoChip } from "@/components/brand/demo-chip";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { getLesson } from "@/content/curriculum";
import { ROSTER, questionCorrectRate, CLASS_TOPICS } from "@/content/demo/classroom";
import {
  BarChart3,
  Hand,
  Pause,
  Play,
  Radio,
  Square,
  X,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LiveStatus = "not-started" | "working" | "needs-help" | "completed";

const STATUS_META: Record<LiveStatus, { label: string; cls: string; dot: string }> = {
  "not-started": { label: "Not started", cls: "border-ink-700 bg-ink-800/60 text-ink-400", dot: "bg-ink-500" },
  working: { label: "Working", cls: "border-signal-700 bg-signal-900/40 text-signal-300", dot: "bg-signal-400 animate-pulse" },
  "needs-help": { label: "Needs help", cls: "border-coral-500/50 bg-coral-500/10 text-coral-500", dot: "bg-coral-500 animate-pulse" },
  completed: { label: "Completed", cls: "border-mint-500/50 bg-mint-500/10 text-mint-500", dot: "bg-mint-500" },
};

export default function LaunchPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  const [phase, setPhase] = useState<"lobby" | "live" | "paused" | "ended">("lobby");
  const [statuses, setStatuses] = useState<Record<string, LiveStatus>>(
    Object.fromEntries(ROSTER.map((s) => [s.uid, "not-started" as LiveStatus])),
  );
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated classroom: students progress at ability-weighted random pace
  useEffect(() => {
    if (phase !== "live") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      setStatuses((prev) => {
        const next = { ...prev };
        for (const s of ROSTER) {
          const cur = prev[s.uid];
          if (cur === "completed") continue;
          const r = Math.random();
          if (cur === "not-started" && r < 0.25 + s.ability * 0.3) {
            next[s.uid] = "working";
          } else if (cur === "working") {
            if (r < s.ability * 0.16) next[s.uid] = "completed";
            else if (r > 0.985 - (1 - s.ability) * 0.05) next[s.uid] = "needs-help";
          } else if (cur === "needs-help" && r < 0.12) {
            next[s.uid] = "working";
          }
        }
        return next;
      });
    }, 900);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  if (!lesson || lesson.status !== "published") notFound();

  const checkpoint = lesson.stages.find((s) => s.kind === "checkpoint");
  const questions =
    checkpoint?.blocks.flatMap((b) => (b.type === "quiz" ? b.questions : [])) ?? [];
  const topicId =
    CLASS_TOPICS.find((t) => t.lessonId === lesson.id)?.id ?? "systems";

  const counts = Object.values(statuses).reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {} as Record<LiveStatus, number>,
  );
  const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <RequireRole role="teacher">
      <WorldTheme world="creator">
        <div className="flex min-h-screen flex-col bg-ink-950">
          {/* Header */}
          <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3">
            <Logo tone="light" size="sm" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-ink-400 uppercase">
              Launch to Class
            </span>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-white">
              {lesson.title} — Checkpoint · Grade 6 Section A
            </span>
            <DemoChip label="Simulated class" />
            <Button href={`/teacher/lesson/${lesson.id}`} variant="inverse" size="sm" icon={<X />}>
              Close
            </Button>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
            {phase === "lobby" ? (
              /* ── Lobby ── */
              <div className="mx-auto max-w-xl pt-16 text-center">
                <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-white/10">
                  <Radio className="size-9 text-signal-400" />
                </span>
                <h1 className="font-display mt-6 text-3xl font-bold text-white">
                  Launch “{checkpoint?.title ?? "Checkpoint"}”
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-300">
                  {questions.length} questions will be pushed to all{" "}
                  {ROSTER.length} students in Grade 6 — Section A. You&apos;ll see
                  live status for every student as they work.
                </p>
                <Button
                  size="xl"
                  variant="world"
                  icon={<Radio />}
                  className="mt-8"
                  onClick={() => setPhase("live")}
                >
                  Launch to Class
                </Button>
                <p className="mt-3 text-xs text-ink-500">
                  Demo mode simulates 24 students responding in real time.
                </p>
              </div>
            ) : (
              /* ── Live board ── */
              <>
                {/* Controls + counters */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="tnum rounded-lg bg-white/10 px-3 py-1.5 font-mono text-lg font-bold text-white">
                    {mm}:{ss}
                  </span>
                  {(Object.keys(STATUS_META) as LiveStatus[]).map((k) => (
                    <span key={k} className="flex items-center gap-1.5 text-[13px] font-medium text-ink-300">
                      <span className={cn("size-2 rounded-full", STATUS_META[k].dot)} />
                      {STATUS_META[k].label}
                      <span className="tnum font-mono font-bold text-white">{counts[k] ?? 0}</span>
                    </span>
                  ))}
                  <span className="ml-auto flex gap-2">
                    {phase === "live" ? (
                      <Button variant="inverse" size="sm" icon={<Pause />} onClick={() => setPhase("paused")}>
                        Pause
                      </Button>
                    ) : phase === "paused" ? (
                      <Button variant="world" size="sm" icon={<Play />} onClick={() => setPhase("live")}>
                        Resume
                      </Button>
                    ) : null}
                    {phase !== "ended" && (
                      <Button variant="danger" size="sm" icon={<Square />} onClick={() => setPhase("ended")}>
                        End activity
                      </Button>
                    )}
                    {phase === "ended" && (
                      <Button
                        variant="world"
                        size="sm"
                        icon={<BarChart3 />}
                        onClick={() => setShowResults(!showResults)}
                      >
                        {showResults ? "Hide results" : "Display results"}
                      </Button>
                    )}
                  </span>
                </div>

                {/* Student grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {ROSTER.map((s) => {
                    const st = STATUS_META[statuses[s.uid]];
                    return (
                      <div
                        key={s.uid}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors duration-500",
                          st.cls,
                        )}
                      >
                        <Avatar firstName={s.firstName} lastName={s.lastName} hue={s.avatarHue} size="xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold">
                            {s.firstName} {s.lastName[0]}.
                          </span>
                          <span className="flex items-center gap-1 text-[10px] opacity-80">
                            <span className={cn("size-1.5 rounded-full", st.dot)} />
                            {st.label}
                          </span>
                        </span>
                        {statuses[s.uid] === "needs-help" && (
                          <Hand className="size-3.5 shrink-0 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Results reveal */}
                {phase === "ended" && showResults && (
                  <div className="animate-fade-up mt-6 rounded-2xl bg-paper p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold text-ink-900">
                        Question results
                      </h2>
                      <Chip tone="neutral">
                        {counts.completed ?? 0}/{ROSTER.length} finished
                      </Chip>
                    </div>
                    <div className="space-y-3">
                      {questions.map((q, i) => {
                        const rate = questionCorrectRate(q.id, topicId);
                        return (
                          <div key={q.id}>
                            <div className="mb-1 flex items-baseline justify-between gap-3">
                              <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-800">
                                Q{i + 1}. {q.prompt.split("\n")[0]}
                              </p>
                              <span
                                className={cn(
                                  "tnum font-mono text-sm font-bold",
                                  rate < 50 ? "text-coral-600" : rate < 70 ? "text-amber-700" : "text-mint-600",
                                )}
                              >
                                {rate}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  rate < 50 ? "bg-coral-500" : rate < 70 ? "bg-amber-500" : "bg-mint-500",
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 rounded-lg bg-ink-50 px-4 py-2.5 text-[13px] text-ink-600">
                      Questions under 50% are worth re-teaching now, while the
                      thinking is fresh — open the lesson in Teach Mode and reveal
                      the explanation together.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </WorldTheme>
    </RequireRole>
  );
}
