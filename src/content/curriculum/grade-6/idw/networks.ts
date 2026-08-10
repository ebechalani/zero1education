import type { Lesson } from "@/types/content";

export const lessonNetworks: Lesson = {
  id: "g6-idw-networks",
  slug: "networks",
  gradeId: "g6",
  unitId: "g6-idw",
  order: 4,
  title: "Networks",
  tagline: "How your message crosses the planet",
  description:
    "Send a message and it can reach Tokyo in a blink. Discover the devices, cables and clever tricks that connect billions of computers into one Internet.",
  objectives: [
    "Explain what a network is and why we connect computers",
    "Describe the jobs of routers, switches, servers and access points",
    "Explain how data travels as packets across the Internet",
    "Build and validate a working network in the ZERO1 Lab",
  ],
  skillIds: ["net-devices", "net-internet", "ct-decompose"],
  estimatedMinutes: 45,
  difficulty: "core",
  icon: "Network",
  labId: "network",
  status: "published",
  teacherGuide: {
    overview:
      "Networks feel invisible to students — this mission makes them concrete. The postal-system analogy carries the whole lesson: addresses (IP), envelopes (packets), sorting offices (routers).",
    tips: [
      "Unplugged demo: pass a long note as several numbered paper 'packets' through 3 students; deliver them out of order and let the receiver reassemble.",
      "Show the school's actual Wi-Fi access points and (if possible) the network cabinet — instant engagement.",
      "The lab validates connections; let students discover the router's central role by trying to skip it.",
    ],
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "The 60-Millisecond Trip",
      blocks: [
        {
          id: "net-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "Maya video-calls her cousin in Brazil. Her voice leaves Beirut, crosses the Mediterranean, dives under the Atlantic Ocean in a cable thinner than a garden hose, and arrives — in about **60 milliseconds**. Faster than a blink.\n\nHow can anything travel that far, that fast, and arrive perfectly?",
        },
        {
          id: "net-d2",
          type: "activity",
          activity: {
            id: "net-d-poll",
            kind: "mcq",
            prompt: "How do you think most Internet traffic crosses oceans between continents?",
            options: [
              { id: "a", text: "Satellites in space" },
              { id: "b", text: "Cables under the sea" },
              { id: "c", text: "Radio towers" },
              { id: "d", text: "Airplanes carrying hard drives" },
            ],
            answerId: "b",
            hints: ["The fastest path is surprisingly old-fashioned — and wet."],
            explanation:
              "About 99% of intercontinental Internet traffic travels through **undersea fiber-optic cables** — light pulses in glass, circling the globe.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Devices, Packets & the Internet",
      blocks: [
        { id: "net-l1", type: "heading", text: "What is a network?" },
        {
          id: "net-l2",
          type: "definition",
          term: "Network",
          definition:
            "Two or more devices connected so they can share data and resources.",
          example: "Your home Wi-Fi, the school computer lab, the Internet itself.",
        },
        {
          id: "net-l3",
          type: "text",
          md: "Networks let devices **share**: one printer for a whole class, one Internet connection for a whole family, one server for millions of players.",
        },
        { id: "net-l4", type: "heading", text: "Meet the network team" },
        {
          id: "net-l5",
          type: "accordion",
          items: [
            {
              id: "n-router",
              title: "Router — the post office",
              blocks: [
                {
                  id: "net-l5a",
                  type: "text",
                  md: "The **router** directs data between networks — it reads each packet's address and sends it down the best path. Your home router also connects your house to your Internet provider.",
                },
              ],
            },
            {
              id: "n-switch",
              title: "Switch — the local sorter",
              blocks: [
                {
                  id: "net-l5b",
                  type: "text",
                  md: "A **switch** connects many devices *inside* one network — like the mail room inside a big building, moving envelopes between floors without leaving the building.",
                },
              ],
            },
            {
              id: "n-server",
              title: "Server — the always-on helper",
              blocks: [
                {
                  id: "net-l5c",
                  type: "text",
                  md: "A **server** is a computer that provides something to others: websites, game worlds, school files. It \"serves\" — and it never sleeps.",
                },
              ],
            },
            {
              id: "n-ap",
              title: "Access point — the invisible cable",
              blocks: [
                {
                  id: "net-l5d",
                  type: "text",
                  md: "An **access point** turns network cables into Wi-Fi radio waves so phones, tablets and laptops can join without wires.",
                },
              ],
            },
          ],
        },
        { id: "net-l6", type: "heading", text: "The packet trick" },
        {
          id: "net-l7",
          type: "text",
          md: "Here's the Internet's cleverest idea: your message doesn't travel in one piece. It's chopped into small **packets**, each with the destination address, each finding its *own* route — then reassembled at the other end.",
        },
        {
          id: "net-l8",
          type: "flow",
          steps: [
            { id: "p1", label: "Your message" },
            { id: "p2", label: "Split into packets, each with an address" },
            { id: "p3", label: "Routers pass each packet along the best path" },
            { id: "p4", label: "Packets arrive (maybe out of order!)" },
            { id: "p5", label: "Reassembled into your message" },
          ],
        },
        {
          id: "net-l9",
          type: "callout",
          variant: "fact",
          title: "Why packets?",
          md: "If one path is blocked or busy, packets simply take another road. That's why the Internet keeps working even when parts of it fail.",
        },
        {
          id: "net-l10",
          type: "text",
          md: "Every device on a network has an **IP address** — its unique number, like a home address for data. Networks come in sizes:\n\n- **LAN** (Local Area Network) — one place: your home, the school lab\n- **WAN** (Wide Area Network) — connects places across cities and countries\n- **The Internet** — the worldwide network of networks",
        },
        {
          id: "net-l11",
          type: "teacherNote",
          md: "Students often equate \"Wi-Fi\" with \"Internet\". Untangle it: Wi-Fi is the *wireless doorway* into a network; the Internet is what may lie beyond the router. The lab makes this visible.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "Who Does What?",
      blocks: [
        {
          id: "net-t1",
          type: "activity",
          activity: {
            id: "net-try-match",
            kind: "match",
            prompt: "Match each network device to its job.",
            pairs: [
              { id: "m1", left: "Router", right: "Directs data between networks" },
              { id: "m2", left: "Switch", right: "Connects devices inside one network" },
              { id: "m3", left: "Server", right: "Provides websites and files to others" },
              { id: "m4", left: "Access point", right: "Connects devices by Wi-Fi" },
            ],
            skillIds: ["net-devices"],
            hints: ["The post office directs BETWEEN networks; the mail room sorts INSIDE one building."],
            explanation:
              "Router = between networks, switch = inside a network, server = provides services, access point = wireless doorway.",
          },
        },
        {
          id: "net-t2",
          type: "activity",
          activity: {
            id: "net-try-tf",
            kind: "truefalse",
            prompt: "Wi-Fi and the Internet are the same thing.",
            answer: false,
            skillIds: ["net-internet"],
            hints: ["Can you have Wi-Fi at home while the Internet connection is down?"],
            explanation:
              "Wi-Fi is a wireless connection to your local network. The Internet is the global network beyond it — you can have one without the other.",
          },
        },
      ],
    },
    {
      id: "lab",
      kind: "lab",
      title: "ZERO1 Network Lab",
      blocks: [
        {
          id: "net-lab1",
          type: "lab",
          labId: "network",
          title: "Build the School Network",
          brief:
            "The new computer room needs a network: connect the computers, printer and server through the switch, link the router to the Internet, and add Wi-Fi for tablets. The lab validates your design live.",
          config: {
            brief: "Connect every end device through the switch; the router links your LAN to the Internet.",
            required: [
              { device: "computer", count: 2 },
              { device: "switch", count: 1 },
              { device: "router", count: 1 },
              { device: "server", count: 1 },
              { device: "printer", count: 1 },
              { device: "access-point", count: 1 },
            ],
          },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Network Detective",
      blocks: [
        {
          id: "net-c1",
          type: "challenge",
          challenge: {
            id: "net-challenge",
            title: "Network Detective",
            brief:
              "The Grade 6 room reports a mystery: laptops reach websites, but nobody can print. Trace the clue like a network technician.",
            activity: {
              id: "net-ch-1",
              kind: "mcq",
              prompt:
                "Laptops (on Wi-Fi) reach the Internet fine. The wired printer is unreachable by everyone. The printer's screen says it's on and ready. Where is the MOST likely problem?",
              options: [
                { id: "a", text: "The router lost Internet connection" },
                { id: "b", text: "The printer's cable to the switch" },
                { id: "c", text: "The access point is off" },
                { id: "d", text: "The server crashed" },
              ],
              answerId: "b",
              skillIds: ["net-devices", "ps-strategy"],
              hints: [
                "Internet works → the router's job is being done. Wi-Fi works → the access point is fine.",
                "Which single connection would take ONLY the printer off the network?",
              ],
              explanation:
                "Everything else works, so the path Internet→router→switch→Wi-Fi is healthy. The one link serving only the printer is its cable to the switch — check it first. Real technicians eliminate suspects exactly like this.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Networks Checkpoint",
      blocks: [
        {
          id: "net-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "net-q1",
              kind: "mcq",
              prompt: "What is a network?",
              options: [
                { id: "a", text: "A very fast computer" },
                { id: "b", text: "Devices connected to share data and resources" },
                { id: "c", text: "A type of website" },
                { id: "d", text: "A Wi-Fi password" },
              ],
              answerId: "b",
              skillIds: ["net-devices"],
              explanation: "Connection + sharing = network, from two laptops to the whole Internet.",
            },
            {
              id: "net-q2",
              kind: "mcq",
              prompt: "Your message to a friend abroad is split into small pieces before travelling. These pieces are called…",
              options: [
                { id: "a", text: "Bytes" },
                { id: "b", text: "Packets" },
                { id: "c", text: "Signals" },
                { id: "d", text: "Files" },
              ],
              answerId: "b",
              skillIds: ["net-internet"],
              explanation: "Packets — each addressed, each free to take its own route, reassembled on arrival.",
            },
            {
              id: "net-q3",
              kind: "truefalse",
              prompt: "If one Internet path is blocked, packets can travel a different route.",
              answer: true,
              skillIds: ["net-internet"],
              explanation: "That flexibility is the Internet's superpower — it routes around damage.",
            },
            {
              id: "net-q4",
              kind: "classify",
              prompt: "LAN or WAN? Classify each network.",
              categories: [
                { id: "lan", label: "LAN (one place)" },
                { id: "wan", label: "WAN (many places)" },
              ],
              items: [
                { id: "i1", text: "Your home Wi-Fi", categoryId: "lan" },
                { id: "i2", text: "The school computer lab", categoryId: "lan" },
                { id: "i3", text: "A bank connecting branches across Lebanon", categoryId: "wan" },
                { id: "i4", text: "The Internet", categoryId: "wan" },
              ],
              skillIds: ["net-internet"],
              explanation: "One building or home = LAN. Networks spanning cities and countries = WAN.",
            },
            {
              id: "net-q5",
              kind: "fillblank",
              prompt: "Complete the sentence.",
              template: "Every device on a network is identified by its [[b1]] address, and the device that directs data between networks is the [[b2]].",
              blanks: { b1: ["ip"], b2: ["router"] },
              bank: ["IP", "router", "email", "switch"],
              skillIds: ["net-devices", "net-internet"],
              explanation: "IP address = the device's home address for data; the router reads it and picks the path.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Map Your World",
      blocks: [
        {
          id: "net-p1",
          type: "project",
          project: {
            id: "net-project",
            title: "Map Your Home Network",
            brief:
              "Become the network engineer of your own home. Find every connected device, figure out how it connects, and draw the full map.",
            deliverables: [
              "List every device at home that uses the network (don't forget the TV!)",
              "Mark each connection as wired or Wi-Fi",
              "Draw the map: devices → access point/switch → router → Internet",
            ],
            submitTypes: ["image", "text"],
            rubric: [
              { criterion: "Completeness", description: "Finds most connected devices, including hidden ones" },
              { criterion: "Accuracy", description: "Router, access point and connections are correctly placed" },
            ],
            xp: 40,
          },
        },
        {
          id: "net-r1",
          type: "reflection",
          prompt: "Count the connected devices in your home. Did the number surprise you?",
          placeholder: "I found … devices. The one I never thought about was…",
        },
      ],
    },
  ],
};
