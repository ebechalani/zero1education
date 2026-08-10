import { BinaryPattern } from "@/components/brand/binary-pattern";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { skillById } from "@/content/skills";
import { cn } from "@/lib/utils";
import type { LabId } from "@/types/content";
import {
  ArrowRight,
  Binary,
  Bot,
  Braces,
  Cpu,
  Database,
  GitBranch,
  Network,
  Puzzle,
  QrCode,
  ShieldCheck,
  ToggleLeft,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZERO1 Labs",
  description:
    "Nine hands-on labs where computing concepts become objects students can manipulate — six live today, three in development.",
};

interface LabEntry {
  id: LabId;
  name: string;
  icon: LucideIcon;
  live: boolean;
  gradeRange: string;
  doing: string;
  steps: string[];
  skillIds: string[];
}

/** Marketing copy for the labs. IDs, grade ranges and skills mirror the runtime
 *  lab registry, which is a client module and cannot be read from a server page. */
const LABS: LabEntry[] = [
  {
    id: "binary",
    name: "Binary Lab",
    icon: Binary,
    live: true,
    gradeRange: "Grades 4–8",
    doing:
      "Flip eight physical-feeling bit switches and watch the decimal value assemble itself above them.",
    steps: [
      "Toggle bits in free mode and read the place values 128 → 1",
      "Switch to target mode: hit 42, then 200, then a number the teacher calls out",
      "See the byte written back as a number, and the number written back as a byte",
    ],
    skillIds: ["data-binary"],
  },
  {
    id: "computer",
    name: "Computer Lab",
    icon: Cpu,
    live: true,
    gradeRange: "Grades 2–7",
    doing:
      "Assemble a working computer by dropping components into the right slots until the system boots.",
    steps: [
      "Place CPU, RAM, storage, power and peripherals into the case",
      "A wrong component in the wrong slot explains why it does not belong there",
      "The machine only boots when the build is genuinely complete",
    ],
    skillIds: ["sys-hardware"],
  },
  {
    id: "algorithm",
    name: "Algorithm Lab",
    icon: GitBranch,
    live: true,
    gradeRange: "Grades 3–8",
    doing:
      "Program a rover across a grid with instruction blocks, then run it and watch your algorithm execute step by step.",
    steps: [
      "Sequence move and turn blocks to reach the goal past obstacles",
      "Compress a long solution with a repeat block to beat the par count",
      "When it crashes, step the program to find the exact instruction that was wrong",
    ],
    skillIds: ["algo-sequence", "algo-iteration", "algo-debug"],
  },
  {
    id: "network",
    name: "Network Lab",
    icon: Network,
    live: true,
    gradeRange: "Grades 5–9",
    doing:
      "Build a network from real devices — computers, a switch, a router — and send a packet across it.",
    steps: [
      "Drag devices onto the canvas and cable them together",
      "Discover what a switch does by first trying to connect everything to everything",
      "Validate the build against the brief: the packet arrives, or it does not",
    ],
    skillIds: ["net-devices"],
  },
  {
    id: "cyber",
    name: "Cyber Lab",
    icon: ShieldCheck,
    live: true,
    gradeRange: "Grades 5–12",
    doing:
      "Work through a suspicious inbox and decide, message by message, what is real and what is bait.",
    steps: [
      "Inspect sender addresses, links, urgency cues and attachments",
      "Judge each message: safe, suspicious, or report it",
      "Get the tell explained after you commit — never before you have decided",
    ],
    skillIds: ["cyber-phishing"],
  },
  {
    id: "logic",
    name: "Logic Lab",
    icon: ToggleLeft,
    live: true,
    gradeRange: "Grades 6–12",
    doing:
      "Wire AND, OR, NOT and XOR gates, flip the inputs, and build the truth table from your own results.",
    steps: [
      "Toggle inputs and watch the output light respond instantly",
      "Fill in a truth table you generated rather than one you copied",
      "Connect gates in series to solve a small logic puzzle",
    ],
    skillIds: ["ct-abstraction"],
  },
  {
    id: "web",
    name: "Web Lab",
    icon: Braces,
    live: false,
    gradeRange: "Grades 7–12",
    doing:
      "Write HTML and CSS in a split editor with a live preview beside the code.",
    steps: [
      "Pairs with the Grade 7–8 HTML units and the Grade 11–12 web work",
      "Registry slot reserved so book QR codes already resolve to it",
    ],
    skillIds: ["web-html"],
  },
  {
    id: "python",
    name: "Python Lab",
    icon: Bot,
    live: false,
    gradeRange: "Grades 7–12",
    doing:
      "Run Python in the browser against hidden tests, with hints that escalate rather than hand over the answer.",
    steps: [
      "Pairs with the Python units from Grade 7 through Grade 12",
      "Registry slot reserved so book QR codes already resolve to it",
    ],
    skillIds: ["prog-python"],
  },
  {
    id: "database",
    name: "Database Lab",
    icon: Database,
    live: false,
    gradeRange: "Grades 9–12",
    doing:
      "Design tables, add records and write the first queries that answer a real question.",
    steps: [
      "Pairs with the Access and MySQL units in Grades 9–12",
      "Registry slot reserved so book QR codes already resolve to it",
    ],
    skillIds: ["data-analysis"],
  },
];

