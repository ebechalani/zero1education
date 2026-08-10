import { adminAuth } from "./admin";

/**
 * Lists every account in Firebase Auth with its ZERO1 role claim.
 *
 *   npm run users:list
 */

async function main() {
  const { users } = await adminAuth().listUsers(1000);

  if (users.length === 0) {
    console.log("\n  No accounts yet.\n");
    return;
  }

  const rows = users
    .map((u) => ({
      email: u.email ?? "(no email)",
      role: (u.customClaims?.role as string) ?? "— none —",
      school: (u.customClaims?.schoolId as string) ?? "—",
      created: u.metadata.creationTime?.slice(5, 16) ?? "",
      lastLogin: u.metadata.lastSignInTime ? "yes" : "never",
    }))
    .sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));

  const width = Math.max(...rows.map((r) => r.email.length), 5);

  console.log(`\n  ${users.length} accounts in Firebase Auth\n`);
  console.log(
    `  ${"EMAIL".padEnd(width)}  ${"ROLE".padEnd(13)} ${"SCHOOL".padEnd(11)} SIGNED IN`,
  );
  console.log(`  ${"-".repeat(width)}  ${"-".repeat(13)} ${"-".repeat(11)} ---------`);
  for (const r of rows) {
    console.log(
      `  ${r.email.padEnd(width)}  ${r.role.padEnd(13)} ${r.school.padEnd(11)} ${r.lastLogin}`,
    );
  }

  const noRole = rows.filter((r) => r.role === "— none —");
  if (noRole.length) {
    console.log(
      `\n  ${noRole.length} account(s) have no role and cannot sign in to any dashboard.`,
    );
    console.log("  Fix with: npm run set-claims -- <email> <role> <schoolId>");
    console.log("  Roles: student · teacher · school_admin · zero1_admin\n");
  } else {
    console.log("");
  }
}

main().catch((err) => {
  console.error("Failed to list users:", err);
  process.exit(1);
});
