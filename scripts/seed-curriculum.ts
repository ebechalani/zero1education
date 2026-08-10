import { adminDb, logStep } from "./admin";
import { CATALOG } from "../src/content/curriculum/catalog";
import { ALL_LESSONS } from "../src/content/curriculum";
import { SKILLS } from "../src/content/skills";
import { BADGES } from "../src/content/badges";
import { QR_CODES } from "../src/content/qr-codes";
import { GRADES } from "../src/lib/worlds";

/**
 * Pushes the bundled ZERO1 curriculum into Firestore.
 *
 *   npm run seed:curriculum
 *
 * Idempotent: documents are written by their stable IDs, so re-running updates
 * in place rather than duplicating. Published lessons also get an immutable
 * snapshot under lessons/{id}/versions/{v} so Studio can roll back.
 *
 * Curriculum is global (not tenant-scoped) — it is authored by ZERO1 and read
 * by every school. Security rules make it read-only to everyone but
 * zero1_admin, which is why this runs through the Admin SDK.
 */

async function main() {
  const db = adminDb();
  const stamp = new Date().toISOString();

  logStep("Seeding grades…");
  let batch = db.batch();
  let ops = 0;
  const flush = async (force = false) => {
    if (ops >= 400 || (force && ops > 0)) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (const grade of GRADES) {
    batch.set(db.doc(`grades/${grade.id}`), { ...grade, updatedAt: stamp });
    ops++;
    await flush();
  }

  logStep(`Seeding ${CATALOG.length} units…`);
  for (const unit of CATALOG) {
    batch.set(db.doc(`units/${unit.id}`), { ...unit, updatedAt: stamp });
    ops++;
    await flush();
  }

  logStep(`Seeding ${ALL_LESSONS.length} lessons…`);
  for (const lesson of ALL_LESSONS) {
    batch.set(db.doc(`lessons/${lesson.id}`), { ...lesson, updatedAt: stamp });
    ops++;
    await flush();
  }

  logStep(`Seeding ${SKILLS.length} skills and ${BADGES.length} badges…`);
  for (const skill of SKILLS) {
    batch.set(db.doc(`skills/${skill.id}`), skill);
    ops++;
    await flush();
  }
  for (const badge of BADGES) {
    batch.set(db.doc(`badges/${badge.id}`), badge);
    ops++;
    await flush();
  }

  logStep(`Seeding ${QR_CODES.length} printed-book QR codes…`);
  for (const qr of QR_CODES) {
    batch.set(db.doc(`qrCodes/${qr.code}`), qr);
    ops++;
    await flush();
  }
  await flush(true);

  // Immutable published snapshots — one per published lesson, for rollback.
  const published = ALL_LESSONS.filter((l) => l.status === "published");
  logStep(`Writing ${published.length} published version snapshots…`);
  for (const lesson of published) {
    const versionId = `v${stamp.replace(/[:.]/g, "-")}`;
    await db.doc(`lessons/${lesson.id}/versions/${versionId}`).set({
      stages: lesson.stages,
      title: lesson.title,
      publishedAt: stamp,
      label: "Seed import",
    });
  }

  logStep("");
  logStep(`Done. ${CATALOG.length} units · ${ALL_LESSONS.length} lessons · ${published.length} published.`);
  logStep("Next: npm run seed:school  (creates a school, classes and users)");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
