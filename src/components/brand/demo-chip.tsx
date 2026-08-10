import { Tooltip } from "@/components/ui/tooltip";
import { FlaskConical } from "lucide-react";

/**
 * Marks synthetic numbers. Every screen that shows generated demo data
 * must carry this chip — never present demo statistics as real.
 */
export function DemoChip({ label = "Demo data" }: { label?: string }) {
  return (
    <Tooltip label="Synthetic sample data for evaluation — replaced by live data in production.">
      <span className="inline-flex cursor-help items-center gap-1 rounded-full border border-amber-500/30 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <FlaskConical className="size-3" />
        {label}
      </span>
    </Tooltip>
  );
}
