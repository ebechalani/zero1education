import { ALL_LESSONS } from "@/content/curriculum";
import LaunchClient from "./launch-client";

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "published").map((l) => ({
    lessonId: l.id,
  }));
}

export default function LaunchPage() {
  return <LaunchClient />;
}
