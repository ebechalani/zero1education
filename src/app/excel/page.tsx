import type { Metadata } from "next";
import InstrumentPage from "@/features/instruments/instrument-page";

export const metadata: Metadata = {
  title: "Spreadsheet Studio",
  description:
    "Build and format tables, then calculate with the formulas the chapter teaches.",
  robots: { index: false, follow: false },
};

export default function ExcelPage() {
  return <InstrumentPage unitId="g6-excel" />;
}
