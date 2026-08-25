/**
 * Every ScratchJr worked answer must pass its own check.
 *
 * A task whose printed answer does not satisfy its own checker is worse than
 * no task: a child follows the book exactly, is told they are wrong, and
 * concludes the fault is theirs. This has already happened once on this
 * platform — a Grade 6 mBot2 answer turned right where the route needed left —
 * so every chapter that ships a worked answer gets a script like this one.
 *
 * It also checks the opposite direction: the STARTING project must FAIL. An
 * assertion that already holds before the child touches anything is not a
 * check, it is decoration.
 *
 *   npm run check:scratchjr
 */

import { checkExercise } from "../src/features/scratchjr/sj-check";
import { SJ_EXERCISES } from "../src/features/scratchjr/exercises";
import {
  finalPosition,
  recordRun,
  runProject,
} from "../src/features/scratchjr/sj-engine";
import {
  sjCountBlocks,
  type SjBlock,
  type SjProject,
  type SjSprite,
  type SjTriggerKind,
} from "../src/features/scratchjr/sj-model";

const problems: string[] = [];
let checked = 0;

for (const ex of SJ_EXERCISES) {
  checked++;
  const where = `${ex.id} (${ex.lessonId})`;

  // A predict task has no blocks to write: its answer is wherever the printed
  // script lands, so what matters is that it lands somewhere worth naming.
  if (ex.predict) {
    const at = finalPosition(ex.project, ex.predict.sprite);
    const sprite = ex.project.sprites.find(
      (s) => s.id === ex.predict!.sprite || s.name === ex.predict!.sprite,
    );
    if (!sprite) {
      problems.push(`${where}: predicts about "${ex.predict.sprite}", who is not on the stage`);
      continue;
    }
    if (!sprite.scripts.length || !sprite.scripts[0].blocks.length) {
      problems.push(`${where}: the script the child is asked to read is empty`);
      continue;
    }
    if (at.x === sprite.home.x && at.y === sprite.home.y) {
      problems.push(`${where}: the printed script ends where it started, so there is nothing to work out`);
      continue;
    }
    console.log(`  ok  ${where} — the script lands on (${at.x}, ${at.y})`);
    continue;
  }

  if (sjCountBlocks(ex.worked) === 0) {
    problems.push(`${where}: the worked answer has no blocks in it`);
    continue;
  }

  // The answer must pass.
  const pass = checkExercise(ex, ex.worked);
  if (!pass.passed) {
    const failed = pass.trials
      .flatMap((t) => t.assertions.filter((a) => !a.passed))
      .map((a) => `${a.assertion.kind}: ${a.detail}`);
    problems.push(`${where}: the worked answer FAILS its own check — ${failed.join("; ")}`);
    continue;
  }

  // The starting point must fail, or the check is not checking anything.
  const before = checkExercise(ex, ex.project);
  if (before.passed) {
    problems.push(
      `${where}: the check already passes before the child writes anything`,
    );
    continue;
  }

  // A run that hits the step ceiling means a forever-loop the check cannot see
  // the end of; worth knowing about, not necessarily wrong.
  const run = recordRun(runProject(ex.worked));
  const note = run.stoppedBy === "limit" ? " (runs to the step ceiling)" : "";
  console.log(
    `  ok  ${where} — ${sjCountBlocks(ex.worked)} blocks, ${run.steps} steps${note}`,
  );
}

console.log(`\n${checked} ScratchJr tasks checked.`);

// ── Every block does what it says ───────────────────────────────────────────
//
// The tasks above only exercise the blocks Grade 1 uses. Grade 2's chapter
// adds the Tap and Bump triggers, Set Speed, Sound, the counted Repeat and
// Repeat Forever, and "the engine already carries them" is a claim worth
// testing rather than asserting.

const cat = (over: Partial<SjSprite> = {}): SjSprite => ({
  id: "a",
  name: "A",
  glyph: "cat",
  home: { x: 5, y: 8 },
  size: 100,
  flipped: false,
  scripts: [],
  ...over,
});

const blank = { id: "blank", name: "Blank", bands: [{ from: 0, to: 1, colour: "#fff" }] };

let n = 0;
const behaves = (
  what: string,
  project: SjProject,
  expect: (r: ReturnType<typeof recordRun>) => string | null,
  start: Parameters<typeof runProject>[1] = { kind: "flag" },
) => {
  n++;
  const complaint = expect(recordRun(runProject(project, start)));
  if (complaint) problems.push(`block behaviour — ${what}: ${complaint}`);
  else console.log(`  ok  ${what}`);
};

const only = (blocks: SjBlock[], trigger: SjTriggerKind = "on-flag"): SjProject => ({
  background: blank,
  sprites: [
    cat({
      scripts: [{ id: "s1", trigger: { id: "t1", kind: trigger }, blocks }],
    }),
  ],
});

