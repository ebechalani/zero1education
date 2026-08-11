/**
 * Chapter 3's drawing plates, turned into guided sequences.
 *
 * Grade 6 · Chapter 3 "Cartoon Drawing" teaches through pictures: five lessons
 * of step-by-step drawing plates with a "PRACTISE IN PAINT" screenshot and an
 * "EXCERCISE" box on the facing page. So nothing here is graded — a drawing is
 * not right or wrong. Each exercise is the book's own task broken into the
 * book's own steps, and every step carries a little construction geometry the
 * student traces over: the head circle, the shoulder triangle, the torso, the
 * stick limbs with their joints, the arm and leg blocks.
 *
 * Everything is taken from the printed pages:
 *   · Lesson 1 (pp. 38–39) — FEMALE vs MALE body shapes, "Reproduce in Paint
 *     the below two skeletons", "Experiment with Shapes and Build a Female /
 *     Construct a Male Body Shape".
 *   · Lesson 2 (pp. 40–41) — STEP-BY-STEP BODY CONSTRUCTION, steps 1 to 4,
 *     "Reproduce in Paint the below part of the body", "Create your own Male
 *     Superhero Body using shape variations of your choice".
 *   · Lesson 3 (pp. 42–43) — the same four steps for a female superhero,
 *     "Reproduce in Paint the below woman skeleton", "Create a Female
 *     Superhero Body".
 *   · Lesson 4 (pp. 44–45) — MALE COSTUME 1–6 and FEMALE COSTUME 1–5,
 *     "Reproduce in Paint the below faces", "Dress up your Superhero the way
 *     you like".
 *   · Lesson 5 (p. 46) — the two closing CARTOON PRACTISE projects.
 *
 * The guide geometry is drawn programmatically — simple circles, ovals,
 * triangles, blocks and joints in the proportions of the book's plates. It is
 * never the book's artwork.
 */

import { limbBlock, type GuideShape, type Point, type ToolId } from "./canvas-model";

// ── Little builders ─────────────────────────────────────────────────────────

const p = (x: number, y: number): Point => ({ x, y });

const line = (a: Point, b: Point, dashed?: boolean): GuideShape => ({
  kind: "line",
  a,
  b,
  dashed,
});

const poly = (points: Point[], closed = true, dashed?: boolean): GuideShape => ({
  kind: "poly",
  points,
  closed,
  dashed,
});

const oval = (c: Point, rx: number, ry: number, dashed?: boolean): GuideShape => ({
  kind: "ellipse",
  c,
  rx,
  ry,
  dashed,
});

const box = (a: Point, b: Point, dashed?: boolean): GuideShape => ({
  kind: "rect",
  a,
  b,
  dashed,
});

const joint = (c: Point, r = 6): GuideShape => ({ kind: "joint", c, r });

const tag = (
  text: string,
  at: Point,
  to?: Point,
  align: "left" | "right" | "center" = "left",
): GuideShape => ({ kind: "label", at, to, text, align });

/** One of the book's "arm blocks" / "leg blocks": a box laid along the bone. */
const blockOf = (a: Point, b: Point, halfWidth: number): GuideShape =>
  poly(limbBlock(a, b, halfWidth));

/** Points along an arc — smiles, capes, flowing hair, curved shoulders. */
function arcPoints(
  c: Point,
  rx: number,
  ry: number,
  fromDeg: number,
  toDeg: number,
  steps = 14,
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const deg = fromDeg + ((toDeg - fromDeg) * i) / steps;
    const t = (deg * Math.PI) / 180;
    out.push({ x: c.x + Math.cos(t) * rx, y: c.y + Math.sin(t) * ry });
  }
  return out;
}

/** Spikey hair (book p. 44): a row of teeth along the top of the head. */
function zigzag(from: Point, to: Point, teeth: number, height: number): Point[] {
  const out: Point[] = [from];
  for (let i = 0; i < teeth; i += 1) {
    const t0 = (i + 0.5) / teeth;
    const t1 = (i + 1) / teeth;
    out.push({
      x: from.x + (to.x - from.x) * t0,
      y: from.y + (to.y - from.y) * t0 - height,
    });
    out.push({
      x: from.x + (to.x - from.x) * t1,
      y: from.y + (to.y - from.y) * t1,
    });
  }
  return out;
}

/** The centre line of the sheet — every figure is built symmetrically on it. */
const CX = 512;

const flipPoint = (pt: Point, cx = CX): Point => ({ x: 2 * cx - pt.x, y: pt.y });

function flip(shape: GuideShape, cx = CX): GuideShape {
  switch (shape.kind) {
    case "line":
      return { ...shape, a: flipPoint(shape.a, cx), b: flipPoint(shape.b, cx) };
    case "poly":
      return { ...shape, points: shape.points.map((pt) => flipPoint(pt, cx)) };
    case "ellipse":
      return { ...shape, c: flipPoint(shape.c, cx) };
    case "rect":
      return { ...shape, a: flipPoint(shape.a, cx), b: flipPoint(shape.b, cx) };
    case "joint":
      return { ...shape, c: flipPoint(shape.c, cx) };
    case "label":
      return shape;
  }
}

/** Left side plus its mirror image — arms, legs, hands, feet. */
const both = (shapes: GuideShape[], cx = CX): GuideShape[] => [
  ...shapes,
  ...shapes.map((s) => flip(s, cx)),
];

// ── The male superhero, in the four steps of book p. 40 ─────────────────────

const MALE = {
  head: p(CX, 84),
  headRx: 33,
  headRy: 40,
  chin: p(CX, 124),
  neckBottom: 152,
  shoulderTip: p(424, 192),
  elbow: p(392, 272),
  wrist: p(378, 346),
  hipSocket: p(482, 358),
  knee: p(474, 448),
  ankle: p(474, 530),
};

const maleStep1 = (): GuideShape[] => [
  oval(MALE.head, MALE.headRx, MALE.headRy),
  line(p(CX, 38), p(CX, 134), true),
  line(p(474, 86), p(550, 86), true),
  line(p(499, 124), p(499, MALE.neckBottom)),
  line(p(525, 124), p(525, MALE.neckBottom)),
  poly([p(CX, 148), p(620, 184), p(404, 184)]),
  tag("HEAD", p(392, 70), p(478, 78), "right"),
  tag("GUIDELINES", p(630, 66), p(544, 80)),
  tag("NECK", p(392, 138), p(495, 138), "right"),
  tag("SHOULDERS", p(646, 182), p(566, 180)),
];

