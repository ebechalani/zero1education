import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CATALOG, unitsForGrade } from "@/content/curriculum";
import { cn } from "@/lib/utils";
import { GRADES, worldForGrade } from "@/lib/worlds";
import {
  ArrowRight,
  BookOpen,
  CircleCheckBig,
  Compass,
  FlaskConical,
  Link2,
  MousePointerClick,
  PlayCircle,
  QrCode,
  RefreshCw,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Books",
  description:
    "The printed ZERO1 ICT editions and how QR codes connect every page to the platform — labs, activities, challenges and checkpoints, through stable redirects.",
};

const codeTypes = [
  {
    code: "OPEN ZERO1 LAB",
    icon: FlaskConical,
    tone: "bg-signal-100 text-signal-700",
    d: "Opens the ZERO1 Lab the page is teaching from, pre-configured to match the exercise printed beside it.",
    target: "lab",
  },
  {
    code: "WATCH",
    icon: PlayCircle,
    tone: "bg-brand-50 text-brand-700",
    d: "Opens the explanation stage for the concept on that page — the same Learn content the teacher projects in class.",
    target: "lesson",
  },
  {
    code: "TRY",
    icon: MousePointerClick,
    tone: "bg-violet-100 text-violet-700",
    d: "Opens the guided practice for that section: activities with hints, no score pressure, immediate feedback.",
    target: "lesson",
  },
  {
    code: "CHALLENGE",
    icon: Trophy,
    tone: "bg-bit-100 text-bit-700",
    d: "Opens the harder combined task for the chapter — the one worth real XP in the student's progress.",
    target: "challenge",
  },
  {
    code: "CHECK YOURSELF",
    icon: CircleCheckBig,
    tone: "bg-mint-100 text-mint-700",
    d: "Opens the chapter checkpoint. Results come back as bits filled, and feed the student's competency levels.",
    target: "checkpoint",
  },
  {
    code: "SCAN & EXPLORE",
    icon: Compass,
    tone: "bg-ink-100 text-ink-600",
    d: "Opens the wider unit around the page: related lessons, project briefs and extension material.",
    target: "lesson",
  },
];

