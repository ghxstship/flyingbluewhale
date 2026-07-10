// A-09 — per-module streaming skeleton so force-dynamic pages paint a
// structure-matched shell instead of a blank pane during data fetch.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