const maleStep2 = (): GuideShape[] => [
  poly([p(416, 184), p(608, 184), p(562, 302), p(462, 302)]),
  line(p(462, 302), p(562, 302)),
  poly([p(458, 302), p(566, 302), p(542, 360), p(482, 360)]),
  tag("TORSO", p(384, 226), p(452, 236), "right"),
  tag("WAIST LINE", p(628, 300), p(566, 302)),
  tag("HIPS", p(628, 344), p(548, 344)),
];

const maleStep3 = (): GuideShape[] => [
  ...both([
    line(MALE.shoulderTip, MALE.elbow),
    line(MALE.elbow, MALE.wrist),
    joint(MALE.elbow),
    joint(MALE.hipSocket),
    line(MALE.hipSocket, MALE.knee),
    line(MALE.knee, MALE.ankle),
    joint(MALE.knee),
  ]),
  tag("ELBOW", p(348, 272), p(384, 272), "right"),
  tag("HIP SOCKET", p(628, 372), p(548, 360)),
  tag("KNEE", p(408, 448), p(466, 448), "right"),
];

const maleStep4 = (): GuideShape[] => [
  ...both([
    oval(MALE.shoulderTip, 22, 22),
    blockOf(p(424, 196), MALE.elbow, 17),
    blockOf(MALE.elbow, p(378, 344), 13),
    blockOf(MALE.hipSocket, MALE.knee, 24),
    blockOf(MALE.knee, p(474, 528), 17),
    oval(p(374, 356), 15, 13),
    poly([p(474, 530), p(438, 548), p(478, 548)]),
  ]),
  tag("SHOULDER BALLS", p(640, 150), p(608, 178)),
  tag("ARM BLOCKS", p(344, 216), p(404, 230), "right"),
  tag("LEG BLOCKS", p(392, 404), p(462, 404), "right"),
  tag("SIMPLE FIST HANDS", p(668, 352), p(654, 356)),
  tag("SIMPLE FEET", p(616, 552), p(572, 546)),
];

/** The finished body, with no callouts — the base of the costume lessons. */
const maleBody = (): GuideShape[] =>
  [...maleStep1(), ...maleStep2(), ...maleStep3(), ...maleStep4()].filter(
    (s) => s.kind !== "label",
  );

// ── The female superhero, in the four steps of book p. 42 ───────────────────

const FEMALE = {
  head: p(CX, 88),
  headR: 33,
  shoulderTip: p(458, 166),
  elbow: p(432, 252),
  wrist: p(420, 326),
  hipSocket: p(486, 370),
  knee: p(478, 456),
  ankle: p(474, 528),
};

const femaleStep1 = (): GuideShape[] => [
  oval(FEMALE.head, FEMALE.headR, FEMALE.headR),
  line(p(CX, 48), p(CX, 132), true),
  line(p(474, 88), p(550, 88), true),
  line(p(503, 120), p(503, 146)),
  line(p(521, 120), p(521, 146)),
  poly([p(452, 162), p(CX, 146), p(572, 162)], false),
  tag("HEAD SHAPE", p(386, 72), p(480, 80), "right"),
  tag("GUIDELINES", p(630, 70), p(546, 84)),
  tag("SMALLER NECK", p(386, 136), p(499, 136), "right"),
  tag("SHORT WIDTH SHOULDERS", p(596, 168), p(566, 160)),
];

const femaleStep2 = (): GuideShape[] => [
  oval(p(CX, 234), 52, 76),
  line(p(466, 200), p(558, 200)),
  line(p(488, 306), p(536, 306)),
  oval(p(CX, 344), 50, 34),
  tag("TORSO", p(392, 216), p(462, 224), "right"),
  tag("BREAST LINE", p(618, 196), p(560, 200)),
  tag("WAIST", p(392, 306), p(484, 306), "right"),
  tag("HIPS", p(618, 344), p(564, 344)),
];

const femaleStep3 = (): GuideShape[] => [
  ...both([
    oval(p(490, 212), 19, 19),
    line(FEMALE.shoulderTip, FEMALE.elbow),
    line(FEMALE.elbow, FEMALE.wrist),
    joint(FEMALE.elbow),
    joint(FEMALE.hipSocket),
    line(FEMALE.hipSocket, FEMALE.knee),
    line(FEMALE.knee, FEMALE.ankle),
    joint(FEMALE.knee),
    poly([p(474, 528), p(448, 546), p(462, 552), p(482, 536)]),
  ]),
  tag("BREAST CIRCLES", p(600, 206), p(552, 210)),
  tag("ELBOW", p(374, 252), p(426, 252), "right"),
  tag("HIP SOCKET", p(374, 384), p(480, 372), "right"),
  tag("KNEE", p(404, 456), p(470, 456), "right"),
  tag("HEELS", p(600, 548), p(552, 546)),
];

const femaleStep4 = (): GuideShape[] => [
  ...both([
    oval(FEMALE.shoulderTip, 17, 17),
    blockOf(p(458, 170), FEMALE.elbow, 12),
    blockOf(FEMALE.elbow, p(420, 324), 10),
    blockOf(FEMALE.hipSocket, FEMALE.knee, 20),
    blockOf(FEMALE.knee, p(474, 526), 14),
    oval(p(416, 332), 12, 10),
  ]),
  tag("SHOULDER BALLS", p(618, 146), p(578, 162)),
  tag("ARM BLOCKS", p(354, 212), p(422, 222), "right"),
  tag("HIP SOCKET", p(354, 388), p(480, 372), "right"),
  tag("KEEP HANDS + FEET SIMPLE", p(614, 330), p(606, 330)),
];

const femaleBody = (): GuideShape[] =>
  [...femaleStep1(), ...femaleStep2(), ...femaleStep3(), ...femaleStep4()].filter(
    (s) => s.kind !== "label",
  );

// ── The exercise shape ──────────────────────────────────────────────────────

export interface DrawStep {
  id: string;
  /** The book's own step heading. */
  title: string;
  /** What to draw, in the book's words. */
  instruction: string;
  /** The Paint tools this step is done with — the ICT skill being practised. */
  tools: ToolId[];
  /** Construction geometry for this step, traced over on the canvas. */
  guide: GuideShape[];
}

