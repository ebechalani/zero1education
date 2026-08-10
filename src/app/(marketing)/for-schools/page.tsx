import { BinaryPattern } from "@/components/brand/binary-pattern";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  Check,
  Database,
  EyeOff,
  FileDown,
  GraduationCap,
  KeyRound,
  Layers,
  Lock,
  Presentation,
  School,
  ShieldCheck,
  Ticket,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Schools",
  description:
    "Multi-school architecture, tenant isolation, four roles, licensing and seats, teacher training, child data privacy, and how a ZERO1 rollout works.",
};

const roles = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "teacher", label: "Teacher", icon: Presentation },
  { id: "admin", label: "School admin", icon: UserCog },
  { id: "zero1", label: "ZERO1 admin", icon: Building2 },
] as const;

const capabilities: {
  capability: string;
  student: string;
  teacher: string;
  admin: string;
  zero1: string;
}[] = [
  { capability: "Play lessons, labs and missions", student: "Own grade", teacher: "Preview any", admin: "Preview", zero1: "All" },
  { capability: "Own progress, passport, portfolio", student: "Yes", teacher: "—", admin: "—", zero1: "—" },
  { capability: "See student progress", student: "Own only", teacher: "Own classes", admin: "Own school", zero1: "All schools" },
  { capability: "Teach Mode & Launch to Class", student: "—", teacher: "Yes", admin: "—", zero1: "Yes" },
  { capability: "Assignments & project grading", student: "—", teacher: "Own classes", admin: "—", zero1: "Yes" },
  { capability: "Manage users, classes, licences", student: "—", teacher: "—", admin: "Own school", zero1: "All schools" },
  { capability: "Author & publish curriculum", student: "—", teacher: "—", admin: "—", zero1: "Yes" },
];

const adminCapabilities = [
  { icon: UserPlus, t: "Create and manage accounts", d: "Add teachers and students, assign roles, deactivate leavers. Students never self-register." },
  { icon: Users, t: "Classes and sections", d: "Build class rosters per grade, assign a teacher, move students between sections mid-year." },
  { icon: Ticket, t: "Licences and seats", d: "See seats allocated and remaining, per grade, with a warning before a section runs out." },
  { icon: Layers, t: "School-wide reports", d: "Coverage and mastery by grade and by class — which units have been taught, and how they landed." },
  { icon: FileDown, t: "Exports", d: "Roster and progress exports for the school's own records and reporting cycles." },
  { icon: KeyRound, t: "Access control", d: "Only the school admin can change roles inside the school. ZERO1 staff never edit a school's rosters." },
];

const privacy = [
  { icon: EyeOff, t: "No public student profiles", d: "A student is visible to their own teachers and their school admin. There is no discovery, no search across schools, no social graph." },
  { icon: ShieldCheck, t: "No third-party trackers in student surfaces", d: "The student app carries no advertising or analytics tags from outside vendors." },
  { icon: Lock, t: "Opt-in showcase only", d: "Portfolio work is private by default. Sharing a project to a class or school showcase is an explicit, school-controlled action." },
  { icon: Database, t: "Tenant-scoped data", d: "Every user, class, assignment, submission and progress record carries a school ID, and security rules refuse any cross-school read or write." },
  { icon: UserPlus, t: "School-created accounts", d: "Accounts are provisioned by the school. Children do not sign themselves up, and no email address is required for a student to learn." },
  { icon: FileDown, t: "Export and deletion on request", d: "The school owns its data and can request a full export or removal of a student's records." },
];

