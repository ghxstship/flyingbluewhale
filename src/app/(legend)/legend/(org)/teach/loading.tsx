import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for the Teach authoring hub (L-P6a). */
export default function TeachLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <Skeleton className="max-w-md" width="100%" height={16} radius="var(--p-r-sm)" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="var(--p-r-lg)" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={64} radius="var(--p-r-lg)" />
        ))}
      </div>
    </div>
  );
}
