/**
 * Firebase environment configuration.
 * Demo mode is the default (docs/ARCHITECTURE.md §4): with no env vars set
 * nothing here touches the network and the app runs entirely on bundled
 * content + local storage.
 */

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// Next inlines NEXT_PUBLIC_* only on literal member access — keep them literal.
export const firebaseConfig: FirebaseEnvConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export type Zero1Mode = "demo" | "live";

export const ZERO1_MODE: Zero1Mode =
  process.env.NEXT_PUBLIC_ZERO1_MODE === "live" ? "live" : "demo";

/** Keys the SDK cannot initialise without. */
const REQUIRED_KEYS: (keyof FirebaseEnvConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

export function hasFirebaseCredentials(): boolean {
  return REQUIRED_KEYS.every((key) => Boolean(firebaseConfig[key]));
}

/**
 * Live only when the mode was opted into *and* the project is actually
 * configured — a half-filled .env.local falls back to demo rather than
 * crashing the app at boot.
 */
export function isLiveMode(): boolean {
  return ZERO1_MODE === "live" && hasFirebaseCredentials();
}

export function missingFirebaseKeys(): string[] {
  return REQUIRED_KEYS.filter((key) => !firebaseConfig[key]);
}
