/**
 * Route-matched streaming skeleton — shows instantly on navigation over slow
 * venue networks instead of a blank pane while the force-dynamic server
 * component is in flight.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
