import { BinaryPattern } from "@/components/brand/binary-pattern";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <BinaryPattern className="absolute inset-0 opacity-70" tone="light" seed={404} />
      <div className="relative text-center">
        <Logo tone="light" size="lg" />
        <p className="mt-8 font-mono text-6xl font-bold text-signal-400 sm:text-7xl">
          110010000
          <span className="ml-3 align-middle font-sans text-lg font-normal text-ink-400">
            = 404
          </span>
        </p>
        <h1 className="font-display mt-4 text-2xl font-bold text-white">
          This page isn&apos;t on the map
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-300">
          The address you followed doesn&apos;t match anything in ZERO1. If you
          scanned a QR code from a printed book, it may be from a newer edition.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href="/" variant="inverse" icon={<ArrowLeft />}>
            Back to home
          </Button>
          <Button href="/student/journey" variant="world" icon={<Compass />}>
            Go to my Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
