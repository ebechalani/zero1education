/**
 * The book's own hands-on tasks, turned into buildable challenges.
 *
 * Every exercise below comes from a printed "PROJECT", "CHALLENGE" or "IT IS TIME
 * TO TRY" box of Grade 6 · Chapter 1 "MakeCode for Micro:bit" — same project, same
 * numbers, same variable names (a, b, led, ledx, ledy), same wording where the book
 * gives us wording. Nothing here was invented.
 *
 * A challenge is checked on the RUN, never on the block arrangement. The student's
 * program is executed once per `MbTrial` (a set of sensor values plus a timeline of
 * button presses), the simulator hands back an `MbRunRecord`, and `checkRun()` reads
 * that record. Many correct programs exist for each of these tasks and the book only
 * ever cares about what the board actually does.
 *
 * Every check is plain data — no functions anywhere in it — so the whole set stays
 * serialisable for Studio later.
 */

import type {
  MbBinOp,
  MbButton,
  MbExpr,
  MbIcon,
  MbProgram,
  MbStatement,
} from "./program";
import { emptyProgram } from "./program";

// ── The palette ─────────────────────────────────────────────────────────────

/**
 * The MakeCode categories the book uses, in the book's own order and spelling.
 * "Air Quality" is the category the Kitronik extension adds in Lesson 8.
 * (The printed palette also shows Radio; no task in this chapter uses it and the
 * program model has no radio blocks, so it is deliberately absent.)
 */
export const MB_CATEGORIES = [
  "Basic",
  "Input",
  "Music",
  "Led",
  "Loops",
  "Logic",
  "Variables",
  "Math",
  "Air Quality",
] as const;

export type MbCategory = (typeof MB_CATEGORIES)[number];

// ── What a recorded run looks like ──────────────────────────────────────────

export type MbZipColour = "red" | "green" | "amber" | "off";

/** One thing that appeared on the 25-LED screen. */
export type MbShown =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "icon"; icon: MbIcon }
  | { kind: "clear" };

export interface MbDisplayEvent {
  /** Simulated milliseconds since the run started. */
  at: number;
  shown: MbShown;
}

export interface MbLedFrame {
  at: number;
  /** 0/1 per cell, `bitmap[y][x]` — the recorder flattens brightness to on/off. */
  bitmap: number[][];
}

/** One sample per write, including every step of a `for` loop counter. */
export interface MbVarSample {
  at: number;
  name: string;
  value: number;
}

export interface MbToneEvent {
  at: number;
  note: string;
  ms: number;
}

export interface MbZipEvent {
  at: number;
  colour: MbZipColour;
}

export interface MbButtonEvent {
  at: number;
  button: MbButton;
  /** True when the press made the program run at least one statement. */
  handled: boolean;
}

/** Everything the simulator observed during one trial. */
export interface MbRunRecord {
  trialId: string;
  durationMs: number;
  display: MbDisplayEvent[];
  /** One frame each time the matrix changes; the first frame is the blank start. */
  leds: MbLedFrame[];
  variables: MbVarSample[];
  tones: MbToneEvent[];
  zip: MbZipEvent[];
  buttons: MbButtonEvent[];
  finalLeds: number[][];
  finalVariables: Record<string, number>;
  finalZip: MbZipColour;
}

// ── How a check is expressed ────────────────────────────────────────────────

export type MbSeqMode =
  /** The observed list is exactly this list. */
  | "exact"
  /** These items appear in this order; extras in between are allowed. */
  | "in-order"
  /** Each item appears at least once, in any order. */
  | "contains-all";

export type MbCompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

/** "final" = at the end of the run · "ever" = at any moment during the run. */
export type MbWhen = "final" | "ever";

/** Strings are compared trimmed and case-insensitively. */
export type MbShownMatch =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string; match?: "exact" | "contains" }
  | { kind: "icon"; icon: MbIcon }
  | { kind: "clear" };

interface MbAssertionBase {
  /** Flip the result: "this must NOT happen". */
  not?: boolean;
  /** Student-facing line, shown when the assertion fails. */
  message?: string;
}

export type MbAssertion =
  | (MbAssertionBase & {
      kind: "display";
      mode: MbSeqMode;
      expect: MbShownMatch[];
      /** Ignore `clear screen` entries. Defaults to true unless one is expected. */
      ignoreClear?: boolean;
    })
  | (MbAssertionBase & { kind: "leds-at-some-moment"; bitmap: number[][] })
  | (MbAssertionBase & { kind: "final-leds"; bitmap: number[][] })
  /** These bitmaps appeared on the screen in this order (extras in between allowed). */
  | (MbAssertionBase & { kind: "led-sequence"; bitmaps: number[][][] })
  | (MbAssertionBase & {
      kind: "variable-value";
      name: string;
      op: MbCompareOp;
      value: number;
      when: MbWhen;
    })
  /** The values the variable held, in order, consecutive repeats collapsed. */
  | (MbAssertionBase & {
      kind: "variable-sequence";
      name: string;
      mode: MbSeqMode;
      values: number[];
    })
  | (MbAssertionBase & { kind: "button-handled"; button: MbButton })
  | (MbAssertionBase & { kind: "tone-played"; note?: string })
  | (MbAssertionBase & { kind: "zip-colour"; colour: MbZipColour; when: MbWhen });

/** Sensor values the trial starts from — the student can move them by hand too. */
export interface MbTrialSetup {
  temperature?: number;
  humidity?: number;
  light?: number;
}

export type MbStimulus =
  | { at: number; kind: "press"; button: MbButton }
  | { at: number; kind: "temperature"; value: number }
  | { at: number; kind: "humidity"; value: number }
  | { at: number; kind: "light"; value: number };

/**
 * One recorded run. `durationMs` is simulated time, so a trial may be far longer
 * than a student would sit through — the runner is free to fast-forward it.
 */
export interface MbTrial {
  id: string;
  /** Shown next to the result: "Pressing button A", "A hot room"… */
  label: string;
  setup?: MbTrialSetup;
  input?: MbStimulus[];
  durationMs: number;
  /** Every assertion must hold for the trial to pass. */
  assert: MbAssertion[];
}

export interface MbExerciseCheck {
  /** One line a teacher can read out: what the platform is about to test. */
  summary: string;
  trials: MbTrial[];
}

