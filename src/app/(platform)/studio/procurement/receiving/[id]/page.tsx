import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecordActionButton } from "@/components/RecordActionButton";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { addReceiptLine, matchReceiptToPoAction } from "./actions";

export const dynamic = "force-dynamic";

function formatMinor(minor: number, currency = "USD"): string {
  return (minor / 100).toLocaleString("en-US", { style: "currency", currency });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.procurement.receiving.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: receipt } = await supabase
    .from("goods_receipts")
    .select("id, po_id, receipt_number, received_at, partial, notes")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!receipt) notFound();

  // PO header for context.
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, number, title, amount_cents, currency, po_state")
    .eq("id", receipt.po_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  // Line items belonging to this receipt's PO — the pickable lines for the
  // add-line form, and the join source for receipt-line descriptions.
  const { data: poLineData } = await supabase
    .from("po_line_items")
    .select("id, description, quantity, unit_price_cents, currency")
    .eq("purchase_order_id", receipt.po_id)
    .order("position");
  const poLines = (poLineData ?? []) as {
    id: string;
    description: string;
    quantity: number;
    unit_price_cents: number;
    currency: string;
  }[];
  const poLineById = new Map(poLines.map((l) => [l.id, l]));

  // Receipt lines (no org_id — scoped via receipt_id, RLS is the boundary).
  const { data: lineData } = await supabase
    .from("goods_receipt_lines")
    .select("id, po_line_item_id, qty_received, qty_rejected, notes")
    .eq("receipt_id", receipt.id);
  const lines = (lineData ?? []) as {
    id: string;
    po_line_item_id: string;
    qty_received: number;
    qty_rejected: number;
    notes: string | null;
  }[];

  // 3-way match rows for the PO.
  const { data: matchData } = await supabase
    .from("po_invoice_matches")
    .select("id, match_status, variance_minor, resolved_at, created_at")
    .eq("org_id", session.orgId)
    .eq("po_id", receipt.po_id)
    .order("created_at", { ascending: false });
  const matches = (matchData ?? []) as {
    id: string;
    match_status: string;
    variance_minor: number;
    resolved_at: string | null;
    created_at: string;
  }[];

  const poCurrency = po?.currency ?? "USD";

  // v7.8 record action gate — mirrors matchReceiptToPoAction: a complete
  // (non-partial) receipt against a sent/acknowledged PO can close it.
  const canMatch =
    isManagerPlus(session) && !receipt.partial && !!po && (po.po_state === "sent" || po.po_state === "acknowledged");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.receiving.detail.eyebrow", undefined, "Receiving")}
        title={receipt.receipt_number}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {po ? (
              <span className="text-xs">
                {po.number} · {po.title}
              </span>
            ) : null}
            <Badge variant={receipt.partial ? "warning" : "success"}>
              {receipt.partial
                ? t("console.procurement.receiving.detail.partial", undefined, "Partial")
                : t("console.procurement.receiving.detail.complete", undefined, "Complete")}
            </Badge>
            <span className="font-mono text-xs">{new Date(receipt.received_at).toLocaleDateString("en-US")}</span>
          </span>
        }
        action={
          canMatch ? (
            <RecordActionButton
              action={matchReceiptToPoAction.bind(null, receipt.id)}
              label={t("console.procurement.receiving.detail.confirmMatch", undefined, "Confirm Match · Close PO")}
              pendingLabel={t("console.procurement.receiving.detail.matching", undefined, "Matching…")}
            />
          ) : undefined
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {receipt.notes && <section className="surface p-4 text-sm whitespace-pre-wrap">{receipt.notes}</section>}

        {/* Received lines */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.procurement.receiving.detail.linesHeading", undefined, "Received lines")}
          </h3>
          {lines.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.procurement.receiving.detail.linesEmpty", undefined, "No lines received yet")}
              description={t(
                "console.procurement.receiving.detail.linesEmptyDescription",
                undefined,
                "Add a received line below to log quantities against the PO.",
              )}
            />
          ) : (
            <div className="surface overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>{t("console.procurement.receiving.detail.colItem", undefined, "Line item")}</th>
                    <th>{t("console.procurement.receiving.detail.colReceived", undefined, "Received")}</th>
                    <th>{t("console.procurement.receiving.detail.colRejected", undefined, "Rejected")}</th>
                    <th>{t("console.procurement.receiving.detail.colNotes", undefined, "Notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td>{poLineById.get(l.po_line_item_id)?.description ?? "—"}</td>
                      <td className="font-mono">{l.qty_received}</td>
                      <td className="font-mono">{l.qty_rejected}</td>
                      <td>{l.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add a received line */}
        {poLines.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
              {t("console.procurement.receiving.detail.addLineHeading", undefined, "Add received line")}
            </h3>
            <FormShell action={addReceiptLine.bind(null, receipt.id)} submitLabel={t("common.add", undefined, "Add")}>
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.procurement.receiving.detail.lineItemLabel", undefined, "PO line item")}
                </label>
                <select name="po_line_item_id" required className="ps-input mt-1.5 w-full" defaultValue="">
                  <option value="" disabled>
                    {t("console.procurement.receiving.detail.lineItemPlaceholder", undefined, "Select a line item…")}
                  </option>
                  {poLines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.description} · {l.quantity} @ {formatMinor(l.unit_price_cents, l.currency)}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={t("console.procurement.receiving.detail.qtyReceivedLabel", undefined, "Qty received")}
                name="qty_received"
                type="number"
                step="any"
                min="0"
                required
              />
              <Input
                label={t("console.procurement.receiving.detail.qtyRejectedLabel", undefined, "Qty rejected")}
                name="qty_rejected"
                type="number"
                step="any"
                min="0"
                defaultValue="0"
              />
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.procurement.receiving.detail.lineNotesLabel", undefined, "Notes")}
                </label>
                <textarea name="notes" rows={2} maxLength={1000} className="ps-input mt-1.5 w-full" />
              </div>
            </FormShell>
          </section>
        )}

        {/* 3-way match */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.procurement.receiving.detail.matchHeading", undefined, "3-way match")}
          </h3>
          {matches.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.procurement.receiving.detail.matchEmpty", undefined, "No invoice matches yet")}
              description={t(
                "console.procurement.receiving.detail.matchEmptyDescription",
                undefined,
                "Matches appear here once an invoice is reconciled against this PO and receipt.",
              )}
            />
          ) : (
            <div className="surface overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>{t("console.procurement.receiving.detail.colStatus", undefined, "Status")}</th>
                    <th>{t("console.procurement.receiving.detail.colVariance", undefined, "Variance")}</th>
                    <th>{t("console.procurement.receiving.detail.colResolved", undefined, "Resolved")}</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <StatusBadge status={m.match_status} />
                      </td>
                      <td className="font-mono">{formatMinor(m.variance_minor, poCurrency)}</td>
                      <td className="font-mono">
                        {m.resolved_at ? new Date(m.resolved_at).toLocaleDateString("en-US") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
