"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { cn, shuffleSeeded, hashString } from "@/lib/utils";
import { Inline } from "@/components/ui/md";
import { Check, X } from "lucide-react";
import type { ClassifyActivity } from "@/types/content";
import { useMemo, useState } from "react";

function DraggableItem({
  id,
  text,
  locked,
  selected,
  verdict,
  onSelect,
}: {
  id: string;
  text: string;
  locked: boolean;
  selected: boolean;
  verdict?: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: locked });
  return (
    <button
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      onClick={onSelect}
      disabled={locked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[13px] font-medium transition-shadow",
        isDragging && "z-20 shadow-pop",
        verdict === true && "border-mint-500 bg-mint-100 text-mint-700",
        verdict === false && "border-coral-500 bg-coral-100 text-coral-700",
        verdict === undefined &&
          (selected
            ? "border-brand-500 bg-brand-100 text-brand-700"
            : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"),
        !locked && "cursor-grab active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
    >
      <Inline text={text} />
      {verdict === true && <Check className="size-3.5" />}
      {verdict === false && <X className="size-3.5" />}
    </button>
  );
}

function Bucket({
  id,
  label,
  children,
  onPlace,
  active,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  onPlace: () => void;
  active: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={onPlace}
      className={cn(
        "min-h-28 rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver || active
          ? "border-brand-500 bg-brand-50"
          : "border-ink-200 bg-ink-50/50",
        active && "cursor-pointer",
      )}
    >
      <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * Drag chips into buckets — or tap a chip, then tap its bucket (touch and
 * screen-reader friendly fallback).
 */
export function ClassifyBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
  perItem,
}: {
  activity: ClassifyActivity;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  locked: boolean;
  showAnswer: boolean;
  perItem?: Record<string, boolean>;
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const pool = useMemo(
    () =>
      shuffleSeeded(activity.items, hashString(activity.id)).filter(
        (i) => !value[i.id],
      ),
    [activity, value],
  );

  const place = (itemId: string, categoryId: string) => {
    onChange({ ...value, [itemId]: categoryId });
    setSelectedItem(null);
  };
  const unplace = (itemId: string) => {
    if (locked) return;
    const next = { ...value };
    delete next[itemId];
    onChange(next);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (e.over) place(String(e.active.id), String(e.over.id));
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {pool.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-ink-100 bg-white p-3">
          {pool.map((item) => (
            <DraggableItem
              key={item.id}
              id={item.id}
              text={item.text}
              locked={locked}
              selected={selectedItem === item.id}
              onSelect={() =>
                setSelectedItem(selectedItem === item.id ? null : item.id)
              }
            />
          ))}
        </div>
      )}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
        }}
      >
        {activity.categories.map((cat) => (
          <Bucket
            key={cat.id}
            id={cat.id}
            label={cat.label}
            active={selectedItem !== null}
            onPlace={() => selectedItem && place(selectedItem, cat.id)}
          >
            {activity.items
              .filter((i) => value[i.id] === cat.id)
              .map((item) => (
                <span key={item.id} onClick={() => unplace(item.id)}>
                  <DraggableItem
                    id={item.id}
                    text={item.text}
                    locked={locked}
                    selected={false}
                    verdict={showAnswer ? perItem?.[item.id] : undefined}
                    onSelect={() => unplace(item.id)}
                  />
                </span>
              ))}
          </Bucket>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Drag each chip into a group — or tap a chip, then tap its group.
      </p>
    </DndContext>
  );
}
