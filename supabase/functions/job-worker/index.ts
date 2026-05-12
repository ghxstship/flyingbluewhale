// Background job worker — H3-02 / IK-027.
//
// Supabase Edge Function. Invoke on a 1-minute cron via
//   supabase functions deploy job-worker --no-verify-jwt
//   supabase functions schedule create job-worker "*/1 * * * *"
//
// Each invocation:
//   1. reclaims leases whose worker died mid-run
//   2. claims up to `BATCH` pending jobs with a 2-minute visibility lease
//   3. dispatches each job to its type handler
//   4. completes on success; failures go through exponential backoff or to DLQ
//
// Handlers are deliberately tiny — most business logic lives in the app;
// the worker is just the dispatcher. Unknown job types land in DLQ so a
// typo can't silently drain the queue.
//
// Deno runtime, not Node. Don't import from src/lib — this is a separate
// deployment target.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BATCH = parseInt(Deno.env.get("JOB_WORKER_BATCH") ?? "10", 10);
const VISIBILITY_S = parseInt(Deno.env.get("JOB_WORKER_VISIBILITY_S") ?? "120", 10);

const svc = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Job = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

type Handler = (job: Job) => Promise<void>;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

async function getFailureCount(endpointId: string): Promise<number> {
  const { data } = await svc.from("webhook_endpoints").select("failure_count").eq("id", endpointId).maybeSingle();
  return (data as { failure_count?: number } | null)?.failure_count ?? 0;
}

