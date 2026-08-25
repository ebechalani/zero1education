import type { SjExercise } from "./sj-check";
import { sjBackground } from "./sj-backgrounds";
import {
  sjId,
  type SjBlock,
  type SjProject,
  type SjScript,
  type SjSprite,
  type SjTriggerKind,
} from "./sj-model";

/**
 * The book's own ScratchJr tasks.
 *
 * Each is checked on what happens on the stage, never on how the blocks are
 * arranged — a duck can cross the sea with one Move Right 10, with ten Move
 * Right 1, or with a Repeat of 5 around a Move Right 2, and the book would
 * accept all three.
 *
 * Where a task is a "where does it stop?" question rather than a "build it"
 * one, it carries `predict` and the child answers by tapping the square. That
 * is how both books open their grid lessons, and the answer is never stored —
 * it is whatever the printed script actually does, so it cannot drift out of
 * step with the blocks beside it.
 */

// ── Small builders ──────────────────────────────────────────────────────────

const bg = (id: string) => {
  const found = sjBackground(id);
  if (!found) throw new Error(`Unknown background: ${id}`);
  return found;
};

const sprite = (
  id: string,
  name: string,
  glyph: SjSprite["glyph"],
  home: { x: number; y: number },
  extra: Partial<SjSprite> = {},
): SjSprite => ({
  id,
  name,
  glyph,
  home,
  size: 100,
  flipped: false,
  scripts: [],
  ...extra,
});

/** A script under a trigger. Defaults to the green flag, as the book does. */
const script = (blocks: SjBlock[], trigger: SjTriggerKind = "on-flag"): SjScript => ({
  id: sjId("s"),
  trigger: { id: sjId("t"), kind: trigger },
  blocks,
});

// The block shorthands, so a script below reads like the row on the page.
const right = (n = 1): SjBlock => ({ id: sjId(), kind: "move-right", n });
const up = (n = 1): SjBlock => ({ id: sjId(), kind: "move-up", n });
const down = (n = 1): SjBlock => ({ id: sjId(), kind: "move-down", n });
const hop = (n = 1): SjBlock => ({ id: sjId(), kind: "hop", n });
const grow = (n = 1): SjBlock => ({ id: sjId(), kind: "grow", n });
const shrink = (n = 1): SjBlock => ({ id: sjId(), kind: "shrink", n });
const say = (text: string): SjBlock => ({ id: sjId(), kind: "say", text });
const wait = (n = 1): SjBlock => ({ id: sjId(), kind: "wait", n });

/** Same cast and scene, different scripts: the start and the worked answer. */
const stageWith = (
  background: string,
  sprites: SjSprite[],
  scripts: Record<string, SjScript[]> = {},
): SjProject => ({
  background: bg(background),
  sprites: sprites.map((s) => ({ ...s, scripts: scripts[s.id] ?? [] })),
});

// ── Grade 1 · Chapter 5 ─────────────────────────────────────────────────────

const g1Cast = {
  tic: () => sprite("tic", "TIC", "cat", { x: 3, y: 8 }),
  star: () => sprite("star", "Star", "star", { x: 14, y: 8 }),
};

const g1l1: SjExercise = {
  id: "g1-sj-walk-to-the-star",
  lessonId: "g1-sc-01",
  title: "Make TIC walk to the star",
  brief:
    "TIC is on the left and the star is on the right. Use the blue Motion blocks so TIC reaches it when the green flag is tapped.",
  allowed: ["triggers", "motion"],
  project: stageWith("blank", [g1Cast.tic(), g1Cast.star()]),
  worked: stageWith("blank", [g1Cast.tic(), g1Cast.star()], {
    tic: [script([right(11)])],
  }),
  check: {
    summary: "TIC has to end up on the star's square.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          {
            kind: "position",
            sprite: "TIC",
            x: 14,
            y: 8,
            message: "TIC did not get all the way to the star",
          },
        ],
      },
    ],
  },
  page: "70-71",
};

