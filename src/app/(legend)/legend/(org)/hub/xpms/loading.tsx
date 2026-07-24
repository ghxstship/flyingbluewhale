// Streaming skeleton (loading-boundaries ratchet) — the XPMS Catalog pillar
// is force-dynamic; paint a structure-matched table shell during data fetch.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={10} />;
}
