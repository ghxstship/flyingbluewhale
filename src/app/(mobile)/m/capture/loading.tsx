/**
 * Route-matched streaming skeleton (loading-boundary ratchet) — the capture
 * page reads geofences + projects before first paint; show a skeleton
 * instantly on slow venue networks instead of a blank pane.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={4} />;
}
