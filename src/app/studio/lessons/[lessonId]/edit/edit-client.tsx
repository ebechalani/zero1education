"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { getLesson } from "@/content/curriculum";
import { BlockRenderer, type BlockContext } from "@/features/mission/block-renderer";
import { STAGE_META } from "@/features/mission/mission-player";
import { BLOCK_KINDS, blockSummary, createBlock } from "@/features/studio/block-catalog";
import { BlockInspector } from "@/features/studio/block-inspector";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudio } from "@/stores/studio-store";
import type { Block, BlockType, Lesson, MissionStage } from "@/types/content";
import * as Icons from "lucide-react";
import {
  ArrowLeft,
  Copy,
  Eye,
  GripVertical,
  History,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function KindIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Icons.Square;
  return <Icon className={className} />;
}

function SortableBlockRow({
  block,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const meta = BLOCK_KINDS.find((k) => k.type === block.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 transition-colors",
        isDragging && "z-10 shadow-pop",
        selected
          ? "border-brand-500 bg-brand-50 shadow-glow"
          : "border-ink-100 hover:border-ink-300",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Reorder block"
        className="cursor-grab touch-none text-ink-300 hover:text-ink-500 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <button
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            meta?.group === "interactive"
              ? "bg-bit-100 text-bit-700"
              : meta?.group === "structure"
                ? "bg-violet-100 text-violet-700"
                : "bg-ink-100 text-ink-500",
          )}
        >
          <KindIcon name={meta?.icon ?? "Square"} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-ink-800">
            {meta?.label ?? block.type}
          </span>
          <span className="block truncate text-[11px] text-ink-400">
            {blockSummary(block)}
          </span>
        </span>
      </button>
      <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={onDuplicate}
          aria-label="Duplicate block"
          className="cursor-pointer rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <Copy className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete block"
          className="cursor-pointer rounded p-1 text-ink-400 hover:bg-coral-100 hover:text-coral-600"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </div>
  );
}

/**
 * Waits for store hydration, then mounts the builder with the draft (or the
 * published lesson) as its initial state — no load-effect, no flash of the
 * wrong version.
 */
export default function LessonBuilderPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const hydrated = useHydrated();
  const lesson = getLesson(lessonId);

  if (!lesson || lesson.status !== "published") notFound();
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-10">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <Builder lesson={lesson} />;
}

