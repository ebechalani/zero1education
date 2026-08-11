import type { Block, BlockType } from "@/types/content";

/**
 * The reader separates a lesson into what you *read* and what you *do*.
 *
 * The mission player interleaves both and gates them stage by stage, which is
 * right for working through a lesson. It is wrong for reviewing a book: an
 * author or teacher needs to read a chapter end to end without answering
 * anything, and a student revising wants the explanation, not the quiz.
 */

const INTERACTIVE: BlockType[] = [
  "activity",
  "quiz",
  "lab",
  "challenge",
  "project",
  "reflection",
];

export function isInteractive(block: Block): boolean {
  return INTERACTIVE.includes(block.type);
}

export function readableBlocks(blocks: Block[]): Block[] {
  return blocks.filter((b) => !isInteractive(b));
}

export function interactiveBlocks(blocks: Block[]): Block[] {
  return blocks.filter(isInteractive);
}

export interface InteractiveMeta {
  label: string;
  /** lucide icon name */
  icon: string;
  /** What the student actually does — never "answer a quiz" unless it is one */
  verb: string;
  tone: "brand" | "signal" | "bit" | "violet" | "mint";
}

export function describeInteractive(block: Block): InteractiveMeta {
  switch (block.type) {
    case "activity":
      switch (block.activity.kind) {
        case "classify":
          return { label: "Sorting activity", icon: "Boxes", verb: "Drag each item into the right group", tone: "signal" };
        case "sort":
          return { label: "Ordering activity", icon: "ListOrdered", verb: "Put the steps in the correct order", tone: "signal" };
        case "match":
          return { label: "Matching activity", icon: "ArrowLeftRight", verb: "Match each item to its pair", tone: "signal" };
        case "fillblank":
          return { label: "Fill in the blanks", icon: "TextCursorInput", verb: "Complete the sentence", tone: "signal" };
        case "multi":
          return { label: "Select all that apply", icon: "ListChecks", verb: "Choose every correct answer", tone: "brand" };
        case "truefalse":
          return { label: "True or false", icon: "ToggleLeft", verb: "Decide whether the statement holds", tone: "brand" };
        default:
          return { label: "Question", icon: "CircleHelp", verb: "Pick the right answer", tone: "brand" };
      }
    case "quiz":
      return {
        label: "Checkpoint",
        icon: "Target",
        verb: `${block.questions.length} questions covering the whole lesson`,
        tone: "brand",
      };
    case "lab":
      return { label: "ZERO1 Lab", icon: "FlaskConical", verb: "Open the simulation and build it yourself", tone: "signal" };
    case "challenge":
      return { label: "Challenge", icon: "Zap", verb: block.challenge.brief, tone: "bit" };
    case "project":
      return { label: "Project", icon: "Rocket", verb: block.project.brief, tone: "mint" };
    case "reflection":
      return { label: "Reflection", icon: "MessageSquareQuote", verb: block.prompt, tone: "violet" };
    default:
      return { label: "Activity", icon: "MousePointerClick", verb: "Try it", tone: "brand" };
  }
}
