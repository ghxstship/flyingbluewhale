import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Locations pillar (canonical home, decision 6 rider): the canonical space
 * registry with full CRUD. /studio/locations redirects here.
 */

type LocationRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

function place(l: LocationRow): string {
  const parts = [l.city, l.region, l.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export default async function LocationsPillarPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.locations.list.eyebrow", undefined, "Organization Hub")}
          title={t("console.locations.list.title", undefined, "Locations")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("locations")
    .select("id, name, address, city, region, country")
    .eq("org_id", session.orgId)
    .order("name", { ascending: true })
    .limit(300);
  const rows = (data ?? []) as LocationRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.locations.list.eyebrow", undefined, "Organization Hub")}
        title={t("console.locations.list.title", undefined, "Locations")}
        subtitle={
          rows.length === 1
            ? t("console.locations.list.oneLocation", undefined, "1 location in the space registry")
            : t(
                "console.locations.list.nLocations",
                { count: rows.length },
                `${rows.length} locations in the space registry`,
              )
        }
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.locations.list.title", undefined, "Locations") },
        ]}
        action={
          <Button href="/legend/hub/locations/new" size="sm">
            {t("console.locations.list.addLocation", undefined, "+ Add Location")}
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.locations.list.emptyTitle", undefined, "No locations yet")}
            description={t(
              "console.locations.list.emptyDescription",
              undefined,
              "Register your offices, venues, and yards. Projects, shifts, and time-clock zones all point at these.",
            )}
            action={
              <Button href="/legend/hub/locations/new">
                {t("console.locations.list.addLocation", undefined, "+ Add Location")}
              </Button>
            }
          />
        ) : (
          <DataView<LocationRow>
            rows={rows}
            rowHref={(l) => `/legend/hub/locations/${l.id}`}
            emptyLabel={t("console.locations.list.emptyLabel", undefined, "No locations")}
            columns={[
              {
                key: "name",
                header: t("console.locations.list.columns.name", undefined, "Name"),
                render: (l) => l.name,
                accessor: (l) => l.name,
              },
              {
                key: "address",
                header: t("console.locations.list.columns.address", undefined, "Address"),
                render: (l) => l.address ?? "—",
                accessor: (l) => l.address ?? "",
              },
              {
                key: "place",
                header: t("console.locations.list.columns.cityRegion", undefined, "City / Region"),
                render: (l) => place(l),
                accessor: (l) => place(l),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
