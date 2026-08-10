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
  unitId: "g6-idw",
  lessonId,
  ...extra,
});

export const QR_CODES: QrTarget[] = [
  g6u1("g6-u1-l1", "Computer Systems — full mission", "lesson", "g6-idw-systems"),
  g6u1("g6-u1-l1-lab", "Computer Lab — assemble the machine", "lab", "g6-idw-systems", { labId: "computer", stageId: "lab" }),

  g6u1("g6-u1-l2", "Binary Numbers — full mission", "lesson", "g6-idw-binary"),
  g6u1("g6-u1-l2-lab", "Binary Lab — the bit switchboard", "lab", "g6-idw-binary", { labId: "binary", stageId: "lab" }),
  g6u1("g6-u1-l2-check", "Binary Numbers — checkpoint", "checkpoint", "g6-idw-binary", { stageId: "checkpoint" }),

  g6u1("g6-u1-l3", "Algorithms — full mission", "lesson", "g6-idw-algorithms"),
  g6u1("g6-u1-l3-lab", "Algorithm Lab — program the rover", "lab", "g6-idw-algorithms", { labId: "algorithm", stageId: "lab" }),
  g6u1("g6-u1-l3-challenge", "Algorithms — debugging challenge", "challenge", "g6-idw-algorithms", { stageId: "challenge" }),

  g6u1("g6-u1-l4", "Networks — full mission", "lesson", "g6-idw-networks"),
  g6u1("g6-u1-l4-lab", "Network Lab — wire the network", "lab", "g6-idw-networks", { labId: "network", stageId: "lab" }),
  g6u1("g6-u1-l4-check", "Networks — checkpoint", "checkpoint", "g6-idw-networks", { stageId: "checkpoint" }),

  g6u1("g6-u1-l5", "Cybersecurity — full mission", "lesson", "g6-idw-cyber"),
  g6u1("g6-u1-l5-lab", "Cyber Lab — judge the inbox", "lab", "g6-idw-cyber", { labId: "cyber", stageId: "lab" }),
  g6u1("g6-u1-l5-check", "Cybersecurity — checkpoint", "checkpoint", "g6-idw-cyber", { stageId: "checkpoint" }),
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
