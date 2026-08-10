import { ALL_LESSONS } from "@/content/curriculum";
import EditClient from "./edit-client";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "published").map((l) => ({
    lessonId: l.id,
  }));
}

export default function LessonBuilderPage() {
  return <EditClient />;
}
