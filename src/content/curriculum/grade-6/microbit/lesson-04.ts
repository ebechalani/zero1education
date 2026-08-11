import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Chapter 1 "MakeCode for Micro:bit" · Lesson 4
 * Book objectives: 1- Creating a stopwatch using a variable · 2- Declaring and updating a variable
 * Source: G6_2023_ch1_microbit.pdf, pp. 10–11.
 */
export const lessonMb04: Lesson = {
  id: "g6-mb-04",
  slug: "creating-a-stopwatch-using-a-variable",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 4,
  title: "Creating a Stopwatch Using a Variable",
  tagline: "A box in the memory that never stops counting",
  description:
    "A stopwatch displays sequential numbers — so the script needs somewhere to keep the number it is showing. That place is called a variable, and you are about to declare, initialize and update your first one.",
  objectives: [
    "Define a variable as a location in the memory of the computer used to store information",
    "State the three concepts to remember: many variables per script, a fixed name, a content that can change",
    "Create a variable in MakeCode and recognise the three blocks it produces",
    "Use `set … to` to initialize a variable and `change … by` to update it",
    "Build a stopwatch script that displays sequential numbers on the Micro:bit screen",
  ],
  skillIds: ["pc-microbit", "prog-blocks", "ct-abstraction", "algo-sequence"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "Timer",
  status: "published",
  teacherGuide: {
    overview:
      "The variable is the single most important idea of the chapter, and the book teaches it with one image: a box with a name written on it and something inside. Protect that image. Everything after — the two-player game, the LED loops, the sensor counters — is the same box reused.",
    tips: [
      "Bring two real boxes labelled x and y with cards showing 9 and 17 inside. Swap the cards to show the content changing while the label stays.",
      "Insist on the difference between `set … to` (write a value in, erasing what was there) and `change … by` (add to what is already there).",
      "Watch for students who create the variable but forget to initialize it in `on start`.",
      "The stopwatch never stops at 10 — nothing in the script tells it to. Let students feel that gap; Lesson 5 fills it with the `if` block.",
      "A tutorial for this lesson is on the ZERO1 platform: Digital Resources tab.",
    ],
    answersNote:
      "Script questions — variable name: x · initialized to 0 · the screen displays 0, 1, 2, 3, 4… one number at a time · at 10 the counting simply continues (11, 12, 13…) because no block stops it.",
  },
  stages: [
    {
      id: "g6-mb-04-discover",
      kind: "discover",
      title: "The Race Needs a Timer",
      blocks: [
        {
          id: "mb4-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Sports day. Two classes, one 60-metre track, and the only stopwatch in the school has just broken.\n\nYou look down at the Micro:bit in your hand. It has a screen with 25 LEDs. It can count. The only question is: **where does it keep the number** while it counts?",
        },
        {
          id: "mb4-d2",
          type: "activity",
          activity: {
            id: "mb4-d-poll",
            kind: "mcq",
            prompt:
              "A stopwatch consists of displaying sequential numbers: 0, 1, 2, 3… What does the script need in order to do that?",
            options: [
              { id: "a", text: "25 separate blocks, one per number" },
              { id: "b", text: "A place in the memory to store the number to be displayed" },
              { id: "c", text: "A second Micro:bit" },
              { id: "d", text: "A push button for each digit" },
            ],
            answerId: "b",
            hints: [
              "The number changes every second. Something has to hold the current one.",
            ],
            explanation:
              "To create a stopwatch we write a script containing a **variable** to hold the number to be displayed. One box, reused every second.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "g6-mb-04-learn",
      kind: "learn",
      title: "Declaring, Initializing and Updating a Variable",
      blocks: [
        { id: "mb4-l1", type: "heading", text: "Creating a stopwatch" },
        {
          id: "mb4-l2",
          type: "text",
          md: "The stopwatch consists of **displaying sequential numbers**. In order to achieve this project, we should create a script containing a **variable** to hold the number to be displayed.",
        },
        { id: "mb4-l3", type: "heading", text: "Creating a variable" },
        {
          id: "mb4-l4",
          type: "definition",
          term: "Variable",
          definition:
            "A location in the memory of the computer used to store information. The variable is compared to a box: it is defined by a name, and it contains information.",
          example: "A variable named x containing the value 9.",
        },
        {
          id: "mb4-l5",
          type: "code",
          language: "text",
          code: `   ┌───────┐        ┌───────┐
   │   9   │        │  17   │
   └───────┘        └───────┘
       x                y`,
          caption:
            "Two variables, x and y, containing the values 9 and 17. The name is written on the box; the value sits inside it.",
        },
        {
          id: "mb4-l6",
          type: "callout",
          variant: "fact",
          title: "Concepts to remember!",
          md: "1. In a script, **many variables** can be used.\n2. The **name** of the variable **can't be changed**.\n3. The **content** of a variable **can change at any time** in the script.",
        },
        {
          id: "mb4-l7",
          type: "heading",
          text: "Creating a variable in MakeCode",
        },
        {
          id: "mb4-l8",
          type: "flow",
          steps: [
            {
              id: "mb4-f1",
              label: "Open the Variables category",
              detail: "In the block menu on the left of the MakeCode workspace",
            },
            {
              id: "mb4-f2",
              label: "Click \"Make a Variable\"",
              detail: "The button at the top of the category",
            },
            {
              id: "mb4-f3",
              label: "Name the variable, then click OK",
              detail: "Choose a short, clear name — the name cannot be changed afterwards",
            },
            {
              id: "mb4-f4",
              label: "3 new blocks are created",
              detail: "The variable name · the `set … to` block · the `change … by` block",
            },
          ],
        },
        {
          id: "mb4-l9",
          type: "accordion",
          items: [
            {
              id: "mb4-acc1",
              title: "The variable name block",
              blocks: [
                {
                  id: "mb4-acc1b",
                  type: "text",
                  md: "The rounded block carrying the name. Drop it wherever you need the **value currently inside** the box — for example inside `show number`.",
                },
              ],
            },
            {
              id: "mb4-acc2",
              title: "`set … to` — the initialize block",
              blocks: [
                {
                  id: "mb4-acc2b",
                  type: "text",
                  md: "Used to **initialize** the value of a variable. It writes a value into the box, erasing whatever was there before. This normally goes inside `on start`.",
                },
              ],
            },
            {
              id: "mb4-acc3",
              title: "`change … by` — the update block",
              blocks: [
                {
                  id: "mb4-acc3b",
                  type: "text",
                  md: "Used to **change** the value of the variable. It adds to what is already inside the box: `change x by 1` turns a 4 into a 5.",
                },
              ],
            },
          ],
        },
        {
          id: "mb4-l10",
          type: "teacherNote",
          md: "The single most common confusion: `set x to 1` inside a loop instead of `change x by 1`. The stopwatch then displays 1, 1, 1, 1 forever. It is a wonderful bug — let it happen, then ask the class to explain it using the box image.",
        },
        {
          id: "mb4-l11",
          type: "heading",
          text: "A project to understand more",
        },
        {
          id: "mb4-l12",
          type: "text",
          md: "Read the stopwatch script below carefully, then answer the questions in the next stage.",
        },
        {
          id: "mb4-l13",
          type: "code",
          language: "makecode",
          code: `on start
    set x to 0

forever
    show number (x)
    pause (1000)
    change x by 1`,
          caption: "The stopwatch script — one variable, three blocks in the loop.",
        },
        {
          id: "mb4-l14",
          type: "flow",
          steps: [
            {
              id: "mb4-g1",
              label: "on start",
              detail: "set x to 0 — the box is created and initialized",
            },
            {
              id: "mb4-g2",
              label: "show number (x)",
              detail: "The value currently in the box appears on the 25 LEDs",
            },
            {
              id: "mb4-g3",
              label: "pause (1000)",
              detail: "Wait 1000 milliseconds = 1 second",
            },
            {
              id: "mb4-g4",
              label: "change x by 1",
              detail: "Add 1 to the box, then the forever loop starts again",
            },
          ],
        },
        {
          id: "mb4-l15",
          type: "callout",
          variant: "info",
          title: "Watch the tutorial",
          md: "A video walkthrough of this script is waiting for you on the ZERO1 platform:\n\n1. Access your account on **www.zero1.education**\n2. Open the **Digital Resources** tab to watch the tutorial.",
        },
      ],
    },
    {
      id: "g6-mb-04-tryit",
      kind: "tryit",
      title: "Read the Stopwatch",
      blocks: [
        {
          id: "mb4-t0",
          type: "text",
          md: "The four questions from your book, about the script above.",
        },
        {
          id: "mb4-t1",
          type: "activity",
          activity: {
            id: "mb4-try-fill",
            kind: "fillblank",
            prompt: "Questions 1 and 2 — look at the `on start` block.",
            template:
              "The name of the variable used in the script is [[b1]].\nOnce the script is launched, the variable is initialized to the value [[b2]].",
            blanks: { b1: ["x"], b2: ["0", "zero"] },
            skillIds: ["pc-microbit", "prog-blocks"],
            hints: [
              "The name is written on the box — read the `set … to` block.",
              "\"Initialize\" means the first value written into the variable.",
            ],
            explanation:
              "`set x to 0` does two jobs at once: it names the box we are using (**x**) and it writes the starting value (**0**) inside it.",
          },
        },
        {
          id: "mb4-t2",
          type: "activity",
          activity: {
            id: "mb4-try-mcq",
            kind: "mcq",
            prompt:
              "Question 3 — what are the numbers displayed on the Micro:bit's screen?",
            options: [
              { id: "a", text: "0 only, over and over again" },
              { id: "b", text: "1, 2, 3, 4… starting from 1" },
              { id: "c", text: "0, 1, 2, 3, 4… one number every second" },
              { id: "d", text: "0 and then nothing" },
            ],
            answerId: "c",
            skillIds: ["pc-microbit", "algo-sequence"],
            hints: [
              "Follow the loop once: show, pause, change. Which value is shown on the very first turn?",
              "`pause (1000)` waits one second between two numbers.",
            ],
            explanation:
              "The loop shows **x first** and changes it afterwards, so the display starts at 0 and climbs one number per second: 0, 1, 2, 3, 4…",
          },
        },
        {
          id: "mb4-t3",
          type: "activity",
          activity: {
            id: "mb4-try-mcq2",
            kind: "mcq",
            prompt:
              "Question 4 — what happens when the variable reaches the value 10?",
            options: [
              { id: "a", text: "The script stops automatically" },
              { id: "b", text: "The variable goes back to 0" },
              { id: "c", text: "Nothing special — it keeps counting 11, 12, 13…" },
              { id: "d", text: "The Micro:bit shows an error" },
            ],
            answerId: "c",
            skillIds: ["prog-blocks", "algo-sequence"],
            hints: [
              "Search the script for any block that mentions the number 10.",
              "A `forever` loop repeats until the board is switched off.",
            ],
            explanation:
              "There is **no block that tests the value**, so nothing stops at 10 — the counting simply continues. To make something happen at 10, the script needs a decision block. That is exactly what you add in the next lesson.",
          },
        },
        {
          id: "mb4-t4",
          type: "activity",
          activity: {
            id: "mb4-try-match",
            kind: "match",
            prompt: "Match each MakeCode block to what it does to the box.",
            pairs: [
              {
                id: "mb4-mp1",
                left: "set x to 0",
                right: "Writes a value in, erasing what was there — initializes",
              },
              {
                id: "mb4-mp2",
                left: "change x by 1",
                right: "Adds to the value already inside — updates",
              },
              {
                id: "mb4-mp3",
                left: "show number (x)",
                right: "Reads the value inside and displays it on the LEDs",
              },
            ],
            skillIds: ["prog-blocks", "ct-abstraction"],
            hints: [
              "Two blocks write into the box, one only reads from it.",
              "Only one of the two writing blocks cares about what was already inside.",
            ],
            explanation:
              "`set` overwrites, `change` adds, and using the variable name simply reads. Confusing `set` with `change` is the classic stopwatch bug.",
          },
        },
      ],
    },
    {
      id: "g6-mb-04-challenge",
      kind: "challenge",
      title: "Counting Backwards",
      blocks: [
        {
          id: "mb4-c0",
          type: "text",
          md: "Your book's project asks for two variables: **a** must display the values from 3 to 6, and **b** must display the values from 7 down to 2. Going up you already know. Going **down** needs one small idea.",
        },
        {
          id: "mb4-c1",
          type: "challenge",
          challenge: {
            id: "mb4-challenge",
            title: "From 7 Down to 2",
            brief:
              "You have `set … to` and `change … by`, and nothing else. Work out how to make the variable b go 7, 6, 5, 4, 3, 2.",
            activity: {
              id: "mb4-ch-mcq",
              kind: "mcq",
              prompt:
                "Which pair of blocks displays the values of the variable **b** from 7 to 2?",
              options: [
                { id: "a", text: "`set b to 7` … then `change b by 1`" },
                { id: "b", text: "`set b to 7` … then `change b by -1`" },
                { id: "c", text: "`set b to 2` … then `change b by -1`" },
                { id: "d", text: "`set b to 0` … then `change b by 7`" },
              ],
              answerId: "b",
              skillIds: ["prog-blocks", "ps-strategy", "ct-abstraction"],
              hints: [
                "Which value must be shown first? That is what you initialize b to.",
                "`change b by 1` adds 1. What would you type instead to take 1 away each turn?",
              ],
              explanation:
                "Start the box at **7**, then take one away every turn with **`change b by -1`**: 7, 6, 5, 4, 3, 2. The `change … by` block accepts a negative value, which is how a variable counts down.",
            },
            xp: 30,
          },
        },
        {
          id: "mb4-c2",
          type: "teacherNote",
          md: "Some students will try to solve \"7 down to 2\" with six separate `show number` blocks and no variable at all. It works — and it is the perfect opening for the real question: *\"and if I asked for 7 down to 200?\"* The variable is what makes the script survive a change of numbers.",
        },
      ],
    },
    {
      id: "g6-mb-04-checkpoint",
      kind: "checkpoint",
      title: "Variables Checkpoint",
      blocks: [
        {
          id: "mb4-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "mb4-q1",
              kind: "fillblank",
              prompt: "Complete the definition of a variable.",
              template:
                "A variable is a location in the [[b1]] of the computer used to store [[b2]].",
              blanks: {
                b1: ["memory"],
                b2: ["information", "data"],
              },
              bank: ["memory", "information", "screen", "sensor"],
              skillIds: ["ct-abstraction"],
              explanation:
                "A location in the **memory**, used to store **information** — the box with a name on it.",
            },
            {
              id: "mb4-q2",
              kind: "truefalse",
              prompt: "The name of a variable can be changed at any time.",
              answer: false,
              skillIds: ["prog-blocks"],
              explanation:
                "The name of the variable **can't be changed**. It is the **content** that can change at any time in the script.",
            },
            {
              id: "mb4-q3",
              kind: "truefalse",
              prompt: "In a script, many variables can be used.",
              answer: true,
              skillIds: ["prog-blocks"],
              explanation:
                "Many variables can live in the same script — in the next lesson you will need two of them at once.",
            },
            {
              id: "mb4-q4",
              kind: "mcq",
              prompt:
                "Which block is used to **initialize** the value of a variable?",
              options: [
                { id: "a", text: "`change … by`" },
                { id: "b", text: "`set … to`" },
                { id: "c", text: "`show number`" },
                { id: "d", text: "`pause`" },
              ],
              answerId: "b",
              skillIds: ["prog-blocks"],
              explanation:
                "`set … to` initializes. `change … by` updates a value that already exists.",
            },
            {
              id: "mb4-q5",
              kind: "sort",
              prompt:
                "Put the steps of creating a variable in MakeCode in the correct order.",
              items: [
                { id: "mb4-s1", text: "Click on the button \"Make a Variable\"" },
                { id: "mb4-s2", text: "Open the category Variables" },
                { id: "mb4-s3", text: "Use the 3 new blocks in your script" },
                { id: "mb4-s4", text: "Name the variable, then click OK" },
              ],
              correctOrder: ["mb4-s2", "mb4-s1", "mb4-s4", "mb4-s3"],
              endLabels: ["First", "Last"],
              skillIds: ["prog-blocks"],
              explanation:
                "Variables category → Make a Variable → name it and confirm → the three blocks appear, ready to use.",
            },
            {
              id: "mb4-q6",
              kind: "mcq",
              prompt:
                "The variable **n** contains 4. After `change n by 3`, what is inside n?",
              options: [
                { id: "a", text: "3" },
                { id: "b", text: "4" },
                { id: "c", text: "7" },
                { id: "d", text: "43" },
              ],
              answerId: "c",
              skillIds: ["prog-blocks", "ct-abstraction"],
              explanation:
                "`change` **adds** to what is already in the box: 4 + 3 = **7**. (`set n to 3` would have given 3 instead.)",
            },
          ],
        },
      ],
    },
    {
      id: "g6-mb-04-create",
      kind: "create",
      title: "Build It in MakeCode",
      blocks: [
        {
          id: "mb4-proj",
          type: "project",
          project: {
            id: "mb4-project",
            title: "Two Variables, Two Directions",
            brief:
              "Launch the software MakeCode and build the script your book asks for. One variable climbs, one variable falls.",
            deliverables: [
              "Create two variables named a and b",
              "Display the values of the variable a from 3 to 6",
              "Display the values of the variable b from 7 to 2",
              "Take a screenshot of your blocks, or share the MakeCode link",
            ],
            submitTypes: ["image", "link", "text"],
            rubric: [
              {
                criterion: "Correct initialization",
                description:
                  "Each variable is set to its correct starting value before anything is displayed",
              },
              {
                criterion: "Correct update",
                description:
                  "`change … by` is used with the right value, positive for a and negative for b",
              },
              {
                criterion: "Exact range",
                description:
                  "a shows 3, 4, 5, 6 and b shows 7, 6, 5, 4, 3, 2 — no extra numbers",
              },
            ],
            xp: 45,
          },
        },
        {
          id: "mb4-r1",
          type: "reflection",
          prompt:
            "Your stopwatch counts past 10 and never stops. What block would you invent to fix that — and what exactly should it check?",
          placeholder: "I would add a block that checks whether…",
        },
      ],
    },
  ],
};
