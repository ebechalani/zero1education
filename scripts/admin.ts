import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Shared Firebase Admin bootstrap for the CLI scripts.
 *
 * Credentials come from a service-account JSON key, located by (in order):
 *   1. GOOGLE_APPLICATION_CREDENTIALS  (path to the key file)
 *   2. FIREBASE_SERVICE_ACCOUNT        (the JSON itself, e.g. in CI)
 *   3. ./service-account.json          (gitignored local file)
 *
 * The Admin SDK bypasses security rules by design — these scripts are meant to
 * be run by a ZERO1 administrator from a trusted machine, never shipped to the
 * browser. Keep the key out of version control.
 */

let app: App | undefined;

export function adminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    resolve(process.cwd(), "service-account.json");

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = inline
      ? JSON.parse(inline)
      : JSON.parse(readFileSync(keyPath, "utf8"));
  } catch {
    console.error(
      `\n  Could not load Firebase credentials.\n\n` +
        `  Download a service-account key from:\n` +
        `    Firebase console → Project settings → Service accounts → Generate new private key\n\n` +
        `  Then either save it as ./service-account.json (already gitignored),\n` +
        `  or set GOOGLE_APPLICATION_CREDENTIALS to its path.\n`,
    );
    process.exit(1);
  }

  app = initializeApp({
    credential: cert(serviceAccount as never),
    projectId: serviceAccount.project_id,
  });
  return app;
}

export const adminDb = () => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());

export function logStep(message: string) {
  process.stdout.write(`  ${message}\n`);
}
