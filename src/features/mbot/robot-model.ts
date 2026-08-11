/**
 * The mBot2 / CyberPi program model, and the world the robot drives in.
 *
 * Shaped like the mBlock blocks the book prints, so a block a student drags on
 * screen is the block on the page — same words, same fields, same dropdowns.
 * Chapter 4 needs exactly this much: the mBot2 Chassis movement blocks, the
 * CyberPi screen / LEDs / audio, the ultrasonic and quad-RGB colour sensors of
 * the mBot2 shield, the CyberPi's own buttons, joystick and light sensor,
 * `forever` / `if` / `wait`, and one variable (the client counter).
 *
 * Everything in here is data: types, constants, and the six arenas the book's
 * missions take place in. No behaviour — that lives in `robot-engine.ts`.
 *
 * Distances are centimetres and angles are degrees, because those are the units
 * printed inside the blocks (70 cm, 30 cm, 90°). The arena's y axis points down,
 * like an SVG, and a heading of 0° faces up the page; 90° is right (east).
 */

// ── Small vocabularies the blocks use ───────────────────────────────────────

export type RbDirection = "forward" | "backward";
export type RbSide = "left" | "right";
export type RbButton = "A" | "B";
/** The five ways the CyberPi joystick can be pushed. */
export type RbJoystick = "up" | "down" | "left" | "right" | "middle";
export type RbMotor = "EM1" | "EM2" | "all";
export type RbPrintSize = "small" | "medium" | "big" | "super big";

/** What the quad RGB sensor can report. `none` means "no colour at all". */
export type RbColour =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "white"
  | "black"
  | "none";

/** The CyberPi's five RGB LEDs. */
export type RbLedColour =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "white"
  | "off";

/** A value inside a variable or a `print` block: a number, or words. */
export type RbValue = number | string;

export type RbBinOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "<"
  | ">"
  | "="
  | "and"
  | "or";

// ── Expressions (the round and hexagonal blocks) ────────────────────────────

export type RbExpr =
  | { kind: "num"; value: number }
  | { kind: "text"; value: string }
  | { kind: "var"; name: string }
  | { kind: "binop"; op: RbBinOp; left: RbExpr; right: RbExpr }
  | { kind: "not"; value: RbExpr }
  /** mBot2 shield · `ultrasonic 2 (1) distance to an object (cm)` */
  | { kind: "ultrasonic" }
  /** mBot2 shield · `quad rgb sensor (1) L1,R1's [white] in status?` */
  | { kind: "colour-is"; colour: RbColour }
  /** mBot2 shield · the colour the sensor is reading, as a word */
  | { kind: "colour-name" }
  /** CyberPi · `ambient light intensity` (0–100 %) */
  | { kind: "light" }
  /** CyberPi · `button [A] pressed?` */
  | { kind: "button"; button: RbButton }
  /** CyberPi · `joystick [pulled ↑] ?` */
  | { kind: "joystick"; direction: RbJoystick }
  /** CyberPi · `timer (s)` */
  | { kind: "timer" };

// ── Statements (the stack blocks) ───────────────────────────────────────────

