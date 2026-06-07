import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type EquipmentRow = {
  id: string;
  name: string;
  asset_tag: string | null;
  category: string | null;
  status: string;
  serial: string | null;
  location: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.warehouse.inventory.eyebrow", undefined, "Production · Warehouse")}
          title={t("console.production.warehouse.inventory.title", undefined, "Inventory")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.warehouse.inventory.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("id, name, asset_tag, category, status, serial, location:location_id(name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(1000);
  const unassignedLabel = t("console.production.warehouse.inventory.unassigned", undefined, "Unassigned");
  const rows = ((data ?? []) as unknown as EquipmentRow[]).map((e) => ({
    ...e,
    location_name: e.location?.name ?? unassignedLabel,
  }));

  // Roll-up: count per status, count per location
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const byLocation = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.location_name ?? unassignedLabel;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const locationEntries = Object.entries(byLocation).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.warehouse.inventory.eyebrow", undefined, "Production · Warehouse")}
        title={t("console.production.warehouse.inventory.title", undefined, "Inventory")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.production.warehouse.inventory.assetSingular", undefined, "Asset") : t("console.production.warehouse.inventory.assetPlural", undefined, "Assets")} · ${locationEntries.length} ${locationEntries.length === 1 ? t("console.production.warehouse.inventory.locationSingular", undefined, "location") : t("console.production.warehouse.inventory.locationPlural", undefined, "locations")}`}
        action={
          <Button href="/console/production/equipment/new" size="sm">
            {t("console.production.warehouse.inventory.newItem", undefined, "+ New Item")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-2">
          <div className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.production.warehouse.inventory.byStatus", undefined, "By Status")}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {statusEntries.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <StatusBadge status={status} />
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.production.warehouse.inventory.byLocation", undefined, "By Location")}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {locationEntries.slice(0, 8).map(([loc, count]) => (
                <li key={loc} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--p-text-2)]">{loc}</span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{count}</span>
                </li>
              ))}
              {locationEntries.length > 8 && (
                <li className="text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.production.warehouse.inventory.moreLocations",
                    { count: locationEntries.length - 8 },
                    "+ {count} more",
                  )}
                </li>
              )}
            </ul>
          </div>
        </section>

        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/production/equipment/${r.id}`}
          emptyLabel={t("console.production.warehouse.inventory.emptyLabel", undefined, "No assets in inventory")}
          emptyDescription={t(
            "console.production.warehouse.inventory.emptyDescription",
            undefined,
            "Author each piece of gear with a category, serial, and asset tag. Status flows through available → reserved → in_use → maintenance → retired.",
          )}
          emptyAction={
            <Button href="/console/production/equipment/new" size="sm">
              {t("console.production.warehouse.inventory.newItem", undefined, "+ New Item")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.production.warehouse.inventory.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "asset_tag",
              header: t("console.production.warehouse.inventory.columns.tag", undefined, "Tag"),
              render: (r) => <span className="font-mono text-xs">{String(r.asset_tag ?? "—")}</span>,
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "category",
              header: t("console.production.warehouse.inventory.columns.category", undefined, "Category"),
              render: (r) => String(r.category ?? "—"),
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "location",
              header: t("console.production.warehouse.inventory.columns.location", undefined, "Location"),
              render: (r) => String(r.location_name ?? "—"),
              accessor: (r) => r.location_name ?? null,
            },
            {
              key: "serial",
              header: t("console.production.warehouse.inventory.columns.serial", undefined, "Serial"),
              render: (r) => <span className="font-mono text-xs">{String(r.serial ?? "—")}</span>,
              accessor: (r) => r.serial ?? null,
            },
            {
              key: "status",
              header: t("console.production.warehouse.inventory.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={String(r.status)} />,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t("console.production.warehouse.inventory.footerPrefix", undefined, "Inventory is a roll-up of every ")}
          <Badge variant="muted">
            {t("console.production.warehouse.inventory.equipmentBadge", undefined, "Equipment")}
          </Badge>
          {t(
            "console.production.warehouse.inventory.footerSuffix",
            undefined,
            " row in this workspace. Tag movements are recorded against the asset; pre-rig staging and venue bay assignments live in the rentals + dispatch surfaces.",
          )}
        </p>
      </div>
    </>
  );
}
