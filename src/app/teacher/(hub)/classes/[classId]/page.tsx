import ClassClient from "./class-client";

/**
 * Class pages are pre-rendered for the known teaching groups. On a static host
 * a class id outside this list has no page; in a server deployment the route is
 * rendered on demand instead.
 */
export function generateStaticParams() {
  return [{ classId: "cls-6a" }, { classId: "cls-6b" }, { classId: "cls-7a" }];
}

export default function ClassDetailPage() {
  return <ClassClient />;
}
