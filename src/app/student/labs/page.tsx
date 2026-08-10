"use client";

import { PageHeader } from "@/components/layout/app-shell";
import { Chip } from "@/components/ui/chip";
import { LAB_REGISTRY } from "@/features/labs/registry";
import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";

export default function LabsGallery() {
  const labs = Object.values(LAB_REGISTRY);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="ZERO1 Labs"
        description="Hands-on simulations where the concepts become real. Free exploration — XP is earned when labs appear inside missions."
        eyebrow={
          <Chip tone="world" icon={<FlaskConical />}>
            {labs.filter((l) => l.component).length} labs live
          </Chip>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const live = Boolean(lab.component);
          return (
            <Link
              key={lab.id}
              href={live ? `/student/labs/${lab.id}` : "#"}
              onClick={(e) => !live && e.preventDefault()}
              className={
                live
                  ? "group rounded-xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:border-brand-300 hover:shadow-pop"
                  : "cursor-not-allowed rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-5"
              }
            >
              <div className="flex items-start justify-between">
                <span
                  className={
                    "flex size-11 items-center justify-center rounded-lg " +
                    (live
                      ? "bg-ink-900 text-white [&>svg]:!text-[var(--world-accent)]"
                      : "bg-ink-100 text-ink-400")
                  }
                  style={live ? { color: "var(--world-accent)" } : undefined}
                >
                  {lab.icon}
                </span>
                <Chip tone={live ? "signal" : "neutral"}>
                  {live ? lab.gradeRange : "In development"}
                </Chip>
              </div>
              <h3 className="font-display mt-3.5 text-[16px] font-bold text-ink-900">
                {lab.name}
              </h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                {lab.blurb}
              </p>
              {live && (
                <p className="mt-3 flex items-center gap-1 text-[13px] font-semibold text-brand-600 transition-transform group-hover:translate-x-0.5">
                  Open lab <ArrowRight className="size-3.5" />
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
