import type { Lesson } from "@/types/content";

/**
 * Grade 6 · MakeCode for micro:bit — the printed 2023 Chapter 1 (10 lessons).
 * Titles and objectives come from the actual book; full interactive missions
 * are authored progressively in ZERO1 Studio (status: coming-soon).
 */

const stub = (
  n: number,
  slug: string,
  title: string,
  description: string,
  skillIds: string[],
  minutes = 40,
): Lesson => ({
  id: `g6-mb-${n.toString().padStart(2, "0")}`,
  slug,
  gradeId: "g6",
  unitId: "g6-microbit",
  order: n,
  title,
  description,
  objectives: [],
  skillIds,
  estimatedMinutes: minutes,
  difficulty: "core",
  icon: "CircuitBoard",
  status: "coming-soon",
  stages: [],
});

export const microbitLessons: Lesson[] = [
  stub(1, "intro-microcontrollers", "Introduction to Microcontrollers", "Review hardware vs software, input and output devices, and the components of the system unit.", ["sys-hardware", "sys-io"]),
  stub(2, "smart-objects-iot", "Smart Objects & IoT", "Define smart objects, discover the Internet of Things and list the elements that make an object smart.", ["pc-microbit", "net-internet"]),
  stub(3, "push-buttons", "Meet the micro:bit — Push Buttons", "Compare micro:bit and Arduino, then use push buttons A and B as input controls in MakeCode.", ["pc-microbit", "prog-blocks"]),
  stub(4, "stopwatch-variable", "A Stopwatch with a Variable", "Declare, initialize and update a variable to build a working stopwatch.", ["pc-microbit", "prog-blocks"]),
  stub(5, "two-player-game", "A Two-Variable Game", "Build a two-player button game where the first variable to reach 10 wins.", ["pc-microbit", "prog-blocks", "algo-selection"]),
  stub(6, "led-matrix", "Controlling the LED Matrix", "Light the 25 LEDs of the micro:bit screen by their (x, y) addresses.", ["pc-microbit", "ct-abstraction"]),
  stub(7, "loops-leds", "Loops & LEDs", "Use variables, for-loops and embedded loops to control the whole LED matrix.", ["pc-microbit", "algo-iteration"]),
  stub(8, "air-quality-station", "The Air Quality Station", "Read temperature and humidity from the Kitronik board and control room-temperature displays.", ["pc-microbit", "data-analysis"]),
  stub(9, "visual-warnings", "Visual Warnings & Sensors", "Display conditional warnings and use push buttons to read sensor values.", ["pc-microbit", "algo-selection"]),
  stub(10, "evaluation", "Evaluation Sheet", "Test your knowledge across the whole chapter — recall, script reading and mini-builds.", ["pc-microbit"]),
];
