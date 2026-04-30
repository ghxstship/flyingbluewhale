import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type BlockRow = {
  id: string;
  name: string;
  property: string;
  city: string | null;
  stakeholder_group: string | null;
  starts_on: string | null;
  ends_on: string | null;
  rooms_reserved: number;
  rooms_confirmed: number;
};

const WORKFORCE_GROUPS = ["paid_staff", "contractor", "volunteer", "crew", "workforce"];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Housing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const all = (await listOrgScoped("accommodation_blocks", session.orgId, {
    orderBy: "starts_on",
    ascending: true,
    limit: 500,
  })) as BlockRow[];

  // Workforce-relevant blocks: stakeholder group matches a workforce category,
  // or no stakeholder group (default = workforce). VIP/talent/sponsor blocks
  // intentionally excluded — they belong to the VIP / commercial surfaces.
  const rows = all.filter((b) => {
    if (!b.stakeholder_group) return true;
    return WORKFORCE_GROUPS.includes(b.stakeholder_group.toLowerCase());
  });

  const totalReserved = rows.reduce((s, r) => s + (r.rooms_reserved ?? 0), 0);
  const totalConfirmed = rows.reduce((s, r) => s + (r.rooms_confirmed ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Housing"
        subtitle={`${rows.length} block${rows.length === 1 ? "" : "s"} · ${totalConfirmed} of ${totalReserved} room${totalReserved === 1 ? "" : "s"} confirmed`}
        action={
          <Button href="/console/accommodation/blocks/new" size="sm">
            + New block
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<BlockRow>
          rows={rows}
          rowHref={(r) => `/console/accommodation/blocks/${r.id}`}
          emptyLabel="No workforce housing booked"
          emptyDescription="Group blocks with stakeholder_group set to a workforce category surface here. VIP and talent blocks live on their own surfaces."
          emptyAction={
            <Button href="/console/accommodation/blocks/new" size="sm">
              + New block
            </Button>
          }
          columns={[
            { key: "name", header: "Block", render: (r) => r.name },
            { key: "property", header: "Property", render: (r) => r.property },
            { key: "city", header: "City", render: (r) => r.city ?? "—", className: "font-mono text-xs" },
            {
              key: "stakeholder",
              header: "Group",
              render: (r) => (r.stakeholder_group ? <Badge variant="muted">{r.stakeholder_group}</Badge> : "—"),
            },
            {
              key: "rooms",
              header: "Rooms",
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.rooms_confirmed ?? 0} / {r.rooms_reserved ?? 0}
                </span>
              ),
            },
            {
              key: "dates",
              header: "Dates",
              render: (r) => `${r.starts_on ?? "?"} → ${r.ends_on ?? "?"}`,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
