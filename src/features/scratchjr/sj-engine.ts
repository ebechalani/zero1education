import {
  sjClamp,
  sjInitialStage,
  SJ_COLS,
  SJ_ROWS,
  type SjBlock,
  type SjProject,
  type SjSpeed,
  type SjSpriteState,
} from "./sj-model";

/**
 * The ScratchJr runtime.
 *
 * Unlike the micro:bit's, this one is **deterministic and synchronous**: a
 * ScratchJr project has no sensors and no randomness, so the whole run can be
 * computed up front as a list of frames. Two things fall out of that, and both
 * matter more than the elegance does —
 *
 *   the player just walks the frames, so speed, pause and scrub are free; and
 *   an exercise can be checked without waiting for real timers, which is what
 *   makes a check script possible at all.
 *
 * A **step** is one unit of animation: one square of movement, one twelfth of
 * a turn, one tenth of a second of Wait. Every script advances one step per
 * tick, round-robin, which is how ScratchJr's own scripts appear to run side
 * by side.
 */

/** Milliseconds per step, at each of ScratchJr's three speeds. */
export const SJ_STEP_MS: Record<SjSpeed, number> = {
  slow: 620,
  normal: 320,
  fast: 140,
};

export interface SjFrame {
  /** Tick number. Frame 0 is the project before anything runs. */
  t: number;
  sprites: SjSpriteState[];
  sound: { sprite: string; name: string } | null;
  /** The block each sprite is carrying out right now, for highlighting */
  active: Record<string, string | null>;
}

export type SjStopReason = "finished" | "stop-block" | "limit";

export interface SjRun {
  frames: SjFrame[];
  stoppedBy: SjStopReason;
}

/** What a script was started by. */
export type SjStart =
  | { kind: "flag" }
  | { kind: "tap"; spriteId: string }
  | { kind: "bump"; spriteId: string };

/**
 * Runs forever-loops need a ceiling or the check never returns. 600 steps is
 * about three minutes of stage time at normal speed — far past any project in
 * either book, and still instant to compute.
 */
const MAX_STEPS = 600;

/** A sprite's box on the grid, for bump detection. */
function overlaps(a: SjSpriteState, b: SjSpriteState): boolean {
  if (!a.visible || !b.visible) return false;
  // A sprite at size 100 fills roughly two squares each way; Grow and Shrink
  // change what it can bump into, which is the point of the size blocks.
  const halfA = Math.max(0.5, a.size / 100);
  const halfB = Math.max(0.5, b.size / 100);
  return (
    Math.abs(a.x - b.x) < halfA + halfB && Math.abs(a.y - b.y) < halfA + halfB
  );
}

/**
 * One script, as a generator of steps.
 *
 * Yielding is what makes a script interruptible and interleaved; each yield is
 * one visible unit of change. The generator mutates the sprite state it is
 * handed, which is safe because the scheduler owns it and snapshots per frame.
 */
