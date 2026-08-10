import { BinaryPattern } from "@/components/brand/binary-pattern";
import { DemoChip } from "@/components/brand/demo-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ProgressBits } from "@/components/ui/progress";
import { SKILLS, SKILL_CATEGORIES } from "@/content/skills";
import { WORLDS } from "@/lib/worlds";
import type { SkillCategory } from "@/types/content";
import {
  ArrowRight,
  Award,
  Binary,
  BookMarked,
  Compass,
  Cpu,
  Flame,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Hammer,
  Lightbulb,
  Network,
  PenSquare,
  ShieldCheck,
  Target,
  ToggleLeft,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "What learning ZERO1 feels like: seven-stage missions, hands-on labs, a Digital Passport of real skills, and a portfolio that grows every year.",
};

const stages = [
  {
    icon: Compass,
    name: "Discover",
    line: "A hook, a question, a scene that makes you want the answer. No definitions yet.",
  },
  {
    icon: Lightbulb,
    name: "Learn",
    line: "The explanation itself — short, illustrated, with the key terms defined where you meet them.",
  },
  {
    icon: Target,
    name: "Try It",
    line: "Guided practice. Hints appear when you need them, never before your first attempt.",
  },
  {
    icon: FlaskConical,
    name: "Lab",
    line: "The hands-on part. You build, wire, flip and program the thing you just read about.",
  },
  {
    icon: Trophy,
    name: "Challenge",
    line: "One harder task that pulls the whole lesson together. This is where the real XP is.",
  },
  {
    icon: BookMarked,
    name: "Checkpoint",
    line: "A short mastery check, scored as bits filled — you see exactly which idea slipped.",
  },
  {
    icon: PenSquare,
    name: "Create",
    line: "Make something of your own. It goes straight into your portfolio, with your name on it.",
  },
];

const labs = [
  { icon: Binary, name: "Binary Lab", line: "Flip bits and watch the number change under your fingers." },
  { icon: Cpu, name: "Computer Lab", line: "Assemble a computer component by component until it boots." },
  { icon: GitBranch, name: "Algorithm Lab", line: "Program a rover with blocks, then watch it run your steps." },
  { icon: Network, name: "Network Lab", line: "Wire computers, switches and routers into a network that works." },
  { icon: ShieldCheck, name: "Cyber Lab", line: "Read a suspicious inbox and catch the phishing attempt." },
  { icon: ToggleLeft, name: "Logic Lab", line: "Toggle AND, OR and XOR gates and read the truth table you built." },
];

const portfolio = [
  {
    world: WORLDS.explorer,
    icon: Compass,
    items: ["First drawings and typed words", "ScratchJr scenes that move", "Step-by-step algorithms you invented"],
  },
  {
    world: WORLDS.builder,
    icon: Hammer,
    items: ["Scratch games with variables and events", "micro:bit programs running on real hardware", "Robot missions with sensors", "Documents, slides and first spreadsheets"],
  },
  {
    world: WORLDS.creator,
    icon: FlaskConical,
    items: ["Your first real web pages in HTML", "Animations and edited images", "Autonomous mBot2 routines", "Python programs that solve something"],
  },
  {
    world: WORLDS.innovator,
    icon: GraduationCap,
    items: ["Databases you designed and queried", "Dynamic sites with PHP and MySQL", "Arduino builds with sensors and actuators", "3D models and a graduation project"],
  },
];

const categoryOrder: SkillCategory[] = [
  "computer-systems",
  "data",
  "algorithms",
  "programming",
  "networks",
  "cybersecurity",
  "computational-thinking",
  "web",
  "robotics",
  "physical-computing",
  "digital-literacy",
  "creativity",
];