export interface DrawExercise {
  id: string;
  /** The platform lesson this belongs to (g6-ct-01 … g6-ct-05). */
  lessonId: string;
  title: string;
  /** The task exactly as the book sets it. */
  brief: string;
  /** Which printed page it comes from. */
  source: string;
  steps: DrawStep[];
  /** The book's side notes, kept in its own words. */
  tips: string[];
}

// ── Lesson 1 · Drawing Bodies (book pp. 38–39) ──────────────────────────────

const l1TwoSkeletons: DrawExercise = {
  id: "g6-c3-l1-two-skeletons",
  lessonId: "g6-ct-01",
  title: "Reproduce the Two Skeletons",
  brief: "Reproduce in Paint the below two skeletons.",
  source: "Book p. 39 · PRACTISE IN PAINT",
  tips: [
    "Drawing cartoon body shapes is similar to cartoon heads. You can use the same basic shapes for both Female & Male: Squares, Circles, Triangles… Use basic shapes, pull them, stretch them and mix them up!",
    "In the book's screenshot the shapes are coloured in: a green head, an orange body and a light blue skirt for her; a brown head, a grey body and a pale yellow hip block for him.",
  ],
  steps: [
    {
      id: "l1a-heads",
      title: "Step 1 · The two heads",
      instruction:
        "Her head is a square, his head is an oval. Drag each one with the Shapes tool — the square on the left, the oval on the right.",
      tools: ["rect", "ellipse"],
      guide: [
        tag("FEMALE", p(330, 54), undefined, "center"),
        tag("MALE", p(690, 54), undefined, "center"),
        box(p(306, 80), p(354, 128)),
        oval(p(690, 104), 22, 28),
      ],
    },
    {
      id: "l1a-bodies",
      title: "Step 2 · The bodies",
      instruction:
        "Her body is a triangle-ish block, wider at the shoulders and tight at the waist. His body is a straight rectangle — male bodies are more square formed.",
      tools: ["line", "rect"],
      guide: [
        line(p(330, 128), p(330, 140)),
        poly([p(288, 140), p(372, 140), p(360, 214), p(300, 214)]),
        line(p(690, 132), p(690, 142)),
        box(p(654, 142), p(726, 224)),
      ],
    },
    {
      id: "l1a-hips",
      title: "Step 3 · The hips",
      instruction:
        "Add her skirt: a block that gets wider going down — more hips. His hips are one more rectangle under the body.",
      tools: ["line", "rect"],
      guide: [
        poly([p(296, 214), p(364, 214), p(374, 252), p(286, 252)]),
        box(p(654, 224), p(726, 258)),
      ],
    },
    {
      id: "l1a-limbs",
      title: "Step 4 · Stick arms and legs",
      instruction:
        "Once you have sketched the main body shape & head, add a stick neck, arms and legs and you've got a cartoon body. Use the Line tool: two lines for each arm, one for each leg.",
      tools: ["line"],
      guide: [
        ...both(
          [
            poly([p(288, 142), p(268, 180), p(276, 216)], false),
            line(p(306, 252), p(302, 340)),
          ],
          330,
        ),
        ...both(
          [
            poly([p(654, 148), p(634, 186), p(642, 222)], false),
            line(p(668, 258), p(664, 340)),
          ],
          690,
        ),
      ],
    },
    {
      id: "l1a-colour",
      title: "Step 5 · Colour them in",
      instruction:
        "Pick a colour in the colour box and click inside each closed shape with Fill with color, as in the book's screenshot.",
      tools: ["fill"],
      guide: [
        tag("FILL EACH CLOSED SHAPE", p(CX, 400), undefined, "center"),
        tag("A GAP LETS THE COLOUR ESCAPE", p(CX, 424), undefined, "center"),
      ],
    },
  ],
};

const l1FemaleShape: DrawExercise = {
  id: "g6-c3-l1-female-body-shape",
  lessonId: "g6-ct-01",
  title: "Build a Female Body Shape",
  brief: "Experiment with Shapes and Build a Female Body Shape.",
  source: "Book pp. 38–39 · FEMALE BODY SHAPES / EXCERCISE",
  tips: [
    "The difference between Female & Male body shapes is basically in having more round & triangular shapes, more hips, tighter waist, more curves and a breast line.",
    "You can experiment and mix it up — the guide is one answer out of many.",
  ],
  steps: [
    {
      id: "l1b-head",
      title: "Step 1 · Head and neck",
      instruction: "Start with the head shape you like, then a stick neck under it.",
      tools: ["ellipse", "line"],
      guide: [
        oval(p(CX, 86), 30, 30),
        line(p(504, 116), p(504, 140)),
        line(p(520, 116), p(520, 140)),
      ],
    },
    {
      id: "l1b-round",
      title: "Step 2 · A round figure",
      instruction:
        "Sketch the main body shape as a round figure, and mark the breast line across it.",
      tools: ["ellipse", "line"],
      guide: [
        oval(p(CX, 210), 60, 66),
        line(p(466, 178), p(558, 178)),
        tag("ROUND FIGURE", p(618, 210), p(576, 210)),
        tag("BREAST LINE", p(392, 178), p(452, 178), "right"),
      ],
    },
    {
      id: "l1b-waist",
      title: "Step 3 · Tight waist, more hips",
      instruction:
        "Keep the waist line tight, then hang a triangular shape under it — more hips.",
      tools: ["line", "triangle"],
      guide: [
        line(p(486, 278), p(538, 278)),
        poly([p(CX, 268), p(596, 352), p(428, 352)]),
        tag("TIGHT WAIST LINE", p(392, 278), p(482, 278), "right"),
        tag("MORE HIPS", p(618, 340), p(566, 340)),
        tag("TRIANGULAR", p(618, 300), p(556, 312)),
      ],
    },
    {
      id: "l1b-limbs",
      title: "Step 4 · Stick arms and legs",
      instruction:
        "Add a stick arm and leg on each side, and put a dot on every elbow and knee.",
      tools: ["line", "pencil"],
      guide: [
        ...both([
          poly([p(456, 168), p(424, 250), p(414, 322)], false),
          joint(p(424, 250)),
          poly([p(468, 352), p(462, 440), p(458, 520)], false),
          joint(p(462, 440)),
        ]),
        tag("ELBOWS", p(370, 250), p(418, 250), "right"),
        tag("KNEES", p(618, 440), p(556, 440)),
        tag("MORE CURVES", p(360, 322), p(408, 322), "right"),
      ],
    },
    {
      id: "l1b-colour",
      title: "Step 5 · Colour your body shape",
      instruction:
        "Close every outline, then fill the head, the body and the hips with colours of your choice.",
      tools: ["fill", "brush"],
      guide: [],
    },
  ],
};

