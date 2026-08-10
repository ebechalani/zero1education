import { BinaryPattern } from "@/components/brand/binary-pattern";
import { DemoChip } from "@/components/brand/demo-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CATALOG } from "@/content/curriculum/catalog";
import { cn, mulberry32 } from "@/lib/utils";
import { WORLDS, type WorldInfo } from "@/lib/worlds";
import type { World } from "@/types/content";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FlaskConical,
  Library,
  MousePointerClick,
  PenTool,
  Presentation,
  QrCode,
  Radio,
  Route,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { HeroDemo } from "./_components/hero-demo";
import { LabsShowcase } from "./_components/labs-showcase";

export const metadata: Metadata = {
  title: "From Digital Learners to Digital Creators",
  description:
    "ZERO1 Education turns the printed ICT & Computer Science curriculum into interactive missions, hands-on labs and a Digital Passport — Grade 0 (KG) through Grade 12.",
};

const TAGLINE = ["Learn", "Explore", "Code", "Create"];

const WORLD_TOPICS: Record<World, string[]> = {
  explorer: [
    "Knowing My Computer",
    "Using My Keyboard",
    "Coding with Algorithms",
    "ScratchJr",
  ],
  builder: [
    "Coding with Scratch",
    "MakeCode for micro:bit",
    "Robotics with mBot2",
    "Word, PowerPoint & Excel",
  ],
  creator: ["Inside the Digital World", "HTML", "Python", "Photoshop"],
  innovator: [
    "Coding with Python",
    "Managing Databases with MySQL",
    "Arduino",
    "PHP for Interactive Websites",
  ],
};

/** Same structure, different posture — see DESIGN-SYSTEM.md §8. */
const WORLD_POSTURE: Record<
  World,
  { pad: string; title: string; topic: string; posture: string }
> = {
  explorer: {
    pad: "p-6",
    title: "text-xl",
    topic: "text-[14.5px] py-2",
    posture: "Playful · big targets, icons, audio",
  },
  builder: {
    pad: "p-6",
    title: "text-lg",
    topic: "text-[14px] py-2",
    posture: "Guided · sequences, blocks, characters",
  },
  creator: {
    pad: "p-5",
    title: "text-[17px]",
    topic: "text-[13.5px] py-1.5",
    posture: "Balanced · real tools, strong scaffolding",
  },
  innovator: {
    pad: "p-5",
    title: "text-[16px]",
    topic: "text-[13px] py-1",
    posture: "Professional · dense, IDE-like",
  },
};

const WORLD_NOTE: Partial<Record<World, string>> = {
  creator:
    "Grade 6 · “Inside the Digital World” is fully interactive today — five mission lessons.",
};

const MISSION_STEPS: { name: string; icon: LucideIcon; text: string }[] = [
  {
    name: "Discover",
    icon: Compass,
    text: "A hook — a question or scene that makes the concept worth knowing.",
  },
  {
    name: "Learn",
    icon: BookOpen,
    text: "The concept itself: text, diagrams, definitions and worked examples.",
  },
  {
    name: "Try It",
    icon: MousePointerClick,
    text: "Guided practice with hints and instant feedback on every attempt.",
  },
  {
    name: "ZERO1 Lab",
    icon: FlaskConical,
    text: "A simulation where the idea becomes something you operate yourself.",
  },
  {
    name: "Challenge",
    icon: Target,
    text: "An applied task with a goal — the concept used, not just recalled.",
  },
  {
    name: "Checkpoint",
    icon: ClipboardCheck,
    text: "A short mastery check that updates the student's Digital Passport.",
  },
  {
    name: "Create",
    icon: PenTool,
    text: "The student makes something of their own and it enters the portfolio.",
  },
];

const STUDENT_POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Route,
    title: "Missions, not chapters",
    text: "Every lesson runs as a seven-stage mission the student moves through — stages unlock as they go.",
  },
  {
    icon: FlaskConical,
    title: "ZERO1 Labs",
    text: "Flip bits, assemble a computer, program a rover, wire a network, judge a phishing inbox.",
  },
  {
    icon: Zap,
    title: "XP, levels, badges, streak",
    text: "Progress is earned by doing. Levels carry a binary easter egg — Level 5 reads 101₂.",
  },
  {
    icon: BadgeCheck,
    title: "Passport & portfolio",
    text: "Skills mastered follow the student between grades; every Create stage adds work to their portfolio.",
  },
];

