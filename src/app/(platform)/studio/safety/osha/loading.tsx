// F-21 — matched streaming skeleton for a documented heavy route (OSHA 300 log scan).
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
