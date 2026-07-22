import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Locations pillar (MIRROR): the canonical space registry. Read-only here;
 * editing stays in the console at /studio/locations.
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Locations" />
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
        eyebrow="Organization Hub"
        title="Locations"
        subtitle={
          rows.length === 1
            ? "1 location in the space registry"
            : `${rows.length} locations in the space registry`
        }
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Locations" },
        ]}
        action={
          <Button href={urlFor("platform", "/locations")} size="sm" variant="secondary">
            Edit in console
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No locations yet"
            description="Register your offices, venues, and yards in the console. Projects, shifts, and time-clock zones all point at these."
            action={
              <Button href={urlFor("platform", "/locations")} variant="secondary">
                Open the registry
              </Button>
            }
          />
        ) : (
          <DataTable<LocationRow>
            rows={rows}
            emptyLabel="No locations"
            columns={[
              {
                key: "name",
                header: "Name",
                render: (l) => l.name,
                accessor: (l) => l.name,
              },
              {
                key: "address",
                header: "Address",
                render: (l) => l.address ?? "—",
                accessor: (l) => l.address ?? "",
              },
              {
                key: "place",
                header: "City / Region",
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
