import type { AuthService, Credentials, Session } from "./types";
import { isLiveMode } from "@/lib/firebase/config";
import { DEMO_USERS } from "@/content/demo/users";
import type { AppUser, Role } from "@/types/user";

/**
 * Auth has two adapters behind one interface. The demo adapter resolves a
 * sample identity locally; the live adapter authenticates against Firebase and
 * reads the profile from `users/{uid}`, with role/schoolId coming from custom
 * claims (never from client-writable data — see docs/FIREBASE.md §2).
 */

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid-credentials"
      | "no-profile"
      | "disabled"
      | "unavailable"
      | "unknown",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ── Demo adapter ────────────────────────────────────────────────────────────

const demoAuthService: AuthService = {
  async getSession() {
    return null; // the session store owns persistence in demo mode
  },
  async signIn(credentials: Credentials): Promise<Session> {
    if (credentials.kind !== "demo-role") {
      throw new AuthError(
        "Email sign-in needs Firebase. Set NEXT_PUBLIC_ZERO1_MODE=live and the Firebase keys, or continue with a demo role.",
        "unavailable",
      );
    }
    const user = DEMO_USERS.find((u) => u.role === credentials.role);
    if (!user) throw new AuthError("Unknown demo role.", "invalid-credentials");
    return {
      user: { ...user, lastLogin: new Date().toISOString() },
      claims: { role: user.role, schoolId: user.schoolId },
    };
  },
  async signOut() {},
};

// ── Live adapter ────────────────────────────────────────────────────────────

/** Maps Firebase Auth error codes to messages safe to show a child. */
function friendlyAuthError(code: string): AuthError {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return new AuthError(
        "That email and password don't match an account.",
        "invalid-credentials",
      );
    case "auth/user-disabled":
      return new AuthError(
        "This account has been disabled. Ask your teacher or school admin.",
        "disabled",
      );
    case "auth/too-many-requests":
      return new AuthError(
        "Too many attempts. Wait a moment and try again.",
        "unavailable",
      );
    case "auth/network-request-failed":
      return new AuthError(
        "Can't reach ZERO1 right now. Check your connection.",
        "unavailable",
      );
    default:
      return new AuthError("Sign-in failed. Please try again.", "unknown");
  }
}

async function sessionFromFirebaseUser(uid: string): Promise<Session> {
  const [{ getFirebaseAuth, getDb }, { doc, getDoc }] = await Promise.all([
    import("@/lib/firebase/client"),
    import("firebase/firestore"),
  ]);
  const auth = getFirebaseAuth();
  const db = getDb();
  if (!auth?.currentUser || !db) {
    throw new AuthError("Firebase is not configured.", "unavailable");
  }

  // Role and schoolId come from custom claims — a tampered client cannot
  // escalate, because Firestore rules read the same token, not the profile doc.
  const token = await auth.currentUser.getIdTokenResult();
  const role = token.claims.role as Role | undefined;
  const schoolId = token.claims.schoolId as string | undefined;
  if (!role || !schoolId) {
    throw new AuthError(
      "This account has no ZERO1 role yet. A ZERO1 admin must finish provisioning it.",
      "no-profile",
    );
  }

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) {
    throw new AuthError("No ZERO1 profile found for this account.", "no-profile");
  }
  const profile = snap.data() as Omit<AppUser, "uid">;
  if (profile.status === "disabled") {
    throw new AuthError("This account has been disabled.", "disabled");
  }

  return {
    user: { ...profile, uid, role, schoolId },
    claims: { role, schoolId },
  };
}

const liveAuthService: AuthService = {
  async getSession() {
    const { getFirebaseAuth } = await import("@/lib/firebase/client");
    const auth = getFirebaseAuth();
    const current = auth?.currentUser;
    if (!current) return null;
    try {
      return await sessionFromFirebaseUser(current.uid);
    } catch {
      return null;
    }
  },

  async signIn(credentials: Credentials): Promise<Session> {
    if (credentials.kind === "demo-role") {
      throw new AuthError(
        "Demo roles are disabled in live mode. Sign in with your school account.",
        "unavailable",
      );
    }
    const [{ getFirebaseAuth }, { signInWithEmailAndPassword }] =
      await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/auth"),
      ]);
    const auth = getFirebaseAuth();
    if (!auth) throw new AuthError("Firebase is not configured.", "unavailable");
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      return await sessionFromFirebaseUser(cred.user.uid);
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw friendlyAuthError((err as { code?: string }).code ?? "");
    }
  },

  async signOut() {
    const [{ getFirebaseAuth }, { signOut }] = await Promise.all([
      import("@/lib/firebase/client"),
      import("firebase/auth"),
    ]);
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  },
};

export const authService: AuthService = isLiveMode()
  ? liveAuthService
  : demoAuthService;

export { demoAuthService, liveAuthService };
