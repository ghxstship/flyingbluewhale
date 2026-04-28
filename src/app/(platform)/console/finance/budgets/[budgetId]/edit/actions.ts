"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(120).optional().or(z.literal("")),
  amount_cents: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateBudget(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .update({
      name: parsed.data.name,
      category: parsed.data.category || null,
      amount_cents: parsed.data.amount_cents ? Number(parsed.data.amount_cents) : 0,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/finance/budgets/${id}`);
  revalidatePath("/console/finance/budgets");
  redirect(`/console/finance/budgets/${id}`);
}

export async function deleteBudget(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("budgets").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/finance/budgets");
  redirect("/console/finance/budgets");
}
