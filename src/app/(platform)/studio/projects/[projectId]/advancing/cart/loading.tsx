// Kit 30 — cart streaming skeleton (five-state contract: loading).
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
