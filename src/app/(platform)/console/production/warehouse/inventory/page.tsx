import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production · Warehouse" title="Inventory" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
  const rows = ((data ?? []) as unknown as EquipmentRow[]).map((e) => ({
    ...e,
    location_name: e.location?.name ?? "Unassigned",
  }));

  // Roll-up: count per status, count per location
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const byLocation = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.location_name ?? "Unassigned";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const statusEntries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const locationEntries = Object.entries(byLocation).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow="Production · Warehouse"
        title="Inventory"
        subtitle={`${rows.length} asset${rows.length === 1 ? "" : "s"} · ${locationEntries.length} location${locationEntries.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/production/equipment/new" size="sm">
            + New Item
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-2">
          <div className="surface p-4">
            <h3 className="text-sm font-semibold">By Status</h3>
            <ul className="mt-3 space-y-1.5">
              {statusEntries.map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <StatusBadge status={status} />
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface p-4">
            <h3 className="text-sm font-semibold">By Location</h3>
            <ul className="mt-3 space-y-1.5">
              {locationEntries.slice(0, 8).map(([loc, count]) => (
                <li key={loc} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{loc}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </li>
              ))}
              {locationEntries.length > 8 && (
                <li className="text-xs text-[var(--text-muted)]">+ {locationEntries.length - 8} more</li>
              )}
            </ul>
          </div>
        </section>

        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/production/equipment/${r.id}`}
          emptyLabel="No assets in inventory"
          emptyDescription="Author each piece of gear with a category, serial, and asset tag. Status flows through available → reserved → in_use → maintenance → retired."
          emptyAction={
            <Button href="/console/production/equipment/new" size="sm">
              + New Item
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "asset_tag",
              header: "Tag",
              render: (r) => <span className="font-mono text-xs">{String(r.asset_tag ?? "—")}</span>,
              accessor: (r) => r.asset_tag ?? null,
            },
            {
              key: "category",
              header: "Category",
              render: (r) => String(r.category ?? "—"),
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "location",
              header: "Location",
              render: (r) => String(r.location_name ?? "—"),
              accessor: (r) => r.location_name ?? null,
            },
            {
              key: "serial",
              header: "Serial",
              render: (r) => <span className="font-mono text-xs">{String(r.serial ?? "—")}</span>,
              accessor: (r) => r.serial ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={String(r.status)} />,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Inventory is a roll-up of every <Badge variant="muted">Equipment</Badge> row in this workspace. Tag movements
          are recorded against the asset; pre-rig staging and venue bay assignments live in the rentals + dispatch
          surfaces.
        </p>
      </div>
    </>
  );
}
