import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Expense } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Expenses" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("expenses", session.orgId, { orderBy: "spent_at" });
  const total = rows.reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Expenses"
        subtitle={`${rows.length} Entries  · ${formatMoney(total)} Total`}
        action={<Button href="/console/finance/expenses/new">+ Log expense</Button>}
      />
      <div className="page-content">
        <DataTable<Expense>
          rows={rows}
          rowHref={(r) => `/console/finance/expenses/${r.id}`}
          emptyLabel="No expenses logged"
          emptyDescription="Track receipts and reimbursements; submitted entries route through approver review."
          emptyAction={
            <Button href="/console/finance/expenses/new" size="sm">
              + Log expense
            </Button>
          }
          columns={[
            { key: "description", header: "Description", render: (r) => r.description, accessor: (r) => r.description },
            {
              key: "category",
              header: "Category",
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount",
              header: "Amount",
              render: (r) => formatMoney(r.amount_cents, r.currency),
              className: "font-mono text-xs",
              accessor: (r) => r.amount_cents ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "date",
              header: "Date",
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
