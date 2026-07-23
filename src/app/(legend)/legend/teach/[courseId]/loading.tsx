import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for the course editor (L-P6a). */
export default function CourseEditorLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={320} height={32} radius="var(--p-r-sm)" />
      <Skeleton width="100%" height={56} radius="var(--p-r-lg)" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="var(--p-r-lg)" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={56} radius="var(--p-r-lg)" />
        ))}
      </div>
    </div>
  );
}
