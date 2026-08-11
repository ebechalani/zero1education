import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Chapter 1 "MakeCode for Micro:bit" · Lesson 1
 * Book objectives: 1- Reviewing the skills learnt last year · 2- Evaluating sheet
 * Source: G6_2023_ch1_microbit.pdf, pp. 4–5.
 */
export const lessonMb01: Lesson = {
  id: "g6-mb-01",
  slug: "introduction-to-microcontrollers",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 1,
  title: "Introduction to Microcontrollers",
  tagline: "Everything you know about computers — about to control the real world",
  description:
    "Before we build smart objects, we rebuild the foundations: hardware and software, the three categories of hardware, the components of the system unit, and how data travels in and out of a computer.",
  objectives: [
    "Define hardware and software and give four examples of each",
    "Classify hardware into its three categories: the system unit, the input devices and the output devices",
    "Name the components of the system unit and match each one with its utility",
    "Explain how an input device transfers data to the system unit and an output device transfers data from it",
    "Decide which real devices — printer, water pump, motor, temperature sensor — can be linked to a computer",
  ],
  skillIds: ["sys-hardware", "sys-io", "sys-software"],
  estimatedMinutes: 45,
  difficulty: "intro",
  icon: "Cpu",
  labId: "computer",
  status: "published",
  teacherGuide: {
    overview:
      "This is the book's revision lesson — it re-activates last year's vocabulary so the micro-controller lessons that follow land on solid ground. Keep the pace brisk: most students will recognise the content, and the real payoff is the closing \"Find answers\" question, which sets up the whole chapter.",
    tips: [
      "Open with the objects in the room: ask which are hardware, which run software, which are input and which are output.",
      "The component/utility matching is the exact exercise printed on page 4 — let students attempt it before you teach it.",
      "Do not resolve the water pump / motor / temperature sensor question too quickly. Let the disagreement sit; Lesson 3 answers it with the micro-controller.",
      "If you have an old system unit, open it while the class works in the ZERO1 Computer Lab.",
    ],
    answersNote:
      "Book matching key — Mother Board: electronic circuit that links all the items together · RAM: when the computer is turned off, its content is lost · Hard Disk: saves data even when the computer is turned off · CPU: calculates and processes data.",
  },
  stages: [
    {
      id: "g6-mb-01-discover",
      kind: "discover",
      title: "Can a Computer Water a Plant?",
      blocks: [
        {
          id: "mb1-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "The school garden is dying. Nobody remembers to water it during the holidays.\n\nRami says: *\"Just plug a water pump into the computer.\"* Half the class laughs — a computer takes a keyboard and a mouse, not a **pump**.\n\nBy the end of this chapter you will know exactly who is right. But first, a quick check on what you already know.",
        },
        {
          id: "mb1-d2",
          type: "activity",
          activity: {
            id: "mb1-d-poll",
            kind: "mcq",
            prompt: "A computer system is formed of **two** parts. Which two?",
            options: [
              { id: "a", text: "The screen and the keyboard" },
              { id: "b", text: "The hardware and the software" },
              { id: "c", text: "The input and the output" },
              { id: "d", text: "The RAM and the CPU" },
            ],
            answerId: "b",
            hints: ["One part you can touch. The other part you can only run."],
            explanation:
              "A computer system is formed of two parts: the **hardware** and the **software**. Everything else in this lesson hangs off that one sentence.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "g6-mb-01-learn",
      kind: "learn",
      title: "Hardware, Software and the Path of Data",
      blocks: [
        { id: "mb1-l1", type: "heading", text: "The two parts of a computer system" },
        {
          id: "mb1-l2",
          type: "text",
          md: "A computer system is formed of two parts: the **hardware** and the **software**. Neither one is useful alone — the hardware is the body, the software is the set of instructions that body follows.",
        },
        {
          id: "mb1-l3",
          type: "definition",
          term: "Hardware",
          definition:
            "All the physical parts of a computer system — everything you can see and touch.",
          example: "Keyboard · screen · printer · hard disk",
        },
        {
          id: "mb1-l4",
          type: "definition",
          term: "Software",
          definition:
            "The programs and instructions that tell the hardware what to do.",
          example: "Windows · MakeCode · a web browser · a word processor",
        },
        { id: "mb1-l5", type: "heading", text: "The categories of hardware" },
        {
          id: "mb1-l6",
          type: "text",
          md: "The hardware is classified in **3 categories**:\n\n1. The **system unit**\n2. The **input devices**\n3. The **output devices**",
        },
        {
          id: "mb1-l7",
          type: "flow",
          steps: [
            {
              id: "mb1-f1",
              label: "Input devices",
              detail:
                "Transfer data TO the system unit — microphone, digital camera, keyboard, scanner",
            },
            {
              id: "mb1-f2",
              label: "System unit",
              detail:
                "The data is stored and processed here — motherboard, RAM, hard disk, CPU",
            },
            {
              id: "mb1-f3",
              label: "Output devices",
              detail:
                "Transfer data FROM the system unit — screen, printer, speaker",
            },
          ],
        },
        {
          id: "mb1-l8",
          type: "callout",
          variant: "tip",
          title: "Remember this shape",
          md: "**In → process → out.** Keep this picture in your head. In Lesson 3 you will meet a small board whose entire job is to be the middle arrow for devices a computer cannot normally reach.",
        },
        { id: "mb1-l9", type: "heading", text: "The components of the system unit" },
        {
          id: "mb1-l10",
          type: "text",
          md: "The system unit contains the **Mother Board**, the **Random Access Memory (RAM)**, the **Hard Disk** and the **Central Processing Unit (CPU)**.",
        },
        {
          id: "mb1-l11",
          type: "image",
          illustrationId: "computer-anatomy",
          alt: "Diagram of the inside of a system unit showing the motherboard, CPU, RAM and storage drive",
          caption: "Four components, four different jobs — inside every system unit.",
        },
        {
          id: "mb1-l12",
          type: "accordion",
          items: [
            {
              id: "mb1-a1",
              title: "Mother Board",
              blocks: [
                {
                  id: "mb1-a1b",
                  type: "text",
                  md: "The electronic circuit that **links all the items together**. Every other component plugs into it so they can exchange data.",
                },
              ],
            },
            {
              id: "mb1-a2",
              title: "Random Access Memory (RAM)",
              blocks: [
                {
                  id: "mb1-a2b",
                  type: "text",
                  md: "Holds what the computer is working on right now. **When the computer is turned off, its content is lost.**",
                },
              ],
            },
            {
              id: "mb1-a3",
              title: "Hard Disk",
              blocks: [
                {
                  id: "mb1-a3b",
                  type: "text",
                  md: "**Saves data even when the computer is turned off.** Your files, photos and programs live here.",
                },
              ],
            },
            {
              id: "mb1-a4",
              title: "Central Processing Unit (CPU)",
              blocks: [
                {
                  id: "mb1-a4b",
                  type: "text",
                  md: "**Calculates and processes data.** It is the part that actually carries out the instructions of the software.",
                },
              ],
            },
          ],
        },
        {
          id: "mb1-l13",
          type: "teacherNote",
          md: "The classic confusion is RAM vs Hard Disk. Both \"hold\" things, so students mix them up. Test it out loud: *\"You wrote a page and did not save it. The power cuts. Where was that page — RAM or hard disk?\"* The answer (RAM, and therefore gone) fixes the difference faster than any definition.",
        },
        { id: "mb1-l14", type: "heading", text: "The use of a computer" },
        {
          id: "mb1-l15",
          type: "text",
          md: "The computer is used to **manipulate data**, and data can be a text, an image, a sound, a video, a calculation, and more.\n\nThat data has to get **in**, and the results have to get **out**.",
        },
        {
          id: "mb1-l16",
          type: "tabs",
          tabs: [
            {
              id: "mb1-t-in",
              label: "Input devices",
              blocks: [
                {
                  id: "mb1-t-in-b",
                  type: "text",
                  md: "An input device is used to transfer data **to** the system unit:\n\n1. A **microphone** records a voice\n2. A **digital camera** captures a picture or a video\n3. A **keyboard** types text and numbers\n4. A **scanner** captures a document as an image",
                },
              ],
            },
            {
              id: "mb1-t-out",
              label: "Output devices",
              blocks: [
                {
                  id: "mb1-t-out-b",
                  type: "text",
                  md: "An output device is used to transfer data **from** the system unit:\n\n1. A **screen** is used to display a text or an image\n2. A **printer** is used to print on paper\n3. A **speaker** is used to play a sound",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "g6-mb-01-tryit",
      kind: "tryit",
      title: "Match, Sort, Complete",
      blocks: [
        {
          id: "mb1-t0",
          type: "text",
          md: "Three exercises straight from your book. Take them one at a time.",
        },
        {
          id: "mb1-t1",
          type: "activity",
          activity: {
            id: "mb1-try-match",
            kind: "match",
            prompt: "Match each computer component with its utility.",
            pairs: [
              {
                id: "mb1-mp1",
                left: "Mother Board",
                right: "Electronic circuit that links all the items together",
              },
              {
                id: "mb1-mp2",
                left: "Random Access Memory",
                right: "When the computer is turned off, its content is lost",
              },
              {
                id: "mb1-mp3",
                left: "Hard Disk",
                right: "Saves data even when the computer is turned off",
              },
              {
                id: "mb1-mp4",
                left: "Central Processing Unit",
                right: "Calculates and processes data",
              },
            ],
            skillIds: ["sys-hardware"],
            hints: [
              "Two of them hold data. Only one of those two forgets everything when the power goes off.",
              "\"Central Processing\" is a strong clue about what the CPU does.",
            ],
            explanation:
              "The Mother Board connects everything, the RAM forgets when the power stops, the Hard Disk remembers, and the CPU does the actual processing.",
          },
        },
        {
          id: "mb1-t2",
          type: "activity",
          activity: {
            id: "mb1-try-classify",
            kind: "classify",
            prompt:
              "Name 4 input devices and the output devices. Put each one where it belongs.",
            categories: [
              { id: "in", label: "Input device" },
              { id: "out", label: "Output device" },
            ],
            items: [
              { id: "mb1-cls-1", text: "Microphone", categoryId: "in" },
              { id: "mb1-cls-2", text: "Digital camera", categoryId: "in" },
              { id: "mb1-cls-3", text: "Keyboard", categoryId: "in" },
              { id: "mb1-cls-4", text: "Scanner", categoryId: "in" },
              { id: "mb1-cls-5", text: "Screen", categoryId: "out" },
              { id: "mb1-cls-6", text: "Printer", categoryId: "out" },
              { id: "mb1-cls-7", text: "Speaker", categoryId: "out" },
            ],
            skillIds: ["sys-io"],
            hints: [
              "Ask one question every time: does the data travel TO the system unit, or FROM it?",
              "If the device captures something from the real world, it is an input.",
            ],
            explanation:
              "Input devices transfer data **to** the system unit. Output devices transfer data **from** the system unit. That single test sorts every device you will ever meet.",
          },
        },
        {
          id: "mb1-t3",
          type: "activity",
          activity: {
            id: "mb1-try-fill",
            kind: "fillblank",
            prompt: "Complete the four sentences from your book.",
            template:
              "A digital camera captures a picture or a [[b1]].\nA screen is used to display a text or an [[b2]].\nA printer is used to print on [[b3]].\nA speaker is used to play a [[b4]].",
            blanks: {
              b1: ["video"],
              b2: ["image", "picture"],
              b3: ["paper"],
              b4: ["sound", "voice"],
            },
            bank: ["video", "image", "paper", "sound"],
            skillIds: ["sys-io"],
            hints: [
              "The first two sentences describe what a device captures or shows.",
              "The last two describe what leaves the computer and reaches your eyes or ears.",
            ],
            explanation:
              "Cameras capture pictures and videos; screens display texts and images; printers put data on paper; speakers turn data into sound.",
          },
        },
      ],
    },
    {
      id: "g6-mb-01-lab",
      kind: "lab",
      title: "ZERO1 Computer Lab",
      blocks: [
        {
          id: "mb1-lab-intro",
          type: "text",
          md: "You have named the components of the system unit. Now put them in place yourself.",
        },
        {
          id: "mb1-lab1",
          type: "lab",
          labId: "computer",
          title: "Build the System Unit",
          brief:
            "Install every component in its correct slot on the motherboard: the CPU that processes, the RAM that forgets, the drive that remembers. The machine boots only when the whole team is in place.",
        },
      ],
    },
    {
      id: "g6-mb-01-challenge",
      kind: "challenge",
      title: "Find Answers",
      blocks: [
        {
          id: "mb1-c1",
          type: "challenge",
          challenge: {
            id: "mb1-challenge",
            title: "What Can You Link to a Computer?",
            brief:
              "The book's closing question — and the door into the whole chapter. Think about it before you answer: an input device sends data in, an output device receives data out.",
            activity: {
              id: "mb1-ch-multi",
              kind: "multi",
              prompt:
                "Tick **every** device that it is possible to link to a computer.",
              options: [
                { id: "a", text: "Printer" },
                { id: "b", text: "Water pump" },
                { id: "c", text: "Motor" },
                { id: "d", text: "Temperature sensor" },
              ],
              answerIds: ["a", "b", "c", "d"],
              skillIds: ["sys-io", "ps-strategy"],
              hints: [
                "A printer is easy — it is an ordinary output device.",
                "A pump and a motor also just receive a command: turn on, turn off. That makes them outputs.",
                "A temperature sensor sends a value in. What category does that make it?",
              ],
              explanation:
                "**All four.** The printer plugs straight into a computer. The water pump and the motor are outputs — something has to tell them when to run. The temperature sensor is an input — it sends a reading in. What they need is a small board that links inputs to outputs: a **micro-controller**. That is exactly what you meet in Lesson 3.",
            },
            xp: 30,
          },
        },
        {
          id: "mb1-c2",
          type: "teacherNote",
          md: "Expect a split class here, and that is the point. Collect the reasons on the board and leave them written up — return to them at the end of Lesson 3 when the micro-controller has been defined, and let students correct their own answers.",
        },
      ],
    },
    {
      id: "g6-mb-01-checkpoint",
      kind: "checkpoint",
      title: "Revision Checkpoint",
      blocks: [
        {
          id: "mb1-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "mb1-q1",
              kind: "mcq",
              prompt:
                "The hardware is classified in 3 categories. Which of these is **not** one of them?",
              options: [
                { id: "a", text: "The system unit" },
                { id: "b", text: "The input devices" },
                { id: "c", text: "The software" },
                { id: "d", text: "The output devices" },
              ],
              answerId: "c",
              skillIds: ["sys-hardware", "sys-software"],
              explanation:
                "The software is the *other half* of the computer system, not a category of hardware. The three categories are the system unit, the input devices and the output devices.",
            },
            {
              id: "mb1-q2",
              kind: "truefalse",
              prompt:
                "When the computer is turned off, the content of the Random Access Memory is lost.",
              answer: true,
              skillIds: ["sys-hardware"],
              explanation:
                "That is exactly what separates RAM from the hard disk: the hard disk saves data even when the computer is turned off, the RAM does not.",
            },
            {
              id: "mb1-q3",
              kind: "multi",
              prompt: "Give 3 examples of **output** devices — tick all three.",
              options: [
                { id: "a", text: "Screen" },
                { id: "b", text: "Keyboard" },
                { id: "c", text: "Printer" },
                { id: "d", text: "Scanner" },
                { id: "e", text: "Speaker" },
              ],
              answerIds: ["a", "c", "e"],
              skillIds: ["sys-io"],
              explanation:
                "Screen, printer and speaker transfer data **from** the system unit. Keyboard and scanner transfer data **to** it.",
            },
            {
              id: "mb1-q4",
              kind: "mcq",
              prompt:
                "Which component of the system unit calculates and processes data?",
              options: [
                { id: "a", text: "The Mother Board" },
                { id: "b", text: "The Hard Disk" },
                { id: "c", text: "The Central Processing Unit" },
                { id: "d", text: "The Random Access Memory" },
              ],
              answerId: "c",
              skillIds: ["sys-hardware"],
              explanation:
                "The CPU calculates and processes data. The Mother Board links, the Hard Disk saves, the RAM holds temporarily.",
            },
            {
              id: "mb1-q5",
              kind: "fillblank",
              prompt: "Complete the sentence about the system unit.",
              template:
                "The [[b1]] is the electronic circuit that links all the items together, and the [[b2]] saves data even when the computer is turned off.",
              blanks: {
                b1: ["mother board", "motherboard"],
                b2: ["hard disk", "harddisk"],
              },
              bank: ["mother board", "hard disk", "RAM", "CPU"],
              skillIds: ["sys-hardware"],
              explanation:
                "Mother Board = the circuit that links everything. Hard Disk = the component that keeps data after power off.",
            },
            {
              id: "mb1-q6",
              kind: "truefalse",
              prompt:
                "It is impossible to link a motor or a temperature sensor to a computer.",
              answer: false,
              skillIds: ["sys-io"],
              explanation:
                "It is possible. A motor behaves as an output device and a temperature sensor as an input device — they simply need a micro-controller in between.",
            },
          ],
        },
      ],
    },
    {
      id: "g6-mb-01-create",
      kind: "create",
      title: "Map Your Own Machine",
      blocks: [
        {
          id: "mb1-proj",
          type: "project",
          project: {
            id: "mb1-project",
            title: "The Machine I Use Every Day",
            brief:
              "Choose one computer you actually use — the family laptop, the school desktop, the lab machine. Map it completely using the vocabulary of this lesson.",
            deliverables: [
              "Name 4 pieces of its hardware and 4 pieces of software installed on it",
              "List its input devices and its output devices in two columns",
              "Name the four components inside its system unit and write the utility of each in your own words",
              "Finish with one sentence: one device you WISH you could plug into it",
            ],
            submitTypes: ["text", "image"],
            rubric: [
              {
                criterion: "Correct vocabulary",
                description:
                  "Hardware, software, input, output and the system unit components are used correctly",
              },
              {
                criterion: "Completeness",
                description: "All four deliverables are present",
              },
              {
                criterion: "Own words",
                description:
                  "The utilities are explained, not copied from the book",
              },
            ],
            xp: 40,
          },
        },
        {
          id: "mb1-r1",
          type: "reflection",
          prompt:
            "Which everyday object would you most like a computer to control for you — and would that object be an input or an output?",
          placeholder: "I would connect the… because…",
        },
      ],
    },
  ],
};
