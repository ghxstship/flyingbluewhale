import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  status: string;
  due_at: string | null;
};
type ExpenseRow = {
  id: string;
  description: string;
  category: string | null;
  amount_cents: number;
  status: string;
  spent_at: string;
};
type POrow = { id: string; number: string; title: string; amount_cents: number; status: string; created_at: string };

const INVOICE_REVENUE_STATUSES = new Set(["paid"]);
const INVOICE_PIPELINE_STATUSES = new Set(["sent", "overdue"]);
const EXPENSE_COMMITTED = new Set(["approved", "reimbursed"]);
const PO_COMMITTED = new Set(["sent", "acknowledged", "fulfilled"]);

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="P&L" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        .select("id, number, title, amount_cents, status, due_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("expenses")
        .select("id, description, category, amount_cents, status, spent_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("spent_at", { ascending: false }),
      supabase
        .from("purchase_orders")
        .select("id, number, title, amount_cents, status, created_at")
        .eq("org_id", session.orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase.from("budgets").select("amount_cents, spent_cents").eq("project_id", projectId),
    ]);

  if (!project) {
    return (
      <>
        <ModuleHeader title="Project Not Found" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Project not found in this workspace.</div>
        </div>
      </>
    );
  }

  const currency = "USD"; // projects table doesn't carry currency yet; invoices/POs each carry their own
  const invList = (invoices ?? []) as InvoiceRow[];
  const expList = (expenses ?? []) as ExpenseRow[];
  const poList = (pos ?? []) as POrow[];

  const revenue = invList
    .filter((i) => INVOICE_REVENUE_STATUSES.has(i.status))
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const pipeline = invList
    .filter((i) => INVOICE_PIPELINE_STATUSES.has(i.status))
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const expensesCommitted = expList
    .filter((e) => EXPENSE_COMMITTED.has(e.status))
    .reduce((s, e) => s + (e.amount_cents ?? 0), 0);
  const poCommitted = poList.filter((p) => PO_COMMITTED.has(p.status)).reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const spent = expensesCommitted + poCommitted;
  const margin = revenue - spent;
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : null;

  const budgetTotal = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const budgetSpent = (budgets ?? []).reduce((s, b) => s + (b.spent_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="P&L"
        subtitle={`${formatMoney(margin, currency)} margin · ${marginPct == null ? "—" : `${marginPct}%`}`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "P&L" },
        ]}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard label="Revenue (paid)" value={formatMoney(revenue, currency)} accent />
          <MetricCard label="Spent (committed)" value={formatMoney(spent, currency)} />
          <MetricCard label="Margin" value={formatMoney(margin, currency)} />
          <MetricCard label="Outstanding Invoiced" value={formatMoney(pipeline, currency)} />
          <MetricCard label="Expenses Committed" value={formatMoney(expensesCommitted, currency)} />
          <MetricCard label="POs committed" value={formatMoney(poCommitted, currency)} />
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Margin = revenue (paid invoices) − spent (committed expenses + committed POs).
          {marginPct != null && ` This project is at ${marginPct}% margin against paid revenue.`} Pipeline is sent +
          overdue invoices that haven't cleared.
        </p>

        {budgetTotal > 0 && (
          <section className="surface p-5">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Budget Envelope</h3>
              <Link
                href={`/console/projects/${projectId}/budget`}
                className="text-xs text-[var(--org-primary)] hover:underline"
              >
                Open budget →
              </Link>
            </header>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {formatMoney(budgetSpent, currency)} of {formatMoney(budgetTotal, currency)} budget consumed
              {" · "}
              actual spent (POs + expenses) is {formatMoney(spent, currency)}
              {budgetTotal > 0 && spent > budgetTotal && (
                <Badge variant="error" className="ml-2">
                  over budget
                </Badge>
              )}
            </p>
          </section>
        )}

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Invoices</h3>
            <Link href="/console/finance/invoices" className="text-xs text-[var(--org-primary)] hover:underline">
              All invoices →
            </Link>
          </header>
          <DataTable<InvoiceRow>
            rows={invList}
            rowHref={(r) => `/console/finance/invoices/${r.id}`}
            emptyLabel="No invoices yet"
            emptyDescription="Invoices created from this project's proposals will land here."
            columns={[
              {
                key: "number",
                header: "Number",
                render: (r) => <span className="font-mono text-xs">{r.number}</span>,
                accessor: (r) => r.number ?? null,
              },
              { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
              {
                key: "amount",
                header: "Amount",
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <Badge variant={r.status === "paid" ? "success" : r.status === "overdue" ? "error" : "muted"}>
                    {r.status}
                  </Badge>
                ),
                filterable: true,
                groupable: true,
                accessor: (r) => r.status ?? null,
              },
              {
                key: "due",
                header: "Due",
                render: (r) => r.due_at ?? "—",
                className: "font-mono text-xs",
                accessor: (r) => r.due_at ?? null,
              },
            ]}
          />
        </section>

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Purchase Orders</h3>
            <Link
              href="/console/procurement/purchase-orders"
              className="text-xs text-[var(--org-primary)] hover:underline"
            >
              All POs →
            </Link>
          </header>
          <DataTable<POrow>
            rows={poList}
            rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
            emptyLabel="No purchase orders"
            emptyDescription="POs raised against this project will land here."
            columns={[
              {
                key: "number",
                header: "Number",
                render: (r) => <span className="font-mono text-xs">{r.number}</span>,
                accessor: (r) => r.number ?? null,
              },
              { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
              {
                key: "amount",
                header: "Amount",
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => r.status,
                accessor: (r) => r.status,
                filterable: true,
                groupable: true,
              },
            ]}
          />
        </section>

        <section>
          <header className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Expenses</h3>
            <Link href="/console/finance/expenses" className="text-xs text-[var(--org-primary)] hover:underline">
              All expenses →
            </Link>
          </header>
          <DataTable<ExpenseRow>
            rows={expList}
            rowHref={(r) => `/console/finance/expenses/${r.id}`}
            emptyLabel="No expenses logged"
            emptyDescription="Expenses tagged with this project will land here."
            columns={[
              {
                key: "description",
                header: "Description",
                render: (r) => r.description,
                accessor: (r) => r.description,
              },
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
                render: (r) => formatMoney(r.amount_cents, currency),
                className: "font-mono text-xs",
                accessor: (r) => Number(r.amount_cents ?? 0),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => r.status,
                accessor: (r) => r.status,
                filterable: true,
                groupable: true,
              },
              {
                key: "spent_at",
                header: "Date",
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
