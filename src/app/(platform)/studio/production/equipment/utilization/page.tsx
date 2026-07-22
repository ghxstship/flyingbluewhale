import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  asset_id: string;
  asset_kind: string | null;
  name: string;
  asset_tag: string | null;
  state: string;
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.equipment.utilization.eyebrow", undefined, "Production")}
          title={t("console.production.equipment.utilization.title", undefined, "Equipment Utilization")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.equipment.utilization.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("v_asset_utilization")
    .select(
      "asset_id, asset_kind, name, asset_tag, state, daily_rate_cents, movements_30d, movements_90d, reserved_days_30d, reserved_days_90d, utilization_pct_30d, utilization_pct_90d, idle_revenue_30d_cents, last_active_at",
    )
    .eq("org_id", session.orgId)
    .order("utilization_pct_30d", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];

  // DataView requires an `id`; asset_id is unique.
  const tableRows = rows.map((r) => ({ ...r, id: r.asset_id }));

  const idleCount = rows.filter((r) => Number(r.utilization_pct_30d ?? 0) < 25).length;
  const totalIdleRevenue = rows.reduce((s, r) => s + Number(r.idle_revenue_30d_cents ?? 0), 0);
  const avgUtil30 =
    rows.length > 0 ? rows.reduce((s, r) => s + Number(r.utilization_pct_30d ?? 0), 0) / rows.length : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.utilization.eyebrow", undefined, "Production")}
        title={t("console.production.equipment.utilization.title", undefined, "Equipment Utilization")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.production.equipment.utilization.assetSingular", undefined, "asset") : t("console.production.equipment.utilization.assetPlural", undefined, "assets")} · ${idleCount} ${t("console.production.equipment.utilization.underUtilizedLower", undefined, "under-utilized")} · ${t("console.production.equipment.utilization.avgLabel", undefined, "avg")} ${avgUtil30.toFixed(1)}% ${t("console.production.equipment.utilization.over30d", undefined, "over 30d")}`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.production.equipment.utilization.underUtilized", undefined, "Under-utilized")}
            value={fmt.number(idleCount)}
            accent
          />
          <MetricCard
            label={t("console.production.equipment.utilization.avgUtilization30d", undefined, "Avg Utilization 30d")}
            value={`${avgUtil30.toFixed(1)}%`}
          />
          <MetricCard
            label={t("console.production.equipment.utilization.idleRevenue30d", undefined, "Idle Revenue 30d")}
            value={fmt.money(totalIdleRevenue)}
          />
        </div>
        <div className="text-[11px] text-[var(--p-text-2)]">
          {t(
            "console.production.equipment.utilization.helpText",
            undefined,
            "Rolled up from asset_movements. Under-utilized = < 25% over the last 30 days. Idle revenue = (30 − reserved_days) × daily_rate. What could have been earned had the asset been on a job.",
          )}
        </div>
        <DataView
          rows={tableRows}
          rowHref={(r) => `/studio/assets/${r.asset_id}`}
          emptyLabel={t("console.production.equipment.utilization.emptyLabel", undefined, "No equipment yet")}
          emptyDescription={t(
            "console.production.equipment.utilization.emptyDescription",
            undefined,
            "Register equipment and movements to see utilization.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.production.equipment.utilization.col.asset", undefined, "Asset"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "asset_tag",
              header: t("console.production.equipment.utilization.col.tag", undefined, "Tag"),
              render: (r) => r.asset_tag ?? "—",
              accessor: (r) => r.asset_tag,
              mono: true,
            },
            {
              key: "asset_kind",
              header: t("console.production.equipment.utilization.col.category", undefined, "Category"),
              render: (r) => r.asset_kind ?? "—",
              accessor: (r) => r.asset_kind,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "movements_30d",
              header: t("console.production.equipment.utilization.col.moves30d", undefined, "Moves 30d"),
              render: (r) => fmt.number(r.movements_30d),
              accessor: (r) => r.movements_30d,
              numeric: true,
            },
            {
              key: "reserved_30d",
              header: t("console.production.equipment.utilization.col.reserved30d", undefined, "Reserved 30d"),
              render: (r) => `${Number(r.reserved_days_30d).toFixed(1)}d`,
              accessor: (r) => Number(r.reserved_days_30d),
              numeric: true,
            },
            {
              key: "util_30d",
              header: t("console.production.equipment.utilization.col.util30d", undefined, "Util 30d"),
              render: (r) => {
                const pct = Number(r.utilization_pct_30d ?? 0);
                const tone = pct < 25 ? "error" : pct < 50 ? "warning" : pct < 75 ? "info" : "success";
                return <Badge variant={tone}>{`${pct.toFixed(1)}%`}</Badge>;
              },
              accessor: (r) => Number(r.utilization_pct_30d ?? 0),
            },
            {
              key: "util_90d",
              header: t("console.production.equipment.utilization.col.util90d", undefined, "Util 90d"),
              render: (r) => `${Number(r.utilization_pct_90d ?? 0).toFixed(1)}%`,
              accessor: (r) => Number(r.utilization_pct_90d ?? 0),
              numeric: true,
            },
            {
              key: "idle_rev",
              header: t("console.production.equipment.utilization.col.idleRev30d", undefined, "Idle Rev 30d"),
              render: (r) => (r.idle_revenue_30d_cents != null ? fmt.money(Number(r.idle_revenue_30d_cents)) : "—"),
              accessor: (r) => Number(r.idle_revenue_30d_cents ?? 0),
              numeric: true,
            },
          ]}
        />
      </div>
    </>
  );
}
