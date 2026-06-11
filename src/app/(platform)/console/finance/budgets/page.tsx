import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { countOrgScoped, listOrgScoped } from "@/lib/db/resource";
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
  // Exact count for the header — rows below stay on the capped default,
  // but rows.length under-reported the total past 100 budgets.
  const [rows, count] = await Promise.all([
    listOrgScoped("budgets", session.orgId, { orderBy: "created_at" }),
    countOrgScoped("budgets", session.orgId),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.budgets.title", undefined, "Budgets")}
        subtitle={t("console.finance.budgets.countSubtitle", { count }, `${count} Budgets`)}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/finance/budgets/import" variant="secondary">
              {t("console.finance.budgets.importAction", undefined, "Import")}
            </Button>
            <Button href="/console/finance/budgets/summary" variant="secondary">
              {t("console.finance.budgets.summaryAction", undefined, "Summary")}
            </Button>
            <Button href="/console/finance/budgets/new">
              {t("console.finance.budgets.newBudget", undefined, "+ New Budget")}
            </Button>
          </div>
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
              // XPMS department (typed enum) is the canonical taxonomy
              // column. Fall back to the legacy free-text `category`
              // for rows that haven't been migrated yet.
              key: "department",
              header: t("console.finance.budgets.col.department", undefined, "Department"),
              render: (r) => (r as unknown as { department?: string | null }).department ?? r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => (r as unknown as { department?: string | null }).department ?? r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              // Reads actual_cents (XPMS) with spent_cents as the
              // pre-XPMS fallback. Migration 0073's trigger keeps them
              // in sync but the coalesce is defensive for rows that
              // landed before that trigger fired.
              key: "actual",
              header: t("console.finance.budgets.col.actual", undefined, "Actual"),
              render: (r) => {
                const v = (r as unknown as { actual_cents?: number | null }).actual_cents ?? r.spent_cents;
                return formatMoney(v);
              },
              className: "font-mono text-xs",
              accessor: (r) =>
                Number((r as unknown as { actual_cents?: number | null }).actual_cents ?? r.spent_cents ?? 0),
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
                const actual = (r as unknown as { actual_cents?: number | null }).actual_cents ?? r.spent_cents ?? 0;
                const pct = r.amount_cents > 0 ? (Number(actual) / r.amount_cents) * 100 : 0;
                return <ProgressBar value={pct} showLabel />;
              },
              accessor: (r) => {
                const actual = Number(
                  (r as unknown as { actual_cents?: number | null }).actual_cents ?? r.spent_cents ?? 0,
                );
                return (actual / Math.max(1, Number(r.amount_cents ?? 1))) * 100;
              },
            },
          ]}
        />
      </div>
    </>
  );
}
