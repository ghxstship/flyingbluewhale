import { Suspense } from "react";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
// recharts (~100KB gzipped) stays out of the initial bundle via the
// ReportsChartsClient wrapper, which holds the next/dynamic({ssr:false})
// call. Next 16 disallows that option in server components, so the
// wrapper carries it instead.
import { ReportsChartsClient as ReportsCharts } from "./ReportsChartsClient";
import type { Invoice, Expense } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Finance reports dashboard. Aggregates invoices + expenses on the
 * server (RLS handles the org scope), then hands a small JSON payload
 * to the client component that draws the charts. Splitting it this way
 * keeps recharts out of the server bundle.
 */
export default async function ReportsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.finance.reports.title", undefined, "Reports")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.reports.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.reports.eyebrow", undefined, "Finance")}
        title={t("console.finance.reports.title", undefined, "Reports")}
        subtitle={t("console.finance.reports.subtitle", undefined, "Live P&L from current books")}
      />
      <div className="page-content space-y-5">
        <Suspense fallback={<ReportsSkeleton />}>
          <ReportsBody orgId={session.orgId} />
        </Suspense>
      </div>
    </>
  );
}

/**
 * Streaming island — the entire report body. Invoices + expenses jointly
 * feed the metric row, the charts, and the AR-aging table (monthlySeries
 * consumes both), so the two queries stay in a single boundary; only the
 * header chrome paints ahead of them.
 */
async function ReportsBody({ orgId }: { orgId: string }) {
  const [{ t }, invoices, expenses] = await Promise.all([
    getRequestT(),
    listOrgScoped("invoices", orgId),
    listOrgScoped("expenses", orgId),
  ]);
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, r) => s + r.amount_cents, 0);
  const costs = expenses.reduce((s, r) => s + r.amount_cents, 0);
  const gross = revenue - costs;
  const marginPct = revenue > 0 ? Math.round((gross / revenue) * 100) : 0;

  const series = monthlySeries(invoices, expenses);
  const aging = arAging(invoices);
  const expenseCategories = topCategories(expenses, 6);
  const sparklineRevenue = series.map((p) => p.revenue);

  return (
    <>
      <div className="metric-grid-3">
        <MetricCard
          label={t("console.finance.reports.metrics.revenuePaid", undefined, "Revenue — Paid")}
          value={formatMoney(revenue)}
          sparkline={sparklineRevenue}
          accent
        />
        <MetricCard
          label={t("console.finance.reports.metrics.expenses", undefined, "Expenses")}
          value={formatMoney(costs)}
        />
        <MetricCard
          label={t("console.finance.reports.metrics.grossMargin", undefined, "Gross Margin")}
          value={formatMoney(gross)}
          delta={{ value: `${marginPct}%`, positive: gross >= 0 }}
        />
      </div>

      <ReportsCharts monthly={series} aging={aging} categories={expenseCategories} />

      <section className="overflow-x-auto">
        <header className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-2.5">
          <h3 className="text-sm font-semibold">{t("console.finance.reports.arAging.title", undefined, "AR aging")}</h3>
          <span className="text-xs text-[var(--p-text-2)]">
            {t("console.finance.reports.arAging.subtitle", undefined, "Outstanding invoices by days overdue")}
          </span>
        </header>
        <table className="ps-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("console.finance.reports.arAging.col.bucket", undefined, "Bucket")}</th>
              <th>{t("console.finance.reports.arAging.col.invoices", undefined, "Invoices")}</th>
              <th>{t("console.finance.reports.arAging.col.total", undefined, "Total")}</th>
            </tr>
          </thead>
          <tbody>
            {aging.map((b) => (
              <tr key={b.bucket}>
                <td>
                  <Badge
                    variant={
                      b.bucket === "Current"
                        ? "success"
                        : b.bucket === "1–30"
                          ? "info"
                          : b.bucket === "31–60"
                            ? "warning"
                            : "error"
                    }
                  >
                    {t(`console.finance.reports.arAging.bucket.${b.bucket}`, undefined, b.bucket)}
                  </Badge>
                </td>
                <td className="font-mono text-xs">{b.count}</td>
                <td className="font-mono text-xs">{formatMoney(b.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="metric-grid-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ps-skel h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ps-skel h-64" />
        <div className="ps-skel h-64" />
      </div>
      <div className="surface overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0">
            <div className="ps-skel h-4 w-24" />
            <div className="ps-skel h-4 w-16" />
            <div className="ps-skel h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── aggregation helpers ──────────────────────────────────────────────────

type MonthPoint = { month: string; revenue: number; expenses: number; margin: number };

function monthlySeries(invoices: Invoice[], expenses: Expense[]): MonthPoint[] {
  const buckets = new Map<string, { revenue: number; expenses: number }>();
  // Last 12 months including current.
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, { revenue: 0, expenses: 0 });
  }
  for (const inv of invoices) {
    if (inv.status !== "paid" || !inv.paid_at) continue;
    const key = inv.paid_at.slice(0, 7);
    const row = buckets.get(key);
    if (row) row.revenue += inv.amount_cents / 100;
  }
  for (const exp of expenses) {
    const key = exp.spent_at.slice(0, 7);
    const row = buckets.get(key);
    if (row) row.expenses += exp.amount_cents / 100;
  }
  return Array.from(buckets.entries()).map(([month, v]) => ({
    month: month.slice(5) + "/" + month.slice(2, 4),
    revenue: Math.round(v.revenue),
    expenses: Math.round(v.expenses),
    margin: Math.round(v.revenue - v.expenses),
  }));
}

type AgingRow = { bucket: string; count: number; amount: number };

function arAging(invoices: Invoice[]): AgingRow[] {
  const buckets: AgingRow[] = [
    { bucket: "Current", count: 0, amount: 0 },
    { bucket: "1–30", count: 0, amount: 0 },
    { bucket: "31–60", count: 0, amount: 0 },
    { bucket: "61–90", count: 0, amount: 0 },
    { bucket: "90+", count: 0, amount: 0 },
  ];
  const today = Date.now();
  for (const i of invoices) {
    if (i.status === "paid" || i.status === "voided" || !i.due_at) continue;
    const overdue = Math.floor((today - new Date(i.due_at).getTime()) / 86400000);
    const idx = overdue <= 0 ? 0 : overdue <= 30 ? 1 : overdue <= 60 ? 2 : overdue <= 90 ? 3 : 4;
    buckets[idx].count += 1;
    buckets[idx].amount += i.amount_cents;
  }
  return buckets;
}

type CategoryRow = { name: string; value: number };

function topCategories(expenses: Expense[], limit: number): CategoryRow[] {
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category ?? "Uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + e.amount_cents / 100);
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: Math.round(value) }));
}
