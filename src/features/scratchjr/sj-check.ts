import { recordRun, runProject, type SjRunRecord, type SjStart } from "./sj-engine";
import type { SjCategory, SjProject } from "./sj-model";

/**
 * How a ScratchJr challenge is judged.
 *
 * On the RUN, never on the block arrangement. The book's projects all have
 * many correct answers — a duck can cross the sea with one Move Right 10, with
 * ten Move Right 1, or with a Repeat of 5 around a Move Right 2, and a child
 * who found the third is not more wrong than one who found the first. So the
 * project is replayed and what happened on the stage is what gets checked.
 *
 * Every check is plain data — no functions anywhere in it — so the whole set
 * stays serialisable, for ZERO1 Studio later.
 */

// ── Vocabulary shared with the other chapters ───────────────────────────────

export type SjSeqMode =
  /** The observed list is exactly this list. */
  | "exact"
  /** These appear in this order; extras in between are allowed. */
  | "in-order"
  /** Each appears at least once, in any order. */
  | "contains-all";

export type SjCompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

/** "start" = before anything runs · "final" = at the end · "ever" = at any moment. */
export type SjWhen = "start" | "final" | "ever";

// ── Assertions ──────────────────────────────────────────────────────────────

interface SjAssertionBase {
  /** Flip the result: "this must NOT happen". */
  not?: boolean;
  /** The line a child reads when it fails. */
  message?: string;
}

/**
 * Sprites are addressed by the name the chooser gives them ("TIC", "Duck"), or
 * by id, so an assertion keeps working whichever copy a child added.
 */
export type SjAssertion = SjAssertionBase &
  (
    /** The sprite is standing on this square. */
    | { kind: "position"; sprite: string; x: number; y: number; when?: SjWhen }
    /** The sprite crossed these squares. */
    | {
        kind: "path";
        sprite: string;
        squares: { x: number; y: number }[];
        mode?: SjSeqMode;
      }
    /** How far the sprite travelled, in squares, along one axis. */
    | {
        kind: "travelled";
        sprite: string;
        axis: "x" | "y";
        op: SjCompareOp;
        value: number;
      }
    /** The sprite said this. */
    | { kind: "said"; sprite: string; text?: string; mode?: SjSeqMode; texts?: string[] }
    /**
     * One sprite spoke after another finished — a conversation rather than two
     * sprites talking over each other. This is what the Wait block is for, and
     * the only way to tell a dialogue from a chorus.
     */
    | { kind: "said-after"; sprite: string; after: string }
    /** The sprite's size at the end, as a percentage. */
    | { kind: "size"; sprite: string; op: SjCompareOp; value: number }
    /** Whether the sprite can be seen. */
    | { kind: "visible"; sprite: string; when?: SjWhen; value: boolean }
    /** How far round the sprite has turned, in twelfths. */
    | { kind: "turned"; sprite: string; op: SjCompareOp; value: number }
    /** A sound was heard. */
    | { kind: "sound"; sprite?: string; name?: string; times?: number; op?: SjCompareOp }
    /** The sprite ended where it began — what Go Home is for. */
    | { kind: "went-home"; sprite: string }
    /** Two sprites touched at some point during the run. */
    | { kind: "bumped"; sprite: string; into: string }
    /**
     * How long the run took, in steps. The way to check a Repeat actually
     * repeats: the same journey done twice takes about twice as long.
     */
    | { kind: "steps"; op: SjCompareOp; value: number }
    /** The run ended because a Stop block ran. */
    | { kind: "stopped-by-block" }
  );

export interface SjTrial {
  id: string;
  /** One line a teacher can read out: what is about to be tested. */
  label: string;
  /** What fires the scripts. The green flag, unless the lesson says otherwise. */
  start?: SjStart;
  /** Ceiling on simulated steps, for projects with a forever loop. */
  maxSteps?: number;
  /** Every assertion must hold for the trial to pass. */
  assert: SjAssertion[];
}

export interface SjExerciseCheck {
  /** One line a teacher can read out. */
  summary: string;
  trials: SjTrial[];
}

