import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type ChipTone =
  | "neutral"
  | "brand"
  | "signal"
  | "mint"
  | "coral"
  | "amber"
  | "bit"
  | "violet"
  | "ink"
  | "world";

const tones: Record<ChipTone, string> = {
  neutral: "bg-ink-100 text-ink-600",
  brand: "bg-brand-100 text-brand-700",
  signal: "bg-signal-100 text-signal-700",
  mint: "bg-mint-100 text-mint-700",
  coral: "bg-coral-100 text-coral-700",
  amber: "bg-amber-100 text-amber-700",
  bit: "bg-bit-100 text-bit-700",
  violet: "bg-violet-100 text-violet-700",
  ink: "bg-ink-800 text-ink-100",
  world: "[background:var(--world-accent-soft)] [color:var(--world-accent-text)]",
};

export function Chip({
  tone = "neutral",
  className,
  children,
  icon,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon && <span className="[&>svg]:size-3">{icon}</span>}
      {children}
    </span>
  );
}
