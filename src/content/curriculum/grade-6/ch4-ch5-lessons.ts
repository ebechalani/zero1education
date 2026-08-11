import type { Difficulty, Lesson } from "@/types/content";

/**
 * Grade 6 · printed 2023 edition — Chapter 4 (Robotics with mBot2) and
 * Chapter 5 (Scratch 3.0).
 *
 * FIDELITY NOTE — everything factual here is taken from the author's printed
 * chapters, not invented:
 *   • `title`   — the book's own lesson heading.
 *   • `tagline` — the book's own section heading for the lesson's project.
 *   • `objectives[0]` (and `[1]` where the book prints two) — VERBATIM from the
 *     printed "Objective(s)" box. Any further entries are the lesson's own
 *     numbered steps / challenges, restated from the book's pages — they are
 *     the concrete things the student is asked to do, with the book's values
 *     (70 cm, 30 cm, 90°, 10 s, 20 s, 6 s, x=19 y=33, direction 45…) kept exact.
 *
 * Robot platform: Chapter 4 uses the **mBot2 with its CyberPi controller**,
 * programmed in **mBlock** (the Scratch-based software from Makeblock). It is
 * not the original mBot and not a micro:bit — hence `rob-build`, never
 * `pc-microbit`, in the skill lists below.
 *
 * Interactive missions are authored progressively in ZERO1 Studio, so every
 * lesson ships here as status "coming-soon" with empty `stages`.
 */

interface Stub {
  n: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  objectives: string[];
  skillIds: string[];
  minutes: number;
  difficulty: Difficulty;
  icon: string;
}

const make = (prefix: string, unitId: string) => (s: Stub): Lesson => ({
  id: `g6-${prefix}-${s.n.toString().padStart(2, "0")}`,
  slug: s.slug,
  gradeId: "g6",
  unitId,
  order: s.n,
  title: s.title,
  tagline: s.tagline,
  description: s.description,
  objectives: s.objectives,
  skillIds: s.skillIds,
  estimatedMinutes: s.minutes,
  difficulty: s.difficulty,
  icon: s.icon,
  status: "coming-soon",
  stages: [],
});

const rb = make("rb", "g6-robotics");
const sc = make("sc", "g6-scratch");

// ── Chapter 4 · Robotics with mBot2 (CyberPi + mBlock) — 7 lessons ──────────

