"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { SjArt, SJ_BLOCK_NAME, SJ_SPEED_NAME, type SjArtKind } from "./sj-blocks";
import { sjDrawers, type SjPaletteEntry } from "./sj-palette";
import {
  sjCloneBlock,
  sjId,
  sjIsContainer,
  SJ_BLOCK_CATEGORY,
  SJ_CATEGORIES,
  SJ_NUMBER_RANGE,
  type SjBlock,
  type SjCategory,
  type SjScript,
  type SjSpeed,
} from "./sj-model";

/**
 * The ScratchJr script editor.
 *
 * Two rules shape everything here, and both come from the age of the child
 * using it:
 *
 *   **No words on a block.** ScratchJr's whole design is that a child who
 *   cannot read can still program. Every name lives in `aria-label` and in the
 *   teacher's tooltip, never on the face.
 *
 *   **A block is added by tapping it.** A six-year-old on a trackpad cannot be
 *   asked to land a drag, so no lesson may depend on one: tapping a block in
 *   the drawer appends it, and the arrows under a selected block reorder it.
 *   Dragging works too, for the children who find it, but nothing needs it.
 *
 * Scripts run left to right, as rows, which is ScratchJr's own layout and not
 * Scratch's vertical stack.
 */

const TILE = "size-14 rounded-xl";

/** One block, drawn as its picture on its drawer's colour. */
function BlockTile({
  kind,
  n,
  text,
  speed,
  selected,
  running,
  onClick,
  disabled,
  className,
}: {
  kind: SjArtKind;
  n?: number;
  text?: string;
  speed?: SjSpeed;
  selected?: boolean;
  running?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { hex, ink } = SJ_CATEGORIES[SJ_BLOCK_CATEGORY[kind]];
  const label =
    SJ_BLOCK_NAME[kind] +
    (n !== undefined ? ` ${n}` : "") +
    (speed ? ` ${SJ_SPEED_NAME[speed]}` : "") +
    (text ? `: ${text}` : "");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex shrink-0 items-center justify-center transition-all",
        TILE,
        onClick && !disabled && "cursor-pointer hover:brightness-110 active:scale-95",
        selected && "ring-3 ring-ink-900 ring-offset-2",
        running && "ring-3 ring-white ring-offset-2 ring-offset-mint-500",
        className,
      )}
      style={{ background: hex, color: ink }}
    >
      <SjArt kind={kind} className="size-8" />
      {n !== undefined && (
        <span className="absolute right-0.5 bottom-0.5 flex min-w-5 items-center justify-center rounded-md bg-white px-1 font-mono text-[11px] font-black text-ink-900 tabular-nums">
          {n}
        </span>
      )}
      {speed && (
        <span className="absolute right-0.5 bottom-0.5 flex items-center justify-center rounded-md bg-white px-1 text-[9px] font-black text-ink-900">
          {speed === "slow" ? "1" : speed === "normal" ? "2" : "3"}
        </span>
      )}
    </button>
  );
}

/** A row of blocks — a script body, or the inside of a repeat. */
function BlockRow({
  blocks,
  selectedId,
  runningId,
  onSelect,
  depth = 0,
}: {
  blocks: SjBlock[];
  selectedId: string | null;
  runningId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <>
      {blocks.map((block) => {
        if (sjIsContainer(block)) {
          return (
            <div
              key={block.id}
              className="flex shrink-0 items-center gap-1 rounded-2xl border-3 p-1"
              style={{ borderColor: SJ_CATEGORIES[block.kind === "repeat" ? "control" : "end"].hex }}
            >
              <BlockTile
                kind={block.kind}
                n={block.kind === "repeat" ? block.n : undefined}
                selected={selectedId === block.id}
                running={runningId === block.id}
                onClick={() => onSelect(block.id)}
              />
              <div className="flex items-center gap-1">
                {block.body.length === 0 ? (
                  <span className="flex h-14 w-16 items-center justify-center rounded-xl border-2 border-dashed border-ink-300 text-[10px] leading-tight text-ink-400">
                    put blocks here
                  </span>
                ) : (
                  <BlockRow
                    blocks={block.body}
                    selectedId={selectedId}
                    runningId={runningId}
                    onSelect={onSelect}
                    depth={depth + 1}
                  />
                )}
              </div>
            </div>
          );
        }
        return (
          <BlockTile
            key={block.id}
            kind={block.kind}
            n={"n" in block ? block.n : undefined}
            text={block.kind === "say" ? block.text : undefined}
            speed={block.kind === "set-speed" ? block.speed : undefined}
            selected={selectedId === block.id}
            running={runningId === block.id}
            onClick={() => onSelect(block.id)}
          />
        );
      })}
    </>
  );
}

