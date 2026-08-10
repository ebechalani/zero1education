"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { toast } from "@/components/ui/toast";
import { getLesson } from "@/content/curriculum";
import { QR_CODES, qrDestination, qrUrl, type QrTarget } from "@/content/qr-codes";
import { Copy, ExternalLink, Lock, Printer, QrCode, Route } from "lucide-react";
import Link from "next/link";

interface CodeGroup {
  lessonId: string;
  title: string;
  codes: QrTarget[];
}

/** One group per lesson, in the order the codes appear in the printed unit. */
const GROUPS: CodeGroup[] = QR_CODES.reduce<CodeGroup[]>((acc, target) => {
  const lessonId = target.lessonId ?? "unassigned";
  const group = acc.find((g) => g.lessonId === lessonId);
  if (group) group.codes.push(target);
  else
    acc.push({
      lessonId,
      title: getLesson(lessonId)?.title ?? lessonId,
      codes: [target],
    });
  return acc;
}, []);

const KIND_TONE: Record<QrTarget["kind"], ChipTone> = {
  lesson: "brand",
  lab: "signal",
  challenge: "bit",
  checkpoint: "violet",
};

const CONTRACT = [
  {
    icon: Printer,
    t: "Paper is immutable",
    d: "A code lives in thousands of printed books. It can never be reissued, so it is treated as a permanent public API — additive changes only.",
  },
  {
    icon: Lock,
    t: "Never encode document IDs",
    d: "Codes address a position — grade, unit, lesson, target. A lesson can be renamed, split or re-authored under a new ID and the printed page still resolves.",
  },
  {
    icon: Route,
    t: "The table is the indirection",
    d: "Restructuring content means repointing a row in this table, never reprinting a book. Retired content repoints to its replacement rather than disappearing.",
  },
];

export default function StudioQrCodesPage() {
  const copy = (target: QrTarget) => {
    const url = qrUrl(target.code);
    navigator.clipboard
      .writeText(url)
      .then(() => toast("URL copied", { description: url, tone: "success" }))
      .catch(() =>
        toast("Could not copy", {
          description: "The browser blocked clipboard access — select the URL and copy it manually.",
          tone: "error",
        }),
      );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="QR Codes"
        description="The redirect table printed into the books. Each code is a permanent address; what it resolves to is editable here."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {GROUPS.map((group) => (
            <Card key={group.lessonId}>
              <CardTitle
                action={
                  <span className="tnum font-mono text-[11.5px] text-ink-400">
                    {group.codes.length} codes
                  </span>
                }
              >
                {group.title}
              </CardTitle>
              <ul className="divide-y divide-ink-50">
                {group.codes.map((target) => {
                  const destination = qrDestination(target);
                  return (
                    <li key={target.code} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-ink-100 bg-ink-50 px-2 py-1 font-mono text-[13px] font-semibold text-ink-900">
                          {target.code}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-800">
                          {target.label}
                        </span>
                        <Chip tone={KIND_TONE[target.kind]}>{target.kind}</Chip>
                        <span className="flex items-center gap-0.5">
                          <button
                            onClick={() => copy(target)}
                            aria-label={`Copy printed URL for ${target.code}`}
                            className="cursor-pointer rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
                          >
                            <Copy className="size-4" />
                          </button>
                          <Link
                            href={`/go/${target.code}`}
                            aria-label={`Test the redirect for ${target.code}`}
                            className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11.5px] break-all text-ink-400">
                        <span>{qrUrl(target.code)}</span>
                        <span aria-hidden>→</span>
                        <span className="text-signal-700">{destination ?? "unresolved"}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <QrCode className="size-4 text-violet-700" /> The stable-code contract
              </span>
            </CardTitle>
            <p className="text-[13px] leading-relaxed text-ink-500">
              From <span className="font-mono text-[12px]">docs/ARCHITECTURE.md</span> §3:
              printed books carry codes like{" "}
              <span className="font-mono text-[12px] text-ink-700">
                zero1.education/go/g6-u2-l3-lab
              </span>
              . The <span className="font-mono text-[12px]">/go/[code]</span> route
              resolves them through this table, which survives content restructuring.
            </p>
            <ul className="mt-4 space-y-3.5">
              {CONTRACT.map((c) => (
                <li key={c.t} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink-50 text-ink-500">
                    <c.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-ink-800">
                      {c.t}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">
                      {c.d}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Anatomy of a code</CardTitle>
            <p className="font-mono text-lg font-bold text-ink-900">
              g6<span className="text-ink-300">-</span>
              <span className="text-brand-600">u1</span>
              <span className="text-ink-300">-</span>
              <span className="text-signal-600">l2</span>
              <span className="text-ink-300">-</span>
              <span className="text-violet-700">lab</span>
            </p>
            <ul className="mt-3 space-y-1.5 text-[12.5px] text-ink-500">
              <li>
                <span className="font-mono text-ink-700">g6</span> · grade, KG is{" "}
                <span className="font-mono">g0</span>
              </li>
              <li>
                <span className="font-mono text-brand-600">u1</span> · unit position in
                that grade
              </li>
              <li>
                <span className="font-mono text-signal-600">l2</span> · lesson position
                in that unit
              </li>
              <li>
                <span className="font-mono text-violet-700">lab</span> · optional target:
                lab, check or challenge
              </li>
            </ul>
            <p className="mt-3 border-t border-ink-50 pt-3 text-[12.5px] leading-relaxed text-ink-500">
              Unknown codes never 404 — they land on a designed page explaining that the
              book may be from a newer edition, with a route back into the journey.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
