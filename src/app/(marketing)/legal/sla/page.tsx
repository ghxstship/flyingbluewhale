import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Service Level Agreement",
  description:
    "LYTEHAUS Technologies Service Level Agreement — uptime commitments, service credits, and incident response for Enterprise customers.",
  path: "/legal/sla",
  noIndex: false,
});

export default function SlaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Service Level Agreement</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Applies to Enterprise tier · last updated 2026-05-10</p>
      <div className="mt-8 space-y-4 text-sm text-[var(--text-secondary)]">
        <p>
          We target <strong>99.9%</strong> monthly uptime. Scheduled maintenance windows are excluded.
        </p>
        <p>Service credits for missed SLA: 10% (99.0–99.9%), 25% (98.0–99.0%), 50% (below 98.0%).</p>
        <p>
          Report incidents to{" "}
          <a href="mailto:oncall@lytehaus.live" className="text-[var(--org-primary)] underline">
            oncall@lytehaus.live
          </a>
          .
        </p>
      </div>
    </div>
  );
}
