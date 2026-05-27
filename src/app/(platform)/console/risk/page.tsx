import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { runRiskBatch } from "./actions";

export const dynamic = "force-dynamic";

type Category = "schedule" | "cost" | "safety" | "sub_default" | "quality" | "cash_flow" | "overall";
type Severity = "low" | "moderate" | "high" | "critical";

type Row = {
  id: string;
  scored_at: string;
  category: Category;
  score: number;
  severity: Severity;
  trend_7d: number | null;
  trend_30d: number | null;
  recommended_action: string | null;
  project: { id: string; name: string | null } | null;
};

const SEV_TONE: Record<Severity, "muted" | "info" | "warning" | "error"> = {
  low: "muted",
  moderate: "info",
  high: "warning",
  critical: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Programs" title="Risk Scores" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // Latest score per (project, category). The unique constraint on
  // (project_id, category, scored_at) means selecting + sorting + grouping
  // client-side is fine for the dashboard scale.
  const { data } = await supabase
    .from("risk_scores")
    .select(
      "id, scored_at, category, score, severity, trend_7d, trend_30d, recommended_action, project:project_id(id, name)",
    )
    .eq("org_id", session.orgId)
    .order("scored_at", { ascending: false })
    .limit(1000);

  // Reduce to latest-per-(project, category).
  const latest = new Map<string, Row>();
  for (const r of (data ?? []) as unknown as Row[]) {
    const key = `${r.project?.id ?? "_"}::${r.category}`;
    if (!latest.has(key)) latest.set(key, r);
  }
  const rows = Array.from(latest.values()).sort((a, b) =>
    a.severity === b.severity ? Number(b.score) - Number(a.score) : compareSev(b.severity, a.severity),
  );

  const criticalCount = rows.filter((r) => r.severity === "critical").length;
  const highCount = rows.filter((r) => r.severity === "high").length;
  const projectCount = new Set(rows.map((r) => r.project?.id).filter(Boolean)).size;

  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Risk Scores"
        subtitle={`${rows.length} score${rows.length === 1 ? "" : "s"} across ${projectCount} project${projectCount === 1 ? "" : "s"} · ${criticalCount} critical · ${highCount} high`}
        action={
          <form action={runRiskBatch}>
            <button
              type="submit"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Run risk batch
            </button>
          </form>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Critical" value={fmt.number(criticalCount)} accent />
          <MetricCard label="High" value={fmt.number(highCount)} />
          <MetricCard label="Projects Scored" value={fmt.number(projectCount)} />
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Per-project, per-category predictive risk. The batch scorer populates rules_v1 from baseline-vs-actual
          variance, RFI age, daily-log gaps, incident rate, sub-prequal score. Drivers JSONB explains each red flag.
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => (r.project ? `/console/projects/${r.project.id}` : "#")}
          emptyLabel="No risk scores yet"
          emptyDescription="The risk batch (separate ticket) runs nightly. Schema, RLS, and dashboard are live."
          columns={[
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "category",
              header: "Category",
              render: (r) => toTitle(r.category.replace(/_/g, " ")),
              accessor: (r) => r.category,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "score",
              header: "Score",
              render: (r) => Number(r.score).toFixed(1),
              accessor: (r) => Number(r.score),
              className: "font-mono text-xs text-right",
            },
            {
              key: "trend_7d",
              header: "Δ 7d",
              render: (r) => {
                if (r.trend_7d == null) return "—";
                const v = Number(r.trend_7d);
                return (
                  <span className={v > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}>
                    {v > 0 ? "+" : ""}
                    {v.toFixed(1)}
                  </span>
                );
              },
              accessor: (r) => r.trend_7d,
              className: "font-mono text-xs text-right",
            },
            {
              key: "trend_30d",
              header: "Δ 30d",
              render: (r) => {
                if (r.trend_30d == null) return "—";
                const v = Number(r.trend_30d);
                return (
                  <span className={v > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}>
                    {v > 0 ? "+" : ""}
                    {v.toFixed(1)}
                  </span>
                );
              },
              accessor: (r) => r.trend_30d,
              className: "font-mono text-xs text-right",
            },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <Badge variant={SEV_TONE[r.severity]}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity,
              filterable: true,
              groupable: true,
            },
            {
              key: "scored_at",
              header: "Scored",
              render: (r) => fmt.dateParts(r.scored_at, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.scored_at,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}

function compareSev(a: Severity, b: Severity): number {
  const order = { low: 0, moderate: 1, high: 2, critical: 3 } as const;
  return order[a] - order[b];
}
