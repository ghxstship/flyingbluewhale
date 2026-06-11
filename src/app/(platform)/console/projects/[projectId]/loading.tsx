// REC-19 / SC-6 — project detail streams in as a detail skeleton, not the
// generic console list variant.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="detail" rows={6} />;
}
