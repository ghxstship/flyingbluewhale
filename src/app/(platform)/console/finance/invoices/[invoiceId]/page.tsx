import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import { InvoiceStatusControls } from "./InvoiceStatusControls";

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
        action={<InvoiceStatusControls id={invoice.id} status={invoice.status} />}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Status"><StatusBadge status={invoice.status} /></Field>
          <Field label="Amount">{formatMoney(invoice.amount_cents, invoice.currency)}</Field>
          <Field label="Issued">{invoice.issued_at ?? "—"}</Field>
          <Field label="Due">{invoice.due_at ?? "—"}</Field>
          <Field label="Paid">{invoice.paid_at ? timeAgo(invoice.paid_at) : "—"}</Field>
          <Field label="Stripe">{invoice.stripe_payment_intent ?? "—"}</Field>
        </div>
        {invoice.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-mono">{children}</div>
    </div>
  );
}
