export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Project Settlement Sheet — final financial reconciliation for a project/event.
 * Aggregates paid invoices (revenue), committed expenses, POs, and logged labor
 * into a single settlement summary view.
 * Competitive parity: Prism.fm automated settlement generation.
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.projects.finance.settlement.title", undefined, "Settlement Sheet")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.projects.finance.settlement.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: project }, { data: invoices }, { data: expenses }, { data: pos }, { data: timeEntries }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, start_date, end_date")
        .eq("id", projectId)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id, number, title, amount_cents, invoice_state")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, description, category, amount_cents, expense_state")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId),
      supabase
        .from("purchase_orders")
        .select("id, number, title, amount_cents, po_state")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId),
      supabase
        .from("time_entries")
        .select("id, duration_minutes, rate_cents")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .not("ended_at", "is", null),
    ]);

  if (!project) return notFound();

  const currency = "USD";
  const PAID_INV = new Set(["paid"]);
  const COMMITTED_EXP = new Set(["approved", "reimbursed"]);
  const COMMITTED_PO = new Set(["sent", "acknowledged", "fulfilled"]);

  type InvRow = { id: string; number: string; title: string; amount_cents: number; invoice_state: string };
  type ExpRow = { id: string; description: string; category: string | null; amount_cents: number; expense_state: string };
  type PORow = { id: string; number: string; title: string; amount_cents: number; po_state: string };
  type TERow = { id: string; duration_minutes: number | null; rate_cents: number | null };

  const invList = (invoices ?? []) as InvRow[];
  const expList = (expenses ?? []) as ExpRow[];
  const poList = (pos ?? []) as PORow[];
  const teList = (timeEntries ?? []) as TERow[];

  const revenue = invList
    .filter((i) => PAID_INV.has(i.invoice_state))
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);

  const invoicedPipeline = invList
    .filter((i) => i.invoice_state === "sent" || i.invoice_state === "overdue")
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);

  const expCost = expList
    .filter((e) => COMMITTED_EXP.has(e.expense_state))
    .reduce((s, e) => s + (e.amount_cents ?? 0), 0);

  const poCost = poList
    .filter((p) => COMMITTED_PO.has(p.po_state))
    .reduce((s, p) => s + (p.amount_cents ?? 0), 0);

  const laborCost = teList.reduce((s, te) => {
    if (!te.rate_cents || !te.duration_minutes) return s;
    return s + Math.round((te.rate_cents * te.duration_minutes) / 60);
  }, 0);

  const totalCosts = expCost + poCost + laborCost;
  const net = revenue - totalCosts;
  const marginPct = revenue > 0 ? Math.round((net / revenue) * 100) : null;

  const expByCategory = new Map<string, number>();
  for (const e of expList) {
    if (!COMMITTED_EXP.has(e.expense_state)) continue;
    const cat = e.category ?? "Uncategorized";
    expByCategory.set(cat, (expByCategory.get(cat) ?? 0) + (e.amount_cents ?? 0));
  }
  const categoryRows = Array.from(expByCategory.entries()).sort((a, b) => b[1] - a[1]);

  const generatedAt = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.finance.settlement.title", undefined, "Settlement Sheet")}
        subtitle={`${t("console.projects.finance.settlement.generatedOn", undefined, "Generated")} ${generatedAt}`}
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          {
            label: t("console.projects.tabs.finance", undefined, "P&L"),
            href: `/console/projects/${projectId}/finance`,
          },
          { label: t("console.projects.finance.settlement.title", undefined, "Settlement Sheet") },
        ]}
      />
      <div className="page-content space-y-6">
        {/* Top-line metrics */}
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.projects.finance.settlement.metrics.revenue", undefined, "Gross Revenue — Paid")}
            value={formatMoney(revenue, currency)}
            accent
          />
          <MetricCard
            label={t("console.projects.finance.settlement.metrics.costs", undefined, "Total Costs")}
            value={formatMoney(totalCosts, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.settlement.metrics.net", undefined, "Net")}
            value={formatMoney(net, currency)}
            delta={
              marginPct !== null
                ? { value: `${marginPct}%`, positive: net >= 0 }
                : undefined
            }
          />
          <MetricCard
            label={t(
              "console.projects.finance.settlement.metrics.expenses",
              undefined,
              "Direct Expenses",
            )}
            value={formatMoney(expCost, currency)}
          />
          <MetricCard
            label={t(
              "console.projects.finance.settlement.metrics.procurement",
              undefined,
              "Procurement (POs)",
            )}
            value={formatMoney(poCost, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.settlement.metrics.labor", undefined, "Labor (time)")}
            value={formatMoney(laborCost, currency)}
          />
        </div>

        {invoicedPipeline > 0 && (
          <div className="surface flex items-center gap-3 p-4">
            <Badge variant="warning">
              {t("console.projects.finance.settlement.pipeline.badge", undefined, "Pipeline")}
            </Badge>
            <p className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.projects.finance.settlement.pipeline.body",
                { amount: formatMoney(invoicedPipeline, currency) },
                `${formatMoney(invoicedPipeline, currency)} in outstanding invoices not yet collected — excluded from net.`,
              )}
            </p>
          </div>
        )}

        {/* Revenue detail */}
        <section className="surface overflow-hidden">
          <header className="border-b border-[var(--p-border)] px-5 py-3">
            <h3 className="text-sm font-semibold">
              {t("console.projects.finance.settlement.revenue.title", undefined, "Revenue")}
            </h3>
          </header>
          {invList.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--p-text-2)]">
              {t(
                "console.projects.finance.settlement.revenue.empty",
                undefined,
                "No invoices found for this project.",
              )}
            </p>
          ) : (
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.projects.finance.settlement.cols.number", undefined, "#")}</th>
                  <th>{t("console.projects.finance.settlement.cols.description", undefined, "Description")}</th>
                  <th>{t("console.projects.finance.settlement.cols.state", undefined, "State")}</th>
                  <th className="text-right">
                    {t("console.projects.finance.settlement.cols.amount", undefined, "Amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invList.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs">{inv.number}</td>
                    <td>{inv.title}</td>
                    <td>
                      <Badge
                        variant={
                          inv.invoice_state === "paid"
                            ? "success"
                            : inv.invoice_state === "overdue"
                              ? "error"
                              : "muted"
                        }
                      >
                        {inv.invoice_state}
                      </Badge>
                    </td>
                    <td className="text-right font-mono text-xs">
                      {formatMoney(inv.amount_cents ?? 0, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={3}>
                    {t(
                      "console.projects.finance.settlement.revenue.subtotal",
                      undefined,
                      "Revenue subtotal (paid only)",
                    )}
                  </td>
                  <td className="text-right font-mono">{formatMoney(revenue, currency)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Cost breakdown by category */}
        {(categoryRows.length > 0 || poCost > 0 || laborCost > 0) && (
          <section className="surface overflow-hidden">
            <header className="border-b border-[var(--p-border)] px-5 py-3">
              <h3 className="text-sm font-semibold">
                {t(
                  "console.projects.finance.settlement.costs.title",
                  undefined,
                  "Cost Breakdown",
                )}
              </h3>
            </header>
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>
                    {t("console.projects.finance.settlement.cols.category", undefined, "Category")}
                  </th>
                  <th className="text-right">
                    {t("console.projects.finance.settlement.cols.amount", undefined, "Amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map(([cat, amount]) => (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td className="text-right font-mono text-xs">{formatMoney(amount, currency)}</td>
                  </tr>
                ))}
                {poCost > 0 && (
                  <tr>
                    <td>
                      {t(
                        "console.projects.finance.settlement.costs.procurement",
                        undefined,
                        "Procurement (Purchase Orders)",
                      )}
                    </td>
                    <td className="text-right font-mono text-xs">{formatMoney(poCost, currency)}</td>
                  </tr>
                )}
                {laborCost > 0 && (
                  <tr>
                    <td>
                      {t(
                        "console.projects.finance.settlement.costs.labor",
                        undefined,
                        "Labor (time entries)",
                      )}
                    </td>
                    <td className="text-right font-mono text-xs">
                      {formatMoney(laborCost, currency)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td>
                    {t(
                      "console.projects.finance.settlement.costs.total",
                      undefined,
                      "Total costs",
                    )}
                  </td>
                  <td className="text-right font-mono">{formatMoney(totalCosts, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        {/* Net settlement summary */}
        <section
          className={`surface p-5 ${net >= 0 ? "border-l-2 border-l-[var(--c-success)]" : "border-l-2 border-l-[var(--c-error)]"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.15em] text-[var(--p-text-2)] uppercase">
                {t("console.projects.finance.settlement.net.label", undefined, "Net Settlement")}
              </p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(net, currency)}</p>
              {marginPct !== null && (
                <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.projects.finance.settlement.net.margin",
                    { pct: marginPct },
                    `${marginPct}% margin on paid revenue`,
                  )}
                </p>
              )}
            </div>
            <Badge variant={net >= 0 ? "success" : "error"}>
              {net >= 0
                ? t("console.projects.finance.settlement.net.surplus", undefined, "Surplus")
                : t("console.projects.finance.settlement.net.deficit", undefined, "Deficit")}
            </Badge>
          </div>
        </section>
      </div>
    </>
  );
}
