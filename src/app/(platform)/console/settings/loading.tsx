// REC-19 / SC-6 — settings pages are form-heavy; the form skeleton matches.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="form" rows={5} />;
}
