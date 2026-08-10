import { ALL_LESSONS } from "@/content/curriculum";
import TeachClient from "./teach-client";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "published").map((l) => ({
    lessonId: l.id,
  }));
}

export default function TeachModePage() {
  return <TeachClient />;
}
