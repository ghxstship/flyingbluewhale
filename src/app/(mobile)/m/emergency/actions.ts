"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { managerUserIds } from "@/lib/db/managers";
import { sendPushBulk } from "@/lib/push/send";

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
 * Kit 32 E1 adds the third channel, `need_help` (documented in migration
 * 20260718030000_crisis_need_help_channel): the one response that IS an
 * alarm — it pushes an ops alert to the manager band on the `crisis` kind
 * so the muster desk hears it immediately. `muster_ack` / `self_safe` stay
 * silent: those are rows the console reads, not alarms; the unsilenceable
 * channel is reserved for the declaration and the call for help.
 *
 * Called programmatically by the offline queue's `send` (kit 21 W8), not by
 * useActionState — hence a plain-object input rather than FormData.
 */

/** channel values on crisis_alert_receipts — see migration 20260717130103. */
const Input = z.object({
  alertId: z.string().uuid(),
  response: z.enum(["muster_ack", "self_safe", "need_help"]),
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
    .select("id, title")
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

  // Kit 32 E1: "Need Help" is the one field response that must reach ops as
  // an alarm — push the manager band on the crisis kind (exempt from the
  // opt-out matrix, same as the declaration). The receipt row above is the
  // muster count's source of truth; this is the pager.
  if (parsed.data.response === "need_help") {
    const managers = await managerUserIds(session.orgId, session.userId);
    if (managers.length) {
      await sendPushBulk(managers, {
        title: "Safety Check-In · Needs Help",
        body: `${session.email ?? "A crew member"} · ${(alert as { title: string | null }).title ?? "Active crisis"}`,
        url: "/m/emergency",
        kind: "crisis",
        scope: "mobile",
        orgId: session.orgId,
      });
    }
  }

  // Both crisis surfaces render the caller's receipts: the Emergency card's
  // panel and the /m/alerts crisis log (kit 29).
  revalidatePath("/m/emergency");
  revalidatePath("/m/alerts");
  return { ok: true };
}
