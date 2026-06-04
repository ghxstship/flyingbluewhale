import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Budget } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.budgets.title", undefined, "Budgets")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.budgets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("budgets", session.orgId, { orderBy: "created_at" });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.budgets.title", undefined, "Budgets")}
        subtitle={t("console.finance.budgets.countSubtitle", { count: rows.length }, `${rows.length} Budgets`)}
        action={
          <Button href="/console/finance/budgets/new">
            {t("console.finance.budgets.newBudget", undefined, "+ New Budget")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Budget>
          rows={rows}
          rowHref={(r) => `/console/finance/budgets/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.finance.budgets.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "category",
              header: t("console.finance.budgets.col.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "spent",
              header: t("console.finance.budgets.col.spent", undefined, "Spent"),
              render: (r) => formatMoney(r.spent_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.spent_cents ?? 0),
            },
            {
              key: "amount",
              header: t("console.finance.budgets.col.budget", undefined, "Budget"),
              render: (r) => formatMoney(r.amount_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.amount_cents ?? 0),
            },
            {
              key: "util",
              header: t("console.finance.budgets.col.utilization", undefined, "Utilization"),
              render: (r) => {
                const pct = r.amount_cents > 0 ? (r.spent_cents / r.amount_cents) * 100 : 0;
                return <ProgressBar value={pct} showLabel />;
              },
              accessor: (r) => (Number(r.spent_cents ?? 0) / Math.max(1, Number(r.amount_cents ?? 1))) * 100,
            },
          ]}
        />
      </div>
    </>
  );
}
