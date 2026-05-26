import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Methodology = "earned_value" | "manual" | "automatic";

type Row = {
  id: string;
  name: string;
  forecast_at: string;
  methodology: Methodology;
  created_at: string;
  project: { name: string | null } | null;
  line_count: number;
  total_eac: number;
  total_variance: number;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Forecasts (EAC)" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data: hdr } = await supabase
    .from("cost_forecasts")
    .select("id, name, forecast_at, methodology, created_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("forecast_at", { ascending: false })
    .limit(200);

  const headers = (hdr ?? []) as unknown as Omit<Row, "line_count" | "total_eac" | "total_variance">[];

  // Rollup lines per forecast (one round-trip).
  const ids = headers.map((h) => h.id);
  const rollups: Record<string, { count: number; eac: number; variance: number }> = {};
  if (ids.length > 0) {
    const { data: lines } = await supabase
      .from("cost_forecast_lines")
      .select("cost_forecast_id, estimated_at_completion, variance")
      .in("cost_forecast_id", ids);
    for (const l of (lines ?? []) as Array<{
      cost_forecast_id: string;
      estimated_at_completion: number;
      variance: number;
    }>) {
      const r = rollups[l.cost_forecast_id] ?? { count: 0, eac: 0, variance: 0 };
      r.count += 1;
      r.eac += Number(l.estimated_at_completion);
      r.variance += Number(l.variance);
      rollups[l.cost_forecast_id] = r;
    }
  }
  const rows: Row[] = headers.map((h) => {
    const r = rollups[h.id] ?? { count: 0, eac: 0, variance: 0 };
    return { ...h, line_count: r.count, total_eac: r.eac, total_variance: r.variance };
  });

  const overrunCount = rows.filter((r) => r.total_variance > 0).length;
  const totalEac = rows.reduce((s, r) => s + r.total_eac, 0);

  function fmtMoney(n: number): string {
    return fmt.money(Math.round(n * 100));
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Forecasts (EAC)"
        subtitle={`${rows.length} forecast${rows.length === 1 ? "" : "s"} · ${overrunCount} flag over original budget · ${fmtMoney(totalEac)} aggregate EAC`}
        action={
          <Button href="/console/finance/forecasts/new" size="sm">
            + New Forecast
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Forecasts" value={fmt.number(rows.length)} accent />
          <MetricCard label="Aggregate EAC" value={fmtMoney(totalEac)} />
          <MetricCard label="Over-Budget" value={fmt.number(overrunCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/forecasts/${r.id}`}
          emptyLabel="No cost forecasts yet"
          emptyDescription="An EAC forecast is a per-cost-code rollup: committed + incurred + forecast-to-complete, with variance vs original budget."
          emptyAction={
            <Button href="/console/finance/forecasts/new" size="sm">
              + New Forecast
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "method",
              header: "Method",
              render: (r) => toTitle(r.methodology),
              accessor: (r) => r.methodology,
              filterable: true,
              className: "text-xs",
            },
            {
              key: "lines",
              header: "Lines",
              render: (r) => fmt.number(r.line_count),
              accessor: (r) => r.line_count,
              className: "font-mono text-xs text-right",
            },
            {
              key: "eac",
              header: "EAC",
              render: (r) => fmtMoney(r.total_eac),
              accessor: (r) => r.total_eac,
              className: "font-mono text-xs text-right",
            },
            {
              key: "variance",
              header: "Variance",
              render: (r) => {
                const v = r.total_variance;
                if (v === 0) return "—";
                return (
                  <span className={v > 0 ? "text-[var(--color-error)]" : "text-[var(--color-success)]"}>
                    {v > 0 ? "+" : "−"}
                    {fmtMoney(Math.abs(v))}
                  </span>
                );
              },
              accessor: (r) => r.total_variance,
              className: "font-mono text-xs text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
