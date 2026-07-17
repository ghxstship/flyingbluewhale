/** Route-matched streaming skeleton — instant paint on slow venue networks. */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return <PageSkeleton variant="list" rows={6} />;
}
