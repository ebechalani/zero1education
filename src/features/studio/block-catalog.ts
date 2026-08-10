import type { Block, BlockType } from "@/types/content";

/**
 * The palette of blocks an author can insert, plus factories that produce a
 * sensible starting block for each type. Adding a block type to the platform =
 * one entry here + one case in BlockRenderer.
 */

export interface BlockKindMeta {
  type: BlockType;
  label: string;
  /** lucide icon name */
  icon: string;
  group: "content" | "interactive" | "structure";
  blurb: string;
}

export const BLOCK_KINDS: BlockKindMeta[] = [
  // Content
  { type: "heading", label: "Heading", icon: "Heading2", group: "content", blurb: "Section title" },
  { type: "text", label: "Text", icon: "Type", group: "content", blurb: "Paragraphs, lists, bold and code" },
  { type: "callout", label: "Callout", icon: "MessageSquareWarning", group: "content", blurb: "Story, tip, warning or fact box" },
  { type: "definition", label: "Definition", icon: "BookMarked", group: "content", blurb: "Key term with example" },
  { type: "image", label: "Illustration", icon: "Image", group: "content", blurb: "Built-in curriculum diagram" },
  { type: "code", label: "Code", icon: "Code2", group: "content", blurb: "Code or pseudocode sample" },
  { type: "flow", label: "Flow diagram", icon: "GitBranch", group: "content", blurb: "START → steps → END" },
  { type: "video", label: "Video", icon: "Play", group: "content", blurb: "Embedded video" },
  { type: "teacherNote", label: "Teacher note", icon: "GraduationCap", group: "content", blurb: "Only visible to teachers" },
  // Structure
  { type: "tabs", label: "Tabs", icon: "Columns3", group: "structure", blurb: "Grouped content in tabs" },
  { type: "accordion", label: "Accordion", icon: "ChevronsUpDown", group: "structure", blurb: "Expandable sections" },
  // Interactive
  { type: "activity", label: "Activity", icon: "MousePointerClick", group: "interactive", blurb: "One interactive question" },
  { type: "quiz", label: "Quiz / Checkpoint", icon: "Target", group: "interactive", blurb: "A set of graded questions" },
  { type: "lab", label: "ZERO1 Lab", icon: "FlaskConical", group: "interactive", blurb: "Embed an interactive lab" },
  { type: "challenge", label: "Challenge", icon: "Zap", group: "interactive", blurb: "Bonus task worth extra XP" },
  { type: "project", label: "Project", icon: "Rocket", group: "interactive", blurb: "Brief students submit work against" },
  { type: "reflection", label: "Reflection", icon: "MessageSquareQuote", group: "interactive", blurb: "Open prompt saved to the portfolio" },
];

let seq = 0;
const nid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function createBlock(type: BlockType): Block {
  const id = nid("b");
  switch (type) {
    case "heading":
      return { id, type, text: "New section", level: 2 };
    case "text":
      return { id, type, md: "Write the lesson content here. Use **bold**, *italic*, `code`, and - bullet lists." };
    case "callout":
      return { id, type, variant: "tip", title: "Tip", md: "Something worth highlighting." };
    case "definition":
      return { id, type, term: "New term", definition: "What it means, in student language.", example: "" };
    case "image":
      return { id, type, illustrationId: "computer-anatomy", alt: "Diagram", caption: "" };
    case "code":
      return { id, type, language: "pseudocode", code: "START\n  do something\nEND", caption: "" };
    case "flow":
      return {
        id,
        type,
        steps: [
          { id: nid("s"), label: "START" },
          { id: nid("s"), label: "First step" },
          { id: nid("s"), label: "END" },
        ],
      };
    case "video":
      return { id, type, src: "", caption: "Video" };
    case "teacherNote":
      return { id, type, md: "Guidance for the teacher — never shown to students." };
    case "tabs":
      return {
        id,
        type,
        tabs: [
          { id: nid("t"), label: "Tab one", blocks: [{ id: nid("b"), type: "text", md: "First tab content." }] },
          { id: nid("t"), label: "Tab two", blocks: [{ id: nid("b"), type: "text", md: "Second tab content." }] },
        ],
      };
    case "accordion":
      return {
        id,
        type,
        items: [
          { id: nid("a"), title: "First item", blocks: [{ id: nid("b"), type: "text", md: "Hidden until opened." }] },
        ],
      };
    case "activity":
      return {
        id,
        type,
        activity: {
          id: nid("act"),
          kind: "mcq",
          prompt: "Ask the question here.",
          options: [
            { id: "a", text: "First option" },
            { id: "b", text: "Second option" },
            { id: "c", text: "Third option" },
          ],
          answerId: "a",
          hints: ["A nudge that doesn't give it away."],
          explanation: "Explain why the answer is right.",
        },
      };
    case "quiz":
      return {
        id,
        type,
        title: "Checkpoint",
        passPct: 70,
        questions: [
          {
            id: nid("q"),
            kind: "mcq",
            prompt: "First checkpoint question.",
            options: [
              { id: "a", text: "Correct answer" },
              { id: "b", text: "Distractor" },
            ],
            answerId: "a",
            explanation: "Why this is correct.",
          },
        ],
      };
    case "lab":
      return { id, type, labId: "binary", title: "ZERO1 Lab", brief: "What students should do in the lab." };
    case "challenge":
      return {
        id,
        type,
        challenge: {
          id: nid("ch"),
          title: "Challenge",
          brief: "Set up the challenge scenario.",
          xp: 30,
          activity: {
            id: nid("act"),
            kind: "mcq",
            prompt: "The challenge question.",
            options: [
              { id: "a", text: "Right" },
              { id: "b", text: "Wrong" },
            ],
            answerId: "a",
            explanation: "The reasoning.",
          },
        },
      };
    case "project":
      return {
        id,
        type,
        project: {
          id: nid("prj"),
          title: "New project",
          brief: "What students will create.",
          deliverables: ["First deliverable", "Second deliverable"],
          submitTypes: ["text"],
          xp: 40,
        },
      };
    case "reflection":
      return { id, type, prompt: "What surprised you in this mission?", placeholder: "I used to think… now I know…" };
  }
}

export function blockSummary(block: Block): string {
  switch (block.type) {
    case "heading":
      return block.text;
    case "text":
      return block.md.slice(0, 80);
    case "callout":
      return block.title ?? block.variant;
    case "definition":
      return block.term;
    case "image":
      return block.alt;
    case "code":
      return block.language;
    case "flow":
      return `${block.steps.length} steps`;
    case "video":
      return block.caption ?? "Video";
    case "teacherNote":
      return block.md.slice(0, 60);
    case "tabs":
      return block.tabs.map((t) => t.label).join(" · ");
    case "accordion":
      return block.items.map((i) => i.title).join(" · ");
    case "activity":
      return `${block.activity.kind.toUpperCase()} — ${block.activity.prompt.slice(0, 60)}`;
    case "quiz":
      return `${block.questions.length} questions`;
    case "lab":
      return block.labId;
    case "challenge":
      return block.challenge.title;
    case "project":
      return block.project.title;
    case "reflection":
      return block.prompt.slice(0, 60);
  }
}
