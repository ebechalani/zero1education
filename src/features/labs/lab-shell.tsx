"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { CheckCircle2, FlaskConical, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Common chrome for every ZERO1 Lab: identity strip, brief, reset,
 * completion state. Labs live inside it and call onComplete when solved.
 */
export function LabShell({
  title,
  brief,
  children,
  onReset,
  completed,
  footer,
  className,
}: {
  title: string;
  brief?: string;
  children: ReactNode;
  onReset?: () => void;
  completed?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-ink-100 bg-ink-900 px-5 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
          <FlaskConical className="size-4" style={{ color: "var(--world-accent)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
            ZERO1 Lab
          </p>
          <h3 className="truncate font-display text-[15px] font-semibold text-white">
            {title}
          </h3>
        </div>
        {completed && (
          <Chip tone="mint" icon={<CheckCircle2 />}>
            Completed
          </Chip>
        )}
        {onReset && (
          <Button variant="inverse" size="sm" icon={<RotateCcw />} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>
      {brief && (
        <p className="border-b border-ink-100 bg-ink-50/60 px-5 py-3 text-[13.5px] leading-relaxed text-ink-600">
          {brief}
        </p>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-ink-100 px-5 py-3">{footer}</div>}
    </div>
  );
}
