import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { InvoiceStatusControls } from "./InvoiceStatusControls";
import { deleteInvoice } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function InvoiceDetail({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const invoice = await getOrgScoped("invoices", session.orgId, invoiceId);
  if (!invoice) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={invoice.number}
        title={invoice.title}
        subtitle={`${formatMoney(invoice.amount_cents, invoice.currency)} · ${invoice.status}`}
        breadcrumbs={[
          { label: "Finance", href: "/console/finance/invoices" },
          { label: "Invoices", href: "/console/finance/invoices" },
          { label: invoice.number },
        ]}
        action={
          <div className="flex items-center gap-2">
            <InvoiceStatusControls id={invoice.id} status={invoice.status} />
            <Button href={`/console/finance/invoices/${invoiceId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteInvoice.bind(null, invoiceId)}
              confirm={`Delete invoice "${invoice.number}"? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Status">
            <StatusBadge status={invoice.status} />
          </Field>
          <Field label="Amount" mono>
            {formatMoney(invoice.amount_cents, invoice.currency)}
          </Field>
          <Field label="Issued">{invoice.issued_at ?? "—"}</Field>
          <Field label="Due">{invoice.due_at ?? "—"}</Field>
          <Field label="Paid">{invoice.paid_at ? timeAgo(invoice.paid_at) : "—"}</Field>
          <Field label="Stripe" mono>
            {invoice.stripe_payment_intent ?? "—"}
          </Field>
        </div>
        {invoice.notes && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}
