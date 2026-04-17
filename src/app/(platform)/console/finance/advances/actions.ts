"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  amount: z.string().min(1),
  reason: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createAdvanceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("advances").insert({
    org_id: session.orgId, requester_id: session.userId,
    amount_cents: dollarsToCents(parsed.data.amount),
    reason: parsed.data.reason || null,
    project_id: parsed.data.project_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/finance/advances");
  redirect("/console/finance/advances");
}
