"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MissionStage } from "@/types/content";

/**
 * ZERO1 Studio drafts. In demo mode drafts persist to localStorage; in
 * production the same shape writes to the `lessons` doc (draft) plus its
 * `versions` subcollection (published snapshots) — see docs/FIREBASE.md.
 */

export interface LessonDraft {
  lessonId: string;
  title: string;
  stages: MissionStage[];
  status: "draft" | "published";
  updatedAt: string;
  versions: { ts: string; label: string; stages: MissionStage[] }[];
}

interface StudioStore {
  drafts: Record<string, LessonDraft>;
  saveDraft: (
    lessonId: string,
    title: string,
    stages: MissionStage[],
    opts?: { publish?: boolean; versionLabel?: string },
  ) => void;
  restoreVersion: (lessonId: string, ts: string) => void;
  discardDraft: (lessonId: string) => void;
}

export const useStudio = create<StudioStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (lessonId, title, stages, opts) => {
        const existing = get().drafts[lessonId];
        const now = new Date().toISOString();
        const versions = [
          {
            ts: now,
            label:
              opts?.versionLabel ??
              (opts?.publish ? "Published" : "Draft saved"),
            stages,
          },
          ...(existing?.versions ?? []),
        ].slice(0, 10);
        set((s) => ({
          drafts: {
            ...s.drafts,
            [lessonId]: {
              lessonId,
              title,
              stages,
              status: opts?.publish ? "published" : "draft",
              updatedAt: now,
              versions,
            },
          },
        }));
      },

      restoreVersion: (lessonId, ts) => {
        const draft = get().drafts[lessonId];
        const version = draft?.versions.find((v) => v.ts === ts);
        if (!draft || !version) return;
        set((s) => ({
          drafts: {
            ...s.drafts,
            [lessonId]: {
              ...draft,
              stages: version.stages,
              status: "draft",
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      discardDraft: (lessonId) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[lessonId];
          return { drafts };
        }),
    }),
    { name: "zero1-studio-v1" },
  ),
);
