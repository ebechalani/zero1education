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
import { sjCountBlocks } from "../src/features/scratchjr/sj-model";

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
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}
console.log("Every worked answer passes, and every check starts out failing.");
