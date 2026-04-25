import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { CarbonCharts } from "./CarbonCharts";
import type { SustainabilityMetric } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Sustainability" title="Carbon" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
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
        eyebrow="Sustainability"
        title="Carbon"
        subtitle={`${rows.length} measurement${rows.length === 1 ? "" : "s"} on file`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label="Total kg CO₂e"
            value={Number(totalKg).toLocaleString()}
            sparkline={byMonth.map((m) => m.actual)}
            accent
          />
          <MetricCard
            label="Scopes covered"
            value={byScope.length}
          />
          <MetricCard
            label="Reporting periods"
            value={rows.length}
          />
        </div>

        <CarbonCharts byMonth={byMonth} byScope={byScope} target={target} />

        <DataTable<SustainabilityMetric>
          rows={rows}
          emptyLabel="No measurements yet"
          columns={[
            {
              key: "period",
              header: "Period",
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.period_start.slice(0, 10)} → {r.period_end.slice(0, 10)}
                </span>
              ),
            },
            {
              key: "scope",
              header: "Scope",
              render: (r) => <Badge variant="muted">Scope {r.scope}</Badge>,
            },
            {
              key: "kg_co2e",
              header: "kg CO₂e",
              render: (r) => (
                <span className="font-mono text-xs">{r.kg_co2e.toLocaleString()}</span>
              ),
            },
            {
              key: "source",
              header: "Source",
              render: (r) => (
                <span className="text-xs text-[var(--text-secondary)]">{r.source ?? "—"}</span>
              ),
            },
            {
              key: "method",
              header: "Method",
              render: (r) => (
                <span className="text-xs text-[var(--text-muted)]">{r.method ?? "—"}</span>
              ),
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