// HMAC-signed outbound webhook delivery with exponential backoff.
async function deliverWebhook(delivery: {
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}): Promise<void> {
  const { data: endpoint } = await svc
    .from("webhook_endpoints")
    .select("url, secret, is_active, deleted_at")
    .eq("id", delivery.endpoint_id)
    .maybeSingle();
  type Ep = { url: string; secret: string; is_active: boolean; deleted_at: string | null };
  const ep = endpoint as Ep | null;
  if (!ep || !ep.is_active || ep.deleted_at) {
    await svc
      .from("webhook_deliveries")
      .update({ state: "dead", last_error: "endpoint missing/inactive" })
      .eq("id", delivery.id);
    return;
  }
  const body = JSON.stringify(delivery.payload);
  const ts = Date.now().toString();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(ep.secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${body}`));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  let status = 0;
  let errMsg: string | null = null;
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "flytehaus-webhook/1",
        "x-fth-event": delivery.event_type,
        "x-fth-delivery": delivery.id,
        "x-fth-signature": `t=${ts},v1=${sigHex}`,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(to);
    status = res.status;
    if (res.status >= 200 && res.status < 300) {
      await svc
        .from("webhook_deliveries")
        .update({ state: "delivered", delivered_at: new Date().toISOString(), last_status: status })
        .eq("id", delivery.id);
      await svc
        .from("webhook_endpoints")
        .update({ last_delivery_at: new Date().toISOString(), failure_count: 0, last_error: null })
        .eq("id", delivery.endpoint_id);
      return;
    }
    errMsg = `HTTP ${status}`;
  } catch (e) {
    errMsg = (e as Error).message || "fetch failed";
  }
  const nextAttempts = delivery.attempts + 1;
  if (nextAttempts >= delivery.max_attempts) {
    await svc
      .from("webhook_deliveries")
      .update({ state: "dead", attempts: nextAttempts, last_status: status, last_error: errMsg })
      .eq("id", delivery.id);
    await svc
      .from("webhook_endpoints")
      .update({ last_error: errMsg, failure_count: (await getFailureCount(delivery.endpoint_id)) + 1 })
      .eq("id", delivery.endpoint_id);
    return;
  }
  const backoffS = Math.min(600, Math.round(2 ** nextAttempts * (0.5 + Math.random())));
  await svc
    .from("webhook_deliveries")
    .update({
      state: "pending",
      attempts: nextAttempts,
      last_status: status,
      last_error: errMsg,
      next_attempt_at: new Date(Date.now() + backoffS * 1000).toISOString(),
    })
    .eq("id", delivery.id);
}

async function drainWebhookDeliveries(limit = 20): Promise<number> {
  const { data } = await svc
    .from("webhook_deliveries")
    .select("id, endpoint_id, event_type, payload, attempts, max_attempts")
    .eq("state", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  type D = {
    id: string;
    endpoint_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    attempts: number;
    max_attempts: number;
  };
  const rows = (data ?? []) as D[];
  for (const row of rows) await deliverWebhook(row);
  return rows.length;
}

const HANDLERS: Record<string, Handler> = {
  "audit.rollup": async (job) => {
    const orgId = job.payload.orgId as string | undefined;
    const since = (job.payload.since as string | undefined) ?? new Date(Date.now() - 30 * 864e5).toISOString();
    const q = svc.from("audit_log").select("actor_id, action").gte("created_at", since).limit(10_000);
    if (orgId) void q.eq("org_id", orgId);
    await q;
  },
  "usage.aggregate": async () => {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    try {
      await svc.rpc("rollup_usage_for_date", { p_date: yesterday });
    } catch {
      /* RPC optional */
    }
  },
  "notifications.digest": async (job) => {
    const orgId = job.payload.orgId as string | undefined;
    const since = new Date(Date.now() - 864e5).toISOString();
    let q = svc
      .from("notifications")
      .select("user_id, title, body, href, created_at")
      .is("read_at", null)
      .is("deleted_at", null)
      .gte("created_at", since);
    if (orgId) q = q.eq("org_id", orgId);
    const { data: unread } = await q;
    type Row = { user_id: string; title: string; body: string | null; href: string | null; created_at: string };
    const byUser = new Map<string, Row[]>();
    for (const n of (unread ?? []) as Row[]) {
      const list = byUser.get(n.user_id) ?? [];
      list.push(n);
      byUser.set(n.user_id, list);
    }
    for (const [userId, list] of byUser) {
      const { data: user } = await svc.from("users").select("email").eq("id", userId).maybeSingle();
      const email = (user as { email?: string } | null)?.email;
      if (!email) continue;
      await svc.from("job_queue").insert({
        type: "email.send",
        org_id: orgId ?? null,
        payload: {
          to: email,
          subject: `Your FLYTEHAUS digest (${list.length} new)`,
          html:
            `<h2>${list.length} new notifications</h2>` +
            list
              .map((n) => `<p><strong>${escapeHtml(n.title)}</strong>${n.body ? `<br>${escapeHtml(n.body)}` : ""}</p>`)
              .join(""),
        },
      });
    }
  },
  "passkey.cleanup": async () => {
    const cutoff = new Date(Date.now() - 90 * 864e5).toISOString();
    await svc.from("webauthn_credentials").delete().lt("last_used_at", cutoff);
  },
  "email.send": async (job) => {
    const { to, subject, html, text } = job.payload as {
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
    };
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "FLYTEHAUS Technologies <no-reply@flytehaus.live>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
  },
  "stripe.reconcile": async () => {
    const secret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secret) return;
    const res = await fetch("https://api.stripe.com/v1/payment_intents?limit=100", {
      headers: { authorization: `Bearer ${secret}` },
    });
    if (!res.ok) throw new Error(`stripe ${res.status}`);
    const body = (await res.json()) as {
      data: Array<{ id: string; status: string; amount_received: number; metadata?: Record<string, string> }>;
    };
    for (const pi of body.data ?? []) {
      if (pi.status !== "succeeded") continue;
      const invoiceId = pi.metadata?.invoice_id;
      if (!invoiceId) continue;
      await svc
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoiceId)
        .neq("status", "paid");
    }
  },
  // Phase 4.1 placeholder. The automation runner lives in `src/lib/automations/run.ts`
  // and depends on Node-side packages (notify(), sendEmail(), Supabase typed
  // client) that don't transpile cleanly to Deno. To keep the runner in one
  // place we delegate to a Next.js API route inside the app — Phase 4.3 will
  // wire that route alongside the schedule trigger. Until then, manual runs
  // call `runAutomation` directly from the server action; this handler exists
  // only so that pre-Phase-4.3 enqueues don't land in the dead-letter queue.
  "automation.run": async (job) => {
    const automationId = job.payload.automationId as string | undefined;
    const runId = job.payload.runId as string | undefined;
    if (!automationId) throw new Error("automation.run: missing automationId");
    const appUrl = Deno.env.get("APP_INTERNAL_URL");
    const workerToken = Deno.env.get("JOB_WORKER_TOKEN");
    if (!appUrl || !workerToken) {
      // No call-back URL configured — mark the run row failed so the UI
      // doesn't show it stuck pending forever.
      if (runId) {
        await svc
          .from("automation_runs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            error_summary: "automation.run handler not wired (APP_INTERNAL_URL/JOB_WORKER_TOKEN unset)",
          })
          .eq("id", runId);
      }
      return;
    }
    const res = await fetch(`${appUrl}/api/v1/automations/${automationId}/run`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-worker-token": workerToken,
      },
      body: JSON.stringify({
        triggerKind: (job.payload.triggerKind as string | undefined) ?? "schedule",
        triggerPayload: job.payload.triggerPayload ?? {},
        existingRunId: runId,
      }),
    });
    if (!res.ok) throw new Error(`automation.run callback ${res.status}: ${await res.text()}`);
  },
  // Phase 4.3 — drain `domain_events` and fan out to subscribed automations.
  // The Edge runtime can't import from src/lib (Node-side `server-only`), so
  // we proxy through an internal Next.js route gated by the same worker
  // token. Idempotent: the route uses partial-unique-index dedup_key on
  // (automation_id, event_id) to avoid double-fire across racing ticks.
  "automation.dispatch": async () => {
    const appUrl = Deno.env.get("APP_INTERNAL_URL");
    const workerToken = Deno.env.get("JOB_WORKER_TOKEN");
    if (!appUrl || !workerToken) return;
    const res = await fetch(`${appUrl}/api/v1/internal/automations/dispatch`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-worker-token": workerToken },
    });
    if (!res.ok) throw new Error(`automation.dispatch callback ${res.status}: ${await res.text()}`);
  },
  // Phase 4.3 — evaluate due `automation_schedules` rows and enqueue runs.
  "automation.schedule": async () => {
    const appUrl = Deno.env.get("APP_INTERNAL_URL");
    const workerToken = Deno.env.get("JOB_WORKER_TOKEN");
    if (!appUrl || !workerToken) return;
    const res = await fetch(`${appUrl}/api/v1/internal/automations/schedule`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-worker-token": workerToken },
    });
    if (!res.ok) throw new Error(`automation.schedule callback ${res.status}: ${await res.text()}`);
  },
  "webhook.deliver": async (job) => {
    const deliveryId = job.payload.deliveryId as string | undefined;
    if (!deliveryId) throw new Error("webhook.deliver: missing deliveryId");
    const { data } = await svc
      .from("webhook_deliveries")
      .select("id, endpoint_id, event_type, payload, attempts, max_attempts")
      .eq("id", deliveryId)
      .maybeSingle();
    type D = {
      id: string;
      endpoint_id: string;
      event_type: string;
      payload: Record<string, unknown>;
      attempts: number;
      max_attempts: number;
    };
    const row = data as D | null;
    if (row) await deliverWebhook(row);
  },
  // Async Export Centre handler — Opportunity #8 part D. Expects payload
  // { exportRunId }. Reads the run row, pulls rows from the requested
  // table, renders CSV or JSON, uploads to the `exports` bucket, then
  // flips status→done with file_path + size + row count. XLSX + ZIP still
  // go through the sync POST path because their generators aren't
  // Deno-friendly; this worker exists so large CSV/JSON dumps that
  // exceed the 10s statement_timeout can finish in the background.
  "export.package": async (job) => {
    const runId = (job.payload.exportRunId ?? job.payload.runId) as string | undefined;
    if (!runId) throw new Error("export.package: missing exportRunId");

    const { data: run, error: readErr } = await svc
      .from("export_runs")
      .select("id, org_id, kind, params")
      .eq("id", runId)
      .maybeSingle();
    if (readErr || !run) throw new Error("export run not found");

    const params = (run.params ?? {}) as { table?: string; projectId?: string };
    const table = params.table;
    if (!table) throw new Error("export.package: params.table missing");

    const SUPPORTED = new Set(["csv", "json"]);
    if (!SUPPORTED.has(run.kind)) {
      throw new Error(`export.package: kind=${run.kind} must use the sync path`);
    }

    await svc.from("export_runs").update({ status: "running" }).eq("id", run.id);

    // Select rows. RLS is bypassed here because we hold service_role;
    // enforce org scoping manually via the org_id filter. Narrow to
    // 50k rows to stay well within Edge Function memory/time budgets.
    let q = (svc.from(table as never) as any).select("*").eq("org_id", run.org_id).limit(50_000);
    if (params.projectId) q = q.eq("project_id", params.projectId);
    const { data: rows, error: selErr } = await q;
    if (selErr) throw new Error(`select failed: ${selErr.message}`);
    const list = (rows ?? []) as Record<string, unknown>[];

    // Render. CSV uses a tiny inline writer so we avoid pulling in any
    // npm. JSON is trivial.
    let body: Uint8Array;
    let contentType: string;
    let ext: string;
    if (run.kind === "json") {
      body = new TextEncoder().encode(JSON.stringify(list, null, 2));
      contentType = "application/json";
      ext = "json";
    } else {
      body = new TextEncoder().encode(renderCsv(list));
      contentType = "text/csv";
      ext = "csv";
    }

    const path = `${run.org_id}/${run.id}.${ext}`;
    const { error: upErr } = await svc.storage.from("exports").upload(path, body, { contentType, upsert: true });
    if (upErr) throw new Error(`upload failed: ${upErr.message}`);

    await svc
      .from("export_runs")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        file_path: path,
        size_bytes: body.byteLength,
        row_count: list.length,
        last_error: null,
      })
      .eq("id", run.id);
  },
};

function renderCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

async function retryOrKill(job: Job, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (job.attempts >= job.max_attempts) {
    await svc.from("job_queue").update({ state: "dead", last_error: msg }).eq("id", job.id);
    return;
  }
  // Exponential backoff with jitter, capped at 10 min.
  const backoffS = Math.min(600, Math.round(2 ** job.attempts * (0.5 + Math.random())));
  const nextRun = new Date(Date.now() + backoffS * 1000).toISOString();
  await svc
    .from("job_queue")
    .update({
      state: "pending",
      last_error: msg,
      run_at: nextRun,
      locked_by: null,
      locked_until: null,
    })
    .eq("id", job.id);
}

async function run(): Promise<{
  claimed: number;
  completed: number;
  failed: number;
  reclaimed: number;
  webhooks: number;
  automationTicksEnqueued: number;
}> {
  const workerId = `edge-${crypto.randomUUID().slice(0, 8)}`;
  let reclaimed = 0;
  try {
    const { data } = await svc.rpc("reclaim_stuck_jobs");
    reclaimed = typeof data === "number" ? data : 0;
  } catch (_e) {
    // Non-fatal — a stale lease will time out on the next tick anyway.
  }

  // Drain pending webhook deliveries separately from job_queue so the
  // outbox stays responsive even when the main queue is busy.
  let webhooks = 0;
  try {
    webhooks = await drainWebhookDeliveries(20);
  } catch (_e) {
    /* best-effort */
  }

  // Phase 4.3 — enqueue per-tick automation dispatch + schedule jobs.
  // Both are idempotent on a per-tick basis via dedup_key on the minute
  // boundary, so even if Supabase cron double-invokes us, the queue holds
  // exactly one of each. The handlers themselves proxy through the Next.js
  // app where the actual logic lives (Edge runtime cannot import from src/lib).
  let automationTicksEnqueued = 0;
  const tickStamp = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
  for (const tickType of ["automation.dispatch", "automation.schedule"] as const) {
    try {
      const { error } = await svc.from("job_queue").insert({
        type: tickType,
        org_id: "00000000-0000-0000-0000-000000000000",
        payload: {},
        dedup_key: `${tickType}:${tickStamp}`,
      });
      if (!error) automationTicksEnqueued += 1;
      // Duplicate-key collisions are expected on cron retries — swallow.
    } catch (_e) {
      /* best-effort */
    }
  }

  const { data: batch, error } = await svc.rpc("claim_jobs", {
    p_batch: BATCH,
    p_visibility_s: VISIBILITY_S,
    p_worker: workerId,
  });
  if (error) throw error;
  const jobs = (batch ?? []) as Job[];

  let completed = 0;
  let failed = 0;
  for (const job of jobs) {
    const handler = HANDLERS[job.type];
    if (!handler) {
      await retryOrKill(job, new Error(`unknown job type: ${job.type}`));
      failed += 1;
      continue;
    }
    try {
      await handler(job);
      await svc
        .from("job_queue")
        .update({ state: "done", completed_at: new Date().toISOString(), last_error: null })
        .eq("id", job.id);
      completed += 1;
    } catch (e) {
      await retryOrKill(job, e);
      failed += 1;
    }
  }

  return { claimed: jobs.length, completed, failed, reclaimed, webhooks, automationTicksEnqueued };
}

// The function is deployed with verify_jwt=false because Supabase cron and
// Vercel cron call it without a Supabase auth token. We gate on a shared
// worker token instead — set `JOB_WORKER_TOKEN` as a function secret and
// pass it via `Authorization: Bearer <token>` or the `x-worker-token`
// header from the cron caller. If unset, the function refuses requests
// (fail-closed) — better to under-process the queue than to expose a
// publicly-triggerable run loop.
Deno.serve(async (req: Request) => {
  const expected = Deno.env.get("JOB_WORKER_TOKEN");
  if (!expected) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "misconfigured", message: "JOB_WORKER_TOKEN not set" } }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-worker-token") ?? "");
  if (provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: { code: "forbidden", message: "Invalid worker token" } }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const start = Date.now();
  try {
    const result = await run();
    return new Response(
      JSON.stringify({ ok: true, worker: "job-worker", duration_ms: Date.now() - start, ...result }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: { code: "worker_error", message: (e as Error).message } }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
