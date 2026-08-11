import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Unit "MakeCode for micro:bit" · Lesson 7 of the printed 2023 chapter.
 * Book: "Integrating a variable to control the Micro:bit's leds" — the for loop,
 * the flashing-leds project, and the embedded loop that lights all 25 LEDs.
 */
export const lessonMb07: Lesson = {
  id: "g6-mb-07",
  slug: "loops-leds",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 7,
  title: "Integrating a Variable to Control the LEDs",
  tagline: "One loop instead of twenty-five blocks",
  description:
    "Dragging one plot block per LED works — until you want all 25. In this mission a variable and the loop block do the walking for you, and an embedded loop fills the whole screen.",
  objectives: [
    "Recall that each LED of the micro:bit screen has a unique address",
    "Control the LEDs with a variable instead of writing every address by hand",
    'Use the "for index from 0 to 4" block from the Loops category',
    "Build the flashing-LEDs project: one loop to switch the LEDs on, a second loop to switch them off in the same order",
    "Use an embedded loop with the variables ledx and ledy to illuminate the 25 LEDs",
  ],
  skillIds: ["algo-iteration", "pc-microbit", "prog-blocks", "ct-abstraction"],
  estimatedMinutes: 50,
  difficulty: "core",
  icon: "Repeat",
  labId: "algorithm",
  status: "published",
  teacherGuide: {
    overview:
      "Iteration is the big idea of this chapter, and the LED matrix is a perfect place to feel it: 25 blocks collapse into 4. Use the ZERO1 Algorithm Lab first so students meet a loop on the rover, where every repetition is visible, before they meet it on the hardware.",
    tips: [
      "Start by asking the class to count how many plot blocks the whole screen would need. Let 25 land before you offer the loop.",
      '"from 0 to 4" runs FIVE times, not four. Count the turns out loud together: 0, 1, 2, 3, 4.',
      "Before running the embedded loop, ask: how many times does the inner loop finish? (Five — once per turn of the outer loop.) 5 × 5 = 25.",
      "The pause block is not decoration: without it the eye cannot see the sweep. Let a group try it with no pause and discover that for themselves.",
    ],
    answersNote:
      'Conclusion blanks: "The for loop repeats the instructions 5 times. Each turn of the loop, a led will illuminate." The two set blocks in on start are there to initialize ledx and ledy before the loops run.',
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "Twenty-Five Blocks Is Too Many",
      blocks: [
        {
          id: "mb07-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Last mission you lit one column: five `plot` blocks, five addresses, typed by hand.\n\nThen your teacher says: *\"Now light the whole screen.\"*\n\nYou reach for the mouse… and stop. There has to be a better way. There is, and every programmer in the world uses it.",
        },
        {
          id: "mb07-d2",
          type: "activity",
          activity: {
            id: "mb07-d-poll",
            kind: "mcq",
            prompt:
              "Using the manual method of Lesson 6 — one `plot` block per LED — how many blocks would you have to drag to light the **whole** micro:bit screen?",
            options: [
              { id: "a", text: "5" },
              { id: "b", text: "10" },
              { id: "c", text: "25" },
              { id: "d", text: "50" },
            ],
            answerId: "c",
            hints: ["The screen is a matrix of how many LEDs?"],
            explanation:
              "**25** — one block per LED. Nobody wants to drag 25 blocks and type 50 numbers. A loop will do it with four.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "The Loop Does the Walking",
      blocks: [
        { id: "mb07-l1", type: "heading", text: "Quick review" },
        {
          id: "mb07-l2",
          type: "text",
          md: "From the previous lesson you know that **each LED of the micro:bit screen has a unique address** `(x, y)`.\n\nIn this lesson you will control the LEDs using a **variable** and the **loop** block. To make the LEDs turn on and off without the manual method, a variable is declared and then increased or decreased by the loop block.",
        },
        {
          id: "mb07-l3",
          type: "definition",
          term: "Variable",
          definition:
            "A location in the memory of the computer used to store information. A variable is defined by a name, and it contains information.",
          example:
            'A variable named "led" holding the value 3 — the loop will change that 3 for you.',
        },
        {
          id: "mb07-l4",
          type: "definition",
          term: "Loop (for)",
          definition:
            "A block from the Loops category that repeats the instructions placed inside it a fixed number of times, counting with a variable.",
          example:
            '"for index from 0 to 4" repeats its instructions 5 times, with index taking the values 0, 1, 2, 3, 4.',
        },
        {
          id: "mb07-l5",
          type: "callout",
          variant: "warning",
          title: "0 to 4 means FIVE turns",
          md: "Count them: **0, 1, 2, 3, 4**. That is five values, so five turns of the loop — not four. This one off-by-one is the most common bug in the whole chapter.",
        },
        { id: "mb07-l6", type: "heading", text: "Flashing LEDs — the project" },
        {
          id: "mb07-l7",
          type: "flow",
          steps: [
            {
              id: "mb07-f1",
              label: 'Create a variable named "led"',
              detail: "Variables ▸ Make a Variable.",
            },
            {
              id: "mb07-f2",
              label: 'Insert "for index from 0 to 4"',
              detail: "From the category Loops.",
            },
            {
              id: "mb07-f3",
              label: 'Insert "plot x - y"',
              detail: "From the category Led, inside the loop.",
            },
            {
              id: "mb07-f4",
              label: "Replace index with led",
              detail: "The loop now counts with your own variable.",
            },
            {
              id: "mb07-f5",
              label: 'Insert led in the "x" field',
              detail: "The address now changes by itself every turn.",
            },
            {
              id: "mb07-f6",
              label: 'Insert the block "pause"',
              detail: "To slow down the blinking effect so the eye can see it.",
            },
          ],
        },
        {
          id: "mb07-l8",
          type: "code",
          language: "blocks",
          caption:
            "The flashing-LEDs script. The variable led feeds straight into the x field.",
          code: `forever
    for led from 0 to 4
        plot    x: led   y: 0
        pause   200 (ms)`,
        },
        {
          id: "mb07-l9",
          type: "callout",
          variant: "fact",
          title: "As a conclusion!",
          md: "When the script runs:\n\n- The `for` loop repeats the instructions **5** times.\n- Each turn of the loop, **a LED** will illuminate.\n\nThe variable `led` takes the value 0, then 1, then 2, then 3, then 4 — and the `plot` block uses it as the address. One block, five LEDs.",
        },
        {
          id: "mb07-l10",
          type: "teacherNote",
          md: "Two things worth naming out loud:\n\n1. **Which line lights up.** In the build steps the variable goes into the **x** field, so x changes each turn while y stays at 0 — the light sweeps along the line at address 0. The book calls this line \"column 0\" on one page and \"the first row\" on the next. Settle it on the hardware: run it, look at the board, then swap the variable into the **y** field and run it again. Students will never confuse x and y after that.\n2. **Why pause matters.** Without it the sweep is faster than the eye; students will swear nothing happened.",
        },
        { id: "mb07-l11", type: "heading", text: "Completing the project" },
        {
          id: "mb07-l12",
          type: "text",
          md: "Add another loop in order to **turn off** the LEDs in the same order they were turned on. The second loop contains the blocks that switch the LEDs off — same addresses, `unplot` instead of `plot`.",
        },
        {
          id: "mb07-l13",
          type: "code",
          language: "blocks",
          caption:
            "On, then off, then round again — the flashing effect the book is after.",
          code: `forever
    for led from 0 to 4
        plot     x: led   y: 0
        pause    200 (ms)

    for led from 0 to 4
        unplot   x: led   y: 0
        pause    200 (ms)`,
        },
        { id: "mb07-l14", type: "heading", text: "Illuminating 25 LEDs" },
        {
          id: "mb07-l15",
          type: "text",
          md: "The script above lights one line of LEDs. To reach the **whole screen** you need an **embedded loop** — a loop placed inside another loop.\n\nCreate two variables, `ledx` and `ledy`, and insert into the `on start` block the two blocks `set ledx to 0` and `set ledy to 0`. Those two blocks **initialize** the variables before the loops begin.",
        },
        {
          id: "mb07-l16",
          type: "code",
          language: "blocks",
          caption:
            "Two loops, two variables, 25 LEDs. The inner loop finishes completely for every single turn of the outer loop.",
          code: `on start
    set ledx to 0
    set ledy to 0

forever
    for ledy from 0 to 4
        for ledx from 0 to 4
            plot    x: ledx   y: ledy
            pause   100 (ms)`,
        },
        {
          id: "mb07-l17",
          type: "callout",
          variant: "tip",
          title: "How the two loops share the work",
          md: "The **outer** loop holds a line still (`ledy`). The **inner** loop sweeps across it (`ledx`). When the inner loop finishes, the outer loop moves on to the next line and the sweep starts again.\n\n5 lines × 5 LEDs = **25**. Swap which loop is on the outside and the LEDs still all light up — only the order changes.",
        },
        {
          id: "mb07-l18",
          type: "teacherNote",
          md: "Ask students to trace the first four turns in a table (ledy, ledx, address) before running it. Nested loops are abstract until you write the pairs down: (0,0) (1,0) (2,0)… Students who can fill that table can debug their own script.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Loop Practice",
      blocks: [
        {
          id: "mb07-t1",
          type: "activity",
          activity: {
            id: "mb07-try-fill",
            kind: "fillblank",
            prompt: "Complete the conclusion from the book.",
            template:
              "The for loop repeats the instructions [[n]] times. Each turn of the loop, a [[w]] will illuminate.",
            blanks: {
              n: ["5", "five"],
              w: ["led", "LED", "light"],
            },
            skillIds: ["algo-iteration"],
            hints: ["List the values the variable takes: 0, 1, 2, 3, 4."],
            explanation:
              '"from 0 to 4" gives five values, so **5** turns — and each turn plots one more **led**.',
          },
        },
        {
          id: "mb07-t2",
          type: "activity",
          activity: {
            id: "mb07-try-sort",
            kind: "sort",
            prompt:
              "Put the build steps of the flashing-LEDs project back in the book's order.",
            items: [
              { id: "s1", text: 'Insert the block "plot x - y" from the Led category' },
              { id: "s2", text: 'Create a variable named "led"' },
              { id: "s3", text: 'Insert the block "pause" to slow the blinking' },
              { id: "s4", text: 'Insert "for index from 0 to 4" from the Loops category' },
              { id: "s5", text: "Replace index with the variable led" },
              { id: "s6", text: 'Insert the variable led in the "x" field' },
            ],
            correctOrder: ["s2", "s4", "s1", "s5", "s6", "s3"],
            endLabels: ["First", "Last"],
            skillIds: ["prog-blocks", "algo-iteration"],
            hints: [
              "Nothing can use a variable before the variable exists.",
              "The pause is added last — it only changes the speed, not the logic.",
            ],
            explanation:
              "Create the variable → add the loop → put plot inside it → make the loop count with led → feed led into x → slow it down with pause.",
          },
        },
        {
          id: "mb07-t3",
          type: "activity",
          activity: {
            id: "mb07-try-match",
            kind: "match",
            prompt: "Match each block to the job it does in the script.",
            pairs: [
              { id: "m1", left: "plot x y", right: "Switches one LED ON" },
              { id: "m2", left: "unplot x y", right: "Switches one LED OFF" },
              { id: "m3", left: "for … from 0 to 4", right: "Repeats the instructions 5 times" },
              { id: "m4", left: "pause", right: "Slows down the blinking effect" },
              { id: "m5", left: "set ledx to 0", right: "Gives the variable its starting value" },
            ],
            skillIds: ["prog-blocks", "algo-iteration"],
            explanation:
              "Every block in this project has exactly one job. Read a script by naming the job of each block in turn.",
          },
        },
        {
          id: "mb07-t4",
          type: "activity",
          activity: {
            id: "mb07-try-mcq",
            kind: "mcq",
            prompt:
              "In the flashing-LEDs script the variable `led` is dropped into the **x** field of the plot block. What does that make happen?",
            options: [
              { id: "a", text: "The LED gets brighter each turn" },
              {
                id: "b",
                text: "The column of the lit LED changes every turn while the row stays the same",
              },
              { id: "c", text: "The whole screen lights at once" },
              { id: "d", text: "The loop stops after the first turn" },
            ],
            answerId: "b",
            skillIds: ["algo-iteration", "pc-microbit"],
            hints: [
              "x is the column. The y field still holds a fixed number.",
            ],
            explanation:
              "The loop feeds 0, 1, 2, 3, 4 into **x**, so the column moves along while **y** stays frozen — the light sweeps along one line of the screen.",
          },
        },
      ],
    },
    {
      id: "lab",
      kind: "lab",
      title: "ZERO1 Algorithm Lab",
      blocks: [
        {
          id: "mb07-lab0",
          type: "text",
          md: "Before you loop over LEDs, loop over something you can watch step by step. Program the rover to the charging station — then look for the repeated block and replace it with a loop.",
        },
        {
          id: "mb07-lab1",
          type: "lab",
          labId: "algorithm",
          title: "Loop the Rover",
          brief:
            "Reach the charging station using as few blocks as you can. Solving it is easy; solving it with a loop is the lesson. Find the instruction you keep repeating and wrap it up.",
          config: {
            size: 5,
            start: { x: 0, y: 4, dir: "up" },
            goal: { x: 4, y: 0 },
            obstacles: [
              { x: 1, y: 3 },
              { x: 2, y: 2 },
              { x: 3, y: 1 },
            ],
            par: 6,
          },
        },
        {
          id: "mb07-lab2",
          type: "callout",
          variant: "tip",
          title: "Same idea, different machine",
          md: "`repeat 4 [ move forward ]` on the rover and `for led from 0 to 4 [ plot ]` on the micro:bit are the same thought: **say it once, run it many times.**",
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Count the Turns",
      blocks: [
        {
          id: "mb07-c0",
          type: "text",
          md: "Nested loops are where good programmers separate themselves. Trace this one in your head.",
        },
        {
          id: "mb07-c1",
          type: "challenge",
          challenge: {
            id: "mb07-challenge",
            title: "How Many Times?",
            brief:
              "The embedded loop from this lesson runs the plot block again and again. Work out exactly how many times before you run it.",
            activity: {
              id: "mb07-ch-1",
              kind: "mcq",
              prompt:
                "In the embedded loop (`for ledy from 0 to 4` containing `for ledx from 0 to 4` containing `plot`), how many times does the **plot** block run in one complete pass?",
              options: [
                { id: "a", text: "5" },
                { id: "b", text: "10" },
                { id: "c", text: "20" },
                { id: "d", text: "25" },
              ],
              answerId: "d",
              skillIds: ["algo-iteration", "ct-abstraction"],
              hints: [
                "The inner loop runs completely for every single turn of the outer loop.",
                "5 turns outside × 5 turns inside = ?",
              ],
              explanation:
                "The outer loop turns 5 times; each of those turns runs the inner loop 5 times. 5 × 5 = **25** — one plot per LED, exactly the whole screen.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Loops Checkpoint",
      blocks: [
        {
          id: "mb07-q0",
          type: "quiz",
          title: "Prove you can loop",
          passPct: 70,
          questions: [
            {
              id: "mb07-q1",
              kind: "mcq",
              prompt:
                "How many times does `for index from 0 to 4` repeat its instructions?",
              options: [
                { id: "a", text: "3" },
                { id: "b", text: "4" },
                { id: "c", text: "5" },
                { id: "d", text: "It never stops" },
              ],
              answerId: "c",
              skillIds: ["algo-iteration"],
              explanation: "0, 1, 2, 3, 4 — five values, five turns.",
            },
            {
              id: "mb07-q2",
              kind: "truefalse",
              prompt: "A variable can hold more than one value at the same time.",
              answer: false,
              skillIds: ["prog-blocks"],
              explanation:
                "A variable can't hold more than one value at the same time — that is why the 25-LED script needs two variables, ledx and ledy.",
            },
            {
              id: "mb07-q3",
              kind: "mcq",
              prompt: "Why does the script include a `pause` block?",
              options: [
                { id: "a", text: "To slow down the blinking effect" },
                { id: "b", text: "To make the LEDs brighter" },
                { id: "c", text: "To create the variable" },
                { id: "d", text: "To stop the loop" },
              ],
              answerId: "a",
              skillIds: ["prog-blocks"],
              explanation:
                "Without the pause the loop finishes faster than your eye can follow, and the screen just looks like it flashed once.",
            },
            {
              id: "mb07-q4",
              kind: "fillblank",
              prompt: "Complete the sentence about the 25-LED script.",
              template:
                "To light all 25 LEDs we use an [[e]] loop with the two variables [[v1]] and [[v2]].",
              blanks: {
                e: ["embedded", "nested"],
                v1: ["ledx"],
                v2: ["ledy"],
              },
              skillIds: ["algo-iteration", "pc-microbit"],
              explanation:
                "An embedded loop is a loop inside a loop. `ledx` walks across a line, `ledy` moves to the next line.",
            },
            {
              id: "mb07-q5",
              kind: "mcq",
              prompt:
                "What do the blocks `set ledx to 0` and `set ledy to 0` inside `on start` do?",
              options: [
                { id: "a", text: "They light the LED at (0,0) immediately" },
                { id: "b", text: "They initialize the two variables before the loops run" },
                { id: "c", text: "They delete the two variables" },
                { id: "d", text: "They set the speed of the blinking" },
              ],
              answerId: "b",
              skillIds: ["prog-blocks"],
              explanation:
                "`on start` runs once when the micro:bit powers up. The two set blocks give each variable a known starting value.",
            },
            {
              id: "mb07-q6",
              kind: "sort",
              prompt:
                "Order the values the variable `led` takes during one complete `for led from 0 to 4` loop.",
              items: [
                { id: "v3", text: "2" },
                { id: "v1", text: "0" },
                { id: "v5", text: "4" },
                { id: "v2", text: "1" },
                { id: "v4", text: "3" },
              ],
              correctOrder: ["v1", "v2", "v3", "v4", "v5"],
              endLabels: ["First turn", "Last turn"],
              skillIds: ["algo-iteration"],
              explanation:
                "The loop counts up from the first number to the last one, one step at a time: 0 → 1 → 2 → 3 → 4.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Project — Flashing LEDs",
      blocks: [
        {
          id: "mb07-p1",
          type: "project",
          project: {
            id: "mb07-project",
            title: "Flashing LEDs, Then the Whole Screen",
            brief:
              "Build the two scripts of this lesson on a real micro:bit: first the flashing line (a loop that plots, a loop that unplots), then the embedded loop that illuminates all 25 LEDs.",
            deliverables: [
              "Script 1: a line of LEDs that switches on one by one, then off in the same order, forever",
              "Script 2: an embedded loop with ledx and ledy that lights all 25 LEDs",
              "A short video or photo series of both scripts running on the board",
              "Write the number of plot blocks you saved compared with the manual method of Lesson 6",
            ],
            submitTypes: ["code", "image", "text"],
            rubric: [
              {
                criterion: "Correct loop",
                description:
                  "The loop counts from 0 to 4 and the variable is used in the plot address.",
              },
              {
                criterion: "On and off",
                description:
                  "A second loop unplots the LEDs in the same order they were plotted.",
              },
              {
                criterion: "Embedded loop",
                description:
                  "Two loops, two variables, all 25 LEDs light up.",
              },
            ],
            xp: 45,
          },
        },
        {
          id: "mb07-r1",
          type: "reflection",
          prompt:
            "Your embedded loop replaced 25 blocks with 4. Where else in this chapter — or in life — do you repeat yourself enough that a loop would help?",
          placeholder: "Every morning I repeat…",
        },
      ],
    },
  ],
};
