// REC-19 / SC-6 — workforce admin surfaces are tabular rosters; the table
// skeleton matches their layout.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
