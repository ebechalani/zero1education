"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { qrDestination, resolveQr } from "@/content/qr-codes";
import { Compass, FlaskConical, QrCode } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Printed-book QR resolver. The redirect runs on the client so the route works
 * on a static host — a server redirect() cannot be exported to plain files.
 */
export default function GoClient() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = typeof params.code === "string" ? params.code : "";
  const target = resolveQr(code);
  const destination = target ? qrDestination(target) : undefined;
  const [redirecting, setRedirecting] = useState(Boolean(destination));

  useEffect(() => {
    if (destination) {
      setRedirecting(true);
      router.replace(destination);
    }
  }, [destination, router]);

  if (redirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-500">
            <QrCode className="size-4 animate-pulse" />
            Opening {target?.label ?? "your mission"}…
          </p>
        </div>
      </main>
    );
  }

  const scanned = code.trim().slice(0, 48);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>

        <EmptyState
          icon={<QrCode />}
          title="We don't recognize that code"
          description="Every code printed in a ZERO1 book maps to one mission, lab or checkpoint. This one is not in the current index."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button href="/student/journey" icon={<Compass />}>
                Open my journey
              </Button>
              <Button href="/labs" variant="secondary" icon={<FlaskConical />}>
                Browse ZERO1 Labs
              </Button>
            </div>
          }
        />

        <div className="mt-4 rounded-lg border border-ink-100 bg-white p-4 shadow-card">
          <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            Scanned code
          </p>
          <p className="mt-1 font-mono text-sm break-all text-ink-900">
            {scanned || "(empty)"}
          </p>
          <p className="mt-3 border-t border-ink-50 pt-3 text-[13px] leading-relaxed text-ink-500">
            Two things usually explain this: the book is from a newer edition than
            the platform release you are signed in to, or a character was mistyped.
            Codes read grade · unit · lesson — like{" "}
            <span className="font-mono text-ink-700">g6-u1-l2</span> for the second
            lesson of the first Grade 6 unit.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          ZERO1 codes are permanent — curriculum can be restructured without
          invalidating a single printed page.
        </p>
      </div>
    </main>
  );
}
