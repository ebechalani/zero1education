import { BinaryPattern } from "@/components/brand/binary-pattern";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CATALOG } from "@/content/curriculum";
import { WORLDS } from "@/lib/worlds";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileWarning,
  FlaskConical,
  Gauge,
  MessageSquareOff,
  Minus,
  Route,
  UserX,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why ZERO1 exists: a full Grade 0–12 ICT curriculum rebuilt as software. The book provides the curriculum. ZERO1 provides the experience.",
};

const problems = [
  {
    icon: FileWarning,
    title: "A PDF is not a lesson",
    body: "Most “digital” textbooks are page images on a screen. They keep every limitation of paper and add none of the advantages of software.",
  },
  {
    icon: MessageSquareOff,
    title: "Reading is not doing",
    body: "A student reads that a computer stores everything as 0s and 1s, then is asked to recall it. Nothing on the page ever responds to them.",
  },
  {
    icon: Gauge,
    title: "Feedback arrives too late",
    body: "The misconception is discovered while marking, a week after the lesson — long after the moment it could have been fixed.",
  },
  {
    icon: UserX,
    title: "Teachers are left to improvise",
    body: "The book supplies content, not a way to run the room: no presentation mode, no live view of who is stuck, no diagnosis.",
  },
];

const approach = [
  {
    icon: Route,
    title: "Mission-based learning",
    lead: "Every lesson is a mission with seven stages, not a chapter to read.",
    items: [
      "Discover — a hook that makes the idea matter",
      "Learn — the explanation, in typed content blocks",
      "Try It — guided practice with hints, low stakes",
      "Lab — the hands-on simulation",
      "Challenge — one harder combined task",
      "Checkpoint — a short mastery check",
      "Create — the student makes something of their own",
    ],
  },
  {
    icon: FlaskConical,
    title: "ZERO1 Labs",
    lead: "Abstract concepts become objects you can manipulate.",
    items: [
      "Flip real bits and watch the decimal number change",
      "Assemble a computer until the system actually boots",
      "Program a rover with blocks and watch it execute",
      "Wire switches and routers into a network that works",
      "Judge a suspicious inbox before it judges you",
      "Toggle AND, OR and XOR gates and read the truth table",
    ],
  },
  {
    icon: Check,
    title: "Competency mastery",
    lead: "Progress is measured as skills, not as pages turned.",
    items: [
      "Every activity reports against a named competency",
      "Skill levels accumulate in the ZERO1 Digital Passport",
      "The passport carries across grades — and across worlds",
      "Teachers see mastery by topic, not just a score column",
      "Work students create stays in a portfolio that grows",
    ],
  },
];

const comparison: { dimension: string; typical: string; zero1: string }[] = [
  {
    dimension: "Content",
    typical: "Scanned or re-typed pages",
    zero1: "Typed content blocks rendered by one engine, G0–12",
  },
  {
    dimension: "Interaction",
    typical: "Turn the page",
    zero1: "Seven mission stages with activities, labs and a checkpoint",
  },
  {
    dimension: "Feedback",
    typical: "Answers at the back",
    zero1: "Attempt-aware hints, explanation revealed after the attempt",
  },
  {
    dimension: "Evidence of learning",
    typical: "A mark in a notebook",
    zero1: "Competency levels in the Digital Passport + a real portfolio",
  },
  {
    dimension: "Teacher tooling",
    typical: "None",
    zero1: "Teach Mode, Launch to Class, analytics, lesson kits, answer keys",
  },
  {
    dimension: "Printed book",
    typical: "A separate product",
    zero1: "The same curriculum, linked by stable QR codes",
  },
];

