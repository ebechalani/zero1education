"use client";

import type { LabConfig, LabId } from "@/types/content";
import {
  Binary,
  Bot,
  Braces,
  Cpu,
  Database,
  GitBranch,
  Network,
  ShieldCheck,
  ToggleLeft,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { BinaryLab } from "./binary-lab";
import { ComputerLab } from "./computer-lab";
import { AlgorithmLab } from "./algorithm-lab";
import { NetworkLab } from "./network-lab";
import { CyberLab } from "./cyber-lab";
import { LogicLab } from "./logic-lab";

export interface LabProps {
  config?: LabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}

interface LabMeta {
  id: LabId;
  name: string;
  blurb: string;
  icon: ReactNode;
  component?: ComponentType<LabProps>;
  /** Skills reinforced when the lab is completed */
  skillIds: string[];
  gradeRange: string;
}

/**
 * The ZERO1 Lab registry. Adding a lab = one entry here + one component.
 * Entries without a component render as "in development" in the gallery —
 * the honest state, since QR codes in printed books point at lab IDs.
 */
export const LAB_REGISTRY: Record<LabId, LabMeta> = {
  binary: {
    id: "binary",
    name: "Binary Lab",
    blurb: "Flip real bits and watch numbers appear — place values you can touch.",
    icon: <Binary className="size-5" />,
    component: BinaryLab as ComponentType<LabProps>,
    skillIds: ["data-binary"],
    gradeRange: "Grades 4–8",
  },
  computer: {
    id: "computer",
    name: "Computer Lab",
    blurb: "Assemble a computer from its components until the system boots.",
    icon: <Cpu className="size-5" />,
    component: ComputerLab as ComponentType<LabProps>,
    skillIds: ["sys-hardware"],
    gradeRange: "Grades 2–7",
  },
  algorithm: {
    id: "algorithm",
    name: "Algorithm Lab",
    blurb: "Program a rover with blocks and watch it execute — literally.",
    icon: <GitBranch className="size-5" />,
    component: AlgorithmLab as ComponentType<LabProps>,
    skillIds: ["algo-sequence", "algo-iteration", "algo-debug"],
    gradeRange: "Grades 3–8",
  },
  network: {
    id: "network",
    name: "Network Lab",
    blurb: "Wire computers, switches and routers into a working network.",
    icon: <Network className="size-5" />,
    component: NetworkLab as ComponentType<LabProps>,
    skillIds: ["net-devices"],
    gradeRange: "Grades 5–9",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Lab",
    blurb: "Judge a suspicious inbox: spot phishing before it spots you.",
    icon: <ShieldCheck className="size-5" />,
    component: CyberLab as ComponentType<LabProps>,
    skillIds: ["cyber-phishing"],
    gradeRange: "Grades 5–12",
  },
  logic: {
    id: "logic",
    name: "Logic Lab",
    blurb: "AND, OR, XOR — explore the gates every processor is built from.",
    icon: <ToggleLeft className="size-5" />,
    component: LogicLab as ComponentType<LabProps>,
    skillIds: ["ct-abstraction"],
    gradeRange: "Grades 6–12",
  },
  web: {
    id: "web",
    name: "Web Lab",
    blurb: "Write HTML & CSS with a live preview. In development.",
    icon: <Braces className="size-5" />,
    skillIds: ["web-html"],
    gradeRange: "Grades 7–12",
  },
  python: {
    id: "python",
    name: "Python Lab",
    blurb: "A browser Python editor with tests and hints. In development.",
    icon: <Bot className="size-5" />,
    skillIds: ["prog-python"],
    gradeRange: "Grades 7–12",
  },
  database: {
    id: "database",
    name: "Database Lab",
    blurb: "Tables, records and first queries. In development.",
    icon: <Database className="size-5" />,
    skillIds: ["data-analysis"],
    gradeRange: "Grades 9–12",
  },
};

export function LabRunner({
  labId,
  ...props
}: LabProps & { labId: LabId }) {
  const meta = LAB_REGISTRY[labId];
  const Comp = meta?.component;
  if (!Comp) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-8 text-center">
        <p className="font-display text-sm font-semibold text-ink-700">
          {meta?.name ?? labId} is in development
        </p>
        <p className="mt-1 text-sm text-ink-500">
          This lab slot is reserved in the engine — it ships in a later release.
        </p>
      </div>
    );
  }
  return <Comp {...props} />;
}
