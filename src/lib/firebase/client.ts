import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig, isLiveMode } from "./config";

/**
 * Lazy Firebase client. Nothing is initialised at import time, and in demo
 * mode every getter returns null — callers gate on isLiveMode() and fall back
 * to the demo adapters, so the app boots with zero Firebase env vars.
 */

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isLiveMode()) return null;
  // getApps() guard: dev HMR re-runs this module and would otherwise re-init.
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = getFirebaseApp();
  if (!instance) return null;
  if (!auth) auth = getAuth(instance);
  return auth;
}

export function getDb(): Firestore | null {
  const instance = getFirebaseApp();
  if (!instance) return null;
  if (!db) db = getFirestore(instance);
  return db;
}

export function getStorageBucket(): FirebaseStorage | null {
  const instance = getFirebaseApp();
  if (!instance) return null;
  if (!storage) storage = getStorage(instance);
  return storage;
}
