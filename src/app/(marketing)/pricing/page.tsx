import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Minus,
  Building2,
  Rocket,
  School,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Three ZERO1 licensing tiers — Pilot, Standard and Premium. Per-student licensing with teacher accounts included. Contact us for pricing.",
};

const tiers = [
  {
    id: "pilot",
    name: "Pilot",
    icon: Rocket,
    for: "One grade, one school year — a real evaluation, not a trial account.",
    accent: false,
    features: [
      "One grade level for a full school year",
      "Student seats for every section in that grade",
      "All live ZERO1 Labs",
      "Teacher Hub for the teachers of that grade",
      "Teach Mode, Launch to Class and class analytics",
      "Lesson kits, teacher guides and answer keys",
      "Onboarding session for the pilot teachers",
      "Progress and mastery reports for the pilot grade",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    icon: School,
    for: "The whole school, every grade, with the full teacher and admin toolset.",
    accent: true,
    features: [
      "Everything in Pilot",
      "All grades — Kindergarten through Grade 12",
      "Unlimited teacher accounts",
      "School admin dashboard: users, classes, seats, reports",
      "School-wide coverage and mastery reporting",
      "Digital Passport and portfolio carried across years",
      "QR deep-links from the printed 2023 editions",
      "Teacher training for the whole ICT department",
      "Named support contact",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    icon: Building2,
    for: "School groups and multi-campus networks that report as one organisation.",
    accent: false,
    features: [
      "Everything in Standard",
      "Multiple campuses as separate tenants under one licence",
      "Group-level reporting across campuses",
      "Custom branding on the school-facing surfaces",
      "Priority support with agreed response times",
      "Extended onboarding and recurring teacher training",
      "Curriculum mapping against the school's scheme of work",
      "Early access to labs and units in development",
    ],
  },
];

type Cell = string | boolean;

const matrix: { row: string; pilot: Cell; standard: Cell; premium: Cell }[] = [
  { row: "Grades included", pilot: "One grade", standard: "KG – Grade 12", premium: "KG – Grade 12, all campuses" },
  { row: "Term", pilot: "One school year", standard: "School year, renewable", premium: "Multi-year available" },
  { row: "Student seats", pilot: "Pilot grade", standard: "Whole school", premium: "Whole group" },
  { row: "Teacher accounts", pilot: "Pilot teachers", standard: "Unlimited", premium: "Unlimited" },
  { row: "ZERO1 Labs", pilot: "All live labs", standard: "All live labs", premium: "Live + early access" },
  { row: "Teach Mode & Launch to Class", pilot: true, standard: true, premium: true },
  { row: "Class analytics & skill heatmap", pilot: true, standard: true, premium: true },
  { row: "Lesson kits & answer keys", pilot: true, standard: true, premium: true },
  { row: "Book QR deep-links", pilot: true, standard: true, premium: true },
  { row: "School admin dashboard", pilot: false, standard: true, premium: "Plus group view" },
  { row: "Multi-campus tenants", pilot: false, standard: false, premium: true },
  { row: "Custom branding", pilot: false, standard: false, premium: true },
  { row: "Onboarding & training", pilot: "Pilot teachers", standard: "Department training", premium: "Extended & recurring" },
  { row: "Support", pilot: "Email", standard: "Named contact", premium: "Priority" },
];

const everyTier = [
  "Per-student licensing — teacher accounts are never charged separately",
  "The full Grade 0–12 curriculum scope, including units still taught from print",
  "Every ZERO1 Lab that is live at the time of licensing, plus labs released during the term",
  "Tenant isolation, role-based access and the child privacy commitments",
  "Curriculum updates and new interactive units at no extra cost",
];

const faqs = [
  {
    q: "How much does ZERO1 cost?",
    a: "Licensing is per student seat and depends on the tier, the number of seats and the length of the commitment. Because school sizes and procurement rules vary widely, we quote per school rather than publish a list price. Tell us the grades and roughly how many students, and you will get a written quote.",
  },
  {
    q: "Can we start with a single grade?",
    a: "Yes — that is exactly what the Pilot tier is for. One grade level, one school year, with the full Teacher Hub for that grade's teachers. Most schools pilot with the grade whose ICT teacher is most curious, then expand from there.",
  },
  {
    q: "Do we pay for teacher accounts?",
    a: "No. Teacher accounts, Teach Mode, Launch to Class, class analytics and every lesson kit are part of the school licence. Only student seats are counted.",
  },
  {
    q: "Do we need the printed books to use the platform?",
    a: "No. The platform carries the full curriculum on its own. If your school already teaches from the printed 2023 edition, the QR codes in those books deep-link straight into the matching labs and activities — but they are a bonus, not a requirement.",
  },
  {
    q: "What happens to student progress at the end of the year?",
    a: "The Digital Passport and the portfolio are tied to the student, not to a class, so competencies and work carry forward as they move up a grade. The school owns its data and can request an export at any time.",
  },
  {
    q: "What do we need to run it?",
    a: "A modern browser on the devices the school already has — laptops, desktops, Chromebooks or tablets. The labs are built for mouse, touch and keyboard. Hardware units still need their own kits: micro:bit, mBot2 or Arduino, depending on the grade.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 text-center sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <Chip tone="brand">Per-student licensing</Chip>
        </div>
        <h1 className="font-display mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
          Three ways to start
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Every tier includes the complete curriculum, every live lab and the full
          Teacher Hub. What changes is how much of the school it covers and how much
          support comes with it.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "flex flex-col rounded-lg border bg-white p-6",
                tier.accent
                  ? "border-brand-300 shadow-glow"
                  : "border-ink-100 shadow-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    tier.accent
                      ? "bg-brand-600 text-white"
                      : "bg-ink-900 text-signal-400",
                  )}
                >
                  <tier.icon className="size-5" />
                </span>
                {tier.accent && <Chip tone="brand">Most schools start here</Chip>}
              </div>
              <h2 className="font-display mt-4 text-xl font-bold text-ink-900">
                {tier.name}
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                {tier.for}
              </p>
              <p className="font-display mt-4 border-y border-ink-50 py-3 text-[15px] font-semibold text-ink-800">
                Contact us for pricing
                <span className="mt-0.5 block text-[12.5px] font-normal text-ink-400">
                  Quoted per school, based on seats and term
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink-600"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-mint-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                href="/contact"
                variant={tier.accent ? "primary" : "secondary"}
                className="mt-6 w-full"
                iconRight={<ArrowRight />}
              >
                Request a demo
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Tier comparison
        </h2>
        <div className="mt-5 overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className="px-4 py-3 text-[12px] font-semibold tracking-wide text-ink-400 uppercase">
                  What is included
                </th>
                {tiers.map((t) => (
                  <th
                    key={t.id}
                    className={cn(
                      "px-4 py-3 text-[12px] font-semibold tracking-wide uppercase",
                      t.accent ? "text-brand-700" : "text-ink-500",
                    )}
                  >
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.row} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2.5 text-[13.5px] font-medium text-ink-800">
                    {row.row}
                  </td>
                  {([row.pilot, row.standard, row.premium] as Cell[]).map(
                    (cell, i) => (
                      <td
                        key={i}
                        className="relative px-4 py-2.5 text-[13px] text-ink-600"
                      >
                        {cell === true ? (
                          <>
                            <Check className="size-4 text-mint-500" aria-hidden />
                            <span className="sr-only">Included</span>
                          </>
                        ) : cell === false ? (
                          <>
                            <Minus className="size-4 text-ink-300" aria-hidden />
                            <span className="sr-only">Not included</span>
                          </>
                        ) : (
                          cell
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-ink-50 p-6 sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-900">
            In every tier, without asking
          </h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {everyTier.map((t) => (
              <li
                key={t}
                className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-600"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-mint-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-bold text-ink-900">
          Questions schools ask first
        </h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-card">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group border-b border-ink-50 last:border-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink-50/60">
                <h3 className="font-display text-[14.5px] font-semibold text-ink-900">
                  {faq.q}
                </h3>
                <ChevronDown className="size-4 shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="max-w-3xl px-5 pb-4 text-[13.5px] leading-relaxed text-ink-500">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-2 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-100 bg-white p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Get a quote for your school
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ink-500">
              Tell us the grades and roughly how many students. We will show you the
              platform on the units you actually teach and follow up in writing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/contact" iconRight={<ArrowRight />}>
              Request a demo
            </Button>
            <Button href="/for-schools" variant="secondary">
              How rollout works
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
