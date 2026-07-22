// C3 — My Work unions five personal queries (tasks, approvals, requisitions,
// time off, expenses); stream a table-shaped shell instead of blanking.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
