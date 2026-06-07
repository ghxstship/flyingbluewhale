import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
// recharts (~100KB gzipped) stays out of the initial bundle via the
// CarbonChartsClient wrapper, which holds the next/dynamic({ssr:false})
// call. Next 16 disallows that option in server components, so the
// wrapper carries it instead.
import { CarbonChartsClient as CarbonCharts } from "./CarbonChartsClient";
import type { SustainabilityMetric } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.sustainability.carbon.eyebrow", undefined, "Sustainability")}
          title={t("console.sustainability.carbon.title", undefined, "Carbon")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.sustainability.carbon.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const rows = (await listOrgScoped("sustainability_metrics", session.orgId, {
    orderBy: "period_start",
    ascending: true,
    limit: 500,
  })) as SustainabilityMetric[];

  const totalKg = rows.reduce((s, r) => s + (r.kg_co2e ?? 0), 0);
  const byScope = aggregateByScope(rows);
  const byMonth = aggregateByMonth(rows);
  // Operator-set target: 5% YoY reduction baseline (placeholder until orgs.compliance_settings.carbon_target_kg)
  const lastMonth = byMonth[byMonth.length - 1]?.actual ?? 0;
  const target = Math.round(lastMonth * 0.95);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sustainability.carbon.eyebrow", undefined, "Sustainability")}
        title={t("console.sustainability.carbon.title", undefined, "Carbon")}
        subtitle={
          rows.length === 1
            ? t(
                "console.sustainability.carbon.subtitleSingular",
                { count: rows.length },
                `${rows.length} Measurement On File`,
              )
            : t(
                "console.sustainability.carbon.subtitlePlural",
                { count: rows.length },
                `${rows.length} Measurements On File`,
              )
        }
        action={
          <Button href="/console/sustainability/carbon/new" size="sm">
            {t("console.sustainability.carbon.recordMeasurement", undefined, "+ Record measurement")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.sustainability.carbon.metric.totalKg", undefined, "Total Kg CO₂e")}
            value={fmt.number(Number(totalKg))}
            sparkline={byMonth.map((m) => m.actual)}
            accent
          />
          <MetricCard
            label={t("console.sustainability.carbon.metric.scopesCovered", undefined, "Scopes Covered")}
            value={byScope.length}
          />
          <MetricCard
            label={t("console.sustainability.carbon.metric.reportingPeriods", undefined, "Reporting Periods")}
            value={rows.length}
          />
        </div>

        <CarbonCharts byMonth={byMonth} byScope={byScope} target={target} />

        <DataTable<SustainabilityMetric>
          rows={rows}
          rowHref={(r) => `/console/sustainability/carbon/${r.id}`}
          emptyLabel={t("console.sustainability.carbon.emptyLabel", undefined, "No measurements yet")}
          emptyDescription={t(
            "console.sustainability.carbon.emptyDescription",
            undefined,
            "Quarterly Scope 1/2/3 measurements with method + source attribution.",
          )}
          emptyAction={
            <Button href="/console/sustainability/carbon/new" size="sm">
              {t("console.sustainability.carbon.recordMeasurement", undefined, "+ Record measurement")}
            </Button>
          }
          columns={[
            {
              key: "period",
              header: t("console.sustainability.carbon.col.period", undefined, "Period"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.period_start.slice(0, 10)} → {r.period_end.slice(0, 10)}
                </span>
              ),
              accessor: (r) => r.period_start ?? null,
            },
            {
              key: "scope",
              header: t("console.sustainability.carbon.col.scope", undefined, "Scope"),
              render: (r) => (
                <Badge variant="muted">
                  {t("console.sustainability.carbon.scopeLabel", { scope: r.scope }, `Scope ${r.scope}`)}
                </Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.scope ?? null,
            },
            {
              key: "kg_co2e",
              header: t("console.sustainability.carbon.col.kgCo2e", undefined, "kg CO₂e"),
              render: (r) => <span className="font-mono text-xs">{fmt.number(r.kg_co2e)}</span>,
              accessor: (r) => r.kg_co2e.toLocaleString ?? null,
            },
            {
              key: "source",
              header: t("console.sustainability.carbon.col.source", undefined, "Source"),
              render: (r) => <span className="text-xs text-[var(--p-text-2)]">{r.source ?? "—"}</span>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.source ?? null,
            },
            {
              key: "method",
              header: t("console.sustainability.carbon.col.method", undefined, "Method"),
              render: (r) => <span className="text-xs text-[var(--p-text-2)]">{r.method ?? "—"}</span>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.method ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}

function aggregateByScope(rows: SustainabilityMetric[]): { scope: string; value: number }[] {
  const map = new Map<number, number>();
  for (const r of rows) {
    map.set(r.scope, (map.get(r.scope) ?? 0) + (r.kg_co2e ?? 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([scope, value]) => ({ scope: `Scope ${scope}`, value: Math.round(value) }));
}

function aggregateByMonth(rows: SustainabilityMetric[]): { month: string; actual: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.period_start.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + (r.kg_co2e ?? 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, actual]) => ({
      month: key.slice(5) + "/" + key.slice(2, 4),
      actual: Math.round(actual),
    }));
}
