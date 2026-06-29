import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  vendor_id: string;
  on_time_pct: number | null;
  quality_avg: number | null;
  disputes: number;
  jobs_completed: number;
  composite: number | null;
  vendor: { name: string | null } | null;
};

export default async function ScorecardPage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("vendor_scores")
    .select("vendor_id, on_time_pct, quality_avg, disputes, jobs_completed, composite, vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .order("composite", { ascending: false, nullsFirst: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  const scored = rows.filter((r) => r.composite != null);
  const avgComposite = scored.length ? Math.round(scored.reduce((s, r) => s + (r.composite ?? 0), 0) / scored.length) : 0;
  const totalDisputes = rows.reduce((s, r) => s + r.disputes, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.scorecard.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.scorecard.title", undefined, "Vendor Scorecard")}
        subtitle={t(
          "console.procurement.scorecard.subtitle",
          undefined,
          "Subcontractor performance — on-time, quality and disputes roll up into a composite that weights dispatch.",
        )}
      />
      <div className="metric-grid mb-6">
        <MetricCard label={t("console.procurement.scorecard.avg", undefined, "Avg composite")} value={`${avgComposite}`} />
        <MetricCard label={t("console.procurement.scorecard.rated", undefined, "Rated subs")} value={String(scored.length)} />
        <MetricCard label={t("console.procurement.scorecard.disputes", undefined, "Open disputes")} value={String(totalDisputes)} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t("console.procurement.scorecard.empty", undefined, "No scores yet")}
          description={t(
            "console.procurement.scorecard.emptyBody",
            undefined,
            "Composite scores accrue as work orders close out — on-time delivery, quality ratings, and disputes.",
          )}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.vendor_id} className="surface flex flex-wrap items-center gap-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4">
              <span className="min-w-40 flex-1 font-semibold">{r.vendor?.name ?? "Vendor"}</span>
              <div className="w-40">
                <div className="mb-1 text-xs text-[var(--p-text-2)]">
                  {t("console.procurement.scorecard.composite", undefined, "Composite")}: <span className="font-mono">{r.composite ?? "—"}</span>
                </div>
                <ProgressBar value={r.composite ?? 0} />
              </div>
              <span className="font-mono text-xs text-[var(--p-text-2)]">
                {t("console.procurement.scorecard.onTime", undefined, "On-time")} {r.on_time_pct ?? "—"}% ·{" "}
                {t("console.procurement.scorecard.quality", undefined, "Quality")} {r.quality_avg ?? "—"}/5 ·{" "}
                {r.jobs_completed} {t("console.procurement.scorecard.jobs", undefined, "jobs")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
