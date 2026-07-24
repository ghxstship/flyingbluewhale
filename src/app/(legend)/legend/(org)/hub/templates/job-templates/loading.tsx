import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for the job-templates family editor. */
export default function JobTemplatesLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={72} radius="var(--p-r-md)" />
        ))}
      </div>
    </div>
  );
}
