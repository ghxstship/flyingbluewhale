// B-27 — the safety hub and its children are card/list surfaces, so the
// streaming skeleton uses the generic list variant while queries resolve.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