const l1MaleShape: DrawExercise = {
  id: "g6-c3-l1-male-body-shape",
  lessonId: "g6-ct-01",
  title: "Construct a Male Body Shape",
  brief: "Experiment with Shapes and Construct a Male Body Shape.",
  source: "Book pp. 38–39 · MALE BODY SHAPES / EXCERCISE",
  tips: [
    "Male bodies use more solid shapes and are taller in structure than women's. The bodies are more bulky & buff, square formed and straight formed. Their shoulders are normally wider.",
    "The last plate on the page mixes it up with a beer belly — a big circle instead of a straight body. Try that variation too.",
  ],
  steps: [
    {
      id: "l1c-head",
      title: "Step 1 · A square head",
      instruction: "Male shapes are square formed — start with a square head and a neck.",
      tools: ["rect", "line"],
      guide: [
        box(p(486, 52), p(538, 104)),
        line(p(500, 104), p(500, 124)),
        line(p(524, 104), p(524, 124)),
        tag("SQUARE FORM", p(618, 78), p(544, 78)),
      ],
    },
    {
      id: "l1c-shoulders",
      title: "Step 2 · Wide shoulders",
      instruction:
        "Their shoulders are normally wider — drag a wide flat triangle under the neck.",
      tools: ["triangle"],
      guide: [
        poly([p(CX, 120), p(628, 168), p(396, 168)]),
        tag("WIDE SHOULDERS", p(648, 164), p(600, 162)),
      ],
    },
    {
      id: "l1c-body",
      title: "Step 3 · A straight body and a waist line",
      instruction:
        "Draw the body as one straight rectangle, then a waist line across the bottom of it and a hip block under that.",
      tools: ["rect", "line"],
      guide: [
        box(p(446, 168), p(578, 300)),
        line(p(446, 300), p(578, 300)),
        box(p(452, 300), p(572, 346)),
        tag("TALLER", p(392, 230), p(442, 230), "right"),
        tag("WAIST LINE", p(618, 300), p(582, 300)),
      ],
    },
    {
      id: "l1c-limbs",
      title: "Step 4 · Bulky arms and legs",
      instruction:
        "Male arms are bulky & buff, so draw them as blocks instead of thin sticks. Add the legs the same way.",
      tools: ["rect", "line"],
      guide: [
        ...both([
          blockOf(p(420, 180), p(404, 262), 15),
          blockOf(p(404, 262), p(398, 336), 12),
          blockOf(p(474, 346), p(468, 440), 20),
          blockOf(p(468, 440), p(466, 526), 15),
        ]),
        tag("BULKY ARMS", p(370, 220), p(412, 220), "right"),
      ],
    },
    {
      id: "l1c-belly",
      title: "Step 5 · Mix it up: the beer belly",
      instruction:
        "Try the last plate on the page: swap the straight body for one big round belly, then colour your body shape in.",
      tools: ["ellipse", "fill"],
      guide: [
        oval(p(CX, 292), 74, 62, true),
        tag("BEER BELLY", p(628, 292), p(590, 292)),
      ],
    },
  ],
};

// ── Lesson 2 · Male Superhero Body (book pp. 40–41) ─────────────────────────

const l2MaleSuperhero: DrawExercise = {
  id: "g6-c3-l2-male-superhero-body",
  lessonId: "g6-ct-02",
  title: "Step-by-Step Body Construction",
  brief:
    "We are going to start by constructing a basic male superhero body. Superheros need more than one shape to build a body, so we will go thru step-by-step to assemble the body parts using basic shape blocks. Remember to use guidlines and the tips we learned in Grade 4. Let's start!",
  source: "Book p. 40 · STEP-BY-STEP BODY CONSTRUCTION",
  tips: [
    "Sketch the construction shapes on the Sketch layer, then draw the real outline on the Ink layer — at the end you can hide the sketch instead of erasing it.",
    "Remember to use guidlines: the dotted cross through the head keeps both eyes on the same line.",
  ],
  steps: [
    {
      id: "l2a-step1",
      title: "STEP 1 · Head, neck and shoulders",
      instruction:
        "Start with drawing a stick figure. Add the Head, Neck and Shoulders. Pick any Head shape you would like for your character and add a neck. Then add a triangle base for the shoulder width.",
      tools: ["ellipse", "line", "triangle"],
      guide: maleStep1(),
    },
    {
      id: "l2a-step2",
      title: "STEP 2 · Torso, waist and hips",
      instruction:
        "Next let's add the muscular Torso & Waist/Hips area below the shoulders. Superheroes males have athletic bodies, so the torsos are wide from the top, and the Hips are tight. You can draw half circles, rectangles or a triangular shapes for the hips.",
      tools: ["line", "triangle", "rect"],
      guide: maleStep2(),
    },
    {
      id: "l2a-step3",
      title: "STEP 3 · Legs, arms and joints",
      instruction:
        "Add the stick Legs & Arms. Don't forget to add the Joints (Elbows & Knees). Note that the legs attach to the hips as sockets, as shown below.",
      tools: ["line", "pencil"],
      guide: maleStep3(),
    },
    {
      id: "l2a-step4",
      title: "STEP 4 · The blocks, hands and feet",
      instruction:
        "Add the Arm & Leg Blocks + Shoulder Balls + Hands & Feet. You don't need to draw the hands & feet in detail.",
      tools: ["rect", "ellipse", "brush"],
      guide: maleStep4(),
    },
    {
      id: "l2a-own",
      title: "Now it is Your Turn to Try",
      instruction:
        "Create your own Male Superhero Body using shape variations of your choice — a rounder head, wider shoulders, half circles for the hips. Hide the Sketch layer when the outline is finished.",
      tools: ["brush", "fill", "eraser"],
      guide: [],
    },
  ],
};

