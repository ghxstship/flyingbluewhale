// F-21 — matched streaming skeleton for a documented heavy route (payroll aggregation).
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
