// B-27 — procurement lists (requisitions, POs, RFQs) are tabular, so the
// streaming skeleton matches the table layout while queries resolve.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
