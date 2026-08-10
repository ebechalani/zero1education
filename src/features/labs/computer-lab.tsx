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
import { cn } from "@/lib/utils";
import { Cpu, HardDrive, MemoryStick, MonitorPlay, Plug, Power } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LabShell } from "./lab-shell";

interface Part {
  id: string;
  label: string;
  icon: ReactNode;
  hint: string;
}

const PARTS: Part[] = [
  { id: "cpu", label: "CPU", icon: <Cpu className="size-5" />, hint: "The brain — executes instructions" },
  { id: "ram", label: "RAM", icon: <MemoryStick className="size-5" />, hint: "Working memory for open apps" },
  { id: "ssd", label: "SSD", icon: <HardDrive className="size-5" />, hint: "Long-term storage for files" },
  { id: "gpu", label: "GPU", icon: <MonitorPlay className="size-5" />, hint: "Draws graphics on screen" },
  { id: "psu", label: "Power Supply", icon: <Plug className="size-5" />, hint: "Feeds power to every part" },
];

function DraggablePart({
  part,
  selected,
  onSelect,
}: {
  part: Part;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: part.id });
  return (
    <button
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      onClick={onSelect}
      title={part.hint}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-lg border-2 bg-white px-3 py-2.5 text-sm font-semibold text-ink-800 shadow-card transition-all active:cursor-grabbing",
        isDragging && "z-30 shadow-pop",
        selected ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-brand-300",
      )}
      {...attributes}
      {...listeners}
    >
      <span className="text-brand-600">{part.icon}</span>
      {part.label}
    </button>
  );
}

function Slot({
  id,
  label,
  filled,
  active,
  onPlace,
  className,
  style,
}: {
  id: string;
  label: string;
  filled: boolean;
  active: boolean;
  onPlace: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: filled });
  const part = PARTS.find((p) => p.id === id)!;
  return (
    <div
      ref={setNodeRef}
      onClick={() => !filled && active && onPlace()}
      className={cn(
        "absolute flex flex-col items-center justify-center rounded-md border-2 text-center transition-all duration-200",
        filled
          ? "border-mint-500 bg-mint-100 text-mint-700"
          : isOver || active
            ? "cursor-pointer border-dashed border-brand-500 bg-brand-50 text-brand-600"
            : "border-dashed border-ink-300 bg-white/60 text-ink-400",
        className,
      )}
      style={style}
      aria-label={`${label} slot${filled ? " — installed" : ""}`}
    >
      <span className={cn(filled ? "text-mint-600" : "text-current")}>{part.icon}</span>
      <span className="mt-0.5 text-[10px] font-bold tracking-wide uppercase">
        {filled ? part.label : label}
      </span>
    </div>
  );
}

/**
 * Build-a-Computer: install five components into their motherboard slots.
 * Drag chips onto slots, or tap a chip then tap its slot. Boots when complete.
 */
export function ComputerLab({
  title = "Computer Lab",
  brief,
  onComplete,
  completed,
}: {
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const allPlaced = PARTS.every((p) => placed[p.id]);

  const place = (partId: string, slotId: string) => {
    if (partId !== slotId) return; // wrong slot — silently rejected, slot stays open
    setPlaced((prev) => ({ ...prev, [partId]: true }));
    setSelected(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (e.over) place(String(e.active.id), String(e.over.id));
  };

  const boot = () => {
    setBooted(true);
    onComplete?.();
  };

  const reset = () => {
    setPlaced({});
    setBooted(false);
    setSelected(null);
  };

  const pool = PARTS.filter((p) => !placed[p.id]);

  return (
    <LabShell title={title} brief={brief} onReset={reset} completed={completed || booted}>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Parts tray */}
        {pool.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
            {pool.map((p) => (
              <DraggablePart
                key={p.id}
                part={p}
                selected={selected === p.id}
                onSelect={() => setSelected(selected === p.id ? null : p.id)}
              />
            ))}
          </div>
        )}

        {/* Case + motherboard */}
        <div className="relative mx-auto aspect-[16/10] max-w-xl overflow-hidden rounded-xl border-2 border-ink-300 bg-gradient-to-br from-ink-100 to-ink-50">
          <div className="absolute inset-[8%] rounded-lg border-2 border-brand-300 bg-brand-50/70">
            <span className="absolute top-1.5 left-2.5 font-mono text-[10px] tracking-widest text-brand-400 uppercase">
              Motherboard
            </span>
            <Slot id="cpu" label="CPU slot" filled={!!placed.cpu} active={selected === "cpu"} onPlace={() => selected && place(selected, "cpu")} style={{ left: "12%", top: "18%", width: "26%", height: "34%" }} />
            <Slot id="ram" label="RAM slot" filled={!!placed.ram} active={selected === "ram"} onPlace={() => selected && place(selected, "ram")} style={{ left: "46%", top: "14%", width: "16%", height: "42%" }} />
            <Slot id="gpu" label="GPU slot" filled={!!placed.gpu} active={selected === "gpu"} onPlace={() => selected && place(selected, "gpu")} style={{ left: "12%", top: "62%", width: "40%", height: "26%" }} />
            <Slot id="ssd" label="SSD bay" filled={!!placed.ssd} active={selected === "ssd"} onPlace={() => selected && place(selected, "ssd")} style={{ left: "70%", top: "60%", width: "22%", height: "28%" }} />
            <Slot id="psu" label="PSU bay" filled={!!placed.psu} active={selected === "psu"} onPlace={() => selected && place(selected, "psu")} style={{ left: "70%", top: "14%", width: "22%", height: "34%" }} />
          </div>
          {/* Boot overlay */}
          {booted && (
            <div className="animate-fade-up absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-950/92">
              <p className="font-mono text-sm text-mint-500">
                ZERO1 BIOS v1.0 … all components detected
              </p>
              <p className="font-mono text-2xl font-bold text-white">
                SYSTEM <span className="text-mint-500">ONLINE</span>
                <span className="animate-blink text-signal-400">▮</span>
              </p>
            </div>
          )}
        </div>

        {/* Status / boot */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            {booted
              ? "The machine lives! You know your way around a computer now."
              : allPlaced
                ? "Everything's installed. Hit the power button!"
                : `${PARTS.filter((p) => placed[p.id]).length} of ${PARTS.length} components installed`}
          </p>
          <button
            onClick={boot}
            disabled={!allPlaced || booted}
            aria-label="Power on"
            className={cn(
              "flex size-12 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              allPlaced && !booted
                ? "animate-pop border-mint-500 bg-mint-500 text-white shadow-[0_0_20px_-2px_var(--color-mint-500)]"
                : booted
                  ? "border-mint-500 bg-mint-100 text-mint-600"
                  : "border-ink-200 bg-ink-100 text-ink-300",
            )}
          >
            <Power className="size-5" />
          </button>
        </div>
      </DndContext>
    </LabShell>
  );
}
