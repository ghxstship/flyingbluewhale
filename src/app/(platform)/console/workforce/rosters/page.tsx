import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Rosters" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("rosters", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Rosters"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/workforce/rosters/new" size="sm">
            + New Roster
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/workforce/rosters/${r.id}`}
          emptyLabel="No rosters"
          emptyDescription="Daily rosters drive scheduling, sign-in, and call-time delivery for the workforce."
          emptyAction={
            <Button href="/console/workforce/rosters/new" size="sm">
              + New Roster
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "day_of",
              header: "Day",
              render: (r) => <span className="font-mono text-xs">{String(r.day_of ?? "—")}</span>,
              accessor: (r) => r.day_of ?? null,
            },
            {
              key: "state",
              header: "State",
              render: (r) => String(r.state ?? "—"),
              accessor: (r) => r.state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
