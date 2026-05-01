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
        <ModuleHeader eyebrow="Console" title="DSAR requests" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("dsar_requests", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Legal · Privacy"
        title="DSAR Requests"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/legal/privacy/dsar/new" size="sm">
            + Log request
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/legal/privacy/dsar/${r.id}`}
          emptyLabel="No DSAR requests"
          emptyDescription="Subject access, deletion, and portability requests with statutory due dates."
          emptyAction={
            <Button href="/console/legal/privacy/dsar/new" size="sm">
              + Log request
            </Button>
          }
          columns={[
            {
              key: "requester_email",
              header: "Requester",
              render: (r) => <span className="font-mono text-xs">{String(r.requester_email ?? "—")}</span>,
              accessor: (r) => r.requester_email ?? null,
            },
            {
              key: "kind",
              header: "Kind",
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "due_by",
              header: "Due",
              render: (r) => <span className="font-mono text-xs">{String(r.due_by ?? "—")}</span>,
              accessor: (r) => r.due_by ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
