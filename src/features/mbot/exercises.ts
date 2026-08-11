/**
 * The book's own missions, turned into buildable challenges.
 *
 * Every exercise below comes from a printed "CHALLENGE", "PROJECT", "STEPS TO
 * FOLLOW" or "EXTRA CHALLENGE" box of Grade 6 · Chapter 4 "Robotics with
 * mBot2" — same mission, same numbers (70 cm, 30 cm, 90°, 10 cm, 20 % power,
 * 1 sec, light > 50 and < 5, 10 clients per minute), same wording wherever the
 * book gives us wording. Nothing here was invented.
 *
 * A mission is checked on the RUN, never on the arrangement of the blocks. The
 * student's scripts are executed once per `RbTrial` — a starting position, a
 * light level, an object in front of the sensor and a timeline of presses — the
 * engine hands back an `RbRunRecord`, and `checkRun()` reads that record. The
 * book cares that the robot reaches the bin, stops before the hand and counts
 * ten clients; it does not care which blocks got it there, and neither do we.
 *
 * Every check is plain data — no functions anywhere inside one — so the whole
 * set stays serialisable.
 */

import {
  rbAngleDelta,
  rbHeadingVector,
  type RbArenaId,
  type RbBinOp,
  type RbCategory,
  type RbColour,
  type RbExpr,
  type RbProgram,
  type RbStatement,
} from "./robot-model";
import type { RbRunRecord, RbSimTrial } from "./robot-engine";

// ── How a check is expressed ────────────────────────────────────────────────

export type RbCompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";
/** "final" = when the trial ended · "ever" = at any moment during it. */
export type RbWhen = "final" | "ever";

interface RbAssertionBase {
  /** Flip the result: "this must NOT happen". */
  not?: boolean;
  /** Student-facing line, shown when the assertion fails. */
  message?: string;
}

export type RbAssertion =
  /** The robot is standing inside a named zone of the arena. */
  | (RbAssertionBase & { kind: "in-zone"; zone: string; when: RbWhen })
  /** The robot ended within `toleranceCm` of this spot. */
  | (RbAssertionBase & {
      kind: "at-point";
      x: number;
      y: number;
      toleranceCm: number;
    })
  /** How far it ended up from where it started, measured along its first heading. */
  | (RbAssertionBase & {
      kind: "displacement";
      direction: "forward" | "backward";
      op: RbCompareOp;
      cm: number;
    })
  /** Total ground covered by the wheels. */
  | (RbAssertionBase & { kind: "travelled"; op: RbCompareOp; cm: number })
  /** Total turning, in degrees, whichever way round. */
  | (RbAssertionBase & { kind: "turned"; op: RbCompareOp; degrees: number })
  /** Which way the robot is pointing at the end. */
  | (RbAssertionBase & {
      kind: "facing";
      degrees: number;
      toleranceDeg: number;
    })
  | (RbAssertionBase & { kind: "bumped" })
  | (RbAssertionBase & { kind: "left-road" })
  | (RbAssertionBase & {
      kind: "printed";
      text: string;
      match: "exact" | "contains";
    })
  | (RbAssertionBase & { kind: "printed-number"; value: number })
  | (RbAssertionBase & { kind: "screen-used" })
  | (RbAssertionBase & { kind: "leds-lit" })
  | (RbAssertionBase & { kind: "sound-played"; sound?: string })
  | (RbAssertionBase & { kind: "voice-said"; text: string })
  | (RbAssertionBase & {
      kind: "recording";
      event: "start" | "stop" | "play";
    })
  | (RbAssertionBase & {
      kind: "variable";
      name: string;
      op: RbCompareOp;
      value: number;
      when: RbWhen;
    })
  /** The rolling shutter, in motor turns: 0 is fully open, 2 fully closed. */
  | (RbAssertionBase & {
      kind: "shutter";
      op: RbCompareOp;
      turns: number;
      when: RbWhen;
    })
  | (RbAssertionBase & { kind: "motor-stopped" });

export interface RbTrial extends RbSimTrial {
  /** Shown next to the result: "White trash arrives", "A hand at the window"… */
  label: string;
  /** Every assertion must hold for the trial to pass. */
  assert: RbAssertion[];
}

export interface RbExerciseCheck {
  /** One line a teacher can read out: what the platform is about to test. */
  summary: string;
  trials: RbTrial[];
}

// ── The exercise ────────────────────────────────────────────────────────────

