"use client";

import { cn } from "@/lib/utils";
import {
  RB_BEAM_DEG,
  RB_COLOUR_HEX,
  RB_ROBOT_LENGTH_CM,
  RB_ROBOT_WIDTH_CM,
  RB_SENSOR_OFFSET_CM,
  RB_ULTRASONIC_MAX_CM,
  rbHeadingVector,
  type RbArena,
  type RbColour,
  type RbWorldState,
  type RbZoneTone,
} from "./robot-model";

/**
 * The arena, seen from above.
 *
 * Its one job is to make sensing visible. A teacher stops a mission halfway and
 * points at the screen: the beam of the ultrasonic sensor is drawn as a real
 * cone with the measured distance written on it, the colour the quad RGB sensor
 * is reading is painted under the robot, and the trail shows every centimetre
 * the wheels have covered. That is how a class can answer *why* the robot
 * stopped, instead of being told.
 *
 * Everything inside the SVG is measured in centimetres — the same numbers that
 * are typed into the blocks — so 70 cm on the page is 70 cm in the mission.
 */

const ZONE_HEX: Record<RbZoneTone, string> = {
  mint: "#10b981",
  coral: "#f43f5e",
  brand: "#3d63ff",
  amber: "#f59e0b",
  violet: "#7c5cfc",
};

/** Padding around the arena so labels and the robot never touch the edge. */
const PAD = 8;

const COMPASS: { from: number; to: number; word: string }[] = [
  { from: 337.5, to: 360, word: "up the page" },
  { from: 0, to: 22.5, word: "up the page" },
  { from: 22.5, to: 67.5, word: "up and to the right" },
  { from: 67.5, to: 112.5, word: "to the right" },
  { from: 112.5, to: 157.5, word: "down and to the right" },
  { from: 157.5, to: 202.5, word: "down the page" },
  { from: 202.5, to: 247.5, word: "down and to the left" },
  { from: 247.5, to: 292.5, word: "to the left" },
  { from: 292.5, to: 337.5, word: "up and to the left" },
];

export function headingWord(heading: number): string {
  const h = ((heading % 360) + 360) % 360;
  return COMPASS.find((c) => h >= c.from && h < c.to)?.word ?? "up the page";
}

const COLOUR_WORD: Record<RbColour, string> = {
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
  white: "white",
  black: "black",
  none: "nothing",
};

/** A wedge from (x, y): the cone the ultrasonic sensor listens in. */
function beamPath(
  x: number,
  y: number,
  heading: number,
  radius: number,
): string {
  const half = (RB_BEAM_DEG / 2) * (Math.PI / 180);
  const rad = (heading * Math.PI) / 180;
  const left = rad - half;
  const right = rad + half;
  const point = (angle: number) => ({
    x: x + Math.sin(angle) * radius,
    y: y - Math.cos(angle) * radius,
  });
  const a = point(left);
  const b = point(right);
  return `M ${x} ${y} L ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y} Z`;
}

function Robot({ world }: { world: RbWorldState }) {
  const w = RB_ROBOT_WIDTH_CM;
  const l = RB_ROBOT_LENGTH_CM;
  const colour = RB_COLOUR_HEX[world.colourSeen];
  return (
    <g
      transform={`translate(${world.x} ${world.y}) rotate(${world.heading})`}
      style={{ transition: "none" }}
    >
      {/* what the downward colour sensor is reading, right under the robot */}
      <circle
        cx={0}
        cy={-l / 2 + 2.5}
        r={3.4}
        fill={colour}
        stroke="#0b1120"
        strokeWidth={0.5}
        opacity={0.95}
      />
      {/* wheels */}
      <rect
        x={-w / 2 - 1.6}
        y={-2.6}
        width={2.6}
        height={7}
        rx={1}
        fill="#0b1120"
      />
      <rect
        x={w / 2 - 1}
        y={-2.6}
        width={2.6}
        height={7}
        rx={1}
        fill="#0b1120"
      />
      {/* chassis */}
      <rect
        x={-w / 2}
        y={-l / 2}
        width={w}
        height={l}
        rx={2.2}
        fill="#1f8fd0"
        stroke="#0d4f74"
        strokeWidth={0.7}
      />
      {/* the two ultrasonic transducers on the nose */}
      <circle cx={-2.6} cy={-l / 2 + 1.9} r={1.5} fill="#0b1120" />
      <circle cx={2.6} cy={-l / 2 + 1.9} r={1.5} fill="#0b1120" />
      {/* the CyberPi, sitting on top */}
      <rect
        x={-w / 2 + 1.4}
        y={-1.6}
        width={w - 2.8}
        height={6.4}
        rx={1}
        fill="#151d33"
      />
      <rect
        x={-w / 2 + 2.4}
        y={-0.6}
        width={w - 6.4}
        height={4.4}
        rx={0.6}
        fill="#38e0d0"
        opacity={world.running ? 0.95 : 0.45}
      />
      {/* heading arrow — which way "forward" points */}
      <path
        d={`M 0 ${-l / 2 - 4.6} L 3 ${-l / 2 - 0.6} L -3 ${-l / 2 - 0.6} Z`}
        fill="#ff8a1f"
        stroke="#7a3d00"
        strokeWidth={0.4}
      />
    </g>
  );
}

