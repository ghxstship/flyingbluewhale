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
        <ModuleHeader eyebrow="Console" title="Delegations" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("delegations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Participants"
        title="Delegations"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/participants/delegations/new" size="sm">
            + New Delegation
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/participants/delegations/${r.id}`}
          emptyLabel="No delegations"
          emptyDescription="Country teams, federation rosters, and entourage groupings live here. Each delegation owns its own roster + accreditation matrix."
          emptyAction={
            <Button href="/console/participants/delegations/new" size="sm">
              + New Delegation
            </Button>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{String(r.code ?? "—")}</span>,
              accessor: (r) => r.code ?? null,
            },
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "country",
              header: "Country",
              render: (r) => String(r.country ?? "—"),
              accessor: (r) => r.country ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
