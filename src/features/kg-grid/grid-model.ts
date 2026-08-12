/**
 * The Kindergarten picture grid — "Moving the dog".
 *
 * This puzzle closes every lesson of Chapter 1, returns in Chapter 3, and is
 * the shape of most of Chapter 5. It is a four-year-old's first algorithm: put
 * arrows in the empty squares until the dog reaches its food.
 *
 * Everything here is pictures and arrows. A child using this cannot read, so
 * no part of the puzzle may depend on words — labels exist only for screen
 * readers and for the teacher.
 */

export type KgDirection = "up" | "down" | "left" | "right";

/** The small picture library. Drawn as SVG, never emoji — these get printed. */
export type KgGlyph =
  | "dog"
  | "bone"
  | "cat"
  | "ball"
  | "tree"
  | "house"
  | "star"
  | "flower"
  | "apple"
  | "fish"
  | "bird"
  | "duck"
  | "car"
  | "sun";

export interface KgCell {
  /** A picture sitting in this square, if any */
  glyph?: KgGlyph;
  /** The child cannot walk through this square */
  blocked?: boolean;
}

export interface KgPosition {
  x: number;
  y: number;
}

export type KgMode =
  /**
   * The book's own puzzle: the child places arrows in order until the
   * character reaches the goal, then presses play to watch it walk.
   */
  | "build-path"
  /**
   * Chapter 3's variant: the arrows are GIVEN, the path plays, and the child
   * taps the picture the character lands on.
   */
  | "follow-path";

export interface KgPuzzle {
  id: string;
  /** Lesson this puzzle belongs to, e.g. "g0-kc-02" */
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
  /** The character doing the walking */
  character: KgGlyph;
  /** Where it must arrive (build-path) */
  goal?: KgPosition;
  /** The arrows already given (follow-path) */
  given?: KgDirection[];
  /** How many arrow squares the child may fill (build-path) */
  slots?: number;
  /** Printed page this puzzle comes from, for the teacher */
  page?: string;
}

export const DELTA: Record<KgDirection, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** Walk a path from the start, stopping at walls and edges. */
export function walk(
  puzzle: KgPuzzle,
  path: KgDirection[],
): { positions: KgPosition[]; blockedAt: number | null } {
  const positions: KgPosition[] = [{ ...puzzle.start }];
  let current = { ...puzzle.start };
  for (let i = 0; i < path.length; i++) {
    const d = DELTA[path[i]];
    const next = { x: current.x + d.dx, y: current.y + d.dy };
    const off =
      next.x < 0 ||
      next.y < 0 ||
      next.x >= puzzle.width ||
      next.y >= puzzle.height;
    if (off || puzzle.cells[next.y]?.[next.x]?.blocked) {
      return { positions, blockedAt: i };
    }
    current = next;
    positions.push({ ...current });
  }
  return { positions, blockedAt: null };
}

export function reachesGoal(puzzle: KgPuzzle, path: KgDirection[]): boolean {
  if (!puzzle.goal) return false;
  const { positions, blockedAt } = walk(puzzle, path);
  if (blockedAt !== null) return false;
  const end = positions[positions.length - 1];
  return end.x === puzzle.goal.x && end.y === puzzle.goal.y;
}

/** Where a given path finishes — used by follow-path puzzles. */
export function landingGlyph(puzzle: KgPuzzle): KgGlyph | undefined {
  const { positions } = walk(puzzle, puzzle.given ?? []);
  const end = positions[positions.length - 1];
  return puzzle.cells[end.y]?.[end.x]?.glyph;
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