export type RbStatement =
  // ── mBot2 Chassis ──
  /** `moves [forward] (70) cm until done` */
  | { id: string; kind: "move-distance"; direction: RbDirection; cm: RbExpr }
  /** `moves [forward] at (50) RPM for (1) secs` */
  | {
      id: string;
      kind: "move-timed";
      direction: RbDirection;
      rpm: RbExpr;
      secs: RbExpr;
    }
  /** `moves [forward] at (50) RPM` — starts the wheels and moves on */
  | { id: string; kind: "move-on"; direction: RbDirection; rpm: RbExpr }
  /** `turns [left] (90)° until done` */
  | { id: string; kind: "turn"; side: RbSide; degrees: RbExpr }
  /** `set moving speed to (50) %` — the power every move block drives at */
  | { id: string; kind: "set-speed"; percent: RbExpr }
  /** `encoder motor [left wheel(EM1)] rotates at (20) power (%) for (1) secs` */
  | {
      id: string;
      kind: "encoder-motor";
      motor: RbMotor;
      power: RbExpr;
      secs: RbExpr;
    }
  /** `encoder motor [all] rotates by (180)°` */
  | { id: string; kind: "encoder-rotate"; motor: RbMotor; degrees: RbExpr }
  /** `stop encoder motor [all]` */
  | { id: string; kind: "stop-motor"; motor: RbMotor }

  // ── CyberPi display, LEDs, audio ──
  /** `print ( ) and move to a newline` / `print ( )` */
  | { id: string; kind: "print"; value: RbExpr; newline: boolean }
  | { id: string; kind: "clear-screen" }
  /** `set print size to [super big]` */
  | { id: string; kind: "set-print-size"; size: RbPrintSize }
  /** `display [■■■■■]` — the five CyberPi LEDs at once */
  | { id: string; kind: "display-leds"; colours: RbLedColour[] }
  /** `play [hi] until done` */
  | { id: string; kind: "play-sound"; sound: string }
  /** `play voice ( ) until done` — the spoken message of Lesson 2 */
  | { id: string; kind: "play-voice"; text: string }
  | { id: string; kind: "start-recording" }
  | { id: string; kind: "stop-recording" }
  | { id: string; kind: "play-recording" }

  // ── Control ──
  | { id: string; kind: "wait"; secs: RbExpr }
  | { id: string; kind: "forever"; body: RbStatement[] }
  | { id: string; kind: "repeat"; times: RbExpr; body: RbStatement[] }
  | {
      id: string;
      kind: "if";
      cond: RbExpr;
      then: RbStatement[];
      otherwise?: RbStatement[];
    }

  // ── Variables and the timer ──
  | { id: string; kind: "set-var"; name: string; value: RbExpr }
  | { id: string; kind: "change-var"; name: string; by: RbExpr }
  | { id: string; kind: "reset-timer" };

/**
 * A top-level hat. Several hats run at the same time — that is exactly the
 * "multitasking mission" of Lesson 5, and it is why hats, not one big script,
 * are the unit of a program here.
 */
export type RbEvent =
  /** `when 🏳 clicked` */
  | { id: string; kind: "on-launch"; body: RbStatement[] }
  /** `when button [A] pressed` */
  | { id: string; kind: "on-button"; button: RbButton; body: RbStatement[] }
  /** `when joystick [pulled ↑]` */
  | {
      id: string;
      kind: "on-joystick";
      direction: RbJoystick;
      body: RbStatement[];
    };

export interface RbProgram {
  scripts: RbEvent[];
}

export const emptyProgram = (): RbProgram => ({ scripts: [] });

// ── The palette, in mBlock's own categories ─────────────────────────────────

export type RbCategory =
  | "events"
  | "control"
  | "chassis"
  | "display"
  | "audio"
  | "sensing"
  | "shield"
  | "operators"
  | "variables";

export interface RbCategoryMeta {
  id: RbCategory;
  label: string;
  /**
   * mBlock's own block colour. The exact hue is the point — a student is
   * holding a printed screenshot next to the screen — so these are literal
   * hexes used inline, never design tokens that "look close".
   */
  hex: string;
}

export const RB_CATEGORIES: Record<RbCategory, RbCategoryMeta> = {
  events: { id: "events", label: "Events", hex: "#FFBF00" },
  control: { id: "control", label: "Control", hex: "#FFAB19" },
  chassis: { id: "chassis", label: "mBot2 Chassis", hex: "#4C97FF" },
  display: { id: "display", label: "Display", hex: "#9966FF" },
  audio: { id: "audio", label: "Audio", hex: "#CF63CF" },
  sensing: { id: "sensing", label: "Sensing", hex: "#EE4B4B" },
  shield: { id: "shield", label: "mBot2 Shield", hex: "#0FBD8C" },
  operators: { id: "operators", label: "Operators", hex: "#59C059" },
  variables: { id: "variables", label: "Variables", hex: "#FF8C1A" },
};

