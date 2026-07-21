/**
 * Route-matched streaming skeleton — shows instantly on navigation so a tap
 * gives immediate feedback instead of freezing on the previous screen while the
 * force-dynamic server component + its org reads are in flight (slow venue Wi-Fi).
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
