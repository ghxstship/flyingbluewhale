// B-27 — people directories are tabular, so the streaming skeleton matches
// the table layout while the membership/crew queries resolve.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
