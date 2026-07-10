import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type ZoneRow = {
  id: string;
  code: string;
  name: string;
  allowed_categories: unknown;
  parent_zone_id: string | null;
};

function categoriesFor(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.zones.eyebrow", undefined, "Venue")}
          title={t("console.venues.zones.title", undefined, "Zones")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.zones.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: venueData }, { data: zoneData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_zones")
      .select("id, code, name, allowed_categories, parent_zone_id")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("code", { ascending: true }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const zones = ((zoneData ?? []) as unknown as ZoneRow[]) ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.zones.eyebrow", undefined, "Venue")}
        title={t("console.venues.zones.titleWithName", { name: venue.name }, `${venue.name} · Zones`)}
        subtitle={t(
          "console.venues.zones.subtitle",
          { count: zones.length },
          `${zones.length} zone${zones.length === 1 ? "" : "s"} authored`,
        )}
        breadcrumbs={[
          { label: t("console.venues.zones.breadcrumbVenues", undefined, "Venues"), href: "/studio/venues" },
          { label: venue.name, href: `/studio/venues/${venue.id}` },
          { label: t("console.venues.zones.breadcrumbZones", undefined, "Zones") },
        ]}
      />
      <div className="page-content space-y-5">
        <DataTable<ZoneRow>
          rows={zones}
          emptyLabel={t("console.venues.zones.emptyLabel", undefined, "No zones yet")}
          emptyDescription={t(
            "console.venues.zones.emptyDescription",
            undefined,
            "Author zones to map accreditation categories to physical areas. The accreditation/policy matrix derives from this list × the categories table.",
          )}
          columns={[
            {
              key: "code",
              header: t("console.venues.zones.column.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "name",
              header: t("console.venues.zones.column.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "parent",
              header: t("console.venues.zones.column.parent", undefined, "Parent"),
              render: (r) => (r.parent_zone_id ? "↳" : "—"),
              accessor: (r) => r.parent_zone_id ?? null,
            },
            {
              key: "cats",
              header: t("console.venues.zones.column.allowedCategories", undefined, "Allowed Categories"),
              render: (r) => {
                const cats = categoriesFor(r.allowed_categories);
                if (cats.length === 0) return <span className="text-[var(--p-text-2)]">—</span>;
                return (
                  <div className="flex flex-wrap gap-1">
                    {cats.slice(0, 6).map((c) => (
                      <Badge key={c} variant="muted">
                        {c}
                      </Badge>
                    ))}
                    {cats.length > 6 && <span className="text-xs text-[var(--p-text-2)]">+{cats.length - 6}</span>}
                  </div>
                );
              },
              accessor: (r) => r.allowed_categories ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          Zones drive the accreditation policy matrix. Edit the allowed categories list to grant access. The policy
          matrix renders the result.
        </p>
      </div>
    </>
  );
}
