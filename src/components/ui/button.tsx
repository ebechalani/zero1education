import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "world"
  | "inverse";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-card",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 shadow-card",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-coral-600 text-white hover:bg-coral-700 shadow-card",
  world:
    "text-white shadow-card [background:var(--world-accent)] hover:brightness-110",
  inverse:
    "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-9.5 px-4 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-lg",
  xl: "h-13 px-7 text-base gap-2.5 rounded-lg",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = BaseProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: never };
type LinkProps = BaseProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

const base =
  "inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "md",
    icon,
    iconRight,
    className,
    children,
    ...rest
  } = props;
  const cls = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0 [&>svg]:size-4">{iconRight}</span>}
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as ComponentProps<typeof Link>)}>
        {content}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentProps<"button">)}>
      {content}
    </button>
  );
}
