import { DemoChip } from "@/components/brand/demo-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Circle,
  Eye,
  Flame,
  Grid3x3,
  HandHelping,
  KeyRound,
  Layers,
  Lightbulb,
  ListChecks,
  Loader,
  Maximize2,
  MonitorPlay,
  NotebookPen,
  Radio,
  Timer,
  TrendingDown,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Teachers",
  description:
    "The ZERO1 Teacher Hub: Teach Mode for the projector, Launch to Class live status, class analytics, lesson kits with answer keys, and teacher notes inside every lesson.",
};

const pillars = [
  {
    icon: MonitorPlay,
    title: "Teach Mode",
    line: "The same lesson, rendered for a projector: one idea per screen, reveals under your control.",
  },
  {
    icon: Radio,
    title: "Launch to Class",
    line: "Push a lesson to every student and watch a live board of who is done, working, or stuck.",
  },
  {
    icon: Grid3x3,
    title: "Class analytics",
    line: "Mastery by topic, the questions that broke the class, a skill heatmap, and what to do next.",
  },
  {
    icon: BookOpen,
    title: "Curriculum & lesson kits",
    line: "Grade → unit → lesson browser with objectives, guides, answer keys and printable material.",
  },
];

const teachModeFeatures = [
  { icon: Eye, t: "Reveal controls", d: "Answers, explanations and definitions stay hidden until you reveal them." },
  { icon: Maximize2, t: "Projector layout", d: "Dark, high-contrast, large type — readable from the back row." },
  { icon: NotebookPen, t: "Teacher notes on screen", d: "Prompts, misconceptions and questions to ask, visible only to you." },
  { icon: Timer, t: "Activity timer", d: "Start a countdown for a task without leaving the lesson." },
  { icon: ChevronRight, t: "Keyboard driven", d: "Arrow keys move between stages; Esc exits. No hunting for a mouse." },
  { icon: Layers, t: "Same content, no re-authoring", d: "Teach Mode renders the published lesson — nothing to prepare twice." },
];

const roster = [
  { name: "Maya", state: "done" },
  { name: "Karim", state: "working" },
  { name: "Lea", state: "done" },
  { name: "Omar", state: "help" },
  { name: "Nour", state: "working" },
  { name: "Rami", state: "done" },
  { name: "Jana", state: "idle" },
  { name: "Ziad", state: "working" },
  { name: "Sara", state: "help" },
  { name: "Fadi", state: "done" },
  { name: "Lina", state: "working" },
  { name: "Tarek", state: "idle" },
] as const;

const stateMeta = {
  done: { label: "Completed", cls: "border-mint-500/40 bg-mint-100 text-mint-700", icon: CheckCircle2 },
  working: { label: "Working", cls: "border-brand-200 bg-brand-50 text-brand-700", icon: Loader },
  help: { label: "Needs help", cls: "border-amber-500/40 bg-amber-100 text-amber-700", icon: HandHelping },
  idle: { label: "Not started", cls: "border-ink-200 bg-ink-50 text-ink-400", icon: Circle },
} as const;

const analytics = [
  {
    icon: ListChecks,
    title: "Mastery by topic",
    line: "Every activity reports against a named competency, so the class view is “binary conversion: 62% mastered”, not “average 71%”.",
  },
  {
    icon: TrendingDown,
    title: "Hardest-question diagnosis",
    line: "The questions with the lowest first-attempt success, with the distractor most students picked — the misconception, named.",
  },
  {
    icon: Grid3x3,
    title: "Skill heatmap",
    line: "Students down one axis, skills across the other. Rows spot a struggling student; columns spot a lesson to reteach.",
  },
  {
    icon: Lightbulb,
    title: "Suggested actions",
    line: "Concrete next steps: reteach this concept, re-run this lab, pair these students, assign this challenge.",
  },
];

