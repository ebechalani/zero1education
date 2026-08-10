import { Button } from "@/components/ui/button";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { CATALOG } from "@/content/curriculum";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bot,
  CircuitBoard,
  ClipboardList,
  Cpu,
  Download,
  FileText,
  Grid3x3,
  KeyRound,
  Languages,
  MonitorPlay,
  NotebookPen,
  Printer,
  RefreshCw,
  Wind,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Teacher guides, answer keys, worksheets, project briefs, lesson kits and Teach Mode decks — plus robotics and physical computing support. Honest about what ships today.",
};

type Status = "available" | "building" | "planned";

const statusMeta: Record<Status, { label: string; tone: ChipTone }> = {
  available: { label: "Available today", tone: "mint" },
  building: { label: "In progress", tone: "amber" },
  planned: { label: "Planned", tone: "neutral" },
};

const resources: {
  icon: typeof FileText;
  name: string;
  what: string;
  status: Status;
  note: string;
}[] = [
  {
    icon: ClipboardList,
    name: "Lesson kits",
    what: "Everything attached to one lesson: objectives, competencies, stage timings, required hardware and the teacher guide.",
    status: "available",
    note: "For every published unit",
  },
  {
    icon: NotebookPen,
    name: "Teacher guides",
    what: "Lesson overview, teaching tips, the misconceptions students actually arrive with, and how to handle them.",
    status: "available",
    note: "Authored per lesson",
  },
  {
    icon: KeyRound,
    name: "Answer keys",
    what: "Correct answers with accepted alternatives and the explanation shown to students afterwards.",
    status: "available",
    note: "Generated from the questions themselves",
  },
  {
    icon: MonitorPlay,
    name: "Teach Mode decks",
    what: "A projector-ready presentation of any published lesson with reveal controls, a timer and teacher notes.",
    status: "available",
    note: "No slide deck to build",
  },
  {
    icon: Grid3x3,
    name: "Class analytics",
    what: "Mastery by topic, hardest-question diagnosis, skill heatmap and suggested next actions.",
    status: "available",
    note: "Updates as students work",
  },
  {
    icon: FileText,
    name: "Project briefs & rubrics",
    what: "Create-stage briefs with deliverables, submission types and the criteria used to assess them.",
    status: "available",
    note: "Published alongside their unit",
  },
  {
    icon: Printer,
    name: "Printable worksheets",
    what: "Offline practice pages that mirror the Try It stage, for classes without one device per student.",
    status: "building",
    note: "Grade 6 first, then by unit",
  },
  {
    icon: ClipboardList,
    name: "Scheme of work & pacing",
    what: "Term-by-term planning documents mapping units to weeks for a school's own timetable.",
    status: "planned",
    note: "After the next conversion wave",
  },
  {
    icon: Languages,
    name: "Additional languages",
    what: "Interface and content localisation beyond English.",
    status: "planned",
    note: "Architecture ready, content not yet translated",
  },
];

const gradeLabel = (nums: number[]) => {
  if (nums.length === 0) return "—";
  const name = (n: number) => (n === 0 ? "KG" : String(n));
  const first = nums[0];
  const last = nums[nums.length - 1];
  return nums.length === 1
    ? `Grade ${name(first)}`
    : `Grades ${name(first)}–${name(last)}`;
};

/** Grades where a hardware platform appears, read from the real catalog. */
const gradesForUnits = (keywords: string[]) => {
  const nums = new Set<number>();
  for (const unit of CATALOG) {
    if (keywords.some((k) => unit.id.includes(k))) {
      nums.add(Number(unit.gradeId.slice(1)));
    }
  }
  return [...nums].sort((a, b) => a - b);
};

const hardware = [
  {
    icon: CircuitBoard,
    name: "BBC micro:bit",
    grades: gradeLabel(gradesForUnits(["microbit", "makecode"])),
    what: "The 25-LED matrix, buttons, sensors and radio — the bridge from blocks to real hardware.",
    covered: [
      "MakeCode units from Grade 3 upward, taught in the printed edition",
      "Grade 6 Chapter 1 is fully scoped as ten interactive lessons",
      "Programs are written in MakeCode and flashed to the device as usual",
    ],
  },
  {
    icon: Bot,
    name: "mBot2 & robotics",
    grades: gradeLabel(gradesForUnits(["mbot2", "robotics"])),
    what: "Build, wire and program robots that sense and react — from first movements to autonomous routines.",
    covered: [
      "Robotics units run from Grade 2 through Grade 9",
      "mBot2 with CyberPi carries the upper-grade robotics work",
      "Lesson content, briefs and assessment live in ZERO1; coding happens in the vendor environment",
    ],
  },
  {
    icon: Cpu,
    name: "Arduino",
    grades: gradeLabel(gradesForUnits(["arduino"])),
    what: "Circuits, inputs and actuators: buttons, LDRs, PWM, ultrasonic sensors, servos, relays and serial.",
    covered: [
      "Arduino appears from Grade 7 and runs to the Grade 12 project chapters",
      "Grade 9 uses Tinkercad so a class can work without physical kits",
      "Grade 12 splits into Inputs & Signals and Actuators & Projects, ending in the smart-plant build",
    ],
  },
  {
    icon: Wind,
    name: "Kitronik air quality board",
    grades: "Add-on for micro:bit units",
    what: "Environmental sensing on top of the micro:bit: air quality, temperature, humidity and pressure logging.",
    covered: [
      "Used for data-collection projects that pair physical computing with the data units",
      "Supported as classroom hardware; lesson content follows the micro:bit conversion schedule",
    ],
  },
];

