// Kit 30 — roster streams in as skeleton table rows, matching the
// clickthrough's loading state.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
