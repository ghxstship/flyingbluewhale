import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { computeEstimateTotals } from "@/lib/db/estimates";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

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

  const stored = (data ?? []) as unknown as Row[];

  // HP-14: the stored header totals have no maintaining writer — derive the
  // displayed money from live estimate_lines (stored header only stands in
  // when an estimate has no lines).
  const totals = await computeEstimateTotals(supabase, session.orgId, stored);
  const rows = stored.map((r) => ({
    ...r,
    subtotal_cost: totals.get(r.id)?.subtotalCost ?? Number(r.subtotal_cost),
    total_with_markup: totals.get(r.id)?.totalWithMarkup ?? Number(r.total_with_markup),
  }));

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
          <Button href="/studio/estimates/new" size="sm">
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
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/estimates/${r.id}`}
          emptyLabel={t("console.estimates.emptyLabel", undefined, "No estimates yet")}
          emptyDescription={t(
            "console.estimates.emptyDescription",
            undefined,
            "Estimates join takeoff quantities to cost-database unit costs with markup. Export to budgets + proposal SOV.",
          )}
          emptyAction={
            <Button href="/studio/estimates/new" size="sm">
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
              numeric: true,
            },
            {
              key: "subtotal",
              header: t("console.estimates.columns.subtotal", undefined, "Subtotal"),
              render: (r) => fmtMoney(Number(r.subtotal_cost)),
              accessor: (r) => Number(r.subtotal_cost),
              numeric: true,
            },
            {
              key: "total",
              header: t("console.estimates.columns.total", undefined, "Total"),
              render: (r) => fmtMoney(Number(r.total_with_markup)),
              accessor: (r) => Number(r.total_with_markup),
              numeric: true,
            },
            {
              key: "state",
              header: t("console.estimates.columns.state", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.estimate_state)}>{toTitle(r.estimate_state)}</Badge>,
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
