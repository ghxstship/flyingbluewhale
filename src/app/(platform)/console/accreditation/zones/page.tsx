import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type ZoneRow = {
  id: string;
  code: string;
  name: string;
  parent_zone_id: string | null;
  venue: { name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Accreditation" title="Zones" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("venue_zones")
    .select("id, code, name, parent_zone_id, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .order("code", { ascending: true })
    .limit(500);
  const rows = ((data ?? []) as unknown as ZoneRow[]).map((z) => ({
    ...z,
    venue_name: z.venue?.name ?? "—",
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation"
        title="Zones"
        subtitle={`${rows.length} zone${rows.length === 1 ? "" : "s"} across all venues`}
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel="No zones defined"
          emptyDescription="Zones are authored per venue. Open a venue and use its Zones tab to add ingress, ops, FOH, BOH, and athlete-only areas."
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{String(r.code ?? "—")}</span>,
            },
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "venue", header: "Venue", render: (r) => String(r.venue_name ?? "—") },
            {
              key: "parent_zone_id",
              header: "Parent",
              render: (r) =>
                r.parent_zone_id ? (
                  <span className="font-mono text-xs">{String(r.parent_zone_id).slice(0, 8)}…</span>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
