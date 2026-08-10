import { cn, clamp } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  hint?: string;
}

/** Horizontal bar chart for mastery/completion percentages. */
export function BarChart({
  data,
  max = 100,
  suffix = "%",
  className,
  threshold,
}: {
  data: BarDatum[];
  max?: number;
  suffix?: string;
  className?: string;
  /** Values below this render in warning color */
  threshold?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d) => {
        const pct = clamp((d.value / max) * 100, 0, 100);
        const low = threshold !== undefined && d.value < threshold;
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-medium text-ink-700">
                {d.label}
              </span>
              <span
                className={cn(
                  "tnum font-mono text-[13px] font-semibold",
                  low ? "text-amber-700" : "text-ink-900",
                )}
              >
                {Math.round(d.value)}
                {suffix}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: low
                    ? "var(--color-amber-500)"
                    : (d.color ?? "var(--color-brand-500)"),
                }}
              />
            </div>
            {d.hint && <p className="mt-1 text-xs text-ink-400">{d.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
