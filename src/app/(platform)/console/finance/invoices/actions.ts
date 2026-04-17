"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";

const Schema = z.object({
  title: z.string().min(1).max(200),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().min(1),
  currency: z.string().min(3).max(3).default("USD"),
  issued_at: z.string().date().optional().or(z.literal("")),
  due_at: z.string().date().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createInvoiceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      org_id: session.orgId,
      number: generateNumber("INV"),
      title: parsed.data.title,
      client_id: parsed.data.client_id || null,
      project_id: parsed.data.project_id || null,
      amount_cents: dollarsToCents(parsed.data.amount),
      currency: parsed.data.currency.toUpperCase(),
      issued_at: parsed.data.issued_at || null,
      due_at: parsed.data.due_at || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select().single();
  if (error) return { error: error.message };
  revalidatePath("/console/finance/invoices");
  revalidatePath("/console/finance");
  redirect(`/console/finance/invoices/${data.id}`);
}

export async function setInvoiceStatusAction(id: string, status: "draft"|"sent"|"paid"|"overdue"|"voided") {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: { status: typeof status; paid_at?: string } = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  const { error } = await supabase.from("invoices").update(patch).eq("org_id", session.orgId).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/console/finance/invoices/${id}`);
  revalidatePath("/console/finance/invoices");
  return { ok: true as const };
}
