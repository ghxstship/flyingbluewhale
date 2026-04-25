import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Budget } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Budgets" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("budgets", session.orgId, { orderBy: "created_at" });
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Budgets" subtitle={`${rows.length} budgets`} action={<Button href="/console/finance/budgets/new">+ New budget</Button>} />
      <div className="page-content">
        <DataTable<Budget>
          rows={rows}
          rowHref={(r) => `/console/finance/budgets/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "category", header: "Category", render: (r) => r.category ?? "—", className: "font-mono text-xs" },
            { key: "spent", header: "Spent", render: (r) => formatMoney(r.spent_cents), className: "font-mono text-xs" },
            { key: "amount", header: "Budget", render: (r) => formatMoney(r.amount_cents), className: "font-mono text-xs" },
            { key: "util", header: "Utilization", render: (r) => {
              const pct = r.amount_cents > 0 ? (r.spent_cents / r.amount_cents) * 100 : 0;
              return <ProgressBar value={pct} showLabel />;
            } },
          ]}
        />
      </div>
    </>
  );
}
