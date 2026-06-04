import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Expense } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.expenses.title", undefined, "Expenses")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.expenses.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("expenses", session.orgId, { orderBy: "spent_at" });
  const total = rows.reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.expenses.eyebrow", undefined, "Finance")}
        title={t("console.finance.expenses.title", undefined, "Expenses")}
        subtitle={`${rows.length} ${t("console.finance.expenses.entries", undefined, "Entries")}  · ${formatMoney(total)} ${t("console.finance.expenses.total", undefined, "Total")}`}
        action={
          <Button href="/console/finance/expenses/new">
            {t("console.finance.expenses.logExpense", undefined, "+ Log expense")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Expense>
          rows={rows}
          rowHref={(r) => `/console/finance/expenses/${r.id}`}
          emptyLabel={t("console.finance.expenses.emptyLabel", undefined, "No expenses logged")}
          emptyDescription={t(
            "console.finance.expenses.emptyDescription",
            undefined,
            "Track receipts and reimbursements; submitted entries route through approver review.",
          )}
          emptyAction={
            <Button href="/console/finance/expenses/new" size="sm">
              {t("console.finance.expenses.logExpense", undefined, "+ Log expense")}
            </Button>
          }
          columns={[
            {
              key: "description",
              header: t("console.finance.expenses.columns.description", undefined, "Description"),
              render: (r) => r.description,
              accessor: (r) => r.description,
            },
            {
              key: "category",
              header: t("console.finance.expenses.columns.category", undefined, "Category"),
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount",
              header: t("console.finance.expenses.columns.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents, r.currency),
              className: "font-mono text-xs",
              accessor: (r) => r.amount_cents ?? null,
            },
            {
              key: "status",
              header: t("console.finance.expenses.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "date",
              header: t("console.finance.expenses.columns.date", undefined, "Date"),
              render: (r) => r.spent_at,
              className: "font-mono text-xs",
              accessor: (r) => r.spent_at,
            },
          ]}
        />
      </div>
    </>
  );
}
