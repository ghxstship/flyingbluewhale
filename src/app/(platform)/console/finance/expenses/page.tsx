import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Expense } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/** Narrow, uncapped aggregate source for the header total. */
async function expenseAmounts(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expenses").select("amount_cents").eq("org_id", orgId);
  if (error) throw error;
  return data ?? [];
}

const PAGE_SIZE = 100;

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
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
  const sp = await searchParams;
  // Header totals come from a narrow uncapped query + an exact count —
  // the table rows below are cursor-paginated (SC-2), but reducing over
  // a capped list silently truncated the totals once an org passed the
  // cap, so the aggregate stays on its own narrow query.
  const [page, amounts] = await Promise.all([
    listOrgScopedPage("expenses", session.orgId, {
      orderBy: "spent_at",
      pageSize: PAGE_SIZE,
      cursor: sp?.cursor ?? null,
    }),
    expenseAmounts(session.orgId),
  ]);
  const rows = page.rows;
  const count = page.totalCount;
  const offset = sp?.cursor ? Number(sp.cursor) : 0;
  const total = amounts.reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.expenses.eyebrow", undefined, "Finance")}
        title={t("console.finance.expenses.title", undefined, "Expenses")}
        subtitle={`${count} ${t("console.finance.expenses.entries", undefined, "Entries")}  · ${formatMoney(total)} ${t("console.finance.expenses.total", undefined, "Total")}`}
        action={
          <Button href="/console/finance/expenses/new">
            {t("console.finance.expenses.logExpense", undefined, "+ Log expense")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable<Expense>
          rows={rows}
          totalCount={count}
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
              // XPMS department prefer-over-legacy category. The
              // department enum drives the budgets.actual_cents rollup
              // via the expenses trigger; category is kept around as
              // the pre-XPMS fallback display.
              key: "department",
              header: t("console.finance.expenses.columns.department", undefined, "Department"),
              render: (r) => (r as unknown as { department?: string | null }).department ?? r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => (r as unknown as { department?: string | null }).department ?? r.category ?? null,
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
              key: "expense_state",
              header: t("console.finance.expenses.columns.expense_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.expense_state} />,
              accessor: (r) => r.expense_state,
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
        {(offset > 0 || page.nextCursor) && (
          <nav className="flex items-center justify-between text-xs">
            {offset > 0 ? (
              <Link
                href={
                  offset - PAGE_SIZE <= 0
                    ? "/console/finance/expenses"
                    : `/console/finance/expenses?cursor=${offset - PAGE_SIZE}`
                }
                className="text-[var(--brand-color)] hover:underline"
              >
                {t("console.finance.expenses.newer", undefined, "← Newer")}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {page.nextCursor ? (
              <Link
                href={`/console/finance/expenses?cursor=${page.nextCursor}`}
                className="text-[var(--brand-color)] hover:underline"
              >
                {t("console.finance.expenses.older", undefined, "Older →")}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
