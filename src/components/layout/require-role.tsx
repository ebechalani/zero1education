"use client";

import { useSession } from "@/stores/session-store";
import { useHydrated } from "@/lib/use-hydrated";
import type { Role } from "@/types/user";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side route guard for demo mode. In production, middleware verifies
 * the Firebase session cookie server-side before this ever renders — this
 * component is UX (instant redirects), rules are the real boundary.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const router = useRouter();
  const roles = Array.isArray(role) ? role : [role];
  // The ZERO1 author owns the whole platform and must be able to open every
  // surface to review it — student, teacher and school views included.
  const authorized =
    user !== null && (user.role === "zero1_admin" || roles.includes(user.role));

  useEffect(() => {
    if (hydrated && !authorized) router.replace("/login");
  }, [hydrated, authorized, router]);

  if (!hydrated || !authorized) {
    return (
      <div className="flex min-h-screen bg-paper">
        <div className="hidden w-60 bg-ink-900 lg:block" />
        <div className="flex-1 space-y-4 p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
