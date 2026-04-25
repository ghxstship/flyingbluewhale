import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function FinanceHub() {
  if (!hasSupabase) return <><ModuleHeader title="Finance" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const [invoices, expenses, budgets] = await Promise.all([
    listOrgScoped("invoices", session.orgId),
    listOrgScoped("expenses", session.orgId),
    listOrgScoped("budgets", session.orgId),
  ]);
  const outstanding = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, r) => s + r.amount_cents, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, r) => s + r.amount_cents, 0);
  const spent = expenses.reduce((s, r) => s + r.amount_cents, 0);
  const budgetTotal = budgets.reduce((s, r) => s + r.amount_cents, 0);

  const tiles = [
    { href: "/console/finance/invoices", label: "Invoices" },
    { href: "/console/finance/expenses", label: "Expenses" },
    { href: "/console/finance/budgets", label: "Budgets" },
    { href: "/console/finance/time", label: "Time" },
    { href: "/console/finance/mileage", label: "Mileage" },
    { href: "/console/finance/payouts", label: "Payouts" },
    { href: "/console/finance/reports", label: "Reports" },
  ];

  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Finance hub" subtitle="AR, AP, budgets, and reporting at a glance" />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label="Outstanding" value={formatMoney(outstanding)} accent />
          <MetricCard label="Paid" value={formatMoney(paid)} />
          <MetricCard label="Expenses" value={formatMoney(spent)} />
          <MetricCard label="Budget total" value={formatMoney(budgetTotal)} />
        </div>
        <div className="metric-grid">
          <MetricCard label="Invoices" value={invoices.length} />
          <MetricCard label="Expense items" value={expenses.length} />
          <MetricCard label="Budgets" value={budgets.length} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">Open →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
