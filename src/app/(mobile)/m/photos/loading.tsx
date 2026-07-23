/**
 * Route-matched streaming skeleton (loading-boundary ratchet) — the photo
 * notes list signs storage URLs before first paint.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
