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
        <ModuleHeader eyebrow="Console" title="Crisis Alerts" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("crisis_alerts", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Crisis Alerts"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/safety/crisis/new" size="sm">
            + Activate alert
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/crisis/${r.id}`}
          emptyLabel="No crisis alerts"
          emptyDescription="Activated alerts page leadership and route to the major-incident plan when severity warrants."
          columns={[
            { key: "title", header: "Title", render: (r) => String(r.title ?? "—"), accessor: (r) => r.title ?? null },
            {
              key: "severity",
              header: "Severity",
              render: (r) => String(r.severity ?? "—"),
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "sent_at",
              header: "Sent",
              render: (r) => <span className="font-mono text-xs">{String(r.sent_at ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
