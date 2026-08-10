import type { LabId } from "@/types/content";

/**
 * Server-safe list of lab ids.
 * The registry itself is a client module (it holds React components), so a
 * server build sees only a proxy of it — route generation reads this instead.
 * Keep in sync with LAB_REGISTRY in registry.tsx.
 */
export const LAB_IDS: LabId[] = [
  "binary",
  "computer",
  "algorithm",
  "network",
  "cyber",
  "logic",
  "web",
  "python",
  "database",
];
