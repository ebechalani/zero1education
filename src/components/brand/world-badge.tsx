import { cn } from "@/lib/utils";
import { WORLDS } from "@/lib/worlds";
import type { World } from "@/types/content";

export function WorldBadge({
  world,
  showGrades,
  className,
}: {
  world: World;
  showGrades?: boolean;
  className?: string;
}) {
  const w = WORLDS[world];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1.5 text-xs font-semibold",
        className,
      )}
      style={{ background: w.accentSoft, color: w.accentText }}
    >
      <span
        className="size-2 rounded-full"
        style={{ background: w.accent }}
        aria-hidden
      />
      {w.name}
      {showGrades && (
        <span className="font-normal opacity-70">· {w.grades}</span>
      )}
    </span>
  );
}

/** Applies a world's accent to all descendants via CSS variables. */
export function WorldTheme({
  world,
  children,
  className,
}: {
  world: World;
  children: React.ReactNode;
  className?: string;
}) {
  const w = WORLDS[world];
  return (
    <div
      className={className}
      style={
        {
          "--world-accent": w.accent,
          "--world-accent-soft": w.accentSoft,
          "--world-accent-text": w.accentText,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
