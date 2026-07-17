/** Route-matched streaming skeleton for the onboarding packet. */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={4} />;
}
