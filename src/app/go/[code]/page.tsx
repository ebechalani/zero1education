import { QR_CODES, resolveQr } from "@/content/qr-codes";
import type { Metadata } from "next";
import GoClient from "./go-client";

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

export default function GoPage() {
  return <GoClient />;
}
