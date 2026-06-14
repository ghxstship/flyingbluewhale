import { Suspense, cache } from "react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { countOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Invoice } from "@/lib/supabase/types";
import { bulkVoidInvoices } from "./actions";

export const dynamic = "force-dynamic";

// Per-request memo so the streaming subtitle island and the table island
// share a single invoices query instead of issuing it twice.
const getInvoices = cache((orgId: string) => listOrgScoped("invoices", orgId, { orderBy: "created_at" }));

// Narrow, uncapped aggregate source for the header totals. getInvoices
// runs through listOrgScoped, which silently caps at 100 rows — fine for
// the table island, but reducing over it truncated the outstanding/paid
// sums (and the count) once an org passed 100 invoices.
const getInvoiceAmounts = cache(async (orgId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("amount_cents, invoice_state")
    .eq("org_id", orgId)
    .is("deleted_at", null);
  if (error) throw error;
  return data ?? [];
});

export default async function InvoicesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.finance.invoices.title", undefined, "Invoices")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.invoices.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.invoices.title", undefined, "Invoices")}
        subtitle={
          <Suspense fallback={<span className="ps-skel inline-block h-4 w-72 align-middle" aria-busy="true" />}>
            <InvoiceSummary orgId={session.orgId} />
          </Suspense>
        }
        action={
          <Button href="/console/finance/invoices/new">
            {t("console.finance.invoices.new", undefined, "+ New Invoice")}
          </Button>
        }
      />
      <div className="page-content">
        <Suspense fallback={<TableSkeleton rows={8} />}>
          <InvoiceTable orgId={session.orgId} />
        </Suspense>
      </div>
    </>
  );
}

/** Streaming island — header subtitle totals (count · outstanding · paid). */
async function InvoiceSummary({ orgId }: { orgId: string }) {
  const [{ t }, count, amounts] = await Promise.all([
    getRequestT(),
    countOrgScoped("invoices", orgId),
    getInvoiceAmounts(orgId),
  ]);
  const outstanding = amounts
    .filter((r) => ["sent", "overdue"].includes(r.invoice_state))
    .reduce((s, r) => s + r.amount_cents, 0);
  const paid = amounts.filter((r) => r.invoice_state === "paid").reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      {t(
        "console.finance.invoices.subtitle",
        { count, outstanding: formatMoney(outstanding), paid: formatMoney(paid) },
        `${count} Total · ${formatMoney(outstanding)} outstanding · ${formatMoney(paid)} paid`,
      )}
    </>
  );
}

/** Streaming island — the invoices data table. */
async function InvoiceTable({ orgId }: { orgId: string }) {
  const [{ t }, rows] = await Promise.all([getRequestT(), getInvoices(orgId)]);
  return (
    <DataTable<Invoice>
      rows={rows}
      rowHref={(r) => `/console/finance/invoices/${r.id}`}
      bulkActions={[
        {
          id: "void",
          label: t("console.finance.invoices.bulk.void", undefined, "Void"),
          variant: "danger",
          perform: bulkVoidInvoices,
        },
      ]}
      columns={[
        {
          key: "number",
          header: t("console.finance.invoices.columns.number", undefined, "Number"),
          render: (r) => <span className="font-mono text-xs">{r.number}</span>,
          accessor: (r) => r.number ?? null,
        },
        {
          key: "title",
          header: t("console.finance.invoices.columns.title", undefined, "Title"),
          render: (r) => r.title,
          accessor: (r) => r.title,
        },
        {
          key: "amount",
          header: t("console.finance.invoices.columns.amount", undefined, "Amount"),
          render: (r) => formatMoney(r.amount_cents, r.currency),
          className: "font-mono text-xs",
          accessor: (r) => r.amount_cents ?? null,
        },
        {
          key: "status",
          header: t("console.finance.invoices.columns.status", undefined, "Status"),
          render: (r) => <StatusBadge status={r.invoice_state} />,
          accessor: (r) => r.invoice_state,
          filterable: true,
          groupable: true,
        },
        {
          key: "due",
          header: t("console.finance.invoices.columns.due", undefined, "Due"),
          render: (r) => r.due_at ?? "—",
          className: "font-mono text-xs",
          accessor: (r) => r.due_at ?? null,
        },
        {
          key: "created",
          header: t("console.finance.invoices.columns.created", undefined, "Created"),
          render: (r) => timeAgo(r.created_at),
          className: "font-mono text-xs",
          accessor: (r) => r.created_at,
        },
      ]}
    />
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="ps-skel h-10 rounded-md" />
      <div className="surface overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0">
            <div className="ps-skel h-4 flex-1" />
            <div className="ps-skel h-4 w-24" />
            <div className="ps-skel h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
