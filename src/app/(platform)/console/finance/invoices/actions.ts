"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";
import { dateRangeRefine } from "@/lib/zod/dateRange";

const Schema = z
  .object({
    title: z.string().min(1).max(200),
    client_id: z.string().uuid().optional().or(z.literal("")),
    project_id: z.string().uuid().optional().or(z.literal("")),
    // Sea Trial R3 FINDING-019: invoices must be a positive dollar amount.
    amount: moneyDollarsString({ allowZero: false }),
    currency: z.string().min(3).max(3).default("USD"),
    issued_at: z.string().date().optional().or(z.literal("")),
    due_at: z.string().date().optional().or(z.literal("")),
    notes: z.string().max(2000).optional(),
  })
  // Sea Trial R3 FINDING-020: when both supplied, due_at must not
  // precede issued_at — otherwise an invoice is "overdue" before it's
  // issued.
  .refine(...dateRangeRefine("issued_at", "due_at"));

export type State = { error?: string } | null;

export async function createInvoiceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

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
      amount_cents: dollarsToCents(parsed.data.amount),
      currency: parsed.data.currency.toUpperCase(),
      issued_at: parsed.data.issued_at || null,
      due_at: parsed.data.due_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/finance/invoices");
  revalidatePath("/console/finance");
  redirect(`/console/finance/invoices/${data.id}`);
}

export async function setInvoiceStatusAction(id: string, status: "draft" | "sent" | "paid" | "overdue" | "voided") {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: { status: typeof status; paid_at?: string } = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
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
      href: `/console/finance/invoices/${id}`,
      data: { invoiceId: id, amountCents: before.amount_cents, number: before.number },
    });
  }
  revalidatePath(`/console/finance/invoices/${id}`);
  revalidatePath("/console/finance/invoices");
  return { ok: true as const };
}
