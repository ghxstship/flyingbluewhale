"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  description: z.string().min(1).max(500),
  amount: z.string().min(1),
  category: z.string().max(80).optional().or(z.literal("")),
  spent_at: z.string().date(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createExpenseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    org_id: session.orgId,
    submitter_id: session.userId,
    description: parsed.data.description,
    amount_cents: dollarsToCents(parsed.data.amount),
    category: parsed.data.category || null,
    spent_at: parsed.data.spent_at,
    project_id: parsed.data.project_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/finance/expenses");
  redirect("/console/finance/expenses");
}
