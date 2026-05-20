import Link from "next/link";
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
  location: string | null;
  summary: string;
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

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Incidents" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const fmt = (iso: string) => fmtIntl.dateTime(iso);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: incidents }, { count: medCount }, { count: cyberCount }] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, occurred_at, location, summary, severity, status")
      .eq("org_id", session.orgId)
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase
      .from("medical_encounters")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("created_at", since),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .gte("occurred_at", since)
      .ilike("summary", "%cyber%"),
  ]);

  const rows = (incidents ?? []) as IncidentRow[];
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const critical = rows.filter((r) => r.severity === "critical").length;
  const totalThirtyDay = rows.length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Incidents (unified)"
        subtitle="Cross-domain feed: ops · cyber · medical · safety. Last 30 days."
        action={
          <Button href="/console/operations/incidents/new" size="sm">
            + Report incident
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total · 30d" value={fmtIntl.number(totalThirtyDay)} accent />
          <MetricCard label="Open" value={fmtIntl.number(open)} />
          <MetricCard label="Critical" value={fmtIntl.number(critical)} />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Drill Into a Domain</h3>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <li>
              <Link href="/console/operations/incidents" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">Operations log</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{totalThirtyDay} ops + safety incidents</div>
              </Link>
            </li>
            <li>
              <Link href="/console/safety/cyber-ir" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">Cyber IR</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{cyberCount ?? 0} incidents flagged cyber</div>
              </Link>
            </li>
            <li>
              <Link href="/console/safety/medical/encounters" className="surface hover-lift block p-3">
                <div className="text-sm font-medium">Medical encounters</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{medCount ?? 0} encounters · 30 days</div>
              </Link>
            </li>
          </ul>
        </section>

        <DataTable<IncidentRow>
          rows={rows}
          rowHref={(r) => `/console/operations/incidents/${r.id}`}
          emptyLabel="No incidents in the last 30 days"
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
              key: "location",
              header: "Location",
              render: (r) => r.location ?? "—",
              accessor: (r) => r.location ?? null,
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
      </div>
    </>
  );
}
