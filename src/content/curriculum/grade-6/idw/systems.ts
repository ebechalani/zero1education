import type { Lesson } from "@/types/content";

export const lessonSystems: Lesson = {
  id: "g6-idw-systems",
  slug: "computer-systems",
  gradeId: "g6",
  unitId: "g6-idw",
  order: 1,
  title: "Computer Systems",
  tagline: "What's really inside the box?",
  description:
    "Open up a computer and discover the team of components that work together — hardware and software, input and output, and the parts that think, remember and store.",
  objectives: [
    "Tell the difference between hardware and software",
    "Classify devices as input, output or storage",
    "Name the main components inside the system unit and explain what each does",
    "Choose the right component to fix a slow or broken computer",
  ],
  skillIds: ["sys-hardware", "sys-io", "sys-software"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "Cpu",
  labId: "computer",
  status: "published",
  teacherGuide: {
    overview:
      "Students explore computer anatomy through a virtual assembly lab. The big misconception to hunt: confusing memory (RAM) with storage. Use the desk/backpack analogy early and often.",
    tips: [
      "Ask students to guess what's inside a computer before revealing the diagram — collect guesses on the board.",
      "If you have an old computer case, open it live alongside the ZERO1 Lab.",
      "RAM vs storage: your desk (fast, small, cleared at night) vs your backpack (big, slower, keeps everything).",
      "Extension: ask fast finishers to research what a GPU does in gaming vs AI.",
    ],
    answersNote:
      "Checkpoint answer key is visible in Teach Mode with reveal controls.",
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "The Frozen Laptop",
      blocks: [
        {
          id: "sys-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Maya presses the power button. Lights blink… then nothing. The screen stays black. Her project is due **tomorrow**.\n\nHer uncle, a computer engineer, smiles: *\"Let's open it up. If you know what's inside, you can usually find what's wrong.\"*",
        },
        {
          id: "sys-d2",
          type: "text",
          md: "In this mission you become the engineer. You'll look inside a real computer, learn what every part does, then **build one yourself** in the ZERO1 Lab.",
        },
        {
          id: "sys-d3",
          type: "activity",
          activity: {
            id: "sys-d-poll",
            kind: "mcq",
            prompt: "Before we open the case — what do you *think* is the \"brain\" of a computer?",
            options: [
              { id: "a", text: "The screen" },
              { id: "b", text: "The CPU (processor)" },
              { id: "c", text: "The keyboard" },
              { id: "d", text: "The battery" },
            ],
            answerId: "b",
            hints: ["It's a small chip, but it makes billions of decisions every second."],
            explanation:
              "The **CPU** (Central Processing Unit) is the brain — it executes the instructions that make everything else work. Let's meet the rest of the team.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Hardware, Software & the Team Inside",
      blocks: [
        {
          id: "sys-l1",
          type: "heading",
          text: "Two halves of every computer",
        },
        {
          id: "sys-l2",
          type: "text",
          md: "Every computer system is made of two halves that need each other:\n\n- **Hardware** — the physical parts you can touch: the screen, the chips, the cables.\n- **Software** — the programs and instructions that tell the hardware what to do: games, apps, the operating system.",
        },
        {
          id: "sys-l3",
          type: "definition",
          term: "Hardware",
          definition: "The physical parts of a computer — everything you can see and touch.",
          example: "Keyboard, monitor, CPU, RAM, hard disk.",
        },
        {
          id: "sys-l4",
          type: "definition",
          term: "Software",
          definition: "The programs and instructions that make hardware useful.",
          example: "Windows, Scratch, Minecraft, a web browser.",
        },
        {
          id: "sys-l5",
          type: "callout",
          variant: "fact",
          title: "No body without a mind",
          md: "Hardware without software is like a body without thoughts. Software without hardware is like thoughts without a body. A computer needs **both**.",
        },
        {
          id: "sys-l6",
          type: "heading",
          text: "In, out… or both?",
        },
        {
          id: "sys-l7",
          type: "tabs",
          tabs: [
            {
              id: "t-in",
              label: "Input devices",
              blocks: [
                {
                  id: "sys-l7a",
                  type: "text",
                  md: "Input devices send information **into** the computer:\n\n- Keyboard — types letters and numbers\n- Mouse — points and clicks\n- Microphone — captures sound\n- Webcam — captures video\n- Scanner — captures documents",
                },
              ],
            },
            {
              id: "t-out",
              label: "Output devices",
              blocks: [
                {
                  id: "sys-l7b",
                  type: "text",
                  md: "Output devices bring information **out** of the computer to you:\n\n- Monitor — shows images\n- Speakers — play sound\n- Printer — puts pages on paper\n- Projector — displays on a wall",
                },
              ],
            },
            {
              id: "t-both",
              label: "Both!",
              blocks: [
                {
                  id: "sys-l7c",
                  type: "text",
                  md: "Some devices go **both ways**:\n\n- Touchscreen — shows images *and* senses your finger\n- Headset — plays sound *and* records your voice\n- USB flash drive — stores data in *and* out",
                },
              ],
            },
          ],
        },
        {
          id: "sys-l8",
          type: "heading",
          text: "Inside the system unit",
        },
        {
          id: "sys-l9",
          type: "image",
          illustrationId: "computer-anatomy",
          alt: "Exploded diagram of a computer showing motherboard, CPU, RAM, storage, GPU and power supply",
          caption: "The team inside the case — every part has one job, and they work together.",
        },
        {
          id: "sys-l10",
          type: "accordion",
          items: [
            {
              id: "a-cpu",
              title: "CPU — the brain",
              blocks: [
                {
                  id: "sys-l10a",
                  type: "text",
                  md: "The **Central Processing Unit** executes instructions — billions per second. Every click, every calculation, every frame of a game passes through the CPU.",
                },
              ],
            },
            {
              id: "a-ram",
              title: "RAM — the working desk",
              blocks: [
                {
                  id: "sys-l10b",
                  type: "text",
                  md: "**Random Access Memory** holds what the computer is working on *right now* — like the papers spread on your desk. Fast, but cleared when the power goes off. More RAM = more things open at once without slowing down.",
                },
              ],
            },
            {
              id: "a-storage",
              title: "Storage — the backpack",
              blocks: [
                {
                  id: "sys-l10c",
                  type: "text",
                  md: "The **hard disk (HDD)** or **solid-state drive (SSD)** keeps your files even when the power is off — like a backpack that carries everything home. Bigger than RAM, but slower.",
                },
              ],
            },
            {
              id: "a-mobo",
              title: "Motherboard — the city",
              blocks: [
                {
                  id: "sys-l10d",
                  type: "text",
                  md: "The **motherboard** is the big board everything plugs into. Like a city's roads, it connects the CPU, RAM, storage and every other part so they can talk to each other.",
                },
              ],
            },
            {
              id: "a-gpu",
              title: "GPU — the artist",
              blocks: [
                {
                  id: "sys-l10e",
                  type: "text",
                  md: "The **Graphics Processing Unit** draws what you see — millions of pixels, many times per second. Gamers love powerful GPUs; so do AI researchers.",
                },
              ],
            },
            {
              id: "a-psu",
              title: "Power supply — the heart",
              blocks: [
                {
                  id: "sys-l10f",
                  type: "text",
                  md: "The **PSU** takes electricity from the wall and feeds every component exactly the power it needs. No power, no computer — as Maya discovered.",
                },
              ],
            },
          ],
        },
        {
          id: "sys-l11",
          type: "teacherNote",
          md: "Misconception alert: students often say a computer with a full disk is \"out of memory\". Full **storage** ≠ full **RAM**. Revisit the desk/backpack analogy: a stuffed backpack doesn't shrink your desk.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Sort the Devices",
      blocks: [
        {
          id: "sys-t1",
          type: "text",
          md: "Time to test your engineer's eye. Drag each device into the right group.",
        },
        {
          id: "sys-t2",
          type: "activity",
          activity: {
            id: "sys-try-classify",
            kind: "classify",
            prompt: "Classify each device: does it send data **in**, bring data **out**, or **store** it?",
            categories: [
              { id: "input", label: "Input" },
              { id: "output", label: "Output" },
              { id: "storage", label: "Storage" },
            ],
            items: [
              { id: "i1", text: "Keyboard", categoryId: "input" },
              { id: "i2", text: "Monitor", categoryId: "output" },
              { id: "i3", text: "Microphone", categoryId: "input" },
              { id: "i4", text: "Printer", categoryId: "output" },
              { id: "i5", text: "USB flash drive", categoryId: "storage" },
              { id: "i6", text: "Webcam", categoryId: "input" },
              { id: "i7", text: "Speakers", categoryId: "output" },
              { id: "i8", text: "SSD", categoryId: "storage" },
            ],
            skillIds: ["sys-io"],
            hints: [
              "Ask: does information travel *toward* the computer, or *away* from it?",
              "Storage devices keep data even when the power is off.",
            ],
            explanation:
              "Input devices capture information (keyboard, microphone, webcam). Output devices present it (monitor, printer, speakers). Storage devices keep it (USB drive, SSD).",
          },
        },
      ],
    },
    {
      id: "lab",
      kind: "lab",
      title: "ZERO1 Computer Lab",
      blocks: [
        {
          id: "sys-lab1",
          type: "lab",
          labId: "computer",
          title: "Build-a-Computer",
          brief:
            "Maya's computer needs rebuilding. Install each component in its correct slot on the motherboard. The machine boots only when everything is in place.",
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "The Upgrade Clinic",
      blocks: [
        {
          id: "sys-c1",
          type: "challenge",
          challenge: {
            id: "sys-challenge",
            title: "The Upgrade Clinic",
            brief:
              "Three customers, three complaints. Diagnose like a real technician — choose the component that fixes each problem.",
            activity: {
              id: "sys-ch-match",
              kind: "match",
              prompt: "Match each complaint to the component that should be upgraded or checked.",
              pairs: [
                { id: "p1", left: "\"My computer is slow when I open many tabs\"", right: "RAM" },
                { id: "p2", left: "\"I have no space left for my photos\"", right: "Storage (SSD/HDD)" },
                { id: "p3", left: "\"My new game looks blocky and stutters\"", right: "GPU" },
                { id: "p4", left: "\"It won't turn on at all\"", right: "Power supply" },
              ],
              skillIds: ["sys-hardware", "ps-strategy"],
              hints: [
                "Many tabs open at once = many things on the working desk…",
                "Photos live in long-term storage, not RAM.",
              ],
              explanation:
                "Real technicians diagnose from symptoms: slowness with multitasking → RAM; no space → storage; graphics problems → GPU; totally dead → power supply first.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Systems Checkpoint",
      blocks: [
        {
          id: "sys-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "sys-q1",
              kind: "mcq",
              prompt: "Which of these is **software**?",
              options: [
                { id: "a", text: "Motherboard" },
                { id: "b", text: "Scratch" },
                { id: "c", text: "Webcam" },
                { id: "d", text: "SSD" },
              ],
              answerId: "b",
              skillIds: ["sys-software"],
              explanation: "Scratch is a program — instructions, not a physical part. Everything else on the list is hardware.",
            },
            {
              id: "sys-q2",
              kind: "truefalse",
              prompt: "When you turn the computer off, everything in RAM is erased.",
              answer: true,
              skillIds: ["sys-hardware"],
              explanation: "RAM is temporary working memory. That's why unsaved work disappears — and why we save to storage.",
            },
            {
              id: "sys-q3",
              kind: "match",
              prompt: "Match each component to its job.",
              pairs: [
                { id: "m1", left: "CPU", right: "Executes instructions" },
                { id: "m2", left: "RAM", right: "Holds current work" },
                { id: "m3", left: "SSD", right: "Keeps files long-term" },
                { id: "m4", left: "Motherboard", right: "Connects everything" },
              ],
              skillIds: ["sys-hardware"],
              explanation: "Brain, desk, backpack, city — the team inside every computer.",
            },
            {
              id: "sys-q4",
              kind: "multi",
              prompt: "Select **all** the input devices.",
              options: [
                { id: "a", text: "Scanner" },
                { id: "b", text: "Projector" },
                { id: "c", text: "Mouse" },
                { id: "d", text: "Speakers" },
                { id: "e", text: "Microphone" },
              ],
              answerIds: ["a", "c", "e"],
              skillIds: ["sys-io"],
              explanation: "Scanner, mouse and microphone capture information into the computer. Projector and speakers are output.",
            },
            {
              id: "sys-q5",
              kind: "fillblank",
              prompt: "Complete the sentence.",
              template: "The [[b1]] is called the brain of the computer, and the [[b2]] connects all components together.",
              blanks: { b1: ["cpu", "processor"], b2: ["motherboard"] },
              bank: ["CPU", "motherboard", "printer", "RAM"],
              skillIds: ["sys-hardware"],
              explanation: "The CPU processes instructions; the motherboard is the board that links the whole team.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Design Your Dream Computer",
      blocks: [
        {
          id: "sys-p1",
          type: "project",
          project: {
            id: "sys-project",
            title: "Design Your Dream Computer",
            brief:
              "You have an imaginary budget and one goal: design the perfect computer for a purpose YOU choose — gaming, video editing, a school lab, or something wilder.",
            deliverables: [
              "Choose a purpose for your computer",
              "List the components you would pick (CPU, RAM, storage, GPU…)",
              "Explain WHY each choice fits your purpose in 1–2 sentences",
            ],
            submitTypes: ["text"],
            rubric: [
              { criterion: "Component knowledge", description: "Each part is named correctly and matched to its real job" },
              { criterion: "Reasoning", description: "Choices are justified by the computer's purpose" },
              { criterion: "Creativity", description: "The design shows original thinking" },
            ],
            xp: 40,
          },
        },
        {
          id: "sys-r1",
          type: "reflection",
          prompt: "Which component surprised you the most, and what would you still like to understand better?",
          placeholder: "I used to think… but now I know…",
        },
      ],
    },
  ],
};