export function RobotArena({
  arena,
  world,
  className,
  showReadout = true,
}: {
  arena: RbArena;
  world: RbWorldState;
  className?: string;
  showReadout?: boolean;
}) {
  const sensor = (() => {
    const { dx, dy } = rbHeadingVector(world.heading);
    return {
      x: world.x + dx * RB_SENSOR_OFFSET_CM,
      y: world.y + dy * RB_SENSOR_OFFSET_CM,
      dx,
      dy,
    };
  })();

  const reading = Math.round(world.distanceCm);
  const beamLength = Math.min(world.distanceCm, RB_ULTRASONIC_MAX_CM);
  const hit = {
    x: sensor.x + sensor.dx * beamLength,
    y: sensor.y + sensor.dy * beamLength,
  };
  const far = reading >= RB_ULTRASONIC_MAX_CM;

  const gridLines: number[][] = [];
  if (arena.gridCm > 0) {
    for (let x = arena.gridCm; x < arena.widthCm; x += arena.gridCm) {
      gridLines.push([x, 0, x, arena.heightCm]);
    }
    for (let y = arena.gridCm; y < arena.heightCm; y += arena.gridCm) {
      gridLines.push([0, y, arena.widthCm, y]);
    }
  }

  const label = [
    `Top-down view of ${arena.name}.`,
    `The robot is ${Math.round(world.x)} centimetres across and ${Math.round(
      world.y,
    )} centimetres down, facing ${headingWord(world.heading)}.`,
    far
      ? "The ultrasonic sensor sees nothing in front of it."
      : `The ultrasonic sensor reads ${reading} centimetres.`,
    `The colour sensor reads ${COLOUR_WORD[world.colourSeen]}.`,
    `It has driven ${Math.round(world.travelledCm)} centimetres in all.`,
  ].join(" ");

  return (
    <div className={cn("min-w-0", className)}>
      <div className="thin-scroll overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <svg
          role="img"
          aria-label={label}
          viewBox={`${-PAD} ${-PAD} ${arena.widthCm + PAD * 2} ${
            arena.heightCm + PAD * 2
          }`}
          className="block h-auto w-full min-w-[300px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="rb-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0bb8d4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0bb8d4" stopOpacity="0.08" />
            </linearGradient>
            <pattern
              id="rb-hatch"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="4" height="4" fill="#2e3a5c" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="4"
                stroke="#47547a"
                strokeWidth="1.6"
              />
            </pattern>
          </defs>

          {/* floor */}
          <rect
            x={0}
            y={0}
            width={arena.widthCm}
            height={arena.heightCm}
            rx={3}
            fill="#f6f7fb"
            stroke="#c6ccde"
            strokeWidth={0.9}
          />

          {/* measuring grid */}
          <g stroke="#e4e7f0" strokeWidth={0.35}>
            {gridLines.map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>

          {/* painted floor — what the colour sensor can read */}
          {arena.patches.map((patch) => (
            <g key={patch.id}>
              <rect
                x={patch.x}
                y={patch.y}
                width={patch.w}
                height={patch.h}
                rx={patch.radius ?? 0}
                fill={
                  patch.colour === "none" ? "#e9edf7" : RB_COLOUR_HEX[patch.colour]
                }
                stroke={patch.road ? "#0b1120" : "#98a1bd"}
                strokeWidth={patch.road ? 0 : 0.4}
                opacity={patch.colour === "none" ? 0.9 : 1}
              />
              {patch.label && !patch.road && (
                <text
                  x={patch.x + patch.w / 2}
                  y={patch.y + patch.h / 2 + 1.4}
                  textAnchor="middle"
                  fontSize={4}
                  fill="#47547a"
                  fontWeight={600}
                >
                  {patch.label}
                </text>
              )}
            </g>
          ))}

          {/* zones the mission is judged on */}
          {arena.zones.map((zone) => {
            const hex = ZONE_HEX[zone.tone];
            const inside =
              world.x >= zone.x &&
              world.x <= zone.x + zone.w &&
              world.y >= zone.y &&
              world.y <= zone.y + zone.h;
            return (
              <g key={zone.id}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx={2}
                  fill={hex}
                  fillOpacity={inside ? 0.3 : 0.12}
                  stroke={hex}
                  strokeWidth={inside ? 1.4 : 0.9}
                  strokeDasharray="3 2"
                />
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y - 2}
                  textAnchor="middle"
                  fontSize={5}
                  fontWeight={700}
                  fill={hex}
                  stroke="#ffffff"
                  strokeWidth={1.2}
                  paintOrder="stroke"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}

          {/* walls: the things the sensor sees and the robot bumps into */}
          {arena.walls.map((wall) => (
            <g key={wall.id}>
              <rect
                x={wall.x}
                y={wall.y}
                width={wall.w}
                height={wall.h}
                rx={1.5}
                fill={wall.look === "frame" ? "url(#rb-hatch)" : "#2e3a5c"}
                stroke="#131c33"
                strokeWidth={0.6}
              />
              {wall.label && (
                <text
                  x={wall.x + wall.w / 2}
                  y={wall.y + wall.h / 2 + 1.6}
                  textAnchor="middle"
                  fontSize={4.5}
                  fontWeight={700}
                  fill="#e4e7f0"
                >
                  {wall.label}
                </text>
              )}
            </g>
          ))}

          {/* checkpoints from the book's map */}
          {arena.markers.map((marker) => (
            <g key={marker.id}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r={2.6}
                fill="#ffffff"
                stroke="#0b1120"
                strokeWidth={0.6}
              />
              <text
                x={marker.x}
                y={marker.y + 1.5}
                textAnchor="middle"
                fontSize={4}
                fontWeight={700}
                fill="#0b1120"
              >
                {marker.label}
              </text>
            </g>
          ))}

          {/* where the robot has been */}
          {world.trail.length > 1 && (
            <polyline
              points={world.trail.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#ff8a1f"
              strokeWidth={1.1}
              strokeOpacity={0.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2.5 2"
            />
          )}

          {/* the ultrasonic beam, and the number it reports */}
          <g>
            <path
              d={beamPath(sensor.x, sensor.y, world.heading, beamLength)}
              fill="url(#rb-beam)"
              stroke="#0bb8d4"
              strokeWidth={0.4}
              strokeOpacity={0.6}
            />
            <line
              x1={sensor.x}
              y1={sensor.y}
              x2={hit.x}
              y2={hit.y}
              stroke="#0894ad"
              strokeWidth={0.6}
              strokeDasharray="2 1.5"
            />
            {!far && (
              <circle
                cx={hit.x}
                cy={hit.y}
                r={2}
                fill="#0bb8d4"
                stroke="#ffffff"
                strokeWidth={0.7}
              />
            )}
            <text
              x={(sensor.x + hit.x) / 2}
              y={(sensor.y + hit.y) / 2 - 2}
              textAnchor="middle"
              fontSize={6}
              fontWeight={800}
              fill="#0a7288"
              stroke="#ffffff"
              strokeWidth={1.8}
              paintOrder="stroke"
            >
              {far ? "far" : `${reading} cm`}
            </text>
          </g>

          {/* an object placed in front of the sensor: trash, a hand, a client */}
          {world.objectCm !== null && (
            <g>
              <rect
                x={sensor.x + sensor.dx * world.objectCm - 4.5}
                y={sensor.y + sensor.dy * world.objectCm - 4.5}
                width={9}
                height={9}
                rx={2}
                fill={RB_COLOUR_HEX[world.objectColour]}
                stroke="#0b1120"
                strokeWidth={0.8}
                transform={`rotate(${world.heading} ${
                  sensor.x + sensor.dx * world.objectCm
                } ${sensor.y + sensor.dy * world.objectCm})`}
              />
            </g>
          )}

          <Robot world={world} />
        </svg>
      </div>

      {showReadout && (
        <div className="thin-scroll mt-2 flex gap-2 overflow-x-auto">
          <Readout
            label="Ultrasonic"
            value={far ? "far" : `${reading} cm`}
            tone="signal"
          />
          <Readout
            label="Colour sensor"
            value={COLOUR_WORD[world.colourSeen]}
            swatch={RB_COLOUR_HEX[world.colourSeen]}
          />
          <Readout label="Light" value={`${Math.round(world.light)} %`} />
          <Readout label="Facing" value={`${Math.round(world.heading)}°`} />
          <Readout
            label="Driven"
            value={`${Math.round(world.travelledCm)} cm`}
          />
          {world.bumps > 0 && (
            <Readout label="Bumps" value={String(world.bumps)} tone="coral" />
          )}
        </div>
      )}
    </div>
  );
}

function Readout({
  label,
  value,
  tone = "ink",
  swatch,
}: {
  label: string;
  value: string;
  tone?: "ink" | "signal" | "coral";
  swatch?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5",
        tone === "signal" && "border-signal-200 bg-signal-50",
        tone === "coral" && "border-coral-100 bg-coral-100",
        tone === "ink" && "border-ink-100 bg-ink-50",
      )}
    >
      <span className="font-mono text-[10px] tracking-[0.12em] text-ink-400 uppercase">
        {label}
      </span>
      {swatch && (
        <span
          aria-hidden
          className="size-3 rounded-full ring-1 ring-ink-900/25"
          style={{ background: swatch }}
        />
      )}
      <span
        className={cn(
          "tnum text-[13px] font-bold",
          tone === "signal" ? "text-signal-700" : "text-ink-800",
          tone === "coral" && "text-coral-700",
        )}
      >
        {value}
      </span>
    </span>
  );
}
