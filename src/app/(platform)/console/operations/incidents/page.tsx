export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

type IncidentRow = {
  id: string;
  summary: string;
  severity: string;
  status: string;
  occurred_at: string;
  location: string | null;
};

export default async function IncidentsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, status, occurred_at, location")
    .eq("org_id", session.orgId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as IncidentRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Incidents"
        subtitle="Field-logged safety + near-miss reports."
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            Log incident
          </Button>
        }
      />
      <div className="page-content max-w-6xl">
        <DataTable<IncidentRow>
          rows={rows}
          rowHref={(r) => `/console/operations/incidents/${r.id}`}
          emptyLabel="No incidents reported"
          emptyDescription="Log one from the console or field-log from the mobile shell at /m/incidents/new."
          emptyAction={
            <Button href="/console/operations/incidents/new" size="sm">
              Log incident
            </Button>
          }
          columns={[
            {
              key: "when",
              header: "When",
              render: (r) => fmt.dateTime(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <StatusChip tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</StatusChip>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.severity ?? null,
            },
            { key: "summary", header: "Summary", render: (r) => r.summary, accessor: (r) => r.summary },
            {
              key: "location",
              header: "Location",
              render: (r) => r.location ?? "—",
              className: "text-[var(--text-muted)]",
              accessor: (r) => r.location ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => r.status,
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
