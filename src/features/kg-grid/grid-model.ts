/**
 * The picture-grid instrument for the early grades.
 *
 * One board runs three years of the book, because the book runs one board for
 * three years and grows it:
 *
 *   KG       arrows in empty squares until the dog reaches its bone
 *   Grade 1  a 10x10 board, a robot going home, a JUMP card for the cubes,
 *            and points on the squares
 *   Grade 2  the cat has a FACING — turn left, turn right, move forward — and
 *            its cards carry a step count, so "forward 3" is one card. Boards
 *            are addressed A-J down and 1-10 across, and a mission can name
 *            two goals to reach in order.
 *
 * Everything is pictures and cards. A child using the smallest version cannot
 * read, so no part of a puzzle may depend on words — text exists for screen
 * readers and for the teacher.
 */

export type KgDirection = "up" | "down" | "left" | "right";

/** How far one step card carries the character. The book prints 1, 2 and 3. */
export type KgCount = 1 | 2 | 3;

/**
 * What a child can place.
 *
 *   up/down/left/right  an absolute arrow — KG and Grade 1 throughout, and
 *                       Grade 2's square-drawing lesson, which goes back to
 *                       arrows because the child is drawing a shape
 *   jump                carries on in the last direction, clearing the square
 *                       between — Grade 1's cubes
 *   turn-left/right     rotates the facing without moving — Grade 2
 *   forward/back[:n]    moves along the facing, n squares in one card — the
 *                       bare form means one square
 */
export type KgStep = "forward" | "back" | `forward:${KgCount}` | `back:${KgCount}`;
export type KgTurn = "turn-left" | "turn-right";
export type KgCommand = KgDirection | "jump" | KgTurn | KgStep;

const DIRECTIONS: KgDirection[] = ["up", "down", "left", "right"];

export const isDirection = (c: KgCommand): c is KgDirection =>
  (DIRECTIONS as string[]).includes(c);

export const isTurn = (c: KgCommand): c is KgTurn =>
  c === "turn-left" || c === "turn-right";

export const isStep = (c: KgCommand): c is KgStep =>
  c.startsWith("forward") || c.startsWith("back");

/** "forward:3" → three squares along the facing. "back" → one square behind. */
export function readStep(card: KgStep): { move: "forward" | "back"; count: number } {
  const [move, count] = card.split(":") as ["forward" | "back", string | undefined];
  return { move, count: count ? Number(count) : 1 };
}

/** The picture library. Drawn as SVG, never emoji — these get printed. */
export type KgGlyph =
  | "dog" | "bone" | "cat" | "ball" | "tree" | "house" | "star"
  | "flower" | "apple" | "fish" | "bird" | "duck" | "car" | "sun"
  | "robot" | "cube" | "plate" | "monkey" | "balloon" | "bee";

export interface KgCell {
  /** A picture sitting in this square, if any */
  glyph?: KgGlyph;
  /** The child cannot walk through this square — but may jump it */
  blocked?: boolean;
  /** Points collected by landing here */
  points?: number;
  /**
   * The book colours its barrier and point squares, and a child matches the
   * screen to the page by colour before they match it by meaning.
   */
  tint?: "blue" | "green" | "red" | "yellow" | "magenta";
}

export interface KgPosition {
  x: number;
  y: number;
}

export type KgMode =
  /** Place cards until the character reaches the goal. */
  | "build-path"
  /** The cards are given, the path plays, the child taps the picture it lands on. */
  | "follow-path"
  /**
   * The cards are given and the child taps the SQUARE it lands on, reading the
   * answer off the board's addresses. Grade 2 asks for an address, not a
   * drawing.
   */
  | "find-square"
  /** A route is drawn on the board and the child writes it out card by card. */
  | "trace-path";

