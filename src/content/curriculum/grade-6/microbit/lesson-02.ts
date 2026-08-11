import type { Lesson } from "@/types/content";

/**
 * Grade 6 · Chapter 1 "MakeCode for Micro:bit" · Lesson 2
 * Book objectives: 1- Defining smart objects · 2- Introducing IOT
 * Source: G6_2023_ch1_microbit.pdf, pp. 6–7.
 */
export const lessonMb02: Lesson = {
  id: "g6-mb-02",
  slug: "defining-smart-objects-and-iot",
  gradeId: "g6",
  unitId: "g6-microbit",
  order: 2,
  title: "Defining Smart Objects & IOT",
  tagline: "The world of tomorrow, built from four parts",
  description:
    "A network shares information. The Internet is the biggest network on earth. And once an object joins it, you can control it from anywhere — that idea has a name: IOT, the Internet of Things.",
  objectives: [
    "Define a computer network and name the equipment that connects it",
    "Explain that a device connected to the Internet can be controlled without being physically linked to it",
    "Define a smart object and introduce IOT — the Internet of Things",
    "List the four elements a smart object needs in order to be connected to the IOT network",
    "Research real sensors and state the utility of each",
  ],
  skillIds: ["net-internet", "sys-io", "ct-abstraction"],
  estimatedMinutes: 45,
  difficulty: "intro",
  icon: "Wifi",
  status: "published",
  teacherGuide: {
    overview:
      "The lesson moves from something familiar (a network) to something new (IOT) in four steps. The heart of it is the list of four elements a smart object needs — sensors, WIFI, an output, and a micro-controller. Every remaining lesson of this chapter builds one of those four.",
    tips: [
      "Run the fridge / lift / washing machine / traffic light poll as a real show of hands before students open the mission. The disagreement is the lesson.",
      "Ask which apps students already use to reach a device that is far away — the book names AnyDesk and Dropbox; students will name more.",
      "The book leaves the list of Internet-connected devices open after \"1- Computers, 2- Smart Phone, 3- …\". Collect the class answers on the board.",
      "Keep the four elements of a smart object visible on the wall for the rest of the chapter.",
    ],
  },
  stages: [
    {
      id: "g6-mb-02-discover",
      kind: "discover",
      title: "Waiting for Your Answers!",
      blocks: [
        {
          id: "mb2-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Four everyday machines: the **refrigerator** in your kitchen, the **lift** in your building, the **washing machine** in the laundry, the **traffic light** at the corner.\n\nYour teacher asks a simple question — and the class splits in half.",
        },
        {
          id: "mb2-d2",
          type: "activity",
          activity: {
            id: "mb2-d-poll",
            kind: "mcq",
            prompt:
              "The refrigerator, the lift, the washing machine, the traffic light — how many of these are **usually connected to the Internet** today?",
            options: [
              { id: "a", text: "All four of them" },
              { id: "b", text: "Only the traffic light" },
              { id: "c", text: "Usually none of them" },
              { id: "d", text: "Only the refrigerator" },
            ],
            answerId: "c",
            hints: [
              "Think about the machines in your own home right now. Can you open an app and talk to your washing machine?",
            ],
            explanation:
              "Most of the devices we use nowadays are **not** connected to the Internet — so it is impossible to control them remotely. That is exactly the problem that IOT sets out to solve.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "g6-mb-02-learn",
      kind: "learn",
      title: "From a Network to the Internet of Things",
      blocks: [
        { id: "mb2-l1", type: "heading", text: "What is a computer network?" },
        {
          id: "mb2-l2",
          type: "definition",
          term: "Computer network",
          definition:
            "A group of computers connected together via cables, switches and routers in order to transfer and share information between the users.",
          example: "The computers of your school lab, all sharing one printer.",
        },
        {
          id: "mb2-l3",
          type: "text",
          md: "The biggest network on earth is called the **Internet**, where all the computers around the world can communicate and share information in a simple way.",
        },
        {
          id: "mb2-l4",
          type: "callout",
          variant: "fact",
          title: "The key idea of the whole chapter",
          md: "If a device is connected to the Internet, it is very easy to **control it without being physically linked to it**.\n\nYou already use this:\n\n- **AnyDesk** lets you connect to a computer over the Internet network.\n- **Dropbox** lets you share files using the Internet network.",
        },
        {
          id: "mb2-l5",
          type: "heading",
          text: "What are the devices connected to the Internet?",
        },
        {
          id: "mb2-l6",
          type: "text",
          md: "The book starts the list for you and then stops on purpose:\n\n1. Computers\n2. Smart phones\n3. …?\n\nWrite the third one yourself — and the fourth, and the fifth. Look around the room before you answer.",
        },
        {
          id: "mb2-l7",
          type: "teacherNote",
          md: "Deliberately open-ended in the printed book. Take answers out loud and push past the obvious (tablets, smart TVs, watches, consoles). Then ask the follow-up that opens the next section: *\"and what is NOT on this list that you wish was?\"*",
        },
        { id: "mb2-l8", type: "heading", text: "The devices of today" },
        {
          id: "mb2-l9",
          type: "text",
          md: "From what we have learned, we can conclude that **most of the devices we are using nowadays are not connected to the Internet**, so it is impossible to control them remotely.\n\nYour fridge cannot text you. Your washing machine cannot warn you. Not yet.",
        },
        { id: "mb2-l10", type: "heading", text: "IOT — the world of tomorrow" },
        {
          id: "mb2-l11",
          type: "text",
          md: "A few years ago, major companies in the field of communication and technology — **Cisco, Intel, Microsoft** and others — started creating electronic devices called **\"Smart Objects\"**.\n\nThe concept is called **IOT — Internet of Things** — and it allows the user to control any electronic device he is using.",
        },
        {
          id: "mb2-l12",
          type: "definition",
          term: "Smart object",
          definition:
            "An electronic device that is connected to the Internet, so that the user can control it and read information from it without being physically linked to it.",
          example:
            "A fridge that sends a notification when its door is kept open.",
        },
        {
          id: "mb2-l13",
          type: "accordion",
          items: [
            {
              id: "mb2-ex-car",
              title: "A connected car",
              blocks: [
                {
                  id: "mb2-ex-car-b",
                  type: "text",
                  md: "If a car is connected to the Internet, it is easy for the manufacturer to monitor the possible future failures in order to **inform the driver before the problem happens**.",
                },
              ],
            },
            {
              id: "mb2-ex-lift",
              title: "A connected lift",
              blocks: [
                {
                  id: "mb2-ex-lift-b",
                  type: "text",
                  md: "If a lift is connected to the Internet, it is easy to **manage the time usage by each apartment** and to split the electricity consumption accordingly.",
                },
              ],
            },
            {
              id: "mb2-ex-fridge",
              title: "A connected fridge",
              blocks: [
                {
                  id: "mb2-ex-fridge-b",
                  type: "text",
                  md: "If a fridge is connected to the Internet, we can get a **notification if the door is kept open** or even if the temperature is higher than the one set.",
                },
              ],
            },
          ],
        },
        {
          id: "mb2-l14",
          type: "heading",
          text: "The elements of a smart object",
        },
        {
          id: "mb2-l15",
          type: "text",
          md: "A smart object needs the following components in order to be connected to the IOT network:\n\n1. **A set of sensors** — considered as input devices\n2. **An Internet connection to WIFI**\n3. **A screen or any other device** — considered as output device\n4. **A micro-controller** — considered as the brain of the device",
        },
        {
          id: "mb2-l16",
          type: "flow",
          steps: [
            {
              id: "mb2-f1",
              label: "Sensors",
              detail: "Input devices — they read the world (temperature, humidity, movement…)",
            },
            {
              id: "mb2-f2",
              label: "Micro-controller",
              detail: "The brain of the device — it decides what to do with the readings",
            },
            {
              id: "mb2-f3",
              label: "Screen or other output",
              detail: "Output device — it shows the result or acts on the world",
            },
            {
              id: "mb2-f4",
              label: "WIFI / Internet",
              detail: "The connection that makes the object reachable from anywhere",
            },
          ],
        },
        {
          id: "mb2-l17",
          type: "callout",
          variant: "info",
          title: "Look at that list again",
          md: "Sensors are inputs. The screen is an output. That is the **same in → process → out** shape you revised in Lesson 1. IOT does not replace what you know — it adds a brain and a WIFI connection to it.",
        },
        {
          id: "mb2-l18",
          type: "teacherNote",
          md: "Misconception to catch: students often think \"smart\" means \"has a screen\". Point at the four elements — a smart object can have no screen at all and still be smart, as long as it senses, decides and connects. The missing piece for most students is the **micro-controller**, which is why Lesson 3 exists.",
        },
      ],
    },
    {
      id: "g6-mb-02-tryit",
      kind: "tryit",
      title: "Is It Smart?",
      blocks: [
        {
          id: "mb2-t1",
          type: "activity",
          activity: {
            id: "mb2-try-multi",
            kind: "multi",
            prompt:
              "Tick the **four** components a smart object needs in order to be connected to the IOT network.",
            options: [
              { id: "a", text: "A set of sensors considered as input devices" },
              { id: "b", text: "A keyboard" },
              { id: "c", text: "An Internet connection to WIFI" },
              { id: "d", text: "A screen or any other output device" },
              { id: "e", text: "A micro-controller considered as the brain" },
              { id: "f", text: "A hard disk" },
            ],
            answerIds: ["a", "c", "d", "e"],
            skillIds: ["ct-abstraction", "net-internet"],
            hints: [
              "One element reads the world, one decides, one shows or acts, one connects.",
              "A keyboard and a hard disk belong to a computer — not to every smart object.",
            ],
            explanation:
              "Sensors (input) + micro-controller (brain) + screen or other output + a WIFI connection. Take any one of the four away and the object stops being a smart object.",
          },
        },
        {
          id: "mb2-t2",
          type: "activity",
          activity: {
            id: "mb2-try-fill",
            kind: "fillblank",
            prompt: "Complete the two key sentences of this lesson.",
            template:
              "IOT means the Internet of [[b1]].\nInside a smart object, the [[b2]] is considered as the brain of the device.",
            blanks: {
              b1: ["things"],
              b2: ["micro-controller", "microcontroller", "micro controller"],
            },
            bank: ["Things", "micro-controller", "sensors", "WIFI"],
            skillIds: ["net-internet", "ct-abstraction"],
            hints: [
              "The \"T\" in IOT is the ordinary English word for objects.",
              "The brain is not the sensor and not the screen — it is the board between them.",
            ],
            explanation:
              "IOT = Internet **of Things**. The **micro-controller** is the brain — the electronic board you meet properly in the next lesson.",
          },
        },
        {
          id: "mb2-t3",
          type: "activity",
          activity: {
            id: "mb2-try-tf",
            kind: "truefalse",
            prompt:
              "If a device is connected to the Internet, it is very easy to control it without being physically linked to it.",
            answer: true,
            skillIds: ["net-internet"],
            hints: ["Think about AnyDesk reaching a computer in another city."],
            explanation:
              "True — and it is the sentence the whole idea of IOT rests on. AnyDesk controls a distant computer; Dropbox shares files across the Internet network.",
          },
        },
      ],
    },
    {
      id: "g6-mb-02-challenge",
      kind: "challenge",
      title: "The World of Tomorrow",
      blocks: [
        {
          id: "mb2-c1",
          type: "challenge",
          challenge: {
            id: "mb2-challenge",
            title: "What Becomes Possible?",
            brief:
              "Three ordinary machines, three Internet connections. Match each connected object to the new power it gains — exactly as your book describes it.",
            activity: {
              id: "mb2-ch-match",
              kind: "match",
              prompt:
                "Match each object to what becomes possible once it is connected to the Internet.",
              pairs: [
                {
                  id: "mb2-m1",
                  left: "A connected car",
                  right:
                    "The manufacturer monitors possible future failures and informs the driver before the problem happens",
                },
                {
                  id: "mb2-m2",
                  left: "A connected lift",
                  right:
                    "The time usage by each apartment is managed and the electricity consumption is split accordingly",
                },
                {
                  id: "mb2-m3",
                  left: "A connected fridge",
                  right:
                    "A notification is sent if the door is kept open or the temperature is higher than the one set",
                },
              ],
              skillIds: ["net-internet", "ct-abstraction"],
              hints: [
                "Only one of the three is about sharing a bill between neighbours.",
                "Which object has a door people forget to close?",
              ],
              explanation:
                "Each one gains the same superpower in a different costume: the object can now be **read and controlled from far away**. That is IOT.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "g6-mb-02-checkpoint",
      kind: "checkpoint",
      title: "Smart Objects Checkpoint",
      blocks: [
        {
          id: "mb2-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "mb2-q1",
              kind: "mcq",
              prompt:
                "A computer network is a group of computers connected together via…",
              options: [
                { id: "a", text: "Cables, switches and routers" },
                { id: "b", text: "Keyboards and screens" },
                { id: "c", text: "Printers and scanners" },
                { id: "d", text: "Hard disks" },
              ],
              answerId: "a",
              skillIds: ["net-internet"],
              explanation:
                "Cables, switches and routers connect the computers so users can transfer and share information.",
            },
            {
              id: "mb2-q2",
              kind: "truefalse",
              prompt: "The biggest network on earth is called the Internet.",
              answer: true,
              skillIds: ["net-internet"],
              explanation:
                "On the Internet, all the computers around the world can communicate and share information in a simple way.",
            },
            {
              id: "mb2-q3",
              kind: "mcq",
              prompt:
                "Major technology companies such as Cisco, Intel and Microsoft started creating electronic devices called…",
              options: [
                { id: "a", text: "Super computers" },
                { id: "b", text: "Smart Objects" },
                { id: "c", text: "Networks" },
                { id: "d", text: "Operating systems" },
              ],
              answerId: "b",
              skillIds: ["net-internet"],
              explanation:
                "They are called **Smart Objects**, and the concept behind them is IOT — the Internet of Things.",
            },
            {
              id: "mb2-q4",
              kind: "classify",
              prompt:
                "Inside a smart object, is each element an input, an output, or the brain?",
              categories: [
                { id: "in", label: "Input" },
                { id: "out", label: "Output" },
                { id: "brain", label: "The brain" },
              ],
              items: [
                { id: "mb2-k1", text: "A temperature sensor", categoryId: "in" },
                { id: "mb2-k2", text: "A screen", categoryId: "out" },
                { id: "mb2-k3", text: "A micro-controller", categoryId: "brain" },
                { id: "mb2-k4", text: "A humidity sensor", categoryId: "in" },
              ],
              skillIds: ["sys-io", "ct-abstraction"],
              explanation:
                "Sensors are input devices, the screen is an output device, and the micro-controller is the brain that links them.",
            },
            {
              id: "mb2-q5",
              kind: "truefalse",
              prompt:
                "Today, most of the devices we use are already connected to the Internet.",
              answer: false,
              skillIds: ["net-internet"],
              explanation:
                "Most devices are **not** connected, which is why they cannot be controlled remotely. IOT is the movement that is changing this.",
            },
          ],
        },
      ],
    },
    {
      id: "g6-mb-02-create",
      kind: "create",
      title: "Research & Design",
      blocks: [
        {
          id: "mb2-p1",
          type: "project",
          project: {
            id: "mb2-project",
            title: "Four Sensors, One Smart Object",
            brief:
              "Your book asks you to research sensors. Do that — then use what you find to invent a smart object of your own.",
            deliverables: [
              "Make a research on the Internet and enumerate 4 sensors with the utility of each one",
              "Invent a smart object that does not exist yet, and give it a name",
              "List its four elements: which sensors it uses, what its output is, and why it needs a micro-controller and a WIFI connection",
              "Write one sentence explaining what its owner can now do from far away",
            ],
            submitTypes: ["text", "image"],
            rubric: [
              {
                criterion: "Research quality",
                description:
                  "Four real sensors are named and the utility of each is stated clearly",
              },
              {
                criterion: "The four elements",
                description:
                  "The invented object names its sensors, its output, its micro-controller and its connection",
              },
              {
                criterion: "Usefulness",
                description:
                  "The object solves a real problem for a real person",
              },
            ],
            xp: 40,
          },
        },
        {
          id: "mb2-r1",
          type: "reflection",
          prompt:
            "Which object in your home would change your life most if it became smart — and what exactly would you want it to tell you?",
          placeholder: "If our… could talk to my phone, it would tell me…",
        },
      ],
    },
  ],
};
