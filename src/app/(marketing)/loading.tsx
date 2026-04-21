/**
 * Streaming loading state for the marketing shell. Next.js 16 reads this
 * automatically when a server component is in flight, so users see a
 * branded skeleton instead of a blank screen on cold navigation.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="detail" rows={6} />;
}
