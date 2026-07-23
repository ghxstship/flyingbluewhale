import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Streaming loading state for the LEG3ND shell. Next.js 16 renders this while a
 * server component is in flight, so cold navigations show a branded ps-skel
 * inside the LEG3ND `<main>` instead of a blank panel.
 */
export default function LegendLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton width={256} height={32} radius="var(--p-r-sm)" />
      <Skeleton className="max-w-md" width="100%" height={16} radius="var(--p-r-sm)" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={112} radius="var(--p-r-lg)" />
        ))}
      </div>
    </div>
  );
}
