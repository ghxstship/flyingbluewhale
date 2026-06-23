import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type LocationRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.warehouse.locations.eyebrow", undefined, "Production · Warehouse")}
          title={t("console.production.warehouse.locations.title", undefined, "Locations")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.warehouse.locations.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: locsData }, { data: equipmentData }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, address, city, region, country")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(500),
    supabase.from("equipment").select("location_id").eq("org_id", session.orgId).is("deleted_at", null),
  ]);

  const locations = (locsData ?? []) as LocationRow[];
  const counts = (equipmentData ?? []).reduce<Record<string, number>>((acc, r) => {
    const k = (r as { location_id: string | null }).location_id ?? "__none__";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const rows = locations.map((l) => ({
    ...l,
    asset_count: counts[l.id] ?? 0,
  }));
  const unassigned = counts["__none__"] ?? 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.warehouse.locations.eyebrow", undefined, "Production · Warehouse")}
        title={t("console.production.warehouse.locations.title", undefined, "Locations")}
        subtitle={t(
          "console.production.warehouse.locations.subtitle",
          {
            locations: rows.length,
            locationSuffix: rows.length === 1 ? "" : "s",
            unassigned,
            assetSuffix: unassigned === 1 ? "" : "s",
          },
          `${rows.length} location${rows.length === 1 ? "" : "s"} · ${unassigned} asset${unassigned === 1 ? "" : "s"} unassigned`,
        )}
        action={
          <Button href="/studio/locations/new" size="sm">
            {t("console.production.warehouse.locations.newLocation", undefined, "+ New Location")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/locations/${r.id}`}
          emptyLabel={t("console.production.warehouse.locations.emptyLabel", undefined, "No locations on file")}
          emptyDescription={t(
            "console.production.warehouse.locations.emptyDescription",
            undefined,
            "Locations are warehouses, staging bays, depots, and venue back-of-house. Each piece of equipment can be tagged to one.",
          )}
          emptyAction={
            <Button href="/studio/locations/new" size="sm">
              {t("console.production.warehouse.locations.newLocation", undefined, "+ New Location")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.production.warehouse.locations.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "city",
              header: t("console.production.warehouse.locations.columns.city", undefined, "City"),
              render: (r) => [r.city, r.region].filter(Boolean).join(", ") || "—",
              className: "font-mono text-xs",
              accessor: (r) => r.city ?? null,
            },
            {
              key: "country",
              header: t("console.production.warehouse.locations.columns.country", undefined, "Country"),
              render: (r) => String(r.country ?? "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.country ?? null,
            },
            {
              key: "asset_count",
              header: t("console.production.warehouse.locations.columns.assets", undefined, "Assets"),
              render: (r) => <span className="font-mono text-xs">{String(r.asset_count ?? 0)}</span>,
              accessor: (r) => r.asset_count ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
