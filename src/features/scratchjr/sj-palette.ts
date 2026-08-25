import {
  sjId,
  type SjBlock,
  type SjBlockKind,
  type SjCategory,
  type SjTrigger,
  type SjTriggerKind,
} from "./sj-model";

/**
 * The palette is data.
 *
 * The editor renders from this list, so adding a block to the platform is one
 * entry here. Each entry carries the value ScratchJr itself puts in the white
 * box, so a block tapped out of the drawer matches the picture in the book
 * before a child has touched it.
 *
 * `help` is never printed on the block — ScratchJr's blocks are wordless and
 * putting words on them would defeat the whole design. It goes into the
 * `aria-label` and the teacher's tooltip.
 */

export interface SjTriggerEntry {
  shape: "trigger";
  key: SjTriggerKind;
  category: SjCategory;
  help: string;
  make: () => SjTrigger;
}

export interface SjBlockEntry {
  shape: "block" | "c";
  key: SjBlockKind;
  category: SjCategory;
  help: string;
  make: () => SjBlock;
}

export type SjPaletteEntry = SjTriggerEntry | SjBlockEntry;

const trigger = (
  key: SjTriggerKind,
  help: string,
): SjTriggerEntry => ({
  shape: "trigger",
  key,
  category: "triggers",
  help,
  make: () => ({ id: sjId("t"), kind: key }) as SjTrigger,
});

const block = (
  category: SjCategory,
  help: string,
  make: () => SjBlock,
  shape: "block" | "c" = "block",
): SjBlockEntry => ({
  shape,
  key: make().kind,
  category,
  help,
  make,
});

/**
 * Every block in ScratchJr's six drawers, in the app's own order.
 *
 * The eight blue Motion blocks are the "eight blue Action blocks" Grade 1
 * Lesson 1 asks a child to name, and they are in the app's order so that
 * counting them off the screen gives the same answer as counting them off the
 * page.
 */
export const SJ_PALETTE: SjPaletteEntry[] = [
  // ── Triggers ──────────────────────────────────────────────────────────────
  trigger("on-flag", "Start when the green flag is tapped"),
  trigger("on-tap", "Start when someone taps this character"),
  trigger("on-bump", "Start when this character bumps into another one"),

  // ── Motion · the eight blue Action blocks ─────────────────────────────────
  block("motion", "Move right", () => ({ id: sjId(), kind: "move-right", n: 1 })),
  block("motion", "Move left", () => ({ id: sjId(), kind: "move-left", n: 1 })),
  block("motion", "Move up", () => ({ id: sjId(), kind: "move-up", n: 1 })),
  block("motion", "Move down", () => ({ id: sjId(), kind: "move-down", n: 1 })),
  block("motion", "Turn right", () => ({ id: sjId(), kind: "turn-right", n: 1 })),
  block("motion", "Turn left", () => ({ id: sjId(), kind: "turn-left", n: 1 })),
  block("motion", "Hop up and come back down", () => ({ id: sjId(), kind: "hop", n: 1 })),
  block("motion", "Go back to where it started", () => ({ id: sjId(), kind: "go-home" })),

  // ── Looks ─────────────────────────────────────────────────────────────────
  block("looks", "Say something in a speech bubble", () => ({
    id: sjId(),
    kind: "say",
    text: "Hi!",
  })),
  block("looks", "Get bigger", () => ({ id: sjId(), kind: "grow", n: 1 })),
  block("looks", "Get smaller", () => ({ id: sjId(), kind: "shrink", n: 1 })),
  block("looks", "Go back to the normal size", () => ({ id: sjId(), kind: "reset-size" })),
  block("looks", "Disappear", () => ({ id: sjId(), kind: "hide" })),
  block("looks", "Appear again", () => ({ id: sjId(), kind: "show" })),

  // ── Sound ─────────────────────────────────────────────────────────────────
  block("sound", "Make a pop sound", () => ({ id: sjId(), kind: "pop" })),
  block("sound", "Play a recorded sound", () => ({
    id: sjId(),
    kind: "play-sound",
    sound: "recording",
  })),

  // ── Control ───────────────────────────────────────────────────────────────
  block("control", "Wait for a moment", () => ({ id: sjId(), kind: "wait", n: 1 })),
  block("control", "Stop everything", () => ({ id: sjId(), kind: "stop" })),
  block("control", "Set how fast the character moves", () => ({
    id: sjId(),
    kind: "set-speed",
    speed: "normal",
  })),
  block(
    "control",
    "Do the blocks inside this one again and again",
    () => ({ id: sjId(), kind: "repeat", n: 2, body: [] }),
    "c",
  ),

  // ── End ───────────────────────────────────────────────────────────────────
  block("end", "The script finishes here", () => ({ id: sjId(), kind: "end" })),
  block(
    "end",
    "Never stop — do the blocks inside for ever",
    () => ({ id: sjId(), kind: "repeat-forever", body: [] }),
    "c",
  ),
];

export const sjEntry = (key: SjBlockKind | SjTriggerKind): SjPaletteEntry | undefined =>
  SJ_PALETTE.find((e) => e.key === key);

/**
 * The drawers a lesson offers.
 *
 * Grade 1 Lesson 1 gives a child the blue drawer and nothing else, because the
 * lesson is about the eight Motion blocks and a palette of twenty-four would
 * bury them.
 */
export function sjDrawers(
  allowed?: SjCategory[],
): { category: SjCategory; entries: SjPaletteEntry[] }[] {
  const order: SjCategory[] = [
    "triggers",
    "motion",
    "looks",
    "sound",
    "control",
    "end",
  ];
  return order
    .filter((c) => !allowed || allowed.includes(c))
    .map((category) => ({
      category,
      entries: SJ_PALETTE.filter((e) => e.category === category),
    }))
    .filter((d) => d.entries.length > 0);
}
