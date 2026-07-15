import { type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateOutboundUrl } from "@/lib/http-ssrf";
import { ACCEPTED_EVENT_INPUTS, normalizeWebhookEvent } from "@/lib/webhooks/events";

/**
 * /api/v1/webhooks/endpoints — outbound webhook registrations.
 * Resolves audit B2. GET lists, POST registers a new endpoint with a
 * freshly-minted HMAC secret (returned once; never re-exposed).
 */

/**
 * Subscribable events come from the shared registry — this route used to
 * carry its own hand-synced copy that had drifted from the emitter
 * (`ticket.scanned` was subscribable but could never fire; `offer_letter.*`
 * and `marketplace.inquiry_received` fired but weren't subscribable).
 * Deprecated names are still accepted and normalized on write so stored
 * integrator config keeps working.
 */
const PostSchema = z.object({
  url: z.string().url().startsWith("https://", "Use HTTPS (production). For local dev, register via SQL."),
  description: z.string().max(200).optional(),
  events: z.array(z.enum(ACCEPTED_EVENT_INPUTS)).min(1).max(ACCEPTED_EVENT_INPUTS.length),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("id, url, description, events, is_active, last_delivery_at, last_error, failure_count, created_at")
      .eq("org_id", session.orgId ?? "")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return apiError("internal", error.message);
    return apiOk({ endpoints: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    // SSRF guard at the security boundary — the Edge Function
    // (supabase/functions/job-worker/index.ts) does the actual
    // outbound POST in Deno and can't import this Node-only helper,
    // so we validate when the URL first lands in the table. DNS
    // resolves at this point; subsequent deliveries trust the
    // pre-validated URL (DNS rebinding mitigated by the per-host
    // circuit breaker on the worker side).
    const ssrf = await validateOutboundUrl(input.url);
    if (!ssrf.ok) {
      return apiError("bad_request", `Webhook URL rejected: ${ssrf.reason}`);
    }

    const supabase = await createClient();
    const secret = `whsec_${randomBytes(32).toString("base64url")}`;
    // Store the live event names. A subscriber posting a retired alias
    // gets the working equivalent persisted rather than a subscription
    // that silently never fires.
    const events = Array.from(new Set(input.events.map(normalizeWebhookEvent)));
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        org_id: session.orgId,
        url: input.url,
        description: input.description ?? null,
        events,
        secret,
        created_by: session.userId,
      })
      .select("id, url, description, events, is_active, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    // Secret returned ONCE at creation. The GET list never exposes it.
    return apiCreated({ endpoint: data, secret });
  });
}
