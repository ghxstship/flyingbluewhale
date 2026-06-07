export default function SlaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">Service Level Agreement</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">Applies to Enterprise tier · effective 2026-04-16</p>
      <div className="mt-8 space-y-4 text-sm text-[var(--p-text-2)]">
        <p>
          We target <strong>99.9%</strong> monthly uptime. Scheduled maintenance windows are excluded.
        </p>
        <p>Service credits for missed SLA: 10% (99.0–99.9%), 25% (98.0–99.0%), 50% (below 98.0%).</p>
        <p>
          Report incidents to <span className="font-mono">oncall@atlvs.pro</span>.
        </p>
      </div>
    </div>
  );
}
