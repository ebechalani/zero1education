import type { Lesson } from "@/types/content";

export const lessonAlgorithms: Lesson = {
  id: "g6-idw-algorithms",
  slug: "algorithms",
  gradeId: "g6",
  unitId: "g6-idw",
  order: 3,
  title: "Algorithms",
  tagline: "Teach a machine to think in steps",
  description:
    "Computers are powerful but not clever — they do exactly what you say, nothing more. Learn to write instructions so precise that even a machine can't get them wrong.",
  objectives: [
    "Define what an algorithm is and recognize algorithms in daily life",
    "Put instructions in a precise, correct order (sequencing)",
    "Use IF conditions (selection) and loops (iteration) in an algorithm",
    "Find and fix errors in a sequence of instructions (debugging)",
  ],
  skillIds: ["algo-sequence", "algo-selection", "algo-iteration", "algo-debug", "ct-decompose"],
  estimatedMinutes: 50,
  difficulty: "core",
  icon: "GitBranch",
  labId: "algorithm",
  status: "published",
  teacherGuide: {
    overview:
      "The classic 'robot teacher' warm-up works brilliantly here: have students instruct YOU to draw a house or make a sandwich, and follow their words with malicious precision. The Algorithm Lab then lets them program a robot through a grid maze.",
    tips: [
      "Follow instructions literally in the warm-up — chaos teaches precision better than any slide.",
      "Push students to find the repeating pattern in their lab solution, then shorten it with a loop.",
      "Debugging mindset: an error is information, not failure. Celebrate found bugs.",
    ],
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "The Sandwich Robot",
      blocks: [
        {
          id: "alg-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Maya's little brother pretends to be a robot: *\"I only do EXACTLY what you say.\"*\n\nMaya: \"Put peanut butter on the bread.\"\n\nHe places the **whole jar** on top of the bread bag. Technically… correct.\n\nComputers are exactly like this. Powerful, fast — and completely literal.",
        },
        {
          id: "alg-d2",
          type: "text",
          md: "In this mission you'll learn to think like a programmer: breaking problems into steps so clear that even a very fast, very literal machine gets them right.",
        },
        {
          id: "alg-d3",
          type: "activity",
          activity: {
            id: "alg-d-poll",
            kind: "mcq",
            prompt: "Why did the \"robot brother\" put the whole jar on the bread?",
            options: [
              { id: "a", text: "He was being silly on purpose" },
              { id: "b", text: "The instruction wasn't precise enough" },
              { id: "c", text: "Robots can't make sandwiches" },
              { id: "d", text: "He didn't hear correctly" },
            ],
            answerId: "b",
            hints: ["He did EXACTLY what was said. What was missing from the instruction?"],
            explanation:
              "The instruction skipped steps: open the jar, take a knife, spread… Computers need **every** step. Missing steps = broken programs.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Sequence, Selection, Iteration",
      blocks: [
        { id: "alg-l1", type: "heading", text: "What is an algorithm?" },
        {
          id: "alg-l2",
          type: "definition",
          term: "Algorithm",
          definition:
            "A set of clear, ordered steps that solve a problem or complete a task.",
          example: "A recipe, morning routine, or the steps a robot follows through a maze.",
        },
        {
          id: "alg-l3",
          type: "text",
          md: "A good algorithm has three qualities:\n\n- **Clear** — each step has exactly one meaning\n- **Ordered** — steps happen in the right sequence\n- **Finite** — it eventually ends",
        },
        { id: "alg-l4", type: "heading", text: "1 · Sequence — steps in order" },
        {
          id: "alg-l5",
          type: "flow",
          steps: [
            { id: "f1", label: "START" },
            { id: "f2", label: "Take two slices of bread" },
            { id: "f3", label: "Open the jar" },
            { id: "f4", label: "Spread with a knife" },
            { id: "f5", label: "Close the sandwich" },
            { id: "f6", label: "END" },
          ],
        },
        {
          id: "alg-l6",
          type: "callout",
          variant: "warning",
          title: "Order matters",
          md: "Swap two steps — *close the sandwich* before *spread* — and the algorithm fails. Computers never reorder steps to \"help you out\".",
        },
        { id: "alg-l7", type: "heading", text: "2 · Selection — making decisions" },
        {
          id: "alg-l8",
          type: "text",
          md: "Algorithms can choose between paths using **IF**:",
        },
        {
          id: "alg-l9",
          type: "flow",
          steps: [
            { id: "s1", label: "Robot moves forward" },
            { id: "s2", label: "IF obstacle ahead?", branch: "decision" },
            { id: "s3", label: "YES → Turn right", branch: "yes" },
            { id: "s4", label: "NO → Keep moving", branch: "no" },
          ],
        },
        {
          id: "alg-l10",
          type: "code",
          language: "pseudocode",
          code: "IF it is raining\n    take an umbrella\nELSE\n    wear sunglasses\nEND IF",
          caption: "Selection written as pseudocode — half English, half code.",
        },
        { id: "alg-l11", type: "heading", text: "3 · Iteration — smart repeating" },
        {
          id: "alg-l12",
          type: "text",
          md: "Writing *move forward* six times is boring — and computers hate boring. A **loop** repeats steps for you:",
        },
        {
          id: "alg-l13",
          type: "code",
          language: "pseudocode",
          code: "REPEAT 6 times\n    move forward\nEND REPEAT",
          caption: "One loop replaces six identical instructions.",
        },
        {
          id: "alg-l14",
          type: "callout",
          variant: "fact",
          title: "You already run algorithms",
          md: "Tying your shoes, brushing your teeth, your school timetable — your brain executes algorithms all day. Programming just writes them down for machines.",
        },
        {
          id: "alg-l15",
          type: "teacherNote",
          md: "Vocabulary to lock in before the lab: **sequence**, **selection (IF)**, **iteration (loop)**. Students will meet all three as blocks in the Algorithm Lab.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Order the Steps",
      blocks: [
        {
          id: "alg-t1",
          type: "activity",
          activity: {
            id: "alg-try-sort",
            kind: "sort",
            prompt: "A robot must water a plant. Put the algorithm's steps in the correct order.",
            items: [
              { id: "s1", text: "Pour water on the plant" },
              { id: "s2", text: "Walk to the plant" },
              { id: "s3", text: "Fill the watering can" },
              { id: "s4", text: "Put the watering can back" },
              { id: "s5", text: "Pick up the watering can" },
            ],
            correctOrder: ["s5", "s3", "s2", "s1", "s4"],
            endLabels: ["First", "Last"],
            skillIds: ["algo-sequence"],
            hints: [
              "Can you fill a can you're not holding?",
              "The robot must HOLD the can, FILL it, REACH the plant, then pour.",
            ],
            explanation:
              "Pick up → fill → walk → pour → return. Each step depends on the one before — that's sequence.",
          },
        },
        {
          id: "alg-t2",
          type: "activity",
          activity: {
            id: "alg-try-if",
            kind: "mcq",
            prompt: "A game says: `IF player touches lava → lose a life`. What is this an example of?",
            options: [
              { id: "a", text: "Sequence" },
              { id: "b", text: "Selection" },
              { id: "c", text: "Iteration" },
              { id: "d", text: "Debugging" },
            ],
            answerId: "b",
            skillIds: ["algo-selection"],
            hints: ["The program is making a decision based on a condition."],
            explanation:
              "An IF that chooses what happens next is **selection** — the algorithm picks a path.",
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
          id: "alg-lab1",
          type: "lab",
          labId: "algorithm",
          title: "Robot Maze",
          brief:
            "Program the ZERO1 rover to reach the charging station. Build your algorithm from blocks, press RUN, and watch it execute — precisely, literally, every time.",
          config: {
            size: 5,
            start: { x: 0, y: 4, dir: "up" },
            goal: { x: 4, y: 0 },
            obstacles: [
              { x: 1, y: 2 },
              { x: 2, y: 2 },
              { x: 3, y: 1 },
            ],
            par: 10,
          },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Debug Duty",
      blocks: [
        {
          id: "alg-c1",
          type: "challenge",
          challenge: {
            id: "alg-challenge",
            title: "Debug Duty",
            brief:
              "Another student's robot algorithm keeps failing. Real programmers spend half their time fixing bugs — find this one.",
            activity: {
              id: "alg-ch-debug",
              kind: "mcq",
              prompt:
                "The robot must move 3 squares forward, turn right, then move 2 more. The program reads:\n\n`1. REPEAT 3 times: move forward`\n`2. turn LEFT`\n`3. REPEAT 2 times: move forward`\n\nWhich line has the bug?",
              options: [
                { id: "a", text: "Line 1 — the loop count is wrong" },
                { id: "b", text: "Line 2 — it turns the wrong way" },
                { id: "c", text: "Line 3 — the loop count is wrong" },
                { id: "d", text: "No bug — the algorithm is correct" },
              ],
              answerId: "b",
              skillIds: ["algo-debug", "algo-iteration"],
              hints: [
                "Check each line against the goal, one at a time.",
                "The loops both match the plan. What about the turn?",
              ],
              explanation:
                "The plan says turn **right**; the code says LEFT. One tiny word, completely different destination — that's why debuggers read line by line.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Algorithms Checkpoint",
      blocks: [
        {
          id: "alg-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "alg-q1",
              kind: "mcq",
              prompt: "Which of these is the best definition of an algorithm?",
              options: [
                { id: "a", text: "A type of computer" },
                { id: "b", text: "A set of clear, ordered steps that solve a problem" },
                { id: "c", text: "A programming language" },
                { id: "d", text: "A robot" },
              ],
              answerId: "b",
              skillIds: ["algo-sequence"],
              explanation: "Clear + ordered + finite steps = algorithm. The recipe idea, made precise.",
            },
            {
              id: "alg-q2",
              kind: "truefalse",
              prompt: "A loop lets an algorithm repeat steps without writing them again and again.",
              answer: true,
              skillIds: ["algo-iteration"],
              explanation: "That's iteration — REPEAT 6 times beats copy-pasting six lines.",
            },
            {
              id: "alg-q3",
              kind: "match",
              prompt: "Match each concept to its example.",
              pairs: [
                { id: "m1", left: "Sequence", right: "Step 1, then step 2, then step 3" },
                { id: "m2", left: "Selection", right: "IF raining → take umbrella" },
                { id: "m3", left: "Iteration", right: "REPEAT 10 times → jump" },
                { id: "m4", left: "Debugging", right: "Finding the wrong turn in a program" },
              ],
              skillIds: ["algo-selection", "algo-iteration", "algo-debug"],
              explanation: "The four moves you'll use in every program you ever write.",
            },
            {
              id: "alg-q4",
              kind: "sort",
              prompt: "Order the algorithm for crossing the street safely.",
              items: [
                { id: "s1", text: "Cross the street" },
                { id: "s2", text: "Stop at the crossing" },
                { id: "s3", text: "Look left and right" },
                { id: "s4", text: "IF the road is clear" },
              ],
              correctOrder: ["s2", "s3", "s4", "s1"],
              endLabels: ["First", "Last"],
              skillIds: ["algo-sequence", "algo-selection"],
              explanation: "Stop → look → check the condition → only then act. Selection keeps you safe.",
            },
            {
              id: "alg-q5",
              kind: "fillblank",
              prompt: "Complete the sentence.",
              template: "Repeating steps in an algorithm is called [[b1]], and choosing between paths with IF is called [[b2]].",
              blanks: { b1: ["iteration", "looping", "a loop"], b2: ["selection"] },
              bank: ["iteration", "selection", "sequence", "debugging"],
              skillIds: ["algo-iteration", "algo-selection"],
              explanation: "Iteration repeats; selection decides.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Algorithm Author",
      blocks: [
        {
          id: "alg-p1",
          type: "project",
          project: {
            id: "alg-project",
            title: "Write an Algorithm for a Friend",
            brief:
              "Choose something you know how to do — a card trick, a football move, a recipe — and write it as an algorithm so precise a robot (or a very literal classmate) could follow it perfectly.",
            deliverables: [
              "Pick a task and write its algorithm in numbered steps",
              "Use at least one IF (selection) and one REPEAT (iteration)",
              "Test it on a classmate following your words EXACTLY — then fix what broke",
            ],
            submitTypes: ["text"],
            rubric: [
              { criterion: "Precision", description: "Steps are unambiguous and complete" },
              { criterion: "Structures", description: "Uses selection and iteration correctly" },
              { criterion: "Debugging", description: "Describes what was fixed after testing" },
            ],
            xp: 40,
          },
        },
        {
          id: "alg-r1",
          type: "reflection",
          prompt: "What was the hardest part of making your instructions precise enough for a machine?",
          placeholder: "I discovered that I usually skip…",
        },
      ],
    },
  ],
};
