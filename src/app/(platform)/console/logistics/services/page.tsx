import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ServiceRequest["status"], "muted" | "info" | "success" | "warning" | "error"> = {
  open: "warning",
  acknowledged: "info",
  in_progress: "info",
  resolved: "success",
  cancelled: "muted",
};

const SEVERITY_TONE: Record<ServiceRequest["severity"], "muted" | "info" | "warning" | "error"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

const LOGISTICS_CATEGORIES: Array<ServiceRequest["category"]> = ["cleaning", "repair", "other"];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Logistics" title="Services" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const all = (await listOrgScoped("service_requests", session.orgId, {
    orderBy: "opened_at",
    ascending: false,
    limit: 500,
  })) as ServiceRequest[];

  const rows = all.filter((r) => LOGISTICS_CATEGORIES.includes(r.category));
  const open = rows.filter((r) => !["resolved", "cancelled"].includes(r.status)).length;
  const breached = rows.filter((r) => r.sla_response_breached || r.sla_resolution_breached).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Logistics"
        title="Services"
        subtitle={`${rows.length} request${rows.length === 1 ? "" : "s"} · ${open} open · waste, cleaning, repairs`}
        action={
          <Button href="/console/services/requests/new" size="sm">
            + New Service
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} accent />
          <MetricCard label="SLA breached" value={breached.toLocaleString()} />
          <MetricCard label="Total · 30d" value={rows.length.toLocaleString()} />
        </div>

        <DataTable<ServiceRequest>
          rows={rows}
          rowHref={(r) => `/console/services/requests/${r.id}`}
          emptyLabel="No logistics service requests"
          emptyDescription="Cleaning, waste, and repair tickets land here. Author one via /console/services/requests."
          emptyAction={
            <Button href="/console/services/requests/new" size="sm">
              + New Service
            </Button>
          }
          columns={[
            { key: "summary", header: "Summary", render: (r) => r.summary },
            {
              key: "category",
              header: "Category",
              render: (r) => <Badge variant="muted">{r.category}</Badge>,
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity]}>{r.severity}</Badge>,
            },
            {
              key: "opened",
              header: "Opened",
              render: (r) => relativeTime(r.opened_at),
              className: "font-mono text-xs",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{r.status.replace(/_/g, " ")}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
