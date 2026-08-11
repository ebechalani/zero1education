import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Chapter 1 "MakeCode for Micro:bit" · Lesson 3
 * Book objectives: 1- Introducing the Micro-controllers · 2- Using a push button as an input control
 * Source: G6_2023_ch1_microbit.pdf, pp. 8–9.
 */
export const lessonMb03: Lesson = {
  id: "g6-mb-03",
  slug: "the-micro-controller-and-push-buttons",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 3,
  title: "The Micro-controller & Push Buttons",
  tagline: "The board that turns an input into an action",
  description:
    "Meet the electronic board that links input devices to output devices — the micro-controller. Then take control of your first input: the two push buttons of the Micro:bit.",
  objectives: [
    "Define a micro-controller and say where micro-controllers are found",
    "Explain how a micro-controller, inputs and outputs combine to make a smart object",
    "Name the two best-known educational micro-controllers and what the Micro:bit is made of",
    "Use the push buttons A and B as an input control in a MakeCode script",
    "Predict what a three-event script displays before and after a button is pressed",
  ],
  skillIds: ["pc-microbit", "prog-blocks", "sys-io"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "CircuitBoard",
  status: "published",
  teacherGuide: {
    overview:
      "This is where the chapter turns practical. The definition is one sentence — a micro-controller links input devices to output devices — and everything else follows from it. Give students physical Micro:bits early; the count of buttons, LEDs and sensors should come from their own hands, not from the page.",
    tips: [
      "Return to Lesson 1's water pump / motor / temperature sensor question now. The micro-controller is the answer they were missing.",
      "Hand out the boards before you teach: ask each pair to find the 2 push buttons, count the 25 LEDs and locate the sensors.",
      "The book asks students to name daily objects controlled by push buttons — lift, microwave, remote control, doorbell. Take answers from the room.",
      "In MakeCode, `on start` runs once at launch and `on button A pressed` runs each time the button is pressed. Say it out loud; students expect programs to run top to bottom.",
    ],
    answersNote:
      "Book script questions: at launch the `on start` block runs and its icon appears; pressing A shows the icon inside `on button A pressed`; pressing B shows the icon inside `on button B pressed`.",
  },
  stages: [
    {
      id: "g6-mb-03-discover",
      kind: "discover",
      title: "Who Is the Brain?",
      blocks: [
        {
          id: "mb3-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "In Lesson 2 you listed the four elements of a smart object. Three of them you already knew: sensors, a screen, a WIFI connection.\n\nThe fourth one was new — **the brain**. Today you hold it in your hand.",
        },
        {
          id: "mb3-d2",
          type: "activity",
          activity: {
            id: "mb3-d-poll",
            kind: "mcq",
            prompt:
              "A washing machine senses the water temperature and then decides to start heating. Which part of it makes that decision?",
            options: [
              { id: "a", text: "The temperature sensor" },
              { id: "b", text: "The heating element" },
              { id: "c", text: "A micro-controller inside the machine" },
              { id: "d", text: "The door" },
            ],
            answerId: "c",
            hints: [
              "The sensor only reads. The heater only heats. Something has to connect one to the other.",
            ],
            explanation:
              "A **micro-controller** sits between them. Micro-controllers are found everywhere: in the car, in the washing machine, in the fridge, in the air conditioner, in a robot.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "g6-mb-03-learn",
      kind: "learn",
      title: "The Micro-controller, the Micro:bit and Its Buttons",
      blocks: [
        { id: "mb3-l1", type: "heading", text: "The micro-controller" },
        {
          id: "mb3-l2",
          type: "definition",
          term: "Micro-controller",
          definition:
            "An electronic board that links input devices to output devices.",
          example:
            "A board that reads a temperature sensor and switches on a fan.",
        },
        {
          id: "mb3-l3",
          type: "text",
          md: "By linking those three components — **input devices**, a **micro-controller** and **output devices** — you obtain a **smart object**.",
        },
        {
          id: "mb3-l4",
          type: "flow",
          steps: [
            {
              id: "mb3-f1",
              label: "Input device",
              detail: "A push button, a sensor — it sends data in",
            },
            {
              id: "mb3-f2",
              label: "Micro-controller",
              detail: "The electronic board that links the input to the output",
            },
            {
              id: "mb3-f3",
              label: "Output device",
              detail: "A screen, a motor, a speaker — it acts on the world",
            },
            {
              id: "mb3-f4",
              label: "= A smart object",
              detail: "Link the three and the object becomes smart",
            },
          ],
        },
        {
          id: "mb3-l5",
          type: "callout",
          variant: "fact",
          title: "They are already all around you",
          md: "Micro-controllers are found everywhere: in the **car**, in the **washing machine**, in the **fridge**, in the **air conditioner**, in a **robot**, and in dozens of objects you touch every day without noticing.",
        },
        { id: "mb3-l6", type: "heading", text: "Educational micro-controllers" },
        {
          id: "mb3-l7",
          type: "text",
          md: "Educational companies created micro-controllers to be used at schools, in order to teach students the concept of smart objects and IOT.\n\nThe most well-known micro-controllers in education are the **Micro:bit** and the **Arduino**.",
        },
        {
          id: "mb3-l8",
          type: "tabs",
          tabs: [
            {
              id: "mb3-tab-mb",
              label: "Micro:bit — for beginners",
              blocks: [
                {
                  id: "mb3-tab-mb-b",
                  type: "text",
                  md: "The Micro:bit is made of:\n\n- **2 push buttons**\n- **A screen with 25 LEDs**\n- **3 sensors**\n\nThose components let you create projects with a Micro:bit in an easy way.",
                },
              ],
            },
            {
              id: "mb3-tab-ar",
              label: "Arduino — for advanced users",
              blocks: [
                {
                  id: "mb3-tab-ar-b",
                  type: "text",
                  md: "The Arduino micro-controller is used by advanced users to create various projects like:\n\n- **Irrigation of plants** when soil humidity is low\n- A **traffic light management system**\n- A **warning when objects in movement are detected**",
                },
              ],
            },
          ],
        },
        {
          id: "mb3-l9",
          type: "callout",
          variant: "info",
          title: "Remember the school garden?",
          md: "\"Irrigation of plants when soil humidity is low\" is the water pump problem from Lesson 1 — already solved, by a micro-controller. Rami was right.",
        },
        {
          id: "mb3-l10",
          type: "heading",
          text: "The push buttons to control an action",
        },
        {
          id: "mb3-l11",
          type: "text",
          md: "The Micro:bit is controlled by **2 push buttons**: **push button A** and **push button B**.\n\nA push button is an **input device**: pressing it sends data into the micro-controller, which then decides what the output should do.",
        },
        {
          id: "mb3-l12",
          type: "reflection",
          prompt:
            "In your daily life, name objects you use that are controlled by push buttons.",
          placeholder: "The lift, the… , the… , the…",
        },
        {
          id: "mb3-l13",
          type: "heading",
          text: "A project to understand more",
        },
        {
          id: "mb3-l14",
          type: "text",
          md: "Here is a script built with three event blocks — the same shape as the one printed in your book. Read it before you answer anything.",
        },
        {
          id: "mb3-l15",
          type: "code",
          language: "makecode",
          code: `on start
    show icon [Heart]

on button A pressed
    show icon [Happy]

on button B pressed
    show icon [Sad]`,
          caption:
            "Three event blocks. Each one waits for its own event before it runs.",
        },
        {
          id: "mb3-l16",
          type: "flow",
          steps: [
            {
              id: "mb3-g1",
              label: "The script runs",
              detail: "`on start` executes once — the Heart appears",
            },
            {
              id: "mb3-g2",
              label: "Nothing pressed",
              detail: "The Heart stays on the screen — no other event has happened",
            },
            {
              id: "mb3-g3",
              label: "Button A pressed",
              branch: "input A",
              detail: "The blocks inside `on button A pressed` run — the Happy icon appears",
            },
            {
              id: "mb3-g4",
              label: "Button B pressed",
              branch: "input B",
              detail: "The blocks inside `on button B pressed` run — the Sad icon appears",
            },
          ],
        },
        {
          id: "mb3-l17",
          type: "teacherNote",
          md: "Students read code top to bottom and expect all three icons to flash by in order. They will not: an **event block** only runs when its event happens. Demonstrate on a real board — run it, wait, press A, wait, press B. The pause between presses is what teaches the concept.",
        },
      ],
    },
    {
      id: "g6-mb-03-tryit",
      kind: "tryit",
      title: "Read the Script",
      blocks: [
        {
          id: "mb3-t0",
          type: "text",
          md: "The four questions your book asks about the script above. Scroll up whenever you need to look again.",
        },
        {
          id: "mb3-t1",
          type: "activity",
          activity: {
            id: "mb3-try-mcq",
            kind: "mcq",
            prompt: "What happens **the moment you run** the script?",
            options: [
              { id: "a", text: "Nothing at all until a button is pressed" },
              { id: "b", text: "The `on start` block runs and the Heart appears" },
              { id: "c", text: "All three icons appear one after the other" },
              { id: "d", text: "The Happy icon appears" },
            ],
            answerId: "b",
            skillIds: ["pc-microbit", "prog-blocks"],
            hints: [
              "Which of the three blocks does not wait for a button?",
              "`on start` means: run this once, the moment the program starts.",
            ],
            explanation:
              "`on start` is the only block whose event is \"the program started\". It runs once and shows the Heart. The other two blocks wait.",
          },
        },
        {
          id: "mb3-t2",
          type: "activity",
          activity: {
            id: "mb3-try-match",
            kind: "match",
            prompt: "Match each situation to the shape the LEDs will show.",
            pairs: [
              { id: "mb3-mp1", left: "No buttons are pressed", right: "Heart" },
              { id: "mb3-mp2", left: "Button A is pressed", right: "Happy" },
              { id: "mb3-mp3", left: "Button B is pressed", right: "Sad" },
            ],
            skillIds: ["pc-microbit", "prog-blocks"],
            hints: [
              "Find the block whose event matches each situation, then read the block inside it.",
            ],
            explanation:
              "Each event block owns the blocks placed inside it. Press A and only the contents of `on button A pressed` run.",
          },
        },
        {
          id: "mb3-t3",
          type: "activity",
          activity: {
            id: "mb3-try-tf",
            kind: "truefalse",
            prompt:
              "A push button on the Micro:bit is an output device, because it makes the LEDs light up.",
            answer: false,
            skillIds: ["sys-io", "pc-microbit"],
            hints: [
              "Which direction does the data travel — into the board, or out of it?",
            ],
            explanation:
              "The push button is an **input** device: your finger sends data in. The LED screen is the output. The micro-controller is what links one to the other.",
          },
        },
      ],
    },
    {
      id: "g6-mb-03-challenge",
      kind: "challenge",
      title: "Plan the Project",
      blocks: [
        {
          id: "mb3-c0",
          type: "text",
          md: "Your book gives you three requirements for a new script. Before you build it in MakeCode, decide **which event block** each requirement belongs in.",
        },
        {
          id: "mb3-c1",
          type: "challenge",
          challenge: {
            id: "mb3-challenge",
            title: "Three Requirements, Three Blocks",
            brief:
              "Reproduce a musical note if the button A is pressed · Display \"1\" if the button B is pressed · Display \"2\" if no buttons are pressed.",
            activity: {
              id: "mb3-ch-match",
              kind: "match",
              prompt:
                "Match each requirement of the project to the event block it must go inside.",
              pairs: [
                {
                  id: "mb3-cm1",
                  left: "Reproduce a musical note",
                  right: "on button A pressed",
                },
                {
                  id: "mb3-cm2",
                  left: "Display \"1\"",
                  right: "on button B pressed",
                },
                {
                  id: "mb3-cm3",
                  left: "Display \"2\" while no button is pressed",
                  right: "on start",
                },
              ],
              skillIds: ["pc-microbit", "prog-blocks", "ps-strategy"],
              hints: [
                "Two of the requirements name their button out loud.",
                "\"No buttons pressed\" is the state the board is already in when the script begins.",
              ],
              explanation:
                "A requirement that names a button belongs inside that button's event block. The one that describes the resting state belongs where the program begins.",
            },
            xp: 30,
          },
        },
        {
          id: "mb3-c2",
          type: "teacherNote",
          md: "Students who finish early will notice that after pressing A or B the \"2\" never comes back. That is a genuinely good observation — invite them to solve it and to explain their solution to the class. Do not hand it to them.",
        },
      ],
    },
    {
      id: "g6-mb-03-checkpoint",
      kind: "checkpoint",
      title: "Micro-controller Checkpoint",
      blocks: [
        {
          id: "mb3-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "mb3-q1",
              kind: "fillblank",
              prompt: "Define a micro-controller.",
              template:
                "A micro-controller is an electronic [[b1]] that links [[b2]] devices to [[b3]] devices.",
              blanks: {
                b1: ["board"],
                b2: ["input"],
                b3: ["output"],
              },
              bank: ["board", "input", "output", "screen"],
              skillIds: ["pc-microbit", "sys-io"],
              explanation:
                "That single sentence is the definition to memorise — everything in this chapter is an example of it.",
            },
            {
              id: "mb3-q2",
              kind: "multi",
              prompt: "Where do we find micro-controllers? Tick all that apply.",
              options: [
                { id: "a", text: "In the car" },
                { id: "b", text: "In the washing machine" },
                { id: "c", text: "In the fridge" },
                { id: "d", text: "In the air conditioner" },
                { id: "e", text: "In a robot" },
              ],
              answerIds: ["a", "b", "c", "d", "e"],
              skillIds: ["pc-microbit"],
              explanation:
                "All of them. Micro-controllers are found everywhere — most of the machines around you contain at least one.",
            },
            {
              id: "mb3-q3",
              kind: "mcq",
              prompt: "How many LEDs are on the Micro:bit screen?",
              options: [
                { id: "a", text: "5" },
                { id: "b", text: "20" },
                { id: "c", text: "25" },
                { id: "d", text: "100" },
              ],
              answerId: "c",
              skillIds: ["pc-microbit"],
              explanation:
                "The Micro:bit has a screen with **25 LEDs**, arranged in 5 rows of 5.",
            },
            {
              id: "mb3-q4",
              kind: "mcq",
              prompt:
                "How many push buttons and how many sensors is the Micro:bit made of?",
              options: [
                { id: "a", text: "2 push buttons and 3 sensors" },
                { id: "b", text: "3 push buttons and 2 sensors" },
                { id: "c", text: "1 push button and 5 sensors" },
                { id: "d", text: "2 push buttons and 25 sensors" },
              ],
              answerId: "a",
              skillIds: ["pc-microbit"],
              explanation:
                "The Micro:bit is made of 2 push buttons (A and B), a screen with 25 LEDs, and 3 sensors.",
            },
            {
              id: "mb3-q5",
              kind: "mcq",
              prompt:
                "Which two micro-controllers are the most well known in education?",
              options: [
                { id: "a", text: "Micro:bit and Arduino" },
                { id: "b", text: "Windows and Linux" },
                { id: "c", text: "Cisco and Intel" },
                { id: "d", text: "AnyDesk and Dropbox" },
              ],
              answerId: "a",
              skillIds: ["pc-microbit"],
              explanation:
                "Micro:bit for beginners, Arduino for more advanced projects — both created so schools can teach smart objects and IOT.",
            },
            {
              id: "mb3-q6",
              kind: "truefalse",
              prompt:
                "The blocks inside `on button A pressed` run the moment the script is launched.",
              answer: false,
              skillIds: ["prog-blocks"],
              explanation:
                "They run only when button A is actually pressed. `on start` is the block that runs at launch.",
            },
          ],
        },
        {
          id: "mb3-q7",
          type: "teacherNote",
          md: "The printed evaluation sheet also asks students to *name* the three sensors of the Micro:bit. That naming is not taught in this lesson's text — have students find the three sensors on the physical board (or in the MakeCode block categories) and write the names in their book before moving on.",
        },
      ],
    },
    {
      id: "g6-mb-03-create",
      kind: "create",
      title: "Build It in MakeCode",
      blocks: [
        {
          id: "mb3-p1",
          type: "project",
          project: {
            id: "mb3-project",
            title: "My First Push-Button Script",
            brief:
              "Launch the software MakeCode and build the script your book asks for. Test it in the simulator, then send it to a real Micro:bit if you have one.",
            deliverables: [
              "Reproduce a musical note if the button A is pressed",
              "Display \"1\" if the button B is pressed",
              "Display \"2\" if no buttons are pressed",
              "Take a screenshot of your finished blocks, or share the MakeCode link",
            ],
            submitTypes: ["image", "link", "text"],
            rubric: [
              {
                criterion: "Correct event blocks",
                description:
                  "Each action sits inside the right event block — A, B, and the start of the program",
              },
              {
                criterion: "It works",
                description:
                  "The script behaves as described when tested in the simulator or on the board",
              },
              {
                criterion: "Neat script",
                description:
                  "Blocks are tidy, nothing is left floating unused on the workspace",
              },
            ],
            xp: 45,
          },
        },
        {
          id: "mb3-r1",
          type: "reflection",
          prompt:
            "You now know what a micro-controller does. Pick one object in your home and describe the input, the micro-controller and the output hiding inside it.",
          placeholder: "Inside our microwave, the input is… the output is…",
        },
      ],
    },
  ],
};
