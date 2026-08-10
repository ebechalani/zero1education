"use client";

import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { LabShell } from "./lab-shell";

type Gate = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR";
const GATES: Gate[] = ["AND", "OR", "NOT", "NAND", "NOR", "XOR"];

function InputSwitch({
  label,
  value,
  onFlip,
}: {
  label: string;
  value: boolean;
  onFlip: () => void;
}) {
  return (
    <button
      onClick={onFlip}
      aria-pressed={value}
      className={cn(
        "flex w-20 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
        value
          ? "border-signal-500 bg-signal-50 shadow-[0_0_12px_-2px_var(--color-signal-400)]"
          : "border-ink-200 bg-ink-50",
      )}
    >
      <span className="text-xs font-bold text-ink-500">{label}</span>
      <span
        className={cn(
          "font-mono text-2xl font-bold",
          value ? "text-signal-600" : "text-ink-300",
        )}
      >
        {value ? 1 : 0}
      </span>
    </button>
  );
}

const evalGate = (g: Gate, a: boolean, b: boolean): boolean => {
  switch (g) {
    case "AND": return a && b;
    case "OR": return a || b;
    case "NOT": return !a;
    case "NAND": return !(a && b);
    case "NOR": return !(a || b);
    case "XOR": return a !== b;
  }
};

/**
 * Logic Gate Playground — flip inputs, pick a gate, watch the lamp and the
 * live-highlighted truth table. The atoms every CPU is built from.
 */
export function LogicLab({
  title = "Logic Lab",
  brief,
  onComplete,
  completed,
}: {
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const [gate, setGate] = useState<Gate>("AND");
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [visited, setVisited] = useState<Set<Gate>>(new Set(["AND"]));
  const out = evalGate(gate, a, b);
  const unary = gate === "NOT";

  const pickGate = (g: Gate) => {
    setGate(g);
    const next = new Set(visited);
    next.add(g);
    setVisited(next);
    if (next.size === GATES.length) onComplete?.();
  };

  const rows = unary
    ? ([[true], [false]] as boolean[][])
    : ([
        [false, false],
        [false, true],
        [true, false],
        [true, true],
      ] as boolean[][]);

  return (
    <LabShell title={title} brief={brief} completed={completed || visited.size === GATES.length}>
      {/* Gate picker */}
      <div className="mb-5 flex flex-wrap gap-2">
        {GATES.map((g) => (
          <button
            key={g}
            onClick={() => pickGate(g)}
            className={cn(
              "cursor-pointer rounded-md border-2 px-3.5 py-1.5 font-mono text-sm font-bold transition-colors",
              gate === g
                ? "border-brand-600 bg-brand-600 text-white"
                : visited.has(g)
                  ? "border-mint-300 bg-mint-100/60 text-mint-700 hover:border-brand-400"
                  : "border-ink-200 bg-white text-ink-600 hover:border-brand-400",
            )}
          >
            {g}
          </button>
        ))}
        <span className="ml-auto self-center font-mono text-xs text-ink-400">
          {visited.size}/{GATES.length} gates explored
        </span>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
        {/* Circuit */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-3">
            <InputSwitch label="A" value={a} onFlip={() => setA(!a)} />
            {!unary && <InputSwitch label="B" value={b} onFlip={() => setB(!b)} />}
          </div>
          <div className="h-0.5 w-6 bg-ink-300" aria-hidden />
          <div className="flex h-20 w-24 items-center justify-center rounded-xl border-2 border-ink-700 bg-ink-900 font-mono text-lg font-bold text-white">
            {gate}
          </div>
          <div className="h-0.5 w-6 bg-ink-300" aria-hidden />
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
              out
                ? "border-bit-500 bg-bit-50 shadow-[0_0_18px_-2px_var(--color-bit-400)]"
                : "border-ink-200 bg-ink-50",
            )}
          >
            <Lightbulb className={cn("size-8", out ? "text-bit-500" : "text-ink-300")} />
            <span className={cn("font-mono text-lg font-bold", out ? "text-bit-600" : "text-ink-300")}>
              {out ? 1 : 0}
            </span>
          </div>
        </div>

        {/* Truth table */}
        <div className="overflow-x-auto">
          <table className="w-full max-w-xs text-center font-mono text-sm">
            <thead>
              <tr className="border-b-2 border-ink-200 text-ink-500">
                <th className="px-3 py-1.5">A</th>
                {!unary && <th className="px-3 py-1.5">B</th>}
                <th className="px-3 py-1.5 text-brand-700">OUT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const [ra, rb = false] = row;
                const active = unary ? ra === a : ra === a && rb === b;
                const rout = evalGate(gate, ra, rb);
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-ink-100 transition-colors",
                      active && "bg-brand-50 font-bold text-brand-700",
                    )}
                  >
                    <td className="px-3 py-1.5">{ra ? 1 : 0}</td>
                    {!unary && <td className="px-3 py-1.5">{rb ? 1 : 0}</td>}
                    <td className={cn("px-3 py-1.5", rout ? "text-bit-600" : "")}>
                      {rout ? 1 : 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-400">
        Flip the inputs and switch gates until you&apos;ve explored all six — the
        highlighted row always shows your current circuit.
      </p>
    </LabShell>
  );
}
