"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MailOpen,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { LabShell } from "./lab-shell";

interface Scenario {
  id: string;
  from: string;
  address: string;
  subject: string;
  body: string[];
  link?: { text: string; href: string };
  isPhishing: boolean;
  clues: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "prize",
    from: "ZeroGames Support",
    address: "support@zerogames-account-verify.net",
    subject: "⚠️ URGENT: Your account will be deleted in 24 hours!",
    body: [
      "Dear valued player,",
      "We detected unusual activity on your account. To keep your progress and skins, you MUST verify your password within 24 HOURS or your account will be permanently deleted.",
      "This is your FINAL warning.",
    ],
    link: { text: "VERIFY MY PASSWORD NOW", href: "http://zerogames-account-verify.net/login" },
    isPhishing: true,
    clues: [
      "Urgency and threats — '24 hours', 'FINAL warning'",
      "Asks you to enter your password via a link",
      "Sender address is a strange domain, not the game's real site",
      "Generic greeting: 'Dear valued player', not your name",
    ],
  },
  {
    id: "library",
    from: "Cedars School Library",
    address: "library@cedars.edu.lb",
    subject: "Your reserved book is ready for pickup",
    body: [
      "Hi Maya,",
      "The book you reserved — 'The Code Book' — is now available at the library desk. Please pick it up before Friday, or the reservation will pass to the next student.",
      "Happy reading!",
      "Ms. Saade, Library",
    ],
    isPhishing: false,
    clues: [
      "Sender is the school's real domain (@cedars.edu.lb)",
      "Uses your name and refers to something you actually did",
      "No links, no requests for passwords or personal data",
      "Normal deadline, no pressure tactics",
    ],
  },
  {
    id: "paypal",
    from: "PayPaI Security Team",
    address: "security@paypa1-alerts.com",
    subject: "Unusual sign-in — confirm your card details",
    body: [
      "Dear customer,",
      "We noticed a sign-in from a new device. To secure your account, please confirm your card number and PIN using the secure form below.",
      "Failure to confirm within 48 hours will result in account suspension.",
    ],
    link: { text: "Confirm card details", href: "https://paypa1-alerts.com/secure" },
    isPhishing: true,
    clues: [
      "Look closely: paypa1 with the digit 1, not paypal",
      "No real company ever asks for your PIN — ever",
      "Urgency again: '48 hours or suspension'",
      "HTTPS padlock doesn't make a fake site honest",
    ],
  },
  {
    id: "robotics",
    from: "Rana Khoury",
    address: "r.khoury@cedars.edu.lb",
    subject: "Robotics club — new season sign-ups",
    body: [
      "Hello Grade 6,",
      "The mBot2 robotics club starts again next month. Seats are limited to 16 students, so sign up at the lab this week if you're interested.",
      "You can read about last year's projects on the school site.",
      "Ms. Khoury",
    ],
    link: { text: "cedars.edu.lb/robotics", href: "https://cedars.edu.lb/robotics" },
    isPhishing: false,
    clues: [
      "Known sender from the school's real domain",
      "The link goes to the school's own website — address matches",
      "Asks for nothing sensitive; sign-up happens in person",
      "Limited seats is normal info, not a pressure trick",
    ],
  },
];

type Decision = "safe" | "phishing";

/**
 * Inbox Under Attack — inspect four messages, judge each one, and learn
 * from every verdict. Completes when all messages are handled.
 */