// ── The exercise ────────────────────────────────────────────────────────────

export interface MbExercise {
  id: string; // e.g. "g6-c1-l4-stopwatch"
  lessonId: string; // g6-mb-04
  title: string; // the book's own project name
  brief: string; // what the book asks for, in the book's terms
  /** Blocks the student starts with (usually empty, sometimes a partial script to fix) */
  starter: MbProgram;
  /** Which palette categories are offered — keeps early lessons uncluttered */
  allowed: string[];
  hints: string[]; // progressive, never giving the answer first
  /** Deterministic check of the RUN, not of the block arrangement:
   *  many correct programs exist and the book cares about behaviour. */
  check: MbExerciseCheck;
  solution: MbProgram; // a worked answer, revealed only after real attempts
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface MbAssertionResult {
  assertion: MbAssertion;
  passed: boolean;
  /** What the run actually did, in words the student can read. */
  detail: string;
}

export interface MbTrialResult {
  trialId: string;
  label: string;
  passed: boolean;
  assertions: MbAssertionResult[];
  /** True when no recording was supplied for this trial. */
  missing?: boolean;
}

export interface MbCheckResult {
  passed: boolean;
  trials: MbTrialResult[];
  /** Trials the caller never ran — the check cannot pass while any are missing. */
  missing: string[];
}

// ── The check engine ────────────────────────────────────────────────────────

const norm = (s: string) => s.trim().toLowerCase();

const compare = (op: MbCompareOp, left: number, right: number): boolean => {
  switch (op) {
    case "=":
      return left === right;
    case "!=":
      return left !== right;
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

function matchSequence<E, A>(
  expect: readonly E[],
  actual: readonly A[],
  eq: (e: E, a: A) => boolean,
  mode: MbSeqMode,
): boolean {
  if (mode === "exact") {
    return (
      expect.length === actual.length && expect.every((e, i) => eq(e, actual[i]))
    );
  }
  if (mode === "contains-all") {
    return expect.every((e) => actual.some((a) => eq(e, a)));
  }
  // in-order — greedily walk the observed list looking for each expected item
  let i = 0;
  for (const item of actual) {
    if (i < expect.length && eq(expect[i], item)) i += 1;
  }
  return i === expect.length;
}

const matchShown = (m: MbShownMatch, s: MbShown): boolean => {
  if (m.kind !== s.kind) return false;
  if (m.kind === "number" && s.kind === "number") return m.value === s.value;
  if (m.kind === "string" && s.kind === "string") {
    return m.match === "contains"
      ? norm(s.value).includes(norm(m.value))
      : norm(s.value) === norm(m.value);
  }
  if (m.kind === "icon" && s.kind === "icon") return m.icon === s.icon;
  return m.kind === "clear";
};

const describeShown = (s: MbShown): string => {
  switch (s.kind) {
    case "number":
      return String(s.value);
    case "string":
      return `"${s.value}"`;
    case "icon":
      return `the ${s.icon} icon`;
    case "clear":
      return "a cleared screen";
  }
};

const sameBitmap = (
  a: readonly (readonly number[])[],
  b: readonly (readonly number[])[],
): boolean => {
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const av = (a[y]?.[x] ?? 0) > 0 ? 1 : 0;
      const bv = (b[y]?.[x] ?? 0) > 0 ? 1 : 0;
      if (av !== bv) return false;
    }
  }
  return true;
};

const litCount = (bitmap: readonly (readonly number[])[]): number =>
  bitmap.reduce(
    (total, row) => total + row.reduce((n, cell) => n + (cell > 0 ? 1 : 0), 0),
    0,
  );

/** Every screen the run ever showed, in order, ending on the final state. */
const framesOf = (run: MbRunRecord): number[][][] => [
  ...run.leds.map((f) => f.bitmap),
  run.finalLeds,
];

/** The values a variable held, in order, with consecutive repeats collapsed. */
const seriesOf = (run: MbRunRecord, name: string): number[] => {
  const out: number[] = [];
  for (const sample of run.variables) {
    if (sample.name !== name) continue;
    if (out.length === 0 || out[out.length - 1] !== sample.value) {
      out.push(sample.value);
    }
  }
  return out;
};

function held(a: MbAssertion, run: MbRunRecord): { ok: boolean; observed: string } {
  switch (a.kind) {
    case "display": {
      const ignoreClear = a.ignoreClear ?? !a.expect.some((m) => m.kind === "clear");
      const shown = run.display
        .map((e) => e.shown)
        .filter((s) => !(ignoreClear && s.kind === "clear"));
      return {
        ok: matchSequence(a.expect, shown, matchShown, a.mode),
        observed: shown.length
          ? `the screen showed ${shown.map(describeShown).join(" · ")}`
          : "the screen showed nothing",
      };
    }
    case "leds-at-some-moment": {
      const frames = framesOf(run);
      return {
        ok: frames.some((f) => sameBitmap(f, a.bitmap)),
        observed: `the pattern asked for lights ${litCount(a.bitmap)} LEDs; the run ended with ${litCount(run.finalLeds)} lit`,
      };
    }
    case "final-leds":
      return {
        ok: sameBitmap(run.finalLeds, a.bitmap),
        observed: `the run ended with ${litCount(run.finalLeds)} LEDs lit`,
      };
    case "led-sequence": {
      const frames = framesOf(run);
      return {
        ok: matchSequence(a.bitmaps, frames, sameBitmap, "in-order"),
        observed: `the screen changed ${frames.length} time(s) during the run`,
      };
    }
    case "variable-value": {
      if (a.when === "final") {
        const value = run.finalVariables[a.name];
        return {
          ok: value !== undefined && compare(a.op, value, a.value),
          observed:
            value === undefined
              ? `the variable ${a.name} was never used`
              : `${a.name} ended at ${value}`,
        };
      }
      const series = seriesOf(run, a.name);
      return {
        ok: series.some((v) => compare(a.op, v, a.value)),
        observed: series.length
          ? `${a.name} took the values ${series.join(", ")}`
          : `the variable ${a.name} was never used`,
      };
    }
    case "variable-sequence": {
      const series = seriesOf(run, a.name);
      return {
        ok: matchSequence(a.values, series, (e, v) => e === v, a.mode),
        observed: series.length
          ? `${a.name} took the values ${series.join(", ")}`
          : `the variable ${a.name} was never used`,
      };
    }
    case "button-handled": {
      const presses = run.buttons.filter((b) => b.button === a.button);
      const answered = presses.filter((b) => b.handled).length;
      return {
        ok: answered > 0,
        observed: presses.length
          ? `button ${a.button} was pressed ${presses.length} time(s), ${answered} of them ran something`
          : `button ${a.button} was never pressed in this trial`,
      };
    }
    case "tone-played":
      return {
        ok: run.tones.some((t) => a.note === undefined || t.note === a.note),
        observed: run.tones.length
          ? `${run.tones.length} note(s) played`
          : "no note was played",
      };
    case "zip-colour": {
      const ok =
        a.when === "final"
          ? run.finalZip === a.colour
          : run.zip.some((z) => z.colour === a.colour) || run.finalZip === a.colour;
      return {
        ok,
        observed: `the ZIP LEDs ended ${run.finalZip}${
          run.zip.length ? ` after ${run.zip.length} change(s)` : " and never changed"
        }`,
      };
    }
  }
}

const evaluate = (a: MbAssertion, run: MbRunRecord): MbAssertionResult => {
  const { ok, observed } = held(a, run);
  const passed = a.not ? !ok : ok;
  return {
    assertion: a,
    passed,
    detail: passed || !a.message ? observed : `${a.message} — ${observed}`,
  };
};

/** Run every assertion of one trial against its recording. */
export function checkTrial(trial: MbTrial, run: MbRunRecord): MbTrialResult {
  const assertions = trial.assert.map((a) => evaluate(a, run));
  return {
    trialId: trial.id,
    label: trial.label,
    passed: assertions.every((r) => r.passed),
    assertions,
  };
}

/**
 * Interpret an exercise's check against the recordings of its trials.
 * The caller runs each `check.trials[i]` on the student's program and passes the
 * `MbRunRecord`s back in any order; they are matched by `trialId`.
 */
export function checkRun(
  check: MbExerciseCheck,
  runs: readonly MbRunRecord[],
): MbCheckResult {
  const byId = new Map(runs.map((r) => [r.trialId, r] as const));
  const missing: string[] = [];
  const trials = check.trials.map((trial) => {
    const run = byId.get(trial.id);
    if (!run) {
      missing.push(trial.id);
      return {
        trialId: trial.id,
        label: trial.label,
        passed: false,
        assertions: [],
        missing: true,
      };
    }
    return checkTrial(trial, run);
  });
  return {
    passed: missing.length === 0 && trials.every((t) => t.passed),
    trials,
    missing,
  };
}

// ── Small builders (they only ever produce plain data) ───────────────────────

const num = (value: number): MbExpr => ({ kind: "num", value });
const vr = (name: string): MbExpr => ({ kind: "var", name });
const bin = (op: MbBinOp, left: MbExpr, right: MbExpr): MbExpr => ({
  kind: "binop",
  op,
  left,
  right,
});
const TEMPERATURE: MbExpr = { kind: "temperature" };
const HUMIDITY: MbExpr = { kind: "humidity" };

/** `"#....."` rows read far better on a projector than nested arrays. */
const bitmap = (...rows: string[]): number[][] =>
  rows.map((row) => [...row].map((cell) => (cell === "#" ? 1 : 0)));

const BLANK = bitmap(".....", ".....", ".....", ".....", ".....");
const TOP_LEFT = bitmap("#....", ".....", ".....", ".....", ".....");
const COLUMN_0 = bitmap("#....", "#....", "#....", "#....", "#....");
const ROW_0 = bitmap("#####", ".....", ".....", ".....", ".....");
const FIRST_AND_LAST_ROWS = bitmap(
  "#####",
  ".....",
  ".....",
  ".....",
  "#####",
);
const ALL_25 = bitmap("#####", "#####", "#####", "#####", "#####");

const showsNumber = (value: number): MbShownMatch => ({ kind: "number", value });
const saysSomethingLike = (value: string): MbShownMatch => ({
  kind: "string",
  value,
  match: "contains",
});

/**
 * `show → pause → change`, written out longhand: exactly how a student counts a
 * variable up or down in Lesson 4, where the Loops category has not been met yet.
 */
const countingRun = (
  prefix: string,
  name: string,
  from: number,
  to: number,
): MbStatement[] => {
  const step = to >= from ? 1 : -1;
  const out: MbStatement[] = [
    { id: `${prefix}-set`, kind: "set-var", name, value: num(from) },
  ];
  for (let value = from; ; value += step) {
    out.push({ id: `${prefix}-show${value}`, kind: "show-number", value: vr(name) });
    out.push({ id: `${prefix}-wait${value}`, kind: "pause", ms: 800 });
    if (value === to) break;
    out.push({ id: `${prefix}-step${value}`, kind: "change-var", name, by: num(step) });
  }
  return out;
};

// ── Lesson 3 · the three-event button script (book p. 9) ─────────────────────

/**
 * The book prints a polling script (`forever` + `if button A is pressed`) as the
 * example to read, then sets the PROJECT as three separate behaviours. The program
 * model has no "button is pressed" expression — as on a real board, presses arrive
 * as events — so the project is built with two `on button` hats and a `forever`
 * that keeps the resting display up. The observable behaviour is the book's.
 */
const l3ThreeEvents: MbExercise = {
  id: "g6-c1-l3-three-events",
  lessonId: "g6-mb-03",
  title: "A Note, a 1 and a 2",
  brief:
    "Launch MakeCode and build the script that allows to: 1- Reproduce a musical note if the button A is pressed. 2- Display \"1\" if the button B is pressed. 3- Display \"2\" if no buttons are pressed.",
  starter: {
    events: [
      { id: "l3-st-a", kind: "on-button", button: "A", body: [] },
      { id: "l3-st-b", kind: "on-button", button: "B", body: [] },
      { id: "l3-st-f", kind: "forever", body: [] },
    ],
  },
  allowed: ["Basic", "Input", "Music"],
  hints: [
    "Three behaviours, three hats. Two of them wait for a push button; the third one has to keep working while nobody touches the board.",
    "\"If no buttons are pressed\" is the resting state of the Micro:bit — whatever the `forever` block keeps doing when you leave it alone.",
    "The Music category has a block that plays one note for a chosen number of milliseconds. Drop it inside the button A hat.",
  ],
  check: {
    summary:
      "Runs three times: left alone, with button A pressed, with button B pressed.",
    trials: [
      {
        id: "idle",
        label: "Nobody touches the board",
        durationMs: 1200,
        assert: [
          {
            kind: "display",
            mode: "contains-all",
            expect: [showsNumber(2)],
            message: "With no button pressed the screen must display 2.",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [showsNumber(1)],
            not: true,
            message: "The 1 belongs to button B — it must not appear on its own.",
          },
          {
            kind: "tone-played",
            not: true,
            message: "The note belongs to button A — it must not play on its own.",
          },
        ],
      },
      {
        id: "press-a",
        label: "Button A pressed",
        input: [{ at: 300, kind: "press", button: "A" }],
        durationMs: 1500,
        assert: [
          { kind: "button-handled", button: "A" },
          {
            kind: "tone-played",
            message: "Pressing A must reproduce a musical note.",
          },
        ],
      },
      {
        id: "press-b",
        label: "Button B pressed",
        input: [{ at: 300, kind: "press", button: "B" }],
        durationMs: 1500,
        assert: [
          { kind: "button-handled", button: "B" },
          {
            kind: "display",
            mode: "contains-all",
            expect: [showsNumber(1)],
            message: "Pressing B must display 1.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l3-so-a",
        kind: "on-button",
        button: "A",
        body: [{ id: "l3-so-a1", kind: "play-tone", note: "C", ms: 500 }],
      },
      {
        id: "l3-so-b",
        kind: "on-button",
        button: "B",
        body: [{ id: "l3-so-b1", kind: "show-number", value: num(1) }],
      },
      {
        id: "l3-so-f",
        kind: "forever",
        body: [
          { id: "l3-so-f1", kind: "show-number", value: num(2) },
          { id: "l3-so-f2", kind: "pause", ms: 200 },
        ],
      },
    ],
  },
};

// ── Lesson 4 · the stopwatch project (book p. 11) ─────────────────────────────

/**
 * Book PROJECT: "Create two variables a and b · Display the values of the variable
 * a from 3 to 6 · Display the values of the variable b from 7 to 2."
 *
 * The lesson's other script (the one the student only *reads*) is printed with a
 * variable called `count` and an `if count = 10 then set count to 0`; the platform
 * lesson g6-mb-04 describes it with the name x and no reset. It is a reading
 * question either way, so it is not a buildable exercise here.
 */
const l4Stopwatch: MbExercise = {
  id: "g6-c1-l4-stopwatch",
  lessonId: "g6-mb-04",
  title: "The Stopwatch: a from 3 to 6, b from 7 to 2",
  brief:
    "Launch MakeCode and build the script that allows you to: 1- Create two variables a and b. 2- Display the values of the variable a from 3 to 6. 3- Display the values of the variable b from 7 to 2.",
  starter: emptyProgram(),
  allowed: ["Basic", "Variables", "Math"],
  hints: [
    "A stopwatch displays sequential numbers, so each variable needs a starting value before anything is displayed.",
    "`set … to` writes a value into the box. `change … by` adds to what is already inside it.",
    "b has to go down. Look again at what you are allowed to type in the `change b by` block — it does not have to be a positive number.",
  ],
  check: {
    summary:
      "One run: the screen must display 3, 4, 5, 6 and then 7, 6, 5, 4, 3, 2.",
    trials: [
      {
        id: "count",
        label: "The full stopwatch",
        durationMs: 14000,
        assert: [
          {
            kind: "variable-sequence",
            name: "a",
            mode: "in-order",
            values: [3, 4, 5, 6],
            message: "The variable a must hold 3, then 4, then 5, then 6.",
          },
          {
            kind: "variable-sequence",
            name: "b",
            mode: "in-order",
            values: [7, 6, 5, 4, 3, 2],
            message: "The variable b must count down from 7 to 2.",
          },
          {
            kind: "display",
            mode: "in-order",
            expect: [3, 4, 5, 6].map(showsNumber),
            message: "The screen must display the values of a: 3, 4, 5, 6.",
          },
          {
            kind: "display",
            mode: "in-order",
            expect: [7, 6, 5, 4, 3, 2].map(showsNumber),
            message: "The screen must display the values of b: 7, 6, 5, 4, 3, 2.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l4-so-start",
        kind: "on-start",
        body: [
          ...countingRun("l4-a", "a", 3, 6),
          ...countingRun("l4-b", "b", 7, 2),
        ],
      },
    ],
  },
};

// ── Lesson 5 · the two-player game (book pp. 12–13) ──────────────────────────

/**
 * Book: player 1 uses button A, player 2 uses button B, each press adds 1 to that
 * player's variable, and the game ends when one of them reaches 10 — the winner is
 * announced on the screen. The book builds the button A script on the page and
 * leaves button B to the student, so that is exactly what the starter contains.
 */
const l5TwoPlayerGame: MbExercise = {
  id: "g6-c1-l5-two-player-game",
  lessonId: "g6-mb-05",
  title: "The Winner Is!!",
  brief:
    "Now that you built the script for the button A, it is time to program the button B and to start playing the game. Each player presses their push button; the game ends when one of the two players reaches the value 10, and a message is displayed announcing the winner.",
  starter: {
    events: [
      {
        id: "l5-st-start",
        kind: "on-start",
        body: [
          { id: "l5-st-s1", kind: "set-var", name: "a", value: num(0) },
          { id: "l5-st-s2", kind: "set-var", name: "b", value: num(0) },
        ],
      },
      {
        id: "l5-st-a",
        kind: "on-button",
        button: "A",
        body: [
          { id: "l5-st-a1", kind: "change-var", name: "a", by: num(1) },
          {
            id: "l5-st-a2",
            kind: "if",
            cond: bin("=", vr("a"), num(10)),
            then: [{ id: "l5-st-a3", kind: "show-string", value: "A" }],
          },
        ],
      },
      { id: "l5-st-b", kind: "on-button", button: "B", body: [] },
    ],
  },
  allowed: ["Basic", "Input", "Logic", "Variables", "Math"],
  hints: [
    "Player 2 needs the same script as player 1 — but a variable can't hold two values at the same time, so it cannot be the same box.",
    "Read the button A hat block by block and say out loud what each one does. Your button B hat has to do the same three things.",
    "Check the value inside the `if` block: the game ends at 10, not at 9 and not at 11.",
  ],
  check: {
    summary:
      "Runs three times: player 1 presses ten times, player 2 presses ten times, and a game that is not finished yet.",
    trials: [
      {
        id: "a-wins",
        label: "Player 1 presses button A ten times",
        input: Array.from({ length: 10 }, (_, i) => ({
          at: 300 + i * 300,
          kind: "press" as const,
          button: "A" as const,
        })),
        durationMs: 4500,
        assert: [
          { kind: "button-handled", button: "A" },
          {
            kind: "variable-value",
            name: "a",
            op: "=",
            value: 10,
            when: "final",
            message: "Ten presses of button A must leave the variable a at 10.",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("A")],
            message: "When a reaches 10 the screen must announce player A.",
          },
        ],
      },
      {
        id: "b-wins",
        label: "Player 2 presses button B ten times",
        input: Array.from({ length: 10 }, (_, i) => ({
          at: 300 + i * 300,
          kind: "press" as const,
          button: "B" as const,
        })),
        durationMs: 4500,
        assert: [
          { kind: "button-handled", button: "B" },
          {
            kind: "variable-value",
            name: "b",
            op: "=",
            value: 10,
            when: "final",
            message: "Ten presses of button B must leave the variable b at 10.",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("B")],
            message: "When b reaches 10 the screen must announce player B.",
          },
        ],
      },
      {
        id: "not-yet",
        label: "Nine presses — nobody has won yet",
        input: Array.from({ length: 9 }, (_, i) => ({
          at: 300 + i * 300,
          kind: "press" as const,
          button: "B" as const,
        })),
        durationMs: 4000,
        assert: [
          {
            kind: "variable-value",
            name: "b",
            op: "=",
            value: 9,
            when: "final",
            message: "Each press adds exactly 1 to the player's variable.",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("B")],
            not: true,
            message:
              "The winner is announced only when the variable reaches 10 — not on every press.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l5-so-start",
        kind: "on-start",
        body: [
          { id: "l5-so-s1", kind: "set-var", name: "a", value: num(0) },
          { id: "l5-so-s2", kind: "set-var", name: "b", value: num(0) },
        ],
      },
      {
        id: "l5-so-a",
        kind: "on-button",
        button: "A",
        body: [
          { id: "l5-so-a1", kind: "change-var", name: "a", by: num(1) },
          {
            id: "l5-so-a2",
            kind: "if",
            cond: bin("=", vr("a"), num(10)),
            then: [{ id: "l5-so-a3", kind: "show-string", value: "A" }],
          },
        ],
      },
      {
        id: "l5-so-b",
        kind: "on-button",
        button: "B",
        body: [
          { id: "l5-so-b1", kind: "change-var", name: "b", by: num(1) },
          {
            id: "l5-so-b2",
            kind: "if",
            cond: bin("=", vr("b"), num(10)),
            then: [{ id: "l5-so-b3", kind: "show-string", value: "B" }],
          },
        ],
      },
    ],
  },
};

// ── Lesson 6 · the LED matrix by (x, y) (book pp. 14–15) ──────────────────────

/**
 * Book "IT IS TIME TO TRY": the printed script plots (0,0) (0,1) (0,2) (0,3) with a
 * pause between each — four blocks. The PROJECT on the same page then calls it "the
 * script to illuminate the first column", and the column has five LEDs. We follow
 * the words, not the screenshot: the whole first column must light, (0,4) included.
 */
const l6FirstColumn: MbExercise = {
  id: "g6-c1-l6-first-column",
  lessonId: "g6-mb-06",
  title: "Illuminate the First Column",
  brief:
    "Build the script that illuminates the first column of the leds — one LED at a time, top to bottom, with a pause between each.",
  starter: emptyProgram(),
  allowed: ["Basic", "Led"],
  hints: [
    "Write the five addresses in your copybook first. In the first column, which number never changes?",
    "The Led category has the block that switches one LED on. It asks for x, then y.",
    "x is the column and y is the row, so the five blocks all share the same x. Add a pause between them to watch the column fill.",
  ],
  check: {
    summary: "One run: at some moment the screen shows the first column, and only it.",
    trials: [
      {
        id: "column",
        label: "The first column lights up",
        durationMs: 9000,
        assert: [
          {
            kind: "leds-at-some-moment",
            bitmap: COLUMN_0,
            message:
              "All five LEDs of the first column — (0,0) to (0,4) — must be lit together, and nothing else.",
          },
          {
            kind: "led-sequence",
            bitmaps: [TOP_LEFT, COLUMN_0],
            message: "The column fills one LED at a time, starting from (0,0).",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l6a-so-start",
        kind: "on-start",
        body: [0, 1, 2, 3, 4].flatMap((y): MbStatement[] => [
          { id: `l6a-so-p${y}`, kind: "plot", x: num(0), y: num(y) },
          { id: `l6a-so-w${y}`, kind: "pause", ms: 1000 },
        ]),
      },
    ],
  },
};

const l6FirstAndLastRows: MbExercise = {
  id: "g6-c1-l6-first-and-last-rows",
  lessonId: "g6-mb-06",
  title: "The First and Last Rows",
  brief:
    "Now that you built the script to illuminate the first column of the leds, it is time to create the script to illuminate the first and last rows.",
  starter: emptyProgram(),
  allowed: ["Basic", "Led"],
  hints: [
    "Ten LEDs, ten addresses. Write them all down before you drag a single block.",
    "In a row it is the row number that is frozen and the column number that walks across.",
    "The first row is y = 0. Which number is the last row? Remember the screen is numbered 0 to 4.",
  ],
  check: {
    summary:
      "One run: at some moment the top row and the bottom row are lit, and nothing in between.",
    trials: [
      {
        id: "rows",
        label: "The first and last rows light up",
        durationMs: 14000,
        assert: [
          {
            kind: "leds-at-some-moment",
            bitmap: FIRST_AND_LAST_ROWS,
            message:
              "Row 0 and row 4 must be fully lit at the same moment — ten LEDs, and no others.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l6b-so-start",
        kind: "on-start",
        body: [0, 4].flatMap((y) =>
          [0, 1, 2, 3, 4].flatMap((x): MbStatement[] => [
            { id: `l6b-so-p${x}${y}`, kind: "plot", x: num(x), y: num(y) },
            { id: `l6b-so-w${x}${y}`, kind: "pause", ms: 400 },
          ]),
        ),
      },
    ],
  },
};

// ── Lesson 7 · loops on the LED matrix (book pp. 16–17) ───────────────────────

/**
 * Book "FLASHING LEDS.. THE PROJECT": create a variable named led, put a
 * `for led from 0 to 4` loop around a `plot x - y` block, drop led into the x field
 * and add a pause; then "COMPLETING THE PROJECT": a second loop turns the LEDs off
 * in the same order they were turned on.
 *
 * With led in the x field and y left at 0 the light sweeps along the top row. The
 * book's own text calls that line "the first column" on p. 15 and "the first row" on
 * p. 17; the blocks decide, and the blocks light row 0.
 */
const l7FlashingLeds: MbExercise = {
  id: "g6-c1-l7-flashing-leds",
  lessonId: "g6-mb-07",
  title: "Flashing LEDs",
  brief:
    "Create a variable named led. Use a `for led from 0 to 4` loop with `plot x - y` to switch the LEDs on one by one, with a pause to slow down the blinking effect. Then add another loop in order to turn off the LEDs in the same order they were turned on.",
  starter: {
    events: [{ id: "l7a-st-f", kind: "forever", body: [] }],
  },
  allowed: ["Basic", "Led", "Loops", "Variables"],
  hints: [
    "Nothing in a script can use a variable before the variable exists — create led first.",
    "`for led from 0 to 4` runs five times, and led holds a different number on each turn. Which field of the plot block should that number land in?",
    "The second loop repeats the same addresses, but with the block that switches an LED off instead of on.",
  ],
  check: {
    summary:
      "One run: the LEDs come on one after another, the whole line is lit, then the screen empties in the same order.",
    trials: [
      {
        id: "flash",
        label: "On, then off",
        durationMs: 14000,
        assert: [
          {
            kind: "variable-sequence",
            name: "led",
            mode: "in-order",
            values: [0, 1, 2, 3, 4],
            message:
              "The loop must count with a variable named led, from 0 to 4.",
          },
          {
            kind: "led-sequence",
            bitmaps: [TOP_LEFT, ROW_0, BLANK],
            message:
              "One LED, then the whole line, then an empty screen — that is the flashing effect the book asks for.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l7a-so-f",
        kind: "forever",
        body: [
          {
            id: "l7a-so-on",
            kind: "for",
            name: "led",
            from: num(0),
            to: num(4),
            body: [
              { id: "l7a-so-on1", kind: "plot", x: vr("led"), y: num(0) },
              { id: "l7a-so-on2", kind: "pause", ms: 200 },
            ],
          },
          {
            id: "l7a-so-off",
            kind: "for",
            name: "led",
            from: num(0),
            to: num(4),
            body: [
              { id: "l7a-so-off1", kind: "unplot", x: vr("led"), y: num(0) },
              { id: "l7a-so-off2", kind: "pause", ms: 200 },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Book "ILLUMINATING 25 LEDS": create ledx and ledy, initialize both to 0 in
 * `on start`, then use an embedded loop to light the 25 LEDs. Which loop sits
 * outside is left open — the screen ends up full either way — so the check never
 * looks at the order, only that both variables walk 0 → 4 and the screen fills.
 */
const l7All25: MbExercise = {
  id: "g6-c1-l7-all-25-leds",
  lessonId: "g6-mb-07",
  title: "Illuminating 25 LEDs",
  brief:
    "Create two variables, ledx and ledy, and initialize them in the `on start` block. Then create an embedded loop — a loop inside a loop — in order to illuminate the different columns of the Micro:bit's screen, all 25 LEDs.",
  starter: {
    events: [
      {
        id: "l7b-st-start",
        kind: "on-start",
        body: [
          { id: "l7b-st-s1", kind: "set-var", name: "ledx", value: num(0) },
          { id: "l7b-st-s2", kind: "set-var", name: "ledy", value: num(0) },
        ],
      },
      { id: "l7b-st-f", kind: "forever", body: [] },
    ],
  },
  allowed: ["Basic", "Led", "Loops", "Variables"],
  hints: [
    "One loop lights one line. Ask yourself what has to happen after that line is finished.",
    "The plot block needs two numbers, and you have two variables. Give each variable its own field.",
    "The inner loop runs completely for every single turn of the outer loop: 5 × 5 = 25.",
  ],
  check: {
    summary:
      "One run: both ledx and ledy walk from 0 to 4 and the whole screen ends up lit.",
    trials: [
      {
        id: "fill",
        label: "The whole screen fills",
        durationMs: 30000,
        assert: [
          {
            kind: "variable-sequence",
            name: "ledx",
            mode: "in-order",
            values: [0, 1, 2, 3, 4],
            message: "ledx must take the values 0, 1, 2, 3, 4.",
          },
          {
            kind: "variable-sequence",
            name: "ledy",
            mode: "in-order",
            values: [0, 1, 2, 3, 4],
            message: "ledy must take the values 0, 1, 2, 3, 4.",
          },
          {
            kind: "leds-at-some-moment",
            bitmap: ALL_25,
            message: "All 25 LEDs must be lit at the same moment.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l7b-so-start",
        kind: "on-start",
        body: [
          { id: "l7b-so-s1", kind: "set-var", name: "ledx", value: num(0) },
          { id: "l7b-so-s2", kind: "set-var", name: "ledy", value: num(0) },
        ],
      },
      {
        id: "l7b-so-f",
        kind: "forever",
        body: [
          {
            id: "l7b-so-outer",
            kind: "for",
            name: "ledy",
            from: num(0),
            to: num(4),
            body: [
              {
                id: "l7b-so-inner",
                kind: "for",
                name: "ledx",
                from: num(0),
                to: num(4),
                body: [
                  {
                    id: "l7b-so-plot",
                    kind: "plot",
                    x: vr("ledx"),
                    y: vr("ledy"),
                  },
                  { id: "l7b-so-wait", kind: "pause", ms: 200 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

// ── Lesson 8 · the temperature warning (book pp. 18–19) ───────────────────────

/**
 * Book CHALLENGE: display "too hot" when the temperature is greater than 30, and
 * "nice weather" when the temperature is less than 30.
 *
 * Two notes on fidelity:
 * · The printed script writes the reading to the Kitronik OLED (`show … on line 3`).
 *   The program model has one screen, the 25 LEDs, so the reading is displayed there.
 * · The book's two conditions are "greater than 30" and "less than 30", which leaves
 *   exactly 30 undefined. That gap is deliberate in the lesson, so no trial tests it.
 */
const l8TooHot: MbExercise = {
  id: "g6-c1-l8-too-hot",
  lessonId: "g6-mb-08",
  title: "Too Hot or Nice Weather",
  brief:
    "Time to take actions. Build the script in order to display one of the messages below: 1- \"too hot\" when the temperature is greater than 30. 2- \"nice weather\" when the temperature is less than 30.",
  starter: {
    events: [
      {
        id: "l8-st-f",
        kind: "forever",
        body: [
          { id: "l8-st-f1", kind: "show-number", value: TEMPERATURE },
          { id: "l8-st-f2", kind: "pause", ms: 1000 },
        ],
      },
    ],
  },
  allowed: ["Basic", "Logic", "Math", "Air Quality"],
  hints: [
    "The station already reads the room. What is missing is a decision about the number it read.",
    "The Logic category holds the block that asks a question and the block that compares two values.",
    "One question, two answers: use the `else` part instead of writing a second `if`.",
  ],
  check: {
    summary:
      "Runs twice: once in a room at 35 °C, once in a room at 22 °C.",
    trials: [
      {
        id: "hot",
        label: "A hot room — 35 °C",
        setup: { temperature: 35, humidity: 40 },
        durationMs: 5000,
        assert: [
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("too hot")],
            message: "Above 30 the screen must display \"too hot\".",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("nice weather")],
            not: true,
            message: "At 35 °C the weather message must not appear.",
          },
        ],
      },
      {
        id: "nice",
        label: "A pleasant room — 22 °C",
        setup: { temperature: 22, humidity: 45 },
        durationMs: 5000,
        assert: [
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("nice weather")],
            message: "Below 30 the screen must display \"nice weather\".",
          },
          {
            kind: "display",
            mode: "contains-all",
            expect: [saysSomethingLike("too hot")],
            not: true,
            message: "At 22 °C the warning must not appear.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l8-so-f",
        kind: "forever",
        body: [
          { id: "l8-so-f1", kind: "show-number", value: TEMPERATURE },
          { id: "l8-so-f2", kind: "pause", ms: 1000 },
          {
            id: "l8-so-f3",
            kind: "if",
            cond: bin(">", TEMPERATURE, num(30)),
            then: [{ id: "l8-so-f4", kind: "show-string", value: "too hot" }],
            otherwise: [
              { id: "l8-so-f5", kind: "show-string", value: "nice weather" },
            ],
          },
          { id: "l8-so-f6", kind: "pause", ms: 1000 },
        ],
      },
    ],
  },
};

// ── Lesson 9 · readings on demand + ZIP warnings (book pp. 20–21) ─────────────

/**
 * Book: button A launches a reading and adds 1 to the variable a, button B does the
 * same with b, and A+B displays the two variables to show how many times the reading
 * was done. The printed sentence says both buttons display "the reading of the
 * humidity", but the printed script under it reads the temperature on button A and
 * the lesson's mission is "control the display of the temperature and the humidity
 * using the two buttons A and B" — so A reads the temperature and B the humidity.
 *
 * The starter is the script the book prints for button A (reading, pause, clear),
 * without the counter: adding the counters, the B script and the A+B script is the
 * student's mission.
 */
const l9ReadOnDemand: MbExercise = {
  id: "g6-c1-l9-read-on-demand",
  lessonId: "g6-mb-09",
  title: "Reading Values on Demand",
  brief:
    "Complete the mission to control the display of the temperature and the humidity using the two buttons A and B. Button A displays the temperature and adds 1 to the variable a; button B displays the humidity and adds 1 to the variable b; pressing the buttons A+B displays the values of a and b to show how many times the reading was done.",
  starter: {
    events: [
      {
        id: "l9a-st-start",
        kind: "on-start",
        body: [
          { id: "l9a-st-s0", kind: "clear-screen" },
          { id: "l9a-st-s1", kind: "set-var", name: "a", value: num(0) },
          { id: "l9a-st-s2", kind: "set-var", name: "b", value: num(0) },
        ],
      },
      {
        id: "l9a-st-a",
        kind: "on-button",
        button: "A",
        body: [
          { id: "l9a-st-a1", kind: "show-number", value: TEMPERATURE },
          { id: "l9a-st-a2", kind: "pause", ms: 2000 },
          { id: "l9a-st-a3", kind: "clear-screen" },
        ],
      },
    ],
  },
  allowed: ["Basic", "Input", "Variables", "Math", "Air Quality"],
  hints: [
    "The button A script already reads a sensor. Something has to remember that the reading happened.",
    "A variable can't hold more than one value at the same time — that is why the book creates one variable per button.",
    "The Input category has a third hat: the one that waits for both buttons together.",
  ],
  check: {
    summary:
      "Runs three times: button A alone, button B alone, then a mix ending on A+B.",
    trials: [
      {
        id: "reads-temperature",
        label: "Button A reads the temperature",
        setup: { temperature: 27, humidity: 55 },
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 3000, kind: "press", button: "A" },
        ],
        durationMs: 6000,
        assert: [
          { kind: "button-handled", button: "A" },
          {
            kind: "display",
            mode: "contains-all",
            expect: [showsNumber(27)],
            message: "Button A must display the temperature read by the station.",
          },
          {
            kind: "variable-value",
            name: "a",
            op: "=",
            value: 2,
            when: "final",
            message: "Two presses of A must leave a at 2.",
          },
          {
            kind: "variable-value",
            name: "b",
            op: "=",
            value: 0,
            when: "final",
            message: "Button A must not touch player B's counter.",
          },
        ],
      },
      {
        id: "reads-humidity",
        label: "Button B reads the humidity",
        setup: { temperature: 27, humidity: 55 },
        input: [
          { at: 500, kind: "press", button: "B" },
          { at: 3000, kind: "press", button: "B" },
        ],
        durationMs: 6000,
        assert: [
          { kind: "button-handled", button: "B" },
          {
            kind: "display",
            mode: "contains-all",
            expect: [showsNumber(55)],
            message: "Button B must display the humidity read by the station.",
          },
          {
            kind: "variable-value",
            name: "b",
            op: "=",
            value: 2,
            when: "final",
            message: "Two presses of B must leave b at 2.",
          },
        ],
      },
      {
        id: "counters",
        label: "A+B shows how many readings were done",
        setup: { temperature: 27, humidity: 55 },
        input: [
          { at: 500, kind: "press", button: "A" },
          { at: 3000, kind: "press", button: "A" },
          { at: 5500, kind: "press", button: "B" },
          { at: 8000, kind: "press", button: "B" },
          { at: 10500, kind: "press", button: "B" },
          { at: 13000, kind: "press", button: "A+B" },
        ],
        durationMs: 19000,
        assert: [
          { kind: "button-handled", button: "A+B" },
          {
            kind: "variable-value",
            name: "a",
            op: "=",
            value: 2,
            when: "final",
          },
          {
            kind: "variable-value",
            name: "b",
            op: "=",
            value: 3,
            when: "final",
          },
          {
            kind: "display",
            mode: "in-order",
            expect: [showsNumber(2), showsNumber(3)],
            message:
              "Pressing A+B must display the two counters: 2 readings on A, then 3 on B.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l9a-so-start",
        kind: "on-start",
        body: [
          { id: "l9a-so-s0", kind: "clear-screen" },
          { id: "l9a-so-s1", kind: "set-var", name: "a", value: num(0) },
          { id: "l9a-so-s2", kind: "set-var", name: "b", value: num(0) },
        ],
      },
      {
        id: "l9a-so-a",
        kind: "on-button",
        button: "A",
        body: [
          { id: "l9a-so-a1", kind: "show-number", value: TEMPERATURE },
          { id: "l9a-so-a2", kind: "change-var", name: "a", by: num(1) },
          { id: "l9a-so-a3", kind: "pause", ms: 2000 },
          { id: "l9a-so-a4", kind: "clear-screen" },
        ],
      },
      {
        id: "l9a-so-b",
        kind: "on-button",
        button: "B",
        body: [
          { id: "l9a-so-b1", kind: "show-number", value: HUMIDITY },
          { id: "l9a-so-b2", kind: "change-var", name: "b", by: num(1) },
          { id: "l9a-so-b3", kind: "pause", ms: 2000 },
          { id: "l9a-so-b4", kind: "clear-screen" },
        ],
      },
      {
        id: "l9a-so-ab",
        kind: "on-button",
        button: "A+B",
        body: [
          { id: "l9a-so-ab1", kind: "show-number", value: vr("a") },
          { id: "l9a-so-ab2", kind: "pause", ms: 2000 },
          { id: "l9a-so-ab3", kind: "show-number", value: vr("b") },
          { id: "l9a-so-ab4", kind: "pause", ms: 2000 },
          { id: "l9a-so-ab5", kind: "clear-screen" },
        ],
      },
    ],
  },
};

/**
 * Book CHALLENGE (p. 21): "Examine the Air Quality Station board to identify the 3
 * Zip LED. Create the mission to turn on red LED in case the temperature is higher
 * than 30 degrees and to turn them to green in case it is less than 30."
 * Exactly 30 is left undefined here too, so no trial tests it.
 */
const l9ZipWarning: MbExercise = {
  id: "g6-c1-l9-zip-warning",
  lessonId: "g6-mb-09",
  title: "Red Above 30, Green Below",
  brief:
    "Examine the Air Quality Station board to identify the 3 ZIP LEDs. Create the mission to turn on red LED in case the temperature is higher than 30 degrees and to turn them to green in case it is less than 30.",
  starter: {
    events: [{ id: "l9b-st-f", kind: "forever", body: [] }],
  },
  allowed: ["Basic", "Logic", "Math", "Air Quality"],
  hints: [
    "A warning has to keep watching the room, so it cannot live in `on start`.",
    "You already wrote this question in Lesson 8 — only the answer changes: a colour instead of a message.",
    "The ZIP LEDs are their own block group inside the Air Quality category.",
  ],
  check: {
    summary: "Runs twice: a room at 35 °C, then the same room cooled to 20 °C.",
    trials: [
      {
        id: "zip-hot",
        label: "35 °C — the warning colour",
        setup: { temperature: 35, humidity: 40 },
        durationMs: 4000,
        assert: [
          {
            kind: "zip-colour",
            colour: "red",
            when: "final",
            message: "Above 30 degrees the 3 ZIP LEDs must be red.",
          },
        ],
      },
      {
        id: "zip-cool",
        label: "20 °C — all clear",
        setup: { temperature: 20, humidity: 45 },
        durationMs: 4000,
        assert: [
          {
            kind: "zip-colour",
            colour: "green",
            when: "final",
            message: "Below 30 degrees the 3 ZIP LEDs must be green.",
          },
          {
            kind: "zip-colour",
            colour: "red",
            when: "ever",
            not: true,
            message: "At 20 °C the red warning must never come on.",
          },
        ],
      },
    ],
  },
  solution: {
    events: [
      {
        id: "l9b-so-f",
        kind: "forever",
        body: [
          {
            id: "l9b-so-if",
            kind: "if",
            cond: bin(">", TEMPERATURE, num(30)),
            then: [{ id: "l9b-so-red", kind: "set-zip", colour: "red" }],
            otherwise: [{ id: "l9b-so-green", kind: "set-zip", colour: "green" }],
          },
          { id: "l9b-so-wait", kind: "pause", ms: 500 },
        ],
      },
    ],
  },
};

// ── The chapter, in the book's order ─────────────────────────────────────────

export const MB_EXERCISES: MbExercise[] = [
  l3ThreeEvents,
  l4Stopwatch,
  l5TwoPlayerGame,
  l6FirstColumn,
  l6FirstAndLastRows,
  l7FlashingLeds,
  l7All25,
  l8TooHot,
  l9ReadOnDemand,
  l9ZipWarning,
];

/** Every buildable challenge of one lesson, in the order the book sets them. */
export function exercisesForLesson(lessonId: string): MbExercise[] {
  return MB_EXERCISES.filter((exercise) => exercise.lessonId === lessonId);
}

/** One challenge by id — for deep links straight into the editor. */
export function exerciseById(id: string): MbExercise | undefined {
  return MB_EXERCISES.find((exercise) => exercise.id === id);
}
