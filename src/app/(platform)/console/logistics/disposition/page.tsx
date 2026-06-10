import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  name: string;
  category: string | null;
  asset_tag: string | null;
  equipment_state: string;
  daily_rate_cents: number | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  available: "success",
  reserved: "info",
  in_use: "info",
  maintenance: "warning",
  retired: "muted",
};

const DISPOSITION_KINDS = ["maintenance", "retired"] as const;

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.logistics.disposition.eyebrow", undefined, "Logistics")}
          title={t("console.logistics.disposition.title", undefined, "Disposition")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.logistics.disposition.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: assetData }, { count: totalAssets }] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, category, asset_tag, equipment_state, daily_rate_cents")
      .eq("org_id", session.orgId)
      .in("equipment_state", [...DISPOSITION_KINDS])
      .order("category", { ascending: true })
      .limit(500),
    supabase.from("equipment").select("*", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const rows = (assetData ?? []) as AssetRow[];
  const retired = rows.filter((r) => r.equipment_state === "retired").length;
  const maintenance = rows.filter((r) => r.equipment_state === "maintenance").length;
  const totalReplaceable = rows.reduce((s, r) => s + (r.daily_rate_cents != null ? r.daily_rate_cents * 30 * 6 : 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.disposition.eyebrow", undefined, "Logistics")}
        title={t("console.logistics.disposition.title", undefined, "Disposition")}
        subtitle={t(
          "console.logistics.disposition.subtitle",
          {
            count: rows.length,
            total: totalAssets ?? 0,
            assetWord: totalAssets === 1 ? "Asset" : "Assets",
            retired,
            maintenance,
          },
          `${rows.length} of ${totalAssets ?? 0} Asset${totalAssets === 1 ? "" : "s"} Pending · ${retired} Retired · ${maintenance} Maintenance`,
        )}
        action={
          <Button href="/console/production/equipment" size="sm">
            {t("console.logistics.disposition.allEquipment", undefined, "All equipment")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.logistics.disposition.metric.pending", undefined, "Pending Disposition")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.logistics.disposition.metric.retired", undefined, "Retired")}
            value={fmt.number(retired)}
          />
          <MetricCard
            label={t("console.logistics.disposition.metric.replacementValue", undefined, "Replacement Value — Est.")}
            value={formatMoney(totalReplaceable)}
          />
        </div>

        <DataTable<AssetRow>
          rows={rows}
          rowHref={(r) => `/console/production/equipment/${r.id}`}
          emptyLabel={t("console.logistics.disposition.empty.label", undefined, "Nothing pending disposition")}
          emptyDescription={t(
            "console.logistics.disposition.empty.description",
            undefined,
            "Equipment moves into disposition when its status flips to maintenance or retired. Update an asset's status to surface it here for sale, donation, or recycling.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.logistics.disposition.col.asset", undefined, "Asset"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "tag",
              header: t("console.logistics.disposition.col.tag", undefined, "Tag"),
              render: (r) => r.asset_tag ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "category",
              header: t("console.logistics.disposition.col.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "rate",
              header: t("console.logistics.disposition.col.dailyRate", undefined, "Daily Rate"),
              render: (r) => (r.daily_rate_cents != null ? formatMoney(r.daily_rate_cents) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.daily_rate_cents ?? 0),
            },
            {
              key: "equipment_state",
              header: t("console.logistics.disposition.col.equipment_state", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.equipment_state] ?? "muted"}>{toTitle(r.equipment_state)}</Badge>
              ),
              accessor: (r) => r.equipment_state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.logistics.disposition.footnote",
            undefined,
            "Circularity workflow: maintenance → repair / sell / recycle → retired. Track outcomes in the asset's notes field; aggregate disposition KPIs ship with the next sustainability migration.",
          )}
        </p>
      </div>
    </>
  );
}
