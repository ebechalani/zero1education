/**
 * ZERO1 content schema — the canonical shape of all curriculum.
 * Lessons are trees of typed blocks organized into mission stages.
 * Everything renders through engines (BlockRenderer / ActivityPlayer / LabShell);
 * curriculum is data, never UI.
 */

// ── Taxonomy ────────────────────────────────────────────────────────────────

export type World = "explorer" | "builder" | "creator" | "innovator";

export type StageKind =
  | "discover"
  | "learn"
  | "tryit"
  | "lab"
  | "challenge"
  | "checkpoint"
  | "create";

export type Difficulty = "intro" | "core" | "stretch";

export type ContentStatus = "published" | "draft" | "coming-soon";

export type LabId =
  | "binary"
  | "computer"
  | "algorithm"
  | "network"
  | "cyber"
  | "logic"
  | "web"
  | "python"
  | "database";

// ── Activities (one engine for every interaction) ───────────────────────────

export type ActivityKind =
  | "mcq"
  | "multi"
  | "truefalse"
  | "match"
  | "sort"
  | "classify"
  | "fillblank";

export interface ActivityOption {
  id: string;
  text: string;
}

interface ActivityBase {
  id: string;
  kind: ActivityKind;
  /** May contain inline markdown: **bold**, `code`, *italic* */
  prompt: string;
  skillIds?: string[];
  /** Revealed one at a time, never before the first attempt */
  hints?: string[];
  /** Shown only after completion (correct or attempts exhausted) */
  explanation?: string;
  xp?: number;
}

export interface McqActivity extends ActivityBase {
  kind: "mcq";
  options: ActivityOption[];
  answerId: string;
}

export interface MultiActivity extends ActivityBase {
  kind: "multi";
  options: ActivityOption[];
  answerIds: string[];
}

export interface TrueFalseActivity extends ActivityBase {
  kind: "truefalse";
  answer: boolean;
}

export interface MatchActivity extends ActivityBase {
  kind: "match";
  pairs: { id: string; left: string; right: string }[];
}

export interface SortActivity extends ActivityBase {
  kind: "sort";
  items: { id: string; text: string }[];
  correctOrder: string[];
  /** Labels for the two ends of the sequence, e.g. ["First", "Last"] */
  endLabels?: [string, string];
}

export interface ClassifyActivity extends ActivityBase {
  kind: "classify";
  categories: { id: string; label: string }[];
  items: { id: string; text: string; categoryId: string }[];
}

export interface FillBlankActivity extends ActivityBase {
  kind: "fillblank";
  /** Template with [[blankId]] markers */
  template: string;
  /** blankId → accepted answers (case-insensitive) */
  blanks: Record<string, string[]>;
  /** Optional word bank; when present blanks are filled by choosing chips */
  bank?: string[];
}

export type Activity =
  | McqActivity
  | MultiActivity
  | TrueFalseActivity
  | MatchActivity
  | SortActivity
  | ClassifyActivity
  | FillBlankActivity;

// ── Labs ────────────────────────────────────────────────────────────────────

export interface BinaryLabConfig {
  bits?: 4 | 8;
  /** In target mode students must switch bits to reach these numbers */
  targets?: number[];
  mode?: "free" | "target";
}

export interface AlgorithmLabConfig {
  /** Grid is size × size; origin top-left */
  size?: number;
  start: { x: number; y: number; dir: "up" | "right" | "down" | "left" };
  goal: { x: number; y: number };
  obstacles?: { x: number; y: number }[];
  /** Par number of blocks for full XP */
  par?: number;
}

export interface NetworkLabConfig {
  /** Devices required in the build for validation */
  required?: { device: string; count: number }[];
  brief?: string;
}

export interface CyberLabConfig {
  scenarioIds?: string[];
}

export type LabConfig =
  | BinaryLabConfig
  | AlgorithmLabConfig
  | NetworkLabConfig
  | CyberLabConfig
  | Record<string, never>;

// ── Projects & challenges ───────────────────────────────────────────────────

export type SubmitType = "text" | "link" | "file" | "image" | "code";

export interface Project {
  id: string;
  title: string;
  brief: string;
  deliverables: string[];
  submitTypes: SubmitType[];
  rubric?: { criterion: string; description: string }[];
  xp?: number;
}

export interface Challenge {
  id: string;
  title: string;
  brief: string;
  /** A challenge wraps either an activity or a lab task */
  activity?: Activity;
  labId?: LabId;
  labConfig?: LabConfig;
  xp: number;
}

// ── Blocks ──────────────────────────────────────────────────────────────────

interface BlockBase {
  id: string;
}