export interface SjExercise {
  id: string;
  lessonId: string;
  title: string;
  /** One sentence, in the book's own words where it has them. */
  brief: string;
  /** The stage as the child finds it: background, cast, and any given scripts. */
  project: SjProject;
  /** Drawers this task opens. All six when not given. */
  allowed?: SjCategory[];
  /**
   * A "where does it stop?" task rather than a "build it" one.
   *
   * Both books open their grid lessons this way: the script is already printed
   * on the page, the grid is switched on, and the child writes the square the
   * sprite finishes on. Here the script comes given in `project`, the blocks
   * are read-only, and the child taps the square. The answer is not stored —
   * it is whatever the given script actually does, so it cannot drift.
   */
  predict?: { sprite: string };
  /** The answer, for the teacher's key and for the check script. */
  worked: SjProject;
  check: SjExerciseCheck;
  /** Printed pages this comes from. */
  page?: string;
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface SjAssertionResult {
  assertion: SjAssertion;
  passed: boolean;
  /** What the run actually did, in words a child can read. */
  detail: string;
}

export interface SjTrialResult {
  trialId: string;
  label: string;
  passed: boolean;
  assertions: SjAssertionResult[];
}

export interface SjCheckResult {
  passed: boolean;
  trials: SjTrialResult[];
}

// ── Judging ─────────────────────────────────────────────────────────────────

const compare = (op: SjCompareOp, a: number, b: number): boolean => {
  switch (op) {
    case "=": return a === b;
    case "!=": return a !== b;
    case "<": return a < b;
    case "<=": return a <= b;
    case ">": return a > b;
    case ">=": return a >= b;
  }
};

/** Match a sprite by the name a child sees, or by id, case-insensitively. */
const findSprite = (run: SjRunRecord, who: string) =>
  run.sprites.find(
    (s) => s.id === who || s.name.toLowerCase() === who.toLowerCase(),
  );

const square = (p: { x: number; y: number }) => `(${p.x}, ${p.y})`;

/** Does a list contain the wanted items, in the requested way? */
function sequenceHolds<T>(
  observed: T[],
  wanted: T[],
  mode: SjSeqMode,
  same: (a: T, b: T) => boolean,
): boolean {
  if (mode === "exact") {
    return (
      observed.length === wanted.length &&
      wanted.every((w, i) => same(observed[i], w))
    );
  }
  if (mode === "contains-all") {
    return wanted.every((w) => observed.some((o) => same(o, w)));
  }
  let from = 0;
  for (const w of wanted) {
    const at = observed.findIndex((o, i) => i >= from && same(o, w));
    if (at === -1) return false;
    from = at + 1;
  }
  return true;
}

/**
 * The heart of it: did this assertion hold, and what did the run actually do?
 *
 * `observed` is written for a child and always says what was seen, never what
 * was expected — "the duck stopped at (4, 8)", not "expected (12, 8)". Being
 * told where you actually got to is a hint; being told the answer is not.
 */
function held(a: SjAssertion, run: SjRunRecord): { ok: boolean; observed: string } {
  switch (a.kind) {
    case "position": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      const when = a.when ?? "final";
      if (when === "ever") {
        const ok = s.path.some((p) => p.x === a.x && p.y === a.y);
        return {
          ok,
          observed: ok
            ? `${s.name} crossed ${square({ x: a.x, y: a.y })}`
            : `${s.name} went ${s.path.map(square).join(" → ")}`,
        };
      }
      const at = when === "start" ? s.path[0] : { x: s.finalX, y: s.finalY };
      return {
        ok: at.x === a.x && at.y === a.y,
        observed: `${s.name} ${when === "start" ? "started" : "stopped"} at ${square(at)}`,
      };
    }

    case "path": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      const ok = sequenceHolds(
        s.path,
        a.squares,
        a.mode ?? "in-order",
        (p, q) => p.x === q.x && p.y === q.y,
      );
      return { ok, observed: `${s.name} went ${s.path.map(square).join(" → ")}` };
    }

