"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CircleCheckBig, Info, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

const ROLES = [
  "Teacher",
  "School administrator",
  "Ministry or district",
  "Other",
] as const;

type Field = "name" | "role" | "school" | "email" | "country" | "message";

const EMPTY: Record<Field, string> = {
  name: "",
  role: "",
  school: "",
  email: "",
  country: "",
  message: "",
};

const LABELS: Record<Field, string> = {
  name: "Full name",
  role: "Your role",
  school: "School or organisation",
  email: "Work email",
  country: "Country",
  message: "What would you like to see?",
};

function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) errors.name = "Please tell us your name.";
  if (!values.role) errors.role = "Select the option closest to your role.";
  if (!values.school.trim()) errors.school = "Which school or organisation?";
  if (!values.email.trim()) errors.email = "We need an email to reply to.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "That does not look like a valid email address.";
  if (!values.country.trim()) errors.country = "Country helps us plan the call.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<Record<Field, string>>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitted, setSubmitted] = useState<Record<Field, string> | null>(null);

  const set = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.getElementById(
        `contact-${Object.keys(found)[0]}`,
      );
      first?.focus();
      return;
    }
    setSubmitted(values);
    setValues(EMPTY);
  };

  if (submitted) {
    return (
      <div
        className="animate-pop rounded-lg border border-mint-500/30 bg-white p-6 shadow-card"
        role="status"
      >
        <span className="flex size-11 items-center justify-center rounded-lg bg-mint-100 text-mint-700">
          <CircleCheckBig className="size-5.5" />
        </span>
        <h2 className="font-display mt-3.5 text-lg font-bold text-ink-900">
          Thank you, {submitted.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
          Your request is complete and valid. In the live build it would now reach
          the ZERO1 team, and you would hear back within two working days.
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 border-y border-ink-50 py-4 sm:grid-cols-2">
          {(Object.keys(LABELS) as Field[])
            .filter((f) => submitted[f].trim())
            .map((f) => (
              <div key={f} className={cn(f === "message" && "sm:col-span-2")}>
                <dt className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                  {LABELS[f]}
                </dt>
                <dd className="text-[13.5px] leading-relaxed text-ink-700">
                  {submitted[f]}
                </dd>
              </div>
            ))}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setSubmitted(null)}>
            Send another request
          </Button>
          <p className="flex items-center gap-1.5 text-[12.5px] text-ink-400">
            <Info className="size-3.5" />
            Nothing was transmitted — this demo build has no mail backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-lg border border-ink-100 bg-white p-6 shadow-card"
    >
      <h2 className="font-display text-lg font-bold text-ink-900">
        Request a demo
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
        Fields marked with an asterisk are required.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="name" error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Nadia Haddad"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
        </Field>

        <Field id="email" error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
        </Field>

        <Field id="role" error={errors.role}>
          <Select
            id="contact-role"
            name="role"
            value={values.role}
            onChange={(e) => set("role", e.target.value)}
            aria-invalid={Boolean(errors.role)}
            aria-describedby={errors.role ? "contact-role-error" : undefined}
          >
            <option value="">Select your role…</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="country" error={errors.country}>
          <Input
            id="contact-country"
            name="country"
            autoComplete="country-name"
            placeholder="Lebanon"
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "contact-country-error" : undefined}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field id="school" error={errors.school}>
            <Input
              id="contact-school"
              name="school"
              autoComplete="organization"
              placeholder="Name of the school, group or ministry"
              value={values.school}
              onChange={(e) => set("school", e.target.value)}
              aria-invalid={Boolean(errors.school)}
              aria-describedby={errors.school ? "contact-school-error" : undefined}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="contact-message">{LABELS.message}</Label>
          <Textarea
            id="contact-message"
            name="message"
            placeholder="Which grades you teach, how many students, and anything you want the demo to cover."
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" icon={<Send />}>
          Send request
        </Button>
        <p className="text-[12.5px] text-ink-400">
          No account is created and nothing is stored.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  error,
  children,
}: {
  id: Field;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={`contact-${id}`}>
        {LABELS[id]}{" "}
        <span className="text-coral-600" aria-hidden>
          *
        </span>
        <span className="sr-only">(required)</span>
      </Label>
      {children}
      {error && (
        <p
          id={`contact-${id}-error`}
          className="mt-1 text-[12.5px] font-medium text-coral-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
