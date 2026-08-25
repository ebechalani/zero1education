/**
 * Every picture-grid board must actually be solvable.
 *
 * A wrong page number sends a child to the wrong spread; an unsolvable board
 * sends them nowhere at all, and a six-year-old will assume they are the one
 * who is wrong. So each board is checked here the way the app checks a child —
 * by search over the same cards the board offers, through the same walk the
 * app runs:
 *
 *   trace-path    the drawn route must run clean and satisfy the checker
 *   build-path    a search must reach the goal, calling at every waypoint in
 *                 order, inside the card allowance
 *   follow-path   the given cards must run clean and land on a picture
 *   find-square   the given cards must run clean and land somewhere nameable
 *
 *   npm run check:grids
 */

import {
  addressOf,
  isSolved,
  landingGlyph,
  landingSquare,
  reachesGoal,
  walk,
  type KgCommand,
  type KgCount,
  type KgPuzzle,
} from "../src/features/kg-grid/grid-model";
import { ALL_GRID_PUZZLES } from "../src/features/kg-grid/puzzles";

/** The cards this board actually offers a child. */
function deck(puzzle: KgPuzzle): KgCommand[] {
  const counts: KgCount[] = puzzle.counts ?? [1, 2, 3];
  const cards: KgCommand[] = puzzle.relative
    ? [
        "turn-left",
        "turn-right",
        ...counts.map((n) => (n === 1 ? "forward" : `forward:${n}`) as KgCommand),
        ...counts.map((n) => (n === 1 ? "back" : `back:${n}`) as KgCommand),
      ]
    : ["up", "down", "left", "right"];
  if (puzzle.allowJump) cards.push("jump");
  return cards;
}

/**
 * Shortest program that solves the board, or null if there is none.
 *
 * State is the square, the facing and how many waypoints have been called at,
 * because all three change what a card does next.
 */
function solve(puzzle: KgPuzzle): KgCommand[] | null {
  if (!puzzle.goal) return null;
  const limit = puzzle.slots ?? 6;
  const cards = deck(puzzle);

  const key0 = `${puzzle.start.x},${puzzle.start.y},${puzzle.facing ?? "right"},0`;
  const queue: { path: KgCommand[]; key: string }[] = [{ path: [], key: key0 }];
  const seen = new Set([key0]);

  while (queue.length) {
    const { path } = queue.shift()!;
    if (path.length >= limit) continue;
    for (const card of cards) {
      const next = [...path, card];
      const result = walk(puzzle, next);
      if (result.blockedAt !== null) continue;
      if (reachesGoal(puzzle, next)) return next;

      const at = result.positions[result.positions.length - 1];
      const facing = result.facings[result.facings.length - 1];
      // How far along the errand list this program has got.
      let done = 0;
      for (const w of puzzle.waypoints ?? []) {
        if (result.positions.some((p) => p.x === w.x && p.y === w.y)) done++;
        else break;
      }
      const key = `${at.x},${at.y},${facing},${done}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ path: next, key });
    }
  }
  return null;
}

/**
 * On a scored board, every points square has to be worth going to. Rather than
 * a second search, this runs the real search on a copy of the board whose goal
 * is that square, then from there to the real goal.
 */
function strandedPoints(puzzle: KgPuzzle): string[] {
  const limit = puzzle.slots ?? 6;
  const out: string[] = [];
  puzzle.cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (!cell.points || !puzzle.goal) return;
      const toIt = solve({
        ...puzzle,
        goal: { x, y },
        waypoints: undefined,
        slots: limit,
      });
      if (!toIt) {
        out.push(`the ${cell.points}-point square at ${addressOf({ x, y })}`);
        return;
      }
      const after = walk(puzzle, toIt);
      const onward = solve({
        ...puzzle,
        start: { x, y },
        facing: after.facings[after.facings.length - 1],
        waypoints: undefined,
        slots: limit - toIt.length,
      });
      if (!onward) {
        out.push(`the ${cell.points}-point square at ${addressOf({ x, y })}`);
      }
    }),
  );
  return out;
}

const problems: string[] = [];
let checked = 0;

for (const puzzle of ALL_GRID_PUZZLES) {
  checked++;
  const where = `${puzzle.id} (${puzzle.lessonId})`;

  if (puzzle.mode === "trace-path") {
    if (!puzzle.route?.length) {
      problems.push(`${where}: trace-path board with no route drawn on it`);
      continue;
    }
    const run = walk(puzzle, puzzle.route);
    if (run.blockedAt !== null) {
      problems.push(
        `${where}: the drawn route hits a wall at card ${run.blockedAt + 1} (${puzzle.route[run.blockedAt]})`,
      );
      continue;
    }
    if (!isSolved(puzzle, puzzle.route)) {
      problems.push(`${where}: the drawn route is not accepted by the checker`);
      continue;
    }
    if (puzzle.route.length > (puzzle.slots ?? 6)) {
      problems.push(
        `${where}: route needs ${puzzle.route.length} cards but only ${puzzle.slots ?? 6} fit`,
      );
      continue;
    }
    console.log(`  ok  ${where} — ${puzzle.route.length} cards to trace`);
    continue;
  }

  if (puzzle.mode === "follow-path" || puzzle.mode === "find-square") {
    const given = puzzle.given ?? [];
    if (!given.length) {
      problems.push(`${where}: board with no cards given`);
      continue;
    }
    const run = walk(puzzle, given);
    if (run.blockedAt !== null) {
      problems.push(
        `${where}: the given cards hit a wall at card ${run.blockedAt + 1} (${given[run.blockedAt]})`,
      );
      continue;
    }
    const at = landingSquare(puzzle);
    if (at.x === puzzle.start.x && at.y === puzzle.start.y) {
      problems.push(`${where}: the given cards end where they started`);
      continue;
    }
    if (puzzle.mode === "find-square") {
      console.log(`  ok  ${where} — lands on ${addressOf(at)}`);
      continue;
    }
    const glyph = landingGlyph(puzzle);
    if (!glyph) {
      problems.push(
        `${where}: lands on an empty square, so there is no picture to tap`,
      );
      continue;
    }
    console.log(`  ok  ${where} — lands on the ${glyph}`);
    continue;
  }

  // build-path
  if (!puzzle.goal) {
    problems.push(`${where}: build-path board with no goal`);
    continue;
  }
  const answer = solve(puzzle);
  if (!answer) {
    problems.push(
      `${where}: no program reaches the goal within ${puzzle.slots ?? 6} cards`,
    );
    continue;
  }
  let extra = "";
  if (puzzle.scored) {
    const stranded = strandedPoints(puzzle);
    if (stranded.length) {
      problems.push(`${where}: cannot reach ${stranded.join(", ")} and still get home`);
      continue;
    }
    const total = puzzle.cells.flat().reduce((n, c) => n + (c.points ?? 0), 0);
    extra = `, all ${total} points are collectible`;
  }
  if (puzzle.waypoints?.length) {
    extra += `, calling at ${puzzle.waypoints.map(addressOf).join(" then ")}`;
  }
  console.log(`  ok  ${where} — solvable in ${answer.length} cards${extra}`);
}

console.log(`\n${checked} boards checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}
console.log("Every board is solvable.");
