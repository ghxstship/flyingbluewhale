"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type BatchState = { ok?: number; error?: string } | null;

const Input = z.object({ ids: z.array(z.string().uuid()).min(1, "Select at least one asset.") });

/**
 * Batch check-in — flips a set of issued/transferred assignments to `returned`
 * in one pass. Org-scoped; only the caller's own assignments are touched and
 * only from a returnable state (server-enforced, mirrors NEXT_FULFILLMENT_STATES).
 */
export async function batchCheckIn(_prev: BatchState, fd: FormData): Promise<BatchState> {
  const session = await requireSession();
  const parsed = Input.safeParse({ ids: fd.getAll("ids").map(String) });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Select at least one asset." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .update({ fulfillment_state: "returned" })
    .eq("org_id", session.orgId)
    .eq("party_user_id", session.userId)
    .in("id", parsed.data.ids)
    .in("fulfillment_state", ["issued", "transferred", "delivered"])
    .select("id");
  if (error) return { error: error.message };
  revalidatePath("/m/check-in/batch");
  return { ok: data?.length ?? 0 };
}