/** The order mBlock lists them in, with the added extension last but one. */
export const RB_CATEGORY_ORDER: RbCategory[] = [
  "events",
  "control",
  "chassis",
  "shield",
  "display",
  "audio",
  "sensing",
  "operators",
  "variables",
];

/** Which colour a block already in the script wears. */
export const RB_STATEMENT_CATEGORY: Record<RbStatement["kind"], RbCategory> = {
  "move-distance": "chassis",
  "move-timed": "chassis",
  "move-on": "chassis",
  turn: "chassis",
  "set-speed": "chassis",
  "encoder-motor": "chassis",
  "encoder-rotate": "chassis",
  "stop-motor": "chassis",
  print: "display",
  "clear-screen": "display",
  "set-print-size": "display",
  "display-leds": "display",
  "play-sound": "audio",
  "play-voice": "audio",
  "start-recording": "audio",
  "stop-recording": "audio",
  "play-recording": "audio",
  wait: "control",
  forever: "control",
  repeat: "control",
  if: "control",
  "set-var": "variables",
  "change-var": "variables",
  "reset-timer": "sensing",
};

export const RB_EXPR_CATEGORY: Record<RbExpr["kind"], RbCategory> = {
  num: "operators",
  text: "operators",
  var: "variables",
  binop: "operators",
  not: "operators",
  ultrasonic: "shield",
  "colour-is": "shield",
  "colour-name": "shield",
  light: "sensing",
  button: "sensing",
  joystick: "sensing",
  timer: "sensing",
};

// ── Choices the inline dropdowns offer ──────────────────────────────────────

export const RB_BUTTONS: RbButton[] = ["A", "B"];
export const RB_MOTORS: RbMotor[] = ["EM1", "EM2", "all"];
export const RB_PRINT_SIZES: RbPrintSize[] = [
  "small",
  "medium",
  "big",
  "super big",
];
export const RB_SENSED_COLOURS: RbColour[] = [
  "red",
  "green",
  "blue",
  "yellow",
  "white",
  "black",
];
export const RB_LED_COLOURS: RbLedColour[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "white",
  "off",
];
/** The short list of CyberPi sounds the book's lessons need. */
export const RB_SOUNDS = [
  "hi",
  "bye",
  "yeah",
  "wow",
  "laugh",
  "ring",
  "start",
  "level up",
  "wrong",
  "beeps",
] as const;

export const RB_COMPARISONS: RbBinOp[] = ["<", ">", "="];
export const RB_LOGIC_OPS: RbBinOp[] = ["and", "or"];
export const RB_MATH_OPS: RbBinOp[] = ["+", "-", "*", "/"];

export const RB_MOTOR_LABEL: Record<RbMotor, string> = {
  EM1: "left wheel (EM1)",
  EM2: "right wheel (EM2)",
  all: "all",
};

export const RB_JOYSTICK_LABEL: Record<RbJoystick, string> = {
  up: "pulled ↑",
  down: "pulled ↓",
  left: "pulled ←",
  right: "pulled →",
  middle: "pressed",
};

export const RB_OP_LABEL: Record<RbBinOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "<": "<",
  ">": ">",
  "=": "=",
  and: "and",
  or: "or",
};

/** Screen colours for the sensed floor/object colours. */
export const RB_COLOUR_HEX: Record<RbColour, string> = {
  red: "#e5352b",
  green: "#22a559",
  blue: "#2b6de0",
  yellow: "#f5c518",
  white: "#f7f8fb",
  black: "#1b2233",
  none: "#9aa3b8",
};

