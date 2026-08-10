"use client";

import { Chip } from "@/components/ui/chip";
import { LAB_REGISTRY } from "@/features/labs/registry";
import { cn } from "@/lib/utils";

/**
 * The lab registry is a client module (every lab is interactive), so the
 * marketing grid has to sit on the client side of the boundary too — a server
 * component cannot read exports out of a "use client" module.
 */
export function LabsShowcase() {
  const labs = Object.values(LAB_REGISTRY);
  const live = labs.filter((lab) => lab.component);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip tone="signal">{live.length} labs live</Chip>
        <Chip tone="neutral">
          {labs.length - live.length} in development
        </Chip>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const isLive = Boolean(lab.component);
          return (
            <li
              key={lab.id}
              className={cn(
                "rounded-lg p-5",
                isLive
                  ? "border border-ink-100 bg-white shadow-card"
                  : "border border-dashed border-ink-200 bg-ink-50/60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg",
                    isLive
                      ? "bg-ink-900 text-signal-400"
                      : "bg-ink-100 text-ink-400",
                  )}
                >
                  {lab.icon}
                </span>
                <Chip tone={isLive ? "brand" : "neutral"}>
                  {isLive ? lab.gradeRange : "In development"}
                </Chip>
              </div>
              <h3
                className={cn(
                  "font-display mt-3.5 text-[16px] font-bold",
                  isLive ? "text-ink-900" : "text-ink-500",
                )}
              >
                {lab.name}
              </h3>
              <p
                className={cn(
                  "mt-1 text-[13.5px] leading-relaxed",
                  isLive ? "text-ink-500" : "text-ink-400",
                )}
              >
                {lab.blurb}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
