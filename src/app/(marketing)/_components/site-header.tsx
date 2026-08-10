"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/curriculum", label: "Curriculum" },
  { href: "/labs", label: "ZERO1 Labs" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/for-teachers", label: "For Teachers" },
  { href: "/books", label: "Books" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ZERO1 Education — home" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "text-ink-900"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-500"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            href="/login"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Log in
          </Button>
          <Button href="/contact" size="sm" className="hidden sm:inline-flex">
            Request demo
          </Button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="cursor-pointer rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 px-4 sm:px-6">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              aria-label="ZERO1 Education — home"
            >
              <Logo size="md" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="cursor-pointer rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav
            aria-label="Primary"
            className="thin-scroll flex-1 overflow-y-auto px-4 sm:px-6"
          >
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "font-display flex items-center justify-between border-b border-ink-100 py-4 text-lg font-semibold transition-colors",
                  isActive(item.href) ? "text-brand-600" : "text-ink-800",
                )}
              >
                {item.label}
                <span className="tnum font-mono text-xs text-ink-300" aria-hidden>
                  {i.toString(2).padStart(3, "0")}
                </span>
              </Link>
            ))}
          </nav>
          <div className="shrink-0 space-y-2 border-t border-ink-100 p-4 sm:p-6">
            <Button
              href="/contact"
              size="lg"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Request demo
            </Button>
            <Button
              href="/login"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Log in
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
