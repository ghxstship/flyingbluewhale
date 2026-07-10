// B-27 — the report library is a card grid; the viewer resolves metrics
// live, so both stream a list skeleton instead of blanking the pane.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
