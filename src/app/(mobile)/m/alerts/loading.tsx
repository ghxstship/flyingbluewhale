/**
 * Route-matched streaming skeleton — shows instantly on navigation over
 * slow venue networks instead of a blank pane while the force-dynamic
 * server component is in flight. On a crisis surface, "instantly" matters.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
