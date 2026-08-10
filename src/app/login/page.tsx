"use client";

import { BinaryPattern } from "@/components/brand/binary-pattern";
import { DemoChip } from "@/components/brand/demo-chip";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { Input, Label } from "@/components/ui/input";
import { DEMO_USERS } from "@/content/demo/users";
import { isLiveMode } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";
import type { Role } from "@/types/user";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleAlert,
  Eye,
  EyeOff,
  FlaskConical,
  GraduationCap,
  Info,
  Presentation,
  Route,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

interface RoleMeta {
  label: string;
  route: string;
  can: string;
  icon: ReactNode;
  tone: ChipTone;
}

const ROLE_META: Record<Role, RoleMeta> = {
  student: {
    label: "Student",
    route: "/student",
    can: "Play missions, open labs and grow the Digital Passport.",
    icon: <GraduationCap />,
    tone: "signal",
  },
  teacher: {
    label: "Teacher",
    route: "/teacher",
    can: "Classes, curriculum, Teach Mode and class analytics.",
    icon: <Presentation />,
    tone: "brand",
  },
  school_admin: {
    label: "School admin",
    route: "/admin",
    can: "People, classes, licenses and school-wide reports.",
    icon: <Building2 />,
    tone: "bit",
  },
  zero1_admin: {
    label: "ZERO1 admin",
    route: "/studio",
    can: "Authoring studio, schools, licenses and publishing.",
    icon: <ShieldCheck />,
    tone: "violet",
  },
};

