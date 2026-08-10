"use client";

import { Button } from "@/components/ui/button";
import { LAB_REGISTRY, LabRunner } from "@/features/labs/registry";
import type { LabId } from "@/types/content";
import { ArrowLeft } from "lucide-react";
import { notFound, useParams } from "next/navigation";

export default function LabPage() {
  const params = useParams<{ labId: string }>();
  const labId = params.labId as LabId;
  const meta = LAB_REGISTRY[labId];
  if (!meta) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Button href="/student/labs" variant="ghost" size="sm" icon={<ArrowLeft />} className="mb-4">
        All labs
      </Button>
      <LabRunner
        labId={labId}
        title={meta.name}
        brief={`${meta.blurb} · Free exploration mode — dive in and experiment.`}
      />
    </div>
  );
}
