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
import type { NetworkLabConfig } from "@/types/content";
import {
  Check,
  Cloud,
  Monitor,
  Network,
  Printer,
  Router,
  Server,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LabShell } from "./lab-shell";

type DeviceType =
  | "computer"
  | "printer"
  | "server"
  | "switch"
  | "router"
  | "access-point";

const DEVICE_META: Record<DeviceType, { label: string; icon: ReactNode }> = {
  computer: { label: "Computer", icon: <Monitor className="size-5" /> },
  printer: { label: "Printer", icon: <Printer className="size-5" /> },
  server: { label: "Server", icon: <Server className="size-5" /> },
  switch: { label: "Switch", icon: <Network className="size-5" /> },
  router: { label: "Router", icon: <Router className="size-5" /> },
  "access-point": { label: "Access Point", icon: <Wifi className="size-5" /> },
};

interface Placed {
  id: string;
  type: DeviceType;
  cell: number;
}

const COLS = 4;
const ROWS = 3;
const DEFAULT_REQUIRED = [
  { device: "computer", count: 2 },
  { device: "switch", count: 1 },
  { device: "router", count: 1 },
  { device: "server", count: 1 },
  { device: "printer", count: 1 },
  { device: "access-point", count: 1 },
];

const linkKey = (a: string, b: string) => [a, b].sort().join("|");

function PaletteChip({ type, remaining }: { type: DeviceType; remaining: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `new:${type}`, disabled: remaining <= 0 });
  const meta = DEVICE_META[type];
  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-[13px] font-semibold shadow-card select-none",
        isDragging && "z-30 shadow-pop",
        remaining > 0
          ? "cursor-grab border-ink-200 text-ink-800 hover:border-brand-300 active:cursor-grabbing"
          : "border-ink-100 text-ink-300",
      )}
      {...attributes}
      {...listeners}
    >
      <span className={remaining > 0 ? "text-brand-600" : "text-ink-300"}>
        {meta.icon}
      </span>
      {meta.label}
      <span className="tnum font-mono text-xs text-ink-400">×{remaining}</span>
    </div>
  );
}

