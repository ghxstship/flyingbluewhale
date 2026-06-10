import { Suspense } from "react";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function FinanceHub() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.title", undefined, "Finance")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();

  const tiles = [
    { href: "/console/finance/invoices", label: t("console.finance.tiles.invoices", undefined, "Invoices") },
    { href: "/console/finance/expenses", label: t("console.finance.tiles.expenses", undefined, "Expenses") },
    { href: "/console/finance/budgets", label: t("console.finance.tiles.budgets", undefined, "Budgets") },
    { href: "/console/finance/time", label: t("console.finance.tiles.time", undefined, "Time") },
    { href: "/console/finance/mileage", label: t("console.finance.tiles.mileage", undefined, "Mileage") },
    { href: "/console/finance/payouts", label: t("console.finance.tiles.payouts", undefined, "Payouts") },
    { href: "/console/finance/entities", label: t("console.finance.tiles.entities", undefined, "Entities") },
    {
      href: "/console/finance/consolidation",
      label: t("console.finance.tiles.consolidation", undefined, "Consolidation"),
    },
    { href: "/console/finance/reports", label: t("console.finance.tiles.reports", undefined, "Reports") },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.hubTitle", undefined, "Finance Hub")}
        subtitle={t("console.finance.hubSubtitle", undefined, "AR, AP, budgets, and reporting at a glance")}
      />
      <div className="page-content space-y-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <FinanceMetrics orgId={session.orgId} />
        </Suspense>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">{t("common.openArrow", undefined, "Open →")}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Streaming island — both metric grids. The three queries land in one
 * boundary because the grids interleave values from all of them; the
 * header and the static nav tiles below paint without waiting.
 */
async function FinanceMetrics({ orgId }: { orgId: string }) {
  const [{ t }, invoices, expenses, budgets] = await Promise.all([
    getRequestT(),
    listOrgScoped("invoices", orgId),
    listOrgScoped("expenses", orgId),
    listOrgScoped("budgets", orgId),
  ]);
  const outstanding = invoices
    .filter((i) => ["sent", "overdue"].includes(i.invoice_state))
    .reduce((s, r) => s + r.amount_cents, 0);
  const paid = invoices.filter((i) => i.invoice_state === "paid").reduce((s, r) => s + r.amount_cents, 0);
  const spent = expenses.reduce((s, r) => s + r.amount_cents, 0);
  const budgetTotal = budgets.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      <div className="metric-grid">
        <MetricCard
          label={t("console.finance.metrics.outstanding", undefined, "Outstanding")}
          value={formatMoney(outstanding)}
          accent
        />
        <MetricCard label={t("console.finance.metrics.paid", undefined, "Paid")} value={formatMoney(paid)} />
        <MetricCard label={t("console.finance.metrics.expenses", undefined, "Expenses")} value={formatMoney(spent)} />
        <MetricCard
          label={t("console.finance.metrics.budgetTotal", undefined, "Budget Total")}
          value={formatMoney(budgetTotal)}
        />
      </div>
      <div className="metric-grid">
        <MetricCard label={t("console.finance.metrics.invoices", undefined, "Invoices")} value={invoices.length} />
        <MetricCard
          label={t("console.finance.metrics.expenseItems", undefined, "Expense Items")}
          value={expenses.length}
        />
        <MetricCard label={t("console.finance.metrics.budgets", undefined, "Budgets")} value={budgets.length} />
      </div>
    </>
  );
}

function MetricsSkeleton() {
  return (
    <>
      <div className="metric-grid" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ps-skel h-24" />
        ))}
      </div>
      <div className="metric-grid" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ps-skel h-24" />
        ))}
      </div>
    </>
  );
}