export const roboticsLessons: Lesson[] = [
  rb({
    n: 1,
    slug: "robot-designed-for-the-future",
    title: "A Robot Designed for the Future",
    tagline: "Robots in real life",
    description:
      "Meet the mBot2 and its CyberPi controller, and open mBlock — the Scratch-based software used to program the robot.",
    objectives: [
      "Discovering the robot mBot2",
      "Exploring the components of the CyberPi",
      "List places where robots are used to perform automated tasks, and name the 5 components every robot is formed of",
      "Research the different components of the CyberPi and examine them on the board",
      "Recognise the mBlock welcome screen and the 5 categories of blocks used to control the CyberPi",
      "Challenge: create your own mission to record your voice, using buttons A and B to start and stop the recording",
    ],
    skillIds: ["rob-build", "prog-blocks", "sys-hardware"],
    minutes: 45,
    difficulty: "intro",
    icon: "Bot",
  }),
  rb({
    n: 2,
    slug: "controlling-mbot2-movement",
    title: "Controlling the Movement of the mBot2 Robot",
    tagline: "Driving through the maze with the joystick",
    description:
      "Add the mBot2 chassis to mBlock, connect the robot to the computer, then drive it through a maze with the CyberPi joystick.",
    objectives: [
      "Moving a robot into a maze",
      'Controlling the mission of mBot2 using the blocks "forever" and "if"',
      "Add the mBot2 shield to mBlock and examine the new block category it adds",
      "Connect the mBot2 to the computer with the USB cable or the Bluetooth dongle to download the mission",
      "Program the joystick: pulled forward → move 70 cm forward; pulled left → turn 90 degrees left; pulled right → turn 90 degrees right",
      'At the roundabout, make the robot play the voice "I have to wait for the green light to take the right exit"',
      'Explain what the "forever" block and the "if" block each do inside the mission',
    ],
    skillIds: ["rob-build", "prog-blocks", "algo-selection", "algo-iteration"],
    minutes: 45,
    difficulty: "core",
    icon: "Navigation",
  }),
  rb({
    n: 3,
    slug: "world-of-iot-smart-recycle-bin",
    title: "Discovering the World of IoT",
    tagline: "A smart recycle bin",
    description:
      "Build a smart recycle bin: the Ultrasonic sensor spots the trash and the Colour sensor decides which bin the mBot2 delivers it to.",
    objectives: [
      "Creating a smart trash bin",
      "Using the Ultrasonic sensor and the Colour sensor",
      "Define the Internet of Things as a network of physical devices, vehicles and appliances embedded with sensors that collect and exchange data over the internet",
      "List items that can and cannot be recycled",
      "Detect the trash with the Ultrasonic sensor when it is less than 30 cm away, then activate the Colour sensor to read its colour",
      "If the colour is White the trash is recycled: turn 90 degrees right, then move forward 30 cm to the recycled bin",
      "If the colour is Red the trash is not recycled: turn 90 degrees left, then move forward 30 cm to the non-recycled bin",
      'Explain the role of the "forever" block, of the "if" block, of its condition and of the inner "if" block',
      "Challenge: propose messages, sounds and light effects to make the Smart Trash Bin more attractive",
    ],
    skillIds: [
      "rob-build",
      "prog-blocks",
      "algo-selection",
      "sys-io",
      "net-internet",
    ],
    minutes: 50,
    difficulty: "core",
    icon: "Recycle",
  }),
  rb({
    n: 4,
    slug: "discovering-the-smart-home",
    title: "Discovering the Smart Home",
    tagline: "An automated rolling shutter",
    description:
      "Use the CyberPi light sensor and the mBot2 motor to close a window's rolling shutter automatically — or by hand with button A.",
    objectives: [
      "Creating a smart home",
      "Using the light sensor to close the shutter store",
      "Describe a smart home as a home equipped with internet-connected devices that automate household activities for convenience, energy efficiency, comfort and security",
      "Research the advantages of a smart home, especially when it comes to electricity bills, and write your own summary",
      "Decide when the rolling shutter should close: manually by pressing button A, or automatically from the light reading",
      "Use the CyberPi light sensor to measure light intensity and the mBot2 motor as the rolling-shutter motor",
      "Close the shutter in 3 cases: light intensity too low (it is night), light intensity too high (the sun will damage the furniture), or button A pressed — the motor makes 2 rotations",
      'Use the "or" block and the "ambient light intensity" block, check the current ambient light, then set your own threshold values',
    ],
    skillIds: ["rob-build", "prog-blocks", "algo-selection", "sys-io"],
    minutes: 50,
    difficulty: "core",
    icon: "House",
  }),
  rb({
    n: 5,
    slug: "smart-home-security-multitasking",
    title: "In a Smart Home, Security Is a Must",
    tagline: "A multitasking mission for more control",
    description:
      "Make the rolling shutter safe: a second task runs at the same time and stops the shutter the moment the Ultrasonic sensor detects an object.",
    objectives: [
      "Controlling the rolling shutter",
      "Introducing the multitasking mission",
      "Explain why security matters in a smart home (a water pump that will not stop, a hand left outside a closing shutter)",
      "Read the script from the previous lesson and explain the behaviour of the mBot2 when the mission is launched",
      "Choose the sensor that can stop the rolling shutter when an object is detected outside the window",
      "Build a multitasking mission where both tasks run forever when the green flag is pressed — Task 1: close the shutter if one of the three conditions is valid; Task 2: stop the shutter immediately if an object is detected",
      "Challenge 1: move forward for 2 seconds if button A is pressed OR a distance less than 5 is detected, move backward if button B is pressed, and stop at any moment if the joystick is pulled UP",
      "Challenge 2: display the colours read by the colour sensor on button A, display the ultrasonic distance on button B, and play music at any moment if the light sensor detects an intensity less than 5%",
    ],
    skillIds: [
      "rob-build",
      "prog-blocks",
      "algo-selection",
      "ct-decompose",
      "ps-strategy",
    ],
    minutes: 50,
    difficulty: "stretch",
    icon: "ShieldCheck",
  }),
  rb({
    n: 6,
    slug: "autonomous-cars",
    title: "Autonomous Cars Are on the Way!",
    tagline: "Autonomous cars into action",
    description:
      "Turn the mBot2 into an autonomous car that drives the mapped route from checkpoint O to point G, then finds its way back.",
    objectives: [
      "Controlling autonomous cars",
      "Mastering multitasking missions",
      "Explain that an autonomous car navigates without human intervention using sensors, cameras, radar systems and artificial intelligence",
      "List scenarios where the car should stop while moving on its path",
      "Place the mBot2 on checkpoint O and create the mission to make it reach point G, following the distances marked on the map",
      "Scenario 1 — no obstacles on the path: when button A is pressed the car moves forward to its destination with the correct movements and rotations",
      "When button B is pressed, complete the mission so the car returns to its starting point",
      "Display messages on the mBot2 screen and animate the LEDs to create interactivity",
    ],
    skillIds: [
      "rob-build",
      "prog-blocks",
      "algo-sequence",
      "ct-decompose",
      "ps-strategy",
    ],
    minutes: 55,
    difficulty: "stretch",
    icon: "Car",
  }),
  rb({
    n: 7,
    slug: "counting-clients",
    title: "Counting Clients",
    tagline: "A counter at the entrance of the mall",
    description:
      "Place the Ultrasonic sensor at a mall entrance and use a variable to count every client who walks in, with a daily reset on button B.",
    objectives: [
      "Using the Ultrasonic sensor to count clients entering a mall",
      "Explain why counting the flow of clients over a period helps in taking decisions about promotions to boost sales",
      'Create a new variable called "counter" and examine the blocks that control it',
      "Each time the Ultrasonic sensor detects a person, add 1 to the counter and display the result on the screen",
      "Reset the counter every morning by pressing button B",
      'Extra challenge: use blocks from the "sensing" category to display "Target reached" when 10 clients per minute is reached',
    ],
    skillIds: ["rob-build", "prog-blocks", "algo-selection", "data-analysis"],
    minutes: 45,
    difficulty: "core",
    icon: "Users",
  }),
];