const TEACHER_POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Presentation,
    title: "Teach Mode",
    text: "Any lesson, full-screen for the projector — same content, teaching chrome, arrow keys to advance.",
  },
  {
    icon: Radio,
    title: "Launch to Class",
    text: "Push a lesson, lab or challenge to every device at once and watch a live status board.",
  },
  {
    icon: BarChart3,
    title: "Class analytics",
    text: "Skill heatmaps, question-level analysis and per-student progress across a whole unit.",
  },
  {
    icon: Library,
    title: "Curriculum & answer keys",
    text: "Browse grade → unit → lesson with objectives, teacher notes and answer keys attached.",
  },
];

const PASSPORT_SAMPLE: { skill: string; category: string; bits: number }[] = [
  { skill: "Binary Representation", category: "Data", bits: 8 },
  { skill: "Sequencing", category: "Algorithms", bits: 6 },
  { skill: "Network Devices", category: "Networks", bits: 5 },
  { skill: "Threat Recognition", category: "Cybersecurity", bits: 3 },
];

function masteryLabel(bits: number) {
  if (bits >= 8) return { label: "Mastered", tone: "mint" as const };
  if (bits >= 6) return { label: "Proficient", tone: "signal" as const };
  if (bits >= 3) return { label: "Developing", tone: "bit" as const };
  return { label: "Started", tone: "neutral" as const };
}

function unitCount(world: WorldInfo) {
  return CATALOG.filter((unit) =>
    world.gradeNumbers.includes(Number(unit.gradeId.slice(1))),
  ).length;
}

function Section({
  children,
  className,
  dark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={cn(
        "border-t",
        dark ? "border-white/5" : "border-ink-100",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {children}
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  description,
  action,
  dark,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p
          className={cn(
            "font-mono text-[11px] tracking-[0.25em] uppercase",
            dark ? "text-signal-400" : "text-brand-600",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "font-display mt-2.5 text-3xl font-bold sm:text-4xl",
            dark ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-3 text-[15px] leading-relaxed",
              dark ? "text-ink-300" : "text-ink-500",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Static 8-segment bit bar — the presentational half of ProgressBits. */
function BitBar({ filled }: { filled: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-3.5 rounded-[2px]",
            i < filled ? "bg-signal-500" : "bg-ink-100",
          )}
        />
      ))}
    </span>
  );
}

/** Decorative stand-in for the QR code printed beside a book activity. */
function QrGlyph() {
  const rand = mulberry32(6120);
  const modules = 13;
  const inFinder = (x: number, y: number) =>
    (x < 4 && y < 4) || (x > modules - 5 && y < 4) || (x < 4 && y > modules - 5);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (inFinder(x, y) || rand() > 0.5) continue;
      cells.push({ x, y });
    }
  }
  return (
    <svg
      viewBox={`-1 -1 ${modules + 2} ${modules + 2}`}
      className="size-28 shrink-0 rounded-md bg-white shadow-card"
      role="img"
      aria-label="Illustration of a QR code printed in a ZERO1 book"
    >
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x}
          y={c.y}
          width="1"
          height="1"
          fill="#0b1120"
        />
      ))}
      {[
        [0, 0],
        [modules - 3, 0],
        [0, modules - 3],
      ].map(([x, y]) => (
        <Fragment key={`${x}-${y}`}>
          <rect
            x={x + 0.25}
            y={y + 0.25}
            width="2.5"
            height="2.5"
            fill="none"
            stroke="#0b1120"
            strokeWidth="0.5"
          />
          <rect x={x + 1} y={y + 1} width="1" height="1" fill="#3d63ff" />
        </Fragment>
      ))}
    </svg>
  );
}