function Cell({
  index,
  device,
  selected,
  onSelectDevice,
  onRemove,
}: {
  index: number;
  device?: Placed;
  selected: boolean;
  onSelectDevice: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${index}`,
    disabled: Boolean(device),
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex items-center justify-center rounded-lg border transition-colors",
        device
          ? "border-transparent"
          : isOver
            ? "border-2 border-dashed border-brand-500 bg-brand-50"
            : "border-dashed border-ink-200/80",
      )}
    >
      {device && (
        <button
          onClick={() => onSelectDevice(device.id)}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 bg-white px-3 py-2 shadow-card transition-all",
            selected
              ? "border-signal-500 shadow-[0_0_14px_-2px_var(--color-signal-400)]"
              : "border-ink-200 hover:border-brand-400",
          )}
          aria-pressed={selected}
          aria-label={`${DEVICE_META[device.type].label}${selected ? " (selected)" : ""}`}
        >
          <span className="text-ink-700">{DEVICE_META[device.type].icon}</span>
          <span className="text-[10px] font-bold tracking-wide text-ink-500 uppercase">
            {DEVICE_META[device.type].label}
          </span>
          <span
            role="button"
            aria-label="Remove device"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(device.id);
            }}
            className="absolute -top-2 -right-2 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-coral-500 text-white shadow group-hover:flex"
          >
            <X className="size-3" />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * Build the School Network — place devices, click two devices to cable them,
 * and watch the requirements checklist validate your design live.
 */
export function NetworkLab({
  config,
  title = "Network Lab",
  brief,
  onComplete,
  completed,
}: {
  config?: NetworkLabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const required = (config?.required ?? DEFAULT_REQUIRED) as {
    device: DeviceType;
    count: number;
  }[];
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [links, setLinks] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  const idRef = useMemo(() => ({ n: 1 }), []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const countOf = (t: DeviceType) => placed.filter((p) => p.type === t).length;
  const has = (a: string, b: string) => links.has(linkKey(a, b));
  const devicesOf = (t: DeviceType) => placed.filter((p) => p.type === t);
  const linkedToType = (id: string, t: DeviceType) =>
    devicesOf(t).some((d) => has(id, d.id));

  // Live validation checklist
  const checks = useMemo(() => {
    const list: { label: string; ok: boolean }[] = [];
    for (const r of required) {
      list.push({
        label: `Place ${r.count} × ${DEVICE_META[r.device].label}`,
        ok: countOf(r.device) >= r.count,
      });
    }
    const endDevices: DeviceType[] = ["computer", "printer", "server"];
    for (const t of endDevices) {
      if (!required.some((r) => r.device === t)) continue;
      const devs = devicesOf(t);
      list.push({
        label: `Every ${DEVICE_META[t].label.toLowerCase()} cabled to the switch`,
        ok: devs.length > 0 && devs.every((d) => linkedToType(d.id, "switch")),
      });
    }
    if (required.some((r) => r.device === "switch")) {
      const switches = devicesOf("switch");
      list.push({
        label: "Switch cabled to the router",
        ok: switches.length > 0 && switches.every((s) => linkedToType(s.id, "router")),
      });
    }
    if (required.some((r) => r.device === "access-point")) {
      const aps = devicesOf("access-point");
      list.push({
        label: "Access point cabled to the switch or router",
        ok:
          aps.length > 0 &&
          aps.every(
            (a) => linkedToType(a.id, "switch") || linkedToType(a.id, "router"),
          ),
      });
    }
    const routers = devicesOf("router");
    list.push({
      label: "Router connected to the Internet",
      ok: routers.length > 0 && routers.every((r) => has(r.id, "internet")),
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, links, required]);

  const done = checks.every((c) => c.ok) && placed.length > 0;
  // Fire completion once per successful build (reset clears the latch)
  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [done]);

  const handleDragEnd = (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("cell:") || !activeId.startsWith("new:"))
      return;
    const cell = Number(overId.slice(5));
    const type = activeId.slice(4) as DeviceType;
    const max = required.find((r) => r.device === type)?.count ?? 99;
    if (countOf(type) >= max) return;
    if (placed.some((p) => p.cell === cell)) return;
    setPlaced((p) => [...p, { id: `${type}-${idRef.n++}`, type, cell }]);
  };

  const selectDevice = (id: string) => {
    if (selected === null) return setSelected(id);
    if (selected === id) return setSelected(null);
    const key = linkKey(selected, id);
    setLinks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSelected(null);
  };

  const removeDevice = (id: string) => {
    setPlaced((p) => p.filter((d) => d.id !== id));
    setLinks((prev) => {
      const next = new Set<string>();
      prev.forEach((k) => {
        const [a, b] = k.split("|");
        if (a !== id && b !== id) next.add(k);
      });
      return next;
    });
    setSelected(null);
  };

  const reset = () => {
    setPlaced([]);
    setLinks(new Set());
    setSelected(null);
    completedRef.current = false;
  };

  // Geometry for SVG cables (percent coordinates)
  const cellCenter = (cell: number) => ({
    x: ((cell % COLS) + 0.5) * (100 / COLS),
    y: 22 + (Math.floor(cell / COLS) + 0.5) * (78 / ROWS),
  });
  const nodeCenter = (id: string) =>
    id === "internet"
      ? { x: 50, y: 9 }
      : cellCenter(placed.find((p) => p.id === id)?.cell ?? 0);

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || done}
    >
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
          <div>
            {/* Palette */}
            <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
              {required.map((r) => (
                <PaletteChip
                  key={r.device}
                  type={r.device}
                  remaining={r.count - countOf(r.device)}
                />
              ))}
            </div>

            {/* Canvas */}
            <div className="relative aspect-[4/3] w-full rounded-xl border-2 border-ink-200 bg-white">
              {/* cables */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                {[...links].map((k) => {
                  const [a, b] = k.split("|");
                  const pa = nodeCenter(a);
                  const pb = nodeCenter(b);
                  const wireless =
                    a.startsWith("access-point") || b.startsWith("access-point");
                  return (
                    <line
                      key={k}
                      x1={`${pa.x}%`}
                      y1={`${pa.y}%`}
                      x2={`${pb.x}%`}
                      y2={`${pb.y}%`}
                      stroke={done ? "var(--color-mint-500)" : "var(--color-brand-400)"}
                      strokeWidth="2.5"
                      strokeDasharray={wireless ? "6 5" : undefined}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Internet cloud */}
              <div className="absolute top-[2%] left-1/2 -translate-x-1/2">
                <button
                  onClick={() => selectDevice("internet")}
                  aria-pressed={selected === "internet"}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold shadow-card transition-all",
                    selected === "internet"
                      ? "border-signal-500 bg-signal-50 text-signal-700 shadow-[0_0_14px_-2px_var(--color-signal-400)]"
                      : "border-ink-300 bg-ink-900 text-white hover:border-signal-400",
                  )}
                >
                  <Cloud className="size-4.5" />
                  Internet
                </button>
              </div>

              {/* Grid cells */}
              <div
                className="absolute inset-x-3 bottom-3 grid gap-2"
                style={{
                  top: "22%",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                }}
              >
                {Array.from({ length: COLS * ROWS }).map((_, i) => (
                  <Cell
                    key={i}
                    index={i}
                    device={placed.find((p) => p.cell === i)}
                    selected={selected === placed.find((p) => p.cell === i)?.id}
                    onSelectDevice={selectDevice}
                    onRemove={removeDevice}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-400">
              Drag devices from the tray onto the grid. To run a cable: click one
              device, then click the other. Click a cable&apos;s two ends again to
              remove it.
            </p>
          </div>

          {/* Checklist */}
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
              Network requirements
            </p>
            <ul className="space-y-1.5">
              {checks.map((c, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium",
                    c.ok ? "bg-mint-100/60 text-mint-700" : "bg-ink-50 text-ink-500",
                  )}
                >
                  {c.ok ? (
                    <Check className="mt-0.5 size-3.5 shrink-0" />
                  ) : (
                    <span className="mt-1 block size-2 shrink-0 rounded-full border-2 border-ink-300" />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
            {done && (
              <p className="animate-pop mt-3 rounded-lg bg-mint-100 px-3 py-2.5 text-center text-sm font-bold text-mint-700">
                Network online! Every device can reach the Internet. 🎉
              </p>
            )}
          </div>
        </div>
      </DndContext>
    </LabShell>
  );
}
