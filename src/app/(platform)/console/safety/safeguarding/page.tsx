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
        <ModuleHeader eyebrow="Console" title="Safeguarding Reports" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("safeguarding_reports", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Safeguarding Reports"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/safety/safeguarding/new" size="sm">
            + File report
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/safeguarding/${r.id}`}
          emptyLabel="No safeguarding reports"
          emptyDescription="Sensitive disclosures route here for triage by the designated safeguarding lead."
          emptyAction={
            <Button href="/console/safety/safeguarding/new" size="sm">
              + File report
            </Button>
          }
          columns={[
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
            {
              key: "created_at",
              header: "Filed",
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
