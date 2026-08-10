import type { Lesson } from "@/types/content";

export const lessonBinary: Lesson = {
  id: "g6-idw-binary",
  slug: "binary-numbers",
  gradeId: "g6",
  unitId: "g6-idw",
  order: 2,
  title: "Binary Numbers",
  tagline: "The secret language of every machine",
  description:
    "Everything a computer does — photos, music, games, this very lesson — is built from just two symbols. Learn to read and write the language of 0 and 1.",
  objectives: [
    "Explain why computers use binary",
    "Convert binary numbers to decimal using place values",
    "Build a target number by switching bits on and off",
    "Order the units of digital data from bit to terabyte",
  ],
  skillIds: ["data-binary", "data-units", "ct-patterns"],
  estimatedMinutes: 40,
  difficulty: "core",
  icon: "Binary",
  labId: "binary",
  status: "published",
  teacherGuide: {
    overview:
      "The Binary Lab is the heart of this mission — students *feel* place values by flipping switches and watching the decimal total react instantly. Push for the doubling pattern (1, 2, 4, 8…) rather than memorization.",
    tips: [
      "Start unplugged: 5 volunteers are 'bits' holding cards 16-8-4-2-1; the class shouts numbers to display.",
      "Ask why there's no digit '2' in binary — connect to a light switch having no 'half-on'.",
      "The 'Kilobyte Club' badge (1,024 XP) is a fun hook to explain why computer units use 1024, not 1000.",
    ],
  },
  stages: [
    {
      id: "discover",
      kind: "discover",
      title: "The Two-Symbol Secret",
      blocks: [
        {
          id: "bin-d1",
          type: "callout",
          variant: "story",
          title: "Mission briefing",
          md: "At night, Maya notices her router blinking — on, off, on, on, off. Her uncle laughs: *\"It's talking. Everything digital — every photo, every song, every game — is just two symbols, switched very, very fast.\"*\n\nTwo symbols? **Everything?** Time to crack the code.",
        },
        {
          id: "bin-d2",
          type: "activity",
          activity: {
            id: "bin-d-poll",
            kind: "mcq",
            prompt: "A light switch can be ON or OFF. How many different \"messages\" can THREE switches show together?",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "6" },
              { id: "c", text: "8" },
              { id: "d", text: "9" },
            ],
            answerId: "c",
            hints: ["Try listing them: OFF-OFF-OFF, OFF-OFF-ON, OFF-ON-OFF…"],
            explanation:
              "Each switch doubles the possibilities: 2 × 2 × 2 = **8**. This doubling is the superpower behind all of computing.",
            xp: 5,
          },
        },
      ],
    },
    {
      id: "learn",
      kind: "learn",
      title: "Reading the Language of Machines",
      blocks: [
        { id: "bin-l1", type: "heading", text: "Why only 0 and 1?" },
        {
          id: "bin-l2",
          type: "text",
          md: "Inside a computer, everything runs on electricity. A wire can be **ON** (current flowing) or **OFF** (no current) — there is no \"half-on\". So computers count with exactly two digits:\n\n- **0** = OFF\n- **1** = ON\n\nThis system is called **binary**.",
        },
        {
          id: "bin-l3",
          type: "definition",
          term: "Bit",
          definition: "A single binary digit — the smallest piece of digital information. It is either 0 or 1.",
          example: "The 'b' in Wi-Fi speeds: 100 Mbps = 100 million bits per second.",
        },
        {
          id: "bin-l4",
          type: "definition",
          term: "Byte",
          definition: "A group of 8 bits. One byte can store one character, like the letter A.",
          example: "01000001 is the byte for 'A'.",
        },
        { id: "bin-l5", type: "heading", text: "Place values: the doubling pattern" },
        {
          id: "bin-l6",
          type: "text",
          md: "In decimal, places are worth 1, 10, 100, 1000 — multiplying by ten. In binary, places **double**: 1, 2, 4, 8, 16, 32, 64, 128.\n\nTo read a binary number, add up the places where a **1** appears.",
        },
        {
          id: "bin-l7",
          type: "image",
          illustrationId: "binary-places",
          alt: "Binary place value chart showing 128, 64, 32, 16, 8, 4, 2, 1 with the number 1011 worked out as 8 + 2 + 1 = 11",
          caption: "1011₂ → the 8, the 2 and the 1 are ON → 8 + 2 + 1 = 11",
        },
        {
          id: "bin-l8",
          type: "callout",
          variant: "tip",
          title: "Engineer's trick",
          md: "Write the place values above the bits, **right to left**: 1, 2, 4, 8… Then simply add the places under each 1. That's the whole skill.",
        },
        { id: "bin-l9", type: "heading", text: "From bits to terabytes" },
        {
          id: "bin-l10",
          type: "text",
          md: "Bits build bytes, and bytes build everything else:\n\n1. **Bit** — a 0 or 1\n2. **Byte** — 8 bits (one character)\n3. **Kilobyte (KB)** — about a paragraph of text\n4. **Megabyte (MB)** — about one minute of music\n5. **Gigabyte (GB)** — about 500 photos\n6. **Terabyte (TB)** — a whole family's photo and video collection",
        },
        {
          id: "bin-l11",
          type: "callout",
          variant: "fact",
          title: "Why 1024?",
          md: "Computer units grow by **1024** (= 2¹⁰), not 1000, because computers count in twos. A kilobyte is really 1024 bytes — a secret handshake between engineers.",
        },
        {
          id: "bin-l12",
          type: "teacherNote",
          md: "Common error: students add ALL place values instead of only the ones under a 1. In the Binary Lab, ask them to predict the decimal number *before* flipping each switch.",
        },
      ],
    },
    {
      id: "tryit",
      kind: "tryit",
      title: "First Conversions",
      blocks: [
        {
          id: "bin-t1",
          type: "activity",
          activity: {
            id: "bin-try-mcq",
            kind: "mcq",
            prompt: "What is `101` in decimal?",
            options: [
              { id: "a", text: "3" },
              { id: "b", text: "5" },
              { id: "c", text: "6" },
              { id: "d", text: "101" },
            ],
            answerId: "b",
            skillIds: ["data-binary"],
            hints: ["Place values right to left: 1, 2, 4.", "Which places show a 1? Add just those."],
            explanation: "101₂ has 1s in the 4-place and the 1-place: 4 + 1 = **5**.",
          },
        },
        {
          id: "bin-t2",
          type: "activity",
          activity: {
            id: "bin-try-fill",
            kind: "fillblank",
            prompt: "Convert this binary number.",
            template: "`1000` in binary equals [[b1]] in decimal.",
            blanks: { b1: ["8"] },
            skillIds: ["data-binary"],
            hints: ["Only one switch is ON. Which place is it in?"],
            explanation: "The single 1 sits in the fourth place from the right = the 8-place. So 1000₂ = 8.",
          },
        },
        {
          id: "bin-t3",
          type: "activity",
          activity: {
            id: "bin-try-sort",
            kind: "sort",
            prompt: "Order the data units from **smallest** to **largest**.",
            items: [
              { id: "s1", text: "Megabyte" },
              { id: "s2", text: "Bit" },
              { id: "s3", text: "Terabyte" },
              { id: "s4", text: "Byte" },
              { id: "s5", text: "Gigabyte" },
              { id: "s6", text: "Kilobyte" },
            ],
            correctOrder: ["s2", "s4", "s6", "s1", "s5", "s3"],
            endLabels: ["Smallest", "Largest"],
            skillIds: ["data-units"],
            hints: ["Start with the single 0-or-1, then the group of 8."],
            explanation: "Bit → Byte → KB → MB → GB → TB, each step about 1024× bigger.",
          },
        },
      ],
    },
    {
      id: "lab",
      kind: "lab",
      title: "ZERO1 Binary Lab",
      blocks: [
        {
          id: "bin-lab1",
          type: "lab",
          labId: "binary",
          title: "The Bit Switchboard",
          brief:
            "Eight switches, one number. Flip bits ON and OFF and watch the decimal value react instantly — then hit every target the lab gives you.",
          config: { bits: 8, mode: "target", targets: [9, 21, 42, 77, 129] },
        },
      ],
    },
    {
      id: "challenge",
      kind: "challenge",
      title: "Secret Message",
      blocks: [
        {
          id: "bin-c1",
          type: "challenge",
          challenge: {
            id: "bin-challenge",
            title: "Crack the Byte",
            brief:
              "Spies hide letters as bytes. In the ASCII code, A = 65, B = 66, C = 67… Decode the intercepted byte!",
            activity: {
              id: "bin-ch-1",
              kind: "mcq",
              prompt: "Intercepted byte: `01001000`. Its decimal value is 72, and A=65, B=66, C=67… Which letter is it?",
              options: [
                { id: "a", text: "F" },
                { id: "b", text: "G" },
                { id: "c", text: "H" },
                { id: "d", text: "I" },
              ],
              answerId: "c",
              skillIds: ["data-binary", "ct-patterns"],
              hints: [
                "Count up from A=65: 66, 67, 68…",
                "72 − 65 = 7, so it's 7 letters after A.",
              ],
              explanation:
                "72 is 7 steps after 65, and 7 letters after A is **H**. Every letter you've ever typed became a byte exactly like this.",
            },
            xp: 30,
          },
        },
      ],
    },
    {
      id: "checkpoint",
      kind: "checkpoint",
      title: "Binary Checkpoint",
      blocks: [
        {
          id: "bin-q0",
          type: "quiz",
          title: "Prove your knowledge",
          passPct: 70,
          questions: [
            {
              id: "bin-q1",
              kind: "mcq",
              prompt: "What is `1101` in decimal?",
              options: [
                { id: "a", text: "11" },
                { id: "b", text: "12" },
                { id: "c", text: "13" },
                { id: "d", text: "14" },
              ],
              answerId: "c",
              skillIds: ["data-binary"],
              explanation: "8 + 4 + 1 = 13. The 2-place is OFF.",
            },
            {
              id: "bin-q2",
              kind: "truefalse",
              prompt: "Binary uses the digits 0 through 9.",
              answer: false,
              skillIds: ["data-binary"],
              explanation: "Binary uses only 0 and 1 — that's the whole point! Decimal uses 0–9.",
            },
            {
              id: "bin-q3",
              kind: "fillblank",
              prompt: "Complete the definition.",
              template: "One byte is a group of [[b1]] bits.",
              blanks: { b1: ["8", "eight"] },
              skillIds: ["data-units"],
              explanation: "8 bits = 1 byte, enough to store one character.",
            },
            {
              id: "bin-q4",
              kind: "mcq",
              prompt: "Which number **cannot** be shown with 4 bits?",
              options: [
                { id: "a", text: "0" },
                { id: "b", text: "9" },
                { id: "c", text: "15" },
                { id: "d", text: "16" },
              ],
              answerId: "d",
              skillIds: ["data-binary", "ct-patterns"],
              explanation: "4 bits reach 8+4+2+1 = 15 at most. 16 needs a fifth bit.",
            },
            {
              id: "bin-q5",
              kind: "match",
              prompt: "Match each amount of data to what it could hold.",
              pairs: [
                { id: "m1", left: "1 byte", right: "One letter" },
                { id: "m2", left: "1 MB", right: "A minute of music" },
                { id: "m3", left: "1 GB", right: "Hundreds of photos" },
                { id: "m4", left: "1 TB", right: "A family's entire video collection" },
              ],
              skillIds: ["data-units"],
              explanation: "From a single character to a lifetime of memories — it's all bits underneath.",
            },
          ],
        },
      ],
    },
    {
      id: "create",
      kind: "create",
      title: "Binary Art",
      blocks: [
        {
          id: "bin-p1",
          type: "project",
          project: {
            id: "bin-project",
            title: "Your Initials in Binary",
            brief:
              "Turn your own initials into bytes using the ASCII table (A=65, B=66 … Z=90), then design a poster, bracelet or pixel-art pattern that encodes them.",
            deliverables: [
              "Write each initial's decimal ASCII value",
              "Convert each value to an 8-bit binary byte",
              "Design something that displays your binary initials (drawing, beads, pixels…)",
            ],
            submitTypes: ["text", "image"],
            rubric: [
              { criterion: "Correct conversion", description: "Letters → decimal → binary with no errors" },
              { criterion: "Craft", description: "The design clearly shows the bits" },
            ],
            xp: 40,
          },
        },
        {
          id: "bin-r1",
          type: "reflection",
          prompt: "Where will you now notice binary hiding in your daily life?",
          placeholder: "When I stream a video, actually…",
        },
      ],
    },
  ],
};
