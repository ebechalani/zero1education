import { cn, formatNumber } from "@/lib/utils";
import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  suffix,
  icon,
  tone = "ink",
  hint,
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  tone?: "ink" | "brand" | "signal" | "bit" | "mint" | "coral";
  hint?: string;
  className?: string;
}) {
  const toneCls = {
    ink: "text-ink-900",
    brand: "text-brand-600",
    signal: "text-signal-600",
    bit: "text-bit-600",
    mint: "text-mint-600",
    coral: "text-coral-600",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-lg border border-ink-100 bg-white p-4 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
          {label}
        </p>
        {icon && <span className="text-ink-300 [&>svg]:size-4">{icon}</span>}
      </div>
      <p className={cn("tnum mt-1.5 font-mono text-2xl font-semibold", toneCls)}>
        {typeof value === "number" ? formatNumber(value) : value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-ink-400">{suffix}</span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
