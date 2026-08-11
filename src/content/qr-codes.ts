/**
 * Printed-book QR redirect table — the stable-code contract (ARCHITECTURE §3).
 *
 * A code is printed on paper and can never be reissued, so it addresses a
 * *position* in the curriculum (grade → unit → lesson → target), never a
 * document ID. Content may be restructured, renamed or re-authored: the table
 * is repointed and every book already in a classroom keeps working.
 * Changing `code` breaks paper. Changing what it resolves to is free.
 */

export interface QrTarget {
  code: string;
  label: string;
  kind: "lesson" | "lab" | "challenge" | "checkpoint";
  gradeId: string;
  unitId: string;
  lessonId?: string;
  labId?: string;
  stageId?: string;
}

/** Canonical origin printed under every QR code in the books. */
const PRINTED_ORIGIN = "https://zero1.education";

const g6u1 = (
  code: string,
  label: string,
  kind: QrTarget["kind"],
  lessonId: string,
  extra: Partial<QrTarget> = {},
): QrTarget => ({
  code,
  label,
  kind,
  gradeId: "g6",
  unitId: "g6-microbit",
  lessonId,
  ...extra,
});

/**
 * Grade 6 Chapter 1 — MakeCode for micro:bit. Codes read grade · chapter ·
 * lesson so a teacher can recognise one at a glance, and they never contain a
 * document id, so the curriculum can be restructured without reprinting.
 */
export const QR_CODES: QrTarget[] = [
  g6u1("g6-c1-l1", "Introduction to Microcontrollers", "lesson", "g6-mb-01"),
  g6u1("g6-c1-l1-lab", "Computer Lab — assemble the machine", "lab", "g6-mb-01", { labId: "computer", stageId: "lab" }),

  g6u1("g6-c1-l2", "Defining Smart Objects & IOT", "lesson", "g6-mb-02"),

  g6u1("g6-c1-l3", "The Micro-controller & Push Buttons", "lesson", "g6-mb-03"),

  g6u1("g6-c1-l4", "Creating a Stopwatch Using a Variable", "lesson", "g6-mb-04"),
  g6u1("g6-c1-l4-check", "Stopwatch — checkpoint", "checkpoint", "g6-mb-04", { stageId: "checkpoint" }),

  g6u1("g6-c1-l5", "Creating a Project with Two Variables", "lesson", "g6-mb-05"),

  g6u1("g6-c1-l6", "Controlling the LEDs of the micro:bit", "lesson", "g6-mb-06"),

  g6u1("g6-c1-l7", "Integrating a Variable to Control the LEDs", "lesson", "g6-mb-07"),
  g6u1("g6-c1-l7-lab", "Algorithm Lab — practise loops", "lab", "g6-mb-07", { labId: "algorithm", stageId: "lab" }),

  g6u1("g6-c1-l8", "The Kitronik Air Quality Station", "lesson", "g6-mb-08"),

  g6u1("g6-c1-l9", "Displaying Visual Warnings", "lesson", "g6-mb-09"),

  g6u1("g6-c1-l10", "Evaluation Sheet", "lesson", "g6-mb-10"),
  g6u1("g6-c1-l10-check", "Chapter 1 — test your knowledge", "checkpoint", "g6-mb-10", { stageId: "checkpoint" }),
];

const byCode = new Map(QR_CODES.map((t) => [t.code, t]));

/** Scanned codes arrive from cameras and keyboards — match case-insensitively. */
export function resolveQr(code: string): QrTarget | undefined {
  return byCode.get(code.trim().toLowerCase());
}

/** Where a resolved code lands in the student app. */
export function qrDestination(target: QrTarget): string | undefined {
  if (target.kind === "lab") {
    return target.labId ? `/student/labs/${target.labId}` : undefined;
  }
  return target.lessonId ? `/student/lesson/${target.lessonId}` : undefined;
}

/** The full URL as it is printed beneath the QR square. */
export function qrUrl(code: string): string {
  return `${PRINTED_ORIGIN}/go/${code}`;
}
