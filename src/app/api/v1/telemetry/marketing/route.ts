import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiError } from "@/lib/api";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Public marketing-analytics beacon — M3-05 / IK-039.
 *
 * Anonymous endpoint: visitors without a session still send telemetry
 * via `navigator.sendBeacon`. Writes into `usage_events` under a
 * canonical system org id so aggregation + retention rules apply the
 * same way as product usage.
 *
 * Why self-hosted instead of a third-party? Zero new infra, no PII
 * leaving our boundary, and every event becomes queryable via the
 * same SQL we use for billing usage. If the team later opts for
 * PostHog/Mixpanel, point this endpoint at them and flip a flag — the
 * client hook doesn't change.
 *
 * Schema lock: `event` is a dotted name from a closed list. Props are
 * free-form but the payload is capped at 2 KB to prevent abuse.
 */

const SYSTEM_ORG_ID = "00000000-0000-0000-0000-000000000000";

const MARKETING_EVENTS = [
  "marketing.theme.picked",
  "marketing.locale.switched",
  "marketing.cta.clicked",
  "marketing.page.viewed",
  "marketing.hero.cta_clicked",
  "marketing.pricing.plan_clicked",
  "marketing.signup.started",
] as const;

const Schema = z.object({
  event: z.enum(MARKETING_EVENTS),
  // Compact props map — every value must coerce to a short string. Keep
  // the payload small; this is telemetry, not an object store.
  props: z
    .record(z.string().min(1).max(64), z.union([z.string().max(256), z.number(), z.boolean(), z.null()]))
    .optional(),
});

const MAX_PAYLOAD_BYTES = 2048;

export async function POST(req: NextRequest) {
  // Reject oversized payloads before Zod so we don't spend Zod cycles on abuse.
  const body = await req.text();
  if (body.length > MAX_PAYLOAD_BYTES) {
    return apiError("bad_request", "Payload too large");
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return apiError("bad_request", "Invalid event shape");

  const { event, props } = parsed.data;

  // Capture context the client doesn't have to send — referrer, a coarse
  // path bucket, and a request id for correlation. We deliberately do NOT
  // capture the IP or UA here; those are out-of-scope for marketing
  // analytics and would create a privacy footgun.
  const referer = req.headers.get("referer") ?? null;
  const requestId = req.headers.get("x-request-id") ?? null;

  try {
      if (!isServiceClientAvailable()) {
        return apiError(
          "service_unavailable",
          "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
        );
      }
    const svc = createServiceClient();
    const { error } = await svc.from("usage_events").insert({
      org_id: SYSTEM_ORG_ID,
      actor_id: null,
      metric: event,
      quantity: 1,
      unit: "count",
      metadata: { ...(props ?? {}), referer, request_id: requestId } as never,
    });
    if (error) {
      log.warn("marketing.telemetry.insert_failed", { event, err: error.message });
    }
  } catch (e) {
    // Service client may be unconfigured in local dev. Don't block the
    // beacon response on it — the client sent-and-forgot anyway.
    log.warn("marketing.telemetry.unavailable", {
      event,
      err: e instanceof Error ? e.message : String(e),
    });
  }

  // Beacon convention: always 204-style success; failures are observability,
  // not user-facing. apiOk's { ok, data } keeps the shape consistent with
  // the rest of /api/v1/*.
  return apiOk({ received: true });
}

// Other methods (GET, PUT, PATCH, DELETE) are unhandled. Next.js returns
// a 405 Method Not Allowed automatically — the beacon is POST-only by contract.
