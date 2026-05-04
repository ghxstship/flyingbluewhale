import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  summary: string;
  description: string | null;
  severity: string;
  status: string;
};

const SEVERITY_TONE: Record<string, "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
  critical: "error",
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  open: "warning",
  triage: "info",
  in_progress: "info",
  resolved: "success",
  closed: "muted",
};

const CYBER_PATTERN = /(cyber|breach|phish|ransom|malware|ddos|intrusion|credential|access\b|c2\b)/i;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Cyber Incident Response" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("incidents")
    .select("id, occurred_at, summary, description, severity, status")
    .eq("org_id", session.orgId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(500);

  const all = (data ?? []) as IncidentRow[];
  const rows = all.filter(
    (r) => CYBER_PATTERN.test(r.summary) || (r.description ? CYBER_PATTERN.test(r.description) : false),
  );
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const containment = rows.filter((r) => r.status === "in_progress").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Cyber Incident Response"
        subtitle={`${rows.length} cyber incident${rows.length === 1 ? "" : "s"} in the last 90 days`}
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            + Report incident
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmtIntl.number(open)} accent />
          <MetricCard label="In Containment" value={fmtIntl.number(containment)} />
          <MetricCard label="Closed · 90d" value={fmtIntl.number(rows.length - open)} />
        </div>

        <DataTable<IncidentRow>
          rows={rows}
          rowHref={(r) => `/console/operations/incidents/${r.id}`}
          emptyLabel="No cyber incidents flagged"
          emptyDescription="Cyber IR is a sub-type of incidents. Tag a report with terms like 'breach', 'phish', or 'cyber' in the summary and it appears here."
          columns={[
            { key: "summary", header: "Summary", render: (r) => r.summary, accessor: (r) => r.summary },
            {
              key: "occurred",
              header: "Occurred",
              render: (r) => fmt(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity] ?? "muted"}>{r.severity}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status.replace ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Lifecycle: detect → contain → eradicate → recover → lessons. Open the source incident to update its phase.
        </p>
      </div>
    </>
  );
}
