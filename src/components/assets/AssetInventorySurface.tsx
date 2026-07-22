import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ASSET_CLASS_LABELS, ASSET_DISPOSITION_LABELS } from "@/lib/db/assets";
import type { Asset, AssetClass } from "@/lib/supabase/types";
import { bulkDeleteAssets } from "@/app/(platform)/studio/assets/actions";

const CLASS_TONE: Record<AssetClass, "info" | "warning" | "muted"> = {
  gear: "muted",
  fleet: "info",
  lot: "warning",
};

/**
 * The unified Assets & Inventory registry (kit 20 Phase A, acceptance
 * fixtures 04/05): one DataTable over the merged `assets` store, reused by
 * the Registry and by the Fleet / Lots lenses (`classFilter`). Screenshot
 * anatomy: eyebrow → title → tab family → stat tiles → registry table with
 * Class · Kind · Source · Qty · Location · Disposition columns.
 */
export async function AssetInventorySurface({
  title,
  classFilter,
  subtitleHint,
}: {
  title: string;
  classFilter?: AssetClass;
  subtitleHint?: string;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={title} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.assets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();
  let query = supabase
    .from("assets")
    .select(
      "id, display_name, asset_kind, asset_class, state, qty, disposition, ownership, serial, asset_tag, location_id, daily_rate_minor, deleted_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("display_name", { ascending: true })
    .limit(1000);
  if (classFilter) query = query.eq("asset_class", classFilter);
  const [{ data: assetRows }, { data: locationRows }] = await Promise.all([
    query,
    supabase.from("locations").select("id, name").eq("org_id", session.orgId),
  ]);
  const rows = (assetRows ?? []) as unknown as Asset[];
  const locationName = new Map((locationRows ?? []).map((l) => [l.id, l.name] as const));

  const available = rows.filter((r) => r.state === "available").length;
  const checkedOut = rows.filter((r) => r.state === "in_use" || r.state === "in_transit").length;
  const maintenance = rows.filter((r) => r.state === "in_maintenance").length;
  const assetsLabel = t("console.assets.stat.assets", undefined, "Assets");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Production · Build")}
        title={title}
        subtitle={
          subtitleHint ??
          t(
            "console.assets.subtitle",
            { count: rows.length, available },
            `${rows.length} Assets · ${available} Available · One Store, Three Lenses`,
          )
        }
        action={
          <Button href="/studio/assets/new" size="sm">
            {t("console.assets.addAsset", undefined, "+ Add Asset")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-3 text-xs">
            <a
              className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)] hover:underline"
              href="/studio/production/av"
            >
              {t("console.assets.lens.av", undefined, "AV Inventory")}
            </a>
            <a
              className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)] hover:underline"
              href="/studio/production/equipment/utilization"
            >
              {t("console.assets.lens.utilization", undefined, "Utilization")}
            </a>
            <a
              className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)] hover:underline"
              href="/studio/logistics/disposition"
            >
              {t("console.assets.lens.disposition", undefined, "Disposition")}
            </a>
          </div>
        </div>
        <div className="metric-grid">
          <MetricCard label={assetsLabel} value={String(rows.length)} />
          <MetricCard label={t("console.assets.stat.available", undefined, "Available")} value={String(available)} />
          <MetricCard
            label={t("console.assets.stat.checkedOut", undefined, "Checked Out")}
            value={String(checkedOut)}
          />
          <MetricCard
            label={t("console.assets.stat.maintenance", undefined, "Maintenance")}
            value={String(maintenance)}
          />
        </div>
        <DataTable<Asset>
          rows={rows}
          rowHref={(r) => `/studio/assets/${r.id}`}
          emptyLabel={t("console.assets.emptyLabel", undefined, "No assets yet")}
          emptyDescription={t(
            "console.assets.emptyDescription",
            undefined,
            "Track every physical thing (gear, heavy fleet, and warehouse lots) in one registry with lifecycle, quantity, and disposition.",
          )}
          emptyAction={
            <Button href="/studio/assets/new" size="sm">
              {t("console.assets.addAssetLower", undefined, "+ Add asset")}
            </Button>
          }
          bulkActions={[
            {
              id: "delete",
              label: t("console.assets.bulk.delete", undefined, "Delete"),
              variant: "danger",
              perform: bulkDeleteAssets,
            },
          ]}
          columns={[
            {
              key: "display_name",
              header: t("console.assets.columns.asset", undefined, "Asset"),
              render: (r) => r.display_name,
              accessor: (r) => r.display_name,
            },
            {
              key: "asset_class",
              header: t("console.assets.columns.class", undefined, "Class"),
              render: (r) => <Badge variant={CLASS_TONE[r.asset_class]}>{ASSET_CLASS_LABELS[r.asset_class]}</Badge>,
              accessor: (r) => r.asset_class,
              filterable: true,
              groupable: true,
            },
            {
              key: "asset_kind",
              header: t("console.assets.columns.kind", undefined, "Kind"),
              render: (r) => toTitle(r.asset_kind),
              className: "font-mono text-xs",
              accessor: (r) => r.asset_kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "ownership",
              header: t("console.assets.columns.source", undefined, "Source"),
              render: (r) => toTitle(r.ownership),
              accessor: (r) => r.ownership,
              filterable: true,
              groupable: true,
            },
            {
              key: "qty",
              header: t("console.assets.columns.qty", undefined, "Qty"),
              render: (r) => String(r.qty),
              className: "font-mono text-xs",
              accessor: (r) => r.qty,
            },
            {
              key: "location",
              header: t("console.assets.columns.location", undefined, "Location"),
              render: (r) => (r.location_id ? (locationName.get(r.location_id) ?? "—") : "—"),
              accessor: (r) => (r.location_id ? (locationName.get(r.location_id) ?? null) : null),
              filterable: true,
              groupable: true,
            },
            {
              key: "disposition",
              header: t("console.assets.columns.disposition", undefined, "Disposition"),
              render: (r) => (r.disposition ? ASSET_DISPOSITION_LABELS[r.disposition] : "—"),
              accessor: (r) => r.disposition ?? null,
              filterable: true,
            },
            {
              key: "state",
              header: t("console.assets.columns.state", undefined, "State"),
              render: (r) => <StatusBadge status={r.state} />,
              accessor: (r) => r.state,
              filterable: true,
              groupable: true,
            },
            {
              key: "tag",
              header: t("console.assets.columns.assetTag", undefined, "Asset Tag"),
              render: (r) => r.asset_tag ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "rate",
              header: t("console.assets.columns.dailyRate", undefined, "Daily Rate"),
              render: (r) => formatMoney(r.daily_rate_minor),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.daily_rate_minor ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
