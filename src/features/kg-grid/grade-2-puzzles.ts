import { grid, type KgCell, type KgPuzzle } from "./grid-model";

/**
 * Grade 2, Chapter 3 — "Programming with algorithms".
 *
 * The board a seven-year-old gets is the same board they had at four, and the
 * three things the chapter adds are all real ideas:
 *
 *   L3  the cat has a FACING. Turn left, turn right, move forward — so a
 *       program is no longer a list of directions but a list of instructions
 *       given to something that is looking somewhere.
 *   L4  addresses (A-J down, 1-10 across) and cards worth 2 or 3 squares. The
 *       answer to a program becomes a place you can name.
 *   L5  points against a move budget, so the route is a decision; then the
 *       square, drawn with absolute arrows, whose four identical sides are
 *       the chapter's first loop.
 *   L6  two errands in order: reach plate 1, then plate 2.
 *
 * Lessons 1, 2, 8 and 9 are off the board — hardware and software, folding a
 * paper airplane, and Blockly Games — and are not simulated. Lesson 7 puts two
 * characters with two programs on one board, which this instrument does not do
 * and which is noted rather than faked.
 *
 * Square positions vary page to page in print; these are laid out to give the
 * same journey rather than to claim pixel fidelity with a scanned page.
 */

const N = 10;

/** The book's coloured barrier squares: they stop the cat and they are shown. */
const wall = (tint: KgCell["tint"]): KgCell => ({ blocked: true, tint });

export const GRADE_2_PUZZLES: KgPuzzle[] = [
  // ── L3 · the cat turns and moves forward ──────────────────────────────────
  {
    id: "g2-cat-1",
    lessonId: "g2-al-03",
    title: "The cat and its plate — first program",
    spoken: "Turn the cat and move it forward until it reaches the plate.",
    mode: "build-path",
    width: N,
    height: N,
    cells: grid(N, N, {
      "3,3": wall("blue"),
      "7,7": wall("blue"),
      "5,5": { glyph: "plate" },
    }),
    start: { x: 1, y: 7 },
    character: "cat",
    facing: "right",
    goal: { x: 5, y: 5 },
    relative: true,
    counts: [1],
    slots: 12,
    page: "30-31",
  },
  {
    id: "g2-cat-2",
    lessonId: "g2-al-03",
    title: "Boxed in on both sides",
    spoken: "Blue squares are on both sides. Find the way out to the plate.",
    mode: "build-path",
    width: N,
    height: N,
    cells: grid(N, N, {
      "0,6": wall("blue"),
      "2,6": wall("blue"),
      "2,5": wall("blue"),
      "2,4": wall("blue"),
      "5,4": wall("blue"),
      "5,3": wall("blue"),
      "7,2": { glyph: "plate" },
    }),
    start: { x: 1, y: 6 },
    character: "cat",
    facing: "up",
    goal: { x: 7, y: 2 },
    relative: true,
    counts: [1],
    slots: 17,
    page: "32-33",
  },

  // ── L4 · addresses, and cards worth more than one square ──────────────────
  {
    id: "g2-cat-address",
    lessonId: "g2-al-04",
    title: "Where does the cat stop?",
    spoken: "Watch the program run, then tap the square the cat stops on.",
    mode: "find-square",
    width: 7,
    height: 7,
    cells: grid(7, 7, { "5,2": { glyph: "plate", tint: "green" } }),
    start: { x: 1, y: 6 },
    character: "cat",
    facing: "up",
    given: ["forward:3", "turn-right", "forward:2", "turn-left", "forward"],
    relative: true,
    addressed: true,
    page: "34-35",
  },
  {
    id: "g2-cat-3",
    lessonId: "g2-al-04",
    title: "Across the long green wall",
    spoken: "A long wall blocks the way. Take the cat around it to the plate.",
    mode: "build-path",
    width: N,
    height: N,
    cells: grid(N, N, {
      "3,2": wall("yellow"),
      "5,4": wall("red"),
      "6,8": wall("blue"),
      // The book's green wall filling most of one row.
      "2,7": wall("green"),
      "3,7": wall("green"),
      "4,7": wall("green"),
      "5,7": wall("green"),
      "6,7": wall("green"),
      "7,7": wall("green"),
      "8,7": wall("green"),
      "9,7": wall("green"),
      "5,5": { glyph: "plate" },
    }),
    start: { x: 8, y: 8 },
    character: "cat",
    facing: "left",
    goal: { x: 5, y: 5 },
    relative: true,
    addressed: true,
    slots: 17,
    page: "36-37",
  },

  // ── L5 · points against a budget, then the square that repeats ────────────
  {
    id: "g2-cat-points",
    lessonId: "g2-al-05",
    title: "Collecting points on the way",
    spoken: "Take the cat to the plate and pick up as many points as you can.",
    mode: "build-path",
    width: N,
    height: N,
    cells: grid(N, N, {
      "2,7": { points: 1 },
      "4,4": { points: 6 },
      "7,6": { points: 1 },
      "8,2": { points: 2 },
      "1,3": wall("yellow"),
      "6,3": wall("green"),
      "3,8": wall("red"),
      "7,4": wall("blue"),
      "8,1": { glyph: "plate" },
    }),
    start: { x: 0, y: 8 },
    character: "cat",
    facing: "right",
    goal: { x: 8, y: 1 },
    relative: true,
    scored: true,
    addressed: true,
    slots: 14,
    page: "38-39",
  },
  {
    id: "g2-cat-square",
    lessonId: "g2-al-05",
    title: "Walking a square",
    spoken: "Walk the cat around the square. Watch what repeats.",
    mode: "trace-path",
    width: N,
    height: N,
    cells: grid(N, N),
    start: { x: 2, y: 7 },
    character: "cat",
    // Absolute arrows: the child is drawing a shape, not steering.
    route: [
      "right", "right", "right", "right",
      "up", "up", "up", "up",
      "left", "left", "left", "left",
      "down", "down", "down", "down",
    ],
    slots: 28,
    page: "40-41",
  },

  // ── L6 · two errands, in order ────────────────────────────────────────────
  {
    id: "g2-monkey-plates",
    lessonId: "g2-al-06",
    title: "Plate 1, then plate 2",
    spoken: "Take the monkey to plate one first, and then to plate two.",
    mode: "build-path",
    width: N,
    height: N,
    cells: grid(N, N, {
      "8,5": { glyph: "plate" },
      "2,3": { glyph: "plate" },
      "5,5": wall("blue"),
      "5,4": wall("blue"),
    }),
    start: { x: 9, y: 1 },
    character: "monkey",
    facing: "left",
    goal: { x: 2, y: 3 },
    // Numbered on the board: call at plate 1 before finishing at plate 2.
    waypoints: [{ x: 8, y: 5 }],
    relative: true,
    addressed: true,
    slots: 21,
    page: "42-43",
  },
];

