// F-21 — matched streaming skeleton for a documented heavy route (documents hub).
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
