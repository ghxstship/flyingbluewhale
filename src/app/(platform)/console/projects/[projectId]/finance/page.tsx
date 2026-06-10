import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  invoice_state: string;
  due_at: string | null;
};
type ExpenseRow = {
  id: string;
  description: string;
  category: string | null;
  amount_cents: number;
  expense_state: string;
  spent_at: string;
};
type POrow = { id: string; number: string; title: string; amount_cents: number; po_state: string; created_at: string };

const INVOICE_REVENUE_STATUSES = new Set(["paid"]);
const INVOICE_PIPELINE_STATUSES = new Set(["sent", "overdue"]);
const EXPENSE_COMMITTED = new Set(["approved", "reimbursed"]);
const PO_COMMITTED = new Set(["sent", "acknowledged", "fulfilled"]);

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.projects.finance.title", undefined, "P&L")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.projects.finance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: project }, { data: invoices }, { data: expenses }, { data: pos }, { data: budgets }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("id, number, title, amount_cents, invoice_state, due_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("id, description, category, amount_cents, expense_state, spent_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("spent_at", { ascending: false }),
      supabase
        .from("purchase_orders")
        .select("id, number, title, amount_cents, po_state, created_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      // P4.2 — XPMS canonical actual_cents with spent_cents coalesce.
      supabase.from("budgets").select("amount_cents, actual_cents, spent_cents").eq("project_id", projectId),
    ]);

  if (!project) {
    return (
      <>
        <ModuleHeader title={t("console.projects.finance.notFoundTitle", undefined, "Project Not Found")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.projects.finance.notFoundBody", undefined, "Project not found in this workspace.")}
          </div>
        </div>
      </>
    );
  }

  const currency = "USD"; // projects table doesn't carry currency yet; invoices/POs each carry their own
  const invList = (invoices ?? []) as InvoiceRow[];
  const expList = (expenses ?? []) as ExpenseRow[];
  const poList = (pos ?? []) as POrow[];

  const revenue = invList
    .filter((i) => INVOICE_REVENUE_STATUSES.has(i.invoice_state))
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const pipeline = invList
    .filter((i) => INVOICE_PIPELINE_STATUSES.has(i.invoice_state))
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const expensesCommitted = expList
    .filter((e) => EXPENSE_COMMITTED.has(e.expense_state))
    .reduce((s, e) => s + (e.amount_cents ?? 0), 0);
  const poCommitted = poList.filter((p) => PO_COMMITTED.has(p.po_state)).reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const spent = expensesCommitted + poCommitted;
  const margin = revenue - spent;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : null;

  const budgetTotal = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const budgetSpent = (budgets ?? []).reduce(
    (s, b) => s + Number((b as { actual_cents?: number | null }).actual_cents ?? b.spent_cents ?? 0),
    0,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.finance.title", undefined, "P&L")}
        subtitle={`${formatMoney(margin, currency)} ${t("console.projects.finance.marginLabel", undefined, "margin")} · ${marginPct == null ? "—" : `${marginPct}%`}`}
        breadcrumbs={[
          {
            label: t("console.projects.finance.breadcrumbs.projects", undefined, "Projects"),
            href: "/console/projects",
          },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: t("console.projects.finance.title", undefined, "P&L") },
        ]}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.projects.finance.metrics.revenue", undefined, "Revenue — Paid")}
            value={formatMoney(revenue, currency)}
            accent
          />
          <MetricCard
            label={t("console.projects.finance.metrics.spent", undefined, "Spent — Committed")}
            value={formatMoney(spent, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.metrics.margin", undefined, "Margin")}
            value={formatMoney(margin, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.metrics.outstanding", undefined, "Outstanding Invoiced")}
            value={formatMoney(pipeline, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.metrics.expensesCommitted", undefined, "Expenses Committed")}
            value={formatMoney(expensesCommitted, currency)}
          />
          <MetricCard
            label={t("console.projects.finance.metrics.posCommitted", undefined, "POs committed")}
            value={formatMoney(poCommitted, currency)}
          />
        </div>
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.projects.finance.marginExplainer",
            undefined,
            "Margin = revenue (paid invoices) − spent (committed expenses + committed POs).",
          )}
          {marginPct != null &&
            ` ${t("console.projects.finance.marginPctSentence", { pct: marginPct }, `This project is at ${marginPct}% margin against paid revenue.`)}`}{" "}
          {t(
            "console.projects.finance.pipelineExplainer",
            undefined,
            "Pipeline is sent + overdue invoices that haven't cleared.",
          )}
        </p>

        {budgetTotal > 0 && (
          <section className="surface p-5">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("console.projects.finance.budget.title", undefined, "Budget Envelope")}
              </h3>
              <Link
                href={`/console/projects/${projectId}/budget`}
                className="text-xs text-[var(--p-accent)] hover:underline"
              >
                {t("console.projects.finance.budget.open", undefined, "Open budget →")}
              </Link>
            </header>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t(
                "console.projects.finance.budget.consumedPrefix",
                { spent: formatMoney(budgetSpent, currency), total: formatMoney(budgetTotal, currency) },
                `${formatMoney(budgetSpent, currency)} of ${formatMoney(budgetTotal, currency)} budget consumed`,
              )}
              {" · "}
              {t(
                "console.projects.finance.budget.actualSpent",
                { amount: formatMoney(spent, currency) },
                `actual spent (POs + expenses) is ${formatMoney(spent, currency)}`,
              )}
              {budgetTotal > 0 && spent > budgetTotal && (
                <Badge variant="error" className="ms-2">
                  {t("console.projects.finance.budget.overBudget", undefined, "over budget")}
                </Badge>
              )}
            </p>
          </section>
        )}

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.projects.finance.invoices.title", undefined, "Invoices")}
            </h3>
            <Link href="/console/finance/invoices" className="text-xs text-[var(--p-accent)] hover:underline">
              {t("console.projects.finance.invoices.allLink", undefined, "All invoices →")}
            </Link>
          </header>
          <DataTable<InvoiceRow>
            rows={invList}
            rowHref={(r) => `/console/finance/invoices/${r.id}`}
            emptyLabel={t("console.projects.finance.invoices.emptyLabel", undefined, "No invoices yet")}
            emptyDescription={t(
              "console.projects.finance.invoices.emptyDescription",
              undefined,
              "Invoices created from this project's proposals will land here.",
            )}
            columns={[
              {
                key: "number",
                header: t("console.projects.finance.columns.number", undefined, "Number"),
                render: (r) => <span className="font-mono text-xs">{r.number}</span>,
                accessor: (r) => r.number ?? null,
              },
              {
                key: "title",
                header: t("console.projects.finance.columns.title", undefined, "Title"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "amount",
                header: t("console.projects.finance.columns.amount", undefined, "Amount"),
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: t("console.projects.finance.columns.status", undefined, "Status"),
                render: (r) => (
                  <Badge
                    variant={r.invoice_state === "paid" ? "success" : r.invoice_state === "overdue" ? "error" : "muted"}
                  >
                    {r.invoice_state}
                  </Badge>
                ),
                filterable: true,
                groupable: true,
                accessor: (r) => r.invoice_state ?? null,
              },
              {
                key: "due",
                header: t("console.projects.finance.columns.due", undefined, "Due"),
                render: (r) => r.due_at ?? "—",
                className: "font-mono text-xs",
                accessor: (r) => r.due_at ?? null,
              },
            ]}
          />
        </section>

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.projects.finance.purchaseOrders.title", undefined, "Purchase Orders")}
            </h3>
            <Link
              href="/console/procurement/purchase-orders"
              className="text-xs text-[var(--p-accent)] hover:underline"
            >
              {t("console.projects.finance.purchaseOrders.allLink", undefined, "All POs →")}
            </Link>
          </header>
          <DataTable<POrow>
            rows={poList}
            rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
            emptyLabel={t("console.projects.finance.purchaseOrders.emptyLabel", undefined, "No purchase orders")}
            emptyDescription={t(
              "console.projects.finance.purchaseOrders.emptyDescription",
              undefined,
              "POs raised against this project will land here.",
            )}
            columns={[
              {
                key: "number",
                header: t("console.projects.finance.columns.number", undefined, "Number"),
                render: (r) => <span className="font-mono text-xs">{r.number}</span>,
                accessor: (r) => r.number ?? null,
              },
              {
                key: "title",
                header: t("console.projects.finance.columns.title", undefined, "Title"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "amount",
                header: t("console.projects.finance.columns.amount", undefined, "Amount"),
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: t("console.projects.finance.columns.status", undefined, "Status"),
                render: (r) => r.po_state,
                accessor: (r) => r.po_state,
                filterable: true,
                groupable: true,
              },
            ]}
          />
        </section>

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.projects.finance.expenses.title", undefined, "Expenses")}
            </h3>
            <Link href="/console/finance/expenses" className="text-xs text-[var(--p-accent)] hover:underline">
              {t("console.projects.finance.expenses.allLink", undefined, "All expenses →")}
            </Link>
          </header>
          <DataTable<ExpenseRow>
            rows={expList}
            rowHref={(r) => `/console/finance/expenses/${r.id}`}
            emptyLabel={t("console.projects.finance.expenses.emptyLabel", undefined, "No expenses logged")}
            emptyDescription={t(
              "console.projects.finance.expenses.emptyDescription",
              undefined,
              "Expenses tagged with this project will land here.",
            )}
            columns={[
              {
                key: "description",
                header: t("console.projects.finance.columns.description", undefined, "Description"),
                render: (r) => r.description,
                accessor: (r) => r.description,
              },
              {
                key: "category",
                header: t("console.projects.finance.columns.category", undefined, "Category"),
                render: (r) => r.category ?? "—",
                className: "font-mono text-xs",
                accessor: (r) => r.category ?? null,
                filterable: true,
                groupable: true,
              },
              {
                key: "amount",
                header: t("console.projects.finance.columns.amount", undefined, "Amount"),
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: t("console.projects.finance.columns.status", undefined, "Status"),
                render: (r) => r.expense_state,
                accessor: (r) => r.expense_state,
                filterable: true,
                groupable: true,
              },
              {
                key: "spent_at",
                header: t("console.projects.finance.columns.date", undefined, "Date"),
                render: (r) => r.spent_at,
                className: "font-mono text-xs",
                accessor: (r) => r.spent_at,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