function Builder({ lesson }: { lesson: Lesson }) {
  const { drafts, saveDraft, restoreVersion, discardDraft } = useStudio();

  const [stages, setStages] = useState<MissionStage[]>(
    () =>
      structuredClone(
        drafts[lesson.id]?.stages ?? lesson.stages,
      ) as MissionStage[],
  );
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [preview, setPreview] = useState<"off" | "student" | "teacher">("off");
  const copyCounter = useRef(1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stage = stages[stageIndex];
  const blocks = useMemo(() => stage?.blocks ?? [], [stage]);
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const updateStage = (updater: (s: MissionStage) => MissionStage) => {
    setStages((prev) =>
      prev.map((s, i) => (i === stageIndex ? updater(s) : s)),
    );
    setDirty(true);
  };

  const setBlocks = (next: Block[]) =>
    updateStage((s) => ({ ...s, blocks: next }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    setBlocks(arrayMove(blocks, from, to));
  };

  const insertBlock = (type: BlockType) => {
    const block = createBlock(type);
    const at = selectedId ? blocks.findIndex((b) => b.id === selectedId) + 1 : blocks.length;
    setBlocks([...blocks.slice(0, at), block, ...blocks.slice(at)]);
    setSelectedId(block.id);
    setShowPalette(false);
  };

  const duplicateBlock = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    const copy = structuredClone(blocks[i]) as Block;
    copy.id = `${copy.id}-copy-${copyCounter.current++}`;
    setBlocks([...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const save = (publish = false) => {
    saveDraft(lesson.id, lesson.title, stages, { publish });
    setDirty(false);
    toast(publish ? "Lesson published" : "Draft saved", {
      description: publish
        ? "In production this writes a new immutable version and updates the live lesson."
        : "Stored locally — your students still see the published version.",
      tone: "success",
    });
  };

  const draft = drafts[lesson.id];
  const previewCtx: BlockContext = {
    role: preview === "teacher" ? "teacher" : "student",
    activityResults: {},
    labsDone: [],
    submittedProjects: [],
    reflections: {},
    onActivityComplete: () => {},
    onLabComplete: () => {},
    onProjectSubmit: () => {},
    onReflectionSave: () => {},
    teacherReveal: preview === "teacher",
  };

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col lg:-mx-8 lg:-my-8">
      {/* Builder toolbar */}
      <header className="sticky top-14 z-20 flex flex-wrap items-center gap-3 border-b border-ink-100 bg-white px-4 py-2.5 lg:px-6">
        <Button href="/studio/curriculum" variant="ghost" size="sm" icon={<ArrowLeft />}>
          Curriculum
        </Button>
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-display text-[15px] font-bold text-ink-900">
            {lesson.title}
            {dirty ? (
              <Chip tone="amber">Unsaved changes</Chip>
            ) : draft ? (
              <Chip tone={draft.status === "published" ? "mint" : "bit"}>
                {draft.status === "published" ? "Published draft" : "Draft saved"}
              </Chip>
            ) : (
              <Chip tone="neutral">Live version</Chip>
            )}
          </p>
          <p className="truncate text-[11px] text-ink-400">
            Grade 6 · Inside the Digital World · {stages.length} stages ·{" "}
            {stages.reduce((acc, s) => acc + s.blocks.length, 0)} blocks
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            size="sm"
            variant={preview === "off" ? "secondary" : "primary"}
            icon={<Eye />}
            onClick={() =>
              setPreview(
                preview === "off" ? "student" : preview === "student" ? "teacher" : "off",
              )
            }
          >
            {preview === "off"
              ? "Preview"
              : preview === "student"
                ? "Student preview"
                : "Teacher preview"}
          </Button>
          {draft && (
            <Button
              size="sm"
              variant="ghost"
              icon={<History />}
              onClick={() => setShowVersions(true)}
            >
              History
            </Button>
          )}
          <Button size="sm" variant="secondary" icon={<Save />} onClick={() => save(false)}>
            Save draft
          </Button>
          <Button size="sm" icon={<Upload />} onClick={() => save(true)}>
            Publish
          </Button>
        </div>
      </header>

      {/* Stage tabs */}
      <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-ink-100 bg-ink-50/60 px-4 py-2 lg:px-6">
        {stages.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setStageIndex(i);
              setSelectedId(null);
            }}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
              i === stageIndex
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
            )}
          >
            {STAGE_META[s.kind].icon}
            {s.title}
            <span
              className={cn(
                "tnum ml-0.5 rounded-full px-1.5 font-mono text-[10px]",
                i === stageIndex ? "bg-white/15" : "bg-ink-100 text-ink-400",
              )}
            >
              {s.blocks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Three-pane workspace */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr_340px]">
        {/* Left: block list */}
        <aside className="thin-scroll overflow-y-auto border-r border-ink-100 bg-white p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">
              Blocks
            </p>
            <Button size="sm" icon={<Plus />} onClick={() => setShowPalette(true)}>
              Add
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {blocks.map((b) => (
                  <SortableBlockRow
                    key={b.id}
                    block={b}
                    selected={selectedId === b.id}
                    onSelect={() => setSelectedId(b.id)}
                    onDuplicate={() => duplicateBlock(b.id)}
                    onDelete={() => deleteBlock(b.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {blocks.length === 0 && (
            <p className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-xs text-ink-400">
              This stage is empty. Add your first block.
            </p>
          )}
        </aside>

        {/* Center: canvas */}
        <main className="thin-scroll overflow-y-auto bg-paper p-5 lg:p-8">
          {preview !== "off" ? (
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5">
                <Eye className="size-4 text-signal-400" />
                <p className="text-[13px] font-semibold text-white">
                  {preview === "student"
                    ? "Student preview — exactly what learners see"
                    : "Teacher preview — teacher notes and answers visible"}
                </p>
                <button
                  onClick={() => setPreview("off")}
                  className="ml-auto cursor-pointer rounded p-1 text-ink-400 hover:bg-white/10 hover:text-white"
                  aria-label="Close preview"
                >
                  <X className="size-4" />
                </button>
              </div>
              <BlockRenderer blocks={blocks} ctx={previewCtx} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-3">
              {blocks.map((b) => {
                const meta = BLOCK_KINDS.find((k) => k.type === b.type);
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={cn(
                      "block w-full cursor-pointer rounded-xl border-2 bg-white p-4 text-left transition-all",
                      selectedId === b.id
                        ? "border-brand-500 shadow-glow"
                        : "border-transparent hover:border-ink-200",
                    )}
                  >
                    <span className="mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-400 uppercase">
                      <KindIcon name={meta?.icon ?? "Square"} className="size-3" />
                      {meta?.label}
                    </span>
                    <div className="pointer-events-none">
                      <BlockRenderer blocks={[b]} ctx={previewCtx} />
                    </div>
                  </button>
                );
              })}
              {blocks.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-ink-200 py-16 text-center">
                  <p className="font-display text-[15px] font-semibold text-ink-700">
                    Nothing in “{stage?.title}” yet
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                    Blocks are the building units of every ZERO1 lesson. Add text,
                    activities, labs and projects — the platform renders them for
                    students, teachers and Teach Mode automatically.
                  </p>
                  <Button className="mt-4" icon={<Plus />} onClick={() => setShowPalette(true)}>
                    Add your first block
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right: inspector */}
        <aside className="thin-scroll overflow-y-auto border-l border-ink-100 bg-white p-4">
          {selected ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">
                  {BLOCK_KINDS.find((k) => k.type === selected.type)?.label} settings
                </p>
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Deselect block"
                  className="cursor-pointer rounded p-1 text-ink-400 hover:bg-ink-100"
                >
                  <X className="size-4" />
                </button>
              </div>
              <BlockInspector
                block={selected}
                onChange={(next) =>
                  setBlocks(blocks.map((b) => (b.id === next.id ? next : b)))
                }
              />
            </>
          ) : (
            <div className="pt-8 text-center">
              <p className="text-sm font-semibold text-ink-700">No block selected</p>
              <p className="mx-auto mt-1 max-w-[220px] text-xs text-ink-400">
                Select a block from the list or the canvas to edit its content and
                settings here.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Block palette */}
      <Dialog open={showPalette} onClose={() => setShowPalette(false)} title="Add a block" wide>
        {(["content", "interactive", "structure"] as const).map((group) => (
          <div key={group} className="mb-5 last:mb-0">
            <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
              {group}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCK_KINDS.filter((k) => k.group === group).map((k) => (
                <button
                  key={k.type}
                  onClick={() => insertBlock(k.type)}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-ink-100 p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/50"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      group === "interactive"
                        ? "bg-bit-100 text-bit-700"
                        : group === "structure"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-ink-100 text-ink-600",
                    )}
                  >
                    <KindIcon name={k.icon} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ink-800">
                      {k.label}
                    </span>
                    <span className="block text-[11px] leading-snug text-ink-400">
                      {k.blurb}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Dialog>

      {/* Version history */}
      <Dialog open={showVersions} onClose={() => setShowVersions(false)} title="Version history">
        {draft && draft.versions.length > 0 ? (
          <ul className="space-y-2">
            {draft.versions.map((v) => (
              <li
                key={v.ts}
                className="flex items-center gap-3 rounded-lg border border-ink-100 px-3.5 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink-800">
                    {v.label}
                  </span>
                  <span className="block text-[11px] text-ink-400">
                    {new Date(v.ts).toLocaleString("en-GB")} ·{" "}
                    {v.stages.reduce((acc, s) => acc + s.blocks.length, 0)} blocks
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    restoreVersion(lesson.id, v.ts);
                    setStages(structuredClone(v.stages) as MissionStage[]);
                    setShowVersions(false);
                    toast("Version restored", { tone: "success" });
                  }}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-400">No saved versions yet.</p>
        )}
        <div className="mt-4 border-t border-ink-100 pt-4">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 />}
            onClick={() => {
              discardDraft(lesson.id);
              setStages(structuredClone(lesson.stages) as MissionStage[]);
              setDirty(false);
              setShowVersions(false);
              toast("Draft discarded", {
                description: "Reverted to the published lesson.",
              });
            }}
          >
            Discard draft and revert to published
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
