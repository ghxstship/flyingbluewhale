/** Route-matched streaming skeleton for the advance lines. */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={4} />;
}
