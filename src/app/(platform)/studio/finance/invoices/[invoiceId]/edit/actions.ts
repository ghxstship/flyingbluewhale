"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/studio/finance/money";
import { INVOICE_TITLE_MAX_LENGTH } from "@/lib/validation/constraints";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(INVOICE_TITLE_MAX_LENGTH),
  number: z.string().min(1).max(80),
  // Integer cents from MoneyInput's hidden field — never a dollar string.
  amount_cents: moneyCentsString({ allowEmpty: true }),
  currency: z.string().min(1).max(3),
  due_at: z.string().optional().or(z.literal("")),
  issued_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/** A single parsed line-item row, position-indexed by its form ordinal. */
type ParsedLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
};

/**
 * Pull the repeating `li_*_N` fields out of the form. The editor emits a
 * `li_count` plus, per visible row N, `li_id_N` / `li_description_N` /
 * `li_quantity_N` / `li_unit_price_cents_N`. Blank-description rows are
 * dropped silently so a stray empty row never persists. Position is the
 * compacted ordinal (0-based) of the surviving rows.
 */
function parseLineItems(fd: FormData): ParsedLineItem[] {
  const count = Number(fd.get("li_count") ?? 0);
  if (!Number.isFinite(count) || count <= 0) return [];
  const out: ParsedLineItem[] = [];
  for (let i = 0; i < count; i++) {
    const description = String(fd.get(`li_description_${i}`) ?? "").trim();
    if (!description) continue;
    const qtyRaw = Number(fd.get(`li_quantity_${i}`));
    const priceRaw = Number(fd.get(`li_unit_price_cents_${i}`));
    out.push({
      id: String(fd.get(`li_id_${i}`) ?? "").trim(),
      description: description.slice(0, 500),
      quantity: Number.isFinite(qtyRaw) && qtyRaw >= 0 ? qtyRaw : 1,
      unit_price_cents: Number.isFinite(priceRaw) && priceRaw >= 0 ? Math.round(priceRaw) : 0,
      position: out.length,
    });
  }
  return out;
}

export async function updateInvoice(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.edit-invoices", "Only manager+ can edit invoices") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("invoices", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    number: parsed.data.number,
    amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
    currency: parsed.data.currency,
    due_at: parsed.data.due_at || null,
    issued_at: parsed.data.issued_at || null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.invoice", "Invoice not found.") };
  }

  // Reconcile invoice_line_items against the editor's submitted rows. RLS
  // scopes every statement to the caller's org via the parent invoice. We
  // (1) delete rows whose id is no longer present, then (2) upsert the
  // survivors keyed by (invoice_id, position) so positions stay dense and
  // re-orderable without orphaning ids.
  const supabase = await createClient();
  const items = parseLineItems(fd);
  const keptIds = items.map((it) => it.id).filter(Boolean);

  let delete_ = supabase.from("invoice_line_items").delete().eq("invoice_id", id);
  if (keptIds.length > 0) {
    delete_ = delete_.not("id", "in", `(${keptIds.join(",")})`);
  }
  const { error: delErr } = await delete_;
  if (delErr) return { error: `Could not update line items: ${delErr.message}` };

  if (items.length > 0) {
    const rows = items.map((it) => ({
      ...(it.id ? { id: it.id } : {}),
      invoice_id: id,
      description: it.description,
      quantity: it.quantity,
      unit_price_cents: it.unit_price_cents,
      position: it.position,
      currency: parsed.data.currency,
    }));
    const { error: upErr } = await supabase.from("invoice_line_items").upsert(rows);
    if (upErr) return { error: `Could not save line items: ${upErr.message}` };
  }

  revalidatePath(`/studio/finance/invoices/${id}/line-items`);
  revalidatePath(`/studio/finance/invoices/${id}`);
  revalidatePath("/studio/finance/invoices");
  redirect(`/studio/finance/invoices/${id}`);
}

export async function deleteInvoice(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete — invoices has a deleted_at tombstone column.
  // Hard-deleting an invoice cascades onto invoice_line_items and
  // breaks Stripe-webhook reconciliation (which still receives
  // payment events for the deleted PI). Soft-delete preserves the
  // record + the .neq("invoice_state","paid") guard below refuses to
  // tombstone an already-paid invoice (use refund/void flows for
  // those — the audit trail must keep the paid record intact).
  const { error } = await supabase
    .from("invoices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .neq("invoice_state", "paid")
    .is("deleted_at", null);
  if (error) throw new Error(`Could not archive invoice: ${error.message}`);
  revalidatePath("/studio/finance/invoices");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
