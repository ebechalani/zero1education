"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import { create } from "zustand";

type Tone = "success" | "info" | "warning" | "error";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(
  title: string,
  opts?: { description?: string; tone?: Tone },
) {
  useToasts.getState().push({
    title,
    description: opts?.description,
    tone: opts?.tone ?? "info",
  });
}

const icons: Record<Tone, React.ReactNode> = {
  success: <CheckCircle2 className="size-4.5 text-mint-500" />,
  info: <Info className="size-4.5 text-brand-500" />,
  warning: <TriangleAlert className="size-4.5 text-amber-500" />,
  error: <XCircle className="size-4.5 text-coral-500" />,
};

export function ToastRegion() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            "animate-pop pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-lg border border-ink-100 bg-white p-3.5 text-left shadow-pop",
          )}
        >
          <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">
              {t.title}
            </span>
            {t.description && (
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
                {t.description}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
