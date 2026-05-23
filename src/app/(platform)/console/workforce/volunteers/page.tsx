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
        <ModuleHeader eyebrow="Workspace" title="Volunteers" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("workforce_members", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "volunteer" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Volunteers"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/workforce/volunteers/new" size="sm">
            + Add volunteer
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/workforce/volunteers/${r.id}`}
          emptyLabel="No volunteers"
          emptyDescription="Volunteer roster — onboarding, role assignment, and shift acceptance live on the detail page."
          emptyAction={
            <Button href="/console/workforce/volunteers/new" size="sm">
              + Add volunteer
            </Button>
          }
          columns={[
            {
              key: "full_name",
              header: "Name",
              render: (r) => String(r.full_name ?? "—"),
              accessor: (r) => r.full_name ?? null,
            },
            {
              key: "role",
              header: "Role",
              render: (r) => String(r.role ?? "—"),
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: "Email",
              render: (r) => <span className="font-mono text-xs">{String(r.email ?? "—")}</span>,
              accessor: (r) => r.email ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
