import { grid, type KgPuzzle } from "./grid-model";

/**
 * Grade 1, Chapter 4 — "Algorithms".
 *
 * The same board as Kindergarten's dog, one year on: ten squares by ten, a
 * robot instead of a dog, and a house to get home to. The chapter adds three
 * things across its first five lessons, and each is a real idea rather than a
 * decoration —
 *
 *   L1  the route is already drawn, and the child transcribes it (trace-path)
 *   L2  the route is a square, so the same card repeats four times — a loop,
 *       before the word exists
 *   L3  cubes block the way and a fifth card, JUMP, clears them
 *   L4  numbers sit on the squares and the route becomes a choice, not just a
 *       path: the child carries a running total
 *   L5  the child invents a route of their own
 *
 * Lessons 6 onward leave paper for Blockly Games and GCompris, which are the
 * real applications and are not simulated here.
 */

const G1_GRID = 10;

export const GRADE_1_PUZZLES: KgPuzzle[] = [
  // ── L1 · read the drawn route and write it out ────────────────────────────
  {
    id: "g1-robot-1",
    lessonId: "g1-al-01",
    title: "Controlling the movement of the robot",
    spoken: "The robot's way home is drawn. Write it with the arrow cards.",
    mode: "trace-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, { "7,3": { glyph: "house" } }),
    start: { x: 1, y: 8 },
    character: "robot",
    route: [
      "right", "right", "right",
      "up", "up",
      "right", "right", "right",
      "up", "up", "up",
    ],
    slots: 14,
    page: "42-43",
  },

  // ── L2 · the route is a shape, so the cards repeat ────────────────────────
  {
    id: "g1-robot-square",
    lessonId: "g1-al-02",
    title: "Drawing a square",
    spoken: "The robot walks a square. Write every step, then count them.",
    mode: "trace-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID),
    start: { x: 2, y: 7 },
    character: "robot",
    route: [
      "right", "right", "right", "right",
      "up", "up", "up", "up",
      "left", "left", "left", "left",
      "down", "down", "down", "down",
    ],
    slots: 20,
    page: "44-45",
  },
  {
    id: "g1-robot-rectangle",
    lessonId: "g1-al-02",
    title: "Drawing a rectangle",
    spoken: "Now a rectangle. How many times does each arrow repeat?",
    mode: "trace-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID),
    start: { x: 1, y: 6 },
    character: "robot",
    route: [
      "right", "right", "right", "right", "right", "right",
      "up", "up", "up",
      "left", "left", "left", "left", "left", "left",
      "down", "down", "down",
    ],
    slots: 22,
    page: "44-45",
  },

  // ── L3 · cubes in the way, and the JUMP card ──────────────────────────────
  {
    id: "g1-robot-jump-1",
    lessonId: "g1-al-03",
    title: "Jumping the first cube",
    spoken: "A cube is in the way. Use JUMP to go over it.",
    mode: "build-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, {
      "3,5": { glyph: "cube", blocked: true },
      "6,5": { glyph: "cube", blocked: true },
      "9,5": { glyph: "house" },
    }),
    start: { x: 0, y: 5 },
    character: "robot",
    goal: { x: 9, y: 5 },
    allowJump: true,
    slots: 12,
    page: "46-47",
  },
  {
    id: "g1-robot-jump-2",
    lessonId: "g1-al-03",
    title: "Cubes on a turning path",
    spoken: "Go around the corner and jump the cubes on the way.",
    mode: "build-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, {
      "2,8": { glyph: "cube", blocked: true },
      "4,5": { glyph: "cube", blocked: true },
      "4,6": { glyph: "cube", blocked: true },
      "7,2": { glyph: "house" },
    }),
    start: { x: 0, y: 8 },
    character: "robot",
    goal: { x: 7, y: 2 },
    allowJump: true,
    slots: 16,
    page: "46-47",
  },

  // ── L4 · the route becomes a choice, and the points are counted ───────────
  {
    id: "g1-robot-points",
    lessonId: "g1-al-04",
    title: "Collecting points",
    spoken: "Take the robot home. Pick up as many points as you can.",
    mode: "build-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, {
      "2,8": { points: 1 },
      "4,8": { points: 2 },
      "4,5": { points: 3 },
      "7,5": { points: 2 },
      "7,2": { points: 1 },
      "8,1": { glyph: "house" },
    }),
    start: { x: 0, y: 8 },
    character: "robot",
    goal: { x: 8, y: 1 },
    scored: true,
    slots: 18,
    page: "48-49",
  },

  // ── L5 · read a given program, then write one of your own ─────────────────
  {
    id: "g1-robot-read",
    lessonId: "g1-al-05",
    title: "Where does this program end?",
    spoken: "Watch the robot run the program. Tap the picture it stops on.",
    mode: "follow-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, {
      "0,0": { glyph: "star" },
      "9,0": { glyph: "tree" },
      "9,9": { glyph: "house" },
      "0,9": { glyph: "apple" },
      "5,4": { glyph: "flower" },
    }),
    start: { x: 5, y: 8 },
    character: "robot",
    given: ["up", "up", "up", "up"],
    page: "50-51",
  },
  {
    id: "g1-robot-free",
    lessonId: "g1-al-05",
    title: "Make your own path",
    spoken: "Choose your own way home. Any path that gets there is right.",
    mode: "build-path",
    width: G1_GRID,
    height: G1_GRID,
    cells: grid(G1_GRID, G1_GRID, {
      "9,0": { glyph: "house" },
      "4,4": { glyph: "cube", blocked: true },
      "5,4": { glyph: "cube", blocked: true },
    }),
    start: { x: 0, y: 9 },
    character: "robot",
    goal: { x: 9, y: 0 },
    allowJump: true,
    slots: 24,
    page: "50-51",
  },
];
