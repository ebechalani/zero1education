import { Chip } from "@/components/ui/chip";
import {
  CalendarCheck,
  FileText,
  FlaskConical,
  Info,
  MailSearch,
  MonitorPlay,
  Radio,
  Route,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a ZERO1 demo — a walkthrough of a full mission, a live lab, Teach Mode, Launch to Class and the school admin view.",
};

const nextSteps = [
  {
    icon: MailSearch,
    t: "We read the request properly",
    d: "Which grades you teach and which units matter to you decide what we prepare — the demo is built around your scheme of work, not a generic sample.",
  },
  {
    icon: CalendarCheck,
    t: "We schedule a call",
    d: "About forty-five minutes, online, at a time that works in your timezone. Bring the ICT teachers — they ask the questions that matter.",
  },
  {
    icon: FileText,
    t: "You get it in writing",
    d: "A summary of what you saw, a scope proposal for a pilot, and a quote based on your grades and seat count.",
  },
];

const demoIncludes = [
  { icon: Route, t: "One complete mission", d: "All seven stages in the grade you choose, played the way a student would." },
  { icon: FlaskConical, t: "A live ZERO1 Lab", d: "You drive it. Flip the bits or wire the network yourself — it is not a recording." },
  { icon: MonitorPlay, t: "Teach Mode on screen", d: "The same lesson as a projector deck, with reveal controls and teacher notes." },
  { icon: Radio, t: "Launch to Class", d: "A lesson pushed to a class and the live status board that comes back." },
  { icon: UserCog, t: "The admin view", d: "Rosters, classes, seats and school-wide reporting for whoever runs the licence." },
  { icon: ShieldCheck, t: "The awkward questions", d: "Data privacy, tenant isolation, rollout timing and what is honestly not built yet." },
];

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
        <Chip tone="brand">Talk to ZERO1</Chip>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold tracking-tight text-ink-900 sm:text-[38px] sm:leading-[1.15]">
          See it running on your curriculum
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
          Tell us the grades you teach and what you want the demo to cover. We will
          prepare it on the units you actually use, and answer the licensing and
          privacy questions in the same call.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-100/60 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-[13px] leading-relaxed text-ink-700">
            <strong className="font-semibold">
              This is a demonstration build.
            </strong>{" "}
            The form below validates properly and shows you exactly what a real
            submission looks like, but it has no mail backend behind it — nothing is
            sent, stored or forwarded to anyone. In production it posts to the ZERO1
            team and creates a tracked request.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink-900">
                What happens next
              </h2>
              <ol className="mt-4 space-y-4">
                {nextSteps.map((s, i) => (
                  <li key={s.t} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span className="tnum flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-mono text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      {i < nextSteps.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-ink-100" aria-hidden />
                      )}
                    </div>
                    <div className="pb-1">
                      <h3 className="flex items-center gap-2 font-display text-[14px] font-semibold text-ink-900">
                        <s.icon className="size-4 text-ink-400" />
                        {s.t}
                      </h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                        {s.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-ink-100 bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink-900">
                What the demo includes
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                Six things, in one sitting. No slide deck about the product — the
                product itself.
              </p>
              <ul className="mt-4 space-y-3 border-t border-ink-50 pt-4">
                {demoIncludes.map((d) => (
                  <li key={d.t} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink-900 text-signal-400">
                      <d.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink-800">
                        {d.t}
                      </p>
                      <p className="text-[13px] leading-relaxed text-ink-500">
                        {d.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
