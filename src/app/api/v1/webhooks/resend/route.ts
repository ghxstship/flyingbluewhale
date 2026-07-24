import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { verifySvixSignature } from "@/lib/webhooks/svix";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { applyRecipientDelivery, type AdvanceDeliveryState } from "@/lib/db/advance-packets";
import { log } from "@/lib/log";

/**
 * POST /api/v1/webhooks/resend
 *
 * Resend outbound-events webhook — feeds real email delivery/open/bounce
 * signals into the advancing merge-engine funnel
 * (advance_send_recipients.delivery_state).
 *
 * Auth: Resend signs webhooks with svix headers (svix-id / svix-timestamp /
 * svix-signature); verification lives in src/lib/webhooks/svix.ts, keyed by
 * RESEND_WEBHOOK_SECRET. Missing secret → 503 (endpoint inactive), bad
 * signature → 401, stale timestamp (>5 min) → 401.
 *
 * Funnel mapping:
 *   email.delivered            → delivered
 *   email.opened               → opened
 *   email.bounced / complained → bounced
 *
 * The recipient is resolved by the Resend message id frozen into
 * render_snapshot at send time (sendBatchAction stores `resend_id`).
 *
 * Semantics:
 *  - `email.opened` (tracking pixel) and the portal-load 'opened' are the
 *    SAME funnel state by design — either signal means the recipient saw
 *    the invite; canAdvanceDelivery keeps whichever lands first.
 *  - `bounced` from the webhook covers ASYNC bounces (mailbox full, later
 *    rejection) that the synchronous send-time check can never see.
 *  - The funnel is forward-only: a late `email.delivered` arriving after
 *    the recipient already opened is a graceful no-op
 *    (applyRecipientDelivery returns false, never throws). We always
 *    answer 200 for known events so Resend doesn't retry forever.
 */

const ResendEventSchema = z.object({
  type: z.string(),
  created_at: z.string().optional(),
  data: z
    .object({
      email_id: z.string().optional(),
    })
    .passthrough(),
});

const EVENT_TO_DELIVERY: Record<string, AdvanceDeliveryState> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.complained": "bounced",
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return apiError("service_unavailable", "RESEND_WEBHOOK_SECRET not configured; endpoint inactive.");
  }

  // Verify against the RAW body — any re-serialization would break the HMAC.
  const body = await req.text();
  const ok = verifySvixSignature({
    secret,
    svixId: req.headers.get("svix-id") ?? "",
    svixTimestamp: req.headers.get("svix-timestamp") ?? "",
    svixSignature: req.headers.get("svix-signature") ?? "",
    body,
  });
  if (!ok) {
    return apiError("unauthorized", "Invalid webhook signature");
  }

  let parsed: z.infer<typeof ResendEventSchema>;
  try {
    parsed = ResendEventSchema.parse(JSON.parse(body));
  } catch {
    return apiError("bad_request", "Malformed Resend event payload");
  }

  const to = EVENT_TO_DELIVERY[parsed.type];
  if (!to) {
    // Unknown/unhandled event type — acknowledge so Resend doesn't retry.
    return apiOk({ handled: false, type: parsed.type });
  }

  const emailId = parsed.data.email_id;
  if (!emailId) {
    return apiOk({ handled: false, type: parsed.type, reason: "no email_id" });
  }

  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }
  const supabase = createServiceClient() as unknown as LooseSupabase;

  // jsonb text-extract match: render_snapshot->>'resend_id' = email_id —
  // the message id frozen into the snapshot by sendBatchAction at send time.
  const { data: recipients } = (await supabase
    .from("advance_send_recipients")
    .select("id, delivery_state")
    .eq("render_snapshot->>resend_id", emailId)
    .is("deleted_at", null)
    .limit(1)) as { data: Array<{ id: string; delivery_state: string }> | null };
  const recipient = recipients?.[0];
  if (!recipient) {
    // Not an advance-batch email (or snapshot predates resend_id capture) —
    // acknowledge; nothing to advance.
    return apiOk({ handled: false, type: parsed.type, matched: false });
  }

  // Forward-only: an out-of-order signal (late 'delivered' after 'opened')
  // returns false here rather than erroring — still a 200 to Resend.
  const advanced = await applyRecipientDelivery(supabase, recipient.id, to, {
    reason: `resend: ${parsed.type}`,
  });
  if (advanced) {
    log.info("resend_webhook.funnel_advanced", { type: parsed.type, recipientId: recipient.id, to });
  }
  return apiOk({ handled: true, type: parsed.type, matched: true, advanced });
}
