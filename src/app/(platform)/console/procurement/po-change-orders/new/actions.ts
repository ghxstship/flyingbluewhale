"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  purchase_order_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  reason: z.string().max(2000).optional(),
  amount: z.string().optional(),
  schedule_impact_days: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createPoChangeOrder(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Cross-tenant FK guard on purchase_order_id. Without bailing out on
  // a miss, an org-A user could attach a CO to an org-B PO since the
  // insert below doesn't re-validate the FK target.
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("project_id")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.purchase_order_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!po) return { error: "Purchase order not found in your organization" };

  // Next CO number for this PO.
  const { count } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (
          cols: string,
          opts: { count: "exact"; head: true },
        ) => {
          eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<{ count: number | null }> };
        };
      };
    }
  )
    .from("po_change_orders")
    .select("*", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("purchase_order_id", parsed.data.purchase_order_id);
  const nextNum = (count ?? 0) + 1;

  const amountCents = Math.round((Number(parsed.data.amount) || 0) * 100);
  const days = parseInt(parsed.data.schedule_impact_days ?? "0", 10) || 0;

  const { data, error } = await supabase
    .from("po_change_orders")
    .insert({
      org_id: session.orgId,
      project_id: po?.project_id ?? null,
      purchase_order_id: parsed.data.purchase_order_id,
      number: nextNum,
      title: parsed.data.title,
      reason: parsed.data.reason || null,
      amount_cents: amountCents,
      schedule_impact_days: days,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/po-change-orders");
  redirect(`/console/procurement/po-change-orders/${data.id}`);
}
