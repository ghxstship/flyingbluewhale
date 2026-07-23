import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for live-session authoring (L-P6a). */
export default function TeachSessionsLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="var(--p-r-lg)" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="var(--p-r-lg)" />
        ))}
      </div>
    </div>
  );
}
