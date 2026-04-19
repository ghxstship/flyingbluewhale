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

export default async function SchedulePage() {
  if (!hasSupabase) return <><ModuleHeader title="Schedule" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("events", session.orgId, { orderBy: "starts_at", ascending: true });
  return (
    <>
      <ModuleHeader eyebrow="Work" title="Master schedule" subtitle={`${rows.length} event${rows.length === 1 ? "" : "s"}`}
        action={<div className="flex gap-2">
          <Button href="/api/v1/schedule.ics" variant="secondary">Export .ics</Button>
          <Button href="/console/events/new">+ New event</Button>
        </div>} />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(r) => `/console/events/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "starts", header: "Starts", render: (r) => formatDate(r.starts_at, "long"), className: "font-mono text-xs" },
            { key: "ends", header: "Ends", render: (r) => formatDate(r.ends_at, "long"), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </div>
    </>
  );
}
