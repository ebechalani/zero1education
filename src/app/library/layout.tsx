"use client";

import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/stores/session-store";
import { LayoutDashboard, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const HOME_FOR = {
  student: "/student",
  teacher: "/teacher",
  school_admin: "/admin",
  zero1_admin: "/studio",
} as const;

/**
 * The library is readable by every signed-in role — it is the curriculum
 * itself, not anyone's private data. Only the sign-in wall applies.
 */
export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-paper p-8">
        <Skeleton className="mx-auto h-10 w-64" />
        <Skeleton className="mx-auto mt-6 h-96 max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 lg:px-6">
          <Link href="/library" aria-label="ZERO1 library">
            <Logo size="sm" />
          </Link>
          <span className="hidden font-mono text-[10px] tracking-[0.25em] text-ink-400 uppercase sm:block">
            Library
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              href={HOME_FOR[user.role]}
              variant="secondary"
              size="sm"
              icon={<LayoutDashboard />}
            >
              My dashboard
            </Button>
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              hue={user.avatarHue}
              size="sm"
            />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
