// REC-19 / SC-6 — marketplace hub renders card lists; list variant matches.
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