/**
 * Grade 2, Chapter 4 — the two ScratchJr lessons that are grid work.
 *
 * The book's ScratchJr grid is 20 x 15 with a sprite on a named square and a
 * row of picture blocks carrying a repeat count. That is this instrument with
 * counted cards, so those pages run here; the chapter's other eight lessons
 * are ScratchJr project builds and still have no instrument.
 */
export const GRADE_2_SCRATCHJR_PUZZLES: KgPuzzle[] = [
  {
    id: "g2-sprite-read",
    lessonId: "g2-sc-03",
    title: "Reading a script on the grid",
    spoken: "Watch the blocks move the cat, then tap the square it lands on.",
    mode: "find-square",
    width: 10,
    height: 8,
    cells: grid(10, 8),
    start: { x: 1, y: 6 },
    character: "cat",
    facing: "right",
    given: ["forward:3", "turn-left", "forward:2", "forward:2"],
    relative: true,
    addressed: true,
    page: "48-49",
  },
  {
    id: "g2-sprite-write",
    lessonId: "g2-sc-09",
    title: "Writing the script yourself",
    spoken: "The square is marked. Build the blocks that take the cat there.",
    mode: "build-path",
    width: 10,
    height: 8,
    cells: grid(10, 8, { "7,1": { glyph: "star", tint: "yellow" } }),
    start: { x: 0, y: 7 },
    character: "cat",
    facing: "right",
    goal: { x: 7, y: 1 },
    relative: true,
    addressed: true,
    slots: 12,
    page: "60-61",
  },
];