export interface KgPuzzle {
  id: string;
  /** Lesson this puzzle belongs to, e.g. "g2-al-04" */
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
  /** Which way the character starts looking. Only matters with turn cards. */
  facing?: KgDirection;
  /** Where it must arrive (build-path) */
  goal?: KgPosition;
  /**
   * Squares that must be visited, in this order, before the goal. Grade 2's
   * monkey goes to plate 1 and then on to plate 2 — one program, two errands.
   */
  waypoints?: KgPosition[];
  /** The cards already given (follow-path, find-square) */
  given?: KgCommand[];
  /** The route drawn on the board, which the child reproduces (trace-path) */
  route?: KgCommand[];
  /** How many cards the child may place */
  slots?: number;
  /** Offer the jump card */
  allowJump?: boolean;
  /**
   * Offer turn and step cards instead of absolute arrows. This is the Grade 2
   * board: the character has a facing and the child steers it.
   */
  relative?: boolean;
  /** Which step counts the cards offer. Defaults to 1, 2 and 3 on a relative board. */
  counts?: KgCount[];
  /** Show a running score */
  scored?: boolean;
  /** Letter the rows A, B, C… and number the columns 1, 2, 3… */
  addressed?: boolean;
  /** Printed page this puzzle comes from, for the teacher */
  page?: string;
}

export const DELTA: Record<KgDirection, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const LEFT_OF: Record<KgDirection, KgDirection> = {
  up: "left", left: "down", down: "right", right: "up",
};
const RIGHT_OF: Record<KgDirection, KgDirection> = {
  up: "right", right: "down", down: "left", left: "up",
};
const OPPOSITE: Record<KgDirection, KgDirection> = {
  up: "down", down: "up", left: "right", right: "left",
};

export interface WalkResult {
  /** Every square the character occupies, in order, including repeats on a turn */
  positions: KgPosition[];
  /** Which way it faces at each of those moments */
  facings: KgDirection[];
  /**
   * Points collected by each of those moments. The board shows a running
   * total, because the book has the child carry one along the cards — so the
   * score has to be known per frame, not only at the end.
   */
  scores: number[];
  /** Index of the card that could not be carried out, if any */
  blockedAt: number | null;
  /** Points picked up over the whole program */
  score: number;
}

/**
 * Run a program from the start square.
 *
 * Stops at walls and edges. A turn card takes a beat but no ground, so it adds
 * a repeated position — the animation needs the character to visibly turn
 * before it walks.
 */
export function walk(puzzle: KgPuzzle, path: KgCommand[]): WalkResult {
  const positions: KgPosition[] = [{ ...puzzle.start }];
  let facing: KgDirection = puzzle.facing ?? "right";
  const facings: KgDirection[] = [facing];
  let current = { ...puzzle.start };
  // A square is only scored once, or a child could pace back and forth on it.
  const collected = new Set<string>();

  const inside = (p: KgPosition) =>
    p.x >= 0 && p.y >= 0 && p.x < puzzle.width && p.y < puzzle.height;

  let score = 0;
  const collect = (p: KgPosition) => {
    const key = `${p.x},${p.y}`;
    if (collected.has(key)) return;
    collected.add(key);
    score += puzzle.cells[p.y]?.[p.x]?.points ?? 0;
  };
  collect(current);
  const scores: number[] = [score];

  /** Record a frame: same square on a turn, a new one on a move. */
  const mark = (p: KgPosition) => {
    positions.push({ ...p });
    facings.push(facing);
    scores.push(score);
  };

  const arrive = (p: KgPosition) => {
    current = p;
    collect(p);
    mark(p);
  };

  const stop = (i: number): WalkResult => ({
    positions, facings, scores, blockedAt: i, score,
  });

  for (let i = 0; i < path.length; i++) {
    const card = path[i];

    if (isTurn(card)) {
      facing = card === "turn-left" ? LEFT_OF[facing] : RIGHT_OF[facing];
      // Same square, new facing: a beat the child can see.
      mark(current);
      continue;
    }

    if (isDirection(card)) {
      facing = card;
      const d = DELTA[card];
      const next = { x: current.x + d.dx, y: current.y + d.dy };
      if (!inside(next) || puzzle.cells[next.y]?.[next.x]?.blocked) return stop(i);
      arrive(next);
      continue;
    }

    if (card === "jump") {
      const d = DELTA[facing];
      const over = { x: current.x + d.dx, y: current.y + d.dy };
      const land = { x: current.x + d.dx * 2, y: current.y + d.dy * 2 };
      // There has to be something to jump. Without this the card is just a
      // two-square move, and the lesson it belongs to — put JUMP exactly where
      // the cube is — has nothing left to teach.
      if (!inside(over) || !puzzle.cells[over.y]?.[over.x]?.blocked) return stop(i);
      if (!inside(land) || puzzle.cells[land.y]?.[land.x]?.blocked) return stop(i);
      // The square being cleared is a frame too, so the hop is visible.
      mark(over);
      arrive(land);
      continue;
    }

    // A step card: several squares along the facing, one square at a time, so
    // a wall halfway through stops it rather than being stepped over.
    const { move, count } = readStep(card);
    const d = DELTA[move === "forward" ? facing : OPPOSITE[facing]];
    for (let n = 0; n < count; n++) {
      const next = { x: current.x + d.dx, y: current.y + d.dy };
      if (!inside(next) || puzzle.cells[next.y]?.[next.x]?.blocked) return stop(i);
      arrive(next);
    }
  }

  return { positions, facings, scores, blockedAt: null, score };
}

