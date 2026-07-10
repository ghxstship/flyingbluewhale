// B-27 — operations surfaces (the unified schedule runs ~9 parallel queries)
// stream a table-shaped skeleton instead of blanking the whole pane.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
