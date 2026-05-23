import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Workspace" title="Vetting Queue" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "state", op: "eq", value: "vetting" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Workspace"
        title="Vetting Queue"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/accreditation/vetting/${r.id}`}
          emptyLabel="No applications in vetting"
          emptyDescription="Applications land here once a delegate submits identity + role information for review."
          columns={[
            {
              key: "person_name",
              header: "Person",
              render: (r) => String(r.person_name ?? "—"),
              accessor: (r) => r.person_name ?? null,
            },
            {
              key: "person_email",
              header: "Email",
              render: (r) => <span className="font-mono text-xs">{String(r.person_email ?? "—")}</span>,
              accessor: (r) => r.person_email ?? null,
            },
            {
              key: "vetting",
              header: "Status",
              render: (r) => String(r.vetting ?? "—"),
              accessor: (r) => r.vetting ?? null,
            },
            {
              key: "created_at",
              header: "Submitted",
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
