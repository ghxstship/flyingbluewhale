import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DownloadLink } from "@/components/DownloadLink";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { InvoiceStatusControls } from "./InvoiceStatusControls";
import { deleteInvoice } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function InvoiceDetail({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const invoice = await getOrgScoped("invoices", session.orgId, invoiceId);
  if (!invoice) notFound();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={invoice.number}
        title={invoice.title}
        subtitle={`${formatMoney(invoice.amount_cents, invoice.currency)} · ${invoice.invoice_state}`}
        breadcrumbs={[
          {
            label: t("console.finance.invoices.breadcrumbs.finance", undefined, "Finance"),
            href: "/console/finance/invoices",
          },
          {
            label: t("console.finance.invoices.breadcrumbs.invoices", undefined, "Invoices"),
            href: "/console/finance/invoices",
          },
          { label: invoice.number },
        ]}
        action={
          <div className="flex items-center gap-2">
            <InvoiceStatusControls id={invoice.id} status={invoice.invoice_state} />
            <Button href={`/console/documents/invoice?recordId=${invoiceId}`} size="sm" variant="secondary">
              {t("console.finance.invoices.openAsDocument", undefined, "Document")}
            </Button>
            <DownloadLink href={`/api/v1/invoices/${invoiceId}/pdf`}>
              {t("console.finance.invoices.downloadPdf", undefined, "PDF")}
            </DownloadLink>
            <Button href={`/console/finance/invoices/${invoiceId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteInvoice.bind(null, invoiceId)}
              confirm={t(
                "console.finance.invoices.deleteConfirm",
                { number: invoice.number },
                `Delete invoice "${invoice.number}"?`,
              )}
              undo={{ table: "invoices", id: invoiceId, redirectTo: "/console/finance/invoices" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.finance.invoices.fields.status", undefined, "Status")}>
            <StatusBadge status={invoice.invoice_state} />
          </Field>
          <Field label={t("console.finance.invoices.fields.amount", undefined, "Amount")} mono>
            {formatMoney(invoice.amount_cents, invoice.currency)}
          </Field>
          <Field label={t("console.finance.invoices.fields.issued", undefined, "Issued")}>
            {invoice.issued_at ?? "—"}
          </Field>
          <Field label={t("console.finance.invoices.fields.due", undefined, "Due")}>{invoice.due_at ?? "—"}</Field>
          <Field label={t("console.finance.invoices.fields.paid", undefined, "Paid")}>
            {invoice.paid_at ? timeAgo(invoice.paid_at) : "—"}
          </Field>
          <Field label={t("console.finance.invoices.fields.stripe", undefined, "Stripe")} mono>
            {invoice.stripe_payment_intent ?? "—"}
          </Field>
        </div>
        {invoice.notes && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.finance.invoices.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{children}</div>
    </div>
  );
}
