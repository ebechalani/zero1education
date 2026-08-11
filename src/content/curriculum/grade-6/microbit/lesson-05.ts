import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Chapter 1 "MakeCode for Micro:bit" · Lesson 5
 * Book objective: Creating a project with two variables
 * Source: G6_2023_ch1_microbit.pdf, pp. 12–13.
 */
export const lessonMb05: Lesson = {
  id: "g6-mb-05",
  slug: "creating-a-project-with-two-variables",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 5,
  title: "Creating a Project with Two Variables",
  tagline: "Two players, two buttons, two boxes — first to 10 wins",
  description:
    "A card, a button and a race to 10. Because one variable can never hold two values at the same time, this game needs one variable per player — and an `if` block to decide who wins.",
  objectives: [
    "Explain why a variable should be created for each player in the game",
    "State that a variable can't hold more than one value at the same time",
    "Create and initialize two variables, a and b, inside the `on start` block",
    "Use `change … by 1` inside `on button A pressed` to count each press",
    "Add an `if` block that tests for the value 10 and displays a message announcing the winner",
  ],
  skillIds: ["pc-microbit", "prog-blocks", "algo-selection", "ct-abstraction"],
  estimatedMinutes: 45,
  difficulty: "stretch",
  icon: "Gamepad2",
  status: "published",
  teacherGuide: {
    overview:
      "The chapter's first real project, and the lesson where selection appears. Students already know how to store and update a number; the new idea is asking a question about that number — `if a = 10 then`. Run the game as a class tournament once the scripts work; the noise is worth it.",
    tips: [
      "Prepare the two cards (1 and 2) in advance and turn them face down, exactly as the book describes. The randomness is what makes the game fair.",
      "Ask the key question before showing any code: \"why can't both players share one variable?\" The answer — a variable can't hold two values at once — is the whole lesson.",
      "Students often forget to initialize b, or copy the A script and leave `a` inside it. Both bugs are visible instantly during play.",
      "The `if` block lives in the Logic category. Point it out; Lesson 9 will use the same shape with sensor values.",
      "A tutorial for this project is on the ZERO1 platform: Digital Resources tab.",
    ],
    answersNote:
      "Book answers — 2 users · content can change: YES · name can change: NO · 2 values in one variable: NO · both variables initialized to 0 · value in the `if` block: 10 · value in `change a by`: 1 · at 10 a message announcing the winner is displayed.",
  },
  stages: [
    {
      id: "g6-mb-05-discover",
      kind: "discover",
      title: "Two Cards, Face Down",
      blocks: [
        {
          id: "mb5-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "**The rules of the game**\n\n- Number of players: **2**\n- Write on two cards the values **1** and **2**\n- Reverse the two cards in order to start the game\n- Each player picks a card and presses the push button of the Micro:bit a number of times equal to the number picked — **player 1 uses button A**, **player 2 uses button B**\n\nThe game ends when one of the two players reaches the value **10**. A message is then displayed announcing the winner.",
        },
        {
          id: "mb5-d2",
          type: "activity",
          activity: {
            id: "mb5-d-poll",
            kind: "mcq",
            prompt:
              "Both players are counting at the same time, on the same Micro:bit. How many variables does the script need?",
            options: [
              { id: "a", text: "One — both players can share it" },
              { id: "b", text: "Two — one for each player" },
              { id: "c", text: "Ten — one for each point" },
              { id: "d", text: "None — the buttons remember by themselves" },
            ],
            answerId: "b",
            hints: [
              "Think about the box. Can one box hold a 4 and a 7 at the same moment?",
            ],
            explanation:
              "A variable **can't hold more than one value at the same time**; that's why a variable should be created for each player. Two players → two boxes: **a** and **b**.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "g6-mb-05-learn",
      kind: "learn",
      title: "One Variable per Player, One Script per Button",
      blocks: [
        {
          id: "mb5-l1",
          type: "heading",
          text: "How many variables should we use?",
        },
        {
          id: "mb5-l2",
          type: "text",
          md: "Let us answer these questions in order to decide:\n\n- **How many users can play the game?** → 2\n- **Can the content of a variable change?** → YES\n- **Can the name of a variable change?** → NO\n- **Can 2 values be in the same variable?** → NO",
        },
        {
          id: "mb5-l3",
          type: "callout",
          variant: "fact",
          title: "A conclusion to be memorized!",
          md: "A variable **can't hold more than one value at the same time**; that's why a variable should be created **for each player**.\n\nThe variable has a **unique name** and can **change its content** at any moment in the script.",
        },
        {
          id: "mb5-l4",
          type: "text",
          md: "So we create a variable named **\"a\"** for the first player, and a variable named **\"b\"** for the second player.",
        },
        {
          id: "mb5-l5",
          type: "code",
          language: "text",
          code: `   ┌───────┐        ┌───────┐
   │   0   │        │   0   │
   └───────┘        └───────┘
       a                b
   player 1         player 2`,
          caption:
            "Two boxes, two names, two scores — both starting empty at 0.",
        },
        { id: "mb5-l6", type: "heading", text: "Ready to start?" },
        {
          id: "mb5-l7",
          type: "flow",
          steps: [
            {
              id: "mb5-f1",
              label: "Create the two variables",
              detail: "Variables category → Make a Variable → \"a\", then again for \"b\"",
            },
            {
              id: "mb5-f2",
              label: "Open the `on start` block",
              detail: "Everything that must happen once, at launch, goes here",
            },
            {
              id: "mb5-f3",
              label: "Insert the two `set … to` blocks",
              detail: "One for a, one for b",
            },
            {
              id: "mb5-f4",
              label: "Initialize both to 0",
              detail: "Neither player has scored yet when the game begins",
            },
          ],
        },
        {
          id: "mb5-l8",
          type: "code",
          language: "makecode",
          code: `on start
    set a to 0
    set b to 0`,
          caption: "The starting line: both scores at zero.",
        },
        {
          id: "mb5-l9",
          type: "teacherNote",
          md: "Ask why `set a to 0` cannot live inside `on button A pressed`. Put it there on the projector and play one round — the score resets to 0 on every press and nobody can ever win. Thirty seconds of broken game teaches initialization better than a paragraph.",
        },
        { id: "mb5-l10", type: "heading", text: "A script for each button" },
        {
          id: "mb5-l11",
          type: "text",
          md: "Two scripts should be built, one for each player, in order to control the game. Here is the script built for **button A**.",
        },
        {
          id: "mb5-l12",
          type: "code",
          language: "makecode",
          code: `on button A pressed
    change a by 1
    if a = 10 then
        show string "PLAYER 1 WINS"`,
          caption:
            "Player 1's script — count the press, then check whether the race is over.",
        },
        {
          id: "mb5-l13",
          type: "flow",
          steps: [
            {
              id: "mb5-g1",
              label: "Button A is pressed",
              detail: "The blocks inside run once — every single time the button is pressed",
            },
            {
              id: "mb5-g2",
              label: "change a by 1",
              detail: "The value 1 is added, so player 1's score goes up by one point",
            },
            {
              id: "mb5-g3",
              label: "if a = 10 then",
              branch: "only when a is exactly 10",
              detail: "The `if` block asks a question about the value inside the box",
            },
            {
              id: "mb5-g4",
              label: "show string \"PLAYER 1 WINS\"",
              detail: "The message announcing the winner is displayed",
            },
          ],
        },
        {
          id: "mb5-l14",
          type: "definition",
          term: "The `if` block",
          definition:
            "A block that tests a condition and runs the blocks inside it only when that condition is true.",
          example:
            "`if a = 10 then` runs its contents only on the press that takes a to exactly 10.",
        },
        {
          id: "mb5-l15",
          type: "callout",
          variant: "tip",
          title: "Why 1 and why 10?",
          md: "The value **1** goes in `change a by`, because each press is worth exactly one point.\n\nThe value **10** goes in the `if` block, because the game ends when a player reaches 10 — that number, and no other, is what the script must watch for.",
        },
        {
          id: "mb5-l16",
          type: "callout",
          variant: "info",
          title: "Watch the tutorial",
          md: "A video walkthrough of this project is waiting for you on the ZERO1 platform:\n\n1. Access your account on **www.zero1.education**\n2. Open the **Digital Resources** tab to watch the tutorial.",
        },
      ],
    },
    {
      id: "g6-mb-05-tryit",
      kind: "tryit",
      title: "Before You Build",
      blocks: [
        {
          id: "mb5-t0",
          type: "text",
          md: "Your book's questions — answer them before you touch MakeCode.",
        },
        {
          id: "mb5-t1",
          type: "activity",
          activity: {
            id: "mb5-try-classify",
            kind: "classify",
            prompt: "YES or NO? Sort each statement about variables.",
            categories: [
              { id: "yes", label: "YES" },
              { id: "no", label: "NO" },
            ],
            items: [
              {
                id: "mb5-k1",
                text: "Can the content of a variable change?",
                categoryId: "yes",
              },
              {
                id: "mb5-k2",
                text: "Can the name of a variable change?",
                categoryId: "no",
              },
              {
                id: "mb5-k3",
                text: "Can 2 values be in the same variable?",
                categoryId: "no",
              },
            ],
            skillIds: ["ct-abstraction", "prog-blocks"],
            hints: [
              "Only one of the three is a YES.",
              "The label on a box stays put. What is inside it does not.",
            ],
            explanation:
              "The content changes freely, the name never changes, and a variable can only ever hold **one** value at a time — which is exactly why this game needs two of them.",
          },
        },
        {
          id: "mb5-t2",
          type: "activity",
          activity: {
            id: "mb5-try-tf",
            kind: "truefalse",
            prompt:
              "The blocks inside `on button A pressed` are executed once — every time the button A is pressed.",
            answer: true,
            skillIds: ["prog-blocks", "pc-microbit"],
            hints: [
              "Press A ten times. How many times do the blocks inside run?",
            ],
            explanation:
              "Each press fires the event once, so the blocks inside run once per press. Ten presses = ten runs = ten points.",
          },
        },
        {
          id: "mb5-t3",
          type: "activity",
          activity: {
            id: "mb5-try-fill",
            kind: "fillblank",
            prompt: "Fill in the two values the script needs.",
            template:
              "In the block `change a by …`, the value should be [[b1]], in order to increase the value of the variable a by one point.\nIn the `if` block, the value to type is [[b2]], because that is when the game ends.",
            blanks: { b1: ["1", "one"], b2: ["10", "ten"] },
            skillIds: ["prog-blocks", "algo-selection"],
            hints: [
              "One press is worth how many points?",
              "Re-read the rules: the game ends when a player reaches which value?",
            ],
            explanation:
              "`change a by 1` counts the press. `if a = 10 then` catches the exact moment the game is won.",
          },
        },
        {
          id: "mb5-t4",
          type: "activity",
          activity: {
            id: "mb5-try-mcq",
            kind: "mcq",
            prompt:
              "What happens when the variable \"a\" reaches the value 10?",
            options: [
              { id: "a", text: "Nothing — the script keeps counting" },
              {
                id: "b",
                text: "The condition of the `if` block becomes true and the message announcing the winner is displayed",
              },
              { id: "c", text: "The variable b is reset to 0" },
              { id: "d", text: "Button A stops working forever" },
            ],
            answerId: "b",
            skillIds: ["algo-selection", "prog-blocks"],
            hints: [
              "Look inside the `if` block. What is the only block placed there?",
            ],
            explanation:
              "The `if` block has been watching the value of a on every press. The moment a equals 10, its condition is true and the winner's message appears on the 25 LEDs.",
          },
        },
      ],
    },
    {
      id: "g6-mb-05-challenge",
      kind: "challenge",
      title: "Now Program Button B",
      blocks: [
        {
          id: "mb5-c0",
          type: "text",
          md: "Player 1 is ready. Player 2 is still waiting for a script. Write it — carefully, because copying player A's blocks without changing them is the bug that ruins this game every single year.",
        },
        {
          id: "mb5-c1",
          type: "challenge",
          challenge: {
            id: "mb5-challenge",
            title: "Player 2's Script",
            brief:
              "Build the script for the second player, using the variable b and the push button B. Every letter matters.",
            activity: {
              id: "mb5-ch-fill",
              kind: "fillblank",
              prompt: "Complete player 2's script.",
              template:
                "on button [[b1]] pressed\n    change [[b2]] by [[b3]]\n    if [[b4]] = [[b5]] then\n        show string \"PLAYER 2 WINS\"",
              blanks: {
                b1: ["B", "b"],
                b2: ["b"],
                b3: ["1", "one"],
                b4: ["b"],
                b5: ["10", "ten"],
              },
              skillIds: ["prog-blocks", "algo-selection", "ps-strategy"],
              hints: [
                "Player 2 uses button B — and the variable created for player 2.",
                "The scoring value and the winning value are the same for both players; only the letters change.",
                "If the variable a appears anywhere in this script, player 2 is scoring points for player 1.",
              ],
              explanation:
                "Same shape, different letters: the event becomes **button B**, and every **a** becomes a **b**. The 1 and the 10 stay the same, because the rules of the game are the same for both players.",
            },
            xp: 40,
          },
        },
        {
          id: "mb5-c2",
          type: "teacherNote",
          md: "Duplicating the A script and forgetting to swap `a` for `b` is the defining bug of this lesson. Do not warn students in advance — let it happen, then play one round in front of the class. Watching player 2's presses score for player 1 makes the point permanently.",
        },
      ],
    },
    {
      id: "g6-mb-05-checkpoint",
      kind: "checkpoint",
      title: "Two-Variable Checkpoint",
      blocks: [
        {
          id: "mb5-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "mb5-q1",
              kind: "mcq",
              prompt:
                "Why does this game need two variables instead of one?",
              options: [
                { id: "a", text: "Because the Micro:bit has two buttons" },
                {
                  id: "b",
                  text: "Because a variable can't hold more than one value at the same time",
                },
                { id: "c", text: "Because the cards show 1 and 2" },
                { id: "d", text: "Because the game ends at 10" },
              ],
              answerId: "b",
              skillIds: ["ct-abstraction"],
              explanation:
                "One box, one value. Two scores that exist at the same moment need two boxes — one variable per player.",
            },
            {
              id: "mb5-q2",
              kind: "mcq",
              prompt:
                "Where must `set a to 0` and `set b to 0` be placed?",
              options: [
                { id: "a", text: "Inside `on button A pressed`" },
                { id: "b", text: "Inside `on button B pressed`" },
                { id: "c", text: "Inside `on start`" },
                { id: "d", text: "Anywhere — it makes no difference" },
              ],
              answerId: "c",
              skillIds: ["prog-blocks"],
              explanation:
                "`on start` runs once when the script is launched, which is exactly when both scores should be zero. Inside a button block they would reset on every press.",
            },
            {
              id: "mb5-q3",
              kind: "truefalse",
              prompt:
                "The `if` block is added in order to check whether the variable has reached the winning value.",
              answer: true,
              skillIds: ["algo-selection"],
              explanation:
                "That is exactly its job: it tests the value of the variable on every press and only acts when the condition is true.",
            },
            {
              id: "mb5-q4",
              kind: "sort",
              prompt:
                "Player 1 presses button A. Put the events in the order they happen.",
              items: [
                { id: "mb5-s1", text: "The `if` block tests whether a = 10" },
                { id: "mb5-s2", text: "The button A event fires" },
                { id: "mb5-s3", text: "`change a by 1` adds a point" },
                {
                  id: "mb5-s4",
                  text: "If the test is true, the winning message is displayed",
                },
              ],
              correctOrder: ["mb5-s2", "mb5-s3", "mb5-s1", "mb5-s4"],
              endLabels: ["First", "Last"],
              skillIds: ["algo-sequence", "algo-selection"],
              explanation:
                "The press fires the event, the score goes up, and only then does the `if` block ask its question. Testing before counting would mean the winning press is never noticed.",
            },
            {
              id: "mb5-q5",
              kind: "fillblank",
              prompt: "Complete the conclusion to be memorized.",
              template:
                "A variable has a [[b1]] name and can change its [[b2]] at any moment in the script.",
              blanks: {
                b1: ["unique"],
                b2: ["content", "value"],
              },
              bank: ["unique", "content", "screen", "sensor"],
              skillIds: ["ct-abstraction"],
              explanation:
                "Unique name, changing content — the two halves of every variable you will ever write.",
            },
            {
              id: "mb5-q6",
              kind: "mcq",
              prompt:
                "Player 2 draws the card showing 2 and presses button B twice. What is now inside the variable b?",
              options: [
                { id: "a", text: "0" },
                { id: "b", text: "1" },
                { id: "c", text: "2" },
                { id: "d", text: "10" },
              ],
              answerId: "c",
              skillIds: ["prog-blocks", "pc-microbit"],
              explanation:
                "b started at 0 and `change b by 1` ran twice — once per press — so b now holds **2**. Eight more points to go.",
            },
          ],
        },
      ],
    },
    {
      id: "g6-mb-05-create",
      kind: "create",
      title: "Build It and Play It",
      blocks: [
        {
          id: "mb5-p1",
          type: "project",
          project: {
            id: "mb5-project",
            title: "The First to 10 Wins",
            brief:
              "Now that you built the script for the button A, it is time to program the button B and to start playing the game. Build it, test it, then find an opponent.",
            deliverables: [
              "Create the two variables a and b and initialize both to 0 inside `on start`",
              "Build the script for button A: change a by 1, and an `if` block that announces player 1 as the winner at 10",
              "Build the matching script for button B using the variable b",
              "Prepare the two cards (1 and 2), reverse them, and play a full round against a classmate",
              "Take a screenshot of your blocks, or share the MakeCode link, and say who won",
            ],
            submitTypes: ["image", "link", "text"],
            rubric: [
              {
                criterion: "Two variables, correctly initialized",
                description:
                  "a and b are both created and both set to 0 in `on start`",
              },
              {
                criterion: "Independent scripts",
                description:
                  "Button A only ever touches a, button B only ever touches b",
              },
              {
                criterion: "Working `if` blocks",
                description:
                  "Each script tests for the value 10 and displays a message announcing the correct winner",
              },
              {
                criterion: "It survives a real game",
                description:
                  "The game was played end to end and produced one winner",
              },
            ],
            xp: 50,
          },
        },
        {
          id: "mb5-r1",
          type: "reflection",
          prompt:
            "Change one rule of the game — the winning number, the points per press, or what the winner sees. Which blocks would you have to edit, and which would stay exactly the same?",
          placeholder: "To make the game go to 20 instead of 10, I would change…",
        },
      ],
    },
  ],
};
