import { adminAuth, adminDb, logStep } from "./admin";
import type { Role } from "../src/types/user";

/**
 * Stamps the custom claims that drive every security rule.
 *
 *   npm run set-claims -- <email> <role> <schoolId>
 *   npm run set-claims -- rana@cedars.edu.lb teacher sch-cedars
 *
 * Roles: student | teacher | school_admin | zero1_admin
 *
 * Claims — not the user's Firestore profile — are what Firestore rules read,
 * so a client that edits its own profile document cannot escalate privileges
 * (docs/FIREBASE.md §2). In production a Cloud Function does this automatically
 * on user creation; this script is the manual/bootstrap path.
 */

const ROLES: Role[] = ["student", "teacher", "school_admin", "zero1_admin"];

async function main() {
  const [email, role, schoolId] = process.argv.slice(2);

  if (!email || !role || !schoolId) {
    console.error(
      "\n  Usage: npm run set-claims -- <email> <role> <schoolId>\n" +
        `  Roles: ${ROLES.join(" | ")}\n`,
    );
    process.exit(1);
  }
  if (!ROLES.includes(role as Role)) {
    console.error(`\n  Unknown role "${role}". Use one of: ${ROLES.join(", ")}\n`);
    process.exit(1);
  }

  const auth = adminAuth();
  const user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    console.error(
      `\n  No Firebase Auth user with email ${email}.\n` +
        `  Create the account first (Firebase console → Authentication → Add user).\n`,
    );
    process.exit(1);
  }

  await auth.setCustomUserClaims(user.uid, { role, schoolId });
  // Force the next request to mint a fresh token carrying the new claims.
  await auth.revokeRefreshTokens(user.uid);

  // Keep the profile document in step so the UI has a name to show.
  await adminDb()
    .doc(`users/${user.uid}`)
    .set(
      {
        uid: user.uid,
        email,
        role,
        schoolId,
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

  logStep(`${email} → role=${role} schoolId=${schoolId}`);
  logStep(`uid: ${user.uid}`);
  logStep("Claims set and existing sessions revoked — sign in again to pick them up.");
}

main().catch((err) => {
  console.error("set-claims failed:", err);
  process.exit(1);
});
