import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const fieldBase =
  "w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-50 disabled:text-ink-400";

export function Input({
  className,
  ...props
}: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-9.5", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-24 py-2 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "h-9.5 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[13px] font-medium text-ink-700",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