function* runBlocks(
  blocks: SjBlock[],
  sprite: Runner,
  ctx: {
    say: (text: string | null) => void;
    sound: (name: string) => void;
    stopAll: () => void;
    endScript: () => void;
  },
): Generator<string, void, unknown> {
  for (const block of blocks) {
    switch (block.kind) {
      case "move-right":
      case "move-left":
      case "move-up":
      case "move-down": {
        const d =
          block.kind === "move-right"
            ? { dx: 1, dy: 0 }
            : block.kind === "move-left"
              ? { dx: -1, dy: 0 }
              : block.kind === "move-up"
                ? { dx: 0, dy: -1 }
                : { dx: 0, dy: 1 };
        // ScratchJr flips the picture to face the way it last moved sideways.
        if (d.dx !== 0) sprite.flipped = d.dx < 0;
        for (let i = 0; i < block.n; i++) {
          const next = sjClamp({ x: sprite.x + d.dx, y: sprite.y + d.dy });
          sprite.x = next.x;
          sprite.y = next.y;
          yield block.id;
        }
        break;
      }

      case "hop": {
        // Up n, then back down n — one hop, however tall.
        for (let i = 0; i < block.n; i++) {
          sprite.y = sjClamp({ x: sprite.x, y: sprite.y - 1 }).y;
          yield block.id;
        }
        for (let i = 0; i < block.n; i++) {
          sprite.y = sjClamp({ x: sprite.x, y: sprite.y + 1 }).y;
          yield block.id;
        }
        break;
      }

      case "turn-right":
      case "turn-left": {
        const way = block.kind === "turn-right" ? 1 : -1;
        for (let i = 0; i < block.n; i++) {
          sprite.turn = (((sprite.turn + way) % 12) + 12) % 12;
          yield block.id;
        }
        break;
      }

      case "go-home": {
        sprite.x = sprite.homeX;
        sprite.y = sprite.homeY;
        sprite.turn = 0;
        yield block.id;
        break;
      }

      case "say": {
        ctx.say(block.text);
        // A speech bubble stays up for a beat, as it does in the app.
        for (let i = 0; i < 4; i++) yield block.id;
        ctx.say(null);
        break;
      }

      case "grow":
      case "shrink": {
        const way = block.kind === "grow" ? 1 : -1;
        for (let i = 0; i < block.n; i++) {
          // ScratchJr moves size in tenths and will not shrink a sprite away.
          sprite.size = Math.min(300, Math.max(20, sprite.size + way * 10));
          yield block.id;
        }
        break;
      }

      case "reset-size":
        sprite.size = 100;
        yield block.id;
        break;

      case "hide":
        sprite.visible = false;
        yield block.id;
        break;

      case "show":
        sprite.visible = true;
        yield block.id;
        break;

      case "pop":
        ctx.sound("pop");
        yield block.id;
        break;

      case "play-sound":
        ctx.sound(block.sound);
        yield block.id;
        break;

      case "wait":
        for (let i = 0; i < block.n; i++) yield block.id;
        break;

      case "set-speed":
        sprite.speed = block.speed;
        yield block.id;
        break;

      case "stop":
        ctx.stopAll();
        return;

      case "end":
        ctx.endScript();
        return;

      case "repeat": {
        for (let i = 0; i < block.n; i++) {
          yield* runBlocks(block.body, sprite, ctx);
        }
        break;
      }

      case "repeat-forever": {
        // The scheduler's step ceiling is what ends this, not the loop.
        for (;;) {
          if (block.body.length === 0) {
            yield block.id;
            continue;
          }
          yield* runBlocks(block.body, sprite, ctx);
        }
      }
    }
  }
}

/**
 * Sprite state plus where home is. Home lives here rather than on
 * `SjSpriteState` because it never changes and the stage never draws it — only
 * the go-home block cares.
 */
interface Runner extends SjSpriteState {
  homeX: number;
  homeY: number;
}

/**
 * Run a project and record every frame.
 *
 * `start` says what fired: the green flag starts every on-flag script, a tap
 * starts that sprite's on-tap scripts. Bumps are detected as the run goes and
 * start on-bump scripts the first time two sprites touch.
 */
export function runProject(
  project: SjProject,
  start: SjStart = { kind: "flag" },
  maxSteps = MAX_STEPS,
): SjRun {
  const base = sjInitialStage(project);
  const runners: Runner[] = base.sprites.map((s, i) => ({
    ...s,
    homeX: project.sprites[i].home.x,
    homeY: project.sprites[i].home.y,
  }));
  const byId = new Map(runners.map((r) => [r.id, r]));

  let sound: { sprite: string; name: string } | null = null;
  let stopped = false;
  let reason: SjStopReason = "finished";

  interface Live {
    /** Which script this is, so a re-trigger does not start a second copy */
    scriptId: string;
    spriteId: string;
    blockId: string | null;
    gen: Generator<string, void, unknown>;
    done: boolean;
  }
  const live: Live[] = [];

  const startScripts = (spriteId: string, kinds: string[]) => {
    const sprite = byId.get(spriteId);
    const def = project.sprites.find((s) => s.id === spriteId);
    if (!sprite || !def) return;
    for (const script of def.scripts) {
      if (!kinds.includes(script.trigger.kind)) continue;
      // A script already running is not restarted, as in the app.
      if (live.some((l) => l.scriptId === script.id && !l.done)) continue;
      const entry: Live = {
        scriptId: script.id,
        spriteId,
        blockId: null,
        done: false,
        gen: runBlocks(script.blocks, sprite, {
          say: (text) => {
            sprite.bubble = text;
          },
          sound: (name) => {
            sound = { sprite: spriteId, name };
          },
          stopAll: () => {
            stopped = true;
            reason = "stop-block";
          },
          endScript: () => {},
        }),
      };
      live.push(entry);
    }
  };

  if (start.kind === "flag") {
    for (const s of project.sprites) startScripts(s.id, ["on-flag"]);
  } else if (start.kind === "tap") {
    startScripts(start.spriteId, ["on-tap"]);
  } else {
    startScripts(start.spriteId, ["on-bump"]);
  }

  const snapshot = (t: number): SjFrame => ({
    t,
    sprites: runners.map((r) => ({ ...r })),
    sound,
    active: Object.fromEntries(
      runners.map((r) => [
        r.id,
        live.find((l) => l.spriteId === r.id && !l.done)?.blockId ?? null,
      ]),
    ),
  });

  const frames: SjFrame[] = [snapshot(0)];
  /** Pairs already bumped, so one touch fires one script. */
  const bumped = new Set<string>();

  for (let t = 1; t <= maxSteps; t++) {
    if (stopped) break;

    let advanced = false;
    // Round-robin: each live script takes one step per tick, so scripts on
    // different sprites appear to run at the same time.
    for (const l of live) {
      if (l.done || stopped) continue;
      const next = l.gen.next();
      if (next.done) {
        l.done = true;
        l.blockId = null;
      } else {
        l.blockId = next.value;
        advanced = true;
      }
    }

    // Bumps, after everything has moved this tick.
    for (let i = 0; i < runners.length; i++) {
      for (let j = i + 1; j < runners.length; j++) {
        const a = runners[i];
        const b = runners[j];
        const key = `${a.id}|${b.id}`;
        if (overlaps(a, b)) {
          if (!bumped.has(key)) {
            bumped.add(key);
            startScripts(a.id, ["on-bump"]);
            startScripts(b.id, ["on-bump"]);
          }
        } else {
          bumped.delete(key);
        }
      }
    }

    frames.push(snapshot(t));
    sound = null;

    if (!advanced && live.every((l) => l.done)) break;
    if (t === maxSteps) reason = "limit";
  }

  return { frames, stoppedBy: stopped ? "stop-block" : reason };
}

