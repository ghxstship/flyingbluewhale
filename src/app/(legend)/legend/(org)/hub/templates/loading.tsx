import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for the unified template library (L-P2). */
export default function TemplatesLibraryLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <Skeleton className="max-w-md" width="100%" height={16} radius="var(--p-r-sm)" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={128} radius="var(--p-r-lg)" />
        ))}
      </div>
    </div>
  );
}
