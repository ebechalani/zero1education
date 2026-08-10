"use client";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/stores/session-store";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({
  nav,
  children,
  topbar,
  roleLabel,
}: {
  nav: NavItem[];
  children: ReactNode;
  /** Extra content on the right side of the top bar (XP chip, bell, …) */
  topbar?: ReactNode;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href.split("/").length <= 2
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const navList = (
    <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-ink-300 hover:bg-white/5 hover:text-white",
            )}
          >
            {active && (
              <span
                className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                style={{ background: "var(--world-accent)" }}
              />
            )}
            <item.icon
              className={cn(
                "size-4.5 shrink-0",
                active ? "text-white" : "text-ink-400 group-hover:text-ink-200",
              )}
              style={active ? { color: "var(--world-accent)" } : undefined}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = user && (
    <div className="mx-3 mb-3 rounded-lg bg-white/5 p-3">
      <div className="flex items-center gap-2.5">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          hue={user.avatarHue}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-[11px] text-ink-400">{roleLabel}</p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          aria-label="Sign out"
          className="cursor-pointer rounded-md p-1.5 text-ink-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink-900 lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/" aria-label="ZERO1 home">
            <Logo tone="light" size="md" />
          </Link>
        </div>
        {navList}
        {userCard}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="animate-fade-up absolute inset-y-0 left-0 flex w-64 flex-col bg-ink-900 pt-4">
            <div className="mb-2 flex items-center justify-between px-4">
              <Logo tone="light" size="md" />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="cursor-pointer rounded-md p-1.5 text-ink-300 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            {navList}
            {userCard}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink-100 bg-white/85 px-4 backdrop-blur-sm lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="cursor-pointer rounded-md p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">{topbar}</div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
