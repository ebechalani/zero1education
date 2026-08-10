import { cn, initials } from "@/lib/utils";

/** Hue-based initials avatar — deliberately no photos for child privacy. */
export function Avatar({
  firstName,
  lastName,
  hue,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  hue: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
    xl: "size-20 text-2xl",
  } as const;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold",
        sizes[size],
        className,
      )}
      style={{
        background: `hsl(${hue} 70% 92%)`,
        color: `hsl(${hue} 55% 32%)`,
      }}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
