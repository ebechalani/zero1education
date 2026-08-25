import { GRADE_1_PUZZLES } from "./grade-1-puzzles";
import {
  GRADE_2_PUZZLES,
  GRADE_2_SCRATCHJR_PUZZLES,
} from "./grade-2-puzzles";
import { grid, type KgPuzzle } from "./grid-model";

/**
 * The book's own picture-grid puzzles.
 *
 * "Moving the dog" closes every lesson of Chapter 1 and returns in Chapter 3.
 * The book draws a grid, puts the dog on one square and its food on another,
 * and leaves empty squares for the child to fill with arrows. Chapter 3's
 * version flips it: the arrows are given, and the child says where the dog
 * lands.
 *
 * The grids below follow the book's shape — same idea, same four arrows, same
 * one-picture-per-square. Exact square positions vary page to page in print;
 * these are laid out to give the same journey rather than to claim pixel
 * fidelity with a scanned page.
 */
export const KG_PUZZLES: KgPuzzle[] = [
  // ── Chapter 1 · every lesson ends with one of these ───────────────────────
  {
    id: "kg-dog-1",
    lessonId: "g0-kc-02",
    title: "Moving the dog — first path",
    spoken: "Help the dog reach its bone. Tap the arrows.",
    mode: "build-path",
    width: 5,
    height: 3,
    cells: grid(5, 3, { "4,0": { glyph: "bone" } }),
    start: { x: 0, y: 0 },
    character: "dog",
    goal: { x: 4, y: 0 },
    slots: 6,
    page: "6-7",
  },
  {
    id: "kg-dog-2",
    lessonId: "g0-kc-03",
    title: "Moving the dog — around the corner",
    spoken: "The bone is down there. Show the dog the way.",
    mode: "build-path",
    width: 5,
    height: 4,
    cells: grid(5, 4, { "3,3": { glyph: "bone" } }),
    start: { x: 0, y: 0 },
    character: "dog",
    goal: { x: 3, y: 3 },
    slots: 8,
    page: "8-9",
  },
  {
    id: "kg-dog-3",
    lessonId: "g0-kc-04",
    title: "Moving the dog — past the tree",
    spoken: "A tree is in the way. Take the dog around it.",
    mode: "build-path",
    width: 5,
    height: 4,
    cells: grid(5, 4, {
      "2,1": { glyph: "tree", blocked: true },
      "2,2": { glyph: "tree", blocked: true },
      "4,3": { glyph: "bone" },
    }),
    start: { x: 0, y: 1 },
    character: "dog",
    goal: { x: 4, y: 3 },
    slots: 8,
    page: "10-11",
  },
  {
    id: "kg-dog-4",
    lessonId: "g0-kc-05",
    title: "Moving the dog — the long way",
    spoken: "The bone is far away. Give the dog lots of arrows.",
    mode: "build-path",
    width: 6,
    height: 4,
    cells: grid(6, 4, {
      "3,0": { glyph: "house", blocked: true },
      "3,1": { glyph: "house", blocked: true },
      "5,3": { glyph: "bone" },
    }),
    start: { x: 0, y: 0 },
    character: "dog",
    goal: { x: 5, y: 3 },
    slots: 10,
    page: "12-13",
  },
  {
    id: "kg-dog-5",
    lessonId: "g0-kc-06",
    title: "Moving the dog — two turns",
    spoken: "Turn twice to reach the bone.",
    mode: "build-path",
    width: 5,
    height: 5,
    cells: grid(5, 5, {
      "1,1": { glyph: "tree", blocked: true },
      "3,3": { glyph: "tree", blocked: true },
      "0,4": { glyph: "bone" },
    }),
    start: { x: 4, y: 0 },
    character: "dog",
    goal: { x: 0, y: 4 },
    slots: 10,
    page: "14-15",
  },

  // ── Chapter 3 · the arrows are given, the child says where it lands ───────
  {
    id: "kg-follow-1",
    lessonId: "g0-kb-05",
    title: "Where does the dog stop?",
    spoken: "Watch the dog walk. Then tap the picture it stops on.",
    mode: "follow-path",
    width: 5,
    height: 5,
    cells: grid(5, 5, {
      "4,0": { glyph: "star" },
      "0,4": { glyph: "apple" },
      "4,4": { glyph: "ball" },
      // The bird sits halfway along the route and the flower at the end of it:
      // a child who stops watching early taps the bird, which is the mistake
      // this puzzle is for. Not a tree — on these boards a tree is a wall.
      "2,2": { glyph: "bird" },
      "2,4": { glyph: "flower" },
      "0,0": { glyph: "sun" },
    }),
    start: { x: 0, y: 2 },
    character: "dog",
    given: ["right", "right", "down", "down"],
    page: "12",
  },
  {
    id: "kg-follow-2",
    lessonId: "g0-kb-05",
    title: "Where does the dog stop? — again",
    spoken: "Watch again. Which picture does the dog find?",
    mode: "follow-path",
    width: 5,
    height: 5,
    cells: grid(5, 5, {
      "0,0": { glyph: "fish" },
      "4,0": { glyph: "bird" },
      "2,4": { glyph: "car" },
      "4,4": { glyph: "duck" },
      "1,2": { glyph: "cat" },
    }),
    start: { x: 2, y: 0 },
    character: "dog",
    given: ["down", "down", "down", "down"],
    page: "12",
  },

  // ── Chapter 5 · the same idea, opening the algorithms chapter ─────────────
  {
    id: "kg-path-1",
    lessonId: "g0-al-01",
    title: "Follow the path",
    spoken: "Take the duck to the pond.",
    mode: "build-path",
    width: 5,
    height: 4,
    cells: grid(5, 4, { "4,2": { glyph: "fish" } }),
    start: { x: 0, y: 3 },
    character: "duck",
    goal: { x: 4, y: 2 },
    slots: 8,
    page: "4-5",
  },
  {
    id: "kg-path-2",
    lessonId: "g0-al-02",
    title: "Finish the list",
    spoken: "The cat wants its ball. Fill in the missing arrows.",
    mode: "build-path",
    width: 6,
    height: 4,
    cells: grid(6, 4, {
      "2,2": { glyph: "house", blocked: true },
      "5,0": { glyph: "ball" },
    }),
    start: { x: 0, y: 3 },
    character: "cat",
    goal: { x: 5, y: 0 },
    slots: 10,
    page: "6-7",
  },
];

/** Every board the instrument can open, across the grades that use it. */
export const ALL_GRID_PUZZLES: KgPuzzle[] = [
  ...KG_PUZZLES,
  ...GRADE_1_PUZZLES,
  ...GRADE_2_PUZZLES,
  ...GRADE_2_SCRATCHJR_PUZZLES,
];

export function puzzlesForLesson(lessonId: string): KgPuzzle[] {
  return ALL_GRID_PUZZLES.filter((p) => p.lessonId === lessonId);
}

export function puzzleById(id: string): KgPuzzle | undefined {
  return ALL_GRID_PUZZLES.find((p) => p.id === id);
}
