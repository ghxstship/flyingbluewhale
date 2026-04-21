/**
 * Streaming loading state for the portal shell. Next.js 16 reads this
 * automatically when a server component is in flight, so users see a
 * branded skeleton instead of a blank screen on cold navigation.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
