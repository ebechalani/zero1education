import { cn } from "@/lib/utils";

/**
 * Skill heatmap: rows (e.g. students) × columns (e.g. skills), values 0–100.
 * Color ramp ink-50 → brand. Cells under `flagBelow` render amber.
 */
export function Heatmap({
  rowLabels,
  colLabels,
  values,
  flagBelow = 40,
  onRowClick,
  className,
}: {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
  flagBelow?: number;
  onRowClick?: (rowIndex: number) => void;
  className?: string;
}) {
  const cellColor = (v: number) => {
    if (v < flagBelow) return "var(--color-amber-100)";
    const t = v / 100;
    const alpha = 0.12 + t * 0.88;
    return `rgb(61 99 255 / ${alpha.toFixed(2)})`;
  };
  const textColor = (v: number) =>
    v < flagBelow
      ? "var(--color-amber-700)"
      : v > 55
        ? "#fff"
        : "var(--color-ink-700)";

  return (
    <div className={cn("thin-scroll overflow-x-auto", className)}>
      <table className="w-full border-separate border-spacing-[3px] text-xs">
        <thead>
          <tr>
            <th className="min-w-32 text-left font-medium text-ink-400" />
            {colLabels.map((c) => (
              <th
                key={c}
                className="min-w-16 pb-1 text-center font-medium whitespace-nowrap text-ink-500"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr
              key={r}
              onClick={onRowClick ? () => onRowClick(ri) : undefined}
              className={cn(onRowClick && "group cursor-pointer")}
            >
              <td className="pr-2 font-medium whitespace-nowrap text-ink-600 group-hover:text-brand-700">
                {r}
              </td>
              {colLabels.map((_, ci) => {
                const v = values[ri]?.[ci] ?? 0;
                return (
                  <td
                    key={ci}
                    className="tnum rounded-[4px] px-1.5 py-1.5 text-center font-mono font-medium"
                    style={{ background: cellColor(v), color: textColor(v) }}
                    title={`${r} · ${colLabels[ci]}: ${Math.round(v)}%`}
                  >
                    {Math.round(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
