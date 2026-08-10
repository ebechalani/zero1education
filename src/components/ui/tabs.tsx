"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  value,
  onChange,
  variant = "underline",
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1",
        variant === "underline" && "border-b border-ink-100",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "cursor-pointer text-sm font-medium transition-colors",
              variant === "underline" &&
                cn(
                  "-mb-px border-b-2 px-3.5 py-2.5",
                  active
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800",
                ),
              variant === "pills" &&
                cn(
                  "rounded-md px-3.5 py-1.5",
                  active
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
                ),
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "tnum ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[11px]",
                  active ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
