import { cn } from "@/lib/utils";

/**
 * The ZERØ1 wordmark — engineer's slashed zero, accented 1.
 * `tone="light"` for dark surfaces.
 */
export function Logo({
  size = "md",
  tone = "dark",
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light";
  className?: string;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl",
  } as const;
  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight select-none",
        sizes[size],
        tone === "dark" ? "text-ink-900" : "text-white",
        className,
      )}
      aria-label="ZERO1"
    >
      ZER
      <span className="relative inline-block">
        O
        <svg
          viewBox="0 0 10 14"
          aria-hidden
          className="absolute inset-0 h-full w-full"
        >
          <line
            x1="8.2"
            y1="2.4"
            x2="1.8"
            y2="11.6"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span style={{ color: "var(--world-accent, #0bb8d4)" }}>1</span>
    </span>
  );
}

/** Compact square mark for tight spaces (sidebar collapsed, favicons). */
export function LogoMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-ink-900 font-display font-bold text-white select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label="ZERO1"
    >
      <span className="relative inline-block leading-none">
        0<span className="absolute top-1/2 left-1/2 h-[1px] w-[130%] -translate-x-1/2 -translate-y-1/2 rotate-[-55deg] bg-white/90" />
      </span>
      <span className="leading-none" style={{ color: "var(--world-accent, #0bb8d4)" }}>
        1
      </span>
    </span>
  );
}
