"use client";

import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RequireRole } from "@/components/layout/require-role";
import { WorldTheme } from "@/components/brand/world-badge";
import { useProgress, summarize } from "@/stores/progress-store";
import { useHydrated } from "@/lib/use-hydrated";
import { toBinary } from "@/lib/xp";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Award,
  BookOpen,
  CircuitBoard,
  FlaskConical,
  FolderKanban,
  Home,
  Map,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Flame } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/journey", label: "My Journey", icon: Map },
  { href: "/library", label: "Read the Book", icon: BookOpen },
  { href: "/microbit", label: "micro:bit Studio", icon: CircuitBoard },
  { href: "/student/labs", label: "ZERO1 Labs", icon: FlaskConical },
  { href: "/student/projects", label: "Projects", icon: Rocket },
  { href: "/student/skills", label: "Digital Passport", icon: Sparkles },
  { href: "/student/portfolio", label: "My Portfolio", icon: FolderKanban },
  { href: "/student/achievements", label: "Achievements", icon: Award },
];

function XpChip() {
  const hydrated = useHydrated();
  const state = useProgress();
  if (!hydrated) return null;
  const s = summarize(state);
  return (
    <div className="flex items-center gap-2">
      {s.streakDays > 0 && (
        <Tooltip label={`${s.streakDays}-day learning streak`}>
          <span className="flex items-center gap-1 rounded-full bg-coral-100 px-2.5 py-1 text-xs font-bold text-coral-600">
            <Flame className="size-3.5" />
            {s.streakDays}
          </span>
        </Tooltip>
      )}
      <Tooltip label={`Level ${s.level} — ${toBinary(s.level)} in binary · ${s.xpIntoLevel}/${s.xpForNextLevel} XP to next level`}>
        <span className="flex items-center gap-1.5 rounded-full bg-ink-900 py-1 pr-3 pl-1.5 text-xs font-bold text-white">
          <span className="flex size-5 items-center justify-center rounded-full text-[10px] [background:var(--world-accent)]">
            {s.level}
          </span>
          <span className="tnum font-mono">{s.xp} XP</span>
        </span>
      </Tooltip>
    </div>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole role="student">
      <WorldTheme world="creator">
        <AppShell nav={NAV} roleLabel="Student · Grade 6" topbar={<XpChip />}>
          {children}
        </AppShell>
      </WorldTheme>
    </RequireRole>
  );
}
