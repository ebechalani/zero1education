import { cn, clamp } from "@/lib/utils";
import type { ReactNode } from "react";

export function ProgressBar({
  value,
  className,
  tone = "brand",
  size = "md",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "signal" | "mint" | "bit" | "world";
  size?: "sm" | "md";
}) {
  const fills = {
    brand: "bg-brand-500",
    signal: "bg-signal-500",
    mint: "bg-mint-500",
    bit: "bg-bit-500",
    world: "[background:var(--world-accent)]",
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-ink-100",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", fills[tone])}
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  );
}

/**
 * The ZERO1 "bit bar" — progress as 8 bits. A brand signature used for
 * mastery and mission progress.
 */
export function ProgressBits({
  value,
  className,
  tone = "signal",
}: {
  value: number;
  className?: string;
  tone?: "signal" | "brand" | "mint" | "bit" | "world";
}) {
  const filled = Math.round(clamp(value, 0, 100) / 12.5);
  const fills = {
    signal: "bg-signal-500",
    brand: "bg-brand-500",
    mint: "bg-mint-500",
    bit: "bg-bit-500",
    world: "[background:var(--world-accent)]",
  };
  return (
    <div
      className={cn("flex items-center gap-[3px]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(value)} percent`}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 flex-1 rounded-[2px] transition-colors duration-300",
            i < filled ? fills[tone] : "bg-ink-100",
          )}
        />
      ))}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 6,
  tone = "brand",
  children,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: "brand" | "signal" | "mint" | "bit" | "world";
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(value, 0, 100);
  const strokes = {
    brand: "stroke-brand-500",
    signal: "stroke-signal-500",
    mint: "stroke-mint-500",
    bit: "stroke-bit-500",
    world: "[stroke:var(--world-accent)]",
  };
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn("transition-all duration-700", strokes[tone])}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
