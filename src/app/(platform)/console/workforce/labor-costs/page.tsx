import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type TimeEntry = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  hours: number;
  date: string;
  description: string | null;
  hourly_rate_cents: number | null;
};

type ProjectMeta = { id: string; name: string };

type Row = {
  user_id: string;
  project_id: string | null;
  project_name: string;
  total_hours: number;
  total_cost_cents: number | null;
  entry_count: number;
};

export default async function LaborCostsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Labor Costs" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // 90-day rolling window — keeps the table fast without requiring a
  // dedicated materialized view.
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceISO = since.toISOString().split("T")[0];

  const [entriesResp, projectsResp] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, user_id, project_id, hours, date, description, hourly_rate_cents")
      .eq("org_id", session.orgId)
      .gte("date", sinceISO)
      .limit(5000),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .limit(500),
  ]);

  const entries = (entriesResp.data ?? []) as TimeEntry[];
  const projectIndex = new Map(
    ((projectsResp.data ?? []) as ProjectMeta[]).map((p) => [p.id, p.name]),
  );

  // Aggregate by (user_id, project_id)
  const agg = new Map<string, Row>();
  for (const e of entries) {
    const key = `${e.user_id ?? "anon"}::${e.project_id ?? "none"}`;
    const existing = agg.get(key);
    const cost = e.hourly_rate_cents != null ? e.hours * e.hourly_rate_cents : null;
    if (existing) {
      existing.total_hours += e.hours;
      if (cost != null && existing.total_cost_cents != null) existing.total_cost_cents += cost;
      else if (cost != null) existing.total_cost_cents = cost;
      existing.entry_count += 1;
    } else {
      agg.set(key, {
        user_id: e.user_id ?? "—",
        project_id: e.project_id,
        project_name: e.project_id ? (projectIndex.get(e.project_id) ?? "Unknown") : "Unassigned",
        total_hours: e.hours,
        total_cost_cents: cost,
        entry_count: 1,
      });
    }
  }
  const rows = [...agg.values()].sort((a, b) => b.total_hours - a.total_hours);

  const totalHours = rows.reduce((s, r) => s + r.total_hours, 0);
  const totalCostCents = rows.reduce((s, r) => s + (r.total_cost_cents ?? 0), 0);
  const uniquePeople = new Set(rows.map((r) => r.user_id)).size;

  const fmtHours = (h: number) => `${Math.round(h * 10) / 10}h`;

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Labor Costs"
        subtitle="Rolling 90-day view · hours + estimated cost per person per project"
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total Hours (90d)" value={fmtHours(totalHours)} accent />
          <MetricCard label="People" value={String(uniquePeople)} />
          <MetricCard
            label="Est. Labor Cost (90d)"
            value={
              totalCostCents > 0
                ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
                    totalCostCents / 100,
                  )
                : "Rate data missing"
            }
          />
        </div>

        <div className="surface-inset rounded-lg p-4 text-xs text-[var(--text-muted)]">
          Labor cost requires an <code className="font-mono">hourly_rate_cents</code> on time entries.
          Rows without a rate show hours only. Set rates via{" "}
          <a href="/console/finance/time" className="text-[var(--brand)] hover:underline">
            Finance → Time
          </a>
          .
        </div>

        <DataTable<Row>
          rows={rows}
          emptyLabel="No time entries in the last 90 days"
          emptyDescription="Once crew log time, their hours appear here grouped by person and project."
          columns={[
            {
              key: "person",
              header: "Person",
              render: (r) => <span className="font-mono text-xs">{r.user_id.slice(0, 8)}</span>,
              accessor: (r) => r.user_id,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project_name,
              accessor: (r) => r.project_name,
              filterable: true,
              groupable: true,
            },
            {
              key: "hours",
              header: "Hours",
              render: (r) => (
                <span className="font-mono text-xs">{fmtHours(r.total_hours)}</span>
              ),
              accessor: (r) => r.total_hours,
              className: "text-right",
            },
            {
              key: "cost",
              header: "Est. Cost",
              render: (r) =>
                r.total_cost_cents != null ? (
                  <span className="font-mono text-xs">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(r.total_cost_cents / 100)}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)] text-xs">—</span>
                ),
              accessor: (r) => r.total_cost_cents ?? 0,
              className: "text-right",
            },
            {
              key: "entries",
              header: "Entries",
              render: (r) => <span className="font-mono text-xs">{fmt.number(r.entry_count)}</span>,
              accessor: (r) => r.entry_count,
              className: "text-right font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
