import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming loading state for the credential-type catalog (L-P6b). */
export default function CertificationDefinitionsLoading() {
  return (
    <div className="page-content space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <Skeleton className="max-w-md" width="100%" height={16} radius="var(--p-r-sm)" />
      <Skeleton width="100%" height={280} radius="var(--p-r-lg)" />
    </div>
  );
}
