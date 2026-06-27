/**
 * Streaming loading state for the LEG3ND shell. Next.js 16 renders this while a
 * server component is in flight, so cold navigations show a branded ps-skel
 * inside the LEG3ND `<main>` instead of a blank panel.
 */
export default function LegendLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="ps-skel h-8 w-64 rounded" />
      <div className="ps-skel h-4 w-full max-w-md rounded" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ps-skel h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
