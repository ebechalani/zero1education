"use client";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { DemoChip } from "@/components/brand/demo-chip";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Library,
  Users,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/classes", label: "My Classes", icon: Users },
  { href: "/teacher/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/library", label: "Read the Book", icon: Library },
  { href: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="teacher">
      <WorldTheme world="creator">
        <AppShell
          nav={NAV}
          roleLabel="Teacher · ZERO1 Hub"
          topbar={<DemoChip label="Demo classroom" />}
        >
          {children}
        </AppShell>
      </WorldTheme>
    </RequireRole>
  );
}