const liveLabs = LABS.filter((l) => l.live);
const devLabs = LABS.filter((l) => !l.live);

const engine = [
  {
    icon: Puzzle,
    t: "A lab is a registered module",
    d: "Each lab is a self-contained component registered under a stable ID. The registry is the single source of truth for what exists and what is still a reserved slot.",
  },
  {
    icon: Wrench,
    t: "Lessons reference labs by ID and config",
    d: "A lesson does not embed a lab; it points at one and passes configuration — the target numbers for Binary Lab, the grid and obstacles for Algorithm Lab, the devices required by Network Lab.",
  },
  {
    icon: QrCode,
    t: "Printed books point at the same IDs",
    d: "An OPEN ZERO1 LAB code in a printed book resolves through a redirect table to a lab ID, never to a document ID. Content can be restructured without breaking a single printed page.",
  },
];

export default function LabsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 py-10 sm:px-10 sm:py-12">
          <BinaryPattern
            className="absolute inset-0 h-full w-full"
            tone="light"
            seed={33}
            cols={28}
            rows={11}
          />
          <div className="relative">
            <Chip tone="signal">
              {liveLabs.length} live · {devLabs.length} in development
            </Chip>
            <h1 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-[38px] sm:leading-[1.15]">
              The concept, turned into something you can grab
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-300">
              ZERO1 Labs are the hands-on stage of every mission. They are not
              videos of a simulation — the bits really flip, the rover really runs
              your instructions, and the network really fails when you wire it
              wrong.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {LABS.map((lab) => (
                <span
                  key={lab.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11.5px]",
                    lab.live
                      ? "border-signal-400/40 bg-signal-400/10 text-signal-300"
                      : "border-white/10 text-ink-400",
                  )}
                >
                  <lab.icon className="size-3.5" />
                  {lab.id}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Six labs, live today
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Each one is reachable inside a mission, from the student lab gallery, and
          from a QR code in the printed book.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {liveLabs.map((lab) => (
            <article
              key={lab.id}
              className="flex flex-col rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
                  <lab.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink-900">
                      {lab.name}
                    </h3>
                    <Chip tone="mint">Live</Chip>
                    <span className="tnum ml-auto font-mono text-[11.5px] text-ink-400">
                      {lab.gradeRange}
                    </span>
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">
                    {lab.doing}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                What students do
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {lab.steps.map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink-500"
                  >
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal-400"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink-50 pt-4">
                <span className="mr-1 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  Builds
                </span>
                {lab.skillIds.map((id) => (
                  <Chip key={id} tone="brand">
                    {skillById.get(id)?.title ?? id}
                  </Chip>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">
                Three labs in development
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
                Their slots already exist in the lab engine, which is why we can
                print QR codes for them before the labs themselves ship.
              </p>
            </div>
            <Chip tone="amber">Not available yet</Chip>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {devLabs.map((lab) => (
              <article
                key={lab.id}
                className="rounded-lg border border-dashed border-ink-200 bg-white/70 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
                    <lab.icon className="size-5" />
                  </span>
                  <span className="tnum font-mono text-[11.5px] text-ink-400">
                    {lab.gradeRange}
                  </span>
                </div>
                <h3 className="font-display mt-3 text-[15px] font-bold text-ink-700">
                  {lab.name}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                  {lab.doing}
                </p>
                <ul className="mt-3 space-y-1 border-t border-ink-100 pt-3">
                  {lab.steps.map((s) => (
                    <li key={s} className="text-[12.5px] leading-relaxed text-ink-400">
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  Will build · {lab.skillIds.map((id) => skillById.get(id)?.title ?? id).join(", ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          How the lab engine works
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Labs are not one-off pages bolted onto lessons. They are a first-class
          part of the content architecture, which is why a lab written once shows up
          in three places at no extra cost.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {engine.map((e) => (
            <div
              key={e.t}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <e.icon className="size-5" />
              </span>
              <h3 className="font-display mt-3.5 text-[15px] font-bold text-ink-900">
                {e.t}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{e.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 rounded-lg border border-ink-100 bg-white p-5 shadow-card sm:grid-cols-3">
          {[
            {
              t: "Inside a mission",
              d: "The Lab stage sits between Try It and Challenge. Completing it awards XP and updates the mapped competencies.",
            },
            {
              t: "In the lab gallery",
              d: "Students can open any live lab freely, with no score attached — exploration is not something to be graded.",
            },
            {
              t: "From the printed page",
              d: "An OPEN ZERO1 LAB code takes a student straight into the lab with the configuration the book intended.",
            },
          ].map((x) => (
            <div key={x.t}>
              <h3 className="font-display text-[14px] font-semibold text-ink-900">
                {x.t}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-2 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              See a lab run inside a real lesson
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              The Grade 6 unit “Inside the Digital World” uses five of the six live
              labs across its missions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Request a demo
            </Button>
            <Button href="/curriculum" variant="secondary">
              See the curriculum
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
