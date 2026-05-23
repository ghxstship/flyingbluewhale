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
        <ModuleHeader eyebrow="Workspace" title="Sponsor Entitlements" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("sponsor_entitlements", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Sponsor Entitlements"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/commercial/sponsors/new" size="sm">
            + New Sponsor
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/commercial/sponsors/${r.id}`}
          emptyLabel="No sponsor entitlements"
          emptyDescription="Track contracted deliverables — signage, hospitality counts, on-air mentions — and status against fulfilment."
          emptyAction={
            <Button href="/console/commercial/sponsors/new" size="sm">
              + New Sponsor
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => String(r.title ?? "—"), accessor: (r) => r.title ?? null },
            {
              key: "quantity",
              header: "Quantity",
              render: (r) => <span className="font-mono text-xs">{String(r.quantity ?? "—")}</span>,
              accessor: (r) => r.quantity ?? null,
            },
            {
              key: "delivered",
              header: "Delivered",
              render: (r) => <span className="font-mono text-xs">{String(r.delivered ?? "—")}</span>,
              accessor: (r) => r.delivered ?? null,
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
              header: "Due By",
              render: (r) => <span className="font-mono text-xs">{String(r.due_by ?? "—")}</span>,
              accessor: (r) => r.due_by ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
