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

const HANDLERS: Record<string, Handler> = {
  // Example no-op handler. Replace with real implementations as new
  // job types are added. The dispatcher rejects any job whose type has
  // no entry so misroutes surface as dead-letter, not silent success.
  "audit.rollup": async (_job) => {
    // Placeholder — real rollup writes aggregates into audit_rollups.
  },
  "usage.aggregate": async (_job) => {
    // Placeholder — real aggregator sums usage_events into usage_rollups
    // keyed by (org_id, metric, bucket).
  },
  "notifications.digest": async (_job) => {
    // Placeholder — batches per-user notifications into daily digest email.
  },
  "passkey.cleanup": async (_job) => {
    // Placeholder — prunes unused passkeys after 90 days of inactivity.
  },
  "email.send": async (_job) => {
    // Placeholder — routes to lib/email.ts via Resend.
  },
  "stripe.reconcile": async (_job) => {
    // Placeholder — pulls the latest payment_intents and reconciles invoices.
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
    let q = (svc.from(table as never) as any)
      .select("*")
      .eq("org_id", run.org_id)
      .limit(50_000);
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
    const { error: upErr } = await svc.storage
      .from("exports")
      .upload(path, body, { contentType, upsert: true });
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

async function run(): Promise<{ claimed: number; completed: number; failed: number; reclaimed: number }> {
  const workerId = `edge-${crypto.randomUUID().slice(0, 8)}`;
  let reclaimed = 0;
  try {
    const { data } = await svc.rpc("reclaim_stuck_jobs");
    reclaimed = typeof data === "number" ? data : 0;
  } catch (_e) {
    // Non-fatal — a stale lease will time out on the next tick anyway.
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
      await svc.from("job_queue").update({ state: "done", completed_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      completed += 1;
    } catch (e) {
      await retryOrKill(job, e);
      failed += 1;
    }
  }

  return { claimed: jobs.length, completed, failed, reclaimed };
}

Deno.serve(async () => {
  const start = Date.now();
  try {
    const result = await run();
    return new Response(
      JSON.stringify({ ok: true, worker: "job-worker", duration_ms: Date.now() - start, ...result }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "worker_error", message: (e as Error).message } }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
