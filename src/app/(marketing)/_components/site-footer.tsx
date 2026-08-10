import { BinaryPattern } from "@/components/brand/binary-pattern";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { Fragment } from "react";

interface FooterLink {
  label: string;
  href?: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "For Students", href: "/for-students" },
      { label: "For Teachers", href: "/for-teachers" },
      { label: "For Schools", href: "/for-schools" },
      { label: "ZERO1 Labs", href: "/labs" },
    ],
  },
  {
    title: "Curriculum",
    links: [
      { label: "Grade 0–2 · Explorer", href: "/curriculum" },
      { label: "Grade 3–5 · Builder", href: "/curriculum" },
      { label: "Grade 6–8 · Creator", href: "/curriculum" },
      { label: "Grade 9–12 · Innovator", href: "/curriculum" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Books", href: "/books" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [{ label: "Privacy" }, { label: "Terms" }, { label: "Child Safety" }],
  },
];

const TAGLINE = ["Learn", "Explore", "Code", "Create"];

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-ink-950">
      <BinaryPattern
        tone="light"
        seed={17}
        cols={40}
        rows={14}
        className="absolute inset-0 h-full w-full"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-mono text-[11px] tracking-[0.22em] text-ink-400 uppercase">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-ink-300 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-[13.5px] text-ink-500">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Logo tone="light" size="md" />
          <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.2em] text-ink-300 uppercase">
            {TAGLINE.map((word, i) => (
              <Fragment key={word}>
                {i > 0 && (
                  <span className="text-signal-400/60" aria-hidden>
                    {i % 2 === 0 ? "0" : "1"}
                  </span>
                )}
                <span>{word}</span>
              </Fragment>
            ))}
          </p>
          <p className="text-xs text-ink-500">© 2026 ZERO1 Education</p>
        </div>
      </div>
    </footer>
  );
}