const timeline = [
  {
    phase: "Before class",
    tone: "brand" as const,
    steps: [
      "Open the lesson in the curriculum browser: objectives, key vocabulary, estimated minutes, required hardware.",
      "Skim the lesson kit — teacher guide, common misconceptions, answer key, printable worksheet.",
      "Decide the stopping point: full mission, or Discover → Lab today and Challenge tomorrow.",
    ],
  },
  {
    phase: "During class",
    tone: "signal" as const,
    steps: [
      "Open Teach Mode on the projector and work through Discover and Learn together, revealing as you go.",
      "Launch to Class when students move to their devices — the status board fills in live.",
      "Watch for amber: “needs help” raises a student to the top of the board before they give up.",
      "Pull the class back for the Challenge, or let it run and use the checkpoint as an exit ticket.",
    ],
  },
  {
    phase: "After class",
    tone: "mint" as const,
    steps: [
      "Open class analytics: mastery by topic and the questions the class actually failed.",
      "Review Create-stage submissions in the project view and leave feedback.",
      "Follow a suggested action — reteach, reassign, or move on with confidence.",
    ],
  },
];

const toneCls = {
  brand: "bg-brand-600",
  signal: "bg-signal-600",
  mint: "bg-mint-600",
};

export default function ForTeachersPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Chip tone="brand">Teacher Hub</Chip>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
              Everything you need to run the lesson
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
              A textbook hands you content and wishes you luck. The ZERO1 Teacher
              Hub hands you the projector deck, the live class board, the answer
              key and the diagnosis — all generated from the same lesson your
              students are playing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/contact" iconRight={<ArrowRight />}>
                Request a demo
              </Button>
              <Button href="/resources" variant="secondary">
                See teacher resources
              </Button>
            </div>
          </div>
          <ul className="space-y-2 rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <li className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              No extra preparation
            </li>
            {[
              "Teach Mode is the published lesson — nothing to rebuild as slides",
              "Answer keys are generated from the same questions students answer",
              "Teacher notes live inside the lesson and never render for students",
              "Analytics are a projection of student work, not a form you fill in",
            ].map((t) => (
              <li key={t} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
                <p.icon className="size-5" />
              </span>
              <h2 className="font-display mt-3.5 text-[15px] font-bold text-ink-900">
                {p.title}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                {p.line}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">
              Teach Mode — the lesson on the board
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-500">
              One click from any lesson. The mission stages become a
              presentation: one idea per screen, diagrams full width, questions
              posed to the room with the answer held back until you decide.
            </p>
            <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {teachModeFeatures.map((f) => (
                <div key={f.t} className="flex gap-3">
                  <f.icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink-800">{f.t}</p>
                    <p className="text-[13px] leading-relaxed text-ink-500">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-950 shadow-pop">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="size-2 rounded-full bg-coral-500" aria-hidden />
              <span className="size-2 rounded-full bg-bit-500" aria-hidden />
              <span className="size-2 rounded-full bg-mint-500" aria-hidden />
              <p className="ml-2 font-mono text-[11px] text-ink-400">
                Teach Mode · G6 · Binary Numbers
              </p>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-signal-400">
                <Timer className="size-3.5" />
                04:32
              </span>
            </div>
            <div className="px-6 py-8">
              <p className="font-mono text-[11px] tracking-[0.18em] text-signal-400 uppercase">
                Stage 2 · Learn
              </p>
              <h3 className="font-display mt-2 text-2xl font-bold text-white">
                Why only 0 and 1?
              </h3>
              <div className="mt-5 flex items-center gap-2">
                {[1, 0, 1, 1, 0, 0, 1, 0].map((b, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md font-mono text-sm font-bold",
                      b ? "bg-signal-500 text-ink-950" : "bg-white/10 text-ink-400",
                    )}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-bit-500/30 bg-bit-500/10 p-3">
                <p className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide text-bit-400 uppercase">
                  <NotebookPen className="size-3" />
                  Teacher note
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-200">
                  Ask the room for a two-state object before revealing the answer —
                  a light switch, a coin, a yes/no. Then reveal the place values.
                </p>
              </div>
              <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-ink-500">
                <span className="rounded border border-white/15 px-1.5 py-0.5">←</span>
                <span className="rounded border border-white/15 px-1.5 py-0.5">→</span>
                move stage · <span className="rounded border border-white/15 px-1.5 py-0.5">R</span> reveal
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">
                Launch to Class — see the room without walking it
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
                Push a lesson to every student at once. The board updates as they
                work, so you spend the period with the students who need you
                instead of reading over shoulders.
              </p>
            </div>
            <DemoChip label="Illustrative board" />
          </div>

          <div className="mt-5 rounded-lg border border-ink-100 bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink-50 pb-3">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-800">
                <Users className="size-4 text-ink-400" />
                Grade 6 · Section A
              </p>
              {(Object.keys(stateMeta) as (keyof typeof stateMeta)[]).map((k) => {
                const meta = stateMeta[k];
                const count = roster.filter((s) => s.state === k).length;
                return (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 text-[12.5px] text-ink-500"
                  >
                    <meta.icon
                      className={cn(
                        "size-3.5",
                        k === "done" && "text-mint-500",
                        k === "working" && "text-brand-500",
                        k === "help" && "text-amber-500",
                        k === "idle" && "text-ink-300",
                      )}
                    />
                    {meta.label}
                    <span className="tnum font-mono font-semibold text-ink-700">
                      {count}
                    </span>
                  </span>
                );
              })}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {roster.map((s) => {
                const meta = stateMeta[s.state];
                return (
                  <li
                    key={s.name}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-2",
                      meta.cls,
                    )}
                  >
                    <meta.icon className="size-3.5 shrink-0" />
                    <span className="truncate text-[13px] font-medium">{s.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
            A student who taps <strong className="font-semibold text-ink-700">“I need help”</strong>{" "}
            moves to the top of the board with the exact stage and question they are
            on — you arrive already knowing what went wrong.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Analytics that name the problem
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Numbers are only useful if they tell you what to do on Monday. Every
          class view ends in an action.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {analytics.map((a) => (
            <div
              key={a.title}
              className="flex gap-4 rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <a.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-[15px] font-semibold text-ink-900">
                  {a.title}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                  {a.line}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-lg bg-bit-100 text-bit-700">
              <ClipboardList className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-lg font-bold text-ink-900">
              The lesson kit
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
              Open any lesson in the curriculum browser and everything you would
              have had to build yourself is already attached.
            </p>
            <ul className="mt-4 space-y-2 border-t border-ink-50 pt-4">
              {[
                { icon: ListChecks, t: "Learning objectives and the competencies they map to" },
                { icon: KeyRound, t: "Answer key with the accepted alternatives for every question" },
                { icon: NotebookPen, t: "Teacher guide: overview, tips, common misconceptions" },
                { icon: Timer, t: "Estimated minutes per stage, so you can plan the period" },
                { icon: Flame, t: "Required hardware or software flagged before the bell rings" },
              ].map((x) => (
                <li key={x.t} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-600">
                  <x.icon className="mt-0.5 size-4 shrink-0 text-ink-400" />
                  {x.t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <NotebookPen className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-lg font-bold text-ink-900">
              Teacher notes, in place
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
              Notes are authored as blocks inside the lesson itself, next to the
              content they refer to. They render for teachers and authors — never
              for a student account, in the app or in Teach Mode.
            </p>
            <div className="mt-4 rounded-lg border border-l-4 border-ink-100 border-l-bit-500 bg-ink-50/60 p-3">
              <p className="font-mono text-[10.5px] tracking-wide text-bit-700 uppercase">
                Teacher note · Networks, stage 4
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                Students often wire every device to every other device. Let the
                Network Lab fail once, then ask what a switch is for. The mistake
                teaches the concept faster than the explanation does.
              </p>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
              Because notes are content blocks, an updated note reaches every
              teacher the moment the lesson is republished.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          A typical lesson with ZERO1
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          One 45–60 minute period, from preparation to diagnosis.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {timeline.map((phase, pi) => (
            <div key={phase.phase} className="relative">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "tnum flex size-7 items-center justify-center rounded-full font-mono text-[12px] font-bold text-white",
                    toneCls[phase.tone],
                  )}
                >
                  {pi + 1}
                </span>
                <h3 className="font-display text-[15px] font-bold text-ink-900">
                  {phase.phase}
                </h3>
              </div>
              <ol className="mt-3 ml-3.5 space-y-3 border-l border-ink-100 pl-5">
                {phase.steps.map((s) => (
                  <li
                    key={s}
                    className="relative text-[13.5px] leading-relaxed text-ink-600"
                  >
                    <span
                      className="absolute top-2 -left-[23px] size-1.5 rounded-full bg-ink-200"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Try the Teacher Hub with your own class
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              A demo walks through one full lesson: Teach Mode, launch, and the
              analytics that come back.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Request a demo
            </Button>
            <Button href="/curriculum" variant="secondary">
              Browse the curriculum
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