/** The squares walked, with the standing-still beats of turns removed. */
export function route(result: WalkResult): KgPosition[] {
  return result.positions.filter(
    (p, i, all) => i === 0 || p.x !== all[i - 1].x || p.y !== all[i - 1].y,
  );
}

export function reachesGoal(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  if (!puzzle.goal) return false;
  const result = walk(puzzle, path);
  if (result.blockedAt !== null) return false;

  const walked = route(result);
  const end = walked[walked.length - 1];
  if (end.x !== puzzle.goal.x || end.y !== puzzle.goal.y) return false;

  // Waypoints must be called at, in order, on the way.
  let from = 0;
  for (const stop of puzzle.waypoints ?? []) {
    const found = walked.findIndex(
      (p, i) => i >= from && p.x === stop.x && p.y === stop.y,
    );
    if (found === -1) return false;
    from = found;
  }
  return true;
}

/**
 * Did the child write out the drawn route?
 *
 * Judged on where the character goes, not on which cards say so: on a Grade 2
 * board "forward 2" and two "forward 1" cards walk the same squares, and both
 * are a correct reading of the same drawn line.
 */
export function matchesRoute(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  if (!puzzle.route) return false;
  const mine = walk(puzzle, path);
  if (mine.blockedAt !== null) return false;
  const theirs = route(walk(puzzle, puzzle.route));
  const walked = route(mine);
  return (
    walked.length === theirs.length &&
    walked.every((p, i) => p.x === theirs[i].x && p.y === theirs[i].y)
  );
}

/** Whether this path solves the puzzle, whichever kind it is. */
export function isSolved(puzzle: KgPuzzle, path: KgCommand[]): boolean {
  return puzzle.mode === "trace-path"
    ? matchesRoute(puzzle, path)
    : reachesGoal(puzzle, path);
}

/** Where a given program finishes — used by follow-path and find-square. */
export function landingSquare(puzzle: KgPuzzle): KgPosition {
  const walked = route(walk(puzzle, puzzle.given ?? []));
  return walked[walked.length - 1];
}

export function landingGlyph(puzzle: KgPuzzle): KgGlyph | undefined {
  const at = landingSquare(puzzle);
  return puzzle.cells[at.y]?.[at.x]?.glyph;
}

/** The squares a drawn route passes through, for showing it on the board. */
export function routeCells(puzzle: KgPuzzle): KgPosition[] {
  return puzzle.route ? route(walk(puzzle, puzzle.route)) : [];
}

/** "C4" — row letter, column number, the way the book writes an address. */
export function addressOf(p: KgPosition): string {
  return `${String.fromCharCode(65 + p.y)}${p.x + 1}`;
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
