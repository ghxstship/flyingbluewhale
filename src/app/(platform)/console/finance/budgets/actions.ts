"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  name: z.string().min(1).max(120),
  amount: z.string().min(1),
  category: z.string().max(80).optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createBudgetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").insert({
    org_id: session.orgId, name: parsed.data.name,
    amount_cents: dollarsToCents(parsed.data.amount),
    category: parsed.data.category || null,
    project_id: parsed.data.project_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/finance/budgets");
  redirect("/console/finance/budgets");
}
