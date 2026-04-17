import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import type { Expense } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  if (!hasSupabase) return <><ModuleHeader title="Expenses" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("expenses", session.orgId, { orderBy: "spent_at" });
  const total = rows.reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Expenses"
        subtitle={`${rows.length} entries · ${formatMoney(total)} total`}
        action={<Button href="/console/finance/expenses/new">+ Log expense</Button>}
      />
      <div className="page-content">
        <DataTable<Expense>
          rows={rows}
          columns={[
            { key: "description", header: "Description", render: (r) => r.description },
            { key: "category", header: "Category", render: (r) => r.category ?? "—", className: "font-mono text-xs" },
            { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents, r.currency), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "date", header: "Date", render: (r) => r.spent_at, className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