const g1l2Predict: SjExercise = {
  id: "g1-sj-where-does-tic-stop",
  lessonId: "g1-sc-02",
  title: "Where does TIC stop?",
  brief:
    "The blocks are already written. Read them, work out where TIC finishes, and tap that square on the grid.",
  predict: { sprite: "tic" },
  project: stageWith("blank", [sprite("tic", "TIC", "cat", { x: 2, y: 11 })], {
    tic: [script([right(6), up(4), right(3), down(2)])],
  }),
  worked: stageWith("blank", [sprite("tic", "TIC", "cat", { x: 2, y: 11 })], {
    tic: [script([right(6), up(4), right(3), down(2)])],
  }),
  check: {
    summary: "The square TIC finishes on, read off the grid.",
    trials: [
      {
        id: "flag",
        label: "Run the printed script",
        assert: [{ kind: "position", sprite: "TIC", x: 11, y: 9 }],
      },
    ],
  },
  page: "72-73",
};

const g1l2Build: SjExercise = {
  id: "g1-sj-take-tic-to-the-square",
  lessonId: "g1-sc-02",
  title: "Take TIC to square (15, 4)",
  brief:
    "Switch the grid on and count. Write the blocks that take TIC from where it stands to column 15, row 4.",
  allowed: ["triggers", "motion"],
  project: stageWith("blank", [sprite("tic", "TIC", "cat", { x: 4, y: 12 })]),
  worked: stageWith("blank", [sprite("tic", "TIC", "cat", { x: 4, y: 12 })], {
    tic: [script([right(11), up(8)])],
  }),
  check: {
    summary: "TIC has to finish on column 15, row 4.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          {
            kind: "position",
            sprite: "TIC",
            x: 15,
            y: 4,
            message: "That is not square (15, 4)",
          },
        ],
      },
    ],
  },
  page: "72-73",
};

const g1l3: SjExercise = {
  id: "g1-sj-duck-on-the-sea",
  lessonId: "g1-sc-03",
  title: "A duck on the sea",
  brief:
    "The Stage has a new picture and there is a second character on it. Give them both a script so they both move when the flag is tapped.",
  allowed: ["triggers", "motion"],
  project: stageWith("sea", [
    sprite("tic", "TIC", "cat", { x: 3, y: 5 }),
    sprite("duck", "Duck", "duck", { x: 5, y: 10 }),
  ]),
  worked: stageWith(
    "sea",
    [
      sprite("tic", "TIC", "cat", { x: 3, y: 5 }),
      sprite("duck", "Duck", "duck", { x: 5, y: 10 }),
    ],
    {
      tic: [script([right(6)])],
      duck: [script([right(9)])],
    },
  ),
  check: {
    summary: "Both characters have to move when the flag is tapped.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          {
            kind: "travelled",
            sprite: "TIC",
            axis: "x",
            op: "!=",
            value: 0,
            message: "TIC stayed where it was",
          },
          {
            kind: "travelled",
            sprite: "Duck",
            axis: "x",
            op: "!=",
            value: 0,
            message: "the duck stayed where it was",
          },
        ],
      },
    ],
  },
  page: "74-75",
};

const g1l4: SjExercise = {
  id: "g1-sj-frog-and-butterfly",
  lessonId: "g1-sc-04",
  title: "The frog and the butterfly",
  brief:
    "Both are in the forest. Use the purple blocks so that the frog gets bigger and the butterfly gets smaller when the green flag is tapped.",
  allowed: ["triggers", "motion", "looks"],
  project: stageWith("forest", [
    sprite("frog", "Frog", "frog", { x: 6, y: 11 }),
    sprite("butterfly", "Butterfly", "butterfly", { x: 13, y: 5 }),
  ]),
  worked: stageWith(
    "forest",
    [
      sprite("frog", "Frog", "frog", { x: 6, y: 11 }),
      sprite("butterfly", "Butterfly", "butterfly", { x: 13, y: 5 }),
    ],
    {
      frog: [script([grow(4)])],
      butterfly: [script([shrink(3)])],
    },
  ),
  check: {
    summary: "The frog ends up bigger than it started, and the butterfly smaller.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          {
            kind: "size",
            sprite: "Frog",
            op: ">",
            value: 100,
            message: "the frog did not grow",
          },
          {
            kind: "size",
            sprite: "Butterfly",
            op: "<",
            value: 100,
            message: "the butterfly did not shrink",
          },
        ],
      },
    ],
  },
  page: "76-77",
};