export const RB_LED_HEX: Record<RbLedColour, string> = {
  red: "#ff2d55",
  orange: "#ff8a1f",
  yellow: "#ffd60a",
  green: "#30d158",
  cyan: "#32d8e8",
  blue: "#3d63ff",
  purple: "#a855f7",
  white: "#ffffff",
  off: "#2a3247",
};

// ── How fast the simulated robot is ─────────────────────────────────────────

/**
 * Readable simulation constants. They are chosen so that a class can watch the
 * robot move at a speed the eye can follow, while the printed numbers stay
 * true: at the default speed a `moves forward 70 cm` block takes a little over
 * two seconds and a `turns right 90°` takes one second.
 */
/** mBot2 wheel circumference — one wheel turn carries the robot this far. */
export const RB_CM_PER_ROTATION = 19;
/** 100 % power on the chassis. mBot2's encoder motors top out around here. */
export const RB_MAX_RPM = 200;
/** Turning on the spot, at 100 % power. */
export const RB_TURN_DEG_PER_SEC = 180;
/** A free-running encoder motor at 100 % power. */
export const RB_MOTOR_ROT_PER_SEC = 5;
/** Lesson 4: "the motor will make 2 rotations to close the rolling shutter". */
export const RB_SHUTTER_CLOSED_TURNS = 2;
/** The default the chassis blocks drive at until `set moving speed` says otherwise. */
export const RB_DEFAULT_SPEED = 50;
/** Beyond this the HC-SR04-style sensor simply reports "far". */
export const RB_ULTRASONIC_MAX_CM = 300;
/** The sensor cannot resolve anything closer than this. */
export const RB_ULTRASONIC_MIN_CM = 2;
/** How wide the beam is drawn and reasoned about. */
export const RB_BEAM_DEG = 30;
/** The robot's footprint, top down. */
export const RB_ROBOT_LENGTH_CM = 13;
export const RB_ROBOT_WIDTH_CM = 11;
/** Half the diagonal, used for bumping into walls. */
export const RB_ROBOT_RADIUS_CM = 6.5;
/** How far in front of the centre the ultrasonic sensor sits. */
export const RB_SENSOR_OFFSET_CM = 6.5;
/** Where the downward-facing quad RGB sensor looks. */
export const RB_COLOUR_OFFSET_CM = 4;
/**
 * An object placed in front of the robot is read as a colour too — that is how
 * the smart bin of Lesson 3 reads the trash it has just received.
 */
export const RB_COLOUR_OBJECT_CM = 30;

/** Centimetres per second at a given power (%). */
export const rbSpeedCmPerSec = (percent: number): number =>
  (Math.abs(percent) / 100) * RB_MAX_RPM * (RB_CM_PER_ROTATION / 60);

/** Centimetres per second for an explicit RPM, as in `at 50 RPM`. */
export const rbRpmCmPerSec = (rpm: number): number =>
  Math.abs(rpm) * (RB_CM_PER_ROTATION / 60);

// ── The world ───────────────────────────────────────────────────────────────

export interface RbRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A solid thing: the robot bumps into it and the ultrasonic sees it. */
export interface RbWall extends RbRect {
  id: string;
  label?: string;
  /** Drawn as a building rather than a plain block. */
  look?: "block" | "bin" | "frame";
}

/** Painted floor. `road` patches are the ones the car must stay on. */
export interface RbPatch extends RbRect {
  id: string;
  colour: RbColour;
  label?: string;
  road?: boolean;
  /** Rounded corners in cm, for the road strips. */
  radius?: number;
}

export type RbZoneTone = "mint" | "coral" | "brand" | "amber" | "violet";

/** A place the mission is judged on: "did the robot end up here?" */
export interface RbZone extends RbRect {
  id: string;
  label: string;
  tone: RbZoneTone;
}

/** A named point from the book's map, drawn as a small labelled dot. */
export interface RbMarker {
  id: string;
  x: number;
  y: number;
  label: string;
}

/** What the `encoder motor` blocks are wired to in this scene. */
export type RbMotorRole = "wheels" | "shutter";

