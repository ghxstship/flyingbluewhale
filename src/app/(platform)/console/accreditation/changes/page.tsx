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
        <ModuleHeader eyebrow="Console" title="Accreditation Changes" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditation_changes", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation"
        title="Changes"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/accreditation/changes/new" size="sm">
            + Request change
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/accreditation/changes/${r.id}`}
          emptyLabel="No accreditation changes"
          emptyDescription="Re-issue, role change, and revocation requests with audit trail."
          emptyAction={
            <Button href="/console/accreditation/changes/new" size="sm">
              + Request change
            </Button>
          }
          columns={[
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
              key: "created_at",
              header: "Requested",
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
