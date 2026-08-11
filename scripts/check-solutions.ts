import { RB_EXERCISES, checkRun as rbCheckRun } from "../src/features/mbot/exercises";
import { simulateAll } from "../src/features/mbot/robot-engine";

/**
 * Every exercise ships a worked answer. This runs each one through its own
 * checker and fails if it does not pass.
 *
 *   npm run check:solutions
 *
 * The bug this exists to catch is a quiet one: a "Show me one answer" that does
 * not actually work. A student only sees it after exhausting the hints, which
 * is exactly the moment to be trustworthy. It caught the autonomous-car answer
 * turning right where the route needed left.
 *
 * Only the robot chapter is covered so far — its engine is pure logic and runs
 * under Node. The others drive their runtimes from browser timers, so they are
 * verified in the browser instead.
 */

let failures = 0;

console.log("\n  Worked answers — mBot2\n");

for (const exercise of RB_EXERCISES) {
  try {
    const runs = simulateAll(exercise.solution, exercise.check.trials);
    const result = rbCheckRun(exercise.check, runs);
    if (result.passed) {
      console.log(`    passes   ${exercise.title}`);
    } else {
      failures++;
      const why = result.trials
        .filter((t) => !t.passed)
        .flatMap((t) =>
          t.assertions.filter((a) => !a.passed).map((a) => `${t.label}: ${a.detail}`),
        );
      console.log(`    FAILS    ${exercise.title}`);
      for (const line of why.slice(0, 3)) console.log(`             ${line}`);
    }
  } catch (err) {
    failures++;
    console.log(`    ERROR    ${exercise.title}`);
    console.log(`             ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(
  `\n  ${RB_EXERCISES.length - failures}/${RB_EXERCISES.length} worked answers pass their own check.\n`,
);

process.exit(failures > 0 ? 1 : 0);