export default function BooksPage() {
  const bookUnits = CATALOG.filter((u) => u.bookRef);
  const gradesWithBooks = GRADES.map((grade) => ({
    grade,
    world: worldForGrade(grade.number),
    units: unitsForGrade(grade.number).filter((u) => u.bookRef),
  })).filter((g) => g.units.length > 0);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <Chip tone="bit">Printed editions · 2023</Chip>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
              The books came first
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
              The ZERO1 ICT series was written, taught and printed as a full
              Kindergarten-to-Grade-12 programme by{" "}
              <strong className="font-semibold text-ink-700">Eddy Bachaalany</strong>.
              The platform did not replace those books — it gave every page
              somewhere to go.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/curriculum" iconRight={<ArrowRight />}>
                See the full scope
              </Button>
              <Button href="/contact" variant="secondary">
                Ask about the editions
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3 rounded-lg bg-ink-900 p-4">
              <BookOpen className="size-5 shrink-0 text-bit-400" />
              <p className="font-display text-[15px] leading-snug font-bold text-white">
                The book provides the curriculum.
                <br />
                <span className="text-signal-400">
                  ZERO1 provides the experience.
                </span>
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "Grades", v: String(gradesWithBooks.length) },
                { k: "Chapters", v: String(bookUnits.length) },
                { k: "Code types", v: String(codeTypes.length) },
              ].map((s) => (
                <div key={s.k} className="rounded-md bg-ink-50 p-3 text-center">
                  <dd className="tnum font-mono text-xl font-semibold text-ink-900">
                    {s.v}
                  </dd>
                  <dt className="text-[11px] tracking-wide text-ink-400 uppercase">
                    {s.k}
                  </dt>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-400">
              Chapter references shown throughout the platform (for example{" "}
              <code className="rounded bg-ink-50 px-1 py-0.5 font-mono text-[11px] text-ink-500">
                G6 CH1
              </code>
              ) point back to the printed edition, so a teacher can always find the
              page a mission came from.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">
              Six kinds of QR code, six kinds of destination
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
              Codes are printed next to the content they extend, and each one is
              labelled with what it will do — a student always knows whether they
              are about to practise, play, or be tested.
            </p>
          </div>
          <Chip tone="neutral" icon={<QrCode />}>
            zero1.education/go/…
          </Chip>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {codeTypes.map((c) => (
            <div
              key={c.code}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md",
                    c.tone,
                  )}
                >
                  <c.icon className="size-4.5" />
                </span>
                <p className="font-mono text-[12px] font-bold tracking-wide text-ink-900">
                  {c.code}
                </p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{c.d}</p>
              <p className="mt-3 border-t border-ink-50 pt-2.5 font-mono text-[11px] text-ink-400">
                target: {c.target}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-2xl bg-ink-50 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
              <Link2 className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-xl font-bold text-ink-900">
              Printed codes never break
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              A QR code in a book is permanent in a way a web page never is. So the
              codes do not point at documents — they point at{" "}
              <strong className="font-semibold text-ink-700">stable codes</strong>{" "}
              that a redirect table resolves to the right grade, unit, lesson and
              target. Restructure the curriculum, rename a lesson, split a unit in
              two: the printed page still lands where it should.
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                { icon: RefreshCw, t: "Reprints stay valid", d: "The 2023 edition's codes keep working after every content release." },
                { icon: QrCode, t: "No document IDs in print", d: "Codes encode meaning, never a database key." },
                { icon: Compass, t: "One contract, four targets", d: "lesson · lab · challenge · checkpoint — nothing else can be printed." },
              ].map((x) => (
                <li key={x.t} className="flex gap-2.5">
                  <x.icon className="mt-0.5 size-4 shrink-0 text-brand-600" />
                  <p className="text-[13.5px] leading-relaxed text-ink-600">
                    <strong className="font-semibold text-ink-800">{x.t}</strong> —{" "}
                    {x.d}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              How a code resolves
            </p>
            <ol className="mt-3 space-y-3">
              {[
                { s: "Printed on the page", v: "zero1.education/go/g6-u1-l2-lab" },
                { s: "Resolved by the redirect table", v: "{ grade: 6, unit: idw, lesson: binary, target: lab }" },
                { s: "Lands the student in", v: "Binary Lab, target mode, 8 bits" },
              ].map((step, i) => (
                <li key={step.s} className="flex gap-3">
                  <span className="tnum flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-100 font-mono text-[11px] font-bold text-ink-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-800">{step.s}</p>
                    <p className="thin-scroll mt-0.5 overflow-x-auto rounded bg-ink-50 px-2 py-1 font-mono text-[11.5px] whitespace-nowrap text-ink-600">
                      {step.v}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Chapter coverage of the 2023 edition
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Every chapter that exists in print and its corresponding unit in the
          platform. {bookUnits.length} chapters across {gradesWithBooks.length}{" "}
          grade books.
        </p>
        <div className="mt-5 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
          {gradesWithBooks.map(({ grade, world, units }) => (
            <div
              key={grade.id}
              className="flex flex-col gap-2 border-b border-ink-50 px-4 py-3.5 last:border-0 sm:flex-row sm:gap-5"
            >
              <div className="flex shrink-0 items-center gap-2 sm:w-36">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: world.accent }}
                  aria-hidden
                />
                <span className="font-display text-[14px] font-bold text-ink-900">
                  {grade.label}
                </span>
                <span className="tnum font-mono text-[11px] text-ink-400">
                  {units.length} ch
                </span>
              </div>
              <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5">
                {units.map((unit) => (
                  <li key={unit.id} className="flex items-baseline gap-1.5">
                    <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-500">
                      {unit.bookRef?.split(" ").pop()}
                    </code>
                    <span className="text-[13px] text-ink-600">{unit.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-400">
          Grade 6 also carries the ZERO1-authored unit “Inside the Digital World”,
          which has no printed chapter — it was written for the platform first and
          is the model the printed chapters are being converted against.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-2 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Using the books already?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-500">
              Schools teaching from the printed edition can add the platform on top
              without changing their scheme of work — the chapter order is the same.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Talk to us
            </Button>
            <Button href="/resources" variant="secondary">
              Teacher resources
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
