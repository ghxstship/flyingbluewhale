export function StatStrip({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="surface-raised grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--org-primary)" }}>{s.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
