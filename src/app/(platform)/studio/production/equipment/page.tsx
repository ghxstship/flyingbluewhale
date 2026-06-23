import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Equipment, EquipmentStatus } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { bulkDeleteEquipment } from "./actions";

const STATUS_BG: Record<EquipmentStatus, "success" | "warning" | "info" | "muted" | "error"> = {
  available: "success",
  reserved: "info",
  in_use: "info",
  maintenance: "warning",
  retired: "muted",
};

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.production.equipment.title", undefined, "Equipment")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.equipment.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const allRows = await listOrgScoped("equipment", session.orgId, { orderBy: "name", ascending: true });
  // Hide soft-deleted rows from the list. Retired equipment stays visible
  // (it's part of the org history); only true deletes get hidden.
  const rows = allRows.filter((r) => r.deleted_at == null);
  const available = rows.filter((r) => r.equipment_state === "available").length;
  const itemsLabel =
    rows.length === 1
      ? t("console.production.equipment.itemSingular", undefined, "Item")
      : t("console.production.equipment.itemPlural", undefined, "Items");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.eyebrow", undefined, "Production")}
        title={t("console.production.equipment.title", undefined, "Equipment")}
        subtitle={`${rows.length} ${itemsLabel} · ${available} ${t("console.production.equipment.available", undefined, "Available")}`}
        action={
          <Button href="/studio/production/equipment/new" size="sm">
            {t("console.production.equipment.addEquipment", undefined, "+ Add Equipment")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Equipment>
          rows={rows}
          rowHref={(r) => `/studio/production/equipment/${r.id}`}
          emptyLabel={t("console.production.equipment.emptyLabel", undefined, "No equipment yet")}
          emptyDescription={t(
            "console.production.equipment.emptyDescription",
            undefined,
            "Track every owned + rented asset with rates, asset tags, and lifecycle status.",
          )}
          emptyAction={
            <Button href="/studio/production/equipment/new" size="sm">
              {t("console.production.equipment.addEquipmentLower", undefined, "+ Add equipment")}
            </Button>
          }
          bulkActions={[
            {
              id: "delete",
              label: t("console.production.equipment.bulk.delete", undefined, "Delete"),
              variant: "danger",
              perform: bulkDeleteEquipment,
            },
          ]}
          columns={[
            {
              key: "name",
              header: t("console.production.equipment.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "category",
              header: t("console.production.equipment.columns.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "tag",
              header: t("console.production.equipment.columns.assetTag", undefined, "Asset Tag"),
              render: (r) => r.asset_tag ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "equipment_state",
              header: t("console.production.equipment.columns.equipment_state", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_BG[r.equipment_state]}>{toTitle(r.equipment_state)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.equipment_state ?? null,
            },
            {
              key: "rate",
              header: t("console.production.equipment.columns.dailyRate", undefined, "Daily Rate"),
              render: (r) => formatMoney(r.daily_rate_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.daily_rate_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
