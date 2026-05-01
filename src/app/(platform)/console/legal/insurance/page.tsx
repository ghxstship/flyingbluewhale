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
        <ModuleHeader eyebrow="Console" title="Insurance Policies" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("insurance_policies", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Legal"
        title="Insurance Policies"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/legal/insurance/new" size="sm">
            + New Policy
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/legal/insurance/${r.id}`}
          emptyLabel="No insurance policies"
          emptyDescription="Track GL, motor, professional indemnity, and event-cancel cover. Renewal alerts attach to expiring policies."
          emptyAction={
            <Button href="/console/legal/insurance/new" size="sm">
              + New Policy
            </Button>
          }
          columns={[
            {
              key: "carrier",
              header: "Carrier",
              render: (r) => String(r.carrier ?? "—"),
              accessor: (r) => r.carrier ?? null,
            },
            {
              key: "policy_no",
              header: "Policy No.",
              render: (r) => <span className="font-mono text-xs">{String(r.policy_no ?? "—")}</span>,
              accessor: (r) => r.policy_no ?? null,
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
              key: "effective_on",
              header: "Effective",
              render: (r) => <span className="font-mono text-xs">{String(r.effective_on ?? "—")}</span>,
              accessor: (r) => r.effective_on ?? null,
            },
            {
              key: "expires_on",
              header: "Expires",
              render: (r) => <span className="font-mono text-xs">{String(r.expires_on ?? "—")}</span>,
              accessor: (r) => r.expires_on ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
