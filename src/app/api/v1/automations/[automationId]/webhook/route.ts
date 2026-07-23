import type { NextRequest } from "next/server";
import { apiCreated, apiError } from "@/lib/api";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { keyFromRequest, ratelimit } from "@/lib/ratelimit";
import { log } from "@/lib/log";
import { runAutomation } from "@/lib/automations/run";

/**
 * Inbound automation webhook — Phase 4.3 of the SmartSuite parity roadmap.
 *
 * Open to unauthenticated callers (no `withAuth`); auth is the per-automation
 * HMAC secret in `automations.webhook_secret` verified against the
 * `X-Signature: sha256=<hex>` header. If no secret is set, accept unsigned
 * (development convenience) but log a warning so it shows up in audit feeds.
 *
 * Rate limit: 5 req/s per automation, matching SmartSuite's documented
 * ceiling. Body cap: 1 MB (returned as 413 if exceeded).
 *
 * Fires the automation in the background — the response is returned as soon
 * as the run row is inserted so callers don't sit on a long-running fetch.
 */

const BODY_LIMIT_BYTES = 1024 * 1024; // 1 MB
const RATE_BUDGET_PER_SECOND = 5;

async function constantTimeEqualHex(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyHmac(secret: string, body: string, header: string | null): Promise<boolean> {
  if (!header) return false;
  // Accept either `sha256=<hex>` (common convention) or a bare hex digest.
  const m = header.match(/^sha256=([a-f0-9]+)$/i);
  const provided = (m?.[1] ?? header).toLowerCase();
  if (!provided || provided.length !== 64) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return constantTimeEqualHex(provided, expected);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ automationId: string }> }) {
  const { automationId } = await params;
  if (!automationId) return apiError("bad_request", "Missing automation id");

  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }

  // Per-automation rate limit (5 req/s = ~300 req/min).
  const rl = await ratelimit({
    key: keyFromRequest(req, `automation-webhook:${automationId}`),
    max: RATE_BUDGET_PER_SECOND * 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "rate_limited", message: "Too many requests", retryAfter },
      }),
      {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": String(retryAfter) },
      },
    );
  }

  // Read raw body with a hard size cap.
  const rawBody = await req.text();
  if (rawBody.length > BODY_LIMIT_BYTES) {
    return apiError("bad_request", "Request body exceeds 1 MB limit");
  }

  // Look up the automation row via the centralized LooseSupabase shim
  // (the typed client's per-table overloads collapse to `never` when
  // the column set isn't yet in the regenerated database.types).
  const svc = createServiceClient() as unknown as LooseSupabase;
  const { data: autoRow, error: loadErr } = await svc
    .from("automations")
    .select("id, org_id, trigger_kind, enabled, webhook_secret")
    .eq("id", automationId)
    .maybeSingle();
  if (loadErr) return apiError("internal", `automation lookup failed: ${loadErr.message}`);
  type AutoRow = {
    id: string;
    org_id: string;
    trigger_kind: string;
    enabled: boolean;
    webhook_secret: string | null;
  };
  const automation = autoRow as AutoRow | null;
  if (!automation) return apiError("not_found", "Automation not found");
  if (!automation.enabled) return apiError("forbidden", "Automation is disabled");
  if (automation.trigger_kind !== "webhook") {
    return apiError("forbidden", `Automation trigger_kind is "${automation.trigger_kind}", not "webhook"`);
  }

  // Verify signature when a secret is set.
  if (automation.webhook_secret) {
    const sigHeader = req.headers.get("x-signature") ?? req.headers.get("X-Signature");
    const ok = await verifyHmac(automation.webhook_secret, rawBody, sigHeader);
    if (!ok) return apiError("unauthorized", "Invalid X-Signature");
  } else if (process.env.NODE_ENV === "production") {
    // Fail CLOSED in production: an automation UUID is guessable/leakable
    // (it appears in console URLs); without HMAC anyone holding it can
    // fire org automations with an arbitrary payload. Dev keeps the
    // unsigned convenience for local testing.
    log.error("automation.webhook.unsigned_rejected", {
      automationId: automation.id,
      orgId: automation.org_id,
    });
    return apiError(
      "forbidden",
      "This webhook requires a signing secret. Set one on the automation's trigger settings.",
    );
  } else {
    log.warn("automation.webhook.unsigned", {
      automationId: automation.id,
      orgId: automation.org_id,
      msg: "Accepting unsigned inbound webhook. Set webhook_secret to require HMAC verification.",
    });
  }

  // Parse JSON body (best-effort — empty bodies are fine, treated as `{}`).
  let parsed: Record<string, unknown> = {};
  if (rawBody.length > 0) {
    try {
      const v = JSON.parse(rawBody);
      if (v && typeof v === "object" && !Array.isArray(v)) {
        parsed = v as Record<string, unknown>;
      } else {
        parsed = { value: v };
      }
    } catch {
      return apiError("bad_request", "Invalid JSON body");
    }
  }

  // Insert pending run row up front so the UI sees the request immediately,
  // then dispatch in the background.
  const { data: runRow, error: insertErr } = await svc
    .from("automation_runs")
    .insert({
      automation_id: automation.id,
      org_id: automation.org_id,
      trigger_kind: "webhook",
      trigger_payload: parsed,
      run_state: "pending",
    })
    .select("id")
    .single();
  if (insertErr) return apiError("internal", `run insert failed: ${insertErr.message}`);
  const runId = (runRow as { id: string }).id;

  // Fire-and-forget — runAutomation updates the same row, sets status to
  // running/success/failed, and writes per-step ledger rows.
  void runAutomation({
    automationId: automation.id,
    triggerKind: "webhook",
    triggerPayload: parsed,
    existingRunId: runId,
  }).catch((err: unknown) => {
    log.warn("automation.webhook.run_failed", {
      automationId: automation.id,
      runId,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  return apiCreated({ runId });
}