const rollout = [
  { t: "Scope the pilot", d: "Choose the grades and sections, the term, and the units to cover. A pilot is deliberately small enough to evaluate honestly." },
  { t: "Create the tenant", d: "The school is created in ZERO1 Studio with its own isolated data space, licence seats and, on Premium, its own branding." },
  { t: "Load rosters", d: "Teachers, classes and students are imported and assigned roles. Sign-in details go to the school, not to the children's inboxes." },
  { t: "Train the teachers", d: "A hands-on session on Teach Mode, Launch to Class, analytics and lesson kits — taught on the actual units the school will teach first." },
  { t: "Teach the first unit", d: "One unit end-to-end with support available. The first Teach Mode lesson is usually the moment the model clicks." },
  { t: "Review and expand", d: "Walk through the class analytics with school leadership, then extend to the remaining grades on the school's own timetable." },
];

export default function ForSchoolsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-6 py-10 sm:px-10 sm:py-12">
          <BinaryPattern
            className="absolute inset-0 h-full w-full"
            tone="light"
            seed={21}
            cols={30}
            rows={11}
          />
          <div className="relative max-w-2xl">
            <Chip tone="signal">For schools & districts</Chip>
            <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-[38px] sm:leading-[1.15]">
              Built to run a school, not a classroom demo
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
              Multi-tenant from the first line of code: every school has its own
              isolated data space, its own roles and its own licences, on top of
              one shared Grade 0–12 curriculum published by ZERO1.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button href="/contact" iconRight={<ArrowRight />}>
                Request a demo
              </Button>
              <Button href="/pricing" variant="inverse">
                See licensing
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">
              One curriculum, many schools, no shared data
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
              Curriculum is global: authored and published once by ZERO1, read-only
              for every school. Everything a school generates — accounts, classes,
              assignments, submissions, progress — is written into that school&apos;s
              own tenant and never crosses the boundary.
            </p>
            <ul className="mt-4 space-y-2.5">
              {[
                "Every record carries a school ID; access rules deny cross-school reads and writes outright",
                "A teacher in one school cannot resolve the existence of a student in another",
                "Curriculum updates reach all schools at once without touching school data",
                "A campus group can be modelled as multiple tenants under one licence",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-mint-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
            <div className="rounded-lg bg-ink-900 px-4 py-3">
              <p className="font-mono text-[10.5px] tracking-[0.18em] text-signal-400 uppercase">
                Published by ZERO1 · read-only
              </p>
              <p className="font-display mt-1 text-[15px] font-bold text-white">
                Global curriculum · Grades 0–12
              </p>
            </div>
            <div className="mt-1 flex justify-center">
              <span className="h-5 w-px bg-ink-200" aria-hidden />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["School A", "School B", "School C"].map(
                (name, i) => (
                  <div
                    key={name}
                    className="rounded-lg border border-ink-100 bg-ink-50/60 p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <School className="size-3.5 text-ink-400" />
                      <p className="truncate text-[12.5px] font-semibold text-ink-800">
                        {name}
                      </p>
                    </div>
                    <p className="mt-1 font-mono text-[10.5px] text-ink-400">
                      schoolId: sch_{String(i + 1).padStart(3, "0")}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {["users", "classes", "submissions", "progress"].map((c) => (
                        <li
                          key={c}
                          className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-500"
                        >
                          <Lock className="size-2.5 text-ink-300" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
            <p className="mt-3 text-center text-[12px] text-ink-400">
              Example tenants — isolation is enforced in the data layer, not in the UI.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Four roles, one account system
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Permissions are enforced on the server and in the database rules — not by
          hiding buttons.
        </p>
        <div className="mt-5 overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-400 uppercase">
                  Capability
                </th>
                {roles.map((r) => (
                  <th
                    key={r.id}
                    className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-500 uppercase"
                  >
                    <span className="flex items-center gap-1.5">
                      <r.icon className="size-3.5 text-ink-400" />
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((row) => (
                <tr key={row.capability} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2.5 text-[13.5px] font-medium text-ink-800">
                    {row.capability}
                  </td>
                  {[row.student, row.teacher, row.admin, row.zero1].map((v, i) => (
                    <td
                      key={i}
                      className={cn(
                        "px-4 py-2.5 text-[13px]",
                        v === "—" ? "text-ink-300" : "text-ink-600",
                      )}
                    >
                      {v === "Yes" ? (
                        <span className="flex items-center gap-1.5 font-medium text-mint-700">
                          <Check className="size-3.5" />
                          Yes
                        </span>
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          What a school administrator can do
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminCapabilities.map((c) => (
            <div
              key={c.t}
              className="rounded-lg border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <c.icon className="size-4.5" />
              </span>
              <h3 className="font-display mt-3 text-[14.5px] font-semibold text-ink-900">
                {c.t}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-lg bg-bit-100 text-bit-700">
              <Ticket className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-lg font-bold text-ink-900">
              Licensing & seats
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              ZERO1 is licensed per student seat for a school year. A seat covers
              the full student app, every lab, the Digital Passport and the
              portfolio; teacher accounts and the Teacher Hub are included with the
              school licence, not charged per teacher.
            </p>
            <ul className="mt-4 space-y-2 border-t border-ink-50 pt-4">
              {[
                "Seats are allocated by grade so a pilot can be scoped to one year group",
                "Unused seats stay with the school and can be reassigned when students leave",
                "Teacher accounts, Teach Mode and analytics are part of the school licence",
                "Multi-campus groups licence once and are provisioned as separate tenants",
              ].map((t) => (
                <li key={t} className="flex gap-2 text-[13px] leading-relaxed text-ink-600">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12.5px] text-ink-400">
              Pricing depends on size and tier — see{" "}
              <a href="/pricing" className="font-semibold text-brand-600 hover:underline">
                licensing tiers
              </a>
              .
            </p>
          </div>

          <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Presentation className="size-5" />
            </span>
            <h2 className="font-display mt-3.5 text-lg font-bold text-ink-900">
              Onboarding & teacher training
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              The platform is only as good as the first week of using it. Onboarding
              is delivered on the units the school is about to teach, not on a
              generic sample.
            </p>
            <ol className="mt-4 space-y-3 border-t border-ink-50 pt-4">
              {[
                "Hub walkthrough — curriculum browser, lesson kits, answer keys",
                "Teach Mode practice — each teacher presents one real stage",
                "Launch to Class dry run — with the trainer acting as the class",
                "Reading analytics — turning a heatmap into next week's plan",
                "Admin session — rosters, classes, seats and reports",
              ].map((t, i) => (
                <li key={t} className="flex gap-3 text-[13px] leading-relaxed text-ink-600">
                  <span className="tnum flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-100 font-mono text-[11px] font-bold text-ink-600">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-ink-900 text-signal-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">
                Privacy, because these are children
              </h2>
              <p className="mt-0.5 text-sm text-ink-500">
                Design commitments the product is built around — not settings a
                school has to remember to switch on.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {privacy.map((p) => (
              <div
                key={p.t}
                className="rounded-lg border border-ink-100 bg-white p-4 shadow-card"
              >
                <p.icon className="size-4.5 text-ink-400" />
                <h3 className="font-display mt-2.5 text-[14px] font-semibold text-ink-900">
                  {p.t}
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          How a rollout works
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
          Six steps from first conversation to a grade level teaching with ZERO1.
        </p>
        <ol className="mt-6 space-y-0">
          {rollout.map((step, i) => (
            <li key={step.t} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="tnum flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-mono text-[13px] font-bold text-white">
                  {i + 1}
                </span>
                {i < rollout.length - 1 && (
                  <span className="w-px flex-1 bg-ink-100" aria-hidden />
                )}
              </div>
              <div className="pb-6">
                <h3 className="font-display text-[15px] font-bold text-ink-900">
                  {step.t}
                </h3>
                <p className="mt-0.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
                  {step.d}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-2 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Start with one grade
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              A pilot licence covers a single grade for one school year — enough to
              evaluate ZERO1 properly before committing the whole school.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Talk to us
            </Button>
            <Button href="/pricing" variant="secondary">
              Compare tiers
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