export interface TextBlock extends BlockBase {
  type: "text";
  md: string;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  text: string;
  level?: 2 | 3;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  /** ID of a built-in SVG illustration (see features/illustrations) */
  illustrationId: string;
  alt: string;
  caption?: string;
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  variant: "info" | "tip" | "warning" | "story" | "fact";
  title?: string;
  md: string;
}

export interface DefinitionBlock extends BlockBase {
  type: "definition";
  term: string;
  definition: string;
  example?: string;
}

export interface TeacherNoteBlock extends BlockBase {
  type: "teacherNote";
  md: string;
}

export interface TabsBlock extends BlockBase {
  type: "tabs";
  tabs: { id: string; label: string; blocks: Block[] }[];
}

export interface AccordionBlock extends BlockBase {
  type: "accordion";
  items: { id: string; title: string; blocks: Block[] }[];
}

/** Simple flow diagram: START → steps → END */
export interface FlowBlock extends BlockBase {
  type: "flow";
  steps: { id: string; label: string; detail?: string; branch?: string }[];
}

export interface CodeBlock extends BlockBase {
  type: "code";
  language: string;
  code: string;
  caption?: string;
}

export interface VideoBlock extends BlockBase {
  type: "video";
  src: string;
  caption?: string;
}

export interface ActivityBlock extends BlockBase {
  type: "activity";
  activity: Activity;
}

export interface QuizBlock extends BlockBase {
  type: "quiz";
  title?: string;
  questions: Activity[];
  /** Mastery threshold as percent; default 70 */
  passPct?: number;
}

export interface LabBlock extends BlockBase {
  type: "lab";
  labId: LabId;
  title?: string;
  brief?: string;
  config?: LabConfig;
}

export interface ChallengeBlock extends BlockBase {
  type: "challenge";
  challenge: Challenge;
}

export interface ProjectBlock extends BlockBase {
  type: "project";
  project: Project;
}

export interface ReflectionBlock extends BlockBase {
  type: "reflection";
  prompt: string;
  placeholder?: string;
}

export type Block =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | CalloutBlock
  | DefinitionBlock
  | TeacherNoteBlock
  | TabsBlock
  | AccordionBlock
  | FlowBlock
  | CodeBlock
  | VideoBlock
  | ActivityBlock
  | QuizBlock
  | LabBlock
  | ChallengeBlock
  | ProjectBlock
  | ReflectionBlock;

export type BlockType = Block["type"];

// ── Structure: Grade → Unit → Lesson → Stage → Block ───────────────────────

export interface MissionStage {
  id: string;
  kind: StageKind;
  title: string;
  blocks: Block[];
  /** XP for completing the stage (defaults per kind) */
  xp?: number;
}

export interface Lesson {
  id: string;
  slug: string;
  gradeId: GradeId;
  unitId: string;
  order: number;
  title: string;
  tagline?: string;
  description: string;
  objectives: string[];
  skillIds: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  /** lucide icon name used on cards and the journey map */
  icon?: string;
  labId?: LabId;
  status: ContentStatus;
  stages: MissionStage[];
  teacherGuide?: {
    overview: string;
    tips: string[];
    answersNote?: string;
  };
}

export interface Unit {
  id: string;
  gradeId: GradeId;
  order: number;
  title: string;
  tagline?: string;
  summary: string;
  skillIds: string[];
  lessonIds: string[];
  status: ContentStatus;
  /** 'zero1' = new interactive curriculum · 'book-2023' = imported print edition */
  source: "zero1" | "book-2023";
  /** e.g. printed book chapter reference */
  bookRef?: string;
  icon?: string;
  /** For coming-soon units: lesson count from the printed edition */
  plannedLessons?: number;
}

export type GradeId =
  | "g0" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6"
  | "g7" | "g8" | "g9" | "g10" | "g11" | "g12";

export interface GradeInfo {
  id: GradeId;
  number: number;
  label: string;
  world: World;
}

// ── Skills & badges ─────────────────────────────────────────────────────────

export type SkillCategory =
  | "digital-literacy"
  | "computer-systems"
  | "algorithms"
  | "programming"
  | "computational-thinking"
  | "data"
  | "networks"
  | "cybersecurity"
  | "web"
  | "ai"
  | "robotics"
  | "physical-computing"
  | "creativity"
  | "collaboration"
  | "problem-solving";

export interface Skill {
  id: string;
  title: string;
  category: SkillCategory;
  blurb: string;
}

export type BadgeTier = "bronze" | "silver" | "gold";

export type BadgeRule =
  | { type: "lesson-complete"; lessonId: string }
  | { type: "unit-complete"; unitId: string }
  | { type: "lessons-count"; count: number }
  | { type: "xp"; amount: number }
  | { type: "streak"; days: number }
  | { type: "skill-level"; skillId: string; level: number }
  | { type: "perfect-checkpoint"; count: number };

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  /** lucide icon name */
  icon: string;
  rule: BadgeRule;
}
