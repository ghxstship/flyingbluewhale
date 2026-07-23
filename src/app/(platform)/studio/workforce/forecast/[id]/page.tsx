import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { WorkloadHeatGrid, type WorkloadLine } from "@/components/views/WorkloadHeatGrid";

export const dynamic = "force-dynamic";

type Header = { id: string; name: string; horizon: string; baseline_at: string };
type Line = WorkloadLine & {
  id: string;
  resource_kind: string;
  period_end: string;
  bench_cost: number | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.forecast.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.forecast.title", undefined, "Resource Forecast")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.forecast.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: hdr } = (await supabase
    .from("resource_forecasts")
    .select("id, name, horizon, baseline_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle()) as { data: Header | null };
  if (!hdr) notFound();

  const { data: lineData } = await supabase
    .from("resource_forecast_lines")
    .select("id, resource_label, resource_kind, period_start, period_end, capacity_units, demand_units, surplus_units, bench_cost")
    .eq("resource_forecast_id", id)
    .order("resource_label", { ascending: true })
    .order("period_start", { ascending: true });
  const lines = (lineData ?? []) as Line[];

  const resourceCount = new Set(lines.map((l) => l.resource_label)).size;
  const periodCount = new Set(lines.map((l) => l.period_start)).size;
  const gapCount = lines.filter((l) => Number(l.surplus_units) < 0).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.forecast.detail.eyebrow", undefined, "Workforce · Resource Forecast")}
        title={hdr.name}
        subtitle={t(
          "console.workforce.forecast.detail.subtitle",
          {
            resources: `${resourceCount} resource${resourceCount === 1 ? "" : "s"}`,
            periods: `${periodCount} period${periodCount === 1 ? "" : "s"}`,
            gaps: `${gapCount} gap cell${gapCount === 1 ? "" : "s"}`,
          },
          `${resourceCount} resource${resourceCount === 1 ? "" : "s"} × ${periodCount} period${periodCount === 1 ? "" : "s"} · ${gapCount} gap cell${gapCount === 1 ? "" : "s"}`,
        )}
        action={<Badge variant="info">{hdr.horizon.replace(/_/g, " ")}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("console.workforce.forecast.detail.metrics.resources", undefined, "Resources")} value={resourceCount} accent />
          <MetricCard label={t("console.workforce.forecast.detail.metrics.periods", undefined, "Periods")} value={periodCount} />
          <MetricCard label={t("console.workforce.forecast.detail.metrics.gapCells", undefined, "Gap Cells")} value={gapCount} />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[var(--p-text-2)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-[var(--p-danger)]/20" />{" "}
            {t("console.workforce.forecast.detail.legend.gap", undefined, "Gap (demand > capacity)")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-[var(--p-surface)] ring-1 ring-[var(--p-border)]" />{" "}
            {t("console.workforce.forecast.detail.legend.balanced", undefined, "Balanced")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-[var(--p-success)]/15" />{" "}
            {t("console.workforce.forecast.detail.legend.surplus", undefined, "Surplus")}
          </span>
        </div>
        <WorkloadHeatGrid lines={lines} />
      </div>
    </>
  );
}
