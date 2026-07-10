import "server-only";

import { createHmac } from "node:crypto";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { validateOutboundUrl } from "@/lib/http-ssrf";
import { log } from "@/lib/log";

/**
 * Console-triggered webhook delivery (F-11 zero-training DX).
 *
 * The steady-state pipeline is queue-based: `notify()` inserts a
 * `webhook_deliveries` row (state=pending) and the Supabase Edge Function
 * job-worker drains it with retry/backoff. These helpers give operators an
 * IMMEDIATE feedback loop from /studio/settings/webhooks:
 *
 *   - `sendTestEvent`   — synchronous signed `test.ping` POST to one endpoint
 *   - `redeliverLast`   — re-send the most recent delivery's stored payload
 *
 * Both record the attempt as a `webhook_deliveries` row (state
 * delivered/failed) so the console's Recent Deliveries table is the result
 * surface. Wire contract mirrors the job-worker exactly (same signature
 * scheme `t=<ms>,v1=<hex>` over `${ts}.${body}` with the endpoint secret,
 * same x-fbw-* headers) so a consumer can't tell a test from a real event.
 *
 * webhook_deliveries has SELECT-only RLS (writes are worker/service-side),
 * so the log insert uses the service client AFTER the endpoint has been
 * resolved through the caller's org-scoped RLS client.
 */

const TIMEOUT_MS = 8000;

type EndpointRow = {
  id: string;
  org_id: string;
  url: string;
  secret: string;
  is_active: boolean;
};

export type ManualDeliveryResult = {
  ok: boolean;
  status: number | null;
  error: string | null;
  eventType: string | null;
};

async function postSigned(
  endpoint: EndpointRow,
  eventType: string,
  deliveryId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  // SSRF guard — URLs were validated at registration, but re-validate at
  // send time (DNS may have changed; defense-in-depth).
  const ssrf = await validateOutboundUrl(endpoint.url);
  if (!ssrf.ok) return { ok: false, status: null, error: `blocked outbound URL: ${ssrf.reason}` };

  const body = JSON.stringify(payload);
  const ts = Date.now().toString();
  const sigHex = createHmac("sha256", endpoint.secret).update(`${ts}.${body}`).digest("hex");
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "flyingbluewhale-webhook/1",
        "x-fbw-event": eventType,
        "x-fbw-delivery": deliveryId,
        "x-fbw-signature": `t=${ts},v1=${sigHex}`,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(to);
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, error: null };
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: null, error: (e as Error).message || "fetch failed" };
  }
}

async function resolveEndpoint(orgId: string, endpointId: string): Promise<EndpointRow | null> {
  // Org-scoped RLS client — proves the caller can see this endpoint before
  // any service-role write happens.
  const supabase = await createClient();
  const { data } = await supabase
    .from("webhook_endpoints")
    .select("id, org_id, url, secret, is_active")
    .eq("org_id", orgId)
    .eq("id", endpointId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as EndpointRow | null) ?? null;
}

async function recordAndSend(
  endpoint: EndpointRow,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<ManualDeliveryResult> {
  if (!isServiceClientAvailable()) {
    return { ok: false, status: null, error: "service credentials unavailable", eventType };
  }
  const svc = createServiceClient();
  // Insert the journal row first so the outbound request can reference its id
  // (x-fbw-delivery), mirroring the worker's contract.
  const { data: inserted, error: insErr } = await svc
    .from("webhook_deliveries")
    .insert({
      endpoint_id: endpoint.id,
      org_id: endpoint.org_id,
      event_type: eventType,
      payload: payload as never,
      state: "pending",
      attempts: 1,
      max_attempts: 1, // manual sends never enter the retry loop
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    return { ok: false, status: null, error: insErr?.message ?? "delivery log insert failed", eventType };
  }

  const result = await postSigned(endpoint, eventType, inserted.id, payload);

  const { error: updErr } = await svc
    .from("webhook_deliveries")
    .update(
      result.ok
        ? { state: "delivered", delivered_at: new Date().toISOString(), last_status: result.status }
        : { state: "failed", last_status: result.status, last_error: result.error },
    )
    .eq("id", inserted.id);
  if (updErr) log.warn("webhook_deliveries.manual_update_failed", { id: inserted.id, err: updErr.message });

  // Keep the endpoint's denormalized health fields honest, same as the worker.
  const { error: epErr } = await svc
    .from("webhook_endpoints")
    .update(
      result.ok
        ? { last_delivery_at: new Date().toISOString(), failure_count: 0, last_error: null }
        : { last_error: result.error },
    )
    .eq("id", endpoint.id);
  if (epErr) log.warn("webhook_endpoints.manual_update_failed", { id: endpoint.id, err: epErr.message });

  return { ...result, eventType };
}

/** Synchronous signed test ping; records the attempt in webhook_deliveries. */
export async function sendTestEvent(orgId: string, endpointId: string): Promise<ManualDeliveryResult> {
  const endpoint = await resolveEndpoint(orgId, endpointId);
  if (!endpoint) return { ok: false, status: null, error: "endpoint not found", eventType: "test.ping" };
  return recordAndSend(endpoint, "test.ping", {
    id: null,
    type: "test.ping",
    title: "Test event",
    body: "Delivery test fired from the ATLVS console.",
    occurred_at: new Date().toISOString(),
    data: { endpoint_id: endpoint.id },
  });
}

/**
 * Re-send the most recent delivery's stored payload as a fresh attempt.
 * Returns a not-found error when the endpoint has no delivery history yet.
 */
export async function redeliverLast(orgId: string, endpointId: string): Promise<ManualDeliveryResult> {
  const endpoint = await resolveEndpoint(orgId, endpointId);
  if (!endpoint) return { ok: false, status: null, error: "endpoint not found", eventType: null };
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("webhook_deliveries")
    .select("event_type, payload")
    .eq("endpoint_id", endpointId)
    .eq("org_id", orgId)
    .neq("event_type", "test.ping")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return { ok: false, status: null, error: "no prior delivery to resend", eventType: null };
  return recordAndSend(endpoint, last.event_type, (last.payload ?? {}) as Record<string, unknown>);
}