const l2PartOfBody: DrawExercise = {
  id: "g6-c3-l2-part-of-the-body",
  lessonId: "g6-ct-02",
  title: "Reproduce the Part of the Body",
  brief: "Reproduce in Paint the below part of the body.",
  source: "Book p. 41 · PRACTISE IN PAINT",
  tips: [
    "The screenshot shows the shoulder triangle twice: empty on the left, and coloured under a head on the right.",
    "In the screenshot the head is grey, the neck green, the chest pink and the shoulders orange — pick your own colours if you prefer.",
  ],
  steps: [
    {
      id: "l2b-triangle",
      title: "Step 1 · The empty shoulder triangle",
      instruction:
        "Drag one wide, flat triangle on the left of the sheet — that is the triangle base for the shoulder width, on its own.",
      tools: ["triangle"],
      guide: [poly([p(300, 300), p(430, 356), p(170, 356)])],
    },
    {
      id: "l2b-head",
      title: "Step 2 · The head with the face",
      instruction:
        "On the right, draw a big oval head, two small oval eyes and a little rectangle for the mouth.",
      tools: ["ellipse", "rect"],
      guide: [
        oval(p(700, 232), 66, 84),
        oval(p(676, 214), 15, 11),
        oval(p(724, 214), 15, 11),
        box(p(682, 276), p(718, 288)),
      ],
    },
    {
      id: "l2b-neck",
      title: "Step 3 · Neck, chest and shoulders",
      instruction:
        "Add a rectangle neck under the chin, a small triangle chest, and the same wide shoulder triangle behind it.",
      tools: ["rect", "triangle"],
      guide: [
        box(p(684, 316), p(716, 344)),
        poly([p(700, 344), p(724, 386), p(676, 386)]),
        poly([p(700, 340), p(830, 386), p(570, 386)]),
      ],
    },
    {
      id: "l2b-colour",
      title: "Step 4 · Colour it like the screenshot",
      instruction:
        "Use Fill with color on every closed part: the head, the neck, the chest and the two wings of the shoulder triangle.",
      tools: ["fill"],
      guide: [],
    },
  ],
};

// ── Lesson 3 · Female Superhero Body (book pp. 42–43) ───────────────────────

const l3FemaleSuperhero: DrawExercise = {
  id: "g6-c3-l3-female-superhero-body",
  lessonId: "g6-ct-03",
  title: "Step-by-Step Body Construction",
  brief:
    "Now we will learn the step-by-step process to create a female superhero body. Female bodies are usually thinner than men's, they have more curves.",
  source: "Book p. 42 · STEP-BY-STEP BODY CONSTRUCTION",
  tips: [
    "Female Superheroes usually wear heels, so draw the feet on an angle.",
    "The shoulders float above the torso area — leave a small gap between the shoulder line and the top of the oval.",
  ],
  steps: [
    {
      id: "l3a-step1",
      title: "STEP 1 · Head, neck and shoulders",
      instruction:
        "Begin with drawing a round Head, small Neck and Shoulders. Female necks & shoulders are thinner than men's.",
      tools: ["ellipse", "line"],
      guide: femaleStep1(),
    },
    {
      id: "l3a-step2",
      title: "STEP 2 · Torso, hips and breast line",
      instruction:
        "Put on the round Torso, Hips, and Breast line. The shoulders will float above torso area, as seen below. Keep the waist line tight.",
      tools: ["ellipse", "line"],
      guide: femaleStep2(),
    },
    {
      id: "l3a-step3",
      title: "STEP 3 · Arms, legs, heels and breast circles",
      instruction:
        "Now add the stick Arms & Legs, plus Elbows & Knees. Female Superheroes usually wear heels, so draw the feet on an angle. Also don't forget to add the breast circles.",
      tools: ["line", "ellipse", "pencil"],
      guide: femaleStep3(),
    },
    {
      id: "l3a-step4",
      title: "STEP 4 · Define the body features",
      instruction:
        "Next let us define the body features. Build on the Arms, Legs + Shoulders + Hands & Feet. You don't need to draw the hands & feet in detail.",
      tools: ["rect", "ellipse", "brush"],
      guide: femaleStep4(),
    },
    {
      id: "l3a-own",
      title: "You Try! Create a Female Superhero Body",
      instruction:
        "Now build your own: keep the curves, keep the waist tight, and change whatever else you like. Hide the Sketch layer when your outline is done.",
      tools: ["brush", "fill", "eraser"],
      guide: [],
    },
  ],
};

const l3WomanSkeleton: DrawExercise = {
  id: "g6-c3-l3-woman-skeleton",
  lessonId: "g6-ct-03",
  title: "Reproduce the Woman Skeleton",
  brief: "Reproduce in Paint the below woman skeleton.",
  source: "Book p. 43 · PRACTISE IN PAINT",
  tips: [
    "The screenshot shows the same skeleton three times: outline only, outline with the shoulder line, and the third one coloured with a yellow head and a grey body.",
    "Three ovals and two lines make a whole woman — circle, oval, oval.",
  ],
  steps: [
    {
      id: "l3b-first",
      title: "Step 1 · The first skeleton",
      instruction:
        "On the left, draw the round head, the long oval torso under it and the small oval hips at the bottom.",
      tools: ["ellipse"],
      guide: [
        oval(p(250, 130), 42, 46),
        oval(p(250, 268), 46, 82),
        oval(p(250, 388), 38, 30),
      ],
    },
    {
      id: "l3b-second",
      title: "Step 2 · The second skeleton, with shoulders",
      instruction:
        "Draw the same three ovals in the middle, then add the thin shoulder line floating above the torso.",
      tools: ["ellipse", "line"],
      guide: [
        oval(p(CX, 130), 42, 46),
        poly([p(462, 194), p(CX, 182), p(562, 194)], false),
        oval(p(CX, 268), 46, 82),
        oval(p(CX, 388), 38, 30),
      ],
    },
    {
      id: "l3b-third",
      title: "Step 3 · The third one, coloured with legs",
      instruction:
        "Draw the third skeleton on the right, add two stick legs under the hips, then fill the head and the torso with colour as in the screenshot.",
      tools: ["ellipse", "line", "fill"],
      guide: [
        oval(p(774, 130), 42, 46),
        poly([p(724, 194), p(774, 182), p(824, 194)], false),
        oval(p(774, 268), 46, 82),
        oval(p(774, 388), 38, 30),
        ...both([line(p(758, 414), p(752, 520))], 774),
      ],
    },
  ],
};