export function CyberLab({
  title = "Cyber Lab",
  brief,
  onComplete,
  completed,
}: {
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const [openId, setOpenId] = useState<string>(SCENARIOS[0].id);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const open = SCENARIOS.find((s) => s.id === openId)!;
  const decidedCount = Object.keys(decisions).length;
  const allDone = decidedCount === SCENARIOS.length;
  const correctCount = SCENARIOS.filter(
    (s) => decisions[s.id] === (s.isPhishing ? "phishing" : "safe"),
  ).length;

  const decide = (d: Decision) => {
    if (decisions[open.id]) return;
    const next = { ...decisions, [open.id]: d };
    setDecisions(next);
    if (Object.keys(next).length === SCENARIOS.length) onComplete?.();
  };

  const reset = () => {
    setDecisions({});
    setOpenId(SCENARIOS[0].id);
  };

  const verdictFor = (s: Scenario) => {
    const d = decisions[s.id];
    if (!d) return null;
    return d === (s.isPhishing ? "phishing" : "safe");
  };

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || allDone}
      footer={
        allDone ? (
          <p className="text-center text-sm font-semibold text-ink-700">
            Security review complete:{" "}
            <span className={correctCount === SCENARIOS.length ? "text-mint-600" : "text-amber-700"}>
              {correctCount}/{SCENARIOS.length} correct verdicts.
            </span>{" "}
            {correctCount === SCENARIOS.length
              ? "Not a single trick got past you — true Cyber Defender material."
              : "Re-read the clues on the ones you missed — attackers reuse the same tricks."}
          </p>
        ) : undefined
      }
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* Inbox list */}
        <div className="space-y-1.5">
          <p className="mb-2 flex items-center justify-between text-xs font-bold tracking-wide text-ink-500 uppercase">
            Inbox <span className="tnum font-mono">{decidedCount}/{SCENARIOS.length} handled</span>
          </p>
          {SCENARIOS.map((s) => {
            const v = verdictFor(s);
            return (
              <button
                key={s.id}
                onClick={() => setOpenId(s.id)}
                className={cn(
                  "w-full cursor-pointer rounded-lg border-2 p-2.5 text-left transition-colors",
                  openId === s.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-ink-100 bg-white hover:border-ink-200",
                )}
              >
                <span className="flex items-center gap-2">
                  {v === null ? (
                    <Mail className="size-3.5 shrink-0 text-brand-500" />
                  ) : v ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-mint-500" />
                  ) : (
                    <XCircle className="size-3.5 shrink-0 text-coral-500" />
                  )}
                  <span className="truncate text-[12.5px] font-semibold text-ink-800">
                    {s.from}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
                  {s.subject}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reading pane */}
        <div className="rounded-lg border border-ink-100 bg-white">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <MailOpen className="size-4 text-ink-400" />
              {open.subject}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              From: <span className="font-semibold text-ink-700">{open.from}</span>{" "}
              <span className="font-mono text-[11px] text-ink-400">&lt;{open.address}&gt;</span>
            </p>
          </div>
          <div className="space-y-2.5 px-4 py-4 text-[13.5px] leading-relaxed text-ink-700">
            {open.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {open.link && (
              <p>
                <span
                  className="cursor-not-allowed rounded-md bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white opacity-90"
                  title={`Links are disabled in the lab. Real destination: ${open.link.href}`}
                >
                  {open.link.text}
                </span>
                <span className="mt-1.5 block font-mono text-[11px] break-all text-ink-400">
                  ↳ hover check — real destination: {open.link.href}
                </span>
              </p>
            )}
          </div>

          {/* Decision bar / verdict */}
          <div className="border-t border-ink-100 px-4 py-3.5">
            {!decisions[open.id] ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto text-[13px] font-semibold text-ink-700">
                  Your verdict, officer?
                </p>
                <Button size="sm" variant="secondary" icon={<ShieldCheck />} onClick={() => decide("safe")}>
                  Looks safe
                </Button>
                <Button size="sm" variant="danger" icon={<ShieldAlert />} onClick={() => decide("phishing")}>
                  Report phishing
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "animate-pop rounded-lg p-3.5",
                  verdictFor(open) ? "bg-mint-100" : "bg-coral-100",
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-2 text-sm font-bold",
                    verdictFor(open) ? "text-mint-700" : "text-coral-700",
                  )}
                >
                  {verdictFor(open) ? (
                    <>
                      <CheckCircle2 className="size-4.5" /> Correct —{" "}
                      {open.isPhishing ? "this was an attack." : "this one was genuine."}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-4.5" /> Not quite —{" "}
                      {open.isPhishing
                        ? "this was phishing. Here's what gave it away:"
                        : "this message was actually safe. The evidence:"}
                    </>
                  )}
                </p>
                <ul className="mt-2 space-y-1 pl-1">
                  {open.clues.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink-700">
                      <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </LabShell>
  );
}