// ── Pure edits over a script ────────────────────────────────────────────────

/** Append a block, into the selected container if one is selected. */
function appendBlock(
  blocks: SjBlock[],
  block: SjBlock,
  intoId: string | null,
): SjBlock[] {
  if (!intoId) return [...blocks, block];
  let placed = false;
  const walk = (list: SjBlock[]): SjBlock[] =>
    list.map((b) => {
      if (!sjIsContainer(b)) return b;
      if (b.id === intoId) {
        placed = true;
        return { ...b, body: [...b.body, block] };
      }
      return { ...b, body: walk(b.body) };
    });
  const next = walk(blocks);
  return placed ? next : [...blocks, block];
}

function removeBlock(blocks: SjBlock[], id: string): SjBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (sjIsContainer(b) ? { ...b, body: removeBlock(b.body, id) } : b));
}

function updateBlock(
  blocks: SjBlock[],
  id: string,
  change: (b: SjBlock) => SjBlock,
): SjBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return change(b);
    return sjIsContainer(b) ? { ...b, body: updateBlock(b.body, id, change) } : b;
  });
}

/** Slide a block one place left or right within whichever row holds it. */
function moveBlock(blocks: SjBlock[], id: string, by: -1 | 1): SjBlock[] {
  const i = blocks.findIndex((b) => b.id === id);
  if (i >= 0) {
    const j = i + by;
    if (j < 0 || j >= blocks.length) return blocks;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }
  return blocks.map((b) =>
    sjIsContainer(b) ? { ...b, body: moveBlock(b.body, id, by) } : b,
  );
}

function findBlock(blocks: SjBlock[], id: string): SjBlock | undefined {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (sjIsContainer(b)) {
      const found = findBlock(b.body, id);
      if (found) return found;
    }
  }
  return undefined;
}

// ── The editor ──────────────────────────────────────────────────────────────

