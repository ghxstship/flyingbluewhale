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
        <ModuleHeader eyebrow="Console" title="Ticket Types" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("ticket_types", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Ticket Types"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/commercial/tickets/new" size="sm">
            + New ticket type
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/commercial/tickets/${r.id}`}
          emptyLabel="No ticket types"
          emptyDescription="Define the products you'll sell — public, comp, hospitality — with allocations and channel splits."
          emptyAction={
            <Button href="/console/commercial/tickets/new" size="sm">
              + New ticket type
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "channel", header: "Channel", render: (r) => String(r.channel ?? "—") },
            {
              key: "price_cents",
              header: "Price (¢)",
              render: (r) => <span className="font-mono text-xs">{String(r.price_cents ?? "—")}</span>,
            },
            {
              key: "allocation",
              header: "Allocation",
              render: (r) => <span className="font-mono text-xs">{String(r.allocation ?? "—")}</span>,
            },
            {
              key: "sold",
              header: "Sold",
              render: (r) => <span className="font-mono text-xs">{String(r.sold ?? "—")}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
