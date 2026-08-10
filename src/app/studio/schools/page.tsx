"use client";

import { DemoChip } from "@/components/brand/demo-chip";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { Stat } from "@/components/ui/stat";
import { toast } from "@/components/ui/toast";
import { DEMO_SCHOOL } from "@/content/demo/users";
import { worldForGrade } from "@/lib/worlds";
import type { School } from "@/types/user";
import {
  Activity,
  Building2,
  ChevronRight,
  KeyRound,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";

interface NetworkSchool extends School {
  admin: string;
  adminEmail: string;
  relationship: "Licensed customer" | "Pilot prospect";
  /** ISO date the license or trial comes up for renewal */
  renewsOn: string;
  /** Grades with students working in ZERO1 this term */
  gradesActive: number[];
  activeThisWeek: number;
  note: string;
}

const SEED: NetworkSchool[] = [
  {
    ...DEMO_SCHOOL,
    admin: "Nadine Chami",
    adminEmail: "n.chami@cedars.edu.lb",
    relationship: "Licensed customer",
    renewsOn: "2026-09-01",
    gradesActive: [5, 6, 7, 8],
    activeThisWeek: 604,
    note: "Flagship deployment. Every Grade 6 section runs “Inside the Digital World”; Grades 5, 7 and 8 use the labs alongside the printed books.",
  },
  {
    id: "sch-pilot-horizon",
    name: "Horizon Academy",
    city: "Dubai",
    country: "UAE",
    plan: "pilot",
    seats: 120,
    seatsUsed: 74,
    status: "trial",
    createdAt: "2026-05-12T08:00:00Z",
    admin: "Samir Fadel",
    adminEmail: "s.fadel@horizon.example",
    relationship: "Pilot prospect",
    renewsOn: "2026-10-31",
    gradesActive: [6],
    activeThisWeek: 61,
    note: "Pilot prospect — two Grade 6 sections are evaluating the unit before a school-wide decision.",
  },
  {
    id: "sch-pilot-atlas",
    name: "Atlas Bilingual School",
    city: "Amman",
    country: "Jordan",
    plan: "pilot",
    seats: 90,
    seatsUsed: 38,
    status: "trial",
    createdAt: "2026-06-24T08:00:00Z",
    admin: "Lina Haddad",
    adminEmail: "l.haddad@atlas.example",
    relationship: "Pilot prospect",
    renewsOn: "2026-11-30",
    gradesActive: [6],
    activeThisWeek: 24,
    note: "Pilot prospect — one section plus the ICT department trialling Teach Mode on the projector.",
  },
];

const PLAN_TONE: Record<School["plan"], ChipTone> = {
  pilot: "signal",
  standard: "brand",
  premium: "violet",
};

const STATUS_TONE: Record<School["status"], ChipTone> = {
  active: "mint",
  trial: "amber",
  expired: "coral",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Locale-independent date label — identical on the server and client render. */
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const EMPTY_FORM = { name: "", country: "", plan: "pilot" as School["plan"], seats: "60" };

export default function StudioSchoolsPage() {
  const [schools, setSchools] = useState<NetworkSchool[]>(SEED);
  const [selected, setSelected] = useState<NetworkSchool | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const seats = schools.reduce((n, s) => n + s.seats, 0);
  const seatsUsed = schools.reduce((n, s) => n + s.seatsUsed, 0);
  const active = schools.reduce((n, s) => n + s.activeThisWeek, 0);
  const pilots = schools.filter((s) => s.relationship === "Pilot prospect").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const country = form.country.trim();
    const seatCount = Number(form.seats);
    const next: Record<string, string> = {};

    if (name.length < 3) next.name = "Enter the school's full name (3 characters or more).";
    else if (schools.some((s) => s.name.toLowerCase() === name.toLowerCase()))
      next.name = "A school with this name is already on the network.";
    if (country.length < 2) next.country = "Country is required — it drives data residency.";
    if (!Number.isInteger(seatCount) || seatCount < 5 || seatCount > 5000)
      next.seats = "Seats must be a whole number between 5 and 5,000.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const renew = new Date();
    renew.setUTCFullYear(renew.getUTCFullYear() + 1);
    const school: NetworkSchool = {
      id: `sch-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name,
      country,
      plan: form.plan,
      seats: seatCount,
      seatsUsed: 0,
      status: form.plan === "pilot" ? "trial" : "active",
      createdAt: new Date().toISOString(),
      admin: "Not assigned",
      adminEmail: "—",
      relationship: form.plan === "pilot" ? "Pilot prospect" : "Licensed customer",
      renewsOn: renew.toISOString().slice(0, 10),
      gradesActive: [],
      activeThisWeek: 0,
      note: "New tenant — invite a school admin to create classes and import the roster.",
    };

    setSchools((list) => [...list, school]);
    setAddOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
    toast(`${name} added to the network`, {
      description: "In production this provisions the tenant and license documents; here the record lives in this session only.",
      tone: "success",
    });
  };

  const columns: Column<NetworkSchool>[] = [
    {
      key: "name",
      header: "School",
      cell: (s) => (
        <span className="block">
          <span className="block font-semibold text-ink-800">{s.name}</span>
          <span className="block text-[11.5px] text-ink-400">{s.relationship}</span>
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (s) => (
        <span className="whitespace-nowrap text-ink-600">
          {[s.city, s.country].filter(Boolean).join(", ")}
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (s) => <Chip tone={PLAN_TONE[s.plan]}>{s.plan}</Chip>,
    },
    {
      key: "seats",
      header: "Seats",
      cell: (s) => (
        <span className="flex items-center gap-2">
          <span className="tnum w-16 shrink-0 font-mono text-[12.5px] text-ink-700">
            {s.seatsUsed}/{s.seats}
          </span>
          <ProgressBar
            value={(s.seatsUsed / s.seats) * 100}
            size="sm"
            tone={s.seatsUsed / s.seats > 0.9 ? "bit" : "brand"}
            className="w-16"
          />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => <Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip>,
    },
    {
      key: "renewal",
      header: "Renewal",
      align: "right",
      cell: (s) => (
        <span className="tnum whitespace-nowrap font-mono text-[12.5px] text-ink-600">
          {fmtDate(s.renewsOn)}
        </span>
      ),
    },
    {
      key: "open",
      header: <span className="sr-only">Details</span>,
      align: "right",
      cell: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelected(s);
          }}
          aria-label={`Open details for ${s.name}`}
          className="cursor-pointer rounded-md p-1 text-ink-300 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          <ChevronRight className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={<DemoChip />}
        title="Schools"
        description="Every tenant on the ZERO1 network, its license and how much of it is actually being used."
        actions={
          <Button variant="secondary" icon={<Plus />} onClick={() => setAddOpen(true)}>
            Add school
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Schools" value={schools.length} icon={<Building2 />} hint={`${schools.length - pilots} licensed · ${pilots} in pilot`} />
        <Stat label="Seats licensed" value={seats} tone="brand" icon={<KeyRound />} hint="Across all plans" />
        <Stat label="Seats used" value={seatsUsed} tone="signal" icon={<Users />} hint={`${Math.round((seatsUsed / seats) * 100)}% of licensed seats`} />
        <Stat label="Students active" value={active} tone="mint" icon={<Activity />} hint="Signed in this week" />
      </div>

      <DataTable
        columns={columns}
        rows={schools}
        rowKey={(s) => s.id}
        onRowClick={(s) => setSelected(s)}
      />

      <p className="mt-3 text-xs text-ink-400">
        Sample network records for evaluation — no real school data is shown. In
        production this table is a paginated query over the <span className="font-mono">schools</span> collection.
      </p>

      {/* School detail */}
      <Dialog open={selected !== null} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={PLAN_TONE[selected.plan]}>{selected.plan} plan</Chip>
              <Chip tone={STATUS_TONE[selected.status]}>{selected.status}</Chip>
              <span className="text-[13px] text-ink-400">
                {[selected.city, selected.country].filter(Boolean).join(", ")}
              </span>
            </div>

            <p className="text-[13.5px] leading-relaxed text-ink-600">{selected.note}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-100 p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  School admin
                </p>
                <p className="mt-1.5 text-sm font-semibold text-ink-900">{selected.admin}</p>
                <p className="font-mono text-[12px] break-all text-ink-500">
                  {selected.adminEmail}
                </p>
                <p className="mt-2 text-[12px] text-ink-400">
                  Onboarded {fmtDate(selected.createdAt)}
                </p>
              </div>
              <div className="rounded-lg border border-ink-100 p-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  Licensing
                </p>
                <p className="tnum mt-1.5 font-mono text-xl font-bold text-ink-900">
                  {selected.seatsUsed}
                  <span className="text-sm font-normal text-ink-400">
                    {" "}
                    / {selected.seats} seats
                  </span>
                </p>
                <ProgressBar
                  value={(selected.seatsUsed / selected.seats) * 100}
                  className="mt-2"
                  size="sm"
                />
                <p className="mt-2 text-[12px] text-ink-400">
                  Renews {fmtDate(selected.renewsOn)} · all grades, all ZERO1 Labs
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                Grades actively using ZERO1
              </p>
              {selected.gradesActive.length === 0 ? (
                <p className="mt-1.5 text-[13px] text-ink-400">
                  No student activity yet — invite the school admin to import a roster.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.gradesActive.map((n) => {
                    const w = worldForGrade(n);
                    return (
                      <span
                        key={n}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: w.accentSoft, color: w.accentText }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: w.accent }}
                          aria-hidden
                        />
                        {n === 0 ? "KG" : `Grade ${n}`}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 rounded-lg bg-ink-50 p-3.5">
              <Lock className="mt-0.5 size-4 shrink-0 text-mint-600" />
              <p className="text-[13px] leading-relaxed text-ink-600">
                <span className="font-semibold text-ink-800">Tenant isolation.</span>{" "}
                {selected.name}&rsquo;s students, classes, submissions and progress are
                unreachable from any other school on the network. Every document carries
                a <span className="font-mono text-[12px]">schoolId</span> and Firestore
                security rules reject cross-school reads and writes — the isolation is
                enforced at the database, not by this interface.
              </p>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add school */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a school to the network"
      >
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="school-name">School name</Label>
            <Input
              id="school-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cedars International School"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "school-name-error" : undefined}
            />
            {errors.name && (
              <p id="school-name-error" className="mt-1 text-xs text-coral-600">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="school-country">Country</Label>
              <Input
                id="school-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Lebanon"
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "school-country-error" : undefined}
              />
              {errors.country && (
                <p id="school-country-error" className="mt-1 text-xs text-coral-600">
                  {errors.country}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="school-plan">Plan</Label>
              <Select
                id="school-plan"
                value={form.plan}
                onChange={(e) =>
                  setForm({ ...form, plan: e.target.value as School["plan"] })
                }
              >
                <option value="pilot">Pilot — one unit, one term</option>
                <option value="standard">Standard — full curriculum</option>
                <option value="premium">Premium — curriculum + analytics</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="school-seats">Seats</Label>
            <Input
              id="school-seats"
              type="number"
              inputMode="numeric"
              min={5}
              max={5000}
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              aria-invalid={Boolean(errors.seats)}
              aria-describedby={errors.seats ? "school-seats-error" : "school-seats-hint"}
            />
            {errors.seats ? (
              <p id="school-seats-error" className="mt-1 text-xs text-coral-600">
                {errors.seats}
              </p>
            ) : (
              <p id="school-seats-hint" className="mt-1 text-xs text-ink-400">
                One seat per student. Teachers and admins never consume seats.
              </p>
            )}
          </div>

          <p className="rounded-lg bg-ink-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-500">
            In production, submitting this provisions a tenant document plus a license
            record and emails an invite to the school admin. In this demo build the
            school is added to the table for the current session only.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={<Plus />}>
              Add school
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
