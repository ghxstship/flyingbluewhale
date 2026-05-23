import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Events" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("events", session.orgId, { orderBy: "starts_at", ascending: true });
  return (
    <>
      <ModuleHeader
        eyebrow="Work"
        title="Events"
        subtitle={`${rows.length} Event${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/events/new">+ New Event</Button>}
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          emptyLabel="No events scheduled"
          emptyDescription="Events anchor schedules, set times, and venue handover. Status flows draft → planned → live → wrapped."
          emptyAction={
            <Button href="/console/events/new" size="sm">
              + New Event
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "starts",
              header: "Starts",
              render: (r) => formatDate(r.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.starts_at,
            },
            {
              key: "ends",
              header: "Ends",
              render: (r) => formatDate(r.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (r) => r.ends_at,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
