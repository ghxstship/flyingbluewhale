import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.risk.eyebrow", undefined, "Programs")}
          title={t("console.risk.title", undefined, "Risk Scores")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.risk.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.risk.eyebrow", undefined, "Programs")}
        title={t("console.risk.title", undefined, "Risk Scores")}
        subtitle={`${rows.length} score${rows.length === 1 ? "" : "s"} across ${projectCount} project${projectCount === 1 ? "" : "s"} · ${criticalCount} critical · ${highCount} high`}
        action={
          <form action={runRiskBatch}>
            <button
              type="submit"
              className="ps-btn ps-btn--ghost ps-btn--sm"
            >
              {t("console.risk.runBatch", undefined, "Run risk batch")}
            </button>
          </form>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.risk.metric.critical", undefined, "Critical")}
            value={fmt.number(criticalCount)}
            accent
          />
          <MetricCard label={t("console.risk.metric.high", undefined, "High")} value={fmt.number(highCount)} />
          <MetricCard
            label={t("console.risk.metric.projectsScored", undefined, "Projects Scored")}
            value={fmt.number(projectCount)}
          />
        </div>
        <div className="text-[11px] text-[var(--p-text-2)]">
          {t(
            "console.risk.description",
            undefined,
            "Per-project, per-category predictive risk. The batch scorer populates rules_v1 from baseline-vs-actual variance, RFI age, daily-log gaps, incident rate, sub-prequal score. Drivers JSONB explains each red flag.",
          )}
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => (r.project ? `/studio/projects/${r.project.id}` : "#")}
          emptyLabel={t("console.risk.empty.label", undefined, "No risk scores yet")}
          emptyDescription={t(
            "console.risk.empty.description",
            undefined,
            "The risk batch (separate ticket) runs nightly. Schema, RLS, and dashboard are live.",
          )}
          columns={[
            {
              key: "project",
              header: t("console.risk.col.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "category",
              header: t("console.risk.col.category", undefined, "Category"),
              render: (r) => toTitle(r.category.replace(/_/g, " ")),
              accessor: (r) => r.category,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "score",
              header: t("console.risk.col.score", undefined, "Score"),
              render: (r) => Number(r.score).toFixed(1),
              accessor: (r) => Number(r.score),
              numeric: true,
            },
            {
              key: "trend_7d",
              header: t("console.risk.col.trend7d", undefined, "Δ 7d"),
              render: (r) => {
                if (r.trend_7d == null) return "—";
                const v = Number(r.trend_7d);
                return (
                  <span className={v > 0 ? "text-[var(--p-warning)]" : "text-[var(--p-success)]"}>
                    {v > 0 ? "+" : ""}
                    {v.toFixed(1)}
                  </span>
                );
              },
              accessor: (r) => r.trend_7d,
              numeric: true,
            },
            {
              key: "trend_30d",
              header: t("console.risk.col.trend30d", undefined, "Δ 30d"),
              render: (r) => {
                if (r.trend_30d == null) return "—";
                const v = Number(r.trend_30d);
                return (
                  <span className={v > 0 ? "text-[var(--p-warning)]" : "text-[var(--p-success)]"}>
                    {v > 0 ? "+" : ""}
                    {v.toFixed(1)}
                  </span>
                );
              },
              accessor: (r) => r.trend_30d,
              numeric: true,
            },
            {
              key: "severity",
              header: t("console.risk.col.severity", undefined, "Severity"),
              render: (r) => <Badge variant={SEV_TONE[r.severity]}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity,
              filterable: true,
              groupable: true,
            },
            {
              key: "scored_at",
              header: t("console.risk.col.scored", undefined, "Scored"),
              render: (r) => fmt.dateParts(r.scored_at, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.scored_at,
              mono: true,
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