const g1l5: SjExercise = {
  id: "g1-sj-tac-and-toc-talk",
  lessonId: "g1-sc-05",
  title: "TAC and TOC have a conversation",
  brief:
    "Make TAC say hello first. Then make TOC answer — and use a Wait block so TOC speaks after TAC, not at the same time.",
  allowed: ["triggers", "looks", "control"],
  project: stageWith("garden", [
    sprite("tac", "TAC", "boy", { x: 6, y: 9 }),
    sprite("toc", "TOC", "girl", { x: 13, y: 9 }),
  ]),
  worked: stageWith(
    "garden",
    [
      sprite("tac", "TAC", "boy", { x: 6, y: 9 }),
      sprite("toc", "TOC", "girl", { x: 13, y: 9 }),
    ],
    {
      tac: [script([say("Hello!")])],
      toc: [script([wait(6), say("Hi TAC!")])],
    },
  ),
  check: {
    summary: "Both have to speak, and TOC has to answer after TAC — not over the top of it.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          { kind: "said", sprite: "TAC", message: "TAC did not say anything" },
          { kind: "said", sprite: "TOC", message: "TOC did not answer" },
          {
            kind: "said-after",
            sprite: "TOC",
            after: "TAC",
            message: "they spoke at the same time — TOC needs a Wait block first",
          },
        ],
      },
    ],
  },
  page: "78-79",
};

const g1l6: SjExercise = {
  id: "g1-sj-make-your-own",
  lessonId: "g1-sc-06",
  title: "Make a project of your own",
  brief:
    "Choose what happens. The only rule is that something has to move and something has to be said when the green flag is tapped.",
  project: stageWith("park", [
    sprite("tic", "TIC", "cat", { x: 4, y: 10 }),
    sprite("dog", "Dog", "dog", { x: 14, y: 10 }),
  ]),
  worked: stageWith(
    "park",
    [
      sprite("tic", "TIC", "cat", { x: 4, y: 10 }),
      sprite("dog", "Dog", "dog", { x: 14, y: 10 }),
    ],
    {
      tic: [script([say("Hello dog!"), right(5), hop(2)])],
      dog: [script([wait(8), say("Woof!")])],
    },
  ),
  check: {
    summary: "Something moves and something speaks. What, is up to you.",
    trials: [
      {
        id: "flag",
        label: "Tap the green flag",
        assert: [
          {
            kind: "travelled",
            sprite: "TIC",
            axis: "x",
            op: "!=",
            value: 0,
            message: "nothing moved",
          },
          { kind: "said", sprite: "TIC", message: "nobody said anything" },
        ],
      },
    ],
  },
  page: "80",
};

// ── The set ─────────────────────────────────────────────────────────────────

/**
 * Every ScratchJr task, in book order.
 *
 * Grade 2's chapter is being read off its printed spreads and lands here next;
 * its ten lessons add the Tap and Bump triggers, Set Speed, Sound, the counted
 * Repeat and Repeat Forever.
 */
export const SJ_EXERCISES: SjExercise[] = [
  g1l1,
  g1l2Predict,
  g1l2Build,
  g1l3,
  g1l4,
  g1l5,
  g1l6,
];

/** Every buildable challenge of one lesson, in the order the book sets them. */
export function sjExercisesForLesson(lessonId: string): SjExercise[] {
  return SJ_EXERCISES.filter((e) => e.lessonId === lessonId);
}

/** One challenge by id — for deep links straight into the editor. */
export function sjExerciseById(id: string): SjExercise | undefined {
  return SJ_EXERCISES.find((e) => e.id === id);
}
