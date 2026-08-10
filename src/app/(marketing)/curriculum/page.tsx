import { Chip } from "@/components/ui/chip";
import { CATALOG, unitsForGrade } from "@/content/curriculum";
import { cn } from "@/lib/utils";
import { GRADES, WORLDS, worldForGrade } from "@/lib/worlds";
import { BookMarked, Circle, PenTool, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curriculum",
  description:
    "The complete ZERO1 ICT scope from Grade 0 (KG) to Grade 12 — every unit, its book chapter reference, and whether it is interactive today.",
};

const worldSections = Object.values(WORLDS).map((world) => ({
  world,
  grades: GRADES.filter((g) => worldForGrade(g.number).id === world.id),
}));

export default function CurriculumPage() {
  const totalUnits = CATALOG.length;
  const bookUnits = CATALOG.filter((u) => u.bookRef).length;
  const liveUnits = CATALOG.filter((u) => u.status === "published").length;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <Chip tone="brand">Grade 0 → Grade 12</Chip>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
          The complete ZERO1 scope
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Every unit in the curriculum, in teaching order, grouped by learning
          world. Units carrying a chapter reference come from the printed 2023
          edition; units marked interactive are playable as ZERO1 missions today.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-100 bg-ink-100 sm:grid-cols-4">
          {[
            { k: "Grades", v: "13", hint: "KG through Grade 12" },
            { k: "Units", v: String(totalUnits), hint: "full published scope" },
            { k: "From the books", v: String(bookUnits), hint: "chapter-referenced" },
            { k: "Interactive now", v: String(liveUnits), hint: "playable missions" },
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
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-ink-100 bg-white px-5 py-4 shadow-card">
          <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            Legend
          </p>
          <span className="flex items-center gap-2 text-[13px] text-ink-600">
            <Sparkles className="size-3.5 text-mint-500" />
            <strong className="font-semibold text-ink-800">Interactive</strong> —
            playable mission in the platform
          </span>
          <span className="flex items-center gap-2 text-[13px] text-ink-600">
            <Circle className="size-3 fill-ink-200 text-ink-200" />
            <strong className="font-semibold text-ink-800">Print edition</strong> —
            taught from the book, conversion in progress
          </span>
          <span className="flex items-center gap-2 text-[13px] text-ink-600">
            <BookMarked className="size-3.5 text-ink-300" />
            <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] text-ink-500">
              G6 CH1
            </code>{" "}
            grade and chapter in the printed 2023 edition
          </span>
        </div>

        <nav
          aria-label="Jump to world"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <span className="text-[12px] font-medium text-ink-400">Jump to</span>
          {worldSections.map(({ world }) => (
            <a
              key={world.id}
              href={`#${world.id}`}
              className="rounded-full px-3 py-1 text-[13px] font-semibold transition-colors hover:brightness-95"
              style={{ background: world.accentSoft, color: world.accentText }}
            >
              {world.name.replace("ZERO1 ", "")}
              <span className="ml-1.5 font-mono text-[11px] font-normal opacity-70">
                {world.grades.replace("Grades ", "")}
              </span>
            </a>
          ))}
        </nav>
      </section>

      {worldSections.map(({ world, grades }) => {
        const worldUnits = grades.reduce(
          (n, g) => n + unitsForGrade(g.number).length,
          0,
        );
        return (
          <section
            key={world.id}
            id={world.id}
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-6 sm:px-6 lg:px-8"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 pb-3" style={{ borderColor: world.accent }}>
              <h2 className="font-display text-xl font-bold text-ink-900">
                {world.name}
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: world.accentSoft, color: world.accentText }}
              >
                {world.grades}
              </span>
              <span className="tnum font-mono text-[12px] text-ink-400">
                {worldUnits} units
              </span>
              <p className="w-full text-[13.5px] text-ink-500 sm:w-auto sm:flex-1 sm:text-right">
                {world.tagline}
              </p>
            </div>

            <div className="mt-5 space-y-5">
              {grades.map((grade) => {
                const units = unitsForGrade(grade.number);
                const gradeLive = units.filter(
                  (u) => u.status === "published",
                ).length;
                return (
                  <div
                    key={grade.id}
                    className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: world.accent }}
                        aria-hidden
                      />
                      <h3 className="font-display text-[15px] font-bold text-ink-900">
                        {grade.label}
                      </h3>
                      <span className="tnum font-mono text-[11.5px] text-ink-400">
                        {units.length} units
                      </span>
                      {gradeLive > 0 && (
                        <Chip tone="mint" className="ml-auto">
                          {gradeLive} interactive
                        </Chip>
                      )}
                    </div>

                    <ul>
                      {units.map((unit) => {
                        const live = unit.status === "published";
                        const lessonCount =
                          unit.plannedLessons ?? unit.lessonIds.length;
                        return (
                          <li
                            key={unit.id}
                            className={cn(
                              "flex flex-col gap-2 border-b border-ink-50 px-4 py-3 last:border-0 sm:flex-row sm:items-start sm:gap-4",
                              live && "bg-mint-100/25",
                            )}
                          >
                            <span className="tnum hidden w-5 shrink-0 pt-0.5 text-right font-mono text-[12px] text-ink-300 sm:block">
                              {unit.order}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-display text-[14.5px] font-semibold text-ink-900">
                                  {unit.title}
                                </h4>
                                {live ? (
                                  <Chip tone="mint" icon={<Sparkles />}>
                                    Interactive
                                  </Chip>
                                ) : (
                                  <Chip tone="neutral">Print edition</Chip>
                                )}
                                {unit.tagline && (
                                  <span className="text-[12px] text-ink-400 italic">
                                    {unit.tagline}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                                {unit.summary}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:justify-end">
                              {lessonCount > 0 && (
                                <span className="tnum font-mono text-[11.5px] text-ink-400">
                                  {lessonCount} {live ? "lessons" : "planned"}
                                </span>
                              )}
                              <code
                                className={cn(
                                  "rounded px-1.5 py-0.5 font-mono text-[11px]",
                                  unit.bookRef
                                    ? "bg-ink-50 text-ink-500"
                                    : "bg-brand-50 text-brand-700",
                                )}
                              >
                                {unit.bookRef ?? "ZERO1"}
                              </code>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-14 sm:px-6 lg:px-8">
        <div className="flex gap-4 rounded-lg border border-brand-100 bg-brand-50/60 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <PenTool className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink-900">
              How units become interactive
            </h2>
            <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-600">
              Every unit above already exists as taught, printed curriculum. Units
              are converted into interactive missions inside{" "}
              <strong className="font-semibold text-ink-800">ZERO1 Studio</strong>,
              the authoring environment where a lesson is written as typed content
              blocks — text, diagrams, definitions, activities, labs, challenges and
              checkpoints. Because content is data and the renderer is shared, a
              converted unit works in the student app, in Teach Mode and in the
              teacher lesson kit the moment it is published. Grade&nbsp;6 “Inside the
              Digital World” is the reference conversion; the rest follow it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
