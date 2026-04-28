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
        <ModuleHeader eyebrow="Console" title="Major Incidents" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("major_incidents", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Major Incidents"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/safety/major-incident/new" size="sm">
            + Activate plan
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/major-incident/${r.id}`}
          emptyLabel="No major incidents"
          emptyDescription="Open a record when a major-incident plan is activated; the timeline tracks decisions and status changes."
          emptyAction={
            <Button href="/console/safety/major-incident/new" size="sm">
              + Activate plan
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
            {
              key: "opened_at",
              header: "Opened",
              render: (r) => <span className="font-mono text-xs">{String(r.opened_at ?? "—")}</span>,
            },
            {
              key: "closed_at",
              header: "Closed",
              render: (r) => <span className="font-mono text-xs">{String(r.closed_at ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
