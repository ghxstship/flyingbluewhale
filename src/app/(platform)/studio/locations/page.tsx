import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Location } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.locations.title", undefined, "Locations")} />
        <ConfigureSupabase />
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("locations", session.orgId, { orderBy: "name", ascending: true });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.locations.eyebrow", undefined, "Work")}
        title={t("console.locations.title", undefined, "Locations")}
        subtitle={
          rows.length === 1
            ? t("console.locations.subtitle.one", { count: rows.length }, `${rows.length} location`)
            : t("console.locations.subtitle.other", { count: rows.length }, `${rows.length} locations`)
        }
        action={
          <Button href="/studio/locations/new">{t("console.locations.add", undefined, "+ Add location")}</Button>
        }
      />
      <div className="page-content">
        <DataTable<Location>
          rows={rows}
          rowHref={(row) => `/studio/locations/${row.id}`}
          emptyLabel={t("console.locations.emptyLabel", undefined, "No locations yet")}
          emptyDescription={t(
            "console.locations.emptyDescription",
            undefined,
            "Add the addresses your operations reference — venues, hotels, warehouses, depots.",
          )}
          emptyAction={
            <Button href="/studio/locations/new" size="sm">
              {t("console.locations.add", undefined, "+ Add location")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.locations.columns.name", undefined, "Name"),
              render: (row) => row.name,
              accessor: (row) => row.name,
            },
            {
              key: "address",
              header: t("console.locations.columns.address", undefined, "Address"),
              render: (row) => row.address ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.address ?? null,
            },
            {
              key: "city",
              header: t("console.locations.columns.city", undefined, "City"),
              render: (row) => [row.city, row.region].filter(Boolean).join(", ") || "—",
              className: "font-mono text-xs",
              accessor: (row) => row.city ?? null,
            },
            {
              key: "country",
              header: t("console.locations.columns.country", undefined, "Country"),
              render: (row) => row.country ?? "—",
              className: "font-mono text-xs",
              accessor: (row) => row.country ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
