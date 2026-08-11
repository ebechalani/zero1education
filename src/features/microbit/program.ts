/**
 * The micro:bit program model.
 *
 * Deliberately shaped like the MakeCode blocks the book teaches, so a block a
 * student drags on screen is the same block printed on the page — not a
 * translation of it. Chapter 1 needs exactly this much: events, variables,
 * the 25-LED matrix by (x, y), loops, conditions and the Kitronik sensors.
 */

export type MbIcon =
  | "heart"
  | "happy"
  | "sad"
  | "yes"
  | "no"
  | "arrow-up"
  | "arrow-down"
  | "square"
  | "small-square"
  | "diamond";

export type MbButton = "A" | "B" | "A+B";

export type MbBinOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "<"
  | ">"
  | "="
  | "!="
  | "<="
  | ">="
  | "and"
  | "or";

export type MbExpr =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string }
  | { kind: "binop"; op: MbBinOp; left: MbExpr; right: MbExpr }
  /** Kitronik air quality station */
  | { kind: "temperature" }
  | { kind: "humidity" }
  | { kind: "light" }
  | { kind: "random"; min: MbExpr; max: MbExpr };

export type MbStatement =
  // Output
  | { id: string; kind: "show-number"; value: MbExpr }
  | { id: string; kind: "show-string"; value: string }
  | { id: string; kind: "show-icon"; icon: MbIcon }
  | { id: string; kind: "clear-screen" }
  | { id: string; kind: "plot"; x: MbExpr; y: MbExpr }
  | { id: string; kind: "unplot"; x: MbExpr; y: MbExpr }
  | { id: string; kind: "play-tone"; note: string; ms: number }
  /** Kitronik ZIP LEDs, used for the red/green warnings in lesson 9 */
  | { id: string; kind: "set-zip"; colour: "red" | "green" | "amber" | "off" }
  // Timing
  | { id: string; kind: "pause"; ms: number }
  // Variables
  | { id: string; kind: "set-var"; name: string; value: MbExpr }
  | { id: string; kind: "change-var"; name: string; by: MbExpr }
  // Control
  | { id: string; kind: "repeat"; times: MbExpr; body: MbStatement[] }
  | {
      id: string;
      kind: "for";
      name: string;
      from: MbExpr;
      to: MbExpr;
      body: MbStatement[];
    }
  | { id: string; kind: "while"; cond: MbExpr; body: MbStatement[] }
  | {
      id: string;
      kind: "if";
      cond: MbExpr;
      then: MbStatement[];
      otherwise?: MbStatement[];
    };

/** Top-level event hats — a program is a set of these, as in MakeCode. */
export type MbEvent =
  | { id: string; kind: "on-start"; body: MbStatement[] }
  | { id: string; kind: "forever"; body: MbStatement[] }
  | { id: string; kind: "on-button"; button: MbButton; body: MbStatement[] };

export interface MbProgram {
  events: MbEvent[];
}

export const emptyProgram = (): MbProgram => ({ events: [] });

// ── Device state ────────────────────────────────────────────────────────────

export interface MbDeviceState {
  /** 5×5 brightness grid, row-major: leds[y][x], 0–255 */
  leds: number[][];
  /** Text currently scrolling, if any */
  display: string | null;
  variables: Record<string, number>;
  /** Simulated sensors the student can move */
  temperature: number;
  humidity: number;
  light: number;
  zip: "red" | "green" | "amber" | "off";
  tone: string | null;
  running: boolean;
}

export const blankLeds = (): number[][] =>
  Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));

export const initialDeviceState = (): MbDeviceState => ({
  leds: blankLeds(),
  display: null,
  variables: {},
  temperature: 22,
  humidity: 45,
  light: 128,
  zip: "off",
  tone: null,
  running: false,
});

// ── Icons as 5×5 bitmaps (the ones the book uses) ───────────────────────────

export const ICON_BITMAPS: Record<MbIcon, number[][]> = {
  heart: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  happy: [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  sad: [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  yes: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  no: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  "arrow-up": [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  "arrow-down": [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  square: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
  "small-square": [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0],
  ],
  diamond: [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
};

/** 5×5 digit bitmaps so show-number renders like the real device. */
export const DIGIT_BITMAPS: Record<string, number[][]> = {
  "0": [[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]],
  "1": [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
  "2": [[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,1]],
  "3": [[1,1,1,1,1],[0,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
  "4": [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1]],
  "5": [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
  "6": [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1]],
  "7": [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
  "8": [[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1]],
  "9": [[1,1,1,1,1],[1,0,0,0,1],[1,1,1,1,1],[0,0,0,0,1],[1,1,1,1,1]],
  "-": [[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0]],
};
