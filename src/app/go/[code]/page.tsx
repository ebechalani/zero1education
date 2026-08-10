import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QR_CODES, qrDestination, resolveQr } from "@/content/qr-codes";
import { Compass, FlaskConical, QrCode } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export function generateStaticParams() {
  return QR_CODES.map((t) => ({ code: t.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const target = resolveQr(code);
  return {
    title: target ? `Opening ${target.label}` : "Code not recognized",
    description: target
      ? `Printed ZERO1 code ${target.code} — opens ${target.label}.`
      : "This printed ZERO1 code is not in the current redirect table.",
    robots: { index: false, follow: false },
  };
}

export default async function GoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const target = resolveQr(code);
  const destination = target && qrDestination(target);
  if (destination) redirect(destination);

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
