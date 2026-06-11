// REC-19 / SC-6 — finance lists are tabular, so the streaming skeleton
// matches the table layout instead of the generic console list variant.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
