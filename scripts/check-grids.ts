/**
 * Every picture-grid board must actually be solvable.
 *
 * A wrong page number sends a child to the wrong spread; an unsolvable board
 * sends them nowhere at all, and a six-year-old will assume they are the one
 * who is wrong. So each board is checked here the way the app checks a child:
 *
 *   trace-path   the drawn route must run without hitting a wall, and must be
 *                accepted by the checker the child's cards go through
 *   build-path   a breadth-first search must find a route to the goal inside
 *                the card allowance
 *   follow-path  the given cards must run clean and land on a picture, since
 *                the child is asked to tap the picture it lands on
 *
 *   npx tsx scripts/check-grids.ts
 */

import {
  isSolved,
  landingGlyph,
  walk,
  type KgCommand,
  type KgPuzzle,
} from "../src/features/kg-grid/grid-model";
import { ALL_GRID_PUZZLES } from "../src/features/kg-grid/puzzles";

/**
 * Shortest card sequence from `from` to `target`, or null if there is none.
 * State carries the facing as well as the square, because JUMP continues in
 * the direction of the card before it.
 */
function solve(
  puzzle: KgPuzzle,
  target: { x: number; y: number },
  from = puzzle.start,
  limit = puzzle.slots ?? 6,
): KgCommand[] | null {
  const board = { ...puzzle, start: from };
  const cards: KgCommand[] = puzzle.allowJump
    ? ["up", "down", "left", "right", "jump"]
    : ["up", "down", "left", "right"];

  if (from.x === target.x && from.y === target.y) return [];

  const startKey = `${from.x},${from.y},none`;
  const queue: { path: KgCommand[]; key: string }[] = [{ path: [], key: startKey }];
  const seen = new Set([startKey]);

  while (queue.length) {
    const { path } = queue.shift()!;
    if (path.length >= limit) continue;
    for (const card of cards) {
      const next = [...path, card];
      const result = walk(board, next);
      if (result.blockedAt !== null) continue;
      const at = result.positions[result.positions.length - 1];
      if (at.x === target.x && at.y === target.y) return next;
      const facing = [...next].reverse().find((c) => c !== "jump") ?? "none";
      const key = `${at.x},${at.y},${facing}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ path: next, key });
    }
  }
  return null;
}

/**
 * On a scored board, every points square has to be worth going to: reachable
 * on the way to the goal inside the card allowance. A square nobody can afford
 * to visit is a promise the board does not keep.
 */
function unreachablePoints(puzzle: KgPuzzle): string[] {
  const limit = puzzle.slots ?? 6;
  const out: string[] = [];
  puzzle.cells.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (!cell.points || !puzzle.goal) return;
      const toIt = solve(puzzle, { x, y }, puzzle.start, limit);
      const onward = toIt && solve(puzzle, puzzle.goal, { x, y }, limit - toIt.length);
      if (!toIt || !onward) {
        out.push(`the ${cell.points}-point square at ${x},${y}`);
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
    }
    console.log(`  ok  ${where} — ${puzzle.route.length} cards`);
    continue;
  }

  if (puzzle.mode === "follow-path") {
    const given = puzzle.given ?? [];
    if (!given.length) {
      problems.push(`${where}: follow-path board with no cards given`);
      continue;
    }
    const run = walk(puzzle, given);
    if (run.blockedAt !== null) {
      problems.push(`${where}: the given cards hit a wall at card ${run.blockedAt + 1}`);
      continue;
    }
    const glyph = landingGlyph(puzzle);
    if (!glyph) {
      problems.push(`${where}: the robot lands on an empty square, so there is nothing to tap`);
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
  const answer = solve(puzzle, puzzle.goal);
  if (!answer) {
    problems.push(
      `${where}: no route reaches the goal within ${puzzle.slots ?? 6} cards`,
    );
    continue;
  }
  let extra = "";
  if (puzzle.scored) {
    const stranded = unreachablePoints(puzzle);
    if (stranded.length) {
      problems.push(`${where}: cannot reach ${stranded.join(", ")} and still get home`);
      continue;
    }
    const total = puzzle.cells.flat().reduce((n, c) => n + (c.points ?? 0), 0);
    extra = `, all ${total} points are collectible`;
  }
  console.log(`  ok  ${where} — solvable in ${answer.length} cards${extra}`);
}

console.log(`\n${checked} boards checked.`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("Every board is solvable.");
