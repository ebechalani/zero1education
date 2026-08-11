import type { Unit } from "@/types/content";

/**
 * The real ZERO1 curriculum catalog — Grade 0 (KG) through Grade 12.
 * Book units mirror the printed 2023 edition (chapter structure extracted from
 * the author's originals). The Grade 6 "Inside the Digital World" unit is the
 * first fully interactive ZERO1 unit; book units are progressively converted
 * into missions through ZERO1 Studio.
 */

const u = (
  gradeNum: number,
  order: number,
  slug: string,
  title: string,
  summary: string,
  opts: Partial<Unit> & { icon?: string } = {},
): Unit => ({
  id: `g${gradeNum}-${slug}`,
  gradeId: `g${gradeNum}` as Unit["gradeId"],
  order,
  title,
  summary,
  skillIds: opts.skillIds ?? [],
  lessonIds: opts.lessonIds ?? [],
  status: opts.status ?? "coming-soon",
  source: opts.source ?? "book-2023",
  bookRef: opts.bookRef,
  icon: opts.icon,
  tagline: opts.tagline,
  plannedLessons: opts.plannedLessons,
});

export const CATALOG: Unit[] = [
  // ── KG (Grade 0) — ZERO1 Explorer ─────────────────────────────────────────
  u(0, 1, "knowing-computer", "Knowing My Computer", "Meet the computer, its parts and how to use it safely.", { bookRef: "KG CH1", icon: "Monitor", skillIds: ["sys-hardware", "dl-files"] }),
  u(0, 2, "cartoon-drawing", "Cartoon Drawing", "First creative steps with digital drawing.", { bookRef: "KG CH2", icon: "Palette", skillIds: ["cr-projects"] }),
  u(0, 3, "keyboard", "Using My Keyboard", "Find letters and numbers and type first words.", { bookRef: "KG CH3", icon: "Keyboard", skillIds: ["dl-files"] }),
  u(0, 4, "paint", "Drawing with Paint", "Create pictures with digital tools.", { bookRef: "KG CH4", icon: "Brush", skillIds: ["cr-projects"] }),
  u(0, 5, "algorithms", "Coding with Algorithms", "Put steps in order — first algorithmic thinking.", { bookRef: "KG CH5", icon: "ListOrdered", skillIds: ["algo-sequence"] }),
  u(0, 6, "scratchjr", "ScratchJr", "Make characters move with first code blocks.", { bookRef: "KG CH6", icon: "Cat", skillIds: ["prog-blocks"] }),

  // ── Grade 1 ───────────────────────────────────────────────────────────────
  u(1, 1, "intro-computers", "Intro to Computers", "What computers are and what they can do.", { bookRef: "G1 CH1", icon: "Monitor", skillIds: ["sys-hardware"] }),
  u(1, 2, "paint", "Draw with Paint", "Shapes, colors and creativity on screen.", { bookRef: "G1 CH2", icon: "Brush", skillIds: ["cr-projects"] }),
  u(1, 3, "algorithms", "Algorithms", "Follow and build simple step-by-step instructions.", { bookRef: "G1 CH4", icon: "ListOrdered", skillIds: ["algo-sequence"] }),
  u(1, 4, "scratchjr", "ScratchJr", "Animate stories with blocks.", { bookRef: "G1 CH5", icon: "Cat", skillIds: ["prog-blocks"] }),

  // ── Grade 2 ───────────────────────────────────────────────────────────────
  u(2, 1, "components", "Computer Components", "The parts of a computer and what each one does.", { bookRef: "G2 CH1", icon: "Cpu", skillIds: ["sys-hardware"] }),
  u(2, 2, "algorithms", "Algorithms", "Sequences, patterns and precise instructions.", { bookRef: "G2 CH3", icon: "ListOrdered", skillIds: ["algo-sequence", "ct-patterns"] }),
  u(2, 3, "scratchjr", "ScratchJr", "Code interactive scenes and stories.", { bookRef: "G2 CH4", icon: "Cat", skillIds: ["prog-blocks"] }),
  u(2, 4, "robotics", "Robotics", "Meet your first robots and make them move.", { bookRef: "G2 CH5", icon: "Bot", skillIds: ["rob-build"] }),

  // ── Grade 3 — ZERO1 Builder ───────────────────────────────────────────────
  u(3, 1, "scratchjr", "ScratchJr Projects", "Bigger stories and games with block coding.", { bookRef: "G3 CH1", icon: "Cat", skillIds: ["prog-blocks"] }),
  u(3, 2, "cartoon", "Cartoon Drawing", "Digital drawing and animation basics.", { bookRef: "G3 CH2", icon: "Palette", skillIds: ["cr-projects"] }),
  u(3, 3, "discovering-computer", "Discovering My Computer", "Files, folders, apps and settings.", { bookRef: "G3 CH3", icon: "FolderOpen", skillIds: ["dl-files"] }),
  u(3, 4, "robotics", "Robotics", "Build and program simple robot missions.", { bookRef: "G3 CH4", icon: "Bot", skillIds: ["rob-build"] }),
  u(3, 5, "microbit", "micro:bit", "First steps with the micro:bit board.", { bookRef: "G3 CH5", icon: "CircuitBoard", skillIds: ["pc-microbit"] }),
  u(3, 6, "word", "Microsoft Word", "Write and format real documents.", { bookRef: "G3 CH6", icon: "FileText", skillIds: ["dl-files"] }),

  // ── Grade 4 ───────────────────────────────────────────────────────────────
  u(4, 1, "scratch", "Coding with Scratch", "From ScratchJr to full Scratch projects.", { bookRef: "G4 CH1", icon: "Blocks", skillIds: ["prog-blocks", "algo-sequence"] }),
  u(4, 2, "cartoon", "Cartoon Drawing", "Character design and digital art.", { bookRef: "G4 CH2", icon: "Palette", skillIds: ["cr-projects"] }),
  u(4, 3, "makecode", "MakeCode for micro:bit", "Program LEDs, buttons and sensors.", { bookRef: "G4 CH3", icon: "CircuitBoard", skillIds: ["pc-microbit", "prog-blocks"] }),
  u(4, 4, "powerpoint", "PowerPoint", "Design and deliver presentations.", { bookRef: "G4 CH4", icon: "Presentation", skillIds: ["dl-files", "cr-projects"] }),
  u(4, 5, "mbot2", "Robotics with mBot2", "Sensors, motors and robot missions.", { bookRef: "G4 CH5", icon: "Bot", skillIds: ["rob-build", "prog-blocks"] }),

  // ── Grade 5 ───────────────────────────────────────────────────────────────
  u(5, 1, "makecode", "MakeCode for micro:bit", "Variables, loops and mini-games on hardware.", { bookRef: "G5 CH1", icon: "CircuitBoard", skillIds: ["pc-microbit", "prog-blocks"] }),
  u(5, 2, "scratch", "Scratch", "Games with variables, events and logic.", { bookRef: "G5 CH2", icon: "Blocks", skillIds: ["prog-blocks", "algo-selection"] }),
  u(5, 3, "cartoon", "Cartoon Drawing", "Animation techniques and storytelling.", { bookRef: "G5 CH3", icon: "Palette", skillIds: ["cr-projects"] }),
  u(5, 4, "excel", "Excel", "Tables, sums and first data skills.", { bookRef: "G5 CH4", icon: "Table", skillIds: ["data-analysis"] }),
  u(5, 5, "robotics", "Robotics", "Autonomous behaviors with sensors.", { bookRef: "G5 CH5", icon: "Bot", skillIds: ["rob-build"] }),

  // ── Grade 6 — ZERO1 Creator (MVP grade) ───────────────────────────────────
  u(6, 1, "idw", "Inside the Digital World", "How computers think: systems, binary, algorithms, networks and staying safe.", {
    source: "zero1",
    status: "published",
    icon: "Globe2",
    tagline: "The flagship interactive ZERO1 unit",
    skillIds: ["sys-hardware", "sys-io", "data-binary", "algo-sequence", "algo-selection", "net-devices", "net-internet", "cyber-phishing", "cyber-passwords"],
    lessonIds: ["g6-idw-systems", "g6-idw-binary", "g6-idw-algorithms", "g6-idw-networks", "g6-idw-cyber"],
  }),
  u(6, 2, "microbit", "MakeCode for micro:bit", "Micro-controllers, IoT and the 25-LED matrix — the printed Chapter 1, lesson for lesson.", {
    bookRef: "G6 CH1", icon: "CircuitBoard", status: "published",
    tagline: "Converted from the printed edition",
    skillIds: ["pc-microbit", "prog-blocks", "sys-hardware", "sys-io", "algo-iteration", "algo-selection"],
    lessonIds: [
      "g6-mb-01", "g6-mb-02", "g6-mb-03", "g6-mb-04", "g6-mb-05",
      "g6-mb-06", "g6-mb-07", "g6-mb-08", "g6-mb-09", "g6-mb-10",
    ],
  }),
  u(6, 3, "excel", "Microsoft Excel", "Build and format tables, then calculate with formulas and the IF function.", {
    bookRef: "G6 CH2", icon: "Table", plannedLessons: 7,
    skillIds: ["data-analysis", "dl-files"],
    lessonIds: ["g6-xl-01", "g6-xl-02", "g6-xl-03", "g6-xl-04", "g6-xl-05", "g6-xl-06", "g6-xl-07"],
  }),
  u(6, 4, "cartoon", "Cartoon Drawing", "Draw superhero characters step by step in Paint — bodies, poses and costumes.", {
    bookRef: "G6 CH3", icon: "Brush", plannedLessons: 5,
    skillIds: ["cr-projects", "dl-files"],
    lessonIds: ["g6-ct-01", "g6-ct-02", "g6-ct-03", "g6-ct-04", "g6-ct-05"],
  }),
  u(6, 5, "robotics", "Robotics with mBot2", "Smart bins, smart homes, autonomous driving and client counting with the CyberPi controller.", {
    bookRef: "G6 CH4", icon: "Bot", plannedLessons: 7,
    skillIds: ["rob-build", "sys-io", "prog-blocks"],
    lessonIds: ["g6-rb-01", "g6-rb-02", "g6-rb-03", "g6-rb-04", "g6-rb-05", "g6-rb-06", "g6-rb-07"],
  }),
  u(6, 6, "scratch", "Scratch", "Stories, documentaries, animations and games built in Scratch 3.0.", {
    bookRef: "G6 CH5", icon: "Blocks", plannedLessons: 7,
    skillIds: ["prog-blocks", "algo-iteration", "cr-projects"],
    lessonIds: ["g6-sc-01", "g6-sc-02", "g6-sc-03", "g6-sc-04", "g6-sc-05", "g6-sc-06", "g6-sc-07"],
  }),

  // ── Grade 7 ───────────────────────────────────────────────────────────────
  u(7, 1, "photoshop", "Photoshop", "Photo editing, layers and digital design.", { bookRef: "G7 CH2", icon: "Image", skillIds: ["cr-projects"] }),
  u(7, 2, "html", "HTML", "Build your first real web pages.", { bookRef: "G7 CH3", icon: "Code2", skillIds: ["web-html"] }),
  u(7, 3, "mbot2", "mBot2", "Advanced robot builds and missions.", { bookRef: "G7 CH4", icon: "Bot", skillIds: ["rob-build"] }),
  u(7, 4, "python", "Python", "From blocks to real text-based code.", { bookRef: "G7 CH5", icon: "Terminal", skillIds: ["prog-python"] }),
  u(7, 5, "arduino", "Arduino", "Electronics and physical computing.", { bookRef: "G7 CH6", icon: "CircuitBoard", skillIds: ["pc-microbit"] }),

  // ── Grade 8 ───────────────────────────────────────────────────────────────
  u(8, 1, "html", "Building Websites with HTML", "Structure and publish multi-page sites.", { bookRef: "G8 CH1", icon: "Globe", plannedLessons: 6, skillIds: ["web-html"] }),
  u(8, 2, "mbot2", "Robotics with mBot2", "Sensor-driven autonomous robotics.", { bookRef: "G8 CH2", icon: "Bot", plannedLessons: 8, skillIds: ["rob-build"] }),
  u(8, 3, "smallbasic", "Coding with Small Basic", "Text programming with graphics and logic.", { bookRef: "G8 CH3", icon: "Terminal", plannedLessons: 7, skillIds: ["prog-python"] }),
  u(8, 4, "photoshop", "Photo Editing with Photoshop", "Professional image manipulation.", { bookRef: "G8 CH4", icon: "Image", plannedLessons: 9, skillIds: ["cr-projects"] }),
  u(8, 5, "arduino", "Controlling the World with Arduino", "Circuits, sensors and control code.", { bookRef: "G8 CH5", icon: "CircuitBoard", plannedLessons: 8, skillIds: ["pc-microbit"] }),
  u(8, 6, "python", "Coding with Python", "Review and strengthen Python foundations.", { bookRef: "G8 CH6", icon: "Terminal", plannedLessons: 1, skillIds: ["prog-python"] }),

  // ── Grade 9 — ZERO1 Innovator ─────────────────────────────────────────────
  u(9, 1, "smallbasic", "Coding with Small Basic", "Programs, procedures and graphics.", { bookRef: "G9 CH1", icon: "Terminal", plannedLessons: 8, skillIds: ["prog-python"] }),
  u(9, 2, "mbot2", "Robotics with mBot2 (CyberPi)", "Networked robotics with CyberPi.", { bookRef: "G9 CH2", icon: "Bot", plannedLessons: 10, skillIds: ["rob-build"] }),
  u(9, 3, "mailmerge", "The Mail Merge Function", "Automate documents with data.", { bookRef: "G9 CH3", icon: "Mail", plannedLessons: 3, skillIds: ["dl-files", "data-analysis"] }),
  u(9, 4, "arduino", "Arduino with Tinkercad", "Simulated circuits and control.", { bookRef: "G9 CH4", icon: "CircuitBoard", plannedLessons: 5, skillIds: ["pc-microbit"] }),
  u(9, 5, "access", "Microsoft Access: Databases", "Tables, queries, forms and reports.", { bookRef: "G9 CH5", icon: "Database", plannedLessons: 8, skillIds: ["data-analysis"] }),
  u(9, 6, "codeblock", "Drawing 3D Shapes with CodeBlock", "Code-driven 3D design in Tinkercad.", { bookRef: "G9 CH6", icon: "Boxes", plannedLessons: 4, skillIds: ["ct-abstraction", "cr-projects"] }),
  u(9, 7, "python", "Coding with Python", "Review of Grade 8 Python skills.", { bookRef: "G9 CH7", icon: "Terminal", plannedLessons: 1, skillIds: ["prog-python"] }),

  // ── Grade 10 ──────────────────────────────────────────────────────────────
  u(10, 1, "python", "Python", "Control flow, functions and problem solving.", { bookRef: "G10 CH1", icon: "Terminal", skillIds: ["prog-python"] }),
  u(10, 2, "photoshop", "Photoshop", "Design workflows for real projects.", { bookRef: "G10 CH2", icon: "Image", skillIds: ["cr-projects"] }),
  u(10, 3, "excel", "Excel", "Advanced formulas and data analysis.", { bookRef: "G10 CH3", icon: "Table", skillIds: ["data-analysis"] }),
  u(10, 4, "access", "Access", "Relational databases in practice.", { bookRef: "G10 CH4", icon: "Database", skillIds: ["data-analysis"] }),
  u(10, 5, "arduino", "Arduino", "Sensors, actuators and prototypes.", { bookRef: "G10 CH5", icon: "CircuitBoard", skillIds: ["pc-microbit"] }),

  // ── Grade 11 ──────────────────────────────────────────────────────────────
  u(11, 1, "arduino", "Arduino", "Embedded systems and IoT builds.", { bookRef: "G11 CH1", icon: "CircuitBoard", skillIds: ["pc-microbit"] }),
  u(11, 2, "python", "Python", "Data structures and algorithms in Python.", { bookRef: "G11 CH2", icon: "Terminal", skillIds: ["prog-python"] }),
  u(11, 3, "access", "Access", "Database design and SQL foundations.", { bookRef: "G11 CH3", icon: "Database", skillIds: ["data-analysis"] }),
  u(11, 4, "php", "PHP", "Server-side web programming.", { bookRef: "G11 CH4", icon: "Globe", skillIds: ["web-html"] }),
  u(11, 5, "mysql", "MySQL", "Real database queries and management.", { bookRef: "G11 CH5", icon: "Database", skillIds: ["data-analysis"] }),
  u(11, 6, "python-revision", "Python Revision", "Consolidate for official exams.", { bookRef: "G11 CH6", icon: "Terminal", skillIds: ["prog-python"] }),

  // ── Grade 12 ──────────────────────────────────────────────────────────────
  u(12, 1, "python", "Coding with Python", "Turtle, functions, lists, search/sort, tkinter and PIL.", { bookRef: "G12 CH1", icon: "Terminal", plannedLessons: 8, skillIds: ["prog-python", "algo-iteration"] }),
  u(12, 2, "php", "PHP for Interactive Websites", "Dynamic pages connected to data.", { bookRef: "G12 CH2", icon: "Globe", plannedLessons: 5, skillIds: ["web-html"] }),
  u(12, 3, "mysql", "Managing Databases with MySQL", "phpMyAdmin, queries and integrity.", { bookRef: "G12 CH3", icon: "Database", plannedLessons: 10, skillIds: ["data-analysis"] }),
  u(12, 4, "arduino-1", "Arduino I — Inputs & Signals", "Digital/analog pins, buttons, LDR, PWM, ultrasonic.", { bookRef: "G12 CH4", icon: "CircuitBoard", plannedLessons: 7, skillIds: ["pc-microbit"] }),
  u(12, 5, "arduino-2", "Arduino II — Actuators & Projects", "Servos, serial, relays and the smart-plant project.", { bookRef: "G12 CH5", icon: "CircuitBoard", plannedLessons: 7, skillIds: ["pc-microbit", "cr-projects"] }),
  u(12, 6, "sketchup", "SketchUp for Architectural Design", "3D modelling for real spaces.", { bookRef: "G12 CH6", icon: "Boxes", plannedLessons: 2, skillIds: ["cr-projects"] }),
];

export const unitById = new Map(CATALOG.map((unit) => [unit.id, unit]));

export function unitsForGrade(gradeNum: number): Unit[] {
  return CATALOG.filter((unit) => unit.gradeId === `g${gradeNum}`).sort(
    (a, b) => a.order - b.order,
  );
}
