// Tree-root streaming skeleton (loading-boundaries ratchet, lane-c COMP-6
// pattern) — force-dynamic pages in this tree paint a structure-matched shell
// instead of a blank pane during data fetch.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
