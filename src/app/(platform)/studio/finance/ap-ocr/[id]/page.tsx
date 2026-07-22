import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DownloadLink } from "@/components/DownloadLink";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { promoteExtractionToInvoice } from "../actions";

export const dynamic = "force-dynamic";

type State = "queued" | "extracting" | "extracted" | "review" | "matched" | "promoted" | "rejected" | "failed";

type LineItem = {
  description?: string;
  quantity?: number;
  unit_price_cents?: number;
  total_cents?: number;
};

type Extraction = {
  id: string;
  storage_path: string;
  file_name: string | null;
  size_bytes: number | null;
  state: State;
  vendor_name: string | null;
  vendor_tax_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  total_amount_cents: number | null;
  tax_amount_cents: number | null;
  currency: string | null;
  po_number: string | null;
  line_items: LineItem[] | null;
  confidence: number | null;
  model_version: string | null;
  matched_vendor_id: string | null;
  matched_purchase_order_id: string | null;
  promoted_invoice_id: string | null;
  uploaded_at: string;
  extracted_at: string | null;
  promoted_at: string | null;
  error_message: string | null;
  notes: string | null;
};

const STATE_TONE: Record<State, "muted" | "info" | "warning" | "success" | "error"> = {
  queued: "muted",
  extracting: "info",
  extracted: "info",
  review: "warning",
  matched: "info",
  promoted: "success",
  rejected: "muted",
  failed: "error",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const { id } = await params;

  const { data: row } = await supabase
    .from("ap_invoice_extractions")
    .select(
      "id, storage_path, file_name, size_bytes, state, vendor_name, vendor_tax_id, invoice_number, invoice_date, due_date, total_amount_cents, tax_amount_cents, currency, po_number, line_items, confidence, model_version, matched_vendor_id, matched_purchase_order_id, promoted_invoice_id, uploaded_at, extracted_at, promoted_at, error_message, notes",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const e = row as unknown as Extraction;

  // Signed preview URL for the stored PDF (uploaded via the service client to `receipts`).
  const svc = createServiceClient();
  const { data: signed } = await svc.storage.from("receipts").createSignedUrl(e.storage_path, 300);
  const previewUrl = signed?.signedUrl ?? null;

  const lineItems = Array.isArray(e.line_items) ? e.line_items : [];
  const canPromote = e.state === "extracted" || e.state === "review" || e.state === "matched";

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.finance.apOcr.eyebrow", undefined, "Finance")} · ${t("console.finance.apOcr.title", undefined, "AP Invoice OCR")}`}
        title={e.vendor_name ?? e.file_name ?? t("console.finance.apOcr.detail.untitled", undefined, "Extraction")}
        subtitle={`${e.invoice_number ? `#${e.invoice_number} · ` : ""}${e.total_amount_cents != null ? fmt.money(Number(e.total_amount_cents)) : "—"}${e.confidence != null ? ` · ${(Number(e.confidence) * 100).toFixed(0)}% ${t("console.finance.apOcr.detail.confidence", undefined, "confidence")}` : ""}`}
        breadcrumbs={[
          {
            label: t("console.finance.apOcr.eyebrow", undefined, "Finance"),
            href: "/studio/finance/ap-ocr",
          },
          {
            label: t("console.finance.apOcr.title", undefined, "AP Invoice OCR"),
            href: "/studio/finance/ap-ocr",
          },
          { label: e.invoice_number ?? e.file_name ?? id.slice(0, 8) },
        ]}
        action={
          <div className="flex items-center gap-2">
            {previewUrl && (
              <DownloadLink href={previewUrl}>
                {t("console.finance.apOcr.detail.viewFile", undefined, "View File")}
              </DownloadLink>
            )}
            {e.promoted_invoice_id && (
              <Button href={`/studio/finance/invoices/${e.promoted_invoice_id}`} size="sm" variant="secondary">
                {t("console.finance.apOcr.detail.openInvoice", undefined, "Open Invoice")}
              </Button>
            )}
            <Button href="/studio/finance/ap-ocr" size="sm" variant="ghost">
              {t("console.finance.apOcr.detail.allExtractions", undefined, "← All Extractions")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={STATE_TONE[e.state]}>{toTitle(e.state)}</Badge>
          {e.file_name && <span className="font-mono text-[var(--p-text-2)]">{e.file_name}</span>}
          {e.model_version && (
            <span className="font-mono text-[11px] text-[var(--p-text-2)]">{e.model_version}</span>
          )}
          {e.matched_vendor_id && (
            <a className="text-[var(--p-accent)] underline" href={`/studio/procurement/vendors/${e.matched_vendor_id}`}>
              {t("console.finance.apOcr.detail.matchedVendor", undefined, "Matched vendor")}
            </a>
          )}
          {e.matched_purchase_order_id && (
            <a
              className="text-[var(--p-accent)] underline"
              href={`/studio/procurement/purchase-orders/${e.matched_purchase_order_id}`}
            >
              {t("console.finance.apOcr.detail.matchedPo", undefined, "Matched PO")}
            </a>
          )}
        </div>

        {e.error_message && (
          <section className="surface space-y-1 p-4 text-xs">
            <h2 className="text-sm font-semibold text-[var(--p-danger)]">
              {t("console.finance.apOcr.detail.errorHeading", undefined, "Extraction error")}
            </h2>
            <p className="whitespace-pre-wrap text-[var(--p-text-2)]">{e.error_message}</p>
          </section>
        )}

        <div className="metric-grid">
          <Field label={t("console.finance.apOcr.column.vendor", undefined, "Vendor")}>
            {e.vendor_name ?? "—"}
          </Field>
          <Field label={t("console.finance.apOcr.detail.taxId", undefined, "Tax ID")} mono>
            {e.vendor_tax_id ?? "—"}
          </Field>
          <Field label={t("console.finance.apOcr.column.invoice", undefined, "Invoice #")} mono>
            {e.invoice_number ?? "—"}
          </Field>
          <Field label={t("console.finance.apOcr.detail.poNumber", undefined, "PO #")} mono>
            {e.po_number ?? "—"}
          </Field>
          <Field label={t("console.finance.apOcr.column.date", undefined, "Date")}>
            {e.invoice_date
              ? fmt.dateParts(e.invoice_date + "T00:00:00", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </Field>
          <Field label={t("console.finance.apOcr.detail.dueDate", undefined, "Due")}>
            {e.due_date
              ? fmt.dateParts(e.due_date + "T00:00:00", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </Field>
          <Field label={t("console.finance.apOcr.column.amount", undefined, "Total")} mono>
            {e.total_amount_cents != null ? fmt.money(Number(e.total_amount_cents)) : "—"}
          </Field>
          <Field label={t("console.finance.apOcr.detail.tax", undefined, "Tax")} mono>
            {e.tax_amount_cents != null ? fmt.money(Number(e.tax_amount_cents)) : "—"}
          </Field>
        </div>

        <section className="surface space-y-3 p-4">
          <h2 className="text-sm font-semibold">
            {t("console.finance.apOcr.detail.lineItems", undefined, "Line items")}
          </h2>
          {lineItems.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.finance.apOcr.detail.noLineItems", undefined, "No line items extracted.")}
            </p>
          ) : (
            <table className="ps-table w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">
                    {t("console.finance.apOcr.detail.lineDescription", undefined, "Description")}
                  </th>
                  <th className="text-right">{t("console.finance.apOcr.detail.lineQty", undefined, "Qty")}</th>
                  <th className="text-right">{t("console.finance.apOcr.detail.lineUnit", undefined, "Unit")}</th>
                  <th className="text-right">{t("console.finance.apOcr.detail.lineTotal", undefined, "Total")}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((l, i) => (
                  <tr key={i}>
                    <td>{l.description ?? "—"}</td>
                    <td className="text-right font-mono">{l.quantity ?? "—"}</td>
                    <td className="text-right font-mono">
                      {l.unit_price_cents != null ? fmt.money(Number(l.unit_price_cents)) : "—"}
                    </td>
                    <td className="text-right font-mono">
                      {l.total_cents != null ? fmt.money(Number(l.total_cents)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {canPromote && (
          <section className="surface space-y-3 p-4 text-xs">
            <h2 className="text-sm font-semibold">
              {t("console.finance.apOcr.detail.actionsHeading", undefined, "Actions")}
            </h2>
            <form action={promoteExtractionToInvoice}>
              <input type="hidden" name="extraction_id" value={e.id} />
              <Button type="submit" size="sm">
                {t("console.finance.apOcr.detail.promote", undefined, "Promote to Invoice")}
              </Button>
            </form>
          </section>
        )}

        {e.notes && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">{t("console.finance.apOcr.detail.notes", undefined, "Notes")}</h2>
            <p className="text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{e.notes}</p>
          </section>
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
