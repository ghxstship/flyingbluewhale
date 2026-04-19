import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Reports" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const [invoices, expenses] = await Promise.all([
    listOrgScoped("invoices", session.orgId),
    listOrgScoped("expenses", session.orgId),
  ]);
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, r) => s + r.amount_cents, 0);
  const costs = expenses.reduce((s, r) => s + r.amount_cents, 0);
  const gross = revenue - costs;
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Reports" subtitle="Live P&L snapshot from current books" />
      <div className="page-content space-y-4">
        <div className="metric-grid-3">
          <MetricCard label="Revenue (paid)" value={formatMoney(revenue)} accent />
          <MetricCard label="Expenses" value={formatMoney(costs)} />
          <MetricCard label="Gross margin" value={formatMoney(gross)} delta={{ value: `${revenue > 0 ? Math.round((gross / revenue) * 100) : 0}%`, positive: gross >= 0 }} />
        </div>
        <div className="surface p-6 text-sm text-[var(--text-muted)]">
          Per-project profitability, cash flow statements, and exportable PDFs land in the next release.
        </div>
      </div>
    </>
  );
}
