import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type EstimateState = "draft" | "in_review" | "submitted" | "won" | "lost" | "archived";

type Row = {
  id: string;
  name: string;
  estimate_state: EstimateState;
  default_markup_pct: number;
  subtotal_cost: number;
  total_with_markup: number;
  baseline_at: string | null;
  submitted_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<EstimateState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  submitted: "info",
  won: "success",
  lost: "error",
  archived: "muted",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.estimates.eyebrow", undefined, "Creative")}
          title={t("console.estimates.title", undefined, "Estimates")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.estimates.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("estimates")
    .select(
      "id, name, estimate_state, default_markup_pct, subtotal_cost, total_with_markup, baseline_at, submitted_at, created_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const wonCount = rows.filter((r) => r.estimate_state === "won").length;
  const inFlightCount = rows.filter((r) => ["draft", "in_review", "submitted"].includes(r.estimate_state)).length;
  const pipelineValue = rows
    .filter((r) => ["draft", "in_review", "submitted"].includes(r.estimate_state))
    .reduce((s, r) => s + Number(r.total_with_markup), 0);

  function fmtMoney(n: number): string {
    return fmt.money(Math.round(n * 100));
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.estimates.eyebrow", undefined, "Creative")}
        title={t("console.estimates.title", undefined, "Estimates")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.estimates.estimateSingular", undefined, "estimate") : t("console.estimates.estimatePlural", undefined, "estimates")} · ${inFlightCount} ${t("console.estimates.inFlightSuffix", undefined, "in flight")} · ${wonCount} ${t("console.estimates.wonSuffix", undefined, "won")}`}
        action={
          <Button href="/console/estimates/new" size="sm">
            {t("console.estimates.newEstimate", undefined, "+ New Estimate")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.estimates.inFlight", undefined, "In Flight")}
            value={fmt.number(inFlightCount)}
            accent
          />
          <MetricCard
            label={t("console.estimates.pipelineValue", undefined, "Pipeline Value")}
            value={fmtMoney(pipelineValue)}
          />
          <MetricCard label={t("console.estimates.won", undefined, "Won")} value={fmt.number(wonCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/estimates/${r.id}`}
          emptyLabel={t("console.estimates.emptyLabel", undefined, "No estimates yet")}
          emptyDescription={t(
            "console.estimates.emptyDescription",
            undefined,
            "Estimates join takeoff quantities to cost-database unit costs with markup. Export to budgets + proposal SOV.",
          )}
          emptyAction={
            <Button href="/console/estimates/new" size="sm">
              {t("console.estimates.newEstimate", undefined, "+ New Estimate")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.estimates.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "project",
              header: t("console.estimates.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "markup",
              header: t("console.estimates.columns.markup", undefined, "Markup"),
              render: (r) => `${(Number(r.default_markup_pct) * 100).toFixed(1)}%`,
              accessor: (r) => Number(r.default_markup_pct),
              className: "font-mono text-xs text-right",
            },
            {
              key: "subtotal",
              header: t("console.estimates.columns.subtotal", undefined, "Subtotal"),
              render: (r) => fmtMoney(Number(r.subtotal_cost)),
              accessor: (r) => Number(r.subtotal_cost),
              className: "font-mono text-xs text-right",
            },
            {
              key: "total",
              header: t("console.estimates.columns.total", undefined, "Total"),
              render: (r) => fmtMoney(Number(r.total_with_markup)),
              accessor: (r) => Number(r.total_with_markup),
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.estimates.columns.state", undefined, "State"),
              render: (r) => <Badge variant={STATE_TONE[r.estimate_state]}>{toTitle(r.estimate_state)}</Badge>,
              accessor: (r) => r.estimate_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
