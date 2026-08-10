import { mulberry32 } from "@/lib/utils";

/**
 * Faint deterministic field of 0s and 1s — the ZERO1 background motif.
 * Seeded PRNG keeps server and client renders identical.
 */
export function BinaryPattern({
  className,
  seed = 1,
  cols = 24,
  rows = 10,
  tone = "dark",
}: {
  className?: string;
  seed?: number;
  cols?: number;
  rows?: number;
  tone?: "dark" | "light";
}) {
  const rand = mulberry32(seed);
  const cells: { x: number; y: number; v: string; o: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const r = rand();
      if (r > 0.55) continue; // sparse
      cells.push({
        x,
        y,
        v: r > 0.27 ? "1" : "0",
        o: 0.25 + rand() * 0.75,
      });
    }
  }
  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols * 20} ${rows * 26}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {cells.map((c, i) => (
        <text
          key={i}
          x={c.x * 20 + 6}
          y={c.y * 26 + 18}
          fontSize="11"
          fontFamily="var(--font-jetbrains), monospace"
          fill={tone === "dark" ? "#0b1120" : "#ffffff"}
          opacity={c.o * 0.09}
        >
          {c.v}
        </text>
      ))}
    </svg>
  );
}
