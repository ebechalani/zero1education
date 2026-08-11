import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Unit "MakeCode for micro:bit" · Lesson 6 of the printed 2023 chapter.
 * Book: "Controlling the leds of the Micro:bit" — the matrix, the (x, y) address,
 * the Led category, and the project that illuminates the first and last rows.
 */
export const lessonMb06: Lesson = {
  id: "g6-mb-06",
  slug: "led-matrix",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 6,
  title: "Controlling the LEDs of the micro:bit",
  tagline: "25 tiny lights, 25 unique addresses",
  description:
    "The micro:bit screen is a matrix of 25 LEDs, and every single one of them has its own address. Learn to read the (x, y) of any dot, then switch LEDs on and off yourself from MakeCode.",
  objectives: [
    "Define a matrix: a series of dots arranged in rows and columns",
    "Read the address (x, y) of a dot — x gives the column, y gives the row",
    "Locate any of the 25 LEDs of the micro:bit screen by its unique address",
    "Use the blocks of the Led category in MakeCode to control the LEDs",
    "Build the script that illuminates the first column, then the first and last rows",
  ],
  skillIds: ["pc-microbit", "prog-blocks", "ct-abstraction"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "LayoutGrid",
  status: "published",
  teacherGuide: {
    overview:
      "This is the lesson where the screen stops being a picture and becomes a grid of 25 addressable lights. Do the printed matrix exercises on paper first — students must be able to point at a dot and say its address out loud before they touch MakeCode. Everything in Lesson 7 (loops) depends on this being solid.",
    tips: [
      "Unplugged warm-up: tape a 5 × 5 grid on the floor, call out an address, a student stands on that square. Errors are visible and funny.",
      "Insist on the order: x first (across), y second (down). Say it as 'x is the column, y is the row' — the book's own wording.",
      "The origin is the TOP-left, and y grows downwards. That surprises students who have met graphs in maths.",
      "For the Project, ask students what stays the same in each row before they drag a single block — y is fixed, x changes.",
    ],
    answersNote:
      "First-column script: plot (0,0) (0,1) (0,2) (0,3) (0,4). First and last rows: plot (0,0) (1,0) (2,0) (3,0) (4,0) and (0,4) (1,4) (2,4) (3,4) (4,4).",
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "A Grid of Dots",
      blocks: [
        {
          id: "mb06-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Until now the micro:bit drew hearts and numbers **for** you — you chose a picture and MakeCode did the rest.\n\nToday you take the screen apart. Twenty-five little lights, and you decide which ones switch on. But to command a light you must first be able to *name* it. Every LED needs an address.",
        },
        {
          id: "mb06-d2",
          type: "activity",
          activity: {
            id: "mb06-d-poll",
            kind: "mcq",
            prompt:
              "The book shows a grid of dots. Its top-left dot is `(0,0)`, its top-right dot is `(7,0)`, and its bottom-right dot is `(7,7)`. How many dots are there in **one row**?",
            options: [
              { id: "a", text: "6" },
              { id: "b", text: "7" },
              { id: "c", text: "8" },
              { id: "d", text: "64" },
            ],
            answerId: "c",
            hints: [
              "Counting starts at 0, not at 1.",
              "List them: 0, 1, 2, 3, 4, 5, 6, 7 — how many numbers is that?",
            ],
            explanation:
              "The numbers run 0 → 7, which is **8** dots in a row (and 8 in a column too). Computers almost always start counting at 0 — get used to it now, it never stops.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Every LED Has an Address",
      blocks: [
        { id: "mb06-l1", type: "heading", text: "Defining a matrix" },
        {
          id: "mb06-l2",
          type: "definition",
          term: "Matrix",
          definition:
            "A series of dots arranged in rows and columns.",
          example:
            "A chessboard, a calendar, and the micro:bit screen are all matrices.",
        },
        {
          id: "mb06-l3",
          type: "text",
          md: "A **row** runs across, left to right. A **column** runs down, top to bottom. In the book's grid there are 8 dots in every row and 8 dots in every column.",
        },
        { id: "mb06-l4", type: "heading", text: "The address of a dot" },
        {
          id: "mb06-l5",
          type: "definition",
          term: "Address (x, y)",
          definition:
            "Each dot in a matrix is defined by an address (x, y). The x determines the number of the column and the y determines the number of the row.",
          example: "(6,2) = column 6, row 2.",
        },
        {
          id: "mb06-l6",
          type: "callout",
          variant: "tip",
          title: "Never mix them up",
          md: "**x** is a**cross**. **y** goes down.\n\nAlways write and say the address in that order: `(x, y)` — column first, row second. Half of all LED bugs in this chapter are an x and a y swapped by accident.",
        },
        {
          id: "mb06-l7",
          type: "heading",
          text: "A screen with a matrix of 25 LEDs",
        },
        {
          id: "mb06-l8",
          type: "text",
          md: "The micro:bit screen is formed of a **matrix of 25 LEDs** — 5 rows and 5 columns. **Each LED has a unique address.** The columns are numbered 0 to 4 from left to right, and the rows 0 to 4 from top to bottom.",
        },
        {
          id: "mb06-l9",
          type: "code",
          language: "text",
          caption:
            "The 25 LEDs of the micro:bit screen. (0,0) is the top-left corner. (3,4) is the 4th column of the bottom row.",
          code: `           x=0     x=1     x=2     x=3     x=4
        +-------+-------+-------+-------+-------+
 y=0    | (0,0) | (1,0) | (2,0) | (3,0) | (4,0) |
        +-------+-------+-------+-------+-------+
 y=1    | (0,1) | (1,1) | (2,1) | (3,1) | (4,1) |
        +-------+-------+-------+-------+-------+
 y=2    | (0,2) | (1,2) | (2,2) | (3,2) | (4,2) |
        +-------+-------+-------+-------+-------+
 y=3    | (0,3) | (1,3) | (2,3) | (3,3) | (4,3) |
        +-------+-------+-------+-------+-------+
 y=4    | (0,4) | (1,4) | (2,4) | (3,4) | (4,4) |
        +-------+-------+-------+-------+-------+`,
        },
        {
          id: "mb06-l10",
          type: "heading",
          text: "The blocks to control a micro:bit LED",
        },
        {
          id: "mb06-l11",
          type: "flow",
          steps: [
            {
              id: "mb06-f1",
              label: "Open MakeCode",
              detail: "Start a new project for your micro:bit.",
            },
            {
              id: "mb06-f2",
              label: 'Click on the category "Led"',
              detail: "It sits in the block list with the other categories.",
            },
            {
              id: "mb06-f3",
              label: "Discover the blocks",
              detail:
                "Read what each one offers before dragging anything out.",
            },
            {
              id: "mb06-f4",
              label: "plot  x  y",
              detail: "Switches the LED at that address ON.",
            },
            {
              id: "mb06-f5",
              label: "unplot  x  y",
              detail: "Switches the LED at that address OFF.",
            },
          ],
        },
        {
          id: "mb06-l12",
          type: "callout",
          variant: "info",
          title: "Two blocks, one screen",
          md: "`plot x y` turns a single LED **on**.\n`unplot x y` turns that same LED **off**.\n\nBoth blocks ask you for the two numbers you have just learned: the column, then the row. Explore the other blocks of the Led category too — you will meet them again later in the chapter.",
        },
        {
          id: "mb06-l13",
          type: "teacherNote",
          md: "Two predictable errors:\n\n1. **x/y swapped.** A student wants the bottom-left LED and writes `(4,0)` instead of `(0,4)`. Have them read the address out loud as \"column 4, row 0\" — the mistake becomes audible.\n2. **Counting from 1.** They look for column 5. There is no column 5; the last column is 4. Point back to the grid map above.\n\nDo the printed \"Locating the address of a led\" exercise on paper before opening MakeCode.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Read the Grid, Then Light It",
      blocks: [
        {
          id: "mb06-t0",
          type: "text",
          md: "Keep the grid map from the previous stage in your head. Column first, row second.",
        },
        {
          id: "mb06-t1",
          type: "activity",
          activity: {
            id: "mb06-try-fill",
            kind: "fillblank",
            prompt: "Give the address of these two LEDs.",
            template:
              "The LED in the **top-left corner** has the address ( [[x1]] , [[y1]] ). The LED right in the **middle** of the screen has the address ( [[x2]] , [[y2]] ).",
            blanks: {
              x1: ["0"],
              y1: ["0"],
              x2: ["2"],
              y2: ["2"],
            },
            skillIds: ["pc-microbit", "ct-abstraction"],
            hints: [
              "The very first column is column 0 and the very first row is row 0.",
              "The middle of a 5 × 5 grid: two columns to its left, two to its right.",
            ],
            explanation:
              "Top-left is **(0,0)** — the origin of the screen. The centre LED sits in column 2 and row 2, so **(2,2)**.",
          },
        },
        {
          id: "mb06-t2",
          type: "activity",
          activity: {
            id: "mb06-try-classify",
            kind: "classify",
            prompt:
              "Sort each address: is that LED in the **first column**, in the **first row**, or somewhere else?",
            categories: [
              { id: "col0", label: "First column (x = 0)" },
              { id: "row0", label: "First row (y = 0)" },
              { id: "other", label: "Somewhere else" },
            ],
            items: [
              { id: "i1", text: "(0,1)", categoryId: "col0" },
              { id: "i2", text: "(0,3)", categoryId: "col0" },
              { id: "i3", text: "(2,0)", categoryId: "row0" },
              { id: "i4", text: "(4,0)", categoryId: "row0" },
              { id: "i5", text: "(3,2)", categoryId: "other" },
              { id: "i6", text: "(1,4)", categoryId: "other" },
            ],
            skillIds: ["pc-microbit", "ct-patterns"],
            hints: [
              "The first number is x — the column. If x is 0 the LED is in the first column.",
              "The second number is y — the row. If y is 0 the LED is in the first row.",
            ],
            explanation:
              "In the first column the **x never changes** (it stays 0) while y walks down. In the first row the **y never changes** (it stays 0) while x walks across. Spotting which number is frozen is the key to the whole project.",
          },
        },
        {
          id: "mb06-t3",
          type: "activity",
          activity: {
            id: "mb06-try-mcq",
            kind: "mcq",
            prompt:
              "Which of these addresses **does not exist** on the micro:bit screen?",
            options: [
              { id: "a", text: "(0,0)" },
              { id: "b", text: "(4,4)" },
              { id: "c", text: "(5,2)" },
              { id: "d", text: "(2,3)" },
            ],
            answerId: "c",
            skillIds: ["pc-microbit"],
            hints: [
              "How many columns are there, and what is the number of the last one?",
            ],
            explanation:
              "The columns and rows are numbered **0, 1, 2, 3, 4**. There is no column 5, so `(5,2)` is off the screen and nothing would light up.",
          },
        },
        { id: "mb06-t4", type: "heading", text: "It is time to try" },
        {
          id: "mb06-t5",
          type: "text",
          md: "Build this script in MakeCode and describe what happens once it is executed.",
        },
        {
          id: "mb06-t6",
          type: "code",
          language: "blocks",
          caption: "The book's script — five plot blocks, one address each.",
          code: `on start
    plot   x: 0   y: 0
    plot   x: 0   y: 1
    plot   x: 0   y: 2
    plot   x: 0   y: 3
    plot   x: 0   y: 4`,
        },
        {
          id: "mb06-t7",
          type: "activity",
          activity: {
            id: "mb06-try-script",
            kind: "mcq",
            prompt: "Describe the result once this script is executed.",
            options: [
              { id: "a", text: "The five LEDs of the first column light up." },
              { id: "b", text: "The five LEDs of the first row light up." },
              { id: "c", text: "One LED in the middle lights up." },
              { id: "d", text: "All 25 LEDs light up." },
            ],
            answerId: "a",
            skillIds: ["pc-microbit", "prog-blocks"],
            hints: [
              "Which number stays the same in all five blocks, and which one changes?",
              "x is frozen at 0. That fixes the column.",
            ],
            explanation:
              "Every block has **x = 0**, so all five LEDs are in the same column — the first one. The y walks 0 → 4, so the light fills that column from the top of the screen to the bottom.",
          },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Read the Shape",
      blocks: [
        {
          id: "mb06-c0",
          type: "text",
          md: "A classmate hands you a script with no comments. Can you see the picture *before* you flash it to the micro:bit?",
        },
        {
          id: "mb06-c1",
          type: "code",
          language: "blocks",
          caption: "What appears on the screen?",
          code: `on start
    plot   x: 0   y: 0
    plot   x: 4   y: 0
    plot   x: 2   y: 2
    plot   x: 0   y: 4
    plot   x: 4   y: 4`,
        },
        {
          id: "mb06-c2",
          type: "challenge",
          challenge: {
            id: "mb06-challenge",
            title: "Picture in Your Head",
            brief:
              "Five plot blocks, five addresses. Work out the shape on paper before you touch the hardware — a real programmer can read a script without running it.",
            activity: {
              id: "mb06-ch-1",
              kind: "mcq",
              prompt: "Which shape do these five LEDs make?",
              options: [
                { id: "a", text: "The four corners and the centre" },
                { id: "b", text: "The first and last columns" },
                { id: "c", text: "A cross through the middle" },
                { id: "d", text: "The top row only" },
              ],
              answerId: "a",
              skillIds: ["pc-microbit", "ct-abstraction"],
              hints: [
                "Mark each address on a 5 × 5 grid drawn in your copybook.",
                "(0,0) and (4,4) are opposite corners. What about (2,2)?",
              ],
              explanation:
                "(0,0), (4,0), (0,4) and (4,4) are the four **corners**, and (2,2) is the exact **centre**. Five lights, the shape of a dice-five.",
            },
            xp: 25,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "LED Matrix Checkpoint",
      blocks: [
        {
          id: "mb06-q0",
          type: "quiz",
          title: "Prove you can address any LED",
          passPct: 70,
          questions: [
            {
              id: "mb06-q1",
              kind: "mcq",
              prompt: "What is a **matrix**?",
              options: [
                { id: "a", text: "A series of dots arranged in rows and columns" },
                { id: "b", text: "A block from the Loops category" },
                { id: "c", text: "A place in memory that stores information" },
                { id: "d", text: "An electronic board that links inputs to outputs" },
              ],
              answerId: "a",
              skillIds: ["ct-abstraction"],
              explanation:
                "A matrix is a series of dots arranged in rows and columns — exactly what the micro:bit screen is.",
            },
            {
              id: "mb06-q2",
              kind: "mcq",
              prompt: "In the address `(x, y)`, what does **x** determine?",
              options: [
                { id: "a", text: "The number of the row" },
                { id: "b", text: "The number of the column" },
                { id: "c", text: "How bright the LED is" },
                { id: "d", text: "How long the LED stays on" },
              ],
              answerId: "b",
              skillIds: ["pc-microbit"],
              explanation:
                "x determines the number of the **column**; y determines the number of the row.",
            },
            {
              id: "mb06-q3",
              kind: "fillblank",
              prompt: "Complete the description of the screen.",
              template:
                "The micro:bit screen is a matrix of [[n]] LEDs, arranged in [[r]] rows and [[c]] columns.",
              blanks: {
                n: ["25", "twenty-five", "twenty five"],
                r: ["5", "five"],
                c: ["5", "five"],
              },
              skillIds: ["pc-microbit", "sys-hardware"],
              explanation: "5 rows × 5 columns = 25 LEDs.",
            },
            {
              id: "mb06-q4",
              kind: "truefalse",
              prompt:
                "Two different LEDs on the micro:bit screen can share the same address.",
              answer: false,
              skillIds: ["pc-microbit"],
              explanation:
                "Each LED has a **unique** address. That is exactly why we can command them one by one.",
            },
            {
              id: "mb06-q5",
              kind: "mcq",
              prompt: "Which block switches an LED **off**?",
              options: [
                { id: "a", text: "plot x y" },
                { id: "b", text: "unplot x y" },
                { id: "c", text: "show number" },
                { id: "d", text: "on start" },
              ],
              answerId: "b",
              skillIds: ["prog-blocks", "pc-microbit"],
              explanation:
                "`plot` switches an LED on, `unplot` switches it off. Both live in the **Led** category.",
            },
            {
              id: "mb06-q6",
              kind: "match",
              prompt: "Match each address to its place on the screen.",
              pairs: [
                { id: "m1", left: "(0,0)", right: "Top-left corner" },
                { id: "m2", left: "(4,0)", right: "Top-right corner" },
                { id: "m3", left: "(0,4)", right: "Bottom-left corner" },
                { id: "m4", left: "(4,4)", right: "Bottom-right corner" },
                { id: "m5", left: "(2,2)", right: "Centre of the screen" },
              ],
              skillIds: ["pc-microbit", "ct-abstraction"],
              explanation:
                "x across, y down. When x is 0 you are on the left edge; when y is 4 you are on the bottom edge.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Project — First and Last Rows",
      blocks: [
        {
          id: "mb06-p0",
          type: "text",
          md: "You have built the script that illuminates the **first column**. Now it is time for the book's project.",
        },
        {
          id: "mb06-p1",
          type: "project",
          project: {
            id: "mb06-project",
            title: "Illuminate the First and the Last Rows",
            brief:
              "Create the script that lights the first row and the last row of the micro:bit screen — ten LEDs in total. Work out the ten addresses on paper first, then build it in MakeCode and flash it to the board.",
            deliverables: [
              "Write the 10 addresses (x, y) in your copybook, first row then last row",
              "Build the script in MakeCode using plot blocks",
              "Flash it to the micro:bit and photograph the lit screen",
              "Explain in one sentence which number stays fixed in each row and which one changes",
            ],
            submitTypes: ["code", "image", "text"],
            rubric: [
              {
                criterion: "Correct addresses",
                description:
                  "All ten (x, y) pairs are right: y = 0 for the first row, y = 4 for the last.",
              },
              {
                criterion: "Working script",
                description:
                  "The script runs on the micro:bit and both rows light up.",
              },
              {
                criterion: "Explanation",
                description:
                  "The student can say which coordinate is frozen and which one walks.",
              },
            ],
            xp: 40,
          },
        },
        {
          id: "mb06-p2",
          type: "callout",
          variant: "tip",
          title: "Ten blocks feel like a lot?",
          md: "Good. Hold on to that feeling — in the next mission you will replace all ten of them with a **loop** and a variable.",
        },
        {
          id: "mb06-r1",
          type: "reflection",
          prompt:
            "Where else in real life do you see a matrix of lights or dots being addressed one by one?",
          placeholder: "A stadium scoreboard, because…",
        },
      ],
    },
  ],
};
