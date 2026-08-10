import type { Activity } from "@/types/content";

export type ActivityValue =
  | string // mcq
  | string[] // multi, sort
  | boolean // truefalse
  | Record<string, string> // match (pairId → chosen right), fillblank (blankId → text), classify (itemId → categoryId)
  | null;

export interface Verdict {
  correct: boolean;
  /** 0–100, partial credit for multi-part kinds */
  score: number;
  /** per-item correctness for inline feedback */
  perItem?: Record<string, boolean>;
}

const pct = (ok: number, total: number) =>
  total === 0 ? 0 : Math.round((ok / total) * 100);

export function validateActivity(activity: Activity, value: ActivityValue): Verdict {
  switch (activity.kind) {
    case "mcq": {
      const correct = value === activity.answerId;
      return { correct, score: correct ? 100 : 0 };
    }
    case "truefalse": {
      const correct = value === activity.answer;
      return { correct, score: correct ? 100 : 0 };
    }
    case "multi": {
      const chosen = new Set((value as string[]) ?? []);
      const answers = new Set(activity.answerIds);
      const perItem: Record<string, boolean> = {};
      let ok = 0;
      for (const opt of activity.options) {
        const shouldPick = answers.has(opt.id);
        const picked = chosen.has(opt.id);
        const itemOk = shouldPick === picked;
        perItem[opt.id] = itemOk;
        if (itemOk) ok++;
      }
      const correct = ok === activity.options.length;
      return { correct, score: pct(ok, activity.options.length), perItem };
    }
    case "match": {
      const map = (value as Record<string, string>) ?? {};
      const perItem: Record<string, boolean> = {};
      let ok = 0;
      for (const pair of activity.pairs) {
        const itemOk = map[pair.id] === pair.right;
        perItem[pair.id] = itemOk;
        if (itemOk) ok++;
      }
      return {
        correct: ok === activity.pairs.length,
        score: pct(ok, activity.pairs.length),
        perItem,
      };
    }
    case "sort": {
      const order = (value as string[]) ?? [];
      const perItem: Record<string, boolean> = {};
      let ok = 0;
      activity.correctOrder.forEach((id, i) => {
        const itemOk = order[i] === id;
        perItem[id] = itemOk;
        if (itemOk) ok++;
      });
      return {
        correct: ok === activity.correctOrder.length,
        score: pct(ok, activity.correctOrder.length),
        perItem,
      };
    }
    case "classify": {
      const map = (value as Record<string, string>) ?? {};
      const perItem: Record<string, boolean> = {};
      let ok = 0;
      for (const item of activity.items) {
        const itemOk = map[item.id] === item.categoryId;
        perItem[item.id] = itemOk;
        if (itemOk) ok++;
      }
      return {
        correct: ok === activity.items.length,
        score: pct(ok, activity.items.length),
        perItem,
      };
    }
    case "fillblank": {
      const map = (value as Record<string, string>) ?? {};
      const blankIds = Object.keys(activity.blanks);
      const perItem: Record<string, boolean> = {};
      let ok = 0;
      for (const id of blankIds) {
        const given = (map[id] ?? "").trim().toLowerCase();
        const accepted = activity.blanks[id].map((a) => a.trim().toLowerCase());
        const itemOk = given.length > 0 && accepted.includes(given);
        perItem[id] = itemOk;
        if (itemOk) ok++;
      }
      return { correct: ok === blankIds.length, score: pct(ok, blankIds.length), perItem };
    }
  }
}

/** True when the student has provided enough input to check. */
export function isAnswerable(activity: Activity, value: ActivityValue): boolean {
  switch (activity.kind) {
    case "mcq":
      return typeof value === "string" && value.length > 0;
    case "truefalse":
      return typeof value === "boolean";
    case "multi":
      return Array.isArray(value) && value.length > 0;
    case "sort":
      return Array.isArray(value) && value.length === activity.items.length;
    case "match": {
      const map = (value as Record<string, string>) ?? {};
      return activity.pairs.every((p) => map[p.id]);
    }
    case "classify": {
      const map = (value as Record<string, string>) ?? {};
      return activity.items.every((i) => map[i.id]);
    }
    case "fillblank": {
      const map = (value as Record<string, string>) ?? {};
      return Object.keys(activity.blanks).every((b) => (map[b] ?? "").trim());
    }
  }
}
