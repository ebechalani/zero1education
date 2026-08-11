import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Unit "MakeCode for micro:bit" · Lesson 9 of the printed 2023 chapter.
 * Book objectives: "Displaying visual warnings" and "Using the push buttons to
 * control the reading of the sensors". Ends on the 3 ZIP LED challenge.
 */
export const lessonMb09: Lesson = {
  id: "g6-mb-09",
  slug: "visual-warnings",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 9,
  title: "Displaying Visual Warnings",
  tagline: "Press a button, ask the room a question",
  description:
    "A sensor that shouts non-stop is useless. Use buttons A and B to ask for a reading exactly when you want it, count how often you asked, and turn the station's ZIP LEDs red when the room gets too hot.",
  objectives: [
    "Displaying visual warnings",
    "Using the push buttons to control the reading of the sensors",
    "Use buttons A and B to launch the reading of a sensor on the Air Quality Station",
    "Create one counting variable per button (a for A, b for B) and initialize them in on start",
    "Display both counters when A and B are pressed together",
    "Identify the 3 ZIP LEDs on the board and turn them red above 30 degrees, green below 30",
  ],
  skillIds: ["pc-microbit", "algo-selection", "prog-blocks", "data-analysis"],
  estimatedMinutes: 50,
  difficulty: "core",
  icon: "TriangleAlert",
  status: "published",
  teacherGuide: {
    overview:
      "Lesson 8 read a sensor forever; this lesson makes the reading happen on demand and adds a visual warning. It also quietly revisits variables — this time as counters, one per button, which is the clearest possible reason why a variable can hold only one value.",
    tips: [
      "Ask before you build: why not use one variable for both buttons? Let the class reason it out — a variable can't hold two values at once.",
      "The A+B event is a genuine surprise for students; show them it exists before they invent a workaround.",
      "For the ZIP LED challenge, have students point at the 3 ZIP LEDs on the physical board first. Naming hardware you can touch beats a diagram.",
      "The 30-degree boundary from Lesson 8 comes back here. Ask what colour the LEDs show at exactly 30.",
    ],
    answersNote:
      "Counters: a counts presses of button A, b counts presses of button B; both are set to 0 in on start and raised with 'change by 1'. Pressing A+B displays a then b.",
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "Stop Shouting, Start Answering",
      blocks: [
        {
          id: "mb09-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Your temperature monitor from last mission works — a little too well. It scrolls a number across the screen every second, all day long, whether anyone is watching or not.\n\nWhat you actually want is a station that stays quiet until you **ask** it something. Luckily, the micro:bit already has two ways to be asked.",
        },
        {
          id: "mb09-d2",
          type: "activity",
          activity: {
            id: "mb09-d-poll",
            kind: "mcq",
            prompt:
              "Which part of the micro:bit lets you ask for a reading at the exact moment you want it?",
            options: [
              { id: "a", text: "The 25 LEDs" },
              { id: "b", text: "The 2 push buttons, A and B" },
              { id: "c", text: "The USB cable" },
              { id: "d", text: "The pause block" },
            ],
            answerId: "b",
            hints: [
              "Back in Lesson 3 you listed what the micro:bit is made of.",
            ],
            explanation:
              "The micro:bit has **2 push buttons**, A and B. They are input devices, and from Lesson 3 you already know how to react to them.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Reading Values on Demand",
      blocks: [
        { id: "mb09-l1", type: "heading", text: "Two boards, one program" },
        {
          id: "mb09-l2",
          type: "text",
          md: "Since the micro:bit is plugged into the Air Quality station, it is easy to program them together in order to **transmit data and commands from one unit to another**. The buttons live on the micro:bit; the sensors live on the station; one script commands both.",
        },
        { id: "mb09-l3", type: "heading", text: "Which data to read?" },
        {
          id: "mb09-l4",
          type: "text",
          md: "The project is controlled by the push buttons A and B as follows:\n\n1. If the **button A** is pressed, the reading of the sensor is displayed on the micro:bit's screen and the variable **a** is incremented by 1.\n2. If the **button B** is pressed, the reading of the sensor is displayed on the micro:bit's screen and the variable **b** is incremented by 1.\n3. If the buttons **A+B** are pressed, the values of the two variables are displayed on the micro:bit's screen, to show how many times the reading was done.\n\nThe book then asks you to complete the mission so that the two buttons control the display of the **temperature** and the **humidity** — one measurement per button.",
        },
        { id: "mb09-l5", type: "heading", text: "Setting up the variable to count" },
        {
          id: "mb09-l6",
          type: "definition",
          term: "Variable",
          definition:
            "A location in the micro:bit's memory to store data. A variable has two characteristics: the variable name and the variable content.",
          example: 'The variable named "a" holding the number 4.',
        },
        {
          id: "mb09-l7",
          type: "callout",
          variant: "warning",
          title: "Why two variables and not one?",
          md: "A variable **can't hold more than one value at the same time**; that's why a variable should be created for each button.\n\nCreate a variable named **a** for button A, and a variable named **b** for button B.",
        },
        {
          id: "mb09-l8",
          type: "flow",
          steps: [
            {
              id: "mb09-f1",
              label: "Click on Variables",
              detail: "In the MakeCode block list.",
            },
            {
              id: "mb09-f2",
              label: "Click on Make a Variable",
              detail: "Do this twice — once per button.",
            },
            { id: "mb09-f3", label: 'Name the first one "a"', detail: "For button A." },
            { id: "mb09-f4", label: 'Name the second one "b"', detail: "For button B." },
            {
              id: "mb09-f5",
              label: "Set both to 0 in on start",
              detail: "Every counter starts from zero.",
            },
          ],
        },
        {
          id: "mb09-l9",
          type: "code",
          language: "blocks",
          caption:
            "The full script: the sensors wake up once, then nothing happens until a button is pressed.",
          code: `on start
    [Air Quality]  setup all sensors
    set a to 0
    set b to 0

on button A pressed
    show number   [Air Quality] humidity (%)
    change a by 1

on button B pressed
    show number   [Air Quality] temperature (°C)
    change b by 1

on button A+B pressed
    show number   a
    show number   b`,
        },
        {
          id: "mb09-l10",
          type: "text",
          md: "By pressing the two buttons **A & B** together, the values of the variables `a` and `b` are displayed to show how many times each button was pressed — a record of how many readings you asked for.",
        },
        {
          id: "mb09-l11",
          type: "teacherNote",
          md: "Two things to flag:\n\n1. **Which button reads what.** The printed spec names the humidity for the button events, and step 8 then asks students to control the display of *both* the temperature and the humidity with the two buttons. Settle it in class — one measurement per button — and let students write their choice into their copybook before building.\n2. **`set` versus `change`.** `set a to 0` puts a value in; `change a by 1` adds to what is already there. A student who uses `set a to 1` inside the button event will count every press as 1 forever. It is a beautiful, findable bug — let them find it.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Counting Presses",
      blocks: [
        {
          id: "mb09-t1",
          type: "activity",
          activity: {
            id: "mb09-try-match",
            kind: "match",
            prompt: "Match each event to what the script does.",
            pairs: [
              {
                id: "m1",
                left: "on button A pressed",
                right: "Show a sensor reading and add 1 to the variable a",
              },
              {
                id: "m2",
                left: "on button B pressed",
                right: "Show a sensor reading and add 1 to the variable b",
              },
              {
                id: "m3",
                left: "on button A+B pressed",
                right: "Show how many times each button was pressed",
              },
              {
                id: "m4",
                left: "on start",
                right: "Activate the sensors and set both counters to 0",
              },
            ],
            skillIds: ["prog-blocks", "algo-selection"],
            explanation:
              "Each event block waits for its own signal. Nothing runs until the micro:bit is asked.",
          },
        },
        {
          id: "mb09-t2",
          type: "activity",
          activity: {
            id: "mb09-try-fill",
            kind: "fillblank",
            prompt: "Complete the rule from the book.",
            template:
              "A variable can't hold more than [[n]] value at the same time; that's why a variable should be created for each [[w]].",
            blanks: {
              n: ["one", "1"],
              w: ["button", "push button"],
            },
            skillIds: ["prog-blocks"],
            hints: ["If a held both counts, which one would you read back?"],
            explanation:
              "One box, one value. Two buttons to count means two boxes: **a** and **b**.",
          },
        },
        {
          id: "mb09-t3",
          type: "activity",
          activity: {
            id: "mb09-try-mcq",
            kind: "mcq",
            prompt:
              "During the lesson you press **A** three times and **B** once. Then you press **A+B**. What does the screen show?",
            options: [
              { id: "a", text: "4" },
              { id: "b", text: "3 then 1" },
              { id: "c", text: "1 then 3" },
              { id: "d", text: "0 then 0" },
            ],
            answerId: "b",
            skillIds: ["prog-blocks", "data-analysis"],
            hints: [
              "The variable a counts presses of A. The variable b counts presses of B.",
              "The A+B event shows a first, then b.",
            ],
            explanation:
              "`a` reached 3 and `b` reached 1, so the screen shows **3 then 1**. The counters never mix, because each button owns its own variable.",
          },
        },
        {
          id: "mb09-t4",
          type: "activity",
          activity: {
            id: "mb09-try-tf",
            kind: "truefalse",
            prompt:
              "The blocks `set a to 0` and `set b to 0` belong inside the `on start` block.",
            answer: true,
            skillIds: ["prog-blocks"],
            hints: ["A counter must begin at a known value, and only once."],
            explanation:
              "`on start` runs a single time when the board powers up — exactly right for initializing counters. Put them in a button event and the count would reset on every press.",
          },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "The 3 ZIP LEDs",
      blocks: [
        {
          id: "mb09-c0",
          type: "text",
          md: "**Examine the Air Quality Station board to identify the 3 ZIP LEDs.**\n\nNow create the mission: turn the LEDs **red** in case the temperature is higher than 30 degrees, and turn them to **green** in case it is less than 30 degrees. A number on a screen is information; a red glow across the room is a warning.",
        },
        {
          id: "mb09-c1",
          type: "code",
          language: "blocks",
          caption:
            "A visual warning: the same two conditions as Lesson 8, but the answer is a colour instead of a word.",
          code: `on start
    [Air Quality]  setup all sensors

forever
    set temp to  [Air Quality] temperature (°C)

    if   temp > 30   then
        set the 3 ZIP LEDs to  RED

    if   temp < 30   then
        set the 3 ZIP LEDs to  GREEN

    pause  1000 (ms)`,
        },
        {
          id: "mb09-c2",
          type: "challenge",
          challenge: {
            id: "mb09-challenge",
            title: "The Reading Nobody Planned For",
            brief:
              "Your warning script is running. The room settles at exactly 30 degrees. Think carefully before you answer — this is the same trap as last mission, wearing a different colour.",
            activity: {
              id: "mb09-ch-1",
              kind: "mcq",
              prompt:
                "Your script uses `if temperature > 30 → red` and `if temperature < 30 → green`. The station reads **exactly 30 °C**. What happens to the 3 ZIP LEDs?",
              options: [
                { id: "a", text: "They turn red" },
                { id: "b", text: "They turn green" },
                {
                  id: "c",
                  text: "They keep the colour they already had — neither condition is true",
                },
                { id: "d", text: "They switch off" },
              ],
              answerId: "c",
              skillIds: ["algo-selection", "ps-strategy"],
              hints: [
                "Is 30 greater than 30? Is 30 less than 30?",
                "If no `if` block runs, no block changes the colour. So what changes it?",
              ],
              explanation:
                "Both conditions are false, so **neither** block runs and nothing tells the LEDs to change — they simply stay as they were. Fix it by using *greater than or equal to* in one condition, or add an `else`. A warning system that goes silent at the exact edge is the kind of bug engineers lose sleep over.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Warnings Checkpoint",
      blocks: [
        {
          id: "mb09-q0",
          type: "quiz",
          title: "Prove you can warn the room",
          passPct: 70,
          questions: [
            {
              id: "mb09-q1",
              kind: "mcq",
              prompt:
                "Why does the project need two variables instead of one?",
              options: [
                {
                  id: "a",
                  text: "Because a variable can't hold more than one value at the same time",
                },
                { id: "b", text: "Because MakeCode always requires two variables" },
                { id: "c", text: "Because the micro:bit has two screens" },
                { id: "d", text: "Because one variable would run out of memory" },
              ],
              answerId: "a",
              skillIds: ["prog-blocks"],
              explanation:
                "One variable, one value. Counting two buttons means creating a variable for each button.",
            },
            {
              id: "mb09-q2",
              kind: "multi",
              prompt:
                "What are the two characteristics of a variable? **Select both.**",
              options: [
                { id: "a", text: "The variable name" },
                { id: "b", text: "The variable content" },
                { id: "c", text: "The variable colour" },
                { id: "d", text: "The variable address on the screen" },
              ],
              answerIds: ["a", "b"],
              skillIds: ["prog-blocks"],
              explanation:
                "A variable has a name and it has content. The name never changes; the content can change at any moment in the script.",
            },
            {
              id: "mb09-q3",
              kind: "mcq",
              prompt: "What does the block `change a by 1` do?",
              options: [
                { id: "a", text: "It replaces the value of a with 1" },
                { id: "b", text: "It adds 1 to the value already stored in a" },
                { id: "c", text: "It creates a new variable called a" },
                { id: "d", text: "It displays the value of a on the screen" },
              ],
              answerId: "b",
              skillIds: ["prog-blocks"],
              explanation:
                "`change` adds to what is already there; `set` throws the old value away. A counter needs `change`.",
            },
            {
              id: "mb09-q4",
              kind: "truefalse",
              prompt:
                "Pressing buttons A and B together displays how many times each button was used.",
              answer: true,
              skillIds: ["pc-microbit", "data-analysis"],
              explanation:
                "The A+B event shows the values of the two variables — a record of how many readings were done.",
            },
            {
              id: "mb09-q5",
              kind: "mcq",
              prompt:
                "In the ZIP LED challenge, the station reads **34 °C**. What colour should the 3 ZIP LEDs show?",
              options: [
                { id: "a", text: "Green" },
                { id: "b", text: "Red" },
                { id: "c", text: "No colour" },
                { id: "d", text: "They flash both colours" },
              ],
              answerId: "b",
              skillIds: ["algo-selection"],
              explanation:
                "34 is higher than 30, so the warning condition is true: **red**.",
            },
            {
              id: "mb09-q6",
              kind: "fillblank",
              prompt: "Complete the sentence about the counters.",
              template:
                "Both counting variables are set to [[z]] inside the [[b]] block, and raised with the block change … by [[n]].",
              blanks: {
                z: ["0", "zero"],
                b: ["on start", "onstart", "on-start"],
                n: ["1", "one"],
              },
              skillIds: ["prog-blocks"],
              explanation:
                "Start at 0 once, then add 1 on every press. That is how every counter in every program works.",
            },
          ],
        },
        {
          id: "mb09-q7",
          type: "reflection",
          prompt:
            "The station can now warn with a word and with a colour. Which warning would people in your classroom actually notice, and why?",
          placeholder: "I think the colour works better because…",
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Project — The Visual Warning Station",
      blocks: [
        {
          id: "mb09-p1",
          type: "project",
          project: {
            id: "mb09-project",
            title: "Sensors on Demand, Warnings on Sight",
            brief:
              "Finish the mission of this lesson on real hardware: two buttons that fetch two different measurements, two counters that remember how often you asked, and 3 ZIP LEDs that turn the room's temperature into a colour anyone can read from across the room.",
            deliverables: [
              "Button A displays one measurement and increases the variable a by 1",
              "Button B displays the other measurement and increases the variable b by 1",
              "Buttons A+B display both counters",
              "The 3 ZIP LEDs turn red above 30 degrees and green below 30",
              "A short note saying which measurement you gave to each button, and what your script does at exactly 30",
            ],
            submitTypes: ["code", "image", "text"],
            rubric: [
              {
                criterion: "Readings on demand",
                description:
                  "Nothing is displayed until a button is pressed; each button reads its own sensor value.",
              },
              {
                criterion: "Correct counters",
                description:
                  "Both variables start at 0 in on start and rise by 1 per press; A+B shows both.",
              },
              {
                criterion: "Visual warning",
                description:
                  "The 3 ZIP LEDs change colour at the right temperatures.",
              },
              {
                criterion: "Boundary handled",
                description:
                  "The student can say what happens at exactly 30 degrees and has made a decision about it.",
              },
            ],
            xp: 50,
          },
        },
        {
          id: "mb09-r1",
          type: "reflection",
          prompt:
            "You have now built a device with sensors, a brain and an output. Which element from Lesson 2 is still missing before you could call it a true smart object?",
          placeholder: "It still needs…",
        },
      ],
    },
  ],
};