const at = (r: ReturnType<typeof recordRun>) => {
  const s = r.sprites[0];
  return `(${s.finalX}, ${s.finalY})`;
};

behaves(
  "a counted Repeat runs its body that many times",
  only([{ id: "r", kind: "repeat", n: 3, body: [{ id: "m", kind: "move-right", n: 2 }] }]),
  (r) => (at(r) === "(11, 8)" ? null : `ended at ${at(r)}, expected (11, 8)`),
);

behaves(
  "Repeat Forever keeps going until the step ceiling",
  only([{ id: "f", kind: "repeat-forever", body: [{ id: "m", kind: "move-right", n: 1 }] }]),
  (r) => (r.stoppedBy === "limit" ? null : `stopped by ${r.stoppedBy}, expected the ceiling`),
);

behaves(
  "Hop goes up and comes back down",
  only([{ id: "h", kind: "hop", n: 3 }]),
  (r) => {
    const s = r.sprites[0];
    const high = Math.min(...s.path.map((p) => p.y));
    if (high !== 5) return `rose to row ${high}, expected row 5`;
    return at(r) === "(5, 8)" ? null : `landed at ${at(r)}, expected back at (5, 8)`;
  },
);

behaves(
  "Go Home returns to the starting square",
  only([{ id: "m", kind: "move-right", n: 6 }, { id: "g", kind: "go-home" }]),
  (r) => (at(r) === "(5, 8)" ? null : `ended at ${at(r)}, expected home at (5, 8)`),
);

behaves(
  "a sprite stops at the edge instead of walking off",
  only([{ id: "m", kind: "move-right", n: 40 }]),
  (r) => (at(r) === "(20, 8)" ? null : `ended at ${at(r)}, expected the right edge (20, 8)`),
);

behaves(
  "Stop ends the run there and then",
  only([
    { id: "m", kind: "move-right", n: 2 },
    { id: "x", kind: "stop" },
    { id: "m2", kind: "move-right", n: 5 },
  ]),
  (r) =>
    r.stoppedBy !== "stop-block"
      ? `stopped by ${r.stoppedBy}`
      : at(r) === "(7, 8)"
        ? null
        : `ended at ${at(r)}, expected (7, 8)`,
);

behaves(
  "Start on Tap runs only when that sprite is tapped",
  only([{ id: "m", kind: "move-right", n: 3 }], "on-tap"),
  (r) => (at(r) === "(5, 8)" ? null : `the flag ran an on-tap script — ended at ${at(r)}`),
);

behaves(
  "…and does run when it is tapped",
  only([{ id: "m", kind: "move-right", n: 3 }], "on-tap"),
  (r) => (at(r) === "(8, 8)" ? null : `ended at ${at(r)}, expected (8, 8)`),
  { kind: "tap", spriteId: "a" },
);

behaves(
  "Start on Bump fires when two sprites meet",
  {
    background: blank,
    sprites: [
      cat({
        id: "a",
        name: "A",
        home: { x: 2, y: 8 },
        scripts: [
          {
            id: "s1",
            trigger: { id: "t1", kind: "on-flag" },
            blocks: [{ id: "m", kind: "move-right", n: 8 }],
          },
        ],
      }),
      cat({
        id: "b",
        name: "B",
        glyph: "dog",
        home: { x: 9, y: 8 },
        scripts: [
          {
            id: "s2",
            trigger: { id: "t2", kind: "on-bump" },
            blocks: [{ id: "say", kind: "say", text: "Ouch!" }],
          },
        ],
      }),
    ],
  },
  (r) => {
    const b = r.sprites.find((s) => s.id === "b")!;
    return b.said.some((u) => u.text === "Ouch!")
      ? null
      : "B never reacted to being bumped";
  },
);

behaves(
  "Grow and Shrink move the size, and Reset Size puts it back",
  only([
    { id: "g", kind: "grow", n: 3 },
    { id: "s", kind: "shrink", n: 1 },
    { id: "r", kind: "reset-size" },
  ]),
  (r) => (r.sprites[0].finalSize === 100 ? null : `ended at ${r.sprites[0].finalSize}%`),
);

behaves(
  "Sound blocks are heard",
  only([{ id: "p", kind: "pop" }, { id: "q", kind: "play-sound", sound: "recording" }]),
  (r) => (r.sounds.length === 2 ? null : `${r.sounds.length} sounds heard, expected 2`),
);

behaves(
  "Set Speed does not change where a sprite ends up",
  only([
    { id: "sp", kind: "set-speed", speed: "fast" },
    { id: "m", kind: "move-right", n: 4 },
  ]),
  (r) => (at(r) === "(9, 8)" ? null : `ended at ${at(r)}, expected (9, 8)`),
);

console.log(`${n} block behaviours checked.`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}
console.log("Every worked answer passes, every check starts out failing, and every block behaves.");
