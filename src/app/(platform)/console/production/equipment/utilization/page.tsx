import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  equipment_id: string;
  category: string | null;
  name: string;
  asset_tag: string | null;
  status: string;
  daily_rate_cents: number | null;
  movements_30d: number;
  movements_90d: number;
  reserved_days_30d: number;
  reserved_days_90d: number;
  utilization_pct_30d: number;
  utilization_pct_90d: number;
  idle_revenue_30d_cents: number | null;
  last_active_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Equipment Utilization" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("v_equipment_utilization")
    .select(
      "equipment_id, category, name, asset_tag, status, daily_rate_cents, movements_30d, movements_90d, reserved_days_30d, reserved_days_90d, utilization_pct_30d, utilization_pct_90d, idle_revenue_30d_cents, last_active_at",
    )
    .eq("org_id", session.orgId)
    .order("utilization_pct_30d", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];

  // DataTable requires an `id`; equipment_id is unique.
  const tableRows = rows.map((r) => ({ ...r, id: r.equipment_id }));

  const idleCount = rows.filter((r) => Number(r.utilization_pct_30d ?? 0) < 25).length;
  const totalIdleRevenue = rows.reduce((s, r) => s + Number(r.idle_revenue_30d_cents ?? 0), 0);
  const avgUtil30 =
    rows.length > 0 ? rows.reduce((s, r) => s + Number(r.utilization_pct_30d ?? 0), 0) / rows.length : 0;

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Equipment Utilization"
        subtitle={`${rows.length} asset${rows.length === 1 ? "" : "s"} · ${idleCount} under-utilized · avg ${avgUtil30.toFixed(1)}% over 30d`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Under-utilized" value={fmt.number(idleCount)} accent />
          <MetricCard label="Avg Utilization 30d" value={`${avgUtil30.toFixed(1)}%`} />
          <MetricCard label="Idle Revenue 30d" value={fmt.money(totalIdleRevenue)} />
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Rolled up from asset_movements. Under-utilized = &lt; 25% over the last 30 days. Idle revenue = (30 −
          reserved_days) × daily_rate — what could have been earned had the asset been on a job.
        </div>
        <DataTable
          rows={tableRows}
          emptyLabel="No equipment yet"
          emptyDescription="Register equipment and movements to see utilization."
          columns={[
            { key: "name", header: "Asset", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "asset_tag",
              header: "Tag",
              render: (r) => r.asset_tag ?? "—",
              accessor: (r) => r.asset_tag,
              className: "font-mono text-xs",
            },
            {
              key: "category",
              header: "Category",
              render: (r) => r.category ?? "—",
              accessor: (r) => r.category,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "movements_30d",
              header: "Moves 30d",
              render: (r) => fmt.number(r.movements_30d),
              accessor: (r) => r.movements_30d,
              className: "font-mono text-xs text-right",
            },
            {
              key: "reserved_30d",
              header: "Reserved 30d",
              render: (r) => `${Number(r.reserved_days_30d).toFixed(1)}d`,
              accessor: (r) => Number(r.reserved_days_30d),
              className: "font-mono text-xs text-right",
            },
            {
              key: "util_30d",
              header: "Util 30d",
              render: (r) => {
                const pct = Number(r.utilization_pct_30d ?? 0);
                const tone = pct < 25 ? "error" : pct < 50 ? "warning" : pct < 75 ? "info" : "success";
                return <Badge variant={tone}>{`${pct.toFixed(1)}%`}</Badge>;
              },
              accessor: (r) => Number(r.utilization_pct_30d ?? 0),
            },
            {
              key: "util_90d",
              header: "Util 90d",
              render: (r) => `${Number(r.utilization_pct_90d ?? 0).toFixed(1)}%`,
              accessor: (r) => Number(r.utilization_pct_90d ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "idle_rev",
              header: "Idle Rev 30d",
              render: (r) => (r.idle_revenue_30d_cents != null ? fmt.money(Number(r.idle_revenue_30d_cents)) : "—"),
              accessor: (r) => Number(r.idle_revenue_30d_cents ?? 0),
              className: "font-mono text-xs text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
