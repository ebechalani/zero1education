import type { Skill, SkillCategory } from "@/types/content";

export const SKILL_CATEGORIES: Record<
  SkillCategory,
  { label: string; icon: string }
> = {
  "digital-literacy": { label: "Digital Literacy", icon: "MousePointerClick" },
  "computer-systems": { label: "Computer Systems", icon: "Cpu" },
  algorithms: { label: "Algorithms", icon: "GitBranch" },
  programming: { label: "Programming", icon: "Code2" },
  "computational-thinking": { label: "Computational Thinking", icon: "Brain" },
  data: { label: "Data", icon: "Database" },
  networks: { label: "Networks", icon: "Network" },
  cybersecurity: { label: "Cybersecurity", icon: "ShieldCheck" },
  web: { label: "Web Development", icon: "Globe" },
  ai: { label: "Artificial Intelligence", icon: "Sparkles" },
  robotics: { label: "Robotics", icon: "Bot" },
  "physical-computing": { label: "Physical Computing", icon: "CircuitBoard" },
  creativity: { label: "Creativity", icon: "Palette" },
  collaboration: { label: "Collaboration", icon: "Users" },
  "problem-solving": { label: "Problem Solving", icon: "Puzzle" },
};

/**
 * The ZERO1 competency framework. Grade 6 MVP exercises a subset;
 * the taxonomy spans G0–12 so the Digital Passport carries across years.
 */
export const SKILLS: Skill[] = [
  // Computer systems
  { id: "sys-hardware", title: "Hardware Components", category: "computer-systems", blurb: "Identify the parts inside a computer and what each does." },
  { id: "sys-io", title: "Input & Output", category: "computer-systems", blurb: "Classify devices by how data enters and leaves a system." },
  { id: "sys-software", title: "Software & Systems", category: "computer-systems", blurb: "Distinguish system software from applications." },
  // Data
  { id: "data-binary", title: "Binary Representation", category: "data", blurb: "Convert between binary and decimal and explain why computers use bits." },
  { id: "data-units", title: "Data Units", category: "data", blurb: "Order bits, bytes, KB, MB, GB and TB by size." },
  { id: "data-analysis", title: "Data Analysis", category: "data", blurb: "Organize and read data in tables and charts." },
  // Algorithms
  { id: "algo-sequence", title: "Sequencing", category: "algorithms", blurb: "Order precise steps so a computer can follow them." },
  { id: "algo-selection", title: "Selection", category: "algorithms", blurb: "Use conditions to make programs decide." },
  { id: "algo-iteration", title: "Iteration", category: "algorithms", blurb: "Use loops to repeat instructions efficiently." },
  { id: "algo-debug", title: "Debugging", category: "algorithms", blurb: "Find and fix errors in a sequence of instructions." },
  // Computational thinking
  { id: "ct-decompose", title: "Decomposition", category: "computational-thinking", blurb: "Break big problems into solvable parts." },
  { id: "ct-patterns", title: "Pattern Recognition", category: "computational-thinking", blurb: "Spot similarities that simplify problems." },
  { id: "ct-abstraction", title: "Abstraction", category: "computational-thinking", blurb: "Focus on what matters, hide what doesn't." },
  // Networks
  { id: "net-devices", title: "Network Devices", category: "networks", blurb: "Know what routers, switches and servers do." },
  { id: "net-internet", title: "How the Internet Works", category: "networks", blurb: "Explain how data travels between devices as packets." },
  // Cybersecurity
  { id: "cyber-phishing", title: "Threat Recognition", category: "cybersecurity", blurb: "Spot phishing, scams and suspicious links." },
  { id: "cyber-passwords", title: "Account Security", category: "cybersecurity", blurb: "Build strong passwords and protect accounts." },
  { id: "cyber-privacy", title: "Privacy & Footprint", category: "cybersecurity", blurb: "Control what you share and where it goes." },
  // Programming
  { id: "prog-blocks", title: "Block Programming", category: "programming", blurb: "Build programs with visual blocks (Scratch, MakeCode)." },
  { id: "prog-python", title: "Python", category: "programming", blurb: "Write and debug Python programs." },
  // Digital literacy
  { id: "dl-files", title: "Files & Apps", category: "digital-literacy", blurb: "Manage files, folders and applications confidently." },
  { id: "dl-citizenship", title: "Digital Citizenship", category: "digital-literacy", blurb: "Act safely, kindly and responsibly online." },
  // Robotics / physical computing
  { id: "rob-build", title: "Robot Building", category: "robotics", blurb: "Assemble and configure robots and sensors." },
  { id: "pc-microbit", title: "micro:bit", category: "physical-computing", blurb: "Program the micro:bit's LEDs, buttons and sensors." },
  // Web
  { id: "web-html", title: "HTML & CSS", category: "web", blurb: "Structure and style web pages." },
  // Cross-cutting
  { id: "ps-strategy", title: "Solution Strategy", category: "problem-solving", blurb: "Choose and adapt strategies when solving challenges." },
  { id: "cr-projects", title: "Creative Projects", category: "creativity", blurb: "Turn ideas into finished digital work." },
];

export const skillById = new Map(SKILLS.map((s) => [s.id, s]));
