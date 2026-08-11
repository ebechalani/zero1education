"use client";

import { cn } from "@/lib/utils";
import { Droplets, Music, Sun, Thermometer } from "lucide-react";
import { useId, useState } from "react";
import type { MbButton, MbDeviceState } from "./program";

/**
 * The board itself — drawn, not photographed, so it stays crisp on a
 * projector and legible on a tablet. Everything the student can touch is a
 * real <button> or <input> layered over the artwork, never an SVG click trap.
 */

// ── Geometry (SVG user units; the overlay controls reuse these) ─────────────

const VB = { w: 520, h: 470 };
const BOARD_H = 400;

const GRID = { x: 165, y: 118, pitch: 38, w: 15, h: 23 };
const LED_DX = (GRID.pitch - GRID.w) / 2;
const LED_DY = (GRID.pitch - GRID.h) / 2;

const BUTTONS: Record<"A" | "B", { cx: number; cy: number }> = {
  A: { cx: 72, cy: 205 },
  B: { cx: 448, cy: 205 },
};
const BUTTON_BOX = 68;
const BUTTON_CAP = 21;
/** Generous invisible hit area over each cap — thumbs, not styluses. */
const HIT = 104;

const BIG_PADS: { cx: number; label: string }[] = [
  { cx: 52, label: "0" },
  { cx: 170, label: "1" },
  { cx: 288, label: "2" },
  { cx: 390, label: "3V" },
  { cx: 476, label: "GND" },
];
const PAD_W = 60;
const NOTCHES: { cx: number; r: number }[] = [
  { cx: 111, r: 14 },
  { cx: 229, r: 14 },
  { cx: 339, r: 14 },
  { cx: 433, r: 11 },
];

/** Thin gold fingers filling the gaps; the notch mask trims the ones it meets. */
const SMALL_PINS: number[] = (() => {
  const gaps: [number, number][] = [
    [82, 140],
    [200, 258],
    [318, 360],
    [420, 446],
  ];
  const xs: number[] = [];
  for (const [from, to] of gaps) {
    for (let x = from + 6; x <= to - 6; x += 11) xs.push(x);
  }
  return xs;
})();

/** The Kitronik board the micro:bit plugs into: its three ZIP LEDs. */
const ZIP = { x: 40, y: 412, w: 440, h: 54, cy: 439, r: 15, cxs: [220, 300, 380] };

const ZIP_COLOUR: Record<MbDeviceState["zip"], string> = {
  red: "var(--color-coral-500)",
  green: "var(--color-mint-500)",
  amber: "var(--color-amber-500)",
  off: "var(--color-ink-700)",
};

const SIZES = { sm: 220, md: 340, lg: 560 } as const;

const pctX = (x: number) => `${(x / VB.w) * 100}%`;
const pctY = (y: number) => `${(y / VB.h) * 100}%`;

// ── Sensors ─────────────────────────────────────────────────────────────────

type SensorName = "temperature" | "humidity" | "light";

const SENSORS: {
  name: SensorName;
  label: string;
  Icon: typeof Thermometer;
  min: number;
  max: number;
  unit: string;
  accent: string;
}[] = [
  {
    name: "temperature",
    label: "Temperature",
    Icon: Thermometer,
    min: -10,
    max: 50,
    unit: "°C",
    accent: "accent-coral-500",
  },
  {
    name: "humidity",
    label: "Humidity",
    Icon: Droplets,
    min: 0,
    max: 100,
    unit: "%",
    accent: "accent-signal-500",
  },
  {
    name: "light",
    label: "Light level",
    Icon: Sun,
    min: 0,
    max: 255,
    unit: "",
    accent: "accent-bit-500",
  },
];