const delivery = [
  {
    icon: RefreshCw,
    t: "Always the current version",
    d: "Resources are not files a school downloads once. They are rendered from the published lesson, so a corrected answer key reaches every teacher immediately.",
  },
  {
    icon: Download,
    t: "Printable where it matters",
    d: "Answer keys, project briefs and worksheets are laid out to print cleanly for classes that work on paper.",
  },
  {
    icon: KeyRound,
    t: "Role-gated by design",
    d: "Guides, notes and answer keys render for teacher and admin accounts only — never inside a student session or in Teach Mode's student-facing view.",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <Chip tone="brand">Teacher & school resources</Chip>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
          What you actually get with a licence
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Resources are attached to lessons, not filed in a folder somewhere. Below
          is the complete list, with an honest status against each one — what ships
          today, what is being built, and what is still planned.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            Status key
          </span>
          {(Object.keys(statusMeta) as Status[]).map((s) => (
            <Chip key={s} tone={statusMeta[s].tone}>
              {statusMeta[s].label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
          {resources.map((r) => (
            <div
              key={r.name}
              className={cn(
                "flex flex-col gap-2 border-b border-ink-50 px-4 py-4 last:border-0 sm:flex-row sm:items-start sm:gap-5",
                r.status === "planned" && "bg-ink-50/40",
              )}
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-56">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    r.status === "available"
                      ? "bg-mint-100 text-mint-700"
                      : r.status === "building"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-ink-100 text-ink-400",
                  )}
                >
                  <r.icon className="size-4.5" />
                </span>
                <h2 className="font-display text-[14.5px] font-semibold text-ink-900">
                  {r.name}
                </h2>
              </div>
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-500">
                {r.what}
                <span className="mt-0.5 block text-[12px] text-ink-400">
                  {r.note}
                </span>
              </p>
              <div className="shrink-0 sm:w-32 sm:text-right">
                <Chip tone={statusMeta[r.status].tone}>
                  {statusMeta[r.status].label}
                </Chip>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Robotics & physical computing
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          The curriculum has always been hands-on with hardware. Grade coverage
          below is read straight from the curriculum catalog.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {hardware.map((h) => (
            <div
              key={h.name}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
                  <h.icon className="size-5" />
                </span>
                <span className="font-mono text-[11.5px] text-ink-400">
                  {h.grades}
                </span>
              </div>
              <h3 className="font-display mt-3.5 text-base font-bold text-ink-900">
                {h.name}
              </h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                {h.what}
              </p>
              <ul className="mt-3.5 space-y-1.5 border-t border-ink-50 pt-3.5">
                {h.covered.map((c) => (
                  <li
                    key={c}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink-600"
                  >
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal-400"
                      aria-hidden
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-100/60 px-4 py-3 text-[13px] leading-relaxed text-ink-700">
          <strong className="font-semibold">Where the line is drawn:</strong> ZERO1
          supplies the lesson content, briefs, assessment and progress tracking for
          hardware units. Programming the boards still happens in their own
          environments — MakeCode, mBlock, the Arduino IDE or Tinkercad. An
          in-platform block editor for robotics is on the roadmap, not in the build.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-ink-900">
            How resources reach the teacher
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {delivery.map((d) => (
              <div
                key={d.t}
                className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
              >
                <d.icon className="size-5 text-brand-600" />
                <h3 className="font-display mt-3 text-[14.5px] font-semibold text-ink-900">
                  {d.t}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  {d.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Want to see a lesson kit in full?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-500">
              We will walk through one published unit end to end — guide, answer
              key, Teach Mode deck and the analytics it produces.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Request a demo
            </Button>
            <Button href="/for-teachers" variant="secondary">
              Teacher Hub
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
