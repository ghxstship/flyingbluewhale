export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, money } from "@/components/detail/DetailShell";
import { reconcileBudget, computeBudgetSpend } from "./actions";
import { deleteBudget } from "./edit/actions";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ budgetId: string }> }) {
  const { budgetId } = await params;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data: budget } = await supabase
    .from("budgets")
    .select(
      "id, name, amount_cents, spent_cents, actual_cents, forecast_cents, category, department, discipline, xpms_phase, tier, xyz, line_type, vendor, project_id, created_at",
    )
    .eq("org_id", session.orgId)
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
          title={t("console.finance.budgets.detail.title", undefined, "Budget")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.finance.budgets.detail.notFound", undefined, "Not found.")}
          </div>
        </div>
      </>
    );
  }

  const xpmsDepartment = (budget as { department?: string | null }).department ?? null;
  const recomputed = await computeBudgetSpend(supabase, {
    orgId: session.orgId,
    projectId: budget.project_id,
    department: xpmsDepartment,
    category: budget.category,
  });

  let expensesQ = supabase
    .from("expenses")
    .select("id, description, amount_cents, spent_at, category, department")
    .eq("org_id", session.orgId);
  if (budget.project_id) expensesQ = expensesQ.eq("project_id", budget.project_id);
  // Prefer XPMS department filter; fall back to legacy category text
  // for budget rows not yet migrated to the new taxonomy.
  if (xpmsDepartment) {
    expensesQ = expensesQ.eq("department", xpmsDepartment);
  } else if (budget.category) {
    expensesQ = expensesQ.eq("category", budget.category);
  }
  const { data: expenses } = await expensesQ.order("spent_at", { ascending: false }).limit(50);

  let invoicesQ = supabase
    .from("invoices")
    .select("id, number, amount_cents, paid_at")
    .eq("org_id", session.orgId)
    .eq("invoice_state", "paid");
  if (budget.project_id) invoicesQ = invoicesQ.eq("project_id", budget.project_id);
  const { data: invoices } = await invoicesQ.order("paid_at", { ascending: false }).limit(50);

  // XPMS-aware: prefer actual_cents (canonical), fall back to spent_cents
  // (legacy) for rows whose trigger hasn't fired yet.
  const storedActual = (budget as { actual_cents?: number | null }).actual_cents ?? budget.spent_cents ?? 0;
  const variance = recomputed - storedActual;
  const utilization = budget.amount_cents > 0 ? (recomputed / budget.amount_cents) * 100 : 0;
  const remaining = budget.amount_cents - recomputed;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={budget.name}
        subtitle={
          xpmsDepartment ?? (budget as { discipline?: string | null }).discipline ?? budget.category ?? undefined
        }
        breadcrumbs={[
          { label: t("console.finance.eyebrow", undefined, "Finance"), href: "/console/finance" },
          { label: t("console.finance.budgets.breadcrumb", undefined, "Budgets"), href: "/console/finance/budgets" },
          { label: budget.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <form action={reconcileBudget}>
              <input type="hidden" name="id" value={budget.id} />
              <button
                type="submit"
                className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
              >
                {t("console.finance.budgets.detail.reconcileToActuals", undefined, "Reconcile to actuals")}
              </button>
            </form>
            <Button href={`/console/finance/budgets/${budget.id}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteBudget.bind(null, budget.id)}
              confirm={t(
                "console.finance.budgets.detail.deleteConfirm",
                { name: budget.name },
                `Delete budget "${budget.name}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content max-w-5xl space-y-5">
        {/* XPMS taxonomy strip — only renders when any XPMS column is
            set, so legacy rows stay clean. */}
        {(() => {
          const b = budget as {
            department?: string | null;
            discipline?: string | null;
            xpms_phase?: string | null;
            tier?: string | null;
            xyz?: string | null;
            line_type?: string | null;
            vendor?: string | null;
          };
          const items = [
            ["Department", b.department],
            ["Discipline", b.discipline],
            ["Phase", b.xpms_phase],
            ["Tier", b.tier],
            ["XYZ", b.xyz],
            ["Line Type", b.line_type],
            ["Vendor", b.vendor],
          ].filter(([, v]) => !!v) as Array<[string, string]>;
          if (items.length === 0) return null;
          return (
            <section className="surface p-4">
              <div className="text-[10px] font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
                XPMS Classification
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {items.map(([k, v]) => (
                  <Badge key={k} variant="muted">
                    <span className="text-[var(--p-text-2)]">{k}:</span> <span className="font-medium">{v}</span>
                  </Badge>
                ))}
              </div>
            </section>
          );
        })()}

        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                {t("console.finance.budgets.detail.budget", undefined, "Budget")}
              </div>
              <div className="mt-1 text-lg font-semibold">{money(budget.amount_cents)}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                {t("console.finance.budgets.detail.computedActual", undefined, "Computed actual")}
              </div>
              <div className="mt-1 text-lg font-semibold">{money(recomputed)}</div>
              <div className="mt-0.5 text-[10px] text-[var(--p-text-2)]">
                {t(
                  "console.finance.budgets.detail.storedLabel",
                  { amount: money(budget.spent_cents) },
                  `Stored: ${money(budget.spent_cents)}`,
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                {t("console.finance.budgets.detail.remaining", undefined, "Remaining")}
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  remaining >= 0 ? "text-[var(--p-text-1)]" : "text-[var(--p-danger)]"
                }`}
              >
                {money(remaining)}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                {t("console.finance.budgets.detail.varianceVsStored", undefined, "Variance vs stored")}
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  variance === 0
                    ? "text-[var(--p-text-2)]"
                    : variance > 0
                      ? "text-[var(--p-warning)]"
                      : "text-[var(--p-success)]"
                }`}
              >
                {variance === 0 ? "—" : `${variance > 0 ? "+" : ""}${money(variance)}`}
              </div>
              {variance !== 0 && (
                <div className="mt-0.5 text-[10px] text-[var(--p-text-2)]">
                  {t("console.finance.budgets.detail.reconcileToClear", undefined, "Reconcile to clear")}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={utilization} showLabel />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="surface">
            <header className="border-b border-[var(--p-border)] px-4 py-2.5">
              <h3 className="text-sm font-semibold">
                {t("console.finance.budgets.detail.expensesHeader", undefined, "Expenses")}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {(expenses ?? []).length === 1
                  ? t(
                      "console.finance.budgets.detail.expensesCountOne",
                      { count: (expenses ?? []).length },
                      `${(expenses ?? []).length} entry matching project + category`,
                    )
                  : t(
                      "console.finance.budgets.detail.expensesCountMany",
                      { count: (expenses ?? []).length },
                      `${(expenses ?? []).length} entries matching project + category`,
                    )}
              </p>
            </header>
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.finance.budgets.detail.col.when", undefined, "When")}</th>
                  <th>{t("console.finance.budgets.detail.col.description", undefined, "Description")}</th>
                  <th className="text-end">{t("console.finance.budgets.detail.col.amount", undefined, "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {(expenses ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--p-text-2)]">
                      {t("console.finance.budgets.detail.noExpenses", undefined, "No matching expenses.")}
                    </td>
                  </tr>
                ) : (
                  (expenses ?? []).map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{fmtDate(e.spent_at)}</td>
                      <td>{e.description}</td>
                      <td className="text-end font-mono text-xs">{money(e.amount_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="surface">
            <header className="border-b border-[var(--p-border)] px-4 py-2.5">
              <h3 className="text-sm font-semibold">
                {t("console.finance.budgets.detail.paidInvoicesHeader", undefined, "Paid Invoices")}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.finance.budgets.detail.invoicesCount",
                  { count: (invoices ?? []).length },
                  `${(invoices ?? []).length} matching project`,
                )}
              </p>
            </header>
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.finance.budgets.detail.col.paid", undefined, "Paid")}</th>
                  <th>{t("console.finance.budgets.detail.col.invoice", undefined, "Invoice")}</th>
                  <th className="text-end">{t("console.finance.budgets.detail.col.amount", undefined, "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {(invoices ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--p-text-2)]">
                      {t(
                        "console.finance.budgets.detail.noPaidInvoices",
                        undefined,
                        "No paid invoices on this project.",
                      )}
                    </td>
                  </tr>
                ) : (
                  (invoices ?? []).map((i) => (
                    <tr key={i.id}>
                      <td className="font-mono text-xs">{fmtDate(i.paid_at)}</td>
                      <td className="font-mono text-xs">{i.number}</td>
                      <td className="text-end font-mono text-xs">{money(i.amount_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>

        <section className="surface p-4 text-xs text-[var(--p-text-2)]">
          <Badge variant="muted">{t("console.finance.budgets.detail.createdBadge", undefined, "Created")}</Badge>{" "}
          <span className="font-mono">{fmtDate(budget.created_at)}</span>
        </section>
      </div>
    </>
  );
}
