import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Unit "MakeCode for micro:bit" · Lesson 8 of the printed 2023 chapter.
 * Book objectives: "Discovering the Air quality station from Kitronik" and
 * "Controlling the room temperature".
 */
export const lessonMb08: Lesson = {
  id: "g6-mb-08",
  slug: "air-quality-station",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 8,
  title: "The Kitronik Air Quality Station",
  tagline: "Give your micro:bit a sense of the room",
  description:
    "Plug the micro:bit into the Kitronik Air Quality and Environmental Board and it can suddenly feel the room around it — temperature, humidity — and warn you when things get too hot.",
  objectives: [
    "Discovering the Air Quality station from Kitronik",
    "Controlling the room temperature",
    "Describe what the board reads (temperature, humidity) and how it interacts with the micro:bit",
    "Add the Kitronik extension in MakeCode and find its new category of blocks",
    "Use the setup block that activates all the sensors on the board",
    "Display a warning when the temperature goes above a chosen value",
  ],
  skillIds: ["pc-microbit", "data-analysis", "algo-selection", "prog-blocks"],
  estimatedMinutes: 50,
  difficulty: "core",
  icon: "Thermometer",
  status: "published",
  teacherGuide: {
    overview:
      "This is where the chapter's IoT thread lands on real hardware: sensors (input) → micro-controller (brain) → screen (output). If you have only a few Kitronik boards, run this as a rotation — the extension steps and the if-conditions can be built in the MakeCode simulator while groups wait for a board.",
    tips: [
      "Adding the extension is the step students forget. No extension, no Kitronik category, no blocks — check every screen before moving on.",
      "The setup block must sit in `on start`, before any reading. Make it a class rule.",
      'Ask what the script does at exactly 30 °C. The book\'s two conditions ("greater than 30" and "less than 30") leave that gap on purpose — it is the best conversation of the lesson.',
      "Warm a sensor gently with a hand rather than anything hot. The numbers move within seconds and the class can watch the warning appear.",
      "The book points to extra worksheets on zero1.education for classes new to Kitronik products.",
    ],
    answersNote:
      'Challenge: two if blocks — if temperature > 30 then show "too hot"; if temperature < 30 then show "nice weather". At exactly 30 neither condition is true and no message appears.',
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "Can a Computer Feel the Room?",
      blocks: [
        {
          id: "mb08-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "It is the last period of the day and the classroom is stifling. Someone opens a window, someone else closes it. Nobody actually **knows** how hot it is.\n\nBack in Lesson 1 you answered a question: *can a temperature sensor be linked to a computer?* You said yes. Today you prove it.",
        },
        {
          id: "mb08-d2",
          type: "activity",
          activity: {
            id: "mb08-d-poll",
            kind: "mcq",
            prompt:
              "In the smart object you studied earlier in this chapter, what job does a **sensor** do?",
            options: [
              { id: "a", text: "It is an input device — it brings data in" },
              { id: "b", text: "It is an output device — it displays data" },
              { id: "c", text: "It is the brain of the device" },
              { id: "d", text: "It connects the device to the WIFI" },
            ],
            answerId: "a",
            hints: [
              "Think of the four elements of a smart object: sensors, WIFI, a screen, a micro-controller.",
            ],
            explanation:
              "A smart object needs **a set of sensors considered as input devices**, a WIFI connection, an output device such as a screen, and a micro-controller as its brain. The Kitronik station is exactly that set of sensors.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Meet the Air Quality Station",
      blocks: [
        { id: "mb08-l1", type: "heading", text: "Protecting the environment" },
        {
          id: "mb08-l2",
          type: "definition",
          term: "Kitronik Air Quality and Environmental Board",
          definition:
            "A board for micro:bit designed to read data like the temperature and the humidity in order to interact with the micro:bit board.",
          example:
            "Slide the micro:bit into the connector on the board and the two work as one device.",
        },
        {
          id: "mb08-l3",
          type: "text",
          md: "This board is ideal for **STEAM** projects and for understanding the world of **IOT** and **AI** more deeply. The micro:bit brings the brain; the station brings the senses.",
        },
        {
          id: "mb08-l4",
          type: "text",
          md: "The main elements of the Air Quality station are:\n\n- **A screen** to display messages and the sensor's values.\n- **The different sensors** that are on the board.",
        },
        {
          id: "mb08-l5",
          type: "callout",
          variant: "info",
          title: "New to Kitronik?",
          md: "If you don't have previous knowledge in using the micro:bit or the Kitronik products, log in to your account on **www.zero1.education** and download the extra worksheets for this lesson.",
        },
        {
          id: "mb08-l6",
          type: "heading",
          text: "Adding the extension in MakeCode",
        },
        {
          id: "mb08-l7",
          type: "text",
          md: "MakeCode does not know about the Kitronik board until you tell it. You add an **extension** — a pack of extra blocks made for that board.",
        },
        {
          id: "mb08-l8",
          type: "flow",
          steps: [
            {
              id: "mb08-f1",
              label: "Click on Extensions",
              detail: "In the MakeCode block list.",
            },
            {
              id: "mb08-f2",
              label: "Search the extension",
              detail:
                '"Kitronik Air Quality and Environmental Board for micro:bit".',
            },
            {
              id: "mb08-f3",
              label: "Click on the extension",
              detail: "MakeCode adds it to your project.",
            },
            {
              id: "mb08-f4",
              label: "Examine the new category",
              detail: "A new category of blocks appears in the list.",
            },
            {
              id: "mb08-f5",
              label: "Move the setup block into on start",
              detail: "Nothing can be read before the sensors are activated.",
            },
          ],
        },
        {
          id: "mb08-l9",
          type: "callout",
          variant: "info",
          title: "The setup block",
          md: "The setup block **activates all the sensors** on the Air Quality board, so that your script can read the data from the different sensors that are on board.\n\nIt goes in `on start`, and it goes there **once**.",
        },
        { id: "mb08-l10", type: "heading", text: "Setting up the final project" },
        {
          id: "mb08-l11",
          type: "code",
          language: "blocks",
          caption:
            "The final script of the lesson: wake the sensors once, then read and display the temperature over and over.",
          code: `on start
    [Air Quality]  setup all sensors        <- activates every sensor on the board

forever
    [Air Quality]  show on screen:  temperature (°C)
    pause          1000 (ms)`,
        },
        {
          id: "mb08-l12",
          type: "text",
          md: "Launch the script and note the behaviour of the Air Quality station together with the micro:bit. The value on the screen changes as the room changes — put your hand near the sensor and watch it climb.",
        },
        {
          id: "mb08-l13",
          type: "teacherNote",
          md: "Three failures you will see in the room:\n\n1. **No Kitronik category** — the extension was never added.\n2. **Empty or frozen readings** — the setup block is missing, or it was dropped into `forever` instead of `on start`.\n3. **Numbers scrolling too fast to read** — no `pause`, so the screen never settles.\n\nAll three are fixed in ten seconds once students learn to check them in that order.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Wire It Up",
      blocks: [
        {
          id: "mb08-t1",
          type: "activity",
          activity: {
            id: "mb08-try-sort",
            kind: "sort",
            prompt:
              "Put the steps for adding and using the Kitronik extension in the right order.",
            items: [
              { id: "s1", text: "Search for the Kitronik Air Quality and Environmental Board" },
              { id: "s2", text: "Click on Extensions" },
              { id: "s3", text: "Move the setup block into on start" },
              { id: "s4", text: "Click on the extension to add it to the project" },
              { id: "s5", text: "Examine the new category added to the block list" },
            ],
            correctOrder: ["s2", "s1", "s4", "s5", "s3"],
            endLabels: ["First", "Last"],
            skillIds: ["prog-blocks", "pc-microbit"],
            hints: [
              "You cannot search inside a window you have not opened yet.",
              "The blocks only exist after the extension is added.",
            ],
            explanation:
              "Extensions → search → add → the new category appears → drag the setup block into `on start`. Skip a step and the blocks simply are not there.",
          },
        },
        {
          id: "mb08-t2",
          type: "activity",
          activity: {
            id: "mb08-try-fill",
            kind: "fillblank",
            prompt: "Complete the sentence about the setup block.",
            template:
              "The setup block activates all the [[s]] on the Air Quality board, and it is placed inside the [[b]] block.",
            blanks: {
              s: ["sensors", "sensor"],
              b: ["on start", "onstart", "on-start"],
            },
            skillIds: ["pc-microbit", "prog-blocks"],
            hints: ["Which block runs exactly once, when the micro:bit powers up?"],
            explanation:
              "One block wakes every sensor at once, and `on start` runs it a single time before anything is read.",
          },
        },
        {
          id: "mb08-t3",
          type: "activity",
          activity: {
            id: "mb08-try-multi",
            kind: "multi",
            prompt:
              "Which kinds of data is the Kitronik Air Quality and Environmental Board designed to read? **Select all that apply.**",
            options: [
              { id: "a", text: "The temperature" },
              { id: "b", text: "The humidity" },
              { id: "c", text: "The number of students in the room" },
              { id: "d", text: "The Wi-Fi password of the school" },
            ],
            answerIds: ["a", "b"],
            skillIds: ["data-analysis", "pc-microbit"],
            hints: [
              "The board reads things about the **environment** — the air around it.",
            ],
            explanation:
              "The board is designed to read data like the **temperature** and the **humidity** in order to interact with the micro:bit board. It senses the environment, not people or passwords.",
          },
        },
        {
          id: "mb08-t4",
          type: "activity",
          activity: {
            id: "mb08-try-tf",
            kind: "truefalse",
            prompt:
              "After adding the extension, the Kitronik blocks appear as a new category in the MakeCode block list.",
            answer: true,
            skillIds: ["prog-blocks"],
            hints: ["What does the book ask you to examine right after adding it?"],
            explanation:
              "Adding an extension adds a whole new category of blocks — that is how you know it worked.",
          },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Too Hot or Nice Weather?",
      blocks: [
        {
          id: "mb08-c0",
          type: "text",
          md: "**Time to take actions.** Build the script that displays one of these messages:\n\n1. **\"too hot\"** when the temperature is greater than 30.\n2. **\"nice weather\"** when the temperature is less than 30.",
        },
        {
          id: "mb08-c1",
          type: "code",
          language: "blocks",
          caption:
            "Two conditions, two messages. The reading is stored in a variable so both if blocks judge the same number.",
          code: `on start
    [Air Quality]  setup all sensors

forever
    set temp to  [Air Quality] temperature (°C)

    if   temp > 30   then
        show string  "too hot"

    if   temp < 30   then
        show string  "nice weather"

    pause  1000 (ms)`,
        },
        {
          id: "mb08-c2",
          type: "callout",
          variant: "warning",
          title: "Mind the gap at 30",
          md: "Read the two conditions again: **greater than** 30, and **less than** 30. What about exactly 30?\n\nNeither condition is true, so **no message appears at all**. That is not a bug in your hands — it is a decision you now have to make as the programmer.",
        },
        {
          id: "mb08-c3",
          type: "challenge",
          challenge: {
            id: "mb08-challenge",
            title: "Judge the Readings",
            brief:
              "The station takes seven readings during the day. Decide what your script displays for each one — including the awkward one.",
            activity: {
              id: "mb08-ch-1",
              kind: "classify",
              prompt:
                "Using the two conditions above, sort each temperature reading by the message the micro:bit shows.",
              categories: [
                { id: "hot", label: 'Shows "too hot"' },
                { id: "nice", label: 'Shows "nice weather"' },
                { id: "none", label: "Shows no message" },
              ],
              items: [
                { id: "r1", text: "34 °C", categoryId: "hot" },
                { id: "r2", text: "31 °C", categoryId: "hot" },
                { id: "r3", text: "38 °C", categoryId: "hot" },
                { id: "r4", text: "22 °C", categoryId: "nice" },
                { id: "r5", text: "18 °C", categoryId: "nice" },
                { id: "r6", text: "29 °C", categoryId: "nice" },
                { id: "r7", text: "30 °C", categoryId: "none" },
              ],
              skillIds: ["algo-selection", "data-analysis"],
              hints: [
                '"Greater than 30" does not include 30 itself.',
                "One of the seven readings makes both conditions false. Which one?",
              ],
              explanation:
                "Above 30 → **too hot**. Below 30 → **nice weather**. At exactly **30** both tests fail and the screen stays silent. Real engineers fix this by using *greater than or equal to* in one of the conditions — your call.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Air Quality Checkpoint",
      blocks: [
        {
          id: "mb08-q0",
          type: "quiz",
          title: "Prove you can read the room",
          passPct: 70,
          questions: [
            {
              id: "mb08-q1",
              kind: "mcq",
              prompt:
                "What is the Kitronik Air Quality and Environmental Board designed to do?",
              options: [
                {
                  id: "a",
                  text: "Read data like the temperature and the humidity in order to interact with the micro:bit board",
                },
                { id: "b", text: "Replace the micro:bit's processor with a faster one" },
                { id: "c", text: "Connect the micro:bit to a printer" },
                { id: "d", text: "Store photos and videos" },
              ],
              answerId: "a",
              skillIds: ["pc-microbit", "data-analysis"],
              explanation:
                "It is an environmental board: it senses the air around it and hands those values to the micro:bit.",
            },
            {
              id: "mb08-q2",
              kind: "multi",
              prompt:
                "What are the main elements of the Air Quality station? **Select all that apply.**",
              options: [
                { id: "a", text: "A screen to display messages and the sensor's values" },
                { id: "b", text: "The different sensors that are on the board" },
                { id: "c", text: "A hard disk" },
                { id: "d", text: "A printer" },
              ],
              answerIds: ["a", "b"],
              skillIds: ["sys-io", "pc-microbit"],
              explanation:
                "A screen (output) and the sensors (input) — the same input/output pattern you met in Lesson 1.",
            },
            {
              id: "mb08-q3",
              kind: "fillblank",
              prompt: "Complete the sentence.",
              template:
                "To get the Kitronik blocks into MakeCode you must add an [[e]] to your project.",
              blanks: { e: ["extension", "extensions"] },
              skillIds: ["prog-blocks"],
              explanation:
                "Extensions add whole new categories of blocks for boards MakeCode does not know by default.",
            },
            {
              id: "mb08-q4",
              kind: "truefalse",
              prompt:
                "The setup block switches on only one sensor at a time, so you need one setup block per sensor.",
              answer: false,
              skillIds: ["pc-microbit"],
              explanation:
                "One setup block activates **all** the sensors on the Air Quality board.",
            },
            {
              id: "mb08-q5",
              kind: "mcq",
              prompt:
                'Your script uses the book\'s two conditions. The station reads **33 °C**. What is displayed?',
              options: [
                { id: "a", text: '"too hot"' },
                { id: "b", text: '"nice weather"' },
                { id: "c", text: "Nothing" },
                { id: "d", text: "An error message" },
              ],
              answerId: "a",
              skillIds: ["algo-selection"],
              explanation: "33 is greater than 30, so the first condition is true.",
            },
            {
              id: "mb08-q6",
              kind: "mcq",
              prompt:
                "With the same two conditions, the station reads **exactly 30 °C**. What is displayed?",
              options: [
                { id: "a", text: '"too hot"' },
                { id: "b", text: '"nice weather"' },
                { id: "c", text: "Nothing — neither condition is true" },
                { id: "d", text: "Both messages one after the other" },
              ],
              answerId: "c",
              skillIds: ["algo-selection", "ps-strategy"],
              explanation:
                "30 is not greater than 30 and not less than 30. The boundary belongs to nobody until you decide who gets it.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Project — Room Temperature Monitor",
      blocks: [
        {
          id: "mb08-p1",
          type: "project",
          project: {
            id: "mb08-project",
            title: "Controlling the Room Temperature",
            brief:
              "Turn the micro:bit and the Air Quality station into a monitor for your own classroom: it reads the temperature continuously and warns everyone when the room gets too hot.",
            deliverables: [
              "A script with the setup block in on start that activates all the sensors",
              'A condition that displays "too hot" when the temperature is greater than 30',
              'A condition that displays "nice weather" when the temperature is less than 30',
              "A note saying what your script does at exactly 30 °C, and what you decided to do about it",
              "Three readings taken at different moments of the day, with the message shown each time",
            ],
            submitTypes: ["code", "image", "text"],
            rubric: [
              {
                criterion: "Sensors activated",
                description: "The setup block is present and in the right place.",
              },
              {
                criterion: "Correct conditions",
                description:
                  "Both messages appear at the right temperatures, and the boundary case is explained.",
              },
              {
                criterion: "Real data",
                description:
                  "The readings come from the actual board, not from imagination.",
              },
            ],
            xp: 45,
          },
        },
        {
          id: "mb08-r1",
          type: "reflection",
          prompt:
            "Your monitor only warns a person who is looking at it. What would you add to make it a real smart object from Lesson 2?",
          placeholder: "If it were connected to the Internet, it could…",
        },
      ],
    },
  ],
};
