import type { Metadata } from "next";
import InstrumentPage from "@/features/instruments/instrument-page";

export const metadata: Metadata = {
  title: "ScratchJr",
  description:
    "Build the chapter's projects with ScratchJr's picture blocks — no reading needed.",
  robots: { index: false, follow: false },
};

/**
 * Three chapters are taught in ScratchJr — Kindergarten's, Grade 1's and
 * Grade 2's — and this page lists one unit's tasks at the bottom. Grade 1's is
 * the one with tasks written so far, so it is the one named here; a lesson in
 * any of the three still deep-links straight to its own task with `?exercise=`.
 */
export default function ScratchJrPage() {
  return <InstrumentPage unitId="g1-scratchjr" />;
}
