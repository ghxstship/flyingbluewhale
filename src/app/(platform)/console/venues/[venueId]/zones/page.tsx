import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Zones" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Venue"
        title={`${venue.name} — Zones`}
        subtitle={`${zones.length} zone${zones.length === 1 ? "" : "s"} authored`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Zones" },
        ]}
      />
      <div className="page-content space-y-5">
        <DataTable<ZoneRow>
          rows={zones}
          emptyLabel="No zones yet"
          emptyDescription="Author zones to map accreditation categories to physical areas. The accreditation/policy matrix derives from this list × the categories table."
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "parent",
              header: "Parent",
              render: (r) => (r.parent_zone_id ? "↳" : "—"),
              accessor: (r) => r.parent_zone_id ?? null,
            },
            {
              key: "cats",
              header: "Allowed Categories",
              render: (r) => {
                const cats = categoriesFor(r.allowed_categories);
                if (cats.length === 0) return <span className="text-[var(--text-muted)]">—</span>;
                return (
                  <div className="flex flex-wrap gap-1">
                    {cats.slice(0, 6).map((c) => (
                      <Badge key={c} variant="muted">
                        {c}
                      </Badge>
                    ))}
                    {cats.length > 6 && <span className="text-xs text-[var(--text-muted)]">+{cats.length - 6}</span>}
                  </div>
                );
              },
              accessor: (r) => r.allowed_categories ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Zones drive the accreditation policy matrix. Edit <code>allowed_categories</code> to grant access to category
          codes — the matrix at <code>/console/accreditation/policy</code> renders the result.
        </p>
      </div>
    </>
  );
}