export interface RbPose {
  x: number;
  y: number;
  /** Degrees. 0 faces up the page, 90 faces right. */
  heading: number;
}

export interface RbArena {
  id: RbArenaId;
  name: string;
  /** One line a teacher can read out before pressing Run. */
  caption: string;
  widthCm: number;
  heightCm: number;
  start: RbPose;
  walls: RbWall[];
  patches: RbPatch[];
  zones: RbZone[];
  markers: RbMarker[];
  motorRole: RbMotorRole;
  /** The colour of bare floor, where no patch is painted. */
  floorColour: RbColour;
  /** Ambient light the CyberPi reads at the start, 0–100 %. */
  light: number;
  /** An object standing in front of the sensor when the mission starts. */
  objectCm: number | null;
  objectColour: RbColour;
  /** Faint measuring grid, in cm. 0 hides it. */
  gridCm: number;
}

export type RbArenaId =
  | "maze"
  | "sorter"
  | "window"
  | "city"
  | "mall"
  | "bench";

// ── What the simulator reports, moment by moment ────────────────────────────

export interface RbWorldState {
  arenaId: RbArenaId;
  x: number;
  y: number;
  heading: number;
  /** Where the robot has been, for the trail in the arena. */
  trail: { x: number; y: number }[];
  /** Total ground covered, in cm — "did it actually move?" */
  travelledCm: number;
  /** Total turning, signed: right is positive. */
  turnedDeg: number;
  /** How many times it drove into something. */
  bumps: number;
  /** What the wheels are doing right now. */
  motion: "forward" | "backward" | "turn-left" | "turn-right" | null;
  speedPercent: number;
  /** 0 = the rolling shutter is fully open, 2 = fully closed. */
  shutterTurns: number;
  /** True while an encoder motor is turning. */
  motorRunning: boolean;
  /** The CyberPi console, newest line last. */
  screen: string[];
  printSize: RbPrintSize;
  leds: RbLedColour[];
  /** What the speaker is playing right now, if anything. */
  sound: string | null;
  /** The last spoken message, kept on screen for the class. */
  voice: string | null;
  recording: boolean;
  variables: Record<string, RbValue>;
  /** Live sensor readings, refreshed every tick so the arena can draw them. */
  distanceCm: number;
  colourSeen: RbColour;
  light: number;
  /** The hand-placed object in front of the sensor: a hand, trash, a client. */
  objectCm: number | null;
  objectColour: RbColour;
  buttons: Record<RbButton, boolean>;
  joystick: RbJoystick | null;
  /** The CyberPi timer, in milliseconds. */
  timerMs: number;
  /** True while the robot's centre is off the painted road (city map only). */
  offRoad: boolean;
  running: boolean;
}

export const RB_ALL_LEDS_OFF: RbLedColour[] = [
  "off",
  "off",
  "off",
  "off",
  "off",
];

export function initialWorldState(arena: RbArena): RbWorldState {
  return {
    arenaId: arena.id,
    x: arena.start.x,
    y: arena.start.y,
    heading: arena.start.heading,
    trail: [{ x: arena.start.x, y: arena.start.y }],
    travelledCm: 0,
    turnedDeg: 0,
    bumps: 0,
    motion: null,
    speedPercent: RB_DEFAULT_SPEED,
    shutterTurns: 0,
    motorRunning: false,
    screen: [],
    printSize: "medium",
    leds: [...RB_ALL_LEDS_OFF],
    sound: null,
    voice: null,
    recording: false,
    variables: {},
    distanceCm: RB_ULTRASONIC_MAX_CM,
    colourSeen: arena.floorColour,
    light: arena.light,
    objectCm: arena.objectCm,
    objectColour: arena.objectColour,
    buttons: { A: false, B: false },
    joystick: null,
    timerMs: 0,
    offRoad: false,
    running: false,
  };
}

// ── Geometry helpers the engine and the arena both need ─────────────────────

