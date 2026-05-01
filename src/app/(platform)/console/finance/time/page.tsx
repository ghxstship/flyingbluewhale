import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { TimeEntry } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function fmtMinutes(m: number | null) {
  if (!m) return "—";
  const h = Math.floor(m / 60),
    mm = m % 60;
  return `${h}h ${mm}m`;
}

export default async function TimePage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Time Tracking" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("time_entries", session.orgId, { orderBy: "started_at" });
  const totalMin = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Time Tracking"
        subtitle={`${rows.length} entries · ${fmtMinutes(totalMin)} logged`}
        action={<Button href="/console/finance/time/new">+ New Entry</Button>}
      />
      <div className="page-content">
        <DataTable<TimeEntry>
          rows={rows}
          rowHref={(r) => `/console/finance/time/${r.id}`}
          emptyLabel="No time entries"
          emptyDescription="Track billable + non-billable work for invoices and labour cost reporting."
          emptyAction={
            <Button href="/console/finance/time/new" size="sm">
              + New Entry
            </Button>
          }
          columns={[
            {
              key: "description",
              header: "Description",
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "duration",
              header: "Duration",
              render: (r) => fmtMinutes(r.duration_minutes),
              className: "font-mono text-xs",
              accessor: (r) => r.duration_minutes ?? null,
            },
            {
              key: "billable",
              header: "Billable",
              render: (r) => (r.billable ? <Badge variant="success">Yes</Badge> : <Badge variant="muted">No</Badge>),
              accessor: (r) => r.billable ?? null,
            },
            {
              key: "started",
              header: "Started",
              render: (r) => timeAgo(r.started_at),
              className: "font-mono text-xs",
              accessor: (r) => r.started_at,
            },
          ]}
        />
      </div>
    </>
  );
}