// ── Chapter 5 · Scratch 3.0 — 7 lessons ────────────────────────────────────

export const scratchLessons: Lesson[] = [
  sc({
    n: 1,
    slug: "story-adding-backdrops",
    title: "Creating a Story: Adding the Backdrops",
    tagline: "The elements of a story",
    description:
      "Learn the three elements every story is made of, then set the scenes of a Scratch story by adding and deleting backdrops.",
    objectives: [
      "Creating a story: Adding the Backdrops to the story",
      "Identify the 3 elements of a story: the Background of the scene, the Characters (a person or an object) and the Script — narrative or dialogue",
      'Change the white background with the button "Choose a Backdrop" and its four options: Choose a Backdrop, Paint, Surprise and Upload Backdrop',
      "Add 2 backdrops to the blank one, then select the white backdrop and delete it",
      'Read the story script: on the Bedroom backdrop the Sprite wakes up and says "Good morning, today is a nice weather for a walk in the desert"; after 10 seconds the Desert backdrop is displayed and the Sprite says "ahhhh, I forgot my bottle of water at home"',
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["prog-blocks", "cr-projects", "algo-sequence"],
    minutes: 40,
    difficulty: "intro",
    icon: "BookOpen",
  }),
  sc({
    n: 2,
    slug: "story-programming-time-frame",
    title: "Creating a Story: Programming the Time Frame for the Backdrops",
    tagline: "A flying bird in the desert",
    description:
      "Program the Stage so each backdrop lasts 10 seconds, make the Sprite speak on cue, then add a Parrot that answers the Cat.",
    objectives: [
      "Creating a story: Programming the time frame for the Backdrops",
      "Click on the heading Stage, select the Bedroom backdrop and open Code",
      "Use a block from the Event category to start the script and a block from the Looks category to switch backdrop, so the first backdrop is displayed for 10 seconds",
      "Program the second backdrop so it is displayed 10 seconds after the first one, then examine the final Script for the backdrops",
      "Describe what happens once the green flag is pressed",
      "Select the Sprite and use Event and Looks blocks so it displays each message at the appropriate time",
      'Add the Sprite Parrot so it appears and says "No worries, I will get you the bottle" once the Sprite Cat asks for the bottle of water',
    ],
    skillIds: ["prog-blocks", "algo-sequence", "cr-projects"],
    minutes: 45,
    difficulty: "core",
    icon: "Bird",
  }),
  sc({
    n: 3,
    slug: "documentary-renewable-energy",
    title: "Creating a Documentary: Renewable Energy Resources",
    tagline: "Awareness documentary on pollution",
    description:
      "Build an awareness documentary about renewable energy, with an imported backdrop per source and your own recorded voice-over.",
    objectives: [
      "Creating a documentary: Renewable energy resources",
      "Explain why fossil fuels are a problem — they are a finite resource, they pollute air, water and soil and produce greenhouse gases — and why renewable energy is a cleaner alternative",
      "Research and name the different sources of renewable energy, then import a picture from the Internet as a Backdrop for each source",
      "Record your voice to explain the concept of each renewable energy for 2 minutes",
      "Add the Sprite Avery, click on Sounds, then Choose a sound → Record, and save the recording to the library of sounds",
      'Build the script so that on the green flag each Backdrop is displayed for 20 seconds while the appropriate Sprite moves on the stage and the "play sound" block plays the matching recording',
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["prog-blocks", "cr-projects", "algo-sequence"],
    minutes: 50,
    difficulty: "core",
    icon: "Mic",
  }),
  sc({
    n: 4,
    slug: "animation-3r-recycling",
    title: "Creating an Animation: 3R for Recycling",
    tagline: "Awareness animation for recycling",
    description:
      "Draw your own recycling sprites, give each at least three costumes, and animate them so a new sprite appears every 6 seconds.",
    objectives: [
      "Drawing a new Sprite",
      "Creating costumes for the Sprite",
      "Explain Reduce, Reuse, Recycle as three ways to eliminate waste and protect the environment",
      "Research and name the different items that could be recycled",
      "Create a new Sprite by clicking respectively on Choose a Sprite → Paint, then draw it with the paint tools",
      "Duplicate then edit the costumes so each recycled item has at least 3 costumes, then create the other Sprites the same way",
      'Add the Sprite Avery and build the Script with the "next costume" block so the animation displays a new Sprite every 6 seconds while playing its costumes',
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["prog-blocks", "cr-projects", "algo-iteration"],
    minutes: 50,
    difficulty: "core",
    icon: "Paintbrush",
  }),
  sc({
    n: 5,
    slug: "creating-a-game-1",
    title: "Creating a Game (1)",
    tagline: "Who will win the game?",
    description:
      "Start a bounce game: a backdrop with a red line, a Ball sprite and a hand-drawn horizontal bar that follows the mouse.",
    objectives: [
      "Creating a game (1)",
      "Describe how the game works: the ball moves all the time with random movements, the horizontal bar moves with the mouse, the ball bounces when it touches the bar, and the game ends if the ball touches the red line",
      "Step 1: choose or draw the Backdrop and add a red line to it",
      "Step 2: add the Ball Sprite with its different costumes, and draw the black horizontal bar Sprite with the editing tools",
      "Step 3: program the horizontal bar — inside a Forever loop, use a block from the Sensing category so the bar follows the mouse movements",
      "Run the Script and check how the black horizontal bar moves with the mouse",
    ],
    skillIds: ["prog-blocks", "algo-iteration", "cr-projects"],
    minutes: 50,
    difficulty: "core",
    icon: "Gamepad2",
  }),
  sc({
    n: 6,
    slug: "creating-a-game-2",
    title: "Creating a Game (2)",
    tagline: "And the winner is!!!",
    description:
      "Finish the game: send the ball bouncing in random directions, count the score with a variable and announce the winner.",
    objectives: [
      "Creating a game (2)",
      "Recall the previous lesson: a Backdrop with a red line at the bottom, 2 Sprites (a Ball and a horizontal bar), and the Script that moves the bar with the mouse",
      "Step 4: start the game with the ball positioned at x=19, y=33 and change its direction to 45 to make diagonal movements",
      "Inside a forever loop, place the movement block and add the two <if...then> blocks, then describe the role of each of them",
      'Step 5: from the Variables category, click Make a variable, name it "Count", and add the Script to the Ball Sprite to display the score',
      "Step 6: look at the Script and describe the modifications needed to display a message announcing that the top score is hit",
    ],
    skillIds: ["prog-blocks", "algo-selection", "algo-iteration", "cr-projects"],
    minutes: 55,
    difficulty: "stretch",
    icon: "Trophy",
  }),
  sc({
    n: 7,
    slug: "drawing-shapes-in-scratch",
    title: "Drawing Shapes in Scratch",
    tagline: "Tinker",
    description:
      "Reproduce a set of geometric shapes using the Pen blocks together with the Repeat block.",
    objectives: [
      "Drawing shapes in Scratch",
      "Use the Pen and the Repeat blocks to reproduce the shapes shown in the book",
      "Spot the part of each shape that repeats, so it can be drawn with a Repeat block instead of copied blocks",
      "Watch the lesson tutorial in the Digital Resources tab on zero1.education",
    ],
    skillIds: ["prog-blocks", "algo-iteration", "ct-patterns"],
    minutes: 45,
    difficulty: "stretch",
    icon: "Shapes",
  }),
];

// ── Unit-card summaries ────────────────────────────────────────────────────

export const roboticsChapterSummary =
  "Chapter 4 programs the mBot2 robot and its CyberPi controller in mBlock, the Scratch-based software used to control the robot. Seven lessons take students from discovering the robot's components and driving it through a maze with the joystick, to real IoT builds: a smart recycle bin using the Ultrasonic and Colour sensors, an automatic rolling shutter driven by the light sensor, an autonomous car following a mapped route, and a client counter at a mall entrance. The programming ideas grow with the projects — the \"forever\" and \"if\" blocks, conditions combined with \"or\", variables, and multitasking missions that run two tasks at the same time for safety.";

export const scratchChapterSummary =
  "Chapter 5 builds complete Scratch 3.0 projects across seven lessons, each backed by a video tutorial in the Digital Resources tab on zero1.education. Students first create a story — backdrops, sprites, timed backdrop switches and dialogue — then two awareness projects: a documentary on renewable energy with their own recorded voice-over, and a recycling animation with hand-drawn sprites and costumes. The chapter closes with a two-part bounce game (mouse-controlled bar, a ball moving in random directions, a Count variable and a winning message) and a Pen-and-Repeat shape-drawing challenge.";
