// Kit 30 — fulfillment queue streaming skeleton (five-state contract: loading).
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={6} />;
}
