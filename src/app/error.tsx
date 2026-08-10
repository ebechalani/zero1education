"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this reports to the error service; never log student data.
    console.error("ZERO1 error boundary:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-pop">
        <Logo size="md" />
        <span className="mx-auto mt-6 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="font-display mt-4 text-xl font-bold text-ink-900">
          Something went wrong here
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          This screen hit an unexpected error. Your progress is saved — nothing you
          completed has been lost. Try again, and if it keeps happening tell your
          teacher or contact ZERO1 support.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-md bg-ink-50 px-3 py-2 font-mono text-[11px] text-ink-400">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset} icon={<RotateCcw />}>
            Try again
          </Button>
          <Button href="/" variant="secondary" icon={<Home />}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
