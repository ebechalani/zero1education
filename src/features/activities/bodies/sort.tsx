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
import { cn, shuffleSeeded, hashString } from "@/lib/utils";
import { Inline } from "@/components/ui/md";
import { Check, GripVertical, X } from "lucide-react";
import type { SortActivity } from "@/types/content";
import { useEffect } from "react";

function SortableRow({
  id,
  text,
  index,
  locked,
  verdict,
}: {
  id: string;
  text: string;
  index: number;
  locked: boolean;
  verdict?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: locked });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-lg border-2 bg-white px-3 py-2.5 text-sm",
        isDragging && "z-10 shadow-pop",
        verdict === true && "border-mint-500 bg-mint-100/50",
        verdict === false && "border-coral-500 bg-coral-100/50",
        verdict === undefined && "border-ink-100",
        !locked && "cursor-grab active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
    >
      <span className="tnum flex size-6 shrink-0 items-center justify-center rounded-md bg-ink-100 font-mono text-xs font-semibold text-ink-500">
        {index + 1}
      </span>
      <span className="flex-1 font-medium text-ink-800">
        <Inline text={text} />
      </span>
      {verdict === true && <Check className="size-4 shrink-0 text-mint-600" />}
      {verdict === false && <X className="size-4 shrink-0 text-coral-600" />}
      {verdict === undefined && !locked && (
        <GripVertical className="size-4 shrink-0 text-ink-300" aria-hidden />
      )}
    </div>
  );
}

export function SortBody({
  activity,
  value,
  onChange,
  locked,
  showAnswer,
  perItem,
}: {
  activity: SortActivity;
  value: string[];
  onChange: (v: string[]) => void;
  locked: boolean;
  showAnswer: boolean;
  perItem?: Record<string, boolean>;
}) {
  // Initialize with a seeded shuffle that is never accidentally correct
  useEffect(() => {
    if (value.length === 0) {
      let seed = hashString(activity.id);
      let order = shuffleSeeded(
        activity.items.map((i) => i.id),
        seed,
      );
      while (
        order.every((id, i) => id === activity.correctOrder[i]) &&
        activity.items.length > 1
      ) {
        seed += 1;
        order = shuffleSeeded(
          activity.items.map((i) => i.id),
          seed,
        );
      }
      onChange(order);
    }
  }, [activity, value.length, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = value.indexOf(String(active.id));
      const to = value.indexOf(String(over.id));
      onChange(arrayMove(value, from, to));
    }
  };

  const textOf = (id: string) =>
    activity.items.find((i) => i.id === id)?.text ?? "";

  return (
    <div>
      {activity.endLabels && (
        <p className="mb-2 text-xs font-medium text-ink-400">
          {activity.endLabels[0]} ↓ … {activity.endLabels[1]}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={value} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {value.map((id, i) => (
              <SortableRow
                key={id}
                id={id}
                index={i}
                text={textOf(id)}
                locked={locked}
                verdict={showAnswer ? perItem?.[id] : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <p className="mt-2 text-xs text-ink-400">
        Drag rows into order — or focus a row and use space + arrow keys.
      </p>
    </div>
  );
}
