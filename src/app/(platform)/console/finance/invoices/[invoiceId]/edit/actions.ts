"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  title: z.string().min(1).max(200),
  number: z.string().min(1).max(80),
  amount_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
  due_at: z.string().optional().or(z.literal("")),
  issued_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateInvoice(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Invoice not found." };
  }
  revalidatePath(`/console/finance/invoices/${id}`);
  revalidatePath("/console/finance/invoices");
  redirect(`/console/finance/invoices/${id}`);
}

export async function deleteInvoice(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete — invoices has a deleted_at tombstone column.
  // Hard-deleting an invoice cascades onto invoice_line_items and
  // breaks Stripe-webhook reconciliation (which still receives
  // payment events for the deleted PI). Soft-delete preserves the
  // record + the .neq("status","paid") guard below refuses to
  // tombstone an already-paid invoice (use refund/void flows for
  // those — the audit trail must keep the paid record intact).
  await supabase
    .from("invoices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .neq("status", "paid")
    .is("deleted_at", null);
  revalidatePath("/console/finance/invoices");
  redirect("/console/finance/invoices");
}
