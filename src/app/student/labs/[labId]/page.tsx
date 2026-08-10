import { LAB_IDS } from "@/features/labs/lab-ids";
import LabClient from "./lab-client";

/** Every registered lab gets a static page so the route works without a server. */
export function generateStaticParams() {
  return LAB_IDS.map((labId) => ({ labId }));
}

export default function LabPage() {
  return <LabClient />;
}