// ── Lesson 4 · Dressing Up a Superhero (book pp. 44–45) ─────────────────────

const FACE_CENTRES = [p(220, 268), p(CX, 268), p(804, 268)];

const faceOutline = (c: Point): GuideShape => oval(c, 96, 118);

/** The book's almond superhero eye. */
const almondEye = (c: Point, w: number, h: number): GuideShape =>
  poly([
    ...arcPoints(c, w, h, 180, 360, 8),
    ...arcPoints({ x: c.x, y: c.y + h * 0.2 }, w, h * 0.9, 0, 180, 8),
  ]);

const l4Faces: DrawExercise = {
  id: "g6-c3-l4-three-faces",
  lessonId: "g6-ct-04",
  title: "Reproduce the Three Faces",
  brief: "Reproduce in Paint the below faces.",
  source: "Book p. 45 · PRACTISE IN PAINT",
  tips: [
    "Choose a Mask style: Full Face coverage, Eye coverage, Half Head coverage or a Crown, are all options to try.",
    "It is optional to draw the Eyes, Nose or Mouth. Save room for the hair, and/or mask.",
  ],
  steps: [
    {
      id: "l4a-heads",
      title: "Step 1 · Three head shapes",
      instruction:
        "Draw three big oval heads across the sheet, the same size, with a gap between them.",
      tools: ["ellipse"],
      guide: FACE_CENTRES.map(faceOutline),
    },
    {
      id: "l4a-full",
      title: "Step 2 · Full face coverage",
      instruction:
        "On the first head, draw the two big almond eyes and a small smile — the whole head is the mask, so there is nothing else on it.",
      tools: ["pencil", "brush"],
      guide: [
        almondEye(p(186, 250), 34, 20),
        almondEye(p(258, 250), 34, 20),
        poly(arcPoints(p(220, 296), 34, 26, 20, 160), false),
        tag("FULL FACE", p(220, 410), undefined, "center"),
      ],
    },
    {
      id: "l4a-eyes",
      title: "Step 3 · Eye coverage",
      instruction:
        "On the second head, the mask covers only the eyes: draw the eye holes, then the mask outline around them, coming to a point on each cheek.",
      tools: ["pencil", "brush"],
      guide: [
        almondEye(p(478, 246), 32, 19),
        almondEye(p(546, 246), 32, 19),
        poly([
          p(416, 224),
          p(478, 208),
          p(CX, 224),
          p(546, 208),
          p(608, 224),
          p(566, 286),
          p(CX, 266),
          p(458, 286),
        ]),
        poly(arcPoints(p(CX, 300), 26, 22, 20, 160), false),
        tag("EYE COVERAGE", p(CX, 410), undefined, "center"),
      ],
    },
    {
      id: "l4a-half",
      title: "Step 4 · Half head coverage",
      instruction:
        "On the third head, the mask covers the bottom half: draw the eyes, then one line across the face and colour everything under it.",
      tools: ["pencil", "line", "fill"],
      guide: [
        almondEye(p(770, 242), 32, 19),
        almondEye(p(838, 242), 32, 19),
        poly(
          [
            p(714, 276),
            ...arcPoints(p(804, 268), 96, 118, 20, 160),
            p(894, 276),
          ],
          false,
        ),
        tag("HALF HEAD", p(804, 410), undefined, "center"),
      ],
    },
  ],
};

const l4MaleCostume: DrawExercise = {
  id: "g6-c3-l4-male-costume",
  lessonId: "g6-ct-04",
  title: "Dress Up a Male Superhero",
  brief:
    "Once you have built your superhero shape its time to add the details, and tidy up the lines to finish the drawing!",
  source: "Book p. 44 · MALE COSTUME",
  tips: [
    "Superheroes costumes are typically tight, it helps show their muscles.",
    "Spikey hair is alwasy nice for male superheroes.",
    "Sketch the body on the Sketch layer and dress it on the Ink layer, so cleaning up is one click.",
  ],
  steps: [
    {
      id: "l4b-body",
      title: "Step 0 · The body under the costume",
      instruction:
        "Trace the superhero body you built in Lesson 2 — the costume goes on top of it.",
      tools: ["ellipse", "line", "rect"],
      guide: maleBody(),
    },
    {
      id: "l4b-face",
      title: "1 · The face",
      instruction:
        "It is optional to draw the Eyes, Nose or Mouth. Save room for the hair, and/or mask.",
      tools: ["pencil"],
      guide: [
        almondEye(p(496, 82), 15, 9),
        almondEye(p(528, 82), 15, 9),
        line(p(504, 106), p(520, 106)),
      ],
    },
    {
      id: "l4b-mask",
      title: "2 · Mask and hair",
      instruction:
        "Choose a Mask style: Full Face coverage, Eye coverage, Half Head coverage or a Crown, are all options to try. Do not forget to add Hair on top of the head. Spikey hair is alwasy nice for male superheroes.",
      tools: ["pencil", "brush"],
      guide: [
        poly([p(478, 66), p(496, 58), p(CX, 70), p(528, 58), p(546, 66), p(534, 98), p(CX, 90), p(490, 98)]),
        poly(zigzag(p(478, 56), p(546, 56), 5, 22), false),
        tag("SPIKEY HAIR", p(628, 40), p(548, 50)),
      ],
    },
    {
      id: "l4b-muscles",
      title: "3 · Abs and muscle lines",
      instruction:
        "Superheroes costumes are typically tight, it helps show their muscles. Draw the Abs, Under breast lines to define the muscles on the legs and torso area.",
      tools: ["pencil", "line"],
      guide: [
        poly(arcPoints(p(486, 214), 26, 20, 0, 150, 8), false),
        poly(arcPoints(p(538, 214), 26, 20, 30, 180, 8), false),
        line(p(486, 244), p(538, 244)),
        line(p(486, 266), p(538, 266)),
        line(p(CX, 236), p(CX, 288)),
        ...both([line(p(486, 398), p(480, 434))]),
        tag("UNDER BREAST LINES", p(628, 214), p(546, 216)),
        tag("ABS", p(392, 258), p(478, 258), "right"),
        tag("DEFINE MUSCLES", p(628, 410), p(548, 412)),
      ],
    },
    {
      id: "l4b-gloves",
      title: "4 · Gloves and boots",
      instruction:
        "Add Gloves & Boots. Experiment with high, low, big or small styles.",
      tools: ["rect", "brush"],
      guide: [
        ...both([
          blockOf(p(390, 300), p(378, 348), 16),
          blockOf(p(474, 470), p(474, 532), 20),
        ]),
        tag("ADD GLOVES", p(340, 320), p(372, 324), "right"),
        tag("ADD BOOTS", p(628, 500), p(556, 500)),
      ],
    },
    {
      id: "l4b-extras",
      title: "5 · Cape, belt and symbol",
      instruction:
        "Next add Extra Details. Try options like adding a logo, a symbol, a long cape or short cape, an underwear or a belt, to distinguish your character.",
      tools: ["line", "triangle", "brush"],
      guide: [
        poly(
          [p(424, 186), p(352, 470), p(CX, 430), p(672, 470), p(600, 186)],
          false,
        ),
        box(p(456, 296), p(568, 320)),
        poly([p(516, 212), p(496, 250), p(510, 250), p(500, 284), p(532, 240), p(516, 240)]),
        tag("SUPERPOWER SYMBOL", p(344, 224), p(496, 232), "right"),
        tag("ADD A CAPE", p(660, 176), p(604, 190)),
        tag("BELT", p(628, 308), p(572, 308)),
      ],
    },
    {
      id: "l4b-clean",
      title: "6 · Clean up and colour",
      instruction:
        "Once you are done, clean up your lines, and color your drawing! Hide the Sketch layer, rub out what is left over with the Eraser, then fill each part with colour.",
      tools: ["eraser", "fill"],
      guide: [],
    },
  ],
};

