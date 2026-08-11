import type { Metadata } from "next";
import DrawClient from "./draw-client";

export const metadata: Metadata = {
  title: "Drawing Studio",
  description:
    "Draw the book's superhero step by step, with guide lines you can trace and fade away.",
  robots: { index: false, follow: false },
};

export default function DrawPage() {
  return <DrawClient />;
}