export interface RbExercise {
  id: string;
  /** The lesson it belongs to, 1–7. */
  lesson: number;
  /** The book's own heading for the lesson. */
  lessonTitle: string;
  /** The book's own name for the mission. */
  title: string;
  /** What the book asks for, in the book's terms. */
  brief: string;
  arena: RbArenaId;
  /** Blocks the student starts with — usually the part the book prints. */
  starter: RbProgram;
  /** Which palette categories are offered, so early lessons stay uncluttered. */
  allowed: RbCategory[];
  /** Progressive, never giving the answer away first. */
  hints: string[];
  check: RbExerciseCheck;
  /** A worked answer, revealed only after real attempts. */
  solution: RbProgram;
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface RbAssertionResult {
  assertion: RbAssertion;
  passed: boolean;
  /** What the run actually did, in words the student can read. */
  detail: string;
}

export interface RbTrialResult {
  trialId: string;
  label: string;
  passed: boolean;
  assertions: RbAssertionResult[];
  missing?: boolean;
}

export interface RbCheckResult {
  passed: boolean;
  trials: RbTrialResult[];
  missing: string[];
}

// ── The check engine ────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();

const compare = (op: RbCompareOp, left: number, right: number): boolean => {
  switch (op) {
    case "=":
      return Math.abs(left - right) < 1e-6;
    case "!=":
      return Math.abs(left - right) >= 1e-6;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
  }
};

const round = (n: number) => Math.round(n * 10) / 10;

/** Distance from the start, measured along the direction the robot began facing. */
function displacementOf(record: RbRunRecord): number {
  const { dx, dy } = rbHeadingVector(record.start.heading);
  return (
    (record.final.x - record.start.x) * dx +
    (record.final.y - record.start.y) * dy
  );
}

function held(
  a: RbAssertion,
  record: RbRunRecord,
): { ok: boolean; observed: string } {
  switch (a.kind) {
    case "in-zone": {
      const ok =
        a.when === "final"
          ? record.finalZones.includes(a.zone)
          : record.finalZones.includes(a.zone) ||
            record.zoneVisits.some((v) => v.zone === a.zone);
      return {
        ok,
        observed: record.finalZones.length
          ? `the robot finished in ${record.finalZones.join(" and ")}`
          : "the robot did not finish inside any marked place",
      };
    }

    case "at-point": {
      const distance = Math.hypot(
        record.final.x - a.x,
        record.final.y - a.y,
      );
      return {
        ok: distance <= a.toleranceCm,
        observed: `it stopped ${round(distance)} cm away from that spot`,
      };
    }

    case "displacement": {
      const along = displacementOf(record);
      const value = a.direction === "forward" ? along : -along;
      return {
        ok: compare(a.op, value, a.cm),
        observed:
          value >= 0
            ? `it ended up ${round(value)} cm ${a.direction} of where it started`
            : `it ended up ${round(-value)} cm the other way`,
      };
    }

    case "travelled":
      return {
        ok: compare(a.op, record.travelledCm, a.cm),
        observed: `the wheels covered ${round(record.travelledCm)} cm in all`,
      };

    case "turned":
      return {
        ok: compare(a.op, Math.abs(record.turnedDeg), a.degrees),
        observed: `it turned ${round(Math.abs(record.turnedDeg))}° in all`,
      };

    case "facing": {
      const off = Math.abs(rbAngleDelta(record.final.heading, a.degrees));
      return {
        ok: off <= a.toleranceDeg,
        observed: `it ended up facing ${Math.round(record.final.heading)}°`,
      };
    }

    case "bumped":
      return {
        ok: record.bumps > 0,
        observed: record.bumps
          ? `it ran into something ${record.bumps} time(s)`
          : "it never ran into anything",
      };

    case "left-road":
      return {
        ok: record.offRoadMs > 0,
        observed:
          record.offRoadMs > 0
            ? "it drove off the road"
            : "it stayed on the road the whole way",
      };

    case "printed": {
      const ok = record.printed.some((p) =>
        a.match === "contains"
          ? norm(p.text).includes(norm(a.text))
          : norm(p.text) === norm(a.text),
      );
      return {
        ok,
        observed: record.printed.length
          ? `the screen showed ${record.printed
              .slice(-4)
              .map((p) => `“${p.text}”`)
              .join(", ")}`
          : "nothing was printed on the screen",
      };
    }

    case "printed-number": {
      const ok = record.printed.some(
        (p) => Number(p.text.trim()) === a.value && p.text.trim() !== "",
      );
      return {
        ok,
        observed: record.printed.length
          ? `the screen showed ${record.printed
              .slice(-4)
              .map((p) => `“${p.text}”`)
              .join(", ")}`
          : "nothing was printed on the screen",
      };
    }

    case "screen-used":
      return {
        ok: record.printed.some((p) => p.text.trim() !== ""),
        observed: record.printed.length
          ? `${record.printed.length} thing(s) were printed`
          : "nothing was printed on the screen",
      };

    case "leds-lit": {
      const ok =
        record.ledFrames.some((f) => f.colours.some((c) => c !== "off")) ||
        record.finalLeds.some((c) => c !== "off");
      return { ok, observed: ok ? "the LEDs came on" : "the LEDs stayed off" };
    }

    case "sound-played": {
      const heard = record.sounds.filter((s) =>
        a.sound ? s.sound === a.sound : s.sound !== "recording",
      );
      return {
        ok: heard.length > 0,
        observed: heard.length
          ? `${heard.length} sound(s) played`
          : "nothing was played",
      };
    }

    case "voice-said": {
      const ok = record.voices.some((v) => norm(v.text).includes(norm(a.text)));
      return {
        ok,
        observed: record.voices.length
          ? `the robot said ${record.voices.map((v) => `“${v.text}”`).join(", ")}`
          : "the robot never spoke",
      };
    }

    case "recording": {
      const ok = record.recordings.some((r) => r.event === a.event);
      return {
        ok,
        observed: record.recordings.length
          ? `the recorder did: ${record.recordings.map((r) => r.event).join(" → ")}`
          : "the recorder was never used",
      };
    }

    case "variable": {
      if (a.when === "final") {
        const value = record.finalVariables[a.name];
        const num = typeof value === "number" ? value : Number(value);
        return {
          ok: value !== undefined && Number.isFinite(num) && compare(a.op, num, a.value),
          observed:
            value === undefined
              ? `there is no variable called ${a.name}`
              : `${a.name} finished at ${value}`,
        };
      }
      const series = record.variables.filter((s) => s.name === a.name);
      return {
        ok: series.some((s) => compare(a.op, Number(s.value), a.value)),
        observed: series.length
          ? `${a.name} went ${series
              .slice(-6)
              .map((s) => s.value)
              .join(" → ")}`
          : `there is no variable called ${a.name}`,
      };
    }

    case "shutter": {
      const value =
        a.when === "final" ? record.finalShutterTurns : record.maxShutterTurns;
      return {
        ok: compare(a.op, value, a.turns),
        observed:
          record.finalShutterTurns >= 2
            ? "the rolling shutter closed all the way"
            : record.finalShutterTurns <= 0.05
              ? "the rolling shutter never moved"
              : `the rolling shutter came down ${round(
                  (record.finalShutterTurns / 2) * 100,
                )} % of the way`,
      };
    }

    case "motor-stopped":
      return {
        ok: record.motorStops > 0,
        observed: record.motorStops
          ? `the motor was stopped ${record.motorStops} time(s)`
          : "no block ever stopped the motor",
      };
  }
}

function evaluate(a: RbAssertion, record: RbRunRecord): RbAssertionResult {
  const { ok, observed } = held(a, record);
  const passed = a.not ? !ok : ok;
  return {
    assertion: a,
    passed,
    detail: passed || !a.message ? observed : `${a.message} — ${observed}`,
  };
}

export function checkTrial(trial: RbTrial, record: RbRunRecord): RbTrialResult {
  const assertions = trial.assert.map((a) => evaluate(a, record));
  return {
    trialId: trial.id,
    label: trial.label,
    passed: assertions.every((r) => r.passed),
    assertions,
  };
}

/**
 * Judge an exercise from the recordings of its trials. The caller runs each
 * `check.trials[i]` and passes the records back in any order; they are matched
 * by `trialId`, and a check cannot pass while any trial is missing.
 */
export function checkRun(
  check: RbExerciseCheck,
  records: readonly RbRunRecord[],
): RbCheckResult {
  const byId = new Map(records.map((r) => [r.trialId, r] as const));
  const missing: string[] = [];
  const trials = check.trials.map((trial) => {
    const record = byId.get(trial.id);
    if (!record) {
      missing.push(trial.id);
      return {
        trialId: trial.id,
        label: trial.label,
        passed: false,
        assertions: [],
        missing: true,
      };
    }
    return checkTrial(trial, record);
  });
  return {
    passed: missing.length === 0 && trials.every((t) => t.passed),
    trials,
    missing,
  };
}

// ── Small builders (they only ever produce plain data) ───────────────────────

const n = (value: number): RbExpr => ({ kind: "num", value });
const txt = (value: string): RbExpr => ({ kind: "text", value });
const vr = (name: string): RbExpr => ({ kind: "var", name });
// `RbExpr extends { op: infer O } ? O : never` looks equivalent but is not:
// RbExpr is a union, so the conditional distributes and every member that is
// not a binop resolves to never, collapsing the whole parameter to never.
const bin = (op: RbBinOp, left: RbExpr, right: RbExpr): RbExpr => ({
  kind: "binop",
  op,
  left,
  right,
});
const ULTRA: RbExpr = { kind: "ultrasonic" };
const LIGHT: RbExpr = { kind: "light" };
const TIMER: RbExpr = { kind: "timer" };
const COLOUR: RbExpr = { kind: "colour-name" };
const seesColour = (colour: RbColour): RbExpr => ({
  kind: "colour-is",
  colour,
});
const buttonDown = (button: "A" | "B"): RbExpr => ({ kind: "button", button });
const joystick = (
  direction: "up" | "down" | "left" | "right" | "middle",
): RbExpr => ({ kind: "joystick", direction });

/** One trial, in a fixed arena — keeps the data below readable. */
const arenaTrials =
  (arena: RbArenaId) =>
  (trials: Omit<RbTrial, "arena">[]): RbTrial[] =>
    trials.map((t) => ({ ...t, arena }));

/** A person, a hand or a piece of trash in front of the sensor, then gone. */
const passesBy = (
  at: number,
  cm: number,
  forMs: number,
): RbTrial["input"] => [
  { at, kind: "object", cm },
  { at: at + forMs, kind: "object", cm: null },
];

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 1 · A Robot Designed for the Future (book pp. 48–49)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book CHALLENGE: "Examine the mission below. The recording on the CyberPi is
 * done by the buttons A and B. It is your time to create your own mission to
 * record your voice." The printed example starts the recording on button A, and
 * on button B prints "STOP Recording", stops the recording, waits 2 seconds and
 * plays it back — so the two empty hats are exactly where the book leaves the
 * student.
 */
const l1Recorder: RbExercise = {
  id: "g6-c4-l1-recorder",
  lesson: 1,
  lessonTitle: "A Robot Designed for the Future",
  title: "Record your voice",
  brief:
    "Examine the mission in the book. The recording on the CyberPi is done by the buttons A and B. It is your time to create your own mission to record your voice: button A starts the recording, button B stops it and plays it back.",
  arena: "bench",
  starter: {
    scripts: [
      { id: "l1-st-a", kind: "on-button", button: "A", body: [] },
      { id: "l1-st-b", kind: "on-button", button: "B", body: [] },
    ],
  },
  allowed: ["events", "audio", "display", "control"],
  hints: [
    "Two buttons, two hats — and the hats are already there. What has to happen the moment each one is pressed?",
    "A recording has three moments: it starts, it stops, and it is played back. Two of them belong to button B.",
    "The book waits 2 seconds between stopping and playing, so the CyberPi has time to save what it heard.",
  ],
  check: {
    summary:
      "Runs twice: button A on its own, then a full recording from A to B.",
    trials: arenaTrials("bench")([
      {
        id: "start",
        label: "Button A on its own",
        input: [{ at: 500, kind: "press", button: "A" }],
        durationMs: 6000,
        assert: [
          {
            kind: "recording",
            event: "start",
            message: "Pressing button A must start the recording.",
          },
          {
            kind: "recording",
            event: "play",
            not: true,
            message:
              "Button A only records — playing back is button B's job.",
          },
        ],
      },
      {
        id: "playback",
        label: "Record, then stop and play",
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 4000, kind: "press", button: "B" },
        ],
        durationMs: 14000,
        assert: [
          { kind: "recording", event: "start" },
          {
            kind: "recording",
            event: "stop",
            message: "Pressing button B must stop the recording.",
          },
          {
            kind: "recording",
            event: "play",
            message: "After it stops, the CyberPi has to play the recording back.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l1-so-a",
        kind: "on-button",
        button: "A",
        body: [{ id: "l1-so-a1", kind: "start-recording" }],
      },
      {
        id: "l1-so-b",
        kind: "on-button",
        button: "B",
        body: [
          {
            id: "l1-so-b1",
            kind: "print",
            value: txt("STOP Recording"),
            newline: true,
          },
          { id: "l1-so-b2", kind: "stop-recording" },
          { id: "l1-so-b3", kind: "wait", secs: n(2) },
          { id: "l1-so-b4", kind: "play-recording" },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 2 · Controlling the Movement of the mBot2 (book pp. 50–51)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book CHALLENGE: the printed script is `when 🏳 clicked · forever · if joystick
 * pulled↑ then moves forward 10 cm until done · if joystick pulled← then …
 * if joystick pulled→ then …`, with the last two empty, over the caption
 * "Complete the mission to control the movements of the robot with the
 * 'forever' and 'if' blocks". The rules above it are the numbers: 70 cm
 * forward, 90 degrees left, 90 degrees right. The starter is that script,
 * printed 10 cm and all.
 */
const l2Maze: RbExercise = {
  id: "g6-c4-l2-maze",
  lesson: 2,
  lessonTitle: "Controlling the Movement of the mBot2",
  title: "Drive the maze with the joystick",
  brief:
    "Complete the mission to control the movements of the robot with the “forever” and “if” blocks. 1- If the joystick is pulled forward, the robot will move 70 cm forward. 2- If the joystick is pulled left, the robot will turn 90 degrees left. 3- If the joystick is pulled right, the robot will turn 90 degrees right.",
  arena: "maze",
  starter: {
    scripts: [
      {
        id: "l2m-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l2m-st-forever",
            kind: "forever",
            body: [
              {
                id: "l2m-st-if1",
                kind: "if",
                cond: joystick("up"),
                then: [
                  {
                    id: "l2m-st-move",
                    kind: "move-distance",
                    direction: "forward",
                    cm: n(10),
                  },
                ],
              },
              { id: "l2m-st-if2", kind: "if", cond: joystick("left"), then: [] },
              {
                id: "l2m-st-if3",
                kind: "if",
                cond: joystick("right"),
                then: [],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: ["events", "control", "chassis", "sensing"],
  hints: [
    "Rule 1 says 70 cm. Look again at the number already typed inside the movement block.",
    "The two empty “if” blocks are for the two turns. The mBot2 Chassis category has a block that turns the robot by a number of degrees.",
    "Left and right are the same block — only the dropdown changes. Both turns are 90°, and neither of them drives anywhere.",
  ],
  check: {
    summary:
      "Runs four times: one pull forward, one pull left, one pull right, then the whole maze.",
    trials: arenaTrials("maze")([
      {
        id: "forward",
        label: "The joystick is pulled forward",
        input: [{ at: 600, kind: "joystick", direction: "up" }],
        durationMs: 8000,
        assert: [
          {
            kind: "at-point",
            x: 100,
            y: 30,
            toleranceCm: 8,
            message: "One pull forward must move the robot exactly 70 cm.",
          },
          { kind: "bumped", not: true },
        ],
      },
      {
        id: "left",
        label: "The joystick is pulled left",
        input: [{ at: 600, kind: "joystick", direction: "left" }],
        durationMs: 6000,
        assert: [
          {
            kind: "facing",
            degrees: 0,
            toleranceDeg: 12,
            message:
              "Pulled left, the robot turns 90 degrees to its left and stays where it is.",
          },
          {
            kind: "travelled",
            op: "<",
            cm: 10,
            message: "A turn is a turn — the robot must not drive as well.",
          },
        ],
      },
      {
        id: "right",
        label: "The joystick is pulled right",
        input: [{ at: 600, kind: "joystick", direction: "right" }],
        durationMs: 6000,
        assert: [
          {
            kind: "facing",
            degrees: 180,
            toleranceDeg: 12,
            message: "Pulled right, the robot turns 90 degrees to its right.",
          },
          { kind: "travelled", op: "<", cm: 10 },
        ],
      },
      {
        id: "maze",
        label: "The whole maze: forward, right, forward, left, forward, right, forward",
        input: [
          { at: 600, kind: "joystick", direction: "up" },
          { at: 3200, kind: "joystick", direction: "right" },
          { at: 5000, kind: "joystick", direction: "up" },
          { at: 8000, kind: "joystick", direction: "left" },
          { at: 10000, kind: "joystick", direction: "up" },
          { at: 13000, kind: "joystick", direction: "right" },
          { at: 15000, kind: "joystick", direction: "up" },
        ],
        durationMs: 22000,
        assert: [
          {
            kind: "in-zone",
            zone: "roundabout",
            when: "final",
            message:
              "Seven pulls of the joystick should take the robot all the way to the roundabout.",
          },
          {
            kind: "bumped",
            not: true,
            message:
              "The robot hit a wall on the way — check the distance and the turns.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l2m-so-launch",
        kind: "on-launch",
        body: [
          {
            id: "l2m-so-forever",
            kind: "forever",
            body: [
              {
                id: "l2m-so-if1",
                kind: "if",
                cond: joystick("up"),
                then: [
                  {
                    id: "l2m-so-move",
                    kind: "move-distance",
                    direction: "forward",
                    cm: n(70),
                  },
                ],
              },
              {
                id: "l2m-so-if2",
                kind: "if",
                cond: joystick("left"),
                then: [
                  {
                    id: "l2m-so-left",
                    kind: "turn",
                    side: "left",
                    degrees: n(90),
                  },
                ],
              },
              {
                id: "l2m-so-if3",
                kind: "if",
                cond: joystick("right"),
                then: [
                  {
                    id: "l2m-so-right",
                    kind: "turn",
                    side: "right",
                    degrees: n(90),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Book, rule 4 of the same mission: "Once the robot reaches the roundabout, it
 * should play the voice 'I have to wait for the green light to take the right
 * exit'."
 *
 * A robot has no map, so "reaches the roundabout" has to become something it
 * can sense. The roundabout has an island in the middle of it, and the mBot2
 * has an ultrasonic sensor — so arriving means the sensor suddenly has
 * something close in front of it. That is the reading the starter sets up; the
 * message is the student's.
 */
const l2Roundabout: RbExercise = {
  id: "g6-c4-l2-roundabout",
  lesson: 2,
  lessonTitle: "Controlling the Movement of the mBot2",
  title: "Waiting at the roundabout",
  brief:
    "Once the robot reaches the roundabout, it should play the voice “I have to wait for the green light to take the right exit”. The robot cannot read the map — but its ultrasonic sensor can see the island in the middle of the roundabout when it gets there.",
  arena: "maze",
  starter: {
    scripts: [
      {
        id: "l2r-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l2r-st-forever",
            kind: "forever",
            body: [
              {
                id: "l2r-st-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: ["events", "control", "audio", "display", "shield", "operators"],
  hints: [
    "The question is already asked for you: is there something less than 30 cm in front of me? All that is missing is the answer.",
    "The Audio category has a block that says a sentence out loud until it is done.",
    "Type the sentence the book prints, word for word — the driver behind you needs to know why you stopped.",
  ],
  check: {
    summary:
      "Runs twice: once with the robot at the roundabout, once out on the open road.",
    trials: arenaTrials("maze")([
      {
        id: "arrived",
        label: "The robot arrives at the roundabout",
        setup: { start: { x: 170, y: 165, heading: 180 } },
        durationMs: 8000,
        assert: [
          {
            kind: "voice-said",
            text: "green light",
            message:
              "At the roundabout the robot has to say why it is waiting — the green light.",
          },
        ],
      },
      {
        id: "open-road",
        label: "Still driving down the first corridor",
        setup: { start: { x: 30, y: 30, heading: 90 } },
        durationMs: 8000,
        assert: [
          {
            kind: "voice-said",
            text: "green light",
            not: true,
            message:
              "Out on the open road there is no roundabout — the robot must stay quiet.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l2r-so-launch",
        kind: "on-launch",
        body: [
          {
            id: "l2r-so-forever",
            kind: "forever",
            body: [
              {
                id: "l2r-so-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [
                  {
                    id: "l2r-so-voice",
                    kind: "play-voice",
                    text: "I have to wait for the green light to take the right exit",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 3 · Discovering the World of IoT — a smart recycle bin (pp. 52–53)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book PROJECT, point by point: the mBot2 receives the trash; the ultrasonic
 * sensor detects it at less than 30 cm; the colour sensor reads its colour;
 * white turns 90° right then 30 cm forward to the recycle bin; red turns 90°
 * left then 30 cm forward to the bin for non-recycled trash.
 *
 * The printed screenshot of the outer `if` shows `< 10` because it is a
 * half-built example; the project text says 30 cm, and the project text is the
 * mission. The starter gives the student the outer question with the book's own
 * number, exactly as "STEPS TO FOLLOW" point 3 leaves it.
 */
const l3SmartBin: RbExercise = {
  id: "g6-c4-l3-smart-bin",
  lesson: 3,
  lessonTitle: "Discovering the World of IoT",
  title: "The smart recycle bin",
  brief:
    "Build the mission that makes the robot act as a smart machine to sort the trash. The Ultrasonic sensor detects the trash when it is at less than 30 cm. The Colour sensor reads its colour. If the colour is White the trash is recycled: turn 90 degrees right, then move 30 cm forward to the recycle bin. If the colour is Red it is not recycled: turn 90 degrees left, then move 30 cm forward to the other bin.",
  arena: "sorter",
  starter: {
    scripts: [
      {
        id: "l3-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l3-st-forever",
            kind: "forever",
            body: [
              {
                id: "l3-st-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: ["events", "control", "chassis", "shield", "operators"],
  hints: [
    "The outer “if” already asks whether the trash has arrived. Inside it the robot has to ask a second question: what colour is it?",
    "The quad RGB sensor block answers true or false about one colour at a time, so white and red are two separate questions.",
    "Right for white, left for red. Turn first, then drive the 30 cm — a robot cannot do both at once.",
  ],
  check: {
    summary:
      "Runs three times: white trash arrives, red trash arrives, and nothing arrives at all.",
    trials: arenaTrials("sorter")([
      {
        id: "white",
        label: "White trash arrives",
        setup: { objectCm: 25, objectColour: "white" },
        durationMs: 14000,
        assert: [
          {
            kind: "in-zone",
            zone: "recycle",
            when: "final",
            message:
              "White trash is recycled: 90° to the right, then 30 cm to the recycle bin.",
          },
          { kind: "bumped", not: true },
        ],
      },
      {
        id: "red",
        label: "Red trash arrives",
        setup: { objectCm: 25, objectColour: "red" },
        durationMs: 14000,
        assert: [
          {
            kind: "in-zone",
            zone: "landfill",
            when: "final",
            message:
              "Red trash is not recycled: 90° to the left, then 30 cm to the other bin.",
          },
          { kind: "bumped", not: true },
        ],
      },
      {
        id: "empty",
        label: "Nothing in front of the sensor",
        setup: { objectCm: null },
        durationMs: 10000,
        assert: [
          {
            kind: "travelled",
            op: "<",
            cm: 3,
            message:
              "With no trash in front of it, the robot must wait where it is.",
          },
          { kind: "turned", op: "<", degrees: 5 },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l3-so-launch",
        kind: "on-launch",
        body: [
          {
            id: "l3-so-forever",
            kind: "forever",
            body: [
              {
                id: "l3-so-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [
                  {
                    id: "l3-so-if-white",
                    kind: "if",
                    cond: seesColour("white"),
                    then: [
                      {
                        id: "l3-so-turn-r",
                        kind: "turn",
                        side: "right",
                        degrees: n(90),
                      },
                      {
                        id: "l3-so-move-r",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                  {
                    id: "l3-so-if-red",
                    kind: "if",
                    cond: seesColour("red"),
                    then: [
                      {
                        id: "l3-so-turn-l",
                        kind: "turn",
                        side: "left",
                        degrees: n(90),
                      },
                      {
                        id: "l3-so-move-l",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Book CHALLENGE, same lesson: "Propose a set of messages, sounds and light
 * effects to make the Smart Trash Bin more attractive." Which message, which
 * sound and which colours are the student's; that all three happen — and that
 * the bin still sorts correctly — is what is checked.
 */
const l3FriendlyBin: RbExercise = {
  id: "g6-c4-l3-friendly-bin",
  lesson: 3,
  lessonTitle: "Discovering the World of IoT",
  title: "Make the smart bin friendly",
  brief:
    "Propose a set of messages, sounds and light effects to make the Smart Trash Bin more attractive. The bin still has to sort the trash correctly — now it should also say something on the screen, play a sound and light its LEDs while it works.",
  arena: "sorter",
  starter: {
    scripts: [
      {
        id: "l3b-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l3b-st-forever",
            kind: "forever",
            body: [
              {
                id: "l3b-st-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [
                  {
                    id: "l3b-st-if-white",
                    kind: "if",
                    cond: seesColour("white"),
                    then: [
                      {
                        id: "l3b-st-turn-r",
                        kind: "turn",
                        side: "right",
                        degrees: n(90),
                      },
                      {
                        id: "l3b-st-move-r",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                  {
                    id: "l3b-st-if-red",
                    kind: "if",
                    cond: seesColour("red"),
                    then: [
                      {
                        id: "l3b-st-turn-l",
                        kind: "turn",
                        side: "left",
                        degrees: n(90),
                      },
                      {
                        id: "l3b-st-move-l",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: [
    "events",
    "control",
    "chassis",
    "shield",
    "display",
    "audio",
    "operators",
  ],
  hints: [
    "Add to the mission you already have — do not start again. Where in it does the bin know that a piece of trash has just arrived?",
    "The Display category prints words on the CyberPi screen and lights the five LEDs; the Audio category plays a sound.",
    "Green lights for recycled and red for the other bin tell a person which way the trash went without reading a word.",
  ],
  check: {
    summary:
      "One run: white trash arrives, and the bin sorts it while saying, sounding and lighting something.",
    trials: arenaTrials("sorter")([
      {
        id: "friendly",
        label: "White trash arrives at a friendly bin",
        setup: { objectCm: 25, objectColour: "white" },
        durationMs: 16000,
        assert: [
          {
            kind: "in-zone",
            zone: "recycle",
            when: "final",
            message: "The bin still has to sort the trash correctly.",
          },
          {
            kind: "screen-used",
            message: "Say something on the CyberPi screen.",
          },
          { kind: "sound-played", message: "Play a sound as well." },
          { kind: "leds-lit", message: "And light the five LEDs." },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l3b-so-launch",
        kind: "on-launch",
        body: [
          {
            id: "l3b-so-forever",
            kind: "forever",
            body: [
              {
                id: "l3b-so-if",
                kind: "if",
                cond: bin("<", ULTRA, n(30)),
                then: [
                  {
                    id: "l3b-so-if-white",
                    kind: "if",
                    cond: seesColour("white"),
                    then: [
                      {
                        id: "l3b-so-say",
                        kind: "print",
                        value: txt("Thank you! This one is recycled"),
                        newline: true,
                      },
                      {
                        id: "l3b-so-leds",
                        kind: "display-leds",
                        colours: ["green", "green", "green", "green", "green"],
                      },
                      { id: "l3b-so-sound", kind: "play-sound", sound: "yeah" },
                      {
                        id: "l3b-so-turn-r",
                        kind: "turn",
                        side: "right",
                        degrees: n(90),
                      },
                      {
                        id: "l3b-so-move-r",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                  {
                    id: "l3b-so-if-red",
                    kind: "if",
                    cond: seesColour("red"),
                    then: [
                      {
                        id: "l3b-so-say2",
                        kind: "print",
                        value: txt("This one cannot be recycled"),
                        newline: true,
                      },
                      {
                        id: "l3b-so-leds2",
                        kind: "display-leds",
                        colours: ["red", "red", "red", "red", "red"],
                      },
                      { id: "l3b-so-sound2", kind: "play-sound", sound: "wrong" },
                      {
                        id: "l3b-so-turn-l",
                        kind: "turn",
                        side: "left",
                        degrees: n(90),
                      },
                      {
                        id: "l3b-so-move-l",
                        kind: "move-distance",
                        direction: "forward",
                        cm: n(30),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 4 · Discovering the Smart Home — the rolling shutter (pp. 54–55)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book CHALLENGE: "Examine the script on the right and guess the 2 missing
 * conditions to set to make the rolling shutter close upon the 2 conditions set
 * at the beginning of the lesson." Those two conditions are: the light is too
 * low (it is night) and the light is too high (the sun will damage the
 * furniture). The next lesson prints the answer — `ambient light intensity > 50
 * or ambient light intensity < 5` — so the starter stops exactly where the
 * challenge does, with the first half already filled in.
 */
const l4Shutter: RbExercise = {
  id: "g6-c4-l4-shutter",
  lesson: 4,
  lessonTitle: "Discovering the Smart Home",
  title: "The rolling shutter closes itself",
  brief:
    "Examine the script and guess the 2 missing conditions to make the rolling shutter close upon the 2 conditions set at the beginning of the lesson: if the light intensity is too low it is night, and if the light intensity is too high the sun will damage the furniture. In either case the motor of the mBot2 makes 2 rotations to close the rolling shutter.",
  arena: "window",
  starter: {
    scripts: [
      {
        id: "l4-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l4-st-forever",
            kind: "forever",
            body: [
              {
                id: "l4-st-if",
                kind: "if",
                cond: bin("or", bin(">", LIGHT, n(50)), n(0)),
                then: [
                  {
                    id: "l4-st-motor",
                    kind: "encoder-motor",
                    motor: "EM1",
                    power: n(20),
                    secs: n(1),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: ["events", "control", "chassis", "sensing", "operators"],
  hints: [
    "One half of the question is already written: too much light. The “or” block is waiting for the other half.",
    "Check the CyberPi monitor before you choose a number. In a comfortable room it reads about 32 — so “too dark” has to be a good deal lower than that.",
    "The book's own value is 5. Below 5 % of light it is night, and the shutter should come down.",
  ],
  check: {
    summary:
      "Runs three times: a room in bright sun, the same room at night, and a comfortable room at 32 %.",
    trials: arenaTrials("window")([
      {
        id: "sun",
        label: "Bright sun — 80 %",
        setup: { light: 80 },
        durationMs: 9000,
        assert: [
          {
            kind: "shutter",
            op: ">=",
            turns: 2,
            when: "final",
            message:
              "Too much light: the motor has to make its 2 rotations and close the shutter.",
          },
        ],
      },
      {
        id: "night",
        label: "Night — 3 %",
        setup: { light: 3 },
        durationMs: 9000,
        assert: [
          {
            kind: "shutter",
            op: ">=",
            turns: 2,
            when: "final",
            message:
              "At night the shutter has to close too — that is the second missing condition.",
          },
        ],
      },
      {
        id: "comfortable",
        label: "A comfortable room — 32 %",
        setup: { light: 32 },
        durationMs: 9000,
        assert: [
          {
            kind: "shutter",
            op: "<",
            turns: 0.2,
            when: "ever",
            message:
              "At 32 % the light is just right, so the shutter must stay open. Check both of your numbers.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l4-so-launch",
        kind: "on-launch",
        body: [
          {
            id: "l4-so-forever",
            kind: "forever",
            body: [
              {
                id: "l4-so-if",
                kind: "if",
                cond: bin(
                  "or",
                  bin(">", LIGHT, n(50)),
                  bin("<", LIGHT, n(5)),
                ),
                then: [
                  {
                    id: "l4-so-motor",
                    kind: "encoder-motor",
                    motor: "EM1",
                    power: n(20),
                    secs: n(1),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 5 · In a Smart Home, Security Is a Must (pp. 56–57)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book "A MULTITASKING MISSION FOR MORE CONTROL": Task 1 closes the rolling
 * shutter if one of the three conditions is valid (too much light, too little
 * light, or button A pressed); Task 2 stops the rolling shutter immediately in
 * case an object is detected — the printed script is `forever · if ultrasonic 2
 * distance to an object (cm) < 10 then stop encoder motor EM1`. When the green
 * flag is pressed, the two missions run for ever, side by side.
 *
 * The starter is Task 1 with the two light conditions already solved (Lesson 4)
 * and nothing else, so the student adds the third condition and the whole
 * second mission.
 */
const l5Security: RbExercise = {
  id: "g6-c4-l5-security",
  lesson: 5,
  lessonTitle: "In a Smart Home, Security Is a Must",
  title: "A multitasking mission for more control",
  brief:
    "In order to avoid accidents, the mission has to control two tasks at the same time. Task 1: close the rolling shutter if one of the three conditions is valid — too much light, too little light, or the button A pressed. Task 2: stop the rolling shutter immediately in case an object is detected less than 10 cm from the ultrasonic sensor. When the green flag is pressed, the two missions run for ever.",
  arena: "window",
  starter: {
    scripts: [
      {
        id: "l5-st-launch",
        kind: "on-launch",
        body: [
          {
            id: "l5-st-forever",
            kind: "forever",
            body: [
              {
                id: "l5-st-if",
                kind: "if",
                cond: bin("or", bin(">", LIGHT, n(50)), bin("<", LIGHT, n(5))),
                then: [
                  {
                    id: "l5-st-motor",
                    kind: "encoder-motor",
                    motor: "EM1",
                    power: n(20),
                    secs: n(1),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: [
    "events",
    "control",
    "chassis",
    "sensing",
    "shield",
    "operators",
  ],
  hints: [
    "Two jobs at the same time means two hats. A second “when 🏳 clicked” script runs beside the first one instead of after it.",
    "Which sensor can tell that a hand is out of the window while the shutter is coming down? It is the same one the smart bin used.",
    "“Stop immediately” is a block of its own, at the bottom of the mBot2 Chassis list. And the third condition of Task 1 is the button.",
  ],
  check: {
    summary:
      "Runs four times: bright sun, button A, a hand at the window, and a hand that goes away again.",
    trials: arenaTrials("window")([
      {
        id: "sun",
        label: "Bright sun, nothing in the way",
        setup: { light: 80, objectCm: null },
        durationMs: 10000,
        assert: [
          {
            kind: "shutter",
            op: ">=",
            turns: 2,
            when: "final",
            message: "With nothing in the way the shutter still has to close.",
          },
        ],
      },
      {
        id: "button",
        label: "Button A pressed twice in a comfortable room",
        setup: { light: 32, objectCm: null },
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 2500, kind: "press", button: "A" },
        ],
        durationMs: 10000,
        assert: [
          {
            kind: "shutter",
            op: ">=",
            turns: 2,
            when: "final",
            message:
              "The third condition is the button: pressing A must close the shutter by hand.",
          },
        ],
      },
      {
        id: "hand",
        label: "A hand at the window, 6 cm from the sensor",
        setup: { light: 80, objectCm: 6 },
        durationMs: 10000,
        assert: [
          {
            kind: "shutter",
            op: "<",
            turns: 0.5,
            when: "ever",
            message:
              "There is a hand out of the window — the shutter must not come down on it.",
          },
          {
            kind: "motor-stopped",
            message:
              "Task 2 has to stop the motor itself, not simply avoid starting it.",
          },
        ],
      },
      {
        id: "hand-gone",
        label: "The hand is taken away after 4 seconds",
        setup: { light: 80, objectCm: 6 },
        input: [{ at: 4000, kind: "object", cm: null }],
        durationMs: 14000,
        assert: [
          {
            kind: "shutter",
            op: ">=",
            turns: 2,
            when: "final",
            message:
              "Once the window is clear again the shutter should finish closing.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l5-so-task1",
        kind: "on-launch",
        body: [
          {
            id: "l5-so-f1",
            kind: "forever",
            body: [
              {
                id: "l5-so-if-light",
                kind: "if",
                cond: bin("or", bin(">", LIGHT, n(50)), bin("<", LIGHT, n(5))),
                then: [
                  {
                    id: "l5-so-motor1",
                    kind: "encoder-motor",
                    motor: "EM1",
                    power: n(20),
                    secs: n(1),
                  },
                ],
              },
              {
                id: "l5-so-if-button",
                kind: "if",
                cond: buttonDown("A"),
                then: [
                  {
                    id: "l5-so-motor2",
                    kind: "encoder-motor",
                    motor: "EM1",
                    power: n(20),
                    secs: n(1),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "l5-so-task2",
        kind: "on-launch",
        body: [
          {
            id: "l5-so-f2",
            kind: "forever",
            body: [
              {
                id: "l5-so-if-object",
                kind: "if",
                cond: bin("<", ULTRA, n(10)),
                then: [{ id: "l5-so-stop", kind: "stop-motor", motor: "EM1" }],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Book CHALLENGE 1, word for word: move forward for 2 seconds if button A is
 * pressed OR a distance less than 5 is detected; move backward if button B is
 * pressed; and at any moment the robot should stop if the joystick is pulled UP.
 * Two empty missions are on the canvas because "at any moment" is a job of its
 * own — that is what multitasking is for.
 */
const l5Challenge1: RbExercise = {
  id: "g6-c4-l5-challenge1",
  lesson: 5,
  lessonTitle: "In a Smart Home, Security Is a Must",
  title: "Challenge 1 — forward, backward, stop",
  brief:
    "Create the multitasking mission in order to make the robot: 1- Move forward for 2 seconds if the button A is pressed OR a distance less than 5 is detected. 2- Move backward if the button B is pressed. 3- At any moment, the robot should stop if the Joystick is pulled UP.",
  arena: "bench",
  starter: {
    scripts: [
      {
        id: "l5c1-st-a",
        kind: "on-launch",
        body: [{ id: "l5c1-st-fa", kind: "forever", body: [] }],
      },
      {
        id: "l5c1-st-b",
        kind: "on-launch",
        body: [{ id: "l5c1-st-fb", kind: "forever", body: [] }],
      },
    ],
  },
  allowed: [
    "events",
    "control",
    "chassis",
    "sensing",
    "shield",
    "operators",
  ],
  hints: [
    "Rules 1 and 2 are about driving, and they can share one mission. Rule 3 says “at any moment”, which is why the second mission is there.",
    "“A OR a distance less than 5” is one question with two halves — the Operators category has the block that joins them.",
    "A robot that is already driving cannot ask itself questions. Only the other mission, running beside it, can stop it.",
  ],
  check: {
    summary:
      "Runs four times: button A, an object 3 cm away, button B, and a joystick pulled up mid-drive.",
    trials: arenaTrials("bench")([
      {
        id: "button-a",
        label: "Button A is pressed",
        input: [{ at: 500, kind: "press", button: "A" }],
        durationMs: 9000,
        assert: [
          {
            kind: "displacement",
            direction: "forward",
            op: ">=",
            cm: 15,
            message: "Button A must send the robot forward for 2 seconds.",
          },
        ],
      },
      {
        id: "close-object",
        label: "Something is 3 cm in front of the sensor",
        setup: { objectCm: 3 },
        durationMs: 9000,
        assert: [
          {
            kind: "displacement",
            direction: "forward",
            op: ">=",
            cm: 15,
            message:
              "A distance less than 5 makes the robot move forward too — that is the OR.",
          },
        ],
      },
      {
        id: "button-b",
        label: "Button B is pressed",
        input: [{ at: 500, kind: "press", button: "B" }],
        durationMs: 9000,
        assert: [
          {
            kind: "displacement",
            direction: "backward",
            op: ">=",
            cm: 15,
            message: "Button B must send the robot backward.",
          },
        ],
      },
      {
        id: "emergency-stop",
        label: "The joystick is pulled up while the robot is driving",
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 1200, kind: "joystick", direction: "up" },
        ],
        durationMs: 9000,
        assert: [
          {
            kind: "displacement",
            direction: "forward",
            op: ">=",
            cm: 2,
            message: "The robot should still start moving when A is pressed.",
          },
          {
            kind: "displacement",
            direction: "forward",
            op: "<",
            cm: 25,
            message:
              "Pulling the joystick up must stop the robot straight away, not at the end of the 2 seconds.",
          },
          {
            kind: "motor-stopped",
            message: "Rule 3 needs the block that stops the motors.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l5c1-so-drive",
        kind: "on-launch",
        body: [
          {
            id: "l5c1-so-f1",
            kind: "forever",
            body: [
              {
                id: "l5c1-so-if1",
                kind: "if",
                cond: bin("or", buttonDown("A"), bin("<", ULTRA, n(5))),
                then: [
                  {
                    id: "l5c1-so-fwd",
                    kind: "move-timed",
                    direction: "forward",
                    rpm: n(50),
                    secs: n(2),
                  },
                ],
              },
              {
                id: "l5c1-so-if2",
                kind: "if",
                cond: buttonDown("B"),
                then: [
                  {
                    id: "l5c1-so-back",
                    kind: "move-timed",
                    direction: "backward",
                    rpm: n(50),
                    secs: n(2),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "l5c1-so-guard",
        kind: "on-launch",
        body: [
          {
            id: "l5c1-so-f2",
            kind: "forever",
            body: [
              {
                id: "l5c1-so-if3",
                kind: "if",
                cond: joystick("up"),
                then: [
                  { id: "l5c1-so-stop", kind: "stop-motor", motor: "all" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Book CHALLENGE 2, word for word: start displaying the colours detected by the
 * colour sensor if button A is pressed; start displaying the distance detected
 * by the ultrasonic sensor if button B is pressed; play music at any moment if
 * the light sensor detects an intensity less than 5 %.
 */
const l5Challenge2: RbExercise = {
  id: "g6-c4-l5-challenge2",
  lesson: 5,
  lessonTitle: "In a Smart Home, Security Is a Must",
  title: "Challenge 2 — three readings at once",
  brief:
    "Create the multitasking mission in order to make the robot: 1- start displaying the colors detected by the color sensor if the button A is pressed. 2- start displaying the distance detected by the ultrasonic sensor if the button B is pressed. 3- play music at any moment if the light sensor detects an intensity less than 5 %.",
  arena: "bench",
  starter: {
    scripts: [
      { id: "l5c2-st-a", kind: "on-button", button: "A", body: [] },
      { id: "l5c2-st-b", kind: "on-button", button: "B", body: [] },
      {
        id: "l5c2-st-l",
        kind: "on-launch",
        body: [{ id: "l5c2-st-fl", kind: "forever", body: [] }],
      },
    ],
  },
  allowed: [
    "events",
    "control",
    "display",
    "audio",
    "sensing",
    "shield",
    "operators",
  ],
  hints: [
    "Displaying a reading means printing it. The print block has a slot, and a sensor block drops straight into it.",
    "The colour sensor and the ultrasonic sensor are both in the mBot2 Shield category, and each one is a round reporter block.",
    "“At any moment” is the third mission, the one under the green flag: it has to keep asking about the light for ever.",
  ],
  check: {
    summary:
      "Runs four times: button A over red, button B with an object at 24 cm, a dark room and a bright one.",
    trials: arenaTrials("bench")([
      {
        id: "colour",
        label: "Button A, with something red in front of the sensor",
        setup: { objectCm: 20, objectColour: "red" },
        input: [{ at: 500, kind: "press", button: "A" }],
        durationMs: 8000,
        assert: [
          {
            kind: "printed",
            text: "red",
            match: "contains",
            message:
              "Button A must display the colour the sensor is reading — here that is red.",
          },
        ],
      },
      {
        id: "distance",
        label: "Button B, with an object 24 cm away",
        setup: { objectCm: 24 },
        input: [{ at: 500, kind: "press", button: "B" }],
        durationMs: 8000,
        assert: [
          {
            kind: "printed-number",
            value: 24,
            message:
              "Button B must display the distance the ultrasonic sensor is reading — here that is 24.",
          },
        ],
      },
      {
        id: "dark",
        label: "A dark room — 3 %",
        setup: { light: 3 },
        durationMs: 6000,
        assert: [
          {
            kind: "sound-played",
            message: "Below 5 % of light the robot must play music.",
          },
        ],
      },
      {
        id: "bright",
        label: "A bright room — 45 %",
        setup: { light: 45 },
        durationMs: 6000,
        assert: [
          {
            kind: "sound-played",
            not: true,
            message: "At 45 % there is plenty of light — no music.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l5c2-so-a",
        kind: "on-button",
        button: "A",
        body: [
          { id: "l5c2-so-a1", kind: "print", value: COLOUR, newline: true },
          { id: "l5c2-so-a2", kind: "wait", secs: n(1) },
        ],
      },
      {
        id: "l5c2-so-b",
        kind: "on-button",
        button: "B",
        body: [
          { id: "l5c2-so-b1", kind: "print", value: ULTRA, newline: true },
          { id: "l5c2-so-b2", kind: "wait", secs: n(1) },
        ],
      },
      {
        id: "l5c2-so-l",
        kind: "on-launch",
        body: [
          {
            id: "l5c2-so-f",
            kind: "forever",
            body: [
              {
                id: "l5c2-so-if",
                kind: "if",
                cond: bin("<", LIGHT, n(5)),
                then: [
                  { id: "l5c2-so-play", kind: "play-sound", sound: "beeps" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 6 · Autonomous Cars Are on the Way! (pp. 58–59)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book SCENARIO 1: no obstacles on the path — "the car will move to reach the
 * destination point by performing correct movements and rotations". Button A
 * drives from checkpoint O to point G, button B brings it back to its starting
 * point, and messages on the screen plus the LEDs make it interactive.
 *
 * The starter is the four blocks the book prints under "The mission should
 * start as shown", and the empty button B hat it asks the student to complete.
 * Every distance on the arena's map is a number printed on the book's map.
 */
const l6Autonomous: RbExercise = {
  id: "g6-c4-l6-autonomous-car",
  lesson: 6,
  lessonTitle: "Autonomous Cars Are on the Way!",
  title: "From O to G, and back again",
  brief:
    "Place the mBot2 on checkpoint O and create the mission to make it reach point G. When the button A is pressed, the car moves forward to its destination point. When the button B is pressed, the car returns to its starting point. Display messages on the screen and animate the LEDs to create interactivity.",
  arena: "city",
  starter: {
    scripts: [
      {
        id: "l6-st-a",
        kind: "on-button",
        button: "A",
        body: [
          {
            id: "l6-st-a1",
            kind: "move-distance",
            direction: "forward",
            cm: n(10),
          },
          {
            id: "l6-st-a2",
            kind: "display-leds",
            colours: ["red", "red", "red", "red", "red"],
          },
          { id: "l6-st-a3", kind: "turn", side: "right", degrees: n(90) },
        ],
      },
      { id: "l6-st-b", kind: "on-button", button: "B", body: [] },
    ],
  },
  allowed: ["events", "control", "chassis", "display", "audio"],
  hints: [
    "Read the map before you touch a block. Write the trip down as a list: O to A is 10 cm, and the road carries straight on from there.",
    "The car only turns where the map has a corner. Between two corners it drives in one straight line, however many checkpoints it passes.",
    "Button B does the same trip the other way round. Ask yourself what the car has to do first, before it drives anywhere.",
  ],
  check: {
    summary:
      "Runs twice: the trip out to G, and the trip out followed by the trip home.",
    trials: arenaTrials("city")([
      {
        id: "to-g",
        label: "Button A — drive from O to G",
        input: [{ at: 500, kind: "press", button: "A" }],
        durationMs: 22000,
        assert: [
          {
            kind: "in-zone",
            zone: "G",
            when: "final",
            message: "The car has to finish standing on point G.",
          },
          {
            kind: "left-road",
            not: true,
            message:
              "An autonomous car stays on the road — check where your turns happen.",
          },
          { kind: "bumped", not: true },
          {
            kind: "screen-used",
            message:
              "Point 3 of the scenario asks for messages on the mBot2 screen.",
          },
          { kind: "leds-lit" },
        ],
      },
      {
        id: "back-home",
        label: "Button B — come back to the starting point",
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 12000, kind: "press", button: "B" },
        ],
        durationMs: 30000,
        assert: [
          {
            kind: "in-zone",
            zone: "O",
            when: "final",
            message: "Button B must bring the car all the way back to O.",
          },
          { kind: "bumped", not: true },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l6-so-a",
        kind: "on-button",
        button: "A",
        body: [
          {
            id: "l6-so-a0",
            kind: "print",
            value: txt("Driving to G"),
            newline: true,
          },
          {
            id: "l6-so-a1",
            kind: "move-distance",
            direction: "forward",
            cm: n(10),
          },
          {
            id: "l6-so-a2",
            kind: "display-leds",
            colours: ["red", "red", "red", "red", "red"],
          },
          {
            id: "l6-so-a3",
            kind: "move-distance",
            direction: "forward",
            cm: n(80),
          },
          { id: "l6-so-a4", kind: "turn", side: "right", degrees: n(90) },
          {
            id: "l6-so-a5",
            kind: "display-leds",
            colours: ["green", "green", "green", "green", "green"],
          },
          {
            id: "l6-so-a6",
            kind: "move-distance",
            direction: "forward",
            cm: n(30),
          },
          {
            id: "l6-so-a7",
            kind: "print",
            value: txt("Arrived at G"),
            newline: true,
          },
        ],
      },
      {
        id: "l6-so-b",
        kind: "on-button",
        button: "B",
        body: [
          {
            id: "l6-so-b0",
            kind: "print",
            value: txt("Going back to O"),
            newline: true,
          },
          { id: "l6-so-b1", kind: "turn", side: "right", degrees: n(90) },
          { id: "l6-so-b2", kind: "turn", side: "right", degrees: n(90) },
          {
            id: "l6-so-b3",
            kind: "move-distance",
            direction: "forward",
            cm: n(30),
          },
          // Left, not right: after the two right turns and the 30 cm leg the
          // car already faces north, so a right turn sends it east into the
          // arena edge instead of back towards O.
          { id: "l6-so-b4", kind: "turn", side: "left", degrees: n(90) },
          {
            id: "l6-so-b5",
            kind: "move-distance",
            direction: "forward",
            cm: n(90),
          },
          {
            id: "l6-so-b6",
            kind: "display-leds",
            colours: ["blue", "blue", "blue", "blue", "blue"],
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Lesson 7 · Counting Clients (book p. 60)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Book: "The Ultrasonic sensor will be placed at the entrance of the Mall. Each
 * time it detects a person, the counter will add 1 and the result will be
 * displayed on the screen. To reset the counter, the button B is pressed every
 * morning." The printed mission uses `< 10` for the doorway, `change counter by
 * 1`, `wait 1 seconds` and `print counter and move to a newline`, and button B
 * clears the screen and sets the counter back to 0.
 *
 * The starter is that mission with both bodies emptied out — the shape is the
 * book's, the blocks inside are the student's.
 */
const l7Counter: RbExercise = {
  id: "g6-c4-l7-counter",
  lesson: 7,
  lessonTitle: "Counting Clients",
  title: "Counting clients at the mall",
  brief:
    "The Ultrasonic sensor is placed at the entrance of the mall. Each time it detects a person at less than 10 cm, the counter adds 1 and the result is displayed on the screen. To reset the counter, the button B is pressed every morning: the screen is cleared and the counter goes back to 0.",
  arena: "mall",
  starter: {
    scripts: [
      {
        id: "l7-st-launch",
        kind: "on-launch",
        body: [
          { id: "l7-st-size", kind: "set-print-size", size: "super big" },
          {
            id: "l7-st-forever",
            kind: "forever",
            body: [
              {
                id: "l7-st-if",
                kind: "if",
                cond: bin("<", ULTRA, n(10)),
                then: [],
              },
            ],
          },
        ],
      },
      { id: "l7-st-b", kind: "on-button", button: "B", body: [] },
    ],
  },
  allowed: [
    "events",
    "control",
    "display",
    "shield",
    "operators",
    "variables",
  ],
  hints: [
    "Make a variable and call it counter. Nothing can be counted before there is somewhere to keep the number.",
    "One person walking past should add exactly 1. Think about how long a person stays in front of the sensor while your loop goes round and round.",
    "The book waits 1 second after counting, so the same person is not counted twenty times. Then it prints the counter on a new line.",
  ],
  check: {
    summary:
      "Runs twice: five clients walking in, then three clients and the morning reset.",
    trials: arenaTrials("mall")([
      {
        id: "five",
        label: "Five clients walk in, one every 6 seconds",
        durationMs: 34000,
        input: [
          ...(passesBy(1000, 8, 900) ?? []),
          ...(passesBy(7000, 8, 900) ?? []),
          ...(passesBy(13000, 8, 900) ?? []),
          ...(passesBy(19000, 8, 900) ?? []),
          ...(passesBy(25000, 8, 900) ?? []),
        ],
        assert: [
          {
            kind: "variable",
            name: "counter",
            op: "=",
            value: 5,
            when: "final",
            message:
              "Five people walked in, so the counter has to finish on exactly 5.",
          },
          {
            kind: "printed-number",
            value: 5,
            message: "The result has to be displayed on the screen.",
          },
        ],
      },
      {
        id: "reset",
        label: "Three clients, then button B in the morning",
        durationMs: 26000,
        input: [
          ...(passesBy(1000, 8, 900) ?? []),
          ...(passesBy(7000, 8, 900) ?? []),
          ...(passesBy(13000, 8, 900) ?? []),
          { at: 20000, kind: "press", button: "B" },
        ],
        assert: [
          {
            kind: "variable",
            name: "counter",
            op: "=",
            value: 3,
            when: "ever",
            message: "Three people walked in before the reset.",
          },
          {
            kind: "variable",
            name: "counter",
            op: "=",
            value: 0,
            when: "final",
            message: "Pressing button B has to put the counter back to 0.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l7-so-launch",
        kind: "on-launch",
        body: [
          { id: "l7-so-size", kind: "set-print-size", size: "super big" },
          { id: "l7-so-init", kind: "set-var", name: "counter", value: n(0) },
          {
            id: "l7-so-forever",
            kind: "forever",
            body: [
              {
                id: "l7-so-if",
                kind: "if",
                cond: bin("<", ULTRA, n(10)),
                then: [
                  {
                    id: "l7-so-change",
                    kind: "change-var",
                    name: "counter",
                    by: n(1),
                  },
                  { id: "l7-so-wait", kind: "wait", secs: n(1) },
                  {
                    id: "l7-so-print",
                    kind: "print",
                    value: vr("counter"),
                    newline: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "l7-so-b",
        kind: "on-button",
        button: "B",
        body: [
          { id: "l7-so-clear", kind: "clear-screen" },
          { id: "l7-so-zero", kind: "set-var", name: "counter", value: n(0) },
          {
            id: "l7-so-print2",
            kind: "print",
            value: vr("counter"),
            newline: true,
          },
        ],
      },
    ],
  },
};

/**
 * Book EXTRA CHALLENGE: "From the category 'sensing', add the appropriate
 * blocks to display 'Target reached' if the number of clients reached is 10 per
 * minute." The `timer(s)` and `reset timer` blocks printed beside it are the
 * ones that make "per minute" mean something.
 *
 * The starter is the counter mission the student has just finished.
 */
const l7Target: RbExercise = {
  id: "g6-c4-l7-target",
  lesson: 7,
  lessonTitle: "Counting Clients",
  title: "Extra challenge — Target reached",
  brief:
    "From the category “Sensing”, add the appropriate blocks to display “Target reached” if the number of clients reached is 10 per minute. The timer counts the seconds since the mission started, and it can be reset whenever you like.",
  arena: "mall",
  starter: {
    scripts: [
      {
        id: "l7t-st-launch",
        kind: "on-launch",
        body: [
          { id: "l7t-st-size", kind: "set-print-size", size: "super big" },
          { id: "l7t-st-init", kind: "set-var", name: "counter", value: n(0) },
          {
            id: "l7t-st-forever",
            kind: "forever",
            body: [
              {
                id: "l7t-st-if",
                kind: "if",
                cond: bin("<", ULTRA, n(10)),
                then: [
                  {
                    id: "l7t-st-change",
                    kind: "change-var",
                    name: "counter",
                    by: n(1),
                  },
                  { id: "l7t-st-wait", kind: "wait", secs: n(1) },
                  {
                    id: "l7t-st-print",
                    kind: "print",
                    value: vr("counter"),
                    newline: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  allowed: [
    "events",
    "control",
    "display",
    "shield",
    "sensing",
    "operators",
    "variables",
  ],
  hints: [
    "“10 per minute” is two facts at once: how many clients, and how long it took. You already count the clients.",
    "The timer block reports how many seconds have gone by. One minute is 60 of them.",
    "Both facts have to be true at the same moment, so they belong in one “if” joined by the “and” block.",
  ],
  check: {
    summary:
      "Runs twice: ten clients in under a minute, then the same ten spread over more than a minute.",
    trials: arenaTrials("mall")([
      {
        id: "busy",
        label: "Ten clients, one every 6 seconds",
        durationMs: 70000,
        input: Array.from({ length: 10 }, (_, i) =>
          passesBy(1000 + i * 6000, 8, 900) ?? [],
        ).flat(),
        assert: [
          {
            kind: "variable",
            name: "counter",
            op: ">=",
            value: 10,
            when: "ever",
            message: "Ten people walked in, so the counter has to reach 10.",
          },
          {
            kind: "printed",
            text: "Target reached",
            match: "contains",
            message:
              "Ten clients inside one minute is the target — say so on the screen.",
          },
        ],
      },
      {
        id: "quiet",
        label: "Ten clients, but one every 8 seconds",
        durationMs: 84000,
        input: Array.from({ length: 10 }, (_, i) =>
          passesBy(1000 + i * 8000, 8, 900) ?? [],
        ).flat(),
        assert: [
          {
            kind: "printed",
            text: "Target reached",
            match: "contains",
            not: true,
            message:
              "Ten clients took more than a minute this time, so the target was not reached. Check that the timer is part of your question.",
          },
        ],
      },
    ]),
  },
  solution: {
    scripts: [
      {
        id: "l7t-so-launch",
        kind: "on-launch",
        body: [
          { id: "l7t-so-size", kind: "set-print-size", size: "super big" },
          { id: "l7t-so-init", kind: "set-var", name: "counter", value: n(0) },
          { id: "l7t-so-reset", kind: "reset-timer" },
          {
            id: "l7t-so-forever",
            kind: "forever",
            body: [
              {
                id: "l7t-so-if",
                kind: "if",
                cond: bin("<", ULTRA, n(10)),
                then: [
                  {
                    id: "l7t-so-change",
                    kind: "change-var",
                    name: "counter",
                    by: n(1),
                  },
                  { id: "l7t-so-wait", kind: "wait", secs: n(1) },
                  {
                    id: "l7t-so-print",
                    kind: "print",
                    value: vr("counter"),
                    newline: true,
                  },
                ],
              },
              {
                id: "l7t-so-if2",
                kind: "if",
                cond: bin(
                  "and",
                  bin(">", vr("counter"), n(9)),
                  bin("<", TIMER, n(60)),
                ),
                then: [
                  {
                    id: "l7t-so-target",
                    kind: "print",
                    value: txt("Target reached"),
                    newline: true,
                  },
                  {
                    id: "l7t-so-zero",
                    kind: "set-var",
                    name: "counter",
                    value: n(0),
                  },
                  { id: "l7t-so-reset2", kind: "reset-timer" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ── The chapter, in the book's order ────────────────────────────────────────

export const RB_EXERCISES: RbExercise[] = [
  l1Recorder,
  l2Maze,
  l2Roundabout,
  l3SmartBin,
  l3FriendlyBin,
  l4Shutter,
  l5Security,
  l5Challenge1,
  l5Challenge2,
  l6Autonomous,
  l7Counter,
  l7Target,
];

/** Every buildable mission of one lesson, in the order the book sets them. */
export function exercisesForLesson(lesson: number): RbExercise[] {
  return RB_EXERCISES.filter((exercise) => exercise.lesson === lesson);
}

/** One mission by id — for deep links straight into the studio. */
export function exerciseById(id: string): RbExercise | undefined {
  return RB_EXERCISES.find((exercise) => exercise.id === id);
}

/** Used by the studio's "start from nothing" mode. */
export const RB_BLANK_MISSION: RbStatement[] = [];