export function MicrobitDevice({
  state,
  onButton,
  size = "md",
  showSensors = false,
  onSensorChange,
  className,
}: {
  state: MbDeviceState;
  onButton?: (button: MbButton) => void;
  size?: "sm" | "md" | "lg";
  showSensors?: boolean;
  onSensorChange?: (name: SensorName, value: number) => void;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [pressed, setPressed] = useState<MbButton | null>(null);
  const big = size === "lg";

  const lit = state.leds.flat().filter((b) => b > 0).length;
  const summary = [
    `micro:bit screen, ${lit} of 25 lights on`,
    state.display ? `showing “${state.display}”` : null,
    state.zip !== "off" ? `ZIP LEDs ${state.zip}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cn("mx-auto flex w-full flex-col gap-3", className)}
      style={{ maxWidth: SIZES[size] }}
    >
      <div className="relative w-full select-none">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          className="h-auto w-full"
          role="img"
          aria-label={summary}
        >
          <defs>
            <linearGradient id={`${uid}-pcb`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-ink-800)" />
              <stop offset="100%" stopColor="var(--color-ink-950)" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7d894" />
              <stop offset="100%" stopColor="#cf9c33" />
            </linearGradient>
            <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3e8f3" />
              <stop offset="100%" stopColor="#8e99b4" />
            </linearGradient>
            {/* One shared bloom for every lit thing — 25 filters would crawl. */}
            <filter
              id={`${uid}-bloom`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <mask id={`${uid}-board`}>
              <rect x="0" y="0" width={VB.w} height={BOARD_H} rx="28" fill="#fff" />
              {NOTCHES.map((notch) => (
                <circle
                  key={notch.cx}
                  cx={notch.cx}
                  cy={BOARD_H}
                  r={notch.r}
                  fill="#000"
                />
              ))}
            </mask>
          </defs>

          {/* ── The PCB, notched edge connector and all ── */}
          <g mask={`url(#${uid}-board)`}>
            <rect
              x="0"
              y="0"
              width={VB.w}
              height={BOARD_H}
              rx="28"
              fill={`url(#${uid}-pcb)`}
            />
            <rect
              x="0.75"
              y="0.75"
              width={VB.w - 1.5}
              height={BOARD_H - 1.5}
              rx="27"
              fill="none"
              stroke="var(--color-ink-600)"
              strokeWidth="1.5"
            />

            {SMALL_PINS.map((x) => (
              <rect
                key={x}
                x={x - 3}
                y={364}
                width="6"
                height={BOARD_H - 364}
                fill={`url(#${uid}-gold)`}
                opacity="0.85"
              />
            ))}

            {BIG_PADS.map((pad) => (
              <g key={pad.label}>
                <rect
                  x={pad.cx - PAD_W / 2}
                  y={352}
                  width={PAD_W}
                  height={BOARD_H - 352}
                  rx="5"
                  fill={`url(#${uid}-gold)`}
                />
                {/* The crocodile-clip hole punched through each ring */}
                <circle cx={pad.cx} cy={379} r="12" fill="var(--color-ink-950)" />
              </g>
            ))}
          </g>

          {/* Pin names, printed on the board above their pads */}
          {BIG_PADS.map((pad) => (
            <text
              key={pad.label}
              x={pad.cx}
              y={344}
              textAnchor="middle"
              fill="var(--color-ink-300)"
              fontSize="15"
              fontFamily="var(--font-mono)"
            >
              {pad.label}
            </text>
          ))}

          {/* Top edge: battery connector, USB, power LED */}
          <rect x="26" y="-6" width="70" height="30" rx="4" fill="#dfe4f0" />
          <rect x="208" y="-8" width="104" height="36" rx="5" fill={`url(#${uid}-metal)`} />
          <rect x="222" y="6" width="76" height="9" rx="4" fill="var(--color-ink-700)" />
          <circle
            cx="486"
            cy="22"
            r="6"
            fill={state.running ? "var(--color-mint-500)" : "var(--color-ink-700)"}
          />
          <text
            x="30"
            y="84"
            fill="var(--color-ink-500)"
            fontSize="19"
            fontFamily="var(--font-mono)"
          >
            micro:bit
          </text>

          {/* ── Buttons A and B (artwork only; the real control is overlaid) ── */}
          {(["A", "B"] as const).map((key) => {
            const pos = BUTTONS[key];
            const down = pressed === key || pressed === "A+B";
            return (
              <g key={key}>
                <rect
                  x={pos.cx - BUTTON_BOX / 2}
                  y={pos.cy - BUTTON_BOX / 2}
                  width={BUTTON_BOX}
                  height={BUTTON_BOX}
                  rx="10"
                  fill="var(--color-ink-700)"
                  stroke="var(--color-ink-600)"
                  strokeWidth="2"
                />
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={down ? BUTTON_CAP - 2 : BUTTON_CAP}
                  fill={down ? "var(--color-ink-950)" : "var(--color-ink-900)"}
                  stroke={down ? "var(--world-accent, #0bb8d4)" : "var(--color-ink-500)"}
                  strokeWidth={down ? 3 : 2}
                />
                <text
                  x={pos.cx}
                  y={pos.cy + BUTTON_BOX / 2 + 32}
                  textAnchor="middle"
                  fill={down ? "var(--world-accent, #0bb8d4)" : "var(--color-ink-200)"}
                  fontSize="30"
                  fontWeight="700"
                  fontFamily="var(--font-display)"
                >
                  {key}
                </text>
              </g>
            );
          })}

          {/* ── The 25 LEDs ── */}
          {/* Bloom pass: blurred copies of everything that is alight */}
          <g filter={`url(#${uid}-bloom)`}>
            {state.leds.flatMap((row, y) =>
              row.map((brightness, x) =>
                brightness > 0 ? (
                  <rect
                    key={`glow-${x}-${y}`}
                    x={GRID.x + x * GRID.pitch + LED_DX}
                    y={GRID.y + y * GRID.pitch + LED_DY}
                    width={GRID.w}
                    height={GRID.h}
                    rx="3"
                    fill="var(--color-coral-500)"
                    opacity={0.25 + (brightness / 255) * 0.55}
                  />
                ) : null,
              ),
            )}
            {state.zip !== "off" &&
              ZIP.cxs.map((cx) => (
                <circle
                  key={`zipglow-${cx}`}
                  cx={cx}
                  cy={ZIP.cy}
                  r={ZIP.r}
                  fill={ZIP_COLOUR[state.zip]}
                  opacity="0.8"
                />
              ))}
          </g>

          {/* Crisp pass */}
          {state.leds.flatMap((row, y) =>
            row.map((brightness, x) => {
              const on = brightness > 0;
              const level = brightness / 255;
              return (
                <g key={`led-${x}-${y}`}>
                  <rect
                    x={GRID.x + x * GRID.pitch + LED_DX}
                    y={GRID.y + y * GRID.pitch + LED_DY}
                    width={GRID.w}
                    height={GRID.h}
                    rx="3"
                    fill="var(--color-coral-500)"
                    opacity={on ? Math.max(0.35, level) : 0.13}
                  />
                  {on && (
                    <rect
                      x={GRID.x + x * GRID.pitch + LED_DX + 3.5}
                      y={GRID.y + y * GRID.pitch + LED_DY + 6}
                      width={GRID.w - 7}
                      height={GRID.h - 12}
                      rx="2"
                      fill="#fff"
                      opacity={level * 0.55}
                    />
                  )}
                </g>
              );
            }),
          )}

          {/* ── Kitronik ZIP LED strip, sitting under the edge connector ── */}
          <rect
            x={ZIP.x}
            y={ZIP.y}
            width={ZIP.w}
            height={ZIP.h}
            rx="12"
            fill="var(--color-ink-800)"
            stroke="var(--color-ink-700)"
            strokeWidth="2"
          />
          <text
            x={ZIP.x + 24}
            y={ZIP.cy + 6}
            fill="var(--color-ink-400)"
            fontSize="17"
            fontFamily="var(--font-mono)"
            letterSpacing="1.5"
          >
            ZIP LEDS
          </text>
          {ZIP.cxs.map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy={ZIP.cy}
              r={ZIP.r}
              fill={ZIP_COLOUR[state.zip]}
              stroke="var(--color-ink-600)"
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* Real buttons, sized for fingers, sitting exactly over the caps */}
        {onButton &&
          (["A", "B"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-label={`Press button ${key}`}
              title={`Button ${key}`}
              onPointerDown={() => setPressed(key)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setPressed(key);
              }}
              onKeyUp={() => setPressed(null)}
              onBlur={() => setPressed(null)}
              onClick={() => onButton(key)}
              className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full"
              style={{
                left: pctX(BUTTONS[key].cx),
                top: pctY(BUTTONS[key].cy),
                width: pctX(HIT),
                height: pctY(HIT),
              }}
            />
          ))}
      </div>

      {/* Status line — what the screen is saying, and whether it is buzzing */}
      {(state.display || state.tone || onButton) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {state.display && (
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-ink-900 px-3 py-1 font-mono text-xs text-signal-300">
              {state.display}
            </span>
          )}
          {state.tone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bit-100 px-2.5 py-1 font-mono text-xs text-bit-700">
              <Music className="size-3" aria-hidden /> {state.tone}
            </span>
          )}
          {onButton && (
            <button
              type="button"
              onPointerDown={() => setPressed("A+B")}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setPressed("A+B");
              }}
              onKeyUp={() => setPressed(null)}
              onBlur={() => setPressed(null)}
              onClick={() => onButton("A+B")}
              aria-label="Press buttons A and B together"
              className="inline-flex h-8 cursor-pointer items-center rounded-full border border-ink-200 bg-white px-3 font-mono text-xs font-semibold text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50"
            >
              A+B
            </button>
          )}
        </div>
      )}

      {/* Sensor dials — a teacher can walk a threshold across live */}
      {showSensors && (
        <div className="rounded-lg border border-ink-200 bg-white p-3 shadow-card">
          <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-400 uppercase">
            Air quality sensors
          </p>
          <div className="flex flex-col gap-3">
            {SENSORS.map((sensor) => {
              const value = Math.round(state[sensor.name]);
              return (
                <div key={sensor.name}>
                  <div className="mb-1 flex items-center gap-2">
                    <sensor.Icon
                      className="size-4 shrink-0 text-ink-400"
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "flex-1 font-medium text-ink-600",
                        big ? "text-[15px]" : "text-[13px]",
                      )}
                    >
                      {sensor.label}
                    </span>
                    <span
                      className={cn(
                        "tnum font-mono font-semibold text-ink-900",
                        big ? "text-lg" : "text-sm",
                      )}
                    >
                      {value}
                      {sensor.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={sensor.min}
                    max={sensor.max}
                    step={1}
                    value={value}
                    disabled={!onSensorChange}
                    onChange={(e) =>
                      onSensorChange?.(sensor.name, Number(e.target.value))
                    }
                    aria-label={`${sensor.label}${sensor.unit ? ` in ${sensor.unit}` : ""}`}
                    className={cn(
                      "h-6 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                      sensor.accent,
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
