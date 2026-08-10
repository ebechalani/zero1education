"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ProgressBar } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { DEMO_SCHOOL } from "@/content/demo/users";
import { Download, KeyRound, ShieldCheck } from "lucide-react";

const REPORTS = [
  { id: "r1", name: "Term progress report", desc: "Per-class completion and mastery, PDF" },
  { id: "r2", name: "Skills overview", desc: "Competency map for the whole school, CSV" },
  { id: "r3", name: "Engagement report", desc: "Weekly active students by grade, CSV" },
  { id: "r4", name: "Portfolio summary", desc: "Student artifact counts per class, PDF" },
];

export default function LicensesPage() {
  const pct = (DEMO_SCHOOL.seatsUsed / DEMO_SCHOOL.seats) * 100;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Licenses & Reports"
        description="Your ZERO1 subscription and exportable school reports."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Chip tone="mint">Active</Chip>}>
            <span className="flex items-center gap-2">
              <KeyRound className="size-4 text-brand-600" /> Premium license
            </span>
          </CardTitle>
          <p className="tnum font-mono text-3xl font-bold text-ink-900">
            {DEMO_SCHOOL.seatsUsed}
            <span className="text-lg text-ink-400"> / {DEMO_SCHOOL.seats} seats</span>
          </p>
          <ProgressBar value={pct} className="mt-3" />
          <ul className="mt-4 space-y-1.5 text-sm text-ink-600">
            <li>· Valid Sep 2025 — Sep 2026</li>
            <li>· All grades (KG–12), all ZERO1 Labs, Teach Mode, analytics</li>
            <li>· Priority support & teacher onboarding included</li>
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-ink-50 px-3.5 py-2.5 text-[13px] text-ink-600">
            <ShieldCheck className="size-4 shrink-0 text-mint-600" />
            Student data is tenant-isolated to your school and never shared.
          </div>
        </Card>
        <Card>
          <CardTitle>Reports</CardTitle>
          <ul className="divide-y divide-ink-50">
            {REPORTS.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-800">{r.name}</span>
                  <span className="block text-xs text-ink-400">{r.desc}</span>
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Download />}
                  onClick={() =>
                    toast(`${r.name} queued`, {
                      description: "Generated server-side and emailed in production.",
                      tone: "success",
                    })
                  }
                >
                  Export
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
