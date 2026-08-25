/**
 * The picture-grid instrument for the early grades.
 *
 * It began as Kindergarten's "Moving the dog" — arrows in empty squares until
 * the dog reaches its bone — which closes every lesson of KG Chapter 1 and
 * returns in Chapter 3. Grade 1's Chapter 4 is the same apparatus grown up: a
 * 10×10 board, a robot going home, a fifth card that jumps over a cube, and
 * points collected along the route. So the model carries all of it rather than
 * a second instrument existing to do the same thing one size larger.
 *
 * Everything is pictures and arrows. A child using this may not read, so no
 * part of a puzzle may depend on words — text exists for screen readers and
 * for the teacher.
 */

export type KgDirection = "up" | "down" | "left" | "right";

/**
 * What a child can place. `jump` carries on in the direction of the card
 * before it, clearing the square in between — the book uses it exactly where a
 * route runs into a cube.
 */
export type KgCommand = KgDirection | "jump";

export const isDirection = (c: KgCommand): c is KgDirection => c !== "jump";

/** The small picture library. Drawn as SVG, never emoji — these get printed. */
export type KgGlyph =
  | "dog" | "bone" | "cat" | "ball" | "tree" | "house" | "star"
  | "flower" | "apple" | "fish" | "bird" | "duck" | "car" | "sun"
  | "robot" | "cube";

export interface KgCell {
  /** A picture sitting in this square, if any */
  glyph?: KgGlyph;
  /** The child cannot walk through this square — but may jump it */
  blocked?: boolean;
  /** Points collected by landing here (Grade 1 lesson 4) */
  points?: number;
}

export interface KgPosition {
  x: number;
  y: number;
}

export type KgMode =
  /** Place cards until the character reaches the goal. */
  | "build-path"
  /** The cards are given, the path plays, the child taps where it lands. */
  | "follow-path"
  /**
   * A route is drawn on the board and the child writes it out card by card.
   * The book's first programming lesson: read a path, transcribe it.
   */
  | "trace-path";

export interface KgPuzzle {
  id: string;
  /** Lesson this puzzle belongs to, e.g. "g1-al-03" */
  lessonId: string;
  /** For the teacher and the page header — never shown to the child as a task */
  title: string;
  /** Read aloud to the child; kept to one short sentence */
  spoken: string;
  mode: KgMode;
  width: number;
  height: number;
  /** Row-major: cells[y][x] */
  cells: KgCell[][];
  start: KgPosition;
  character: KgGlyph;
  /** Where it must arrive (build-path) */
  goal?: KgPosition;
  /** The cards already given (follow-path) */
  given?: KgCommand[];
  /** The route drawn on the board, which the child reproduces (trace-path) */
  route?: KgCommand[];
  /** How many cards the child may place */
  slots?: number;
  /** Offer the jump card (Grade 1 lesson 3 onward) */
  allowJump?: boolean;
  /** Show a running score (Grade 1 lesson 4) */
  scored?: boolean;
  /** Printed page this puzzle comes from, for the teacher */
  page?: string;
}

export const DELTA: Record<KgDirection, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface WalkResult {
  positions: KgPosition[];
  /** Index of the card that could not be carried out, if any */
  blockedAt: number | null;
  /** Points picked up along the way */
  score: number;
}

/**
 * Walk a path from the start. Stops at walls and edges; `jump` carries on in
 * the previous card's direction and clears the square between.
 */
export function walk(puzzle: KgPuzzle, path: KgCommand[]): WalkResult {
  const positions: KgPosition[] = [{ ...puzzle.start }];
  let current = { ...puzzle.start };
  let facing: KgDirection | null = null;
  let score = puzzle.cells[current.y]?.[current.x]?.points ?? 0;

  const inside = (p: KgPosition) =>
    p.x >= 0 && p.y >= 0 && p.x < puzzle.width && p.y < puzzle.height;

  for (let i = 0; i < path.length; i++) {
    const card = path[i];
    if (isDirection(card)) {
      facing = card;
      const d = DELTA[card];
      const next = { x: current.x + d.dx, y: current.y + d.dy };
      if (!inside(next) || puzzle.cells[next.y]?.[next.x]?.blocked) {
        return { positions, blockedAt: i, score };
      }
      current = next;
    } else {
      // A jump with no direction yet has nothing to carry on from.
      if (!facing) return { positions, blockedAt: i, score };
      const d = DELTA[facing];
      const over = { x: current.x + d.dx, y: current.y + d.dy };
      const land = { x: current.x + d.dx * 2, y: current.y + d.dy * 2 };
      if (!inside(land) || puzzle.cells[land.y]?.[land.x]?.blocked) {
        return { positions, blockedAt: i, score };
      }
      positions.push({ ...over });
      current = land;
    }
    positions.push({ ...current });
    score += puzzle.cells[current.y]?.[current.x]?.points ?? 0;
  }
  return { positions, blockedAt: null, score };
}

export function reachesGoal(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  if (!puzzle.goal) return false;
  const { positions, blockedAt } = walk(puzzle, path);
  if (blockedAt !== null) return false;
  const end = positions[positions.length - 1];
  return end.x === puzzle.goal.x && end.y === puzzle.goal.y;
}

/** Did the child write out the drawn route exactly? */
export function matchesRoute(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  const route = puzzle.route;
  if (!route) return false;
  return route.length === path.length && route.every((c, i) => c === path[i]);
}

/** Whether this path solves the puzzle, whichever kind it is. */
export function isSolved(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  return puzzle.mode === "trace-path"
    ? matchesRoute(puzzle, path)
    : reachesGoal(puzzle, path);
}

/** Where a given path finishes — used by follow-path puzzles. */
export function landingGlyph(puzzle: KgPuzzle): KgGlyph | undefined {
  const { positions } = walk(puzzle, puzzle.given ?? []);
  const end = positions[positions.length - 1];
  return puzzle.cells[end.y]?.[end.x]?.glyph;
}

/** The squares a drawn route passes through, for showing it on the board. */
export function routeCells(puzzle: KgPuzzle): KgPosition[] {
  return puzzle.route ? walk(puzzle, puzzle.route).positions : [];
}

/** Build an empty grid, then place pictures on it. */
export function grid(
  width: number,
  height: number,
  place: Partial<Record<string, KgCell>> = {},
): KgCell[][] {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => place[`${x},${y}`] ?? {}),
  );
}
