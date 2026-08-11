"use client";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { Chip } from "@/components/ui/chip";
import { BookOpen, Building2, LayoutDashboard, Library, PenTool, QrCode } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/studio", label: "HQ Dashboard", icon: LayoutDashboard },
  { href: "/studio/curriculum", label: "Curriculum", icon: Library },
  { href: "/library", label: "Read the Book", icon: BookOpen },
  { href: "/studio/schools", label: "Schools", icon: Building2 },
  { href: "/studio/qr-codes", label: "QR Codes", icon: QrCode },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="zero1_admin">
      <WorldTheme world="innovator">
        <AppShell
          nav={NAV}
          roleLabel="ZERO1 Author & Admin"
          topbar={
            <Chip tone="violet" icon={<PenTool />}>
              ZERO1 Studio
            </Chip>
          }
        >
          {children}
        </AppShell>
      </WorldTheme>
    </RequireRole>
  );
}
