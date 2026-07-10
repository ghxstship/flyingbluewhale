export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";
import { submitVendorInvoice } from "./actions";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const [{ data }, { data: pos }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, number, title, amount_cents, invoice_state, issued_at, due_at")
      .is("deleted_at", null)
      .eq("org_id", session.orgId)
      .eq("created_by", session.userId)
      .order("issued_at", { ascending: false })
      .limit(200),
    // POs the vendor can reference — RLS-scoped read; recent first.
    supabase
      .from("purchase_orders")
      .select("id, number, title")
      .is("deleted_at", null)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const rows = (data ?? []) as Array<{
    id: string;
    number: string | null;
    title: string | null;
    amount_cents: number;
    invoice_state: string;
    issued_at: string | null;
    due_at: string | null;
  }>;
  const poOptions = (pos ?? []) as Array<{ id: string; number: string; title: string }>;
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.invoices.title", undefined, "Invoices")}
      subtitle={t("p.vendor.invoices.subtitle", undefined, "Your invoices against this org")}
    >
      <section className="surface p-5">
        <h3 className="text-sm font-semibold">
          {t("p.vendor.invoices.submit.title", undefined, "Submit an Invoice")}
        </h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.vendor.invoices.submit.description",
            undefined,
            "Send your invoice straight to the production team. It lands in their payables queue for review, and you can track its status below.",
          )}
        </p>
        <div className="mt-4">
          <FormShell
            action={submitVendorInvoice}
            submitLabel={t("p.vendor.invoices.submit.cta", undefined, "Submit Invoice")}
          >
            <input type="hidden" name="slug" value={slug} />
            <FormField label={t("p.vendor.invoices.submit.fields.title", undefined, "What is this for?")} required>
              <input
                name="title"
                required
                maxLength={200}
                placeholder={t(
                  "p.vendor.invoices.submit.fields.titlePlaceholder",
                  undefined,
                  "e.g. Staging labor, June 12 load-in",
                )}
                className="ps-input w-full"
              />
            </FormField>
            <FormField label={t("p.vendor.invoices.submit.fields.amount", undefined, "Amount (USD)")} required>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                className="ps-input w-full"
              />
            </FormField>
            <FormField
              label={t("p.vendor.invoices.submit.fields.po", undefined, "Purchase order")}
              hint={t(
                "p.vendor.invoices.submit.fields.poHint",
                undefined,
                "Referencing the PO speeds up approval.",
              )}
            >
              <select name="poId" defaultValue="" className="ps-input w-full">
                <option value="">{t("p.vendor.invoices.submit.fields.poNone", undefined, "No purchase order")}</option>
                {poOptions.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.number} · {po.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={t("p.vendor.invoices.submit.fields.receipt", undefined, "Backup document")}
              hint={t(
                "p.vendor.invoices.submit.fields.receiptHint",
                undefined,
                "PDF or image, up to 900 KB. Optional.",
              )}
            >
              <input
                name="receipt"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="ps-input w-full"
              />
            </FormField>
            <FormField label={t("p.vendor.invoices.submit.fields.note", undefined, "Note to the team")}>
              <textarea
                name="note"
                rows={3}
                maxLength={2000}
                placeholder={t(
                  "p.vendor.invoices.submit.fields.notePlaceholder",
                  undefined,
                  "Anything the reviewer should know…",
                )}
                className="ps-input w-full"
              />
            </FormField>
          </FormShell>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={t("p.vendor.invoices.empty.title", undefined, "No Invoices Yet")}
            description={t(
              "p.vendor.invoices.empty.descriptionV2",
              undefined,
              "Use the form above to submit your first invoice. Once it's in, you can track review and payment status right here.",
            )}
          />
        </div>
      ) : (
        <table className="ps-table mt-5 w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.vendor.invoices.col.number", undefined, "#")}</th>
              <th>{t("p.vendor.invoices.col.title", undefined, "Title")}</th>
              <th>{t("p.vendor.invoices.col.amount", undefined, "Amount")}</th>
              <th>{t("p.vendor.invoices.col.invoice_state", undefined, "Status")}</th>
              <th>{t("p.vendor.invoices.col.issued", undefined, "Issued")}</th>
              <th>{t("p.vendor.invoices.col.due", undefined, "Due")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.number ?? r.id.slice(0, 8)}</td>
                <td>{r.title ?? "—"}</td>
                <td className="font-mono text-xs">{money(r.amount_cents)}</td>
                <td>
                  <StatusBadge status={r.invoice_state} />
                </td>
                <td className="font-mono text-xs">{fmtDate(r.issued_at)}</td>
                <td className="font-mono text-xs">{fmtDate(r.due_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
