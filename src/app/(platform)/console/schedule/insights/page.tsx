import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function fmtCurrency(cents: number | null) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function fmtMinutes(m: number | null) {
  if (!m) return "—";
  const h = Math.floor(m / 60),
    mm = m % 60;
  return `${h}h ${mm}m`;
}

type ProjectRow = {
  id: string;
  name: string;
  budget_cents: number | null;
  labour_cost_cents: number;
  labour_hours: number;
  labour_pct: number | null;
};

export default async function ScheduleInsightsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Schedule" title="Labor Insights" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // Pull time entries with project info to compute labour cost + hours.
  const { data: entries } = await supabase
    .from("time_entries")
    .select("project_id, duration_minutes, hourly_rate_cents, billable")
    .eq("org_id", session.orgId)
    .not("project_id", "is", null);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, budget_cents")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  // Aggregate labour cost + hours per project.
  const byProject = new Map<string, { costCents: number; minutes: number }>();
  for (const e of entries ?? []) {
    if (!e.project_id) continue;
    const cur = byProject.get(e.project_id) ?? { costCents: 0, minutes: 0 };
    const mins = e.duration_minutes ?? 0;
    const rateCents = e.hourly_rate_cents ?? 0;
    cur.costCents += Math.round((mins / 60) * rateCents);
    cur.minutes += mins;
    byProject.set(e.project_id, cur);
  }

  type RawProject = { id: string; name: string | null; budget_cents: number | null };
  const rows: ProjectRow[] = (projects ?? [] as RawProject[]).map((p: RawProject) => {
    const agg = byProject.get(p.id) ?? { costCents: 0, minutes: 0 };
    const budget = p.budget_cents as number | null;
    const pct = budget && budget > 0 ? Math.round((agg.costCents / budget) * 100) : null;
    return {
      id: p.id,
      name: p.name ?? "Untitled",
      budget_cents: budget,
      labour_cost_cents: agg.costCents,
      labour_hours: agg.minutes,
      labour_pct: pct,
    };
  });

  const totalLabourCents = rows.reduce((s, r) => s + r.labour_cost_cents, 0);
  const totalBudgetCents = rows.reduce((s, r) => s + (r.budget_cents ?? 0), 0);
  const totalMinutes = rows.reduce((s, r) => s + r.labour_hours, 0);
  const overBudget = rows.filter((r) => r.labour_pct !== null && r.labour_pct > 100).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Schedule"
        title="Labor Insights"
        subtitle="Projected labor cost vs. budget across all active projects"
        action={
          <Button
            href="/api/v1/exports/timesheet-audit"
            variant="secondary"
          >
            Export Audit CSV
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <MetricCard label="Total Labor Cost" value={fmtCurrency(totalLabourCents)} />
          <MetricCard label="Total Hours Logged" value={fmtMinutes(totalMinutes)} />
          <MetricCard
            label="Labor % of Total Budget"
            value={totalBudgetCents > 0 ? `${Math.round((totalLabourCents / totalBudgetCents) * 100)}%` : "—"}
          />
          <MetricCard label="Projects Over Budget" value={String(overBudget)} />
        </div>

        <DataTable<ProjectRow>
          rows={rows}
          rowHref={(r) => `/console/projects/${r.id}`}
          emptyLabel="No project labor data"
          emptyDescription="Log time entries against projects to see labor cost vs. budget."
          columns={[
            { key: "name", header: "Project", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "labour_cost",
              header: "Labor Cost",
              render: (r) => fmtCurrency(r.labour_cost_cents),
              accessor: (r) => r.labour_cost_cents,
            },
            {
              key: "budget",
              header: "Budget",
              render: (r) => fmtCurrency(r.budget_cents),
              accessor: (r) => r.budget_cents,
            },
            {
              key: "labor_pct",
              header: "Labor %",
              render: (r) => {
                if (r.labour_pct === null) return "—";
                const over = r.labour_pct > 100;
                return (
                  <span className={over ? "font-semibold text-[var(--color-error)]" : ""}>
                    {r.labour_pct}%{over ? " ⚠" : ""}
                  </span>
                );
              },
              accessor: (r) => r.labour_pct,
            },
            {
              key: "hours",
              header: "Hours",
              render: (r) => fmtMinutes(r.labour_hours),
              accessor: (r) => r.labour_hours,
            },
          ]}
        />
      </div>
    </>
  );
}