const l4FemaleCostume: DrawExercise = {
  id: "g6-c3-l4-female-costume",
  lessonId: "g6-ct-04",
  title: "Dress Up a Female Superhero",
  brief:
    "Female Superheroes also wear tight fit costumes. Their hair is usually loose, and they tend to have more calf definition than men.",
  source: "Book p. 44 · FEMALE COSTUME",
  tips: [
    "Most heroines have long flowy Hair. Make it look like it is wind-blown by drawing many S-curved strokes to show movement.",
    "The thighs are slightly larger than her calf and both have muscle definition.",
  ],
  steps: [
    {
      id: "l4c-body",
      title: "Step 0 · The body under the costume",
      instruction:
        "Trace the female superhero body you built in Lesson 3 — the costume goes on top of it.",
      tools: ["ellipse", "line", "rect"],
      guide: femaleBody(),
    },
    {
      id: "l4c-face",
      title: "1 · Face and mask",
      instruction:
        "Start by drawing the Eyes, Brows, Nose, Ears and Mouth, then add the style of Mask you would like.",
      tools: ["pencil"],
      guide: [
        almondEye(p(498, 84), 14, 9),
        almondEye(p(526, 84), 14, 9),
        line(p(486, 72), p(506, 68)),
        line(p(518, 68), p(538, 72)),
        line(p(505, 104), p(519, 104)),
        poly([p(482, 74), p(498, 66), p(CX, 78), p(526, 66), p(542, 74), p(530, 96), p(CX, 90), p(494, 96)]),
      ],
    },
    {
      id: "l4c-flow",
      title: "2 · The flowing line and the chest",
      instruction:
        "Next, draw the main line from the Torso area through the Legs, in a nice flowing line. The thighs are slightly larger than her calf and both have muscle definition. Outline small curved strokes for her Chest & Neck area.",
      tools: ["pencil", "brush"],
      guide: [
        poly(arcPoints(p(492, 206), 22, 18, 0, 150, 8), false),
        poly(arcPoints(p(532, 206), 22, 18, 30, 180, 8), false),
        ...both([
          poly([p(488, 312), p(482, 372), p(478, 456), p(474, 522)], false),
          poly(arcPoints(p(496, 476), 18, 30, 250, 300, 8), false),
        ]),
        tag("CURVY CALVES", p(618, 480), p(556, 482)),
        tag("SMALL CURVED STROKES FOR CHEST", p(340, 196), p(470, 206), "right"),
      ],
    },
    {
      id: "l4c-hair",
      title: "3 · Air flowing hair",
      instruction:
        "Most heroines have long flowy Hair. Make it look like it is wind-blown by drawing many S-curved strokes to show movement.",
      tools: ["brush", "pencil"],
      guide: [
        poly(arcPoints(p(500, 92), 46, 58, 190, 350, 16), false),
        poly([p(546, 62), p(600, 82), p(636, 130), p(618, 186), p(586, 150), p(568, 108)], false),
        poly([p(546, 76), p(596, 108), p(614, 158), p(596, 200)], false),
        tag("AIR FLOWING HAIR", p(650, 116), p(622, 128)),
      ],
    },
    {
      id: "l4c-details",
      title: "4 · Pads, braces, boots and heels",
      instruction:
        "Complete her superhero costume by adding Details like gloves or arm braces, shoulder pads, a cape, knees pads, spray on boots and heels, a symbol, lines or a weapon/tool.",
      tools: ["rect", "ellipse", "brush"],
      guide: [
        ...both([
          poly(arcPoints(FEMALE.shoulderTip, 24, 18, 180, 360, 10), true),
          blockOf(p(438, 282), p(422, 324), 12),
          oval(p(478, 456), 15, 13),
          blockOf(p(478, 466), p(474, 528), 16),
        ]),
        tag("SHOULDER PADS", p(340, 156), p(432, 162), "right"),
        tag("ARM BRACES", p(618, 300), p(586, 302)),
        tag("KNEE PADS", p(340, 456), p(464, 456), "right"),
        tag("SPRAY-ON THIGH HIGH BOOTS", p(614, 500), p(556, 500)),
      ],
    },
    {
      id: "l4c-clean",
      title: "5 · Erase, outline, colour",
      instruction:
        "Erase unnecessary lines, outline the drawing with black marker or color it. Have Fun!",
      tools: ["eraser", "brush", "fill"],
      guide: [],
    },
  ],
};

// ── Lesson 5 · Drawing Projects (book p. 46) ────────────────────────────────