// ── What a run did, for checking ────────────────────────────────────────────

export interface SjSpriteTrace {
  id: string;
  name: string;
  /** Every distinct square the sprite stood on, in order */
  path: { x: number; y: number }[];
  finalX: number;
  finalY: number;
  finalSize: number;
  finalVisible: boolean;
  /** Twelfths of a full turn at the end, 0…11 */
  finalTurn: number;
  /**
   * Everything the sprite said, in order, with the step it said it on. The
   * step matters: Grade 1's dialogue lesson is about the Wait block, and
   * "TOC answered after TAC" cannot be checked without it.
   */
  said: { text: string; at: number }[];
}

export interface SjRunRecord {
  stoppedBy: SjStopReason;
  steps: number;
  sprites: SjSpriteTrace[];
  /** Every sound heard, in order, as "sprite:name" */
  sounds: string[];
}

/** Boil a run down to what an exercise can be judged on. */
export function recordRun(run: SjRun): SjRunRecord {
  const first = run.frames[0];
  const last = run.frames[run.frames.length - 1];

  const sprites: SjSpriteTrace[] = first.sprites.map((s0, i) => {
    const path: { x: number; y: number }[] = [];
    const said: { text: string; at: number }[] = [];
    let lastBubble: string | null = null;

    for (const frame of run.frames) {
      const s = frame.sprites[i];
      const prev = path[path.length - 1];
      if (!prev || prev.x !== s.x || prev.y !== s.y) path.push({ x: s.x, y: s.y });
      if (s.bubble && s.bubble !== lastBubble) said.push({ text: s.bubble, at: frame.t });
      lastBubble = s.bubble;
    }

    const end = last.sprites[i];
    return {
      id: s0.id,
      name: s0.name,
      path,
      finalX: end.x,
      finalY: end.y,
      finalSize: end.size,
      finalVisible: end.visible,
      finalTurn: end.turn,
      said,
    };
  });

  const sounds: string[] = [];
  for (const frame of run.frames) {
    if (frame.sound) sounds.push(`${frame.sound.sprite}:${frame.sound.name}`);
  }

  return {
    stoppedBy: run.stoppedBy,
    steps: run.frames.length - 1,
    sprites,
    sounds,
  };
}

/** Where a sprite ends up — the answer Grade 1 Lesson 2 asks a child to write. */
export function finalPosition(
  project: SjProject,
  spriteId: string,
): { x: number; y: number } {
  const record = recordRun(runProject(project));
  const trace = record.sprites.find((s) => s.id === spriteId);
  return trace
    ? { x: trace.finalX, y: trace.finalY }
    : { x: SJ_COLS, y: SJ_ROWS };
}
