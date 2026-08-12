import type { Metadata } from "next";
import InstrumentPage from "@/features/instruments/instrument-page";

export const metadata: Metadata = {
  title: "Moving the Dog",
  description:
    "The Kindergarten picture grid: put arrows in the squares until the dog reaches its food.",
  robots: { index: false, follow: false },
};

export default function KgGridPage() {
  return <InstrumentPage unitId="g0-algorithms" />;
}
