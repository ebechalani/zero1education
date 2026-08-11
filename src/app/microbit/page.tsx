import type { Metadata } from "next";
import MicrobitClient from "./microbit-client";

export const metadata: Metadata = {
  title: "micro:bit Studio",
  description:
    "Build a micro:bit program from blocks and watch it run — for explaining on the board and for building the book's projects.",
  robots: { index: false, follow: false },
};

export default function MicrobitPage() {
  return <MicrobitClient />;
}
