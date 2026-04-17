"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";

const Schema = z.object({
  title: z.string().min(1),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().min(1),
});

export type State = { error?: string } | null;

export async function createPoAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchase_orders").insert({
    org_id: session.orgId,
    number: generateNumber("PO"),
    title: parsed.data.title,
    vendor_id: parsed.data.vendor_id || null,
    project_id: parsed.data.project_id || null,
    amount_cents: dollarsToCents(parsed.data.amount),
    created_by: session.userId,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/purchase-orders");
  redirect(`/console/procurement/purchase-orders/${data.id}`);
}

export async function setPoStatusAction(id: string, status: "draft"|"sent"|"acknowledged"|"fulfilled"|"cancelled") {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("org_id", session.orgId).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/purchase-orders/${id}`);
  revalidatePath("/console/procurement/purchase-orders");
  return { ok: true as const };
}