export function SjEditor({
  script,
  onChange,
  runningId,
  allowed,
  className,
}: {
  script: SjScript;
  /**
   * Takes an updater, not a value.
   *
   * A child holding down the + button fires several clicks inside one React
   * batch, and every one of them would read the same stale script and write
   * the same number back — nine of the ten taps lost. An updater sees the
   * script as it stands.
   */
  onChange: (update: (script: SjScript) => SjScript) => void;
  /** The block being carried out right now, for highlighting during a run */
  runningId?: string | null;
  /** Drawers this lesson opens. All six when not given. */
  allowed?: SjCategory[];
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<SjCategory>("motion");
  const [note, setNote] = useState("Tap a block to add it.");

  const drawers = useMemo(() => sjDrawers(allowed), [allowed]);
  const open = drawers.some((d) => d.category === drawer)
    ? drawer
    : (drawers[0]?.category ?? "motion");

  const selected = selectedId ? findBlock(script.blocks, selectedId) : undefined;
  const range = selected ? SJ_NUMBER_RANGE[selected.kind] : undefined;

  const add = useCallback(
    (entry: SjPaletteEntry) => {
      if (entry.shape === "trigger") {
        onChange((s) => ({ ...s, trigger: entry.make() }));
        setNote(`Changed the trigger to ${SJ_BLOCK_NAME[entry.key]}.`);
        return;
      }
      const block = entry.make();
      // Adding into the selected repeat, if that is what is selected.
      const into =
        selected && sjIsContainer(selected) ? selected.id : null;
      onChange((s) => ({ ...s, blocks: appendBlock(s.blocks, block, into) }));
      setSelectedId(block.id);
      setNote(
        into
          ? `Added ${SJ_BLOCK_NAME[entry.key]} inside the repeat.`
          : `Added ${SJ_BLOCK_NAME[entry.key]}.`,
      );
    },
    [onChange, selected],
  );

  const bump = (by: number) => {
    if (!selected || !range) return;
    onChange((s) => ({
      ...s,
      blocks: updateBlock(s.blocks, selected.id, (b) =>
        "n" in b
          ? { ...b, n: Math.min(range.max, Math.max(range.min, b.n + by)) }
          : b,
      ),
    }));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* The drawers */}
      <div className="flex flex-wrap gap-1.5">
        {drawers.map(({ category }) => (
          <button
            key={category}
            onClick={() => setDrawer(category)}
            aria-pressed={open === category}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all",
              open === category ? "ring-2 ring-ink-900 ring-offset-1" : "opacity-70 hover:opacity-100",
            )}
            style={{
              background: SJ_CATEGORIES[category].hex,
              color: SJ_CATEGORIES[category].ink,
            }}
          >
            {SJ_CATEGORIES[category].label}
          </button>
        ))}
      </div>

      {/* The open drawer */}
      <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-ink-100 bg-ink-50 p-2.5">
        {drawers
          .find((d) => d.category === open)
          ?.entries.map((entry) => {
            const preview = entry.shape === "trigger" ? undefined : entry.make();
            return (
              <BlockTile
                key={entry.key}
                kind={entry.key}
                n={preview && "n" in preview ? preview.n : undefined}
                speed={
                  preview && preview.kind === "set-speed" ? preview.speed : undefined
                }
                onClick={() => add(entry)}
              />
            );
          })}
      </div>

      {/* The script */}
      <div className="rounded-2xl border-2 border-ink-200 bg-white p-2.5">
        <div className="thin-scroll flex items-center gap-1 overflow-x-auto pb-1">
          <BlockTile
            kind={script.trigger.kind}
            selected={selectedId === script.trigger.id}
            onClick={() => setSelectedId(script.trigger.id)}
          />
          <span className="h-10 w-px shrink-0 bg-ink-200" />
          {script.blocks.length === 0 ? (
            <span className="px-3 text-[13px] text-ink-400">
              Tap a block above to start the script.
            </span>
          ) : (
            <BlockRow
              blocks={script.blocks}
              selectedId={selectedId}
              runningId={runningId ?? null}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </div>

      {/* What you can do to the block you tapped */}
      {selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-brand-200 bg-brand-50 p-2.5">
          <span className="text-[13px] font-bold text-ink-700">
            {SJ_BLOCK_NAME[selected.kind]}
          </span>

          {range && "n" in selected && (
            <span className="flex items-center gap-1">
              <button
                onClick={() => bump(-1)}
                aria-label={`fewer — ${SJ_BLOCK_NAME[selected.kind]}`}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-2 border-ink-200 bg-white hover:bg-ink-50 active:scale-95"
              >
                <Minus className="size-4" strokeWidth={3} />
              </button>
              <span className="min-w-9 text-center font-mono text-lg font-black tabular-nums text-ink-900">
                {selected.n}
              </span>
              <button
                onClick={() => bump(1)}
                aria-label={`more — ${SJ_BLOCK_NAME[selected.kind]}`}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-2 border-ink-200 bg-white hover:bg-ink-50 active:scale-95"
              >
                <Plus className="size-4" strokeWidth={3} />
              </button>
            </span>
          )}

          {selected.kind === "say" && (
            <input
              value={selected.text}
              onChange={(e) =>
                onChange((s) => ({
                  ...s,
                  blocks: updateBlock(s.blocks, selected.id, (b) =>
                    b.kind === "say" ? { ...b, text: e.target.value } : b,
                  ),
                }))
              }
              aria-label="what the character says"
              className="min-w-40 flex-1 rounded-lg border-2 border-ink-200 px-2.5 py-1.5 text-[14px]"
            />
          )}

          {selected.kind === "set-speed" && (
            <span className="flex gap-1">
              {(["slow", "normal", "fast"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      blocks: updateBlock(prev.blocks, selected.id, (b) =>
                        b.kind === "set-speed" ? { ...b, speed: s } : b,
                      ),
                    }))
                  }
                  aria-pressed={selected.speed === s}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold",
                    selected.speed === s
                      ? "border-brand-500 bg-brand-100 text-brand-700"
                      : "border-ink-200 bg-white text-ink-500",
                  )}
                >
                  {SJ_SPEED_NAME[s]}
                </button>
              ))}
            </span>
          )}

          <span className="ml-auto flex gap-1">
            <button
              onClick={() => {
                onChange((s) => ({ ...s, blocks: moveBlock(s.blocks, selected.id, -1) }));
                setNote("Moved the block earlier.");
              }}
              aria-label="move this block earlier"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-2 border-ink-200 bg-white text-lg font-black hover:bg-ink-50 active:scale-95"
            >
              ‹
            </button>
            <button
              onClick={() => {
                onChange((s) => ({ ...s, blocks: moveBlock(s.blocks, selected.id, 1) }));
                setNote("Moved the block later.");
              }}
              aria-label="move this block later"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-2 border-ink-200 bg-white text-lg font-black hover:bg-ink-50 active:scale-95"
            >
              ›
            </button>
            <button
              onClick={() => {
                onChange((s) => ({ ...s, blocks: removeBlock(s.blocks, selected.id) }));
                setSelectedId(null);
                setNote("Removed the block.");
              }}
              aria-label="remove this block"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-2 border-coral-500 bg-white text-coral-700 hover:bg-coral-100 active:scale-95"
            >
              <Trash2 className="size-4" />
            </button>
          </span>
        </div>
      )}

      <p role="status" aria-live="polite" className="text-[12px] text-ink-400">
        {note}
      </p>
    </div>
  );
}

export { sjCloneBlock, sjId };
