import { Badge } from "@/components/ui/Badge";

type CallStats = {
  total: number;
  shortlisted: number;
  awarded: number;
  rejected: number;
  avg_score: number | null;
  avg_fee_cents: number | null;
  median_fee_cents: number | null;
  submissions_per_day: number | null;
  shortlist_rate_pct: number | null;
  first_submission_at: string | null;
  latest_submission_at: string | null;
};

function fmtCents(cents: number | null, currency = "USD"): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Renders open call submission analytics panel.
 *
 * Competitive source: GigSalad Lead Insights (March 2025).
 * Shows operators: pool size, velocity, shortlist rate, fee spread,
 * and AI-generated market intelligence.
 */
export function CallInsightsPanel({
  stats,
  aiIntelligence,
  aiIntelligenceAt,
  currency = "USD",
}: {
  stats: CallStats;
  aiIntelligence: string | null;
  aiIntelligenceAt: string | null;
  currency?: string;
}) {
  const hasData = (stats.total ?? 0) > 0;

  return (
    <section className="surface rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]">
        <span className="text-xs font-semibold tracking-wider uppercase text-[var(--org-primary)]">
          Submission Intelligence
        </span>
      </div>

      {!hasData ? (
        <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
          No submissions yet — insights will appear once talent applies.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border-subtle)]">
            <StatCell label="Total" value={String(stats.total ?? 0)} />
            <StatCell label="Shortlisted" value={String(stats.shortlisted ?? 0)} accent />
            <StatCell label="Shortlist Rate" value={stats.shortlist_rate_pct != null ? `${stats.shortlist_rate_pct}%` : "—"} />
            <StatCell
              label="Per Day"
              value={stats.submissions_per_day != null ? `${stats.submissions_per_day}` : "—"}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[var(--border-subtle)]">
            <StatCell label="Avg Score" value={stats.avg_score != null ? `${stats.avg_score}/100` : "—"} mono />
            <StatCell label="Median Fee" value={fmtCents(stats.median_fee_cents, currency)} mono />
            <StatCell label="Avg Fee" value={fmtCents(stats.avg_fee_cents, currency)} mono />
          </div>

          {aiIntelligence && (
            <div className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-[var(--org-primary)]">
                  AI Analysis
                </span>
                {aiIntelligenceAt && (
                  <Badge variant="muted">
                    {new Date(aiIntelligenceAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{aiIntelligence}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StatCell({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="bg-[var(--surface)] px-4 py-3">
      <div className="text-xs text-[var(--text-tertiary)] mb-0.5">{label}</div>
      <div
        className={`text-lg font-semibold ${mono ? "font-mono" : ""} ${accent ? "text-[var(--org-primary)]" : "text-[var(--text-primary)]"}`}
      >
        {value}
      </div>
    </div>
  );
}
