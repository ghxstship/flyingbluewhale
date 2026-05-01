import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  summary: string;
  description: string | null;
  severity: string;
  status: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  open: "warning",
  triage: "info",
  in_progress: "info",
  resolved: "success",
  closed: "muted",
};

const CASE_PATTERN = /(protest|appeal|jury|disqualif|disq\b|hearing|case\b|grievance|disciplinary|sanction|doping)/i;

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
        <ModuleHeader eyebrow="Programs" title="Cases" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

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
    (r) => CASE_PATTERN.test(r.summary) || (r.description ? CASE_PATTERN.test(r.description) : false),
  );
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Cases"
        subtitle={`${rows.length} case${rows.length === 1 ? "" : "s"} (90d) · ${open} open · protests, appeals, juries`}
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            + Open case
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<IncidentRow>
          rows={rows}
          rowHref={(r) => `/console/operations/incidents/${r.id}`}
          emptyLabel="No cases logged"
          emptyDescription="Cases are incidents with terms like 'protest', 'appeal', 'jury' in the summary. Open one via Operations → Incidents."
          columns={[
            { key: "summary", header: "Case", render: (r) => r.summary, accessor: (r) => r.summary },
            {
              key: "occurred",
              header: "Filed",
              render: (r) => fmt(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <Badge variant="muted">{r.severity}</Badge>,
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
      </div>
    </>
  );
}