    case "travelled": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      const from = s.path[0];
      const moved =
        a.axis === "x" ? s.finalX - from.x : s.finalY - from.y;
      return {
        ok: compare(a.op, moved, a.value),
        observed: `${s.name} moved ${Math.abs(moved)} square${Math.abs(moved) === 1 ? "" : "s"} ${
          a.axis === "x"
            ? moved >= 0 ? "right" : "left"
            : moved >= 0 ? "down" : "up"
        }`,
      };
    }

    case "said": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      const said = s.said;
      const wanted = a.texts ?? (a.text !== undefined ? [a.text] : []);
      const ok = wanted.length
        ? sequenceHolds(
            said.map((u) => u.text),
            wanted,
            a.mode ?? "in-order",
            (o, w) => o.trim().toLowerCase() === w.trim().toLowerCase(),
          )
        : said.length > 0;
      return {
        ok,
        observed: said.length
          ? `${s.name} said ${said.map((u) => `"${u.text}"`).join(", then ")}`
          : `${s.name} did not say anything`,
      };
    }

    case "said-after": {
      const s = findSprite(run, a.sprite);
      const first = findSprite(run, a.after);
      if (!s || !first) {
        return { ok: false, observed: "one of those characters is not on the stage" };
      }
      if (!s.said.length) return { ok: false, observed: `${s.name} did not say anything` };
      if (!first.said.length) {
        return { ok: false, observed: `${first.name} did not say anything` };
      }
      // The second speaker must begin after the first has begun — otherwise
      // both bubbles are up at once and it is a chorus, not a conversation.
      const replied = s.said[0].at;
      const opened = first.said[0].at;
      return {
        ok: replied > opened,
        observed:
          replied > opened
            ? `${first.name} spoke first, then ${s.name} answered`
            : `${s.name} spoke at the same time as ${first.name}`,
      };
    }

    case "size": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      return {
        ok: compare(a.op, s.finalSize, a.value),
        observed: `${s.name} ended at ${s.finalSize}% of its size`,
      };
    }

    case "visible": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      return {
        ok: s.finalVisible === a.value,
        observed: `${s.name} ${s.finalVisible ? "can be seen" : "is hidden"} at the end`,
      };
    }

    case "turned": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      return {
        ok: compare(a.op, s.finalTurn, a.value),
        observed: `${s.name} turned ${s.finalTurn} twelfth${s.finalTurn === 1 ? "" : "s"} of the way round`,
      };
    }

    case "sound": {
      const heard = run.sounds.filter((s) => {
        const [sprite, name] = s.split(":");
        return (
          (!a.sprite || sprite === a.sprite || findSprite(run, a.sprite)?.id === sprite) &&
          (!a.name || name === a.name)
        );
      });
      const ok = a.times !== undefined
        ? compare(a.op ?? "=", heard.length, a.times)
        : heard.length > 0;
      return {
        ok,
        observed: heard.length
          ? `${heard.length} sound${heard.length === 1 ? "" : "s"} played`
          : "no sound played",
      };
    }

    case "went-home": {
      const s = findSprite(run, a.sprite);
      if (!s) return { ok: false, observed: `there is no ${a.sprite} on the stage` };
      const from = s.path[0];
      const ok = s.finalX === from.x && s.finalY === from.y;
      return {
        ok,
        observed: ok
          ? `${s.name} came back to ${square(from)}`
          : `${s.name} started at ${square(from)} and stopped at ${square({ x: s.finalX, y: s.finalY })}`,
      };
    }

    case "bumped": {
      const s = findSprite(run, a.sprite);
      const other = findSprite(run, a.into);
      if (!s || !other) {
        return { ok: false, observed: "one of those characters is not on the stage" };
      }
      // Same rule the engine bumps by, applied to the recorded paths.
      const steps = Math.min(s.path.length, other.path.length);
      let ok = false;
      for (let i = 0; i < steps; i++) {
        if (
          Math.abs(s.path[i].x - other.path[i].x) < 2 &&
          Math.abs(s.path[i].y - other.path[i].y) < 2
        ) {
          ok = true;
          break;
        }
      }
      return {
        ok,
        observed: ok
          ? `${s.name} bumped into ${other.name}`
          : `${s.name} and ${other.name} never touched`,
      };
    }

    case "steps":
      return {
        ok: compare(a.op, run.steps, a.value),
        observed: `the run took ${run.steps} steps`,
      };

    case "stopped-by-block":
      return {
        ok: run.stoppedBy === "stop-block",
        observed:
          run.stoppedBy === "stop-block"
            ? "a Stop block ended the run"
            : `the run ended on its own (${run.stoppedBy})`,
      };
  }
}

const evaluate = (a: SjAssertion, run: SjRunRecord): SjAssertionResult => {
  const { ok, observed } = held(a, run);
  const passed = a.not ? !ok : ok;
  return {
    assertion: a,
    passed,
    detail: passed || !a.message ? observed : `${a.message} — ${observed}`,
  };
};

export function checkTrial(trial: SjTrial, run: SjRunRecord): SjTrialResult {
  const assertions = trial.assert.map((a) => evaluate(a, run));
  return {
    trialId: trial.id,
    label: trial.label,
    passed: assertions.every((r) => r.passed),
    assertions,
  };
}

/** Replay a child's project through every trial and judge the result. */
export function checkExercise(
  exercise: SjExercise,
  project: SjProject,
): SjCheckResult {
  const trials = exercise.check.trials.map((trial) => {
    const run = recordRun(
      runProject(project, trial.start ?? { kind: "flag" }, trial.maxSteps),
    );
    return checkTrial(trial, run);
  });
  return { passed: trials.every((t) => t.passed), trials };
}
