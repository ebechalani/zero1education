import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { BinaryPattern } from "@/components/brand/binary-pattern";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-dashed border-ink-200 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <BinaryPattern className="absolute inset-0 opacity-[0.35]" />
      <div className="relative">
        {icon && (
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-ink-100 text-ink-400 [&>svg]:size-6">
            {icon}
          </div>
        )}
        <h3 className="font-display text-[15px] font-semibold text-ink-800">
          {title}
        </h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            {description}
          </p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