export default function HomePage() {
  const worlds = Object.values(WORLDS);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ink-950">
        <BinaryPattern
          tone="light"
          seed={3}
          cols={44}
          rows={18}
          className="absolute inset-0 h-full w-full"
        />
        <div
          className="pointer-events-none absolute top-[-20rem] left-1/2 h-[42rem] w-[64rem] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(61,99,255,0.38), rgba(61,99,255,0))",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-14 sm:px-6 lg:px-8 lg:pt-24 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Chip
                tone="ink"
                className="border border-white/10 font-mono tracking-wide"
              >
                Grade 0 → Grade 12 · ICT &amp; Computer Science
              </Chip>
              <h1 className="font-display mt-5 text-5xl leading-[1.04] font-bold text-white sm:text-6xl xl:text-7xl">
                From Digital Learners to{" "}
                <span className="text-signal-400">Digital Creators.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                Interactive ICT &amp; Computer Science education from Grade 0 to
                Grade 12.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  href="/curriculum"
                  size="lg"
                  iconRight={<ArrowRight />}
                >
                  Explore ZERO1
                </Button>
                <Button href="/for-schools" size="lg" variant="inverse">
                  For Schools
                </Button>
                <Button
                  href="/contact"
                  size="lg"
                  variant="ghost"
                  className="text-ink-300 hover:bg-white/10 hover:text-white"
                >
                  Request Demo
                </Button>
              </div>
            </div>

            <div className="lg:pl-4">
              <HeroDemo />
            </div>
          </div>

          <p className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-8 font-mono text-sm font-medium tracking-[0.32em] text-ink-200 uppercase">
            {TAGLINE.map((word, i) => (
              <Fragment key={word}>
                {i > 0 && (
                  <span className="text-signal-400/70" aria-hidden>
                    {i % 2 === 0 ? "0" : "1"}
                  </span>
                )}
                <span>{word}</span>
              </Fragment>
            ))}
          </p>
        </div>
      </section>

      {/* ── Statement band ─────────────────────────────────────────────── */}
      <Section className="bg-paper">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
          <h2 className="font-display text-3xl leading-[1.15] font-bold text-ink-900 sm:text-[42px]">
            The book provides the curriculum.
            <br />
            <span className="text-brand-600">
              ZERO1 provides the experience.
            </span>
          </h2>
          <p className="text-[15.5px] leading-relaxed text-ink-500">
            ZERO1 is not a PDF of a textbook. Each unit becomes a mission a
            student actually performs: meet the idea, learn it, try it, operate
            it in a lab, take on a challenge, prove it in a checkpoint, then
            create something of their own. The printed books stay the spine of
            the course — the platform is where the thinking happens.
          </p>
        </div>
      </Section>

      {/* ── Four learning worlds ───────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead
          eyebrow="Four learning worlds"
          title="One platform that grows up with the student"
          description="Grade 0 through Grade 12 in a single product. Worlds are a theming and density layer — same engine, different posture, so a five-year-old and a Grade 12 student each meet an interface built for them."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {worlds.map((world) => {
            const posture = WORLD_POSTURE[world.id];
            const note = WORLD_NOTE[world.id];
            return (
              <article
                key={world.id}
                className="flex flex-col overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card"
              >
                <span
                  className="h-1.5 w-full shrink-0"
                  style={{ background: world.accent }}
                  aria-hidden
                />
                <div className={cn("flex flex-1 flex-col", posture.pad)}>
                  <span
                    className="w-fit rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                    style={{
                      background: world.accentSoft,
                      color: world.accentText,
                    }}
                  >
                    {world.grades}
                  </span>
                  <h3
                    className={cn(
                      "font-display mt-3 font-bold text-ink-900",
                      posture.title,
                    )}
                  >
                    {world.name}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
                    {world.tagline}
                  </p>

                  <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
                    {WORLD_TOPICS[world.id].map((topic) => (
                      <li
                        key={topic}
                        className={cn(
                          "flex items-center gap-2 text-ink-700",
                          posture.topic,
                        )}
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: world.accent }}
                          aria-hidden
                        />
                        {topic}
                      </li>
                    ))}
                  </ul>

                  {note && (
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">
                      {note}
                    </p>
                  )}

                  <p className="mt-auto pt-4 font-mono text-[11px] text-ink-400">
                    <span className="tnum text-ink-600">
                      {unitCount(world)}
                    </span>{" "}
                    units · {posture.posture}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ── The mission model ──────────────────────────────────────────── */}
      <Section className="relative isolate overflow-hidden bg-ink-900" dark>
        <BinaryPattern
          tone="light"
          seed={29}
          cols={44}
          rows={12}
          className="absolute inset-0 -z-10 h-full w-full"
        />
        <SectionHead
          dark
          eyebrow="The mission model"
          title="Every lesson is a mission with seven stages"
          description="The same shape for a Grade 1 drawing lesson and a Grade 12 database lesson. Students always know where they are, teachers always know what is next, and progress is recorded stage by stage."
        />
        <div className="relative">
          {/* the rail scrolls on wide screens — fade hints there is more */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-ink-900 to-transparent lg:block"
            aria-hidden
          />
          <div className="thin-scroll -mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            <ol className="flex flex-wrap gap-2 lg:min-w-max lg:flex-nowrap">
              {MISSION_STEPS.map((step, i) => (
                <li key={step.name} className="flex items-stretch gap-2">
                  <div className="flex w-full flex-col rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:w-56">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-md bg-white/10 text-signal-300">
                        <step.icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="tnum font-mono text-[11px] text-ink-500">
                        {(i + 1).toString(2).padStart(3, "0")}
                      </span>
                    </div>
                    <h3 className="font-display mt-3 text-[15px] font-semibold text-white">
                      {step.name}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
                      {step.text}
                    </p>
                  </div>
                  {i < MISSION_STEPS.length - 1 && (
                    <span
                      className="hidden items-center text-ink-600 lg:flex"
                      aria-hidden
                    >
                      <ChevronRight className="size-4" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ── ZERO1 Labs ─────────────────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead
          eyebrow="ZERO1 Labs"
          title="The concepts, as things you operate"
          description="A lab is a self-contained simulation registered by ID. Lessons reference labs, QR codes in the printed books deep-link to them, and students can open them freely from the lab gallery."
          action={
            <Button
              href="/labs"
              variant="secondary"
              size="lg"
              iconRight={<ArrowRight />}
            >
              All ZERO1 Labs
            </Button>
          }
        />
        <LabsShowcase />
      </Section>

      {/* ── For students / for teachers ────────────────────────────────── */}
      <Section className="bg-paper">
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            {
              eyebrow: "For students",
              title: "Learning you do, not learning you watch",
              points: STUDENT_POINTS,
              href: "/for-students",
              cta: "What students get",
              accent: "text-signal-600",
              iconBg: "bg-signal-100 text-signal-700",
            },
            {
              eyebrow: "For teachers",
              title: "A classroom cockpit, not another content library",
              points: TEACHER_POINTS,
              href: "/for-teachers",
              cta: "Inside the Teacher Hub",
              accent: "text-brand-600",
              iconBg: "bg-brand-100 text-brand-700",
            },
          ].map((col) => (
            <div
              key={col.eyebrow}
              className="flex flex-col rounded-lg border border-ink-100 bg-white p-6 shadow-card lg:p-8"
            >
              <p
                className={cn(
                  "font-mono text-[11px] tracking-[0.25em] uppercase",
                  col.accent,
                )}
              >
                {col.eyebrow}
              </p>
              <h3 className="font-display mt-2.5 text-2xl font-bold text-ink-900">
                {col.title}
              </h3>
              <ul className="mt-6 flex-1 space-y-5">
                {col.points.map((point) => (
                  <li key={point.title} className="flex gap-3.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        col.iconBg,
                      )}
                    >
                      <point.icon className="size-[18px]" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[14.5px] font-semibold text-ink-900">
                        {point.title}
                      </p>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-500">
                        {point.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button
                  href={col.href}
                  variant="secondary"
                  iconRight={<ArrowRight />}
                >
                  {col.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Digital Passport & portfolio ───────────────────────────────── */}
      <Section className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
          <div>
            <p className="font-mono text-[11px] tracking-[0.25em] text-brand-600 uppercase">
              Digital Passport &amp; portfolio
            </p>
            <h2 className="font-display mt-2.5 text-3xl font-bold text-ink-900 sm:text-4xl">
              Mastery is a competency, not a score
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">
              XP, levels and streaks make progress feel good. The Digital
              Passport makes it mean something. Every checkpoint, lab and
              challenge updates a competency in the ZERO1 skills framework —
              things like Binary Representation, Sequencing, Network Devices and
              Threat Recognition — and those competencies travel with the
              student from Grade 0 to Grade 12, across teachers and across
              books.
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-500">
              The portfolio keeps the evidence: every Create stage produces
              something the student made, stored alongside the brief it
              answered. At the end of a year there is a body of work, not a
              percentage.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/curriculum" variant="secondary">
                See the skills framework
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <div className="border-b border-ink-100 pb-3">
              <h3 className="font-display text-[15px] font-semibold text-ink-900">
                ZERO1 Digital Passport
              </h3>
              <div className="mt-2">
                <DemoChip label="Example view" />
              </div>
            </div>
            <ul className="divide-y divide-ink-100">
              {PASSPORT_SAMPLE.map((row) => {
                const mastery = masteryLabel(row.bits);
                return (
                  <li key={row.skill} className="py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[14px] font-semibold text-ink-900">
                        {row.skill}
                      </p>
                      <span className="tnum font-mono text-xs text-ink-400">
                        {row.bits}/8
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] tracking-wide text-ink-400 uppercase">
                      {row.category}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <BitBar filled={row.bits} />
                      <Chip tone={mastery.tone}>{mastery.label}</Chip>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-ink-100 pt-3 text-[12.5px] leading-relaxed text-ink-400">
              Bits filled show mastery of a competency. Real passports are built
              from a student&apos;s own checkpoint and lab results.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Book integration ───────────────────────────────────────────── */}
      <Section className="bg-paper">
        <SectionHead
          eyebrow="Book integration"
          title="The printed page opens the platform"
          description="The printed books carry QR codes beside the activities they belong to. Scanning one lands the student on exactly the right lab, lesson, challenge or checkpoint — no searching, no account hunting."
        />
        <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card lg:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[auto_auto_1fr] lg:gap-8">
            <div className="flex items-center gap-5">
              <QrGlyph />
              <div>
                <p className="font-display text-[15px] font-semibold text-ink-900">
                  Grade 6 · Unit 1 · Lesson 2
                </p>
                <p className="mt-1 text-[13.5px] text-ink-500">
                  Printed beside the binary activity
                </p>
                <Chip tone="neutral" className="mt-2.5 font-mono">
                  <QrCode className="size-3" aria-hidden />
                  Scan
                </Chip>
              </div>
            </div>

            <div
              className="flex items-center justify-center text-ink-300 lg:px-2"
              aria-hidden
            >
              <ArrowRight className="size-5 rotate-90 lg:rotate-0" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
              <div className="rounded-md bg-ink-950 px-4 py-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-ink-500 uppercase">
                  Stable code
                </p>
                <p className="mt-1 font-mono text-[13px] break-all text-signal-300">
                  zero1.education/go/g6-u1-l2-lab
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-ink-100 bg-paper px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-ink-900 text-signal-400">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink-900">
                    Binary Lab opens
                  </p>
                  <p className="text-[12.5px] text-ink-500">
                    on the student&apos;s device
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-ink-100 pt-5 text-[13.5px] leading-relaxed text-ink-500">
            Codes resolve through a redirect table rather than encoding document
            IDs, so a book printed today still opens the right content after the
            curriculum is reorganised.
          </p>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ink-950">
        <BinaryPattern
          tone="light"
          seed={41}
          cols={40}
          rows={10}
          className="absolute inset-0 h-full w-full"
        />
        <div
          className="pointer-events-none absolute bottom-[-16rem] left-1/2 h-[32rem] w-[52rem] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(11,184,212,0.22), rgba(11,184,212,0))",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Bring ZERO1 to your school
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-ink-300">
                Walk through the curriculum, the labs and the Teacher Hub with
                us, or explore how ZERO1 fits alongside the books you already
                teach from.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/contact" size="xl" iconRight={<ArrowRight />}>
                Request Demo
              </Button>
              <Button href="/for-schools" size="xl" variant="inverse">
                For Schools
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
