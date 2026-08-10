"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser, Role } from "@/types/user";
import { authService } from "@/services/auth-service";
import { isLiveMode } from "@/lib/firebase/config";

/**
 * Session state. Both modes go through the same AuthService: in demo mode it
 * resolves a sample identity locally, in live mode it authenticates against
 * Firebase and reads role/schoolId from custom claims. Screens only ever see
 * `user`, so nothing below the store knows which adapter is active.
 */
interface SessionStore {
  user: AppUser | null;
  /** Sign in with a demo identity (demo mode only). */
  signInAs: (role: Role) => Promise<void>;
  /** Sign in with real credentials (live mode). */
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-hydrate from Firebase after a reload (live mode only). */
  refresh: () => Promise<void>;
}

export const useSession = create<SessionStore>()(
  persist(
    (set) => ({
      user: null,

      signInAs: async (role) => {
        const session = await authService.signIn({ kind: "demo-role", role });
        set({ user: session.user });
      },

      signInWithPassword: async (email, password) => {
        const session = await authService.signIn({
          kind: "password",
          email,
          password,
        });
        set({ user: session.user });
      },

      signOut: async () => {
        await authService.signOut();
        set({ user: null });
      },

      refresh: async () => {
        if (!isLiveMode()) return;
        const session = await authService.getSession();
        set({ user: session?.user ?? null });
      },
    }),
    {
      name: "zero1-session-v1",
      // In live mode Firebase owns the session; only the profile is cached for
      // instant paint, and refresh() re-verifies it against the ID token.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
