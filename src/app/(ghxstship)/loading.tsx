/**
 * Streaming loading state for the GHXSTSHIP parent-company surface
 * (about / contact / markets / phases / pricing / services / solutions
 * / tiers). Pages here are mostly static marketing copy; this skeleton
 * fills the gap during the brief server-render flush so users don't
 * see a blank screen.
 */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16" aria-busy="true">
      <div className="skeleton mb-6 h-12 w-2/3 rounded-md" />
      <div className="skeleton mb-3 h-4 w-3/4 rounded" />
      <div className="skeleton mb-3 h-4 w-2/3 rounded" />
      <div className="skeleton mb-12 h-4 w-1/2 rounded" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface space-y-3 p-6">
            <div className="skeleton h-5 w-24 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
