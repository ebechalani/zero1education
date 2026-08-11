import type { Metadata } from "next";
import InstrumentPage from "@/features/instruments/instrument-page";

export const metadata: Metadata = {
  title: "mBot2 Arena",
  description:
    "Program the mBot2 and watch it drive, sense and react in the arena.",
  robots: { index: false, follow: false },
};

export default function RobotPage() {
  return <InstrumentPage unitId="g6-robotics" />;
}
