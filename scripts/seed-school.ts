import { adminAuth, adminDb, logStep } from "./admin";
import { DEMO_SCHOOL } from "../src/content/demo/users";
import { ROSTER } from "../src/content/demo/classroom";
import type { Role } from "../src/types/user";

/**
 * Creates a school tenant with a class, a teacher and a student roster, so a
 * fresh Firebase project is immediately usable end to end.
 *
 *   npm run seed:school
 *   npm run seed:school -- --password "ChooseAStrongOne1!"
 *
 * Every account is created with the SAME temporary password, which is printed
 * once at the end. Change it (or force a reset) before real students use it —
 * this is a bootstrap convenience, not a production provisioning flow.
 */

const SCHOOL_ID = DEMO_SCHOOL.id;
const CLASS_ID = "cls-6a";
const DOMAIN = "cedars.edu.lb";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function upsertUser(
  email: string,
  password: string,
  displayName: string,
  role: Role,
  profile: Record<string, unknown>,
) {
  const auth = adminAuth();
  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    user = await auth.createUser({ email, password, displayName });
  }
  await auth.setCustomUserClaims(user.uid, { role, schoolId: SCHOOL_ID });
  await adminDb()
    .doc(`users/${user.uid}`)
    .set(
      {
        uid: user.uid,
        email,
        role,
        schoolId: SCHOOL_ID,
        status: "active",
        createdAt: new Date().toISOString(),
        ...profile,
      },
      { merge: true },
    );
  return user.uid;
}

async function main() {
  const password = argValue("--password") ?? "Zero1-Change-Me-2026";
  const db = adminDb();

  logStep(`Creating school ${DEMO_SCHOOL.name}…`);
  await db.doc(`schools/${SCHOOL_ID}`).set({
    ...DEMO_SCHOOL,
    seatsUsed: ROSTER.length + 1,
    updatedAt: new Date().toISOString(),
  });

  await db.doc(`licenses/lic-${SCHOOL_ID}`).set({
    id: `lic-${SCHOOL_ID}`,
    schoolId: SCHOOL_ID,
    plan: DEMO_SCHOOL.plan,
    seats: DEMO_SCHOOL.seats,
    validFrom: "2025-09-01",
    validTo: "2026-09-01",
    status: "active",
  });

  logStep("Creating teacher…");
  const teacherUid = await upsertUser(
    `r.khoury@${DOMAIN}`,
    password,
    "Rana Khoury",
    "teacher",
    {
      firstName: "Rana",
      lastName: "Khoury",
      title: "ICT Teacher — Middle School",
      avatarHue: 262,
      classIds: [CLASS_ID],
    },
  );

  logStep("Creating school administrator…");
  await upsertUser(`n.chami@${DOMAIN}`, password, "Nadine Chami", "school_admin", {
    firstName: "Nadine",
    lastName: "Chami",
    title: "Head of Digital Learning",
    avatarHue: 25,
    classIds: [],
  });

  logStep(`Creating ${ROSTER.length} students…`);
  const studentUids: string[] = [];
  for (const s of ROSTER) {
    const email = `${s.firstName}.${s.lastName}`
      .toLowerCase()
      .replace(/[^a-z.]/g, "")
      .concat(`@student.${DOMAIN}`);
    const uid = await upsertUser(email, password, `${s.firstName} ${s.lastName}`, "student", {
      firstName: s.firstName,
      lastName: s.lastName,
      grade: 6,
      avatarHue: s.avatarHue,
      classIds: [CLASS_ID],
    });
    studentUids.push(uid);
  }

  logStep("Creating class…");
  await db.doc(`classes/${CLASS_ID}`).set({
    id: CLASS_ID,
    schoolId: SCHOOL_ID,
    name: "Grade 6 — Section A",
    grade: 6,
    teacherIds: [teacherUid],
    studentIds: studentUids,
    updatedAt: new Date().toISOString(),
  });

  logStep("");
  logStep(`Done. School ${SCHOOL_ID} · 1 class · 1 teacher · ${studentUids.length} students.`);
  logStep("");
  logStep(`  Teacher:  r.khoury@${DOMAIN}`);
  logStep(`  Admin:    n.chami@${DOMAIN}`);
  logStep(`  Student:  maya.haddad@student.${DOMAIN}`);
  logStep(`  Password: ${password}`);
  logStep("");
  logStep("Change these passwords before real students use the platform.");
  logStep("Create your own ZERO1 admin with: npm run set-claims -- <you> zero1_admin zero1-hq");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
