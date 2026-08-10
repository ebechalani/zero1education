import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reports whether .env.local is complete enough to run in live mode.
 *
 *   npm run check:env
 *
 * Reads the file directly rather than importing the app config, so it works
 * without a build and reports on the file the developer actually edited.
 */

const REQUIRED = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const OPTIONAL = [
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
];

const path = resolve(process.cwd(), ".env.local");

let raw: string;
try {
  raw = readFileSync(path, "utf8");
} catch {
  console.log("\n  No .env.local found.\n");
  console.log("  Create it by copying the template:");
  console.log("    cp .env.example .env.local\n");
  console.log("  The app runs fine without it — in demo mode.\n");
  process.exit(0);
}

const values = new Map<string, string>();
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  values.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
}

const mode = values.get("NEXT_PUBLIC_ZERO1_MODE") || "demo";
const missing = REQUIRED.filter((k) => !values.get(k));
const missingOptional = OPTIONAL.filter((k) => !values.get(k));

console.log("\n  ZERO1 environment check\n");
console.log(`  Mode requested: ${mode}`);

for (const key of [...REQUIRED, ...OPTIONAL]) {
  const value = values.get(key);
  const short = key.replace("NEXT_PUBLIC_FIREBASE_", "").replace("NEXT_PUBLIC_", "");
  if (value) {
    // Never print secrets in full — enough to confirm it's the right value.
    const masked =
      value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
    console.log(`    ok       ${short.padEnd(20)} ${masked}`);
  } else {
    console.log(`    missing  ${short}`);
  }
}

console.log("");

// Quoted or placeholder values are the most common paste mistake.
const suspicious = [...values.entries()].filter(
  ([k, v]) =>
    k.startsWith("NEXT_PUBLIC_FIREBASE_") &&
    v &&
    (/^["']|["']$/.test(v) || v.includes("…") || v.startsWith("<")),
);
if (suspicious.length) {
  console.log("  Fix these — values must have no quotes and no placeholders:");
  for (const [k] of suspicious) console.log(`    ${k}`);
  console.log("");
}

if (mode !== "live") {
  console.log("  Result: DEMO mode (NEXT_PUBLIC_ZERO1_MODE is not 'live').");
  console.log("  That's a valid way to run and publish — no Firebase needed.\n");
} else if (missing.length) {
  console.log("  Result: DEMO mode — live was requested but keys are missing:");
  for (const k of missing) console.log(`    ${k}`);
  console.log("\n  Get them from: Firebase console → Project settings → Your apps.\n");
} else {
  console.log("  Result: LIVE mode. Firebase will be used.\n");
  if (missingOptional.length) {
    console.log("  Optional keys not set (fine to leave empty):");
    for (const k of missingOptional) console.log(`    ${k}`);
    console.log("");
  }
  console.log("  Next:");
  console.log("    npm run firebase:deploy    (push security rules)");
  console.log("    npm run seed:curriculum    (load the curriculum)");
  console.log("    npm run seed:school        (create school + users)\n");
}
