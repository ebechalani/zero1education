import type { Metadata } from "next";
import InstrumentPage from "@/features/instruments/instrument-page";

export const metadata: Metadata = {
  title: "Scratch Stage",
  description:
    "Build the chapter's stories, animations and games on a Scratch stage.",
  robots: { index: false, follow: false },
};

export default function ScratchPage() {
  return <InstrumentPage unitId="g6-scratch" />;
}