export default function ForStudentsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <Chip tone="signal">For students</Chip>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
              Learning that answers back
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
              You do not read about binary. You flip the bits. You do not read
              about networks. You wire one until the packet arrives. Every ZERO1
              lesson is a mission — and at the end of it, something you built is
              yours to keep.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/labs" iconRight={<ArrowRight />}>
                Explore the labs
              </Button>
              <Button href="/curriculum" variant="secondary">
                See your grade
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-6">
            <BinaryPattern
              className="absolute inset-0 h-full w-full"
              tone="light"
              seed={12}
              cols={20}
              rows={9}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.18em] text-signal-400 uppercase">
                  Mission progress
                </p>
                <DemoChip label="Example" />
              </div>
              <p className="font-display mt-3 text-lg font-bold text-white">
                Binary Numbers
              </p>
              <p className="mt-0.5 text-[13px] text-ink-300">
                Stage 4 of 7 · Lab
              </p>
              <ProgressBits value={57} className="mt-4" tone="signal" />
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10.5px] tracking-wide text-ink-400 uppercase">
                    Level
                  </p>
                  <p className="tnum font-mono text-lg font-semibold text-white">
                    5
                    <span className="ml-1 align-super text-[10px] text-signal-400">
                      101₂
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-wide text-ink-400 uppercase">
                    Streak
                  </p>
                  <p className="tnum font-mono text-lg font-semibold text-bit-400">
                    6d
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] tracking-wide text-ink-400 uppercase">
                    Mastery
                  </p>
                  <p className="tnum font-mono text-lg font-semibold text-mint-500">
                    82%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Every lesson is a mission with seven stages
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          The order never changes, so you always know where you are and what comes
          next. Stages unlock as you finish them — you cannot skip the doing to get
          to the score.
        </p>
        <ol className="mt-6 space-y-0">
          {stages.map((stage, i) => (
            <li key={stage.name} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
                  <stage.icon className="size-4.5" />
                </span>
                {i < stages.length - 1 && (
                  <span className="w-px flex-1 bg-ink-100" aria-hidden />
                )}
              </div>
              <div className="pb-6">
                <div className="flex items-baseline gap-2">
                  <span className="tnum font-mono text-[11px] text-ink-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[15px] font-bold text-ink-900">
                    {stage.name}
                  </h3>
                </div>
                <p className="mt-0.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
                  {stage.line}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="-mt-2 ml-13 flex items-center gap-2 text-[13.5px] text-ink-500">
          <Award className="size-4 text-bit-500" />
          Then the mission completes: XP awarded, skills updated, badge checked.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-ink-900">
            ZERO1 Labs — where the idea becomes an object
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
            Six labs are live today. They appear inside missions, and you can also
            open them any time from the lab gallery just to play.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <div
                key={lab.name}
                className="flex gap-3 rounded-lg border border-ink-100 bg-white p-4 shadow-card"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-signal-100 text-signal-700">
                  <lab.icon className="size-4.5" />
                </span>
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-ink-900">
                    {lab.name}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                    {lab.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-10">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">
              XP is momentum. Mastery is the point.
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              You earn XP, level up and build streaks — because coming back
              tomorrow is genuinely easier when something is counting with you.
              But none of that decides whether you have learned anything. Your
              skill levels do, and those only move when you get things right on
              your own.
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                {
                  icon: Flame,
                  t: "Streaks reward showing up",
                  d: "A day at a time, not an all-nighter.",
                },
                {
                  icon: Trophy,
                  t: "Badges mark real milestones",
                  d: "A finished unit, a perfect checkpoint, a skill mastered.",
                },
                {
                  icon: Target,
                  t: "Hints cost nothing but count for something",
                  d: "Using a hint is fine; the checkpoint is where mastery is measured.",
                },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <x.icon className="mt-0.5 size-4 shrink-0 text-bit-500" />
                  <p className="text-[13.5px] leading-relaxed text-ink-600">
                    <strong className="font-semibold text-ink-800">{x.t}</strong> —{" "}
                    {x.d}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[15px] font-bold text-ink-900">
                Your ZERO1 Digital Passport
              </h3>
              <Chip tone="brand">{SKILLS.length} competencies</Chip>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              One record of what you can actually do, built from every activity
              you complete. It follows you from KG to Grade 12 — it does not reset
              in September.
            </p>
            <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {categoryOrder.map((cat) => {
                const skills = SKILLS.filter((s) => s.category === cat);
                if (skills.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                      {SKILL_CATEGORIES[cat].label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-600">
                      {skills.map((s) => s.title).join(" · ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          A portfolio that grows year after year
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Everything you make in a Create stage or a project is kept. By the time
          you leave school you do not have a grade — you have a body of work.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portfolio.map((p) => (
            <div
              key={p.world.id}
              className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card"
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: p.world.accentSoft }}
              >
                <p.icon
                  className="size-4 shrink-0"
                  style={{ color: p.world.accentText }}
                />
                <div className="min-w-0">
                  <h3
                    className="font-display truncate text-[14px] font-bold"
                    style={{ color: p.world.accentText }}
                  >
                    {p.world.name.replace("ZERO1 ", "")}
                  </h3>
                  <p className="font-mono text-[11px] opacity-70" style={{ color: p.world.accentText }}>
                    {p.world.grades}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 p-4">
                {p.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink-600"
                  >
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ background: p.world.accent }}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Your school does not use ZERO1 yet?
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Show your ICT teacher the curriculum page — that is usually all it
              takes to start a conversation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/curriculum" iconRight={<ArrowRight />}>
              Open the curriculum
            </Button>
            <Button href="/for-teachers" variant="secondary">
              For teachers
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