/** The proportion ladder: heads stacked up the centre line, as in the plates. */
function headLadder(heads: number, headHeight: number, top: number): GuideShape[] {
  const out: GuideShape[] = [line(p(CX, top), p(CX, top + heads * headHeight), true)];
  for (let i = 0; i <= heads; i += 1) {
    const y = top + i * headHeight;
    out.push(line(p(CX - 130, y), p(CX + 130, y), true));
    if (i < heads) {
      out.push(
        tag(String(i + 1), p(CX + 148, y + headHeight / 2), undefined, "center"),
      );
    }
  }
  return out;
}

const l5MaleProject: DrawExercise = {
  id: "g6-c3-l5-male-project",
  lessonId: "g6-ct-05",
  title: "Project · A Simple Male Cartoon Body",
  brief: "Draw a simple male cartoon body and try to reproduce it in Paint.",
  source: "Book p. 46 · CARTOON PRACTISE",
  tips: [
    "Male bodies use more solid shapes and are taller in structure than women's — wider shoulders, square form, a waist line.",
    "This is your own drawing: the ladder only keeps the parts the right size next to each other.",
  ],
  steps: [
    {
      id: "l5a-ladder",
      title: "Step 1 · Set out the proportions",
      instruction:
        "Sketch the guideline down the middle and the head-height ladder, so the body stays the same size all the way down. Six heads is a good cartoon height.",
      tools: ["line", "pencil"],
      guide: headLadder(6, 76, 56),
    },
    {
      id: "l5a-head",
      title: "Step 2 · Head and shoulders",
      instruction:
        "Draw the head inside the first rung, add a neck, then the shoulder shape — wider than the head on both sides.",
      tools: ["ellipse", "rect", "triangle"],
      guide: [],
    },
    {
      id: "l5a-body",
      title: "Step 3 · Body, waist and hips",
      instruction:
        "Fill the next two rungs with the body: a solid shape from the shoulders down, a waist line and a hip block.",
      tools: ["rect", "triangle", "line"],
      guide: [],
    },
    {
      id: "l5a-limbs",
      title: "Step 4 · Arms and legs",
      instruction:
        "Arms reach about halfway down the third rung; legs take the last two and a half. Mark the elbows and knees with a dot before you thicken them.",
      tools: ["line", "rect"],
      guide: [],
    },
    {
      id: "l5a-face",
      title: "Step 5 · Face and details",
      instruction:
        "Add the features: eyes on the guideline, a mouth, hair, and anything that makes the character yours.",
      tools: ["pencil", "brush"],
      guide: [],
    },
    {
      id: "l5a-colour",
      title: "Step 6 · Clean up and colour",
      instruction:
        "Hide the Sketch layer, erase what is left over, then colour every closed part and save your picture.",
      tools: ["eraser", "fill"],
      guide: [],
    },
  ],
};

const l5FemaleProject: DrawExercise = {
  id: "g6-c3-l5-female-project",
  lessonId: "g6-ct-05",
  title: "Project · A Simple Female Cartoon Body",
  brief: "Draw a simple female cartoon body and try to reproduce it in Paint.",
  source: "Book p. 46 · CARTOON PRACTISE",
  tips: [
    "More round & triangular shapes, more hips, tighter waist, more curves and a breast line.",
    "Draw it on paper first if you like — the book asks you to draw it, then reproduce it in Paint.",
  ],
  steps: [
    {
      id: "l5b-ladder",
      title: "Step 1 · Set out the proportions",
      instruction:
        "Sketch the centre guideline and the head-height ladder. Female bodies are usually thinner than men's, so keep the shapes narrower.",
      tools: ["line", "pencil"],
      guide: headLadder(6, 76, 56),
    },
    {
      id: "l5b-head",
      title: "Step 2 · Round head and small neck",
      instruction:
        "Draw a round head in the first rung, a smaller neck and short-width shoulders.",
      tools: ["ellipse", "line"],
      guide: [],
    },
    {
      id: "l5b-body",
      title: "Step 3 · Round body, tight waist, more hips",
      instruction:
        "Draw the round figure with the breast line across it, pull the waist in, then widen the hips.",
      tools: ["ellipse", "line", "triangle"],
      guide: [],
    },
    {
      id: "l5b-limbs",
      title: "Step 4 · Arms, legs and heels",
      instruction:
        "Add the stick arms and legs with a dot on every elbow and knee, and draw the feet on an angle for heels.",
      tools: ["line", "pencil"],
      guide: [],
    },
    {
      id: "l5b-face",
      title: "Step 5 · Face, hair and details",
      instruction:
        "Add the eyes on the guideline, the mouth, and long hair drawn with S-curved strokes.",
      tools: ["pencil", "brush"],
      guide: [],
    },
    {
      id: "l5b-colour",
      title: "Step 6 · Clean up and colour",
      instruction:
        "Hide the Sketch layer, erase the leftovers, colour your drawing and save it to your portfolio.",
      tools: ["eraser", "fill"],
      guide: [],
    },
  ],
};

// ── The chapter, in the book's order ────────────────────────────────────────

export const DRAW_EXERCISES: DrawExercise[] = [
  l1TwoSkeletons,
  l1FemaleShape,
  l1MaleShape,
  l2MaleSuperhero,
  l2PartOfBody,
  l3FemaleSuperhero,
  l3WomanSkeleton,
  l4Faces,
  l4MaleCostume,
  l4FemaleCostume,
  l5MaleProject,
  l5FemaleProject,
];

/** Every drawing task of one lesson, in the order the book sets them. */
export function exercisesForLesson(lessonId: string): DrawExercise[] {
  return DRAW_EXERCISES.filter((exercise) => exercise.lessonId === lessonId);
}

/** One task by id — for deep links straight into the studio. */
export function exerciseById(id: string): DrawExercise | undefined {
  return DRAW_EXERCISES.find((exercise) => exercise.id === id);
}

/**
 * What the canvas shows at a given step: this step's construction geometry,
 * plus the shapes of the steps already passed drawn further back — the way the
 * book's plates keep the earlier stages visible under the new one. The old
 * callouts are dropped so only the current step's labels are readable.
 */
export function guideUpTo(
  exercise: DrawExercise,
  stepIndex: number,
): { current: GuideShape[]; echo: GuideShape[] } {
  const index = Math.max(0, Math.min(stepIndex, exercise.steps.length - 1));
  return {
    current: exercise.steps[index]?.guide ?? [],
    echo: exercise.steps
      .slice(0, index)
      .flatMap((step) => step.guide)
      .filter((shape) => shape.kind !== "label"),
  };
}