/** Unit vector for a heading. 0° points up the page. */
export const rbHeadingVector = (heading: number): { dx: number; dy: number } => {
  const rad = (heading * Math.PI) / 180;
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
};

/** Bring any angle into 0–359. */
export const rbNormaliseAngle = (deg: number): number =>
  ((deg % 360) + 360) % 360;

/** The smallest turn between two headings, −180…180. */
export function rbAngleDelta(from: number, to: number): number {
  const diff = rbNormaliseAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
}

export const rbPointInRect = (
  x: number,
  y: number,
  r: RbRect,
): boolean => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** True when a circle of `radius` around (x, y) overlaps the rectangle. */
export function rbCircleHitsRect(
  x: number,
  y: number,
  radius: number,
  r: RbRect,
): boolean {
  const nearestX = Math.min(Math.max(x, r.x), r.x + r.w);
  const nearestY = Math.min(Math.max(y, r.y), r.y + r.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

/**
 * How far a ray from (x, y) in direction (dx, dy) travels before it enters the
 * rectangle. Returns null when it never does. The classic slab test — it is
 * what makes the ultrasonic beam in the arena stop exactly on the wall.
 */
export function rbRayHitsRect(
  x: number,
  y: number,
  dx: number,
  dy: number,
  r: RbRect,
): number | null {
  let near = 0;
  let far = Number.POSITIVE_INFINITY;

  const slab = (origin: number, delta: number, lo: number, hi: number) => {
    if (Math.abs(delta) < 1e-9) return origin >= lo && origin <= hi;
    let t1 = (lo - origin) / delta;
    let t2 = (hi - origin) / delta;
    if (t1 > t2) [t1, t2] = [t2, t1];
    near = Math.max(near, t1);
    far = Math.min(far, t2);
    return near <= far;
  };

  if (!slab(x, dx, r.x, r.x + r.w)) return null;
  if (!slab(y, dy, r.y, r.y + r.h)) return null;
  return far < 0 ? null : near;
}

// ── The arenas the book's missions happen in ────────────────────────────────

const wall = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  extra: Partial<RbWall> = {},
): RbWall => ({ id, x, y, w, h, ...extra });

const road = (id: string, x: number, y: number, w: number, h: number): RbPatch => ({
  id,
  x,
  y,
  w,
  h,
  colour: "black",
  road: true,
  radius: 3,
});

/**
 * Lesson 2 · the maze. Four legs of 70 cm with 90° corners between them, ending
 * at the roundabout — the layout printed beside the joystick mission. The
 * roundabout has an island, so the ultrasonic sensor can tell the robot it has
 * arrived.
 */
const MAZE: RbArena = {
  id: "maze",
  name: "The maze",
  caption:
    "Drive the mBot2 through the maze with the joystick: 70 cm forward, 90° left, 90° right.",
  widthCm: 240,
  heightCm: 210,
  start: { x: 30, y: 30, heading: 90 },
  walls: [
    wall("m-top", 16, 0, 224, 16),
    wall("m-topleft", 0, 0, 16, 44),
    wall("m-a", 0, 44, 86, 166),
    wall("m-b", 114, 44, 126, 42),
    wall("m-c", 114, 114, 42, 96),
    wall("m-d", 184, 114, 56, 96),
    wall("m-island", 152, 190, 36, 14, { label: "roundabout", look: "block" }),
  ],
  patches: [],
  zones: [
    {
      id: "roundabout",
      x: 152,
      y: 152,
      w: 36,
      h: 36,
      label: "Roundabout",
      tone: "amber",
    },
  ],
  markers: [{ id: "m-start", x: 30, y: 30, label: "Start" }],
  motorRole: "wheels",
  floorColour: "white",
  light: 45,
  objectCm: null,
  objectColour: "white",
  gridCm: 10,
};

/**
 * Lesson 3 · the smart recycle bin. The robot receives the trash, reads its
 * colour, then turns and carries it 30 cm to one of the two bins.
 *
 * The book's little drawing puts the recycled bin on the left of the page and
 * the printed rule says "turns 90 degrees to the right … to reach the recycle
 * bin": in the drawing the robot faces the reader, so its right hand is the
 * page's left. Seen from above, as here, the robot faces up the page and its
 * right is the page's right. The rule is what is modelled — white turns right.
 */
const SORTER: RbArena = {
  id: "sorter",
  name: "The smart recycle bin",
  caption:
    "The trash arrives in front of the sensor. White goes right, red goes left — 30 cm to the bin.",
  widthCm: 200,
  heightCm: 170,
  start: { x: 100, y: 120, heading: 0 },
  walls: [],
  patches: [
    {
      id: "s-pad",
      x: 84,
      y: 78,
      w: 32,
      h: 26,
      colour: "none",
      label: "trash pad",
      radius: 4,
    },
  ],
  zones: [
    {
      id: "recycle",
      x: 114,
      y: 104,
      w: 32,
      h: 32,
      label: "Bin for recycled trash",
      tone: "mint",
    },
    {
      id: "landfill",
      x: 54,
      y: 104,
      w: 32,
      h: 32,
      label: "Bin for non-recycled trash",
      tone: "coral",
    },
  ],
  markers: [],
  motorRole: "wheels",
  floorColour: "white",
  light: 50,
  objectCm: null,
  objectColour: "white",
  gridCm: 10,
};

/**
 * Lessons 4 and 5 · the window. Here the mBot2 is not a car: it is the engine of
 * the rolling shutter, so the `encoder motor` blocks wind the shutter down
 * instead of driving the wheels. The ultrasonic still points out of the window,
 * which is how the safety task of Lesson 5 sees a hand.
 */
const WINDOW: RbArena = {
  id: "window",
  name: "The window",
  caption:
    "The mBot2 motor is the rolling shutter's engine. Its ultrasonic sensor watches the window opening.",
  widthCm: 160,
  heightCm: 130,
  start: { x: 80, y: 96, heading: 0 },
  walls: [
    wall("w-left", 0, 0, 34, 18, { look: "frame" }),
    wall("w-right", 126, 0, 34, 18, { look: "frame" }),
  ],
  patches: [
    {
      id: "w-sill",
      x: 34,
      y: 0,
      w: 92,
      h: 8,
      colour: "none",
      label: "window",
      radius: 2,
    },
  ],
  zones: [],
  markers: [],
  motorRole: "shutter",
  floorColour: "white",
  /** The value the book prints on the CyberPi monitor: 32. */
  light: 32,
  objectCm: null,
  objectColour: "white",
  gridCm: 10,
};

/**
 * Lesson 6 · the city map, checkpoint for checkpoint. Every distance below is a
 * number printed on the book's map: O→A 10, A→C 50, C→D 30, D→E 30, J→D 20,
 * K→E 20, E→F 20, corner→I 30, I→H 50, R→H 60, H→G 10, J→B 30.
 */
const CITY: RbArena = {
  id: "city",
  name: "The city map",
  caption:
    "Place the mBot2 on checkpoint O and drive it to point G — without leaving the road.",
  widthCm: 155,
  heightCm: 140,
  start: { x: 15, y: 85, heading: 90 },
  walls: [],
  patches: [
    road("c-main", 8, 78, 134, 14),
    road("c-lower", 18, 98, 124, 14),
    road("c-a", 18, 58, 14, 54),
    road("c-top", 18, 58, 94, 14),
    road("c-d", 98, 28, 14, 94),
    road("c-e", 128, 58, 14, 54),
    road("c-jk", 98, 58, 44, 14),
    { id: "c-r", x: 40, y: 98, w: 10, h: 14, colour: "red", label: "R" },
    { id: "c-b", x: 98, y: 28, w: 14, h: 10, colour: "blue", label: "B" },
    { id: "c-g", x: 98, y: 110, w: 14, h: 10, colour: "green", label: "G" },
  ],
  zones: [
    { id: "O", x: 8, y: 78, w: 16, h: 14, label: "O — start", tone: "brand" },
    { id: "G", x: 98, y: 108, w: 14, h: 14, label: "G — destination", tone: "mint" },
  ],
  markers: [
    { id: "O", x: 15, y: 85, label: "O" },
    { id: "A", x: 25, y: 85, label: "A" },
    { id: "C", x: 75, y: 85, label: "C" },
    { id: "D", x: 105, y: 85, label: "D" },
    { id: "E", x: 135, y: 85, label: "E" },
    { id: "J", x: 105, y: 65, label: "J" },
    { id: "K", x: 135, y: 65, label: "K" },
    { id: "B", x: 105, y: 35, label: "B" },
    { id: "I", x: 55, y: 105, label: "I" },
    { id: "H", x: 105, y: 105, label: "H" },
    { id: "F", x: 135, y: 105, label: "F" },
    { id: "R", x: 45, y: 105, label: "R" },
    { id: "G", x: 105, y: 115, label: "G" },
  ],
  motorRole: "wheels",
  floorColour: "white",
  light: 55,
  objectCm: null,
  objectColour: "white",
  gridCm: 10,
};

/**
 * Lesson 7 · the mall entrance. The robot stands still by the door and counts
 * the people who walk past its ultrasonic sensor.
 */
const MALL: RbArena = {
  id: "mall",
  name: "The mall entrance",
  caption:
    "The ultrasonic sensor watches the doorway. Every person who walks past is one more client.",
  widthCm: 170,
  heightCm: 130,
  start: { x: 85, y: 95, heading: 0 },
  walls: [
    wall("d-left", 20, 26, 40, 16, { label: "MALL", look: "frame" }),
    wall("d-right", 110, 26, 40, 16, { label: "ENTRANCE", look: "frame" }),
  ],
  patches: [
    {
      id: "mat",
      x: 60,
      y: 42,
      w: 50,
      h: 20,
      colour: "none",
      label: "doorway",
      radius: 3,
    },
  ],
  zones: [],
  markers: [],
  motorRole: "wheels",
  floorColour: "white",
  light: 55,
  objectCm: null,
  objectColour: "white",
  gridCm: 10,
};

/**
 * Lessons 1 and 5 · the open bench, with the coloured mat of the book's photo
 * under the robot. Plenty of clear floor ahead for the forward / backward
 * challenges, and four colours for the quad RGB sensor to read.
 */
const BENCH: RbArena = {
  id: "bench",
  name: "The test bench",
  caption:
    "Open floor, a coloured mat under the robot, and nothing in the way — room to try a mission out.",
  widthCm: 200,
  heightCm: 170,
  start: { x: 100, y: 130, heading: 0 },
  walls: [],
  patches: [
    { id: "b-yellow", x: 64, y: 118, w: 24, h: 24, colour: "yellow" },
    { id: "b-white", x: 88, y: 118, w: 24, h: 24, colour: "white" },
    { id: "b-red", x: 112, y: 118, w: 24, h: 24, colour: "red" },
    { id: "b-black", x: 136, y: 118, w: 24, h: 24, colour: "black" },
  ],
  zones: [],
  markers: [],
  motorRole: "wheels",
  floorColour: "white",
  light: 45,
  objectCm: null,
  objectColour: "red",
  gridCm: 10,
};

export const RB_ARENAS: Record<RbArenaId, RbArena> = {
  maze: MAZE,
  sorter: SORTER,
  window: WINDOW,
  city: CITY,
  mall: MALL,
  bench: BENCH,
};

export const RB_ARENA_ORDER: RbArenaId[] = [
  "maze",
  "sorter",
  "window",
  "city",
  "mall",
  "bench",
];

export const arenaById = (id: RbArenaId): RbArena => RB_ARENAS[id];
