// REC-19 / SC-6 — comms surfaces are feed-style lists; list variant matches.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
