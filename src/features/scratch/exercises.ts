/**
 * The book's own Scratch projects, turned into buildable challenges.
 *
 * Every exercise below comes from a printed page of Grade 6 · Chapter 5
 * "Scratch 3.0" — same project, same wording, same numbers: the story's two
 * backdrops and its two sentences, the documentary's 20 seconds per backdrop,
 * the animation's 6 seconds per sprite and its `next costume` loop, the game's
 * `go to x: (mouse x) y: 0`, its ball at x = 19 y = 33 pointing in direction 45,
 * its Count variable and its "You are a winner" message, and the four shapes of
 * Lesson 7 drawn with the Pen and the Repeat blocks. Nothing here was invented.
 *
 * A challenge is checked on the RUN, never on the block arrangement. The
 * student's project is replayed once per `ScTrial` (a length of time plus a
 * timeline of mouse moves, key presses and clicks), the simulator hands back an
 * `ScRunRecord`, and `checkRun()` reads that record. The book's projects each
 * have many correct solutions and the book only ever cares about what happens
 * on the stage.
 *
 * Every check is plain data — no functions anywhere in it — so the whole set
 * stays serialisable for Studio later.
 */

import {
  analysePenShapes,
  penColoursUsed,
  simulateTrial,
  type ScRunRecord,
  type ScStimulus,
  type ScTrialInput,
} from "./scratch-engine";
import {
  buildProject,
  setSpriteScripts,
  setStageScripts,
  type ScCategory,
  type ScColourName,
  type ScCond,
  type ScExpr,
  type ScHat,
  type ScProject,
  type ScStatement,
} from "./scratch-model";

// ── How a check is expressed ────────────────────────────────────────────────

export type ScSeqMode =
  /** The observed list is exactly this list. */
  | "exact"
  /** These items appear in this order; extras in between are allowed. */
  | "in-order"
  /** Each item appears at least once, in any order. */
  | "contains-all";

export type ScCompareOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

/** "start" = as the project begins · "final" = at the end · "ever" = at any moment. */
export type ScWhen = "start" | "final" | "ever";

interface ScAssertionBase {
  /** Flip the result: "this must NOT happen". */
  not?: boolean;
  /** Student-facing line, shown when the assertion fails. */
  message?: string;
}

/**
 * Sprites are named the way the tray names them ("Cat", "Parrot", "Ball"), and
 * matched on the name or the id, so an assertion keeps working whichever copy
 * of a library sprite the student dragged in.
 */
export type ScAssertion = ScAssertionBase &
  (
    | { kind: "backdrop-list"; mode: ScSeqMode; names: string[] }
    | { kind: "backdrop-count"; min: number }
    | { kind: "backdrop-at"; atMs: number; name: string }
    | { kind: "backdrop-sequence"; mode: ScSeqMode; names: string[] }
    /** The backdrop stayed on screen this long without changing. */
    | { kind: "backdrop-held"; name: string; minMs: number; maxMs?: number }
    /** Every backdrop but the last lasted about this long. */
    | { kind: "backdrop-changes-every"; ms: number; tolerance: number; atLeast: number }
    | { kind: "sprite-present"; sprite: string }
    | { kind: "said"; sprite?: string; text: string }
    | { kind: "said-order"; sprite?: string; texts: string[] }
    /** This was in the speech bubble at that moment. */
    | { kind: "said-at"; atMs: number; sprite?: string; text: string }
    /** The sentence started somewhere inside this window. */
    | { kind: "said-window"; sprite?: string; text: string; fromMs: number; toMs: number }
    | { kind: "said-while-backdrop"; backdrop: string; sprite?: string; text: string }
    | { kind: "visible-at"; atMs: number; sprite: string; value: boolean }
    /** At that moment this sprite is the only one on the stage. */
    | { kind: "only-visible-at"; atMs: number; sprite: string }
    | { kind: "costume-count"; sprite: string; min: number }
    | { kind: "costume-changes"; sprite: string; min: number; max?: number }
    | {
        kind: "position";
        sprite: string;
        when: ScWhen;
        x?: number;
        y?: number;
        tolerance: number;
      }
    | {
        kind: "direction";
        sprite: string;
        when: ScWhen;
        oneOf: number[];
        tolerance: number;
      }
    | { kind: "moved"; sprite: string; minDistance: number; during?: "sound" }
    | { kind: "follows-mouse"; sprite: string; axis: "x" | "y"; maxError: number }
    | { kind: "stayed-on-stage"; sprite: string }
    | { kind: "turned-after-touch"; sprite: string; other: string; withinMs: number }
    | { kind: "touched-colour"; sprite: string; colour: ScColourName }
    | { kind: "run-stopped" }
    | { kind: "sound-played"; sprite?: string; sound?: string }
    | {
        kind: "variable-value";
        name: string;
        op: ScCompareOp;
        value: number;
        when: ScWhen;
      }
    | { kind: "variable-sequence"; name: string; mode: ScSeqMode; values: number[] }
    /** The score went up once per hit — not once per frame the two were touching. */
    | {
        kind: "counts-touches";
        name: string;
        sprite: string;
        other: string;
        tolerance: number;
      }
    | {
        kind: "pen-shapes";
        sides: number;
        min?: number;
        max?: number;
        equalSides?: boolean;
        starts?: "same" | "different";
      }
    | { kind: "pen-colours"; min: number }
    | { kind: "pen-drew" }
  );

export interface ScTrial extends ScTrialInput {
  /** Every assertion must hold for the trial to pass. */
  assert: ScAssertion[];
}

export interface ScExerciseCheck {
  /** One line a teacher can read out: what the platform is about to test. */
  summary: string;
  trials: ScTrial[];
}

