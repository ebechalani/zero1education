"use client";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { DemoChip } from "@/components/brand/demo-chip";
import { GraduationCap, KeyRound, LayoutDashboard, Users } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/people", label: "People", icon: Users },
  { href: "/admin/classes", label: "Classes", icon: GraduationCap },
  { href: "/admin/licenses", label: "Licenses & Reports", icon: KeyRound },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="school_admin">
      <WorldTheme world="innovator">
        <AppShell
          nav={NAV}
          roleLabel="School Administrator"
          topbar={<DemoChip label="Demo school" />}
        >
          {children}
        </AppShell>
      </WorldTheme>
    </RequireRole>
  );
}
