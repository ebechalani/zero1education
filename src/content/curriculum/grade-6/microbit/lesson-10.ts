import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Unit "MakeCode for micro:bit" · Lesson 10 of the printed 2023 chapter.
 * Book: the end-of-chapter "Evaluation sheet" — the recall questions plus the
 * "Flashing leds — describe the result" script reading.
 */
export const lessonMb10: Lesson = {
  id: "g6-mb-10",
  slug: "evaluation",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 10,
  title: "Evaluation Sheet",
  tagline: "Test your knowledge of the whole chapter",
  description:
    "The end-of-chapter evaluation. Answer the questions of the printed sheet — hardware, micro-controllers, smart objects, the micro:bit itself — then read a script and describe exactly what it does.",
  objectives: [
    "Evaluate what you have learned across the whole micro:bit chapter",
    "Recall examples of input devices and output devices",
    "Define a micro-controller and say where micro-controllers are found",
    "Define a smart object and name the elements it is built from",
    "State how many LEDs, push buttons and sensors the micro:bit has",
    "Describe the result of a flashing-LEDs script before running it",
  ],
  skillIds: [
    "pc-microbit",
    "sys-hardware",
    "sys-io",
    "prog-blocks",
    "algo-iteration",
  ],
  estimatedMinutes: 40,
  difficulty: "core",
  icon: "ClipboardCheck",
  status: "published",
  teacherGuide: {
    overview:
      "This is the book's printed evaluation sheet, delivered as a graded checkpoint at 70%. Let students use the revision panel first — the point is mastery, not ambush. The last question is the one that really separates understanding from memorization: reading a loop and predicting its behaviour without a board.",
    tips: [
      "Run the revision accordion as a five-minute silent read before you unlock the checkpoint.",
      'For "Name the sensors we have on the micro:bit", have students check the physical board and the MakeCode Input category — then compare answers as a class.',
      "The script question rewards students who trace loops on paper. Give a blank 5 × 5 grid to anyone who is stuck.",
      "Anyone below 70% should redo Lessons 6 and 7 rather than reread the sheet — the misses are almost always about loops and addresses.",
    ],
    answersNote:
      "Output devices: screen, printer, speaker. Input devices: microphone, digital camera, keyboard, scanner. Micro-controller: an electronic board that links input devices to output devices; found in the car, the washing machine, the fridge, the air conditioner, a robot. Smart object: sensors (input) + WIFI connection + screen (output) + micro-controller (the brain). micro:bit: 25 LEDs, 2 push buttons, 3 sensors. Flashing-LEDs script: the loop runs 5 times, lighting one LED per turn along the line at address 0, then a second loop switches them off in the same order, and the whole thing repeats.",
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "Before You Begin",
      blocks: [
        {
          id: "mb10-d1",
          type: "callout",
          variant: "info",
          title: "How this evaluation works",
          md: "These are the questions of the printed **evaluation sheet** at the end of the chapter. You need **70%** to pass the checkpoint.\n\nRevise first — the panel below has everything the sheet asks about, in the order you learned it.",
        },
        {
          id: "mb10-d2",
          type: "accordion",
          items: [
            {
              id: "mb10-rev1",
              title: "Lesson 1 — Hardware, input and output",
              blocks: [
                {
                  id: "mb10-rev1a",
                  type: "text",
                  md: "A computer system is formed of two parts: the **Hardware** and the **Software**. The hardware is classified in 3 categories: the **system unit**, the **input devices** and the **output devices**.\n\nThe system unit contains the Mother Board, the Random Access Memory (RAM), the Hard Disk and the Central Processing Unit (CPU).",
                },
                {
                  id: "mb10-rev1b",
                  type: "text",
                  md: "An **input device** transfers data **to** the system unit: a microphone records a voice, a digital camera captures a picture, a keyboard, a scanner.\n\nAn **output device** transfers data **from** the system unit: a screen displays a text, a printer prints, a speaker plays sound.",
                },
              ],
            },
            {
              id: "mb10-rev2",
              title: "Lesson 2 — Networks, IOT and smart objects",
              blocks: [
                {
                  id: "mb10-rev2a",
                  type: "text",
                  md: "A **computer network** is a group of computers connected together via cables, switches and routers in order to transfer and share information between the users. The biggest network on earth is the **Internet**.\n\n**IOT** — the Internet of Things — allows the user to control the electronic devices he is using. Devices designed this way are called **Smart Objects**.",
                },
                {
                  id: "mb10-rev2b",
                  type: "text",
                  md: "A smart object needs four things:\n\n1. A set of **sensors**, considered as input devices.\n2. An **Internet connection** to WIFI.\n3. A **screen** or any other device considered as an output device.\n4. A **micro-controller**, considered as the brain of the device.",
                },
              ],
            },
            {
              id: "mb10-rev3",
              title: "Lesson 3 — Micro-controllers and the micro:bit",
              blocks: [
                {
                  id: "mb10-rev3a",
                  type: "definition",
                  term: "Micro-controller",
                  definition:
                    "An electronic board that links input devices to output devices.",
                  example:
                    "Micro-controllers are found everywhere: in the car, in the washing machine, in the fridge, in the air conditioner, in a robot.",
                },
                {
                  id: "mb10-rev3b",
                  type: "text",
                  md: "The best known micro-controllers in education are the **micro:bit** and the **Arduino**.\n\nThe micro:bit is made of:\n\n- **2 push buttons**\n- **A screen with 25 LEDs**\n- **3 sensors**",
                },
              ],
            },
            {
              id: "mb10-rev4",
              title: "Lessons 4 & 5 — Variables",
              blocks: [
                {
                  id: "mb10-rev4a",
                  type: "text",
                  md: "A **variable** is a location in the memory of the computer used to store information. It is defined by a **name** and it holds **content**.\n\nConcepts to remember:\n\n- In a script, many variables can be used.\n- The name of the variable can't be changed.\n- The content of a variable can change at any time in the script.\n- A variable **can't hold more than one value at the same time** — so create one variable per player, per button, per counter.",
                },
              ],
            },
            {
              id: "mb10-rev5",
              title: "Lessons 6 & 7 — The LED matrix and loops",
              blocks: [
                {
                  id: "mb10-rev5a",
                  type: "text",
                  md: "A **matrix** is a series of dots arranged in rows and columns. Each dot has an **address (x, y)**: the x determines the number of the column, the y determines the number of the row.\n\nThe micro:bit screen is a matrix of **25 LEDs**, and each LED has a unique address. `plot x y` switches an LED on; `unplot x y` switches it off.",
                },
                {
                  id: "mb10-rev5b",
                  type: "text",
                  md: "Instead of writing every address by hand, a **variable** plus the **loop** block does the walking. `for index from 0 to 4` repeats the instructions **5** times, and each turn one more LED illuminates. An **embedded loop** with the variables `ledx` and `ledy` reaches all 25 LEDs.",
                },
              ],
            },
            {
              id: "mb10-rev6",
              title: "Lessons 8 & 9 — The Air Quality Station",
              blocks: [
                {
                  id: "mb10-rev6a",
                  type: "text",
                  md: "The **Kitronik Air Quality and Environmental Board** for micro:bit reads data like the **temperature** and the **humidity** in order to interact with the micro:bit board. Its main elements are a screen for messages and sensor values, and the sensors themselves.\n\nYou add it in MakeCode as an **extension**, and one **setup block** activates all the sensors on the board. Conditions then turn readings into warnings — a message, or the colour of the 3 ZIP LEDs.",
                },
              ],
            },
          ],
        },
        {
          id: "mb10-d3",
          type: "activity",
          activity: {
            id: "mb10-warmup",
            kind: "truefalse",
            prompt:
              "Warm-up: a micro-controller is an electronic board that links input devices to output devices.",
            answer: true,
            skillIds: ["sys-hardware", "pc-microbit"],
            hints: ["Think of what sits between a sensor and a screen."],
            explanation:
              "That is the definition from Lesson 3 — and it is why a micro-controller can turn an ordinary object into a smart one.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Chapter Evaluation",
      blocks: [
        { id: "mb10-c1", type: "heading", text: "Test your knowledge" },
        {
          id: "mb10-c2",
          type: "text",
          md: "Answer the following questions in order to evaluate the chapter of micro:bit.",
        },
        { id: "mb10-c3", type: "heading", text: "Flashing LEDs", level: 3 },
        {
          id: "mb10-c4",
          type: "text",
          md: "The last questions of the sheet ask you to **describe the result shown once this script is uploaded on the micro:bit**. Study it before you start — you may not run it.",
        },
        {
          id: "mb10-c5",
          type: "code",
          language: "blocks",
          caption: "The script from the evaluation sheet.",
          code: `on start
    set led to 0

forever
    for led from 0 to 4
        plot     x: led   y: 0
        pause    200 (ms)

    for led from 0 to 4
        unplot   x: led   y: 0
        pause    200 (ms)`,
        },
        {
          id: "mb10-q0",
          type: "quiz",
          title: "Chapter 1 Evaluation — micro:bit",
          passPct: 70,
          questions: [
            {
              id: "mb10-q1",
              kind: "multi",
              prompt:
                "Give 3 examples of **output devices**. Select the three output devices below.",
              options: [
                { id: "a", text: "Screen" },
                { id: "b", text: "Printer" },
                { id: "c", text: "Speaker" },
                { id: "d", text: "Keyboard" },
                { id: "e", text: "Microphone" },
                { id: "f", text: "Scanner" },
              ],
              answerIds: ["a", "b", "c"],
              skillIds: ["sys-io"],
              hints: [
                "An output device transfers data **from** the system unit to you.",
              ],
              explanation:
                "A screen displays a text or an image, a printer prints, a speaker plays sound. All three carry data **out** of the system unit.",
            },
            {
              id: "mb10-q2",
              kind: "multi",
              prompt:
                "Give 3 examples of **input devices**. Select the three input devices below.",
              options: [
                { id: "a", text: "Microphone" },
                { id: "b", text: "Keyboard" },
                { id: "c", text: "Scanner" },
                { id: "d", text: "Screen" },
                { id: "e", text: "Printer" },
                { id: "f", text: "Speaker" },
              ],
              answerIds: ["a", "b", "c"],
              skillIds: ["sys-io"],
              hints: [
                "An input device transfers data **to** the system unit.",
                "A microphone records a voice — where does that voice go?",
              ],
              explanation:
                "A microphone records a voice, a keyboard sends letters, a scanner sends an image. A digital camera is an input device too.",
            },
            {
              id: "mb10-q3",
              kind: "mcq",
              prompt: "Define a **micro-controller**.",
              options: [
                {
                  id: "a",
                  text: "An electronic board that links input devices to output devices",
                },
                { id: "b", text: "A location in memory used to store information" },
                { id: "c", text: "A group of computers connected by cables and routers" },
                { id: "d", text: "A series of dots arranged in rows and columns" },
              ],
              answerId: "a",
              skillIds: ["sys-hardware", "pc-microbit"],
              explanation:
                "Inputs on one side, outputs on the other, and the micro-controller in between deciding what happens. Link the three and you get a smart object.",
            },
            {
              id: "mb10-q4",
              kind: "mcq",
              prompt: "Where do we find micro-controllers?",
              options: [
                {
                  id: "a",
                  text: "Everywhere — in the car, the washing machine, the fridge, the air conditioner, a robot",
                },
                { id: "b", text: "Only inside desktop computers" },
                { id: "c", text: "Only in school laboratories" },
                { id: "d", text: "Only in devices connected to the Internet" },
              ],
              answerId: "a",
              skillIds: ["sys-hardware"],
              explanation:
                "They are already all around you. Most of the machines in your home are run by a micro-controller you have never seen.",
            },
            {
              id: "mb10-q5",
              kind: "mcq",
              prompt: "Define a **smart object**.",
              options: [
                {
                  id: "a",
                  text: "An electronic device that links sensors and outputs through a micro-controller and connects to the Internet, so the user can control it",
                },
                { id: "b", text: "Any device with a screen" },
                { id: "c", text: "A computer that is faster than the others on the network" },
                { id: "d", text: "A program made of blocks instead of text" },
              ],
              answerId: "a",
              skillIds: ["net-internet", "pc-microbit"],
              hints: ["Count the four elements a smart object needs."],
              explanation:
                "Sensors + WIFI + an output device + a micro-controller. That combination is what the companies behind **IOT** put inside ordinary objects.",
            },
            {
              id: "mb10-q6",
              kind: "match",
              prompt: "Match each element of a smart object to its role.",
              pairs: [
                { id: "m1", left: "A set of sensors", right: "The input devices" },
                {
                  id: "m2",
                  left: "A screen or similar device",
                  right: "The output device",
                },
                { id: "m3", left: "A micro-controller", right: "The brain of the device" },
                {
                  id: "m4",
                  left: "A WIFI connection",
                  right: "Links the object to the Internet",
                },
              ],
              skillIds: ["net-internet", "sys-io"],
              explanation:
                "Remove any one of the four and the object stops being smart: no senses, no voice, no brain, or no way to be reached.",
            },
            {
              id: "mb10-q7",
              kind: "fillblank",
              prompt: "Complete the description of the micro:bit board.",
              template:
                "The micro:bit has a screen of [[l]] LEDs, [[p]] push buttons and [[s]] sensors.",
              blanks: {
                l: ["25", "twenty-five", "twenty five"],
                p: ["2", "two"],
                s: ["3", "three"],
              },
              skillIds: ["pc-microbit", "sys-hardware"],
              hints: ["Look at the board in your hand and count what you can see."],
              explanation:
                "25 LEDs in a 5 × 5 matrix, 2 push buttons (A and B), and 3 sensors — the whole machine you have been programming for ten lessons.",
            },
            {
              id: "mb10-q8",
              kind: "mcq",
              prompt:
                "**Flashing LEDs.** Describe the result shown once the script above is uploaded on the micro:bit.",
              options: [
                {
                  id: "a",
                  text: "The LEDs of one line switch on one after another, then switch off in the same order, and it repeats forever",
                },
                { id: "b", text: "All 25 LEDs light up at once and stay on" },
                { id: "c", text: "One single LED blinks in the middle of the screen" },
                { id: "d", text: "Nothing happens, because the loop never runs" },
              ],
              answerId: "a",
              skillIds: ["algo-iteration", "pc-microbit", "prog-blocks"],
              hints: [
                "There are two loops. What does the first one do, and what does the second one undo?",
                "The `pause` block is there so your eye can follow the sweep.",
                "`forever` wraps both loops.",
              ],
              explanation:
                "The first loop plots the LEDs one by one along the line at address 0, pausing between each. The second loop unplots them in exactly the same order. `forever` then starts the whole thing again — a flashing line.",
            },
            {
              id: "mb10-q9",
              kind: "fillblank",
              prompt: "Complete the conclusion about that script.",
              template:
                "The for loop repeats the instructions [[n]] times, and each turn of the loop a [[w]] illuminates.",
              blanks: {
                n: ["5", "five"],
                w: ["led", "LED", "light"],
              },
              skillIds: ["algo-iteration"],
              hints: ["List the values the variable takes: 0, 1, 2, 3, 4."],
              explanation:
                '"from 0 to 4" is five values, so five turns — and every turn plots one more **led**.',
            },
          ],
        },
        {
          id: "mb10-c6",
          type: "reflection",
          prompt:
            "Open question from the sheet: **Name the sensors we have on the micro:bit.** Check the board itself and the Input category in MakeCode, then write the ones you find.",
          placeholder: "On the board I found…",
        },
        {
          id: "mb10-c7",
          type: "teacherNote",
          md: "The final reflection is deliberately not auto-graded. Have students find the sensors on the physical board and in the MakeCode **Input** category rather than accepting a memorized list — the chapter is about linking what a board *has* to what a script can *ask it*. Compare answers as a class and agree on the list together.",
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Chapter Project",
      blocks: [
        {
          id: "mb10-p0",
          type: "text",
          md: "The sheet closes the chapter. Your project opens it back up: take everything from these ten lessons and build one object that senses, decides and warns.",
        },
        {
          id: "mb10-p1",
          type: "project",
          project: {
            id: "mb10-project",
            title: "Build Your Smart Object",
            brief:
              "Combine the work of the whole chapter into a single device: the micro:bit plugged into the Kitronik Air Quality station, reading the room, deciding for itself, and warning the people around it — with words, with the LED matrix, and with colour.",
            deliverables: [
              "The setup block in on start that activates all the sensors on the board",
              "A reading on demand: buttons A and B each display one measurement and each raise their own counter",
              "A visual warning built with a condition — a message, the 3 ZIP LEDs in red or green, or both",
              "A pattern of your own on the 25-LED matrix, drawn with a loop rather than 25 separate blocks",
              "A short write-up naming the four elements of a smart object and saying which ones your device has",
            ],
            submitTypes: ["code", "image", "text"],
            rubric: [
              {
                criterion: "Sensing",
                description:
                  "The sensors are activated and real readings reach the script.",
              },
              {
                criterion: "Deciding",
                description:
                  "At least one condition turns a reading into a decision, and the boundary case is handled.",
              },
              {
                criterion: "Warning",
                description:
                  "The warning is visible from across the room, not just readable up close.",
              },
              {
                criterion: "Loops",
                description:
                  "The LED pattern uses a loop and a variable instead of repeated plot blocks.",
              },
              {
                criterion: "Explanation",
                description:
                  "The student can name the four elements of a smart object and locate them in their own build.",
              },
            ],
            xp: 60,
          },
        },
        {
          id: "mb10-r1",
          type: "reflection",
          prompt:
            "Ten lessons ago the micro:bit was a piece of plastic with lights. What can you make it do now that surprised you most?",
          placeholder: "The thing I did not expect was…",
        },
      ],
    },
  ],
};
