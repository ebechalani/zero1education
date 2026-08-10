import type { ReactNode } from "react";

/**
 * Built-in curriculum illustrations — token-colored inline SVG, referenced by
 * ImageBlock.illustrationId. Self-contained (no asset pipeline needed) and
 * theme-consistent by construction.
 */

function ComputerAnatomy() {
  return (
    <svg viewBox="0 0 640 360" role="img" aria-label="Inside a computer: motherboard with CPU, RAM, storage, GPU and power supply" className="w-full">
      <rect width="640" height="360" rx="12" fill="var(--color-ink-50)" />
      {/* Case */}
      <rect x="40" y="30" width="360" height="300" rx="10" fill="#fff" stroke="var(--color-ink-200)" strokeWidth="2" />
      {/* Motherboard */}
      <rect x="65" y="55" width="310" height="250" rx="6" fill="var(--color-brand-50)" stroke="var(--color-brand-300)" strokeWidth="2" />
      <text x="75" y="78" fontSize="13" fontFamily="var(--font-jetbrains)" fill="var(--color-brand-700)">MOTHERBOARD</text>
      {/* CPU */}
      <rect x="110" y="100" width="90" height="90" rx="6" fill="var(--color-brand-500)" />
      <rect x="122" y="112" width="66" height="66" rx="4" fill="var(--color-brand-700)" />
      <text x="155" y="150" fontSize="14" fontWeight="700" fontFamily="var(--font-space-grotesk)" fill="#fff" textAnchor="middle">CPU</text>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={116 + i * 16} y="88" width="6" height="10" fill="var(--color-bit-500)" />
          <rect x={116 + i * 16} y="192" width="6" height="10" fill="var(--color-bit-500)" />
        </g>
      ))}
      {/* RAM sticks */}
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={240 + i * 26} y="95" width="18" height="105" rx="3" fill="var(--color-signal-500)" />
          {[0, 1, 2, 3].map((j) => (
            <rect key={j} x={244 + i * 26} y={102 + j * 24} width="10" height="14" rx="2" fill="var(--color-signal-800)" />
          ))}
        </g>
      ))}
      <text x="258" y="215" fontSize="11" fontFamily="var(--font-jetbrains)" fill="var(--color-signal-700)" textAnchor="middle">RAM</text>
      {/* GPU */}
      <rect x="100" y="225" width="170" height="55" rx="6" fill="var(--color-violet-500)" />
      <circle cx="140" cy="252" r="17" fill="var(--color-violet-100)" />
      <circle cx="140" cy="252" r="10" fill="var(--color-violet-700)" />
      <text x="210" y="257" fontSize="13" fontWeight="700" fontFamily="var(--font-space-grotesk)" fill="#fff" textAnchor="middle">GPU</text>
      {/* Storage */}
      <rect x="290" y="230" width="70" height="46" rx="5" fill="var(--color-ink-700)" />
      <text x="325" y="250" fontSize="10" fontFamily="var(--font-jetbrains)" fill="var(--color-signal-300)" textAnchor="middle">SSD</text>
      <rect x="300" y="258" width="50" height="6" rx="3" fill="var(--color-ink-500)" />
      {/* PSU */}
      <rect x="420" y="55" width="180" height="90" rx="8" fill="#fff" stroke="var(--color-ink-200)" strokeWidth="2" />
      <circle cx="465" cy="100" r="26" fill="var(--color-ink-100)" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1="465" y1="100" x2={465 + 22 * Math.cos((a * Math.PI) / 180)} y2={100 + 22 * Math.sin((a * Math.PI) / 180)} stroke="var(--color-ink-400)" strokeWidth="3" strokeLinecap="round" />
      ))}
      <text x="545" y="95" fontSize="12" fontWeight="600" fontFamily="var(--font-space-grotesk)" fill="var(--color-ink-700)" textAnchor="middle">POWER</text>
      <text x="545" y="112" fontSize="12" fontWeight="600" fontFamily="var(--font-space-grotesk)" fill="var(--color-ink-700)" textAnchor="middle">SUPPLY</text>
      {/* Peripherals */}
      <rect x="420" y="170" width="180" height="120" rx="8" fill="#fff" stroke="var(--color-ink-200)" strokeWidth="2" />
      <rect x="440" y="190" width="70" height="46" rx="4" fill="var(--color-ink-800)" />
      <rect x="446" y="196" width="58" height="34" rx="2" fill="var(--color-signal-400)" opacity="0.85" />
      <rect x="465" y="238" width="20" height="6" fill="var(--color-ink-300)" />
      <text x="475" y="262" fontSize="10" fontFamily="var(--font-jetbrains)" fill="var(--color-ink-500)" textAnchor="middle">OUTPUT</text>
      <rect x="525" y="196" width="60" height="26" rx="4" fill="var(--color-ink-100)" stroke="var(--color-ink-300)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={530 + i * 13} y="201" width="9" height="7" rx="1.5" fill="#fff" stroke="var(--color-ink-300)" strokeWidth="0.8" />
      ))}
      <text x="555" y="240" fontSize="10" fontFamily="var(--font-jetbrains)" fill="var(--color-ink-500)" textAnchor="middle">INPUT</text>
    </svg>
  );
}

function BinaryPlaces() {
  const places = [128, 64, 32, 16, 8, 4, 2, 1];
  const bits = [0, 0, 0, 0, 1, 0, 1, 1]; // 1011 → 11
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label="Binary place values 128 to 1, with 1011 highlighted adding to 11" className="w-full">
      <rect width="640" height="240" rx="12" fill="var(--color-ink-50)" />
      <text x="320" y="36" fontSize="15" fontFamily="var(--font-space-grotesk)" fontWeight="600" fill="var(--color-ink-700)" textAnchor="middle">
        Place values double from the right →
      </text>
      {places.map((p, i) => {
        const x = 40 + i * 72;
        const on = bits[i] === 1;
        return (
          <g key={p}>
            <text x={x + 28} y="72" fontSize="15" fontFamily="var(--font-jetbrains)" fill="var(--color-ink-400)" textAnchor="middle">{p}</text>
            <rect x={x} y="86" width="56" height="56" rx="8" fill={on ? "var(--color-signal-500)" : "#fff"} stroke={on ? "var(--color-signal-600)" : "var(--color-ink-200)"} strokeWidth="2" />
            <text x={x + 28} y="122" fontSize="26" fontWeight="700" fontFamily="var(--font-jetbrains)" fill={on ? "#fff" : "var(--color-ink-300)"} textAnchor="middle">{bits[i]}</text>
            {on && (
              <text x={x + 28} y="166" fontSize="14" fontWeight="600" fontFamily="var(--font-jetbrains)" fill="var(--color-signal-700)" textAnchor="middle">+{p}</text>
            )}
          </g>
        );
      })}
      <text x="320" y="210" fontSize="18" fontFamily="var(--font-space-grotesk)" fontWeight="700" fill="var(--color-ink-800)" textAnchor="middle">
        1011₂  =  8 + 2 + 1  =  11
      </text>
    </svg>
  );
}

const registry: Record<string, () => ReactNode> = {
  "computer-anatomy": ComputerAnatomy,
  "binary-places": BinaryPlaces,
};

export function Illustration({ id, alt }: { id: string; alt: string }) {
  const Comp = registry[id];
  if (!Comp) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-ink-50 text-sm text-ink-400">
        {alt}
      </div>
    );
  }
  return <Comp />;
}
