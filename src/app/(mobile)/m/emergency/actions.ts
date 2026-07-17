"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * COMPVSS · Emergency — the field half of the crisis loop (crisis.respond).
 *
 * The console declares into `crisis_alerts` (fan-out already fixed — the
 * `crisis` push kind is in UNSILENCEABLE_KINDS, so declaring pings every
 * member regardless of their notification matrix; see
 * src/lib/push/unsilenceable.test.ts). This action records the FIELD's
 * answer: one `crisis_alert_receipts` row per response kind, discriminated
 * by the existing `channel` column so the baseline's UNIQUE
 * (alert_id, user_id, channel) makes every response an idempotent upsert —
 * an offline replay or a double tap cannot double-write.
 *
 * No push is sent from here: a mark-safe is a row the console reads, not an
 * alarm, and the unsilenceable channel is reserved for the declaration
 * itself.
 *
 * Called programmatically by the offline queue's `send` (kit 21 W8), not by
 * useActionState — hence a plain-object input rather than FormData.
 */

/** channel values on crisis_alert_receipts — see migration 20260717130103. */
const Input = z.object({
  alertId: z.string().uuid(),
  response: z.enum(["muster_ack", "self_safe"]),
});

export type RespondState = { error?: string; ok?: true } | null;

export async function respondToCrisisAction(input: {
  alertId: string;
  response: string;
}): Promise<RespondState> {
  const session = await requireSession();
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { error: "Invalid crisis response." };
  if (!hasSupabase) return { error: "Not configured." };

  const supabase = await createClient();

  // The alert must be the caller's org's. RLS enforces this too, but an
  // explicit read returns an honest error instead of a policy-shaped one —
  // and a queued response can replay days later, after the alert was deleted.
  const { data: alert } = await supabase
    .from("crisis_alerts")
    .select("id")
    .eq("id", parsed.data.alertId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!alert) return { error: "That alert no longer exists." };

  // A response is proof of delivery, so both timestamps move together.
  const now = new Date().toISOString();
  const { error } = await supabase.from("crisis_alert_receipts").upsert(
    {
      org_id: session.orgId,
      alert_id: parsed.data.alertId,
      user_id: session.userId,
      channel: parsed.data.response,
      delivered_at: now,
      acknowledged_at: now,
    },
    { onConflict: "alert_id,user_id,channel" },
  );
  if (error) return { error: error.message };

  revalidatePath("/m/emergency");
  return { ok: true };
}