export interface ScExercise {
  id: string; // e.g. "g6-c5-l2-backdrop-time-frame"
  lessonId: string; // g6-sc-02
  title: string; // the book's own project name
  brief: string; // what the book asks for, in the book's terms
  /** The project the student starts from — backdrops, sprites and any script
   *  the book has already built on the page. */
  starter: ScProject;
  /** Which target the editor opens on: "stage" or a sprite id. */
  focus: string;
  /** Palette drawers on offer — keeps early lessons uncluttered. */
  allowed: ScCategory[];
  hints: string[]; // progressive, never giving the answer first
  check: ScExerciseCheck;
  solution: ScProject; // a worked answer, revealed only after real attempts
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface ScAssertionResult {
  assertion: ScAssertion;
  passed: boolean;
  /** What the run actually did, in words the student can read. */
  detail: string;
}

export interface ScTrialResult {
  trialId: string;
  label: string;
  passed: boolean;
  assertions: ScAssertionResult[];
}

export interface ScCheckResult {
  passed: boolean;
  trials: ScTrialResult[];
}

// ── Reading a recording ─────────────────────────────────────────────────────

const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");
const mentions = (haystack: string, needle: string): boolean =>
  norm(haystack).includes(norm(needle));

const compare = (op: ScCompareOp, left: number, right: number): boolean => {
  switch (op) {
    case "=":
      return Math.abs(left - right) < 1e-9;
    case "!=":
      return Math.abs(left - right) >= 1e-9;
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
  mode: ScSeqMode,
): boolean {
  if (mode === "exact") {
    return expect.length === actual.length && expect.every((e, i) => eq(e, actual[i]));
  }
  if (mode === "contains-all") {
    return expect.every((e) => actual.some((a) => eq(e, a)));
  }
  let i = 0;
  for (const item of actual) {
    if (i < expect.length && eq(expect[i], item)) i += 1;
  }
  return i === expect.length;
}

interface Segment {
  name: string;
  from: number;
  to: number;
}

/** The backdrop timeline as segments, with repeats of the same backdrop merged. */
function backdropSegments(run: ScRunRecord): Segment[] {
  const out: Segment[] = [];
  for (const event of run.backdrops) {
    const last = out[out.length - 1];
    if (last && last.name === event.name) continue;
    if (last) last.to = event.at;
    out.push({ name: event.name, from: event.at, to: run.durationMs });
  }
  return out;
}

const backdropAt = (run: ScRunRecord, at: number): string | null => {
  const segments = backdropSegments(run);
  let found: string | null = null;
  for (const segment of segments) {
    if (segment.from <= at) found = segment.name;
  }
  return found;
};

/** Sprite id for a name, an id, or nothing at all. */
function resolveSprite(run: ScRunRecord, ref: string): string | undefined {
  const wanted = norm(ref);
  return run.spriteInfo.find(
    (s) => norm(s.id) === wanted || norm(s.name) === wanted,
  )?.id;
}

const spriteLabel = (run: ScRunRecord, id: string): string =>
  run.spriteInfo.find((s) => s.id === id)?.name ?? id;

/** Speech events with the moment each bubble actually disappeared. */
function bubbles(
  run: ScRunRecord,
  sprite?: string,
): { at: number; until: number; sprite: string; text: string }[] {
  const id = sprite ? resolveSprite(run, sprite) : undefined;
  const list = run.says.filter((s) => !id || s.sprite === id);
  return list.map((say, index) => {
    const next = list.find((other, i) => i > index && other.sprite === say.sprite);
    return {
      at: say.at,
      until: Math.min(say.endsAt, next ? next.at : Number.POSITIVE_INFINITY),
      sprite: say.sprite,
      text: say.text,
    };
  });
}

const visibleAt = (run: ScRunRecord, spriteId: string, at: number): boolean => {
  let value = false;
  for (const event of run.visibility) {
    if (event.sprite === spriteId && event.at <= at) value = event.visible;
  }
  return value;
};

const posesOf = (run: ScRunRecord, spriteId: string) =>
  run.poses.filter((p) => p.sprite === spriteId);

const pathLength = (poses: { x: number; y: number }[]): number => {
  let total = 0;
  for (let i = 1; i < poses.length; i += 1) {
    total += Math.hypot(poses[i].x - poses[i - 1].x, poses[i].y - poses[i - 1].y);
  }
  return total;
};

/** The values a variable held, in order, with consecutive repeats collapsed. */
function seriesOf(run: ScRunRecord, name: string): number[] {
  const out: number[] = [];
  for (const sample of run.variables) {
    if (sample.name !== name) continue;
    if (out.length === 0 || out[out.length - 1] !== sample.value) out.push(sample.value);
  }
  return out;
}

const wrap180 = (d: number): number => {
  let value = (((d + 180) % 360) + 360) % 360;
  value -= 180;
  return value;
};

// ── The check engine ────────────────────────────────────────────────────────

function held(a: ScAssertion, run: ScRunRecord): { ok: boolean; observed: string } {
  switch (a.kind) {
    case "backdrop-list": {
      const names = run.backdropNames;
      return {
        ok: matchSequence(a.names, names, (e, n) => norm(e) === norm(n), a.mode),
        observed: `the Stage holds ${names.length} backdrop(s): ${names.join(", ")}`,
      };
    }
    case "backdrop-count":
      return {
        ok: run.backdropNames.length >= a.min,
        observed: `the Stage holds ${run.backdropNames.length} backdrop(s)`,
      };
    case "backdrop-at": {
      const showing = backdropAt(run, a.atMs);
      return {
        ok: showing !== null && norm(showing) === norm(a.name),
        observed: `after ${(a.atMs / 1000).toFixed(0)} seconds the stage was showing ${
          showing ?? "nothing"
        }`,
      };
    }
    case "backdrop-sequence": {
      const names = backdropSegments(run).map((s) => s.name);
      return {
        ok: matchSequence(a.names, names, (e, n) => norm(e) === norm(n), a.mode),
        observed: names.length
          ? `the backdrops came up in this order: ${names.join(" → ")}`
          : "the backdrop never changed",
      };
    }
    case "backdrop-held": {
      const segment = backdropSegments(run).find((s) => norm(s.name) === norm(a.name));
      if (!segment) {
        return { ok: false, observed: `${a.name} was never displayed` };
      }
      const span = segment.to - segment.from;
      return {
        ok: span >= a.minMs && (a.maxMs === undefined || span <= a.maxMs),
        observed: `${a.name} stayed on screen for ${(span / 1000).toFixed(1)} seconds`,
      };
    }
    case "backdrop-changes-every": {
      const segments = backdropSegments(run);
      const timed = segments.slice(0, -1);
      const ok =
        segments.length >= a.atLeast &&
        timed.length > 0 &&
        timed.every((s) => Math.abs(s.to - s.from - a.ms) <= a.tolerance);
      return {
        ok,
        observed: timed.length
          ? `the backdrops lasted ${timed
              .map((s) => `${((s.to - s.from) / 1000).toFixed(0)}s`)
              .join(", ")} (${segments.length} in all)`
          : "the backdrop never changed",
      };
    }
    case "sprite-present": {
      const id = resolveSprite(run, a.sprite);
      return {
        ok: id !== undefined,
        observed: run.spriteInfo.length
          ? `the project has these sprites: ${run.spriteInfo.map((s) => s.name).join(", ")}`
          : "the project has no sprites",
      };
    }
    case "said": {
      const said = bubbles(run, a.sprite);
      return {
        ok: said.some((s) => mentions(s.text, a.text)),
        observed: said.length
          ? `what was said: ${said.map((s) => `“${s.text}”`).join(" · ")}`
          : "nobody said anything",
      };
    }
    case "said-order": {
      const said = bubbles(run, a.sprite);
      return {
        ok: matchSequence(a.texts, said, (e, s) => mentions(s.text, e), "in-order"),
        observed: said.length
          ? `what was said, in order: ${said.map((s) => `“${s.text}”`).join(" → ")}`
          : "nobody said anything",
      };
    }
    case "said-at": {
      const showing = bubbles(run, a.sprite).filter(
        (s) => s.at <= a.atMs && a.atMs < s.until,
      );
      return {
        ok: showing.some((s) => mentions(s.text, a.text)),
        observed: showing.length
          ? `after ${(a.atMs / 1000).toFixed(0)} seconds the bubble said “${showing[0].text}”`
          : `after ${(a.atMs / 1000).toFixed(0)} seconds there was no speech bubble`,
      };
    }
    case "said-window": {
      const said = bubbles(run, a.sprite).filter((s) => mentions(s.text, a.text));
      return {
        ok: said.some((s) => s.at >= a.fromMs && s.at <= a.toMs),
        observed: said.length
          ? `“${said[0].text}” was said after ${(said[0].at / 1000).toFixed(1)} seconds`
          : "that sentence was never said",
      };
    }
    case "said-while-backdrop": {
      const said = bubbles(run, a.sprite).filter((s) => mentions(s.text, a.text));
      const ok = said.some((s) => {
        const end = Number.isFinite(s.until) ? s.until : s.at + 1;
        const probes = [s.at, (s.at + end) / 2, Math.max(s.at, end - 1)];
        return probes.some((t) => {
          const showing = backdropAt(run, t);
          return showing !== null && norm(showing) === norm(a.backdrop);
        });
      });
      return {
        ok,
        observed: said.length
          ? `“${said[0].text}” was said while the stage showed ${
              backdropAt(run, said[0].at) ?? "nothing"
            }`
          : "that sentence was never said",
      };
    }
    case "visible-at": {
      const id = resolveSprite(run, a.sprite);
      if (!id) return { ok: false, observed: `there is no sprite called ${a.sprite}` };
      const showing = visibleAt(run, id, a.atMs);
      return {
        ok: showing === a.value,
        observed: `after ${(a.atMs / 1000).toFixed(0)} seconds ${spriteLabel(run, id)} was ${
          showing ? "on the stage" : "hidden"
        }`,
      };
    }
    case "only-visible-at": {
      const id = resolveSprite(run, a.sprite);
      if (!id) return { ok: false, observed: `there is no sprite called ${a.sprite}` };
      const onStage = run.spriteInfo
        .filter((s) => visibleAt(run, s.id, a.atMs))
        .map((s) => s.name);
      return {
        ok: onStage.length === 1 && onStage[0] === spriteLabel(run, id),
        observed: onStage.length
          ? `after ${(a.atMs / 1000).toFixed(0)} seconds the stage showed ${onStage.join(", ")}`
          : `after ${(a.atMs / 1000).toFixed(0)} seconds the stage was empty`,
      };
    }
    case "costume-count": {
      const id = resolveSprite(run, a.sprite);
      const info = run.spriteInfo.find((s) => s.id === id);
      return {
        ok: (info?.costumes ?? 0) >= a.min,
        observed: info
          ? `${info.name} has ${info.costumes} costume(s)`
          : `there is no sprite called ${a.sprite}`,
      };
    }
    case "costume-changes": {
      const id = resolveSprite(run, a.sprite);
      const changes = run.costumes.filter((c) => c.sprite === id).length;
      return {
        ok: changes >= a.min && (a.max === undefined || changes <= a.max),
        observed: `the costume changed ${changes} time(s) during the run`,
      };
    }
    case "position": {
      const id = resolveSprite(run, a.sprite);
      const poses = id ? posesOf(run, id) : [];
      if (poses.length === 0) return { ok: false, observed: "that sprite never appeared" };
      const near = (p: { x: number; y: number }) =>
        (a.x === undefined || Math.abs(p.x - a.x) <= a.tolerance) &&
        (a.y === undefined || Math.abs(p.y - a.y) <= a.tolerance);
      const chosen =
        a.when === "start" ? [poses[0]] : a.when === "final" ? [poses[poses.length - 1]] : poses;
      const last = poses[poses.length - 1];
      return {
        ok: chosen.some(near),
        observed: `it finished at x ${Math.round(last.x)}, y ${Math.round(last.y)}`,
      };
    }
    case "direction": {
      const id = resolveSprite(run, a.sprite);
      const poses = id ? posesOf(run, id) : [];
      if (poses.length === 0) return { ok: false, observed: "that sprite never appeared" };
      const matches = (p: { direction: number }) =>
        a.oneOf.some((d) => Math.abs(wrap180(p.direction - d)) <= a.tolerance);
      const chosen =
        a.when === "start" ? [poses[0]] : a.when === "final" ? [poses[poses.length - 1]] : poses;
      return {
        ok: chosen.some(matches),
        observed: `it started off pointing in direction ${Math.round(poses[0].direction)}`,
      };
    }
    case "moved": {
      const id = resolveSprite(run, a.sprite);
      let poses = id ? posesOf(run, id) : [];
      if (a.during === "sound") {
        const sound = run.sounds.find((s) => !id || s.sprite === id);
        if (!sound) return { ok: false, observed: "no sound was played" };
        poses = poses.filter((p) => p.at >= sound.at && p.at <= sound.endsAt);
      }
      const travelled = pathLength(poses);
      return {
        ok: travelled >= a.minDistance,
        observed: `it travelled about ${Math.round(travelled)} steps${
          a.during === "sound" ? " while the sound was playing" : ""
        }`,
      };
    }
    case "follows-mouse": {
      const id = resolveSprite(run, a.sprite);
      const poses = id ? posesOf(run, id).filter((p) => p.at >= 400) : [];
      if (poses.length === 0) return { ok: false, observed: "that sprite never appeared" };
      let good = 0;
      let worst = 0;
      for (const pose of poses) {
        const mouse = run.mouse.find((m) => m.at === pose.at);
        if (!mouse) continue;
        const error = Math.abs(a.axis === "x" ? pose.x - mouse.x : pose.y - mouse.y);
        worst = Math.max(worst, error);
        if (error <= a.maxError) good += 1;
      }
      return {
        ok: good >= poses.length * 0.85,
        observed: `it was up to ${Math.round(worst)} steps away from the mouse pointer`,
      };
    }
    case "stayed-on-stage": {
      const id = resolveSprite(run, a.sprite);
      const poses = id ? posesOf(run, id) : [];
      const sprite = run.finalSprites.find((s) => s.id === id);
      if (!sprite || poses.length === 0) {
        return { ok: false, observed: "that sprite never appeared" };
      }
      const halfW = (sprite.width * sprite.size) / 200;
      const halfH = (sprite.height * sprite.size) / 200;
      // A sprite that bounces pokes past the edge for a frame or two before it
      // turns back; a sprite with no bounce block parks there and never leaves.
      const outside = (p: { x: number; y: number }) =>
        Math.abs(p.x) + halfW > 241 || Math.abs(p.y) + halfH > 181;
      let streak = 0;
      let worst = 0;
      let stuckAt: { x: number; y: number } | null = null;
      for (const pose of poses) {
        if (outside(pose)) {
          streak += 1;
          if (streak > worst) {
            worst = streak;
            stuckAt = pose;
          }
        } else {
          streak = 0;
        }
      }
      const stuck = worst * 100 > 500;
      return {
        ok: !stuck,
        observed: stuck && stuckAt
          ? `it ran into the edge of the stage and stayed there (x ${Math.round(
              stuckAt.x,
            )}, y ${Math.round(stuckAt.y)})`
          : "it kept coming back from the edges of the stage",
      };
    }
    case "turned-after-touch": {
      const id = resolveSprite(run, a.sprite);
      const otherId = resolveSprite(run, a.other);
      const poses = id ? posesOf(run, id) : [];
      const hits = run.touches.filter((t) => t.sprite === id && t.other === otherId);
      const turned = hits.filter((hit) => {
        const before = [...poses].reverse().find((p) => p.at <= hit.at);
        const after = poses.find((p) => p.at >= hit.at + a.withinMs);
        if (!before || !after) return false;
        return Math.abs(wrap180(after.direction - before.direction)) > 10;
      });
      return {
        ok: turned.length > 0,
        observed: hits.length
          ? `the two sprites met ${hits.length} time(s) and the ball changed direction ${turned.length} of those times`
          : "the ball and the bar never met in this trial",
      };
    }
    case "touched-colour": {
      const id = resolveSprite(run, a.sprite);
      const hits = run.colourTouches.filter((t) => t.sprite === id && t.colour === a.colour);
      return {
        ok: hits.length > 0,
        observed: hits.length
          ? `it reached the ${a.colour} part of the backdrop after ${(
              hits[0].at / 1000
            ).toFixed(1)} seconds`
          : `it never reached the ${a.colour} part of the backdrop`,
      };
    }
    case "run-stopped":
      return {
        ok: run.stoppedAt !== null,
        observed:
          run.stoppedAt !== null
            ? `everything stopped after ${(run.stoppedAt / 1000).toFixed(1)} seconds`
            : "the project kept running to the end of the test",
      };
    case "sound-played": {
      const id = a.sprite ? resolveSprite(run, a.sprite) : undefined;
      const played = run.sounds.filter(
        (s) => (!id || s.sprite === id) && (!a.sound || norm(s.sound) === norm(a.sound)),
      );
      return {
        ok: played.length > 0,
        observed: run.sounds.length
          ? `the sounds played were: ${run.sounds.map((s) => s.sound).join(", ")}`
          : "no sound was played",
      };
    }
    case "variable-value": {
      const series = seriesOf(run, a.name);
      if (series.length === 0) {
        return { ok: false, observed: `the variable ${a.name} was never used` };
      }
      const value =
        a.when === "final"
          ? run.finalVariables[a.name] ?? series[series.length - 1]
          : series[0];
      const ok =
        a.when === "ever"
          ? series.some((v) => compare(a.op, v, a.value))
          : compare(a.op, value, a.value);
      return {
        ok,
        observed: `${a.name} went ${series.slice(0, 8).join(", ")}${
          series.length > 8 ? "…" : ""
        } and ended at ${run.finalVariables[a.name] ?? series[series.length - 1]}`,
      };
    }
    case "variable-sequence": {
      const series = seriesOf(run, a.name);
      return {
        ok: matchSequence(a.values, series, (e, v) => e === v, a.mode),
        observed: series.length
          ? `${a.name} took the values ${series.slice(0, 10).join(", ")}${
              series.length > 10 ? "…" : ""
            }`
          : `the variable ${a.name} was never used`,
      };
    }
    case "counts-touches": {
      const id = resolveSprite(run, a.sprite);
      const otherId = resolveSprite(run, a.other);
      const hits = run.touches.filter(
        (t) => t.sprite === id && t.other === otherId,
      ).length;
      const series = seriesOf(run, a.name);
      if (series.length === 0) {
        return { ok: false, observed: `the variable ${a.name} was never used` };
      }
      const score = run.finalVariables[a.name] ?? series[series.length - 1];
      return {
        ok: hits > 0 && Math.abs(score - hits) <= a.tolerance,
        observed: `the ball hit the bar ${hits} time(s) and the score reached ${score}`,
      };
    }
    case "pen-shapes": {
      const shapes = analysePenShapes(run.pen).filter((s) => s.sides === a.sides);
      const good = a.equalSides ? shapes.filter((s) => s.equalSides) : shapes;
      let ok = true;
      if (a.min !== undefined && good.length < a.min) ok = false;
      if (a.max !== undefined && good.length > a.max) ok = false;
      if (ok && a.starts && good.length > 1) {
        const same = good.every(
          (s) => Math.hypot(s.start.x - good[0].start.x, s.start.y - good[0].start.y) < 6,
        );
        const allDifferent = good.every((s, i) =>
          good.every(
            (o, j) => i === j || Math.hypot(s.start.x - o.start.x, s.start.y - o.start.y) > 6,
          ),
        );
        ok = a.starts === "same" ? same : allDifferent;
      }
      const word = a.sides === 3 ? "triangle" : a.sides === 4 ? "square" : `${a.sides}-sided shape`;
      return {
        ok,
        observed: `the pen drew ${good.length} ${word}${good.length === 1 ? "" : "s"}${
          good.length > 0 ? ` (about ${Math.round(good[0].sideLengths[0])} steps a side)` : ""
        }`,
      };
    }
    case "pen-colours": {
      const colours = penColoursUsed(run.pen);
      return {
        ok: colours.length >= a.min,
        observed: `the drawing used ${colours.length} pen colour(s)`,
      };
    }
    case "pen-drew":
      return {
        ok: run.pen.length > 0,
        observed: run.pen.length
          ? `the pen drew ${run.pen.length} line(s)`
          : "the pen never drew anything",
      };
  }
}

const evaluate = (a: ScAssertion, run: ScRunRecord): ScAssertionResult => {
  const { ok, observed } = held(a, run);
  const passed = a.not ? !ok : ok;
  return {
    assertion: a,
    passed,
    detail: passed || !a.message ? observed : `${a.message} — ${observed}`,
  };
};

/** Run every assertion of one trial against its recording. */
export function checkTrial(trial: ScTrial, run: ScRunRecord): ScTrialResult {
  const assertions = trial.assert.map((a) => evaluate(a, run));
  return {
    trialId: trial.id,
    label: trial.label,
    passed: assertions.every((r) => r.passed),
    assertions,
  };
}

/** Interpret a check against recordings of its trials, matched by trial id. */
export function checkRun(
  check: ScExerciseCheck,
  runs: readonly ScRunRecord[],
): ScCheckResult {
  const byId = new Map(runs.map((r) => [r.trialId, r] as const));
  const trials = check.trials.map((trial) => {
    const run = byId.get(trial.id);
    if (!run) {
      return {
        trialId: trial.id,
        label: trial.label,
        passed: false,
        assertions: [],
      };
    }
    return checkTrial(trial, run);
  });
  return { passed: trials.every((t) => t.passed), trials };
}

/** Replay the student's project through every trial and judge the result. */
export function checkExercise(
  exercise: ScExercise,
  project: ScProject,
): ScCheckResult {
  const runs = exercise.check.trials.map((trial) => simulateTrial(project, trial));
  return checkRun(exercise.check, runs);
}

// ── Small builders (they only ever produce plain data) ───────────────────────

const ids = (prefix: string) => {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
};

const num = (value: number): ScExpr => ({ kind: "num", value });
const vr = (name: string): ScExpr => ({ kind: "var", name });
const MOUSE_X: ScExpr = { kind: "mouse-x" };

const flag = (id: string, body: ScStatement[]): ScHat => ({
  id,
  kind: "when-flag",
  body,
});

const move = (id: string, steps: number): ScStatement => ({
  id,
  kind: "move",
  steps: num(steps),
});
const turn = (id: string, way: "cw" | "ccw", degrees: number): ScStatement => ({
  id,
  kind: "turn",
  way,
  degrees: num(degrees),
});
const goTo = (id: string, x: ScExpr, y: ScExpr): ScStatement => ({
  id,
  kind: "goto-xy",
  x,
  y,
});
const pointIn = (id: string, degrees: number): ScStatement => ({
  id,
  kind: "point-in-direction",
  degrees: num(degrees),
});
const bounce = (id: string): ScStatement => ({ id, kind: "if-on-edge-bounce" });
const sayFor = (id: string, text: string, secs: number): ScStatement => ({
  id,
  kind: "say",
  text,
  secs,
});
const switchBackdrop = (id: string, backdrop: string): ScStatement => ({
  id,
  kind: "switch-backdrop",
  backdrop,
});
const nextCostume = (id: string): ScStatement => ({ id, kind: "next-costume" });
const show = (id: string): ScStatement => ({ id, kind: "show" });
const hide = (id: string): ScStatement => ({ id, kind: "hide" });
const playSound = (id: string, sound: string, untilDone = true): ScStatement => ({
  id,
  kind: "play-sound",
  sound,
  untilDone,
});
const waitSecs = (id: string, secs: number): ScStatement => ({ id, kind: "wait", secs });
const repeat = (id: string, times: number, body: ScStatement[]): ScStatement => ({
  id,
  kind: "repeat",
  times: num(times),
  body,
});
const forever = (id: string, body: ScStatement[]): ScStatement => ({
  id,
  kind: "forever",
  body,
});
const ifThen = (id: string, cond: ScCond, then: ScStatement[]): ScStatement => ({
  id,
  kind: "if",
  cond,
  then,
});
const stopAll = (id: string): ScStatement => ({ id, kind: "stop-all" });
const setVar = (id: string, name: string, value: number): ScStatement => ({
  id,
  kind: "set-var",
  name,
  value: num(value),
});
const changeVar = (id: string, name: string, by: number): ScStatement => ({
  id,
  kind: "change-var",
  name,
  by: num(by),
});
const penDown = (id: string): ScStatement => ({ id, kind: "pen-down" });
const penUp = (id: string): ScStatement => ({ id, kind: "pen-up" });
const eraseAll = (id: string): ScStatement => ({ id, kind: "erase-all" });
const setPenColour = (id: string, colour: number): ScStatement => ({
  id,
  kind: "set-pen-colour",
  colour,
});
const changePenColour = (id: string, by: number): ScStatement => ({
  id,
  kind: "change-pen-colour",
  by: num(by),
});

const touching = (sprite: string): ScCond => ({ kind: "touching-sprite", sprite });
const touchingColour = (colour: ScColourName): ScCond => ({
  kind: "touching-colour",
  colour,
});
const varEquals = (name: string, value: number): ScCond => ({
  kind: "compare",
  op: "=",
  left: vr(name),
  right: num(value),
});

/** The mouse walks a little path — how the bar gets tested in Lesson 5. */
const mouseWalk = (points: [number, number, number][]): ScStimulus[] =>
  points.map(([at, x, y]) => ({ at, kind: "mouse" as const, x, y }));

// ── The book's projects ─────────────────────────────────────────────────────

const CAT_MORNING =
  "Good morning, today is a nice weather for a walk in the desert";
const CAT_BOTTLE = "ahhhh, I forgot the bottle of water at home";
const PARROT_LINE = "No worries, I will get you the bottle";

/** Backdrops Bedroom 3 + Desert, with the Cat where the story starts. */
const storyProject = (): ScProject =>
  buildProject({
    backdrops: ["bedroom", "desert"],
    sprites: [{ template: "cat", overrides: { x: -60, y: -70 } }],
  });

/** The Stage script of Lesson 2, which every later story exercise starts from. */
const storyStageScript = (prefix: string): ScHat[] => {
  const k = ids(prefix);
  return [
    flag(k(), [
      switchBackdrop(k(), "Bedroom 3"),
      waitSecs(k(), 10),
      switchBackdrop(k(), "Desert"),
    ]),
  ];
};

const catStoryScript = (prefix: string): ScHat[] => {
  const k = ids(prefix);
  return [
    flag(k(), [sayFor(k(), CAT_MORNING, 10), sayFor(k(), CAT_BOTTLE, 10)]),
  ];
};

/** Blue Sky with its red line, the Ball at the book's x = 19 y = 33, and the bar. */
const gameProject = (): ScProject =>
  buildProject({
    backdrops: ["blue-sky"],
    sprites: [
      { template: "ball", overrides: { x: 19, y: 33 } },
      { template: "bar", overrides: { x: 0, y: 0 } },
    ],
  });

const barScript = (prefix: string): ScHat[] => {
  const k = ids(prefix);
  return [flag(k(), [forever(k(), [goTo(k(), MOUSE_X, num(0))])])];
};

/** Step 4 of the game: the ball's own script, printed on page 72. */
const ballScript = (prefix: string): ScHat => {
  const k = ids(prefix);
  return flag(k(), [
    goTo(k(), num(19), num(33)),
    pointIn(k(), 45),
    forever(k(), [
      bounce(k()),
      move(k(), 5),
      ifThen(k(), touching("bar"), [turn(k(), "cw", 45), move(k(), 5)]),
      ifThen(k(), touchingColour("red"), [stopAll(k())]),
    ]),
  ]);
};

/** A drawing project: a white stage and a cat that turns with the pen. */
const penProject = (): ScProject =>
  buildProject({
    backdrops: ["blank"],
    sprites: [
      {
        template: "cat",
        overrides: { x: 0, y: 0, rotationStyle: "all-around", size: 60 },
      },
    ],
  });

// ── Lesson 1 · adding the backdrops (book pp. 62–63) ─────────────────────────

/**
 * Book: "In this exercise, 2 backdrops are added to the blank one" — the Bedroom
 * and the Desert — "Select the white Backdrop and then delete it."
 *
 * There is no script yet on this page, so the check reads the Stage itself: the
 * two scenes of the story are there and the white one Scratch opened with is not.
 */
const l1Backdrops: ScExercise = {
  id: "g6-c5-l1-story-backdrops",
  lessonId: "g6-sc-01",
  title: "Adding the Backdrops to the Story",
  brief:
    "Scratch opens with a white background. Use “Choose a Backdrop” to add the two scenes of the story — Bedroom 3 and Desert — then select the white backdrop and delete it.",
  starter: buildProject({ backdrops: ["blank"], sprites: [{ template: "cat" }] }),
  focus: "stage",
  allowed: ["events", "looks"],
  hints: [
    "The story has two scenes, so the Stage needs two backdrops. Everything happens in the Backdrops tray under the stage.",
    "“Choose a Backdrop” opens the library. The Bedroom is where the Sprite wakes up; the Desert is where the walk happens.",
    "The white backdrop is not part of the story. Every backdrop chip has a small × on it.",
  ],
  check: {
    summary: "Looks at the Stage: the two scenes are there and the white one is gone.",
    trials: [
      {
        id: "stage",
        label: "The backdrops of the story",
        durationMs: 1000,
        assert: [
          {
            kind: "backdrop-list",
            mode: "contains-all",
            names: ["Bedroom 3", "Desert"],
            message:
              "The story needs both scenes: the Bedroom where the Sprite wakes up, and the Desert.",
          },
          {
            kind: "backdrop-list",
            mode: "contains-all",
            names: ["backdrop1"],
            not: true,
            message:
              "The white backdrop is not part of the story — select it and delete it.",
          },
        ],
      },
    ],
  },
  solution: storyProject(),
};

// ── Lesson 2 · programming the time frame (book pp. 64–65) ───────────────────

/**
 * Book: "Based on the script of the story, the first Backdrop should be displayed
 * for 10 seconds… Click on the heading Stage… From the category Event, move the
 * block `when green flag clicked`. From the category Looks, move the block
 * `switch backdrop to Bedroom 3`… Add the block `wait 10 seconds`… Add the block
 * `switch backdrop to Desert`."
 */
const l2TimeFrame: ScExercise = {
  id: "g6-c5-l2-backdrop-time-frame",
  lessonId: "g6-sc-02",
  title: "Programming the Time Frame for the Backdrops",
  brief:
    "Click on the heading Stage, then on Code. Build the script so that when the green flag is clicked the Bedroom 3 backdrop is displayed for 10 seconds, and the Desert backdrop is displayed 10 seconds after the first one.",
  starter: storyProject(),
  focus: "stage",
  allowed: ["events", "looks", "control"],
  hints: [
    "A script only starts when something starts it. The Events drawer has the block that waits for the green flag.",
    "Two backdrops, two `switch backdrop to` blocks — and the story tells you which one comes first.",
    "Between the two of them, something has to hold the first scene on screen. Look in Control for the block that waits.",
  ],
  check: {
    summary:
      "One run of the story: the Bedroom for the first 10 seconds, then the Desert.",
    trials: [
      {
        id: "story",
        label: "The green flag is clicked",
        durationMs: 25000,
        assert: [
          {
            kind: "backdrop-at",
            atMs: 2000,
            name: "Bedroom 3",
            message: "The story opens in the bedroom.",
          },
          {
            kind: "backdrop-at",
            atMs: 9000,
            name: "Bedroom 3",
            message: "The Bedroom backdrop must still be there after 9 seconds.",
          },
          {
            kind: "backdrop-at",
            atMs: 12000,
            name: "Desert",
            message: "After 10 seconds the Desert backdrop must be displayed.",
          },
          {
            kind: "backdrop-held",
            name: "Bedroom 3",
            minMs: 9000,
            maxMs: 11500,
            message: "The first backdrop is displayed for 10 seconds — no more, no less.",
          },
          {
            kind: "backdrop-sequence",
            mode: "in-order",
            names: ["Bedroom 3", "Desert"],
          },
        ],
      },
    ],
  },
  solution: setStageScripts(storyProject(), storyStageScript("l2a-so")),
};

/**
 * Book: "It is time to program the Sprite in order to make him display the
 * messages at the appropriate time" — the two `say … for 10 seconds` blocks
 * printed on page 65. The Stage script is already on the page, so the starter
 * carries it.
 */
const l2SpriteMessages: ScExercise = {
  id: "g6-c5-l2-sprite-messages",
  lessonId: "g6-sc-02",
  title: "Programming the Sprite",
  brief:
    "Select the Sprite. Program it so that on the green flag it says “Good morning, today is a nice weather for a walk in the desert” while the bedroom is showing, and “ahhhh, I forgot the bottle of water at home” once the desert appears — 10 seconds each.",
  starter: setStageScripts(storyProject(), storyStageScript("l2b-st")),
  focus: "cat",
  allowed: ["events", "looks", "control"],
  hints: [
    "The Stage already changes the scene on its own. The Sprite needs its own `when green flag clicked` block to start at the same moment.",
    "The Looks drawer has a block that shows a sentence in a bubble for a chosen number of seconds.",
    "The bedroom lasts 10 seconds, so the first sentence has to last exactly as long — then the second one starts by itself.",
  ],
  check: {
    summary:
      "One run: the right sentence in the bubble in the bedroom, and the right one in the desert.",
    trials: [
      {
        id: "story",
        label: "The green flag is clicked",
        durationMs: 25000,
        assert: [
          {
            kind: "said-at",
            atMs: 5000,
            sprite: "Cat",
            text: "good morning",
            message:
              "While the bedroom is showing, the Sprite says “Good morning, today is a nice weather for a walk in the desert”.",
          },
          {
            kind: "said-at",
            atMs: 15000,
            sprite: "Cat",
            text: "bottle of water",
            message:
              "Once the desert is there, the Sprite says “ahhhh, I forgot the bottle of water at home”.",
          },
          {
            kind: "said-while-backdrop",
            backdrop: "Bedroom 3",
            sprite: "Cat",
            text: "good morning",
            message: "The good morning line belongs to the bedroom scene.",
          },
          {
            kind: "said-while-backdrop",
            backdrop: "Desert",
            sprite: "Cat",
            text: "bottle of water",
            message: "The bottle of water line belongs to the desert scene.",
          },
          {
            kind: "said-order",
            sprite: "Cat",
            texts: ["good morning", "bottle of water"],
          },
        ],
      },
    ],
  },
  solution: setSpriteScripts(
    setStageScripts(storyProject(), storyStageScript("l2b-so-stage")),
    "cat",
    catStoryScript("l2b-so-cat"),
  ),
};

/**
 * Book: "In order to make the dialogue more interesting, add a new Sprite (the
 * bird Parrot) and let him appear and display the message 'No worries, I will get
 * you the bottle' once the Sprite Cat asks for the bottle of water."
 */
const l2Parrot: ScExercise = {
  id: "g6-c5-l2-flying-bird",
  lessonId: "g6-sc-02",
  title: "A Flying Bird in the Desert",
  brief:
    "Add the Sprite Parrot to the story. It must not be on the stage at the start: it appears and says “No worries, I will get you the bottle” once the Sprite Cat asks for the bottle of water.",
  starter: setSpriteScripts(
    setStageScripts(storyProject(), storyStageScript("l2c-st-stage")),
    "cat",
    catStoryScript("l2c-st-cat"),
  ),
  focus: "cat",
  allowed: ["events", "looks", "control"],
  hints: [
    "First the bird has to exist: “Choose a Sprite” opens the same library the backdrops came from.",
    "A sprite that must appear later has to be hidden first — Looks has both blocks.",
    "The Cat asks for the bottle after 10 seconds. The Parrot's own script has to wait exactly that long before showing itself.",
  ],
  check: {
    summary:
      "One run: the Parrot is off stage in the bedroom, and answers the Cat in the desert.",
    trials: [
      {
        id: "story",
        label: "The green flag is clicked",
        durationMs: 25000,
        assert: [
          {
            kind: "sprite-present",
            sprite: "Parrot",
            message: "The story needs the bird — add the Parrot sprite.",
          },
          {
            kind: "visible-at",
            atMs: 5000,
            sprite: "Parrot",
            value: false,
            message:
              "In the bedroom scene the Parrot is not there yet — it must be hidden.",
          },
          {
            kind: "visible-at",
            atMs: 15000,
            sprite: "Parrot",
            value: true,
            message: "Once the Cat asks for the bottle, the Parrot appears.",
          },
          {
            kind: "said-window",
            sprite: "Parrot",
            text: "no worries",
            fromMs: 9500,
            toMs: 24000,
            message:
              "The Parrot answers after the Cat asks for the bottle of water, not before.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l2c-so-parrot");
    const project = buildProject({
      backdrops: ["bedroom", "desert"],
      sprites: [
        { template: "cat", overrides: { x: -60, y: -70 } },
        { template: "parrot", overrides: { x: 90, y: 80 } },
      ],
    });
    const withStage = setStageScripts(project, storyStageScript("l2c-so-stage"));
    const withCat = setSpriteScripts(withStage, "cat", catStoryScript("l2c-so-cat"));
    return setSpriteScripts(withCat, "parrot", [
      flag(k(), [
        hide(k()),
        waitSecs(k(), 11),
        show(k()),
        sayFor(k(), PARROT_LINE, 6),
      ]),
    ]);
  })(),
};

// ── Lesson 3 · the documentary (book pp. 66–67) ──────────────────────────────

/**
 * Book: "For each source of renewable energy, import from the Internet a picture
 * as a Backdrop… When the green flag is clicked, each Backdrop will be displayed
 * for 20 seconds."
 *
 * The book leaves four blanks for the student's own research; the tray offers
 * four scenes — Solar, Wind, Water and Geothermal — so the timing can be built
 * and checked here without the internet.
 */
const l3Documentary: ScExercise = {
  id: "g6-c5-l3-documentary-backdrops",
  lessonId: "g6-sc-03",
  title: "The Documentary: 20 Seconds per Backdrop",
  brief:
    "Add one backdrop for each source of renewable energy you found — Solar, Wind, Water and Geothermal are in the tray — then build the Stage script so that when the green flag is clicked each backdrop is displayed for 20 seconds.",
  starter: buildProject({
    backdrops: ["blank"],
    sprites: [{ template: "avery", overrides: { x: -150, y: -70 } }],
  }),
  focus: "stage",
  allowed: ["events", "looks", "control"],
  hints: [
    "Four sources of energy, four backdrops. Add them all before you write a single block.",
    "The documentary starts on its first scene, so the script has to switch to it before waiting.",
    "`next backdrop` saves you three blocks: switch to the first one, then wait 20 seconds and move on, again and again.",
  ],
  check: {
    summary:
      "One 90-second run: at least four scenes, each holding the stage for 20 seconds.",
    trials: [
      {
        id: "documentary",
        label: "The documentary plays",
        durationMs: 90000,
        assert: [
          {
            kind: "backdrop-count",
            min: 4,
            message:
              "The documentary shows one backdrop per source of renewable energy — you found four.",
          },
          {
            kind: "backdrop-changes-every",
            ms: 20000,
            tolerance: 2500,
            atLeast: 4,
            message: "Each backdrop is displayed for 20 seconds, then the next one comes.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l3a-so");
    const project = buildProject({
      backdrops: ["solar", "wind", "water", "geothermal"],
      sprites: [{ template: "avery", overrides: { x: -150, y: -70 } }],
    });
    return setStageScripts(project, [
      flag(k(), [
        switchBackdrop(k(), "Solar"),
        waitSecs(k(), 20),
        switchBackdrop(k(), "Wind"),
        waitSecs(k(), 20),
        switchBackdrop(k(), "Water"),
        waitSecs(k(), 20),
        switchBackdrop(k(), "Geothermal"),
      ]),
    ]);
  })(),
};

/**
 * Book: "Add to the project the Sprite Avery… From the category Sound, move the
 * block `play sound` and select the appropriate recording", and from page 66:
 * "The appropriate Sprite will start moving on the stage while playing the sound
 * recorded that describes the scene."
 *
 * The platform cannot hold a real recording, so Avery carries a sound named
 * `recording1` that lasts as long as a spoken sentence; everything else — the
 * block, the choice, the movement — is the book's.
 */
const l3RecordAVoice: ScExercise = {
  id: "g6-c5-l3-record-a-voice",
  lessonId: "g6-sc-03",
  title: "Record a Voice",
  brief:
    "Select the Sprite Avery and use the `play sound … until done` block to play the recording that describes the scene. The Sprite must be moving on the stage while the recording is playing.",
  starter: (() => {
    const k = ids("l3b-st");
    const project = buildProject({
      backdrops: ["solar", "wind", "water", "geothermal"],
      sprites: [{ template: "avery", overrides: { x: -150, y: -70 } }],
    });
    return setStageScripts(project, [
      flag(k(), [
        switchBackdrop(k(), "Solar"),
        waitSecs(k(), 20),
        switchBackdrop(k(), "Wind"),
      ]),
    ]);
  })(),
  focus: "avery",
  allowed: ["motion", "looks", "sound", "events", "control"],
  hints: [
    "Avery already has the recording in its Sounds list — the block only has to choose it.",
    "`play sound … until done` holds the script until the recording finishes. Anything after it waits.",
    "Two things at the same time means two scripts: one `when green flag clicked` for the sound, another one for the walking.",
  ],
  check: {
    summary: "One run: the recording plays and Avery walks while it is playing.",
    trials: [
      {
        id: "voice",
        label: "The documentary is narrated",
        durationMs: 12000,
        assert: [
          {
            kind: "sound-played",
            sprite: "Avery",
            sound: "recording1",
            message: "The Sprite has to play the recording that describes the scene.",
          },
          {
            kind: "moved",
            sprite: "Avery",
            minDistance: 150,
            during: "sound",
            message:
              "Avery must be moving on the stage while the recording is playing, not standing still.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l3b-so");
    const project = buildProject({
      backdrops: ["solar", "wind", "water", "geothermal"],
      sprites: [{ template: "avery", overrides: { x: -150, y: -70 } }],
    });
    const withStage = setStageScripts(project, [
      flag(k(), [
        switchBackdrop(k(), "Solar"),
        waitSecs(k(), 20),
        switchBackdrop(k(), "Wind"),
      ]),
    ]);
    return setSpriteScripts(withStage, "avery", [
      flag(k(), [playSound(k(), "recording1", true)]),
      flag(k(), [forever(k(), [move(k(), 3), bounce(k())])]),
    ]);
  })(),
};

// ── Lesson 4 · the recycling animation (book pp. 68–69) ──────────────────────

/**
 * Book: "For each recycled item, create a new Sprite with at least 3 Costumes…
 * Add the block `next costume` to animate the Sprite", with the printed script
 * `when green flag clicked / forever / next costume / wait 1 seconds`.
 *
 * Drawing a sprite in the paint editor is a mouse skill the platform cannot
 * stand in for, so the recycled items arrive already drawn, each with its three
 * costumes; the animation is the student's.
 */
const l4Costumes: ScExercise = {
  id: "g6-c5-l4-costume-animation",
  lessonId: "g6-sc-04",
  title: "Playing the Different Costumes",
  brief:
    "The Glass sprite already has its three costumes. Build the script that plays them one after another — a new costume every second — as long as the project is running.",
  starter: buildProject({
    backdrops: ["recycle-bay"],
    sprites: [{ template: "glass", overrides: { x: 0, y: -10 } }],
  }),
  focus: "glass",
  allowed: ["looks", "events", "control"],
  hints: [
    "An animation never stops on its own. Control has a loop that keeps going for as long as the project runs.",
    "`next costume` moves the sprite on to its following drawing — and back to the first one after the last.",
    "Without a wait, all three costumes flash by in a blink. The book waits 1 second between them.",
  ],
  check: {
    summary: "A five-second run: the three costumes take turns, about one a second.",
    trials: [
      {
        id: "animate",
        label: "The animation plays",
        durationMs: 5000,
        assert: [
          {
            kind: "costume-count",
            sprite: "Glass",
            min: 3,
            message: "Each recycled item needs at least 3 costumes.",
          },
          {
            kind: "costume-changes",
            sprite: "Glass",
            min: 4,
            max: 9,
            message:
              "The costumes must change about once a second — not all at once, and not only twice.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l4a-so");
    const project = buildProject({
      backdrops: ["recycle-bay"],
      sprites: [{ template: "glass", overrides: { x: 0, y: -10 } }],
    });
    return setSpriteScripts(project, "glass", [
      flag(k(), [forever(k(), [nextCostume(k()), waitSecs(k(), 1)])]),
    ]);
  })(),
};

/**
 * Book: "Create an animation to display, each 6 seconds, a new Sprite while
 * playing the different costumes." Three recycled items, six seconds each, one
 * on the stage at a time.
 */
const l4SixSeconds: ScExercise = {
  id: "g6-c5-l4-six-seconds",
  lessonId: "g6-sc-04",
  title: "A New Sprite Every 6 Seconds",
  brief:
    "Three recycled items are in the project: Glass, Cans and Carton. Build the animation so that a new Sprite is displayed every 6 seconds — Glass first, then Cans, then Carton — with only one of them on the stage at a time.",
  starter: buildProject({
    backdrops: ["recycle-bay"],
    sprites: [
      { template: "glass", overrides: { x: 0, y: -10 } },
      { template: "cans", overrides: { x: 0, y: -10 } },
      { template: "carton", overrides: { x: 0, y: -10 } },
    ],
  }),
  focus: "glass",
  allowed: ["looks", "events", "control"],
  hints: [
    "Every sprite gets its own script — and every one of them starts on the same green flag.",
    "A sprite that has to appear later starts the animation hidden, waits its turn, then shows itself.",
    "Turn by turn: the first item waits 6 seconds and hides, the second one waits 6 seconds and shows, and so on.",
  ],
  check: {
    summary:
      "A twenty-second run, checked at 3, 9 and 15 seconds: one item on the stage each time.",
    trials: [
      {
        id: "rotation",
        label: "The items take turns",
        durationMs: 20000,
        assert: [
          {
            kind: "only-visible-at",
            atMs: 3000,
            sprite: "Glass",
            message: "For the first 6 seconds only the Glass sprite is on the stage.",
          },
          {
            kind: "only-visible-at",
            atMs: 9000,
            sprite: "Cans",
            message: "After 6 seconds the Cans sprite takes over, alone.",
          },
          {
            kind: "only-visible-at",
            atMs: 15000,
            sprite: "Carton",
            message: "After 12 seconds it is the Carton's turn, alone.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l4b-so");
    const project = buildProject({
      backdrops: ["recycle-bay"],
      sprites: [
        { template: "glass", overrides: { x: 0, y: -10 } },
        { template: "cans", overrides: { x: 0, y: -10 } },
        { template: "carton", overrides: { x: 0, y: -10 } },
      ],
    });
    const withGlass = setSpriteScripts(project, "glass", [
      flag(k(), [show(k()), waitSecs(k(), 6), hide(k())]),
    ]);
    const withCans = setSpriteScripts(withGlass, "cans", [
      flag(k(), [hide(k()), waitSecs(k(), 6), show(k()), waitSecs(k(), 6), hide(k())]),
    ]);
    return setSpriteScripts(withCans, "carton", [
      flag(k(), [hide(k()), waitSecs(k(), 12), show(k())]),
    ]);
  })(),
};

// ── Lesson 5 · the game, step 3 (book pp. 70–71) ─────────────────────────────

/**
 * Book STEP 3: "In order to make the horizontal bar move according to the mouse
 * movements, build the following Script: in a Forever Loop, insert the block
 * `go to x: 0 y: 0`. From the Sensing category, move the block `mouse x`."
 */
const l5Bar: ScExercise = {
  id: "g6-c5-l5-bar-follows-mouse",
  lessonId: "g6-sc-05",
  title: "Program the Horizontal Bar",
  brief:
    "The backdrop with its red line and the two Sprites are ready. Build the script that makes the black horizontal bar move left and right with the mouse, while staying on its own line at y = 0.",
  starter: gameProject(),
  focus: "bar",
  allowed: ["motion", "events", "control", "sensing"],
  hints: [
    "The bar has to follow the mouse all the time, not once — so the blocks belong inside a loop that never ends.",
    "`go to x: () y: ()` puts the sprite exactly where you tell it. The bar slides sideways only, so its y never changes.",
    "The Sensing drawer knows where the mouse pointer is. Drop that block into the x slot.",
  ],
  check: {
    summary:
      "One run with the mouse moving to four places: the bar has to be under the pointer each time.",
    trials: [
      {
        id: "mouse",
        label: "The mouse moves across the stage",
        durationMs: 6000,
        input: mouseWalk([
          [0, -150, 40],
          [1500, 60, -20],
          [3000, 200, 100],
          [4500, -90, 0],
        ]),
        assert: [
          {
            kind: "follows-mouse",
            sprite: "Bar",
            axis: "x",
            maxError: 8,
            message: "The bar has to be wherever the mouse pointer is, left and right.",
          },
          {
            kind: "position",
            sprite: "Bar",
            when: "final",
            y: 0,
            tolerance: 4,
            message:
              "The bar only slides sideways — it must stay on its line, at y = 0.",
          },
        ],
      },
    ],
  },
  solution: setSpriteScripts(gameProject(), "bar", barScript("l5-so")),
};

// ── Lesson 6 · the game, steps 4 to 6 (book pp. 72–73) ───────────────────────

/**
 * Book STEP 4: "Start the game by positioning the ball at the location x=19 y=33
 * (you may use different values according to your game). Change the direction of
 * the ball to 45 in order to make diagonal movements. In a forever loop place the
 * block `if on edge, bounce`. Add the two <if…then> blocks as shown."
 *
 * The book says in so many words that other starting values are allowed, so the
 * check never looks at 19 and 33 — it looks at what the ball does.
 */
const l6Ball: ScExercise = {
  id: "g6-c5-l6-program-the-ball",
  lessonId: "g6-sc-06",
  title: "Program the Ball",
  brief:
    "The bar already follows the mouse. Now program the ball: it starts in the middle of the stage moving diagonally, it bounces on the edges of the stage, it bounces when it touches the horizontal bar, and the game ends when it touches the red line.",
  starter: setSpriteScripts(gameProject(), "bar", barScript("l6a-st")),
  focus: "ball",
  allowed: ["motion", "looks", "events", "control", "sensing"],
  hints: [
    "The ball must keep moving, so the moving block lives inside a forever loop — but the starting place and the starting direction are set once, before the loop.",
    "Direction 45 is a diagonal: half across, half up. Straight up is 0 and straight to the right is 90.",
    "Two questions have to be asked over and over: “am I touching the bar?” and “am I touching the red line?” — one `if … then` block each.",
  ],
  check: {
    summary:
      "Three runs: the ball alone on the stage, a player hitting it, and a player who lets it fall.",
    trials: [
      {
        id: "diagonal",
        label: "The ball moves on its own",
        durationMs: 2500,
        input: mouseWalk([[0, -230, 0]]),
        assert: [
          {
            kind: "direction",
            sprite: "Ball",
            when: "start",
            oneOf: [45, 135, -45, -135],
            tolerance: 2,
            message:
              "The ball has to start on a diagonal — the book points it in direction 45.",
          },
          {
            kind: "moved",
            sprite: "Ball",
            minDistance: 120,
            message: "The ball moves all the time, on its own.",
          },
          {
            kind: "stayed-on-stage",
            sprite: "Ball",
            message:
              "When the ball reaches the edge of the stage it has to bounce back, not stick to it.",
          },
        ],
      },
      {
        id: "hit",
        label: "A player keeps hitting the ball",
        durationMs: 15000,
        input: [{ at: 0, kind: "follow", sprite: "ball", axis: "x" }],
        assert: [
          {
            kind: "turned-after-touch",
            sprite: "Ball",
            other: "Bar",
            withinMs: 200,
            message: "If the ball touches the horizontal bar, the ball bounces.",
          },
        ],
      },
      {
        id: "missed",
        label: "The player misses and the ball falls",
        durationMs: 30000,
        input: mouseWalk([[0, -230, 0]]),
        assert: [
          {
            kind: "touched-colour",
            sprite: "Ball",
            colour: "red",
            message: "With the bar far away the ball has to reach the red line.",
          },
          {
            kind: "run-stopped",
            message: "The game ends if the ball touches the red line.",
          },
        ],
      },
    ],
  },
  solution: setSpriteScripts(
    setSpriteScripts(gameProject(), "bar", barScript("l6a-so-bar")),
    "ball",
    [ballScript("l6a-so-ball")],
  ),
};

/**
 * Book STEP 5: "From the category Variables, click on Make a variable and name it
 * Count… `set counter to 0`… `change counter by 1`… `wait 1 seconds`."
 * Book STEP 6: "What if you want to display a message announcing that the top
 * score is hit?" — the printed script says `if counter = 50 then say "You are a
 * winner" for 2 seconds`.
 */
const l6Counter: ScExercise = {
  id: "g6-c5-l6-counter-and-winner",
  lessonId: "g6-sc-06",
  title: "Set a Counter, and the Winner Is!!!",
  brief:
    "The ball already bounces. Make a variable named counter, set it to 0 when the game starts, and add 1 to it every time the ball hits the horizontal bar — waiting 1 second so one hit counts once. When the counter reaches the top score of 50, the ball says “You are a winner” for 2 seconds.",
  starter: setSpriteScripts(
    setSpriteScripts(gameProject(), "bar", barScript("l6b-st-bar")),
    "ball",
    [ballScript("l6b-st-ball")],
  ),
  focus: "ball",
  allowed: ["motion", "looks", "events", "control", "sensing", "operators", "variables"],
  hints: [
    "A score starts at 0 every time the game starts — that block belongs right under the green flag, before any loop.",
    "`change counter by 1` adds to what is already inside the box; `set counter to 0` throws away what was there.",
    "Without the `wait 1 seconds`, one single hit is counted again and again for as long as the ball is still touching the bar.",
  ],
  check: {
    summary:
      "Two runs with a player who never misses: one ordinary game, and one that is a single hit away from the top score.",
    trials: [
      {
        id: "rally",
        label: "A player keeps the ball up",
        durationMs: 20000,
        input: [{ at: 0, kind: "follow", sprite: "ball", axis: "x" }],
        assert: [
          {
            kind: "variable-value",
            name: "counter",
            op: "=",
            value: 0,
            when: "start",
            message: "The score starts at 0 when the green flag is clicked.",
          },
          {
            kind: "variable-sequence",
            name: "counter",
            mode: "in-order",
            values: [0, 1, 2],
            message: "Every hit adds exactly 1 to the score: 0, 1, 2…",
          },
          {
            kind: "counts-touches",
            name: "counter",
            sprite: "Ball",
            other: "Bar",
            tolerance: 1,
            message:
              "One hit has to count once. Without the `wait 1 seconds`, the score keeps climbing for as long as the ball is still touching the bar.",
          },
          {
            kind: "said",
            sprite: "Ball",
            text: "winner",
            not: true,
            message:
              "The winning message belongs to the top score of 50 — not to every hit.",
          },
        ],
      },
      {
        id: "top-score",
        label: "One hit away from the top score",
        durationMs: 12000,
        input: [
          { at: 0, kind: "follow", sprite: "ball", axis: "x" },
          { at: 3000, kind: "set-variable", name: "counter", value: 49 },
        ],
        assert: [
          {
            kind: "variable-value",
            name: "counter",
            op: "=",
            value: 50,
            when: "ever",
            message: "One more hit after 49 has to bring the score to 50.",
          },
          {
            kind: "said",
            sprite: "Ball",
            text: "winner",
            message:
              "When the top score of 50 is hit, a message announcing the winner is displayed.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l6b-so");
    const withBar = setSpriteScripts(gameProject(), "bar", barScript("l6b-so-bar"));
    return setSpriteScripts(withBar, "ball", [
      ballScript("l6b-so-ball"),
      flag(k(), [
        setVar(k(), "counter", 0),
        forever(k(), [
          ifThen(k(), touching("bar"), [
            changeVar(k(), "counter", 1),
            waitSecs(k(), 1),
          ]),
          ifThen(k(), varEquals("counter", 50), [
            sayFor(k(), "You are a winner", 2),
          ]),
        ]),
      ]),
    ]);
  })(),
};

// ── Lesson 7 · drawing shapes with the pen (book p. 74) ──────────────────────

/**
 * Book: "Use the Pen and the Repeat blocks to reproduce the below shapes." Four
 * shapes are printed with no measurements at all, so every check reads the shape
 * of the drawing — how many closed figures, how many sides each one has, whether
 * the sides are equal, where each one starts — and never a size the book never
 * gave.
 */
const penHints = [
  "Before anything is drawn: erase what is already there, choose where to start, and put the pen down.",
  "Find the part of the picture that repeats, and count how many times it repeats. That is your Repeat block.",
  "A closed shape brings the sprite exactly back where it started: the turns of a whole trip around always add up to 360 degrees.",
];

const l7RotatingSquares: ScExercise = {
  id: "g6-c5-l7-rotating-squares",
  lessonId: "g6-sc-07",
  title: "Shape 1: The Turning Squares",
  brief:
    "Reproduce the first shape: the same square drawn over and over from the same point, turned a little further each time, with the pen changing colour as it goes.",
  starter: penProject(),
  focus: "cat",
  allowed: ["motion", "events", "control", "pen"],
  hints: [
    ...penHints,
    "One square is four sides and four quarter-turns. The whole picture is that square, repeated with a small extra turn between the copies.",
  ],
  check: {
    summary:
      "One run: at least ten equal-sided squares, all starting from the same point, in several colours.",
    trials: [
      {
        id: "draw",
        label: "The pen draws the pattern",
        durationMs: 12000,
        assert: [
          { kind: "pen-drew", message: "Nothing was drawn — is the pen down?" },
          {
            kind: "pen-shapes",
            sides: 4,
            min: 10,
            equalSides: true,
            starts: "same",
            message:
              "The picture is the same square drawn many times from one point, turning a little each time.",
          },
          {
            kind: "pen-colours",
            min: 3,
            message: "The squares in the book are not all the same colour.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l7a-so");
    return setSpriteScripts(penProject(), "cat", [
      flag(k(), [
        eraseAll(k()),
        penUp(k()),
        goTo(k(), num(0), num(0)),
        pointIn(k(), 90),
        setPenColour(k(), 0),
        penDown(k()),
        repeat(k(), 12, [
          repeat(k(), 4, [move(k(), 100), turn(k(), "cw", 90)]),
          turn(k(), "cw", 30),
          changePenColour(k(), 8),
        ]),
        penUp(k()),
      ]),
    ]);
  })(),
};

const l7Staircase: ScExercise = {
  id: "g6-c5-l7-three-squares",
  lessonId: "g6-sc-07",
  title: "Shape 2: The Three Squares",
  brief:
    "Reproduce the second shape: three squares of the same size, each one starting from a corner of the one before it, going down the stage like a staircase.",
  starter: penProject(),
  focus: "cat",
  allowed: ["motion", "events", "control", "pen"],
  hints: [
    ...penHints,
    "Between two squares the sprite has to travel to the far corner of the one it has just finished — two sides of it.",
  ],
  check: {
    summary: "One run: exactly three equal-sided squares, each starting somewhere new.",
    trials: [
      {
        id: "draw",
        label: "The pen draws the staircase",
        durationMs: 12000,
        assert: [
          { kind: "pen-drew", message: "Nothing was drawn — is the pen down?" },
          {
            kind: "pen-shapes",
            sides: 4,
            min: 3,
            max: 3,
            equalSides: true,
            starts: "different",
            message:
              "The picture is three squares of the same size, and each one starts in a different place.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l7b-so");
    return setSpriteScripts(penProject(), "cat", [
      flag(k(), [
        eraseAll(k()),
        penUp(k()),
        goTo(k(), num(-60), num(60)),
        pointIn(k(), 90),
        setPenColour(k(), 66),
        penDown(k()),
        repeat(k(), 3, [
          repeat(k(), 4, [move(k(), 80), turn(k(), "cw", 90)]),
          move(k(), 80),
          turn(k(), "cw", 90),
          move(k(), 80),
          turn(k(), "ccw", 90),
        ]),
        penUp(k()),
      ]),
    ]);
  })(),
};

const l7SquareAndTriangles: ScExercise = {
  id: "g6-c5-l7-square-and-triangles",
  lessonId: "g6-sc-07",
  title: "Shape 3: The Square with Four Triangles",
  brief:
    "Reproduce the third shape: a square with a triangle standing on each of its four sides.",
  starter: penProject(),
  focus: "cat",
  allowed: ["motion", "events", "control", "pen"],
  hints: [
    ...penHints,
    "A triangle with three equal sides is drawn with three turns of 120 degrees — and the whole picture is one side of the square plus one triangle, four times over.",
  ],
  check: {
    summary:
      "One run: four equal-sided triangles and the square they are standing on.",
    trials: [
      {
        id: "draw",
        label: "The pen draws the shape",
        durationMs: 12000,
        assert: [
          { kind: "pen-drew", message: "Nothing was drawn — is the pen down?" },
          {
            kind: "pen-shapes",
            sides: 3,
            min: 4,
            equalSides: true,
            message: "There is one triangle standing on each of the four sides.",
          },
          {
            kind: "pen-shapes",
            sides: 4,
            min: 1,
            equalSides: true,
            message: "The square in the middle has to be drawn too.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l7c-so");
    return setSpriteScripts(penProject(), "cat", [
      flag(k(), [
        eraseAll(k()),
        penUp(k()),
        goTo(k(), num(-50), num(50)),
        pointIn(k(), 90),
        setPenColour(k(), 66),
        penDown(k()),
        repeat(k(), 4, [
          repeat(k(), 3, [move(k(), 100), turn(k(), "ccw", 120)]),
          move(k(), 100),
          turn(k(), "cw", 90),
        ]),
        penUp(k()),
      ]),
    ]);
  })(),
};

const l7FourTriangles: ScExercise = {
  id: "g6-c5-l7-four-triangles",
  lessonId: "g6-sc-07",
  title: "Shape 4: The Four Triangles",
  brief:
    "Reproduce the fourth shape: the same four triangles as before, standing around an empty square — this time the square itself is not drawn.",
  starter: penProject(),
  focus: "cat",
  allowed: ["motion", "events", "control", "pen"],
  hints: [
    ...penHints,
    "This is the shape you have just drawn, with one difference: the sprite still travels along the sides of the square, but it must not leave a line behind while it does.",
  ],
  check: {
    summary: "One run: four equal-sided triangles, and no square between them.",
    trials: [
      {
        id: "draw",
        label: "The pen draws the four triangles",
        durationMs: 12000,
        assert: [
          { kind: "pen-drew", message: "Nothing was drawn — is the pen down?" },
          {
            kind: "pen-shapes",
            sides: 3,
            min: 4,
            equalSides: true,
            message: "Four triangles, all the same size.",
          },
          {
            kind: "pen-shapes",
            sides: 4,
            max: 0,
            message:
              "In this shape the square between the triangles is not drawn — lift the pen while the sprite travels along it.",
          },
        ],
      },
    ],
  },
  solution: (() => {
    const k = ids("l7d-so");
    return setSpriteScripts(penProject(), "cat", [
      flag(k(), [
        eraseAll(k()),
        penUp(k()),
        goTo(k(), num(-50), num(50)),
        pointIn(k(), 90),
        setPenColour(k(), 0),
        penDown(k()),
        repeat(k(), 4, [
          repeat(k(), 3, [move(k(), 100), turn(k(), "ccw", 120)]),
          penUp(k()),
          move(k(), 100),
          penDown(k()),
          turn(k(), "cw", 90),
        ]),
        penUp(k()),
      ]),
    ]);
  })(),
};

// ── The chapter, in the book's order ─────────────────────────────────────────

export const SC_EXERCISES: ScExercise[] = [
  l1Backdrops,
  l2TimeFrame,
  l2SpriteMessages,
  l2Parrot,
  l3Documentary,
  l3RecordAVoice,
  l4Costumes,
  l4SixSeconds,
  l5Bar,
  l6Ball,
  l6Counter,
  l7RotatingSquares,
  l7Staircase,
  l7SquareAndTriangles,
  l7FourTriangles,
];

/** Every buildable challenge of one lesson, in the order the book sets them. */
export function exercisesForLesson(lessonId: string): ScExercise[] {
  return SC_EXERCISES.filter((exercise) => exercise.lessonId === lessonId);
}

/** One challenge by id — for deep links straight into the editor. */
export function exerciseById(id: string): ScExercise | undefined {
  return SC_EXERCISES.find((exercise) => exercise.id === id);
}
