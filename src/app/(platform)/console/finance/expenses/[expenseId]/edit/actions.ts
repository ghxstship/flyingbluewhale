"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  description: z.string().min(1).max(500),
  amount_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
  category: z.string().max(120).optional().or(z.literal("")),
  status: z.string(),
  spent_at: z.string().min(1),
});

export type State = { error?: string } | null;

export async function updateExpense(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      description: parsed.data.description,
      amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
      currency: parsed.data.currency,
      category: parsed.data.category || null,
      status: parsed.data.status as "pending" | "approved" | "rejected" | "reimbursed",
      spent_at: parsed.data.spent_at,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/finance/expenses/${id}`);
  revalidatePath("/console/finance/expenses");
  redirect(`/console/finance/expenses/${id}`);
}

export async function deleteExpense(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/finance/expenses");
  redirect("/console/finance/expenses");
}
