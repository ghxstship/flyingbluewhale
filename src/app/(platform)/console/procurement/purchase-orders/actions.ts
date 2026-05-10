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
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      org_id: session.orgId,
      number: generateNumber("PO"),
      title: parsed.data.title,
      vendor_id: parsed.data.vendor_id || null,
      project_id: parsed.data.project_id || null,
      amount_cents: dollarsToCents(parsed.data.amount),
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/purchase-orders");
  redirect(`/console/procurement/purchase-orders/${data.id}`);
}

// PO FSM: draft → sent → acknowledged → fulfilled. Cancel allowed
// from any non-terminal state. Fulfilled + cancelled are terminal.
const PO_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["acknowledged", "cancelled"],
  acknowledged: ["fulfilled", "cancelled"],
  fulfilled: [], // terminal
  cancelled: [], // terminal
};

export async function setPoStatusAction(
  id: string,
  status: "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled",
) {
  const session = await requireSession();
  const supabase = await createClient();
  // Read current status so we can validate the transition + scope the
  // conditional update — without it a stale UI could move fulfilled
  // → draft and overwrite the historical record.
  const { data: row } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "Purchase order not found" };
  const current = row.status as string;
  const allowed = PO_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move ${current} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }
  const { data: updated, error } = await supabase
    .from("purchase_orders")
    .update({ status })
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("status", current as "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "PO status changed concurrently — refresh and retry" };
  revalidatePath(`/console/procurement/purchase-orders/${id}`);
  revalidatePath("/console/procurement/purchase-orders");
  return { ok: true as const };
}
