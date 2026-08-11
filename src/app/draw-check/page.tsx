"use client";

import { DrawStudio } from "@/features/draw/draw-studio";
import { DRAW_EXERCISES } from "@/features/draw/exercises";
import { useState } from "react";

export default function DrawCheckPage() {
  const [index, setIndex] = useState(0);
  return (
    <main className="mx-auto max-w-7xl p-6">
      <select
        aria-label="Exercise"
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="mb-4 rounded border border-ink-300 px-3 py-2"
      >
        {DRAW_EXERCISES.map((ex, i) => (
          <option key={ex.id} value={i}>
            {ex.lessonId} · {ex.title}
          </option>
        ))}
      </select>
      <DrawStudio exercise={DRAW_EXERCISES[index]} />
    </main>
  );
}