export default function AboutPage() {
  const totalUnits = CATALOG.length;
  const bookUnits = CATALOG.filter((u) => u.bookRef).length;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-2 sm:px-6 lg:px-8">
        <Chip tone="brand">About ZERO1</Chip>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
          A whole ICT curriculum, rebuilt as software
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          ZERO1 Education started from a written Grade&nbsp;0–12 ICT curriculum by{" "}
          <strong className="font-semibold text-ink-700">Eddy Bachaalany</strong> and
          the printed 2023 edition built on it. The books already worked in
          classrooms. What was missing was everything a screen can do that paper
          cannot.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 py-10 sm:px-10 sm:py-14">
          <BinaryPattern
            className="absolute inset-0 h-full w-full"
            tone="light"
            seed={7}
            cols={30}
            rows={12}
          />
          <div className="relative max-w-3xl">
            <p className="font-mono text-[11px] tracking-[0.18em] text-signal-400 uppercase">
              The founding principle
            </p>
            <p className="font-display mt-3 text-2xl leading-snug font-bold text-white sm:text-[30px] sm:leading-[1.25]">
              The book provides the curriculum.
              <br />
              <span className="text-signal-400">
                ZERO1 provides the experience.
              </span>
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-300">
              Curriculum is data, never interface. Lessons are trees of typed
              blocks that one renderer turns into a student mission, a projector
              deck for the teacher, and an editable document in the authoring
              studio. That single decision is what makes {totalUnits} units across
              thirteen grades possible without rewriting the product per grade.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          What a digital textbook usually gets wrong
        </h2>
        <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {problems.map((p) => (
            <div key={p.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-coral-100 text-coral-700">
                <p.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-[15px] font-semibold text-ink-900">
                  {p.title}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          The ZERO1 approach
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Three ideas carry the whole platform. Everything else — the worlds, the
          passport, the teacher hub — is a consequence of them.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {approach.map((a) => (
            <div
              key={a.title}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
                <a.icon className="size-5" />
              </span>
              <h3 className="font-display mt-3.5 text-base font-bold text-ink-900">
                {a.title}
              </h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                {a.lead}
              </p>
              <ul className="mt-4 space-y-2 border-t border-ink-50 pt-4">
                {a.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink-600"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Four learning worlds, one platform
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          A six-year-old and a seventeen-year-old should not meet the same
          interface. Worlds are a theming and density layer over identical
          engines — accent colour, type scale, spacing, and voice change; the
          product does not fork.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(WORLDS).map((w) => (
            <div
              key={w.id}
              className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card"
            >
              <div className="h-1.5" style={{ background: w.accent }} />
              <div className="p-5">
                <p
                  className="font-mono text-[11px] font-semibold tracking-wide uppercase"
                  style={{ color: w.accentText }}
                >
                  {w.grades}
                </p>
                <h3 className="font-display mt-1 text-[17px] font-bold text-ink-900">
                  {w.name}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
                  {w.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          What actually makes it different
        </h2>
        <div className="mt-5 overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-400 uppercase">
                  Dimension
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-400 uppercase">
                  Typical digital textbook
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-400 uppercase">
                  ZERO1
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.dimension} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 text-[13.5px] font-semibold text-ink-800">
                    {row.dimension}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] text-ink-400">
                    <span className="flex gap-2">
                      <Minus className="mt-0.5 size-3.5 shrink-0" />
                      {row.typical}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13.5px] text-ink-700">
                    <span className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
                      {row.zero1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-lg border border-ink-100 bg-white p-6 shadow-card lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          <div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-bit-100 text-bit-700">
              <BookOpen className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-xl font-bold text-ink-900">
              Written for real classrooms first
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              The scope was not invented for a product launch. It was written,
              taught, printed and revised as a school ICT programme — Kindergarten
              through Grade 12, from a first mouse click to PHP, MySQL and Arduino
              projects. ZERO1 keeps that scope intact and rebuilds the delivery
              around it, unit by unit, through the ZERO1 Studio authoring tools.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-500">
              The Grade&nbsp;6 unit{" "}
              <strong className="font-semibold text-ink-700">
                “Inside the Digital World”
              </strong>{" "}
              is the first unit fully converted into interactive missions: five
              lessons covering computer systems, binary, algorithms, networks and
              cybersecurity. It is the reference implementation every other unit is
              being converted against.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-ink-100 lg:grid-cols-1">
            {[
              { k: "Grades covered", v: "0–12", hint: "KG through Grade 12" },
              { k: "Units in scope", v: String(totalUnits), hint: "the full catalog" },
              {
                k: "From the printed edition",
                v: String(bookUnits),
                hint: "units carrying a chapter reference",
              },
              { k: "Learning worlds", v: "4", hint: "Explorer → Innovator" },
            ].map((s) => (
              <div key={s.k} className="bg-white p-4">
                <dt className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  {s.k}
                </dt>
                <dd className="tnum font-mono text-2xl font-semibold text-ink-900">
                  {s.v}
                </dd>
                <p className="text-[12px] text-ink-400">{s.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              See the whole scope for yourself
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Every grade, every unit, and exactly which ones are interactive today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/curriculum" iconRight={<ArrowRight />}>
              Browse the curriculum
            </Button>
            <Button href="/contact" variant="secondary">
              Request a demo
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
