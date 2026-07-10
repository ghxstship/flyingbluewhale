"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateNumber } from "@/lib/format";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { actionFail, formFail } from "@/lib/forms/fail";
import { moneyCentsString } from "@/app/(platform)/studio/finance/money";
import { INVOICE_TITLE_MAX_LENGTH } from "@/lib/validation/constraints";

const Schema = z
  .object({
    title: z.string().min(1).max(INVOICE_TITLE_MAX_LENGTH),
    client_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    // Sea Trial R3 FINDING-019: invoices must be a positive amount.
    // Integer cents from MoneyInput's hidden field — do NOT run this
    // through dollarsToCents (100× trap).
    amount_cents: moneyCentsString({ allowZero: false }),
    currency: z.string().min(3).max(3).default("USD"),
    issued_at: z.string().date().optional().or(z.literal("")),
    due_at: z.string().date().optional().or(z.literal("")),
    notes: z.string().max(2000).optional(),
  })
  // Sea Trial R3 FINDING-020: when both supplied, due_at must not
  // precede issued_at — otherwise an invoice is "overdue" before it's
  // issued.
  .refine(...dateRangeRefine("issued_at", "due_at"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createInvoiceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Invoices are revenue documents that flow to Stripe + AR aging.
  // manager+ is the documented gate (matches the billing:write
  // capability that gates the Stripe checkout/portal endpoints).
  if (!isManagerPlus(session)) return { error: "Only manager+ can create invoices" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Cross-tenant FK guards. Invoices flow into finance reporting +
  // Stripe; a dangling client_id or project_id corrupts AR aging.
  const clientId = parsed.data.client_id || null;
  const projectId = parsed.data.project_id || null;
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!client) return { error: "Client not found in your organization" };
  }
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      org_id: session.orgId,
      number: generateNumber("INV"),
      title: parsed.data.title,
      client_id: clientId,
      project_id: projectId,
      amount_cents: Number(parsed.data.amount_cents),
      currency: parsed.data.currency.toUpperCase(),
      issued_at: parsed.data.issued_at || null,
      due_at: parsed.data.due_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/finance/invoices");
  revalidatePath("/studio/finance");
  redirect(`/studio/finance/invoices/${data.id}`);
}

export async function setInvoiceStatusAction(
  id: string,
  status: "draft" | "sent" | "paid" | "overdue" | "voided" | "submitted" | "approved" | "rejected",
) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can change invoice status" };
  const supabase = await createClient();
  const patch: { invoice_state: typeof status; paid_at?: string; approved_at?: string } = { invoice_state: status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  if (status === "approved") patch.approved_at = new Date().toISOString();
  const { data: before } = await supabase
    .from("invoices")
    .select("number, title, amount_cents, created_by")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!before) return { error: "Invoice not found in your organization" };
  const { error } = await supabase.from("invoices").update(patch).eq("org_id", session.orgId).eq("id", id);
  if (error) return { error: error.message };
  // Lifecycle emit → notification + webhook fan-out + optional email.
  if (before && (status === "paid" || status === "sent")) {
    const { notify } = await import("@/lib/notify");
    await notify({
      orgId: session.orgId,
      userId: before.created_by ?? session.userId,
      eventType: status === "paid" ? "invoice.paid" : "invoice.sent",
      title:
        status === "paid"
          ? `Invoice ${before.number ?? id.slice(0, 8)} paid`
          : `Invoice ${before.number ?? id.slice(0, 8)} sent`,
      body: before.title ?? undefined,
      href: `/studio/finance/invoices/${id}`,
      data: { invoiceId: id, amountCents: before.amount_cents, number: before.number },
    });
  }
  revalidatePath(`/studio/finance/invoices/${id}`);
  revalidatePath("/studio/finance/invoices");
  return { ok: true as const };
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk void invoices — the list-table counterpart to
 * `setInvoiceStatusAction`. manager+ only (matches the billing:write
 * gate); RLS pins every write to the session org. Paid and
 * already-voided invoices are skipped and reported — voiding a paid
 * invoice would silently desync AR aging from collected cash.
 */
export async function bulkVoidInvoices(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Void Invoices" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("invoices")
    .update({ invoice_state: "voided" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .not("invoice_state", "in", "(paid,voided)")
    .select("id");
  if (error) return { error: `Could Not Void: ${error.message}` };

  const voided = updated?.length ?? 0;
  const skipped = parsed.data.length - voided;
  revalidatePath("/studio/finance/invoices");
  revalidatePath("/studio/finance");
  if (skipped > 0) {
    return { error: `${voided} Voided · ${skipped} Skipped (paid or already voided)` };
  }
  return { message: `${voided} ${voided === 1 ? "Invoice" : "Invoices"} Voided` };
}