const VALUE_LINES = [
  {
    icon: <Route />,
    title: "Missions, not chapters",
    body: "Every lesson runs as a mission — Discover, Learn, Try It, Lab, Challenge, Checkpoint.",
  },
  {
    icon: <FlaskConical />,
    title: "Six ZERO1 Labs, live",
    body: "Binary, Computer, Algorithm, Network, Cyber and Logic — simulations students actually operate.",
  },
  {
    icon: <BadgeCheck />,
    title: "One Digital Passport",
    body: "Skills follow the learner from Grade 0 to Grade 12 across the four learning worlds.",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-coral-600"
    >
      <CircleAlert className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { signInAs, signInWithPassword } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [notice, setNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<Role | null>(null);
  const live = isLiveMode();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "That doesn't look like a valid email address.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6)
      next.password = "Passwords are at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!live) {
      // Nothing to authenticate against — explain rather than fake a session.
      setNotice(true);
      return;
    }

    setSubmitting(true);
    setNotice(false);
    try {
      await signInWithPassword(email.trim(), password);
      const role = useSession.getState().user?.role;
      router.push(role ? ROLE_META[role].route : "/student");
    } catch (err) {
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : "Sign-in failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function enterAs(role: Role) {
    setPending(role);
    try {
      await signInAs(role);
      router.push(ROLE_META[role].route);
    } catch (err) {
      setPending(null);
      setErrors({
        form: err instanceof Error ? err.message : "Could not start demo session.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-2">
      <aside className="relative overflow-hidden bg-ink-950 text-white lg:sticky lg:top-0 lg:h-screen lg:self-start">
        <BinaryPattern
          tone="light"
          seed={101}
          cols={20}
          rows={16}
          className="absolute inset-0 h-full w-full"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-brand-600/25 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-signal-500/15 blur-3xl"
        />

        {/* Mobile: the brand panel collapses to a header strip */}
        <div className="relative flex items-center justify-between gap-3 px-5 py-4 lg:hidden">
          <Logo tone="light" size="md" />
          <p className="font-mono text-[10.5px] tracking-wide text-ink-300">
            Learn • Explore • Code • Create
          </p>
        </div>

        <div className="relative hidden h-full flex-col justify-between p-10 lg:flex xl:p-14">
          <div>
            <Logo tone="light" size="lg" />
            <p className="font-mono mt-3 text-xs tracking-[0.18em] text-ink-300 uppercase">
              Learn • Explore • Code • Create
            </p>
          </div>

          <div className="max-w-md">
            <p className="font-display text-[30px] leading-[1.15] font-bold text-white xl:text-[38px]">
              From digital learners to digital creators.
            </p>
            <ul className="mt-8 space-y-5">
              {VALUE_LINES.map((line) => (
                <li key={line.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-signal-400 [&>svg]:size-4.5">
                    {line.icon}
                  </span>
                  <span>
                    <span className="font-display block text-[15px] font-semibold text-white">
                      {line.title}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-ink-300">
                      {line.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="font-mono text-[11px] tracking-wide text-ink-400">
            Grade 0 → Grade 12 · ~60 units · 4 learning worlds
          </p>
        </div>
      </aside>

      <main className="flex justify-center px-5 py-8 sm:px-8 lg:items-center lg:py-12">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to zero1.education
          </Link>

          <h1 className="font-display mt-6 text-[26px] font-bold text-ink-900">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Access your ZERO1 classroom, curriculum and progress.
          </p>

          <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">School email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setNotice(false);
                }}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={cn(
                  errors.email &&
                    "border-coral-500 focus:border-coral-500 focus:ring-coral-500/20",
                )}
              />
              {errors.email && (
                <FieldError id="email-error">{errors.email}</FieldError>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setNotice(false);
                  }}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={cn(
                    "pr-10",
                    errors.password &&
                      "border-coral-500 focus:border-coral-500 focus:ring-coral-500/20",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-md text-ink-400 transition-colors hover:text-ink-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <FieldError id="password-error">{errors.password}</FieldError>
              )}
            </div>

            {errors.form && (
              <div
                role="alert"
                className="animate-fade-up flex gap-2.5 rounded-md border border-coral-500/30 bg-coral-100 p-3.5 text-[13px] leading-relaxed text-coral-700"
              >
                <Info className="mt-0.5 size-4 shrink-0" />
                <p>{errors.form}</p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {notice && (
            <div
              role="status"
              className="animate-fade-up mt-4 flex gap-2.5 rounded-md border border-brand-200 bg-brand-50 p-3.5 text-[13px] leading-relaxed text-ink-600"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
              <p>
                <span className="font-semibold text-ink-900">
                  Live sign-in isn&apos;t switched on yet.
                </span>{" "}
                This build runs in demo mode (
                <code className="font-mono text-[12px] text-brand-700">
                  NEXT_PUBLIC_ZERO1_MODE=demo
                </code>
                ). Firebase Auth takes over automatically once the Firebase
                environment variables are set — until then, no account is
                checked and no session is created. To explore the platform now,{" "}
                <a
                  href="#demo-users"
                  className="font-semibold text-brand-700 underline underline-offset-2"
                >
                  continue as a demo user
                </a>
                .
              </p>
            </div>
          )}

          {/* Demo identities exist only when Firebase is not configured. */}
          {live ? null : (
            <>
          <div className="my-7 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-ink-100" />
            <span className="font-mono text-[11px] tracking-[0.2em] text-ink-300 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>

          <section id="demo-users" aria-labelledby="demo-users-title">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2
                id="demo-users-title"
                className="font-display text-[15px] font-semibold text-ink-900"
              >
                Continue as a demo user
              </h2>
              <DemoChip />
            </div>
            <p className="mt-1.5 text-[13px] text-ink-500">
              Demo accounts are development-only and are removed in production
              builds.
            </p>

            <div className="mt-4 grid gap-2.5">
              {DEMO_USERS.map((user) => {
                const meta = ROLE_META[user.role];
                return (
                  <button
                    key={user.uid}
                    type="button"
                    onClick={() => enterAs(user.role)}
                    disabled={pending !== null}
                    aria-busy={pending === user.role}
                    aria-label={`Continue as ${user.firstName} ${user.lastName}, ${meta.label}`}
                    className="group flex w-full cursor-pointer items-start gap-3.5 rounded-lg border border-ink-100 bg-white p-3.5 text-left shadow-card transition-all duration-150 hover:border-brand-300 hover:shadow-pop disabled:cursor-default disabled:opacity-60 disabled:shadow-card"
                  >
                    <Avatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      hue={user.avatarHue}
                      size="md"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display text-[14.5px] font-semibold text-ink-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <Chip tone={meta.tone} icon={meta.icon}>
                          {meta.label}
                        </Chip>
                      </span>
                      <span className="mt-1 block text-[13px] leading-snug text-ink-500">
                        {meta.can}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-ink-400">
                        {pending === user.role ? "Opening" : meta.route}
                        <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
