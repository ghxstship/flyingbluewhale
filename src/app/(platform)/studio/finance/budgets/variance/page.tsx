import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string | null;
  item: string | null;
  department: string | null;
  project: { name: string | null } | null;
  amount_cents: number | null;
  committed_cents: number | null;
  actual_cents: number | null;
  spent_cents: number | null;
};

/**
 * Budget Variance (kit 20 Finance · Settle tab) — plan vs actual per
 * budget line, straight off the budgets store's own plan/committed/actual
 * columns. A filtered analytical lens over /studio/finance/budgets, not a
 * second store.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.budgetVariance.eyebrow", undefined, "Finance · Settle")}
          title={t("console.budgetVariance.title", undefined, "Variance")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.budgetVariance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("budgets")
    .select(
      "id, name, item, department, project:project_id(name), amount_cents, committed_cents, actual_cents, spent_cents",
    )
    .eq("org_id", session.orgId)
    .order("amount_cents", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];
  const actualOf = (r: Row) => r.actual_cents ?? r.spent_cents ?? 0;
  const varianceOf = (r: Row) => (r.amount_cents ?? 0) - actualOf(r);
  const plan = rows.reduce((n, r) => n + (r.amount_cents ?? 0), 0);
  const actual = rows.reduce((n, r) => n + actualOf(r), 0);
  const over = rows.filter((r) => varianceOf(r) < 0).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.budgetVariance.eyebrow", undefined, "Finance · Settle")}
        title={t("console.budgetVariance.title", undefined, "Variance")}
        subtitle={t(
          "console.budgetVariance.subtitle",
          undefined,
          "Plan vs actual per budget line, over-plan lines first.",
        )}
        action={
          <Button href="/studio/finance/budgets" size="sm" variant="secondary">
            {t("console.budgetVariance.openBudgets", undefined, "Open Budgets")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <MetricCard label={t("console.budgetVariance.metric.plan", undefined, "Planned")} value={fmt.money(plan)} />
          <MetricCard
            label={t("console.budgetVariance.metric.actual", undefined, "Actual")}
            value={fmt.money(actual)}
          />
          <MetricCard
            label={t("console.budgetVariance.metric.variance", undefined, "Variance")}
            value={fmt.money(plan - actual)}
            accent
          />
          <MetricCard
            label={t("console.budgetVariance.metric.over", undefined, "Lines Over Plan")}
            value={fmt.number(over)}
          />
        </div>
        <DataView<Row>
          rows={[...rows].sort((a, b) => varianceOf(a) - varianceOf(b))}
          rowHref={(r) => `/studio/finance/budgets/${r.id}`}
          emptyLabel={t("console.budgetVariance.emptyLabel", undefined, "No budget lines yet")}
          emptyDescription={t(
            "console.budgetVariance.emptyDescription",
            undefined,
            "Build a budget (or convert an estimate) and plan-vs-actual tracks here per line.",
          )}
          emptyAction={
            <Button href="/studio/finance/budgets/new" size="sm">
              {t("console.budgetVariance.newBudget", undefined, "+ New Budget")}
            </Button>
          }
          columns={[
            {
              key: "line",
              header: t("console.budgetVariance.column.line", undefined, "Budget Line"),
              render: (r) => r.name ?? r.item ?? "—",
              accessor: (r) => r.name ?? r.item ?? null,
            },
            {
              key: "project",
              header: t("console.budgetVariance.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "department",
              header: t("console.budgetVariance.column.department", undefined, "Department"),
              render: (r) => r.department ?? "—",
              accessor: (r) => r.department ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "plan",
              header: t("console.budgetVariance.column.plan", undefined, "Planned"),
              render: (r) => (r.amount_cents != null ? fmt.money(r.amount_cents) : "—"),
              mono: true,
              accessor: (r) => r.amount_cents,
            },
            {
              key: "committed",
              header: t("console.budgetVariance.column.committed", undefined, "Committed"),
              render: (r) => (r.committed_cents != null ? fmt.money(r.committed_cents) : "—"),
              mono: true,
              accessor: (r) => r.committed_cents,
            },
            {
              key: "actual",
              header: t("console.budgetVariance.column.actual", undefined, "Actual"),
              render: (r) => fmt.money(actualOf(r)),
              mono: true,
              accessor: (r) => actualOf(r),
            },
            {
              key: "variance",
              header: t("console.budgetVariance.column.variance", undefined, "Variance"),
              render: (r) => (
                <span className={varianceOf(r) < 0 ? "text-[var(--p-danger-text)]" : "text-[var(--p-success-text)]"}>
                  {fmt.money(varianceOf(r))}
                </span>
              ),
              mono: true,
              accessor: (r) => varianceOf(r),
            },
          ]}
        />
      </div>
    </>
  );
}
