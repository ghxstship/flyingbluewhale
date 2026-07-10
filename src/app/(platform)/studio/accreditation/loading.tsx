// B-27 — accreditation surfaces are paginated tables (vetting, scans,
// changes), so the streaming skeleton matches the table layout.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="table" rows={8} />;
}
