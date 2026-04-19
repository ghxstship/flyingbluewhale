import "server-only";
import { createServiceClient } from "./supabase/server";
import { log } from "./log";

/**
 * Background job primitive — H3-02 / IK-027.
 *
 * Tiny façade over `job_queue`. Enqueue + list + complete + fail. The
 * claim path is exposed through the Supabase RPC `claim_jobs()` and is
 * only invoked from the `job-worker` Edge Function (service_role).
 *
 * Retry policy: exponential backoff with jitter, capped at 10 min.
 * After `max_attempts` (default 5) a job transitions to `dead`. A
 * human operator is expected to triage the dead-letter queue via
 * `list_dead(orgId)` or SQL.
 *
 * Idempotency: pass `dedupKey` to prevent a second enqueue while the
 * first is pending or running. DB-enforced by the partial unique index
 * `job_queue_dedup_idx`.
 */

export type JobType =
  | "stripe.reconcile"
  | "usage.aggregate"
  | "email.send"
  | "notifications.digest"
  | "passkey.cleanup"
  | "audit.rollup";

export type JobRow = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  org_id: string;
  state: "pending" | "running" | "done" | "failed" | "dead";
  attempts: number;
  max_attempts: number;
  run_at: string;
  locked_by: string | null;
  locked_until: string | null;
  last_error: string | null;
  dedup_key: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

/**
 * Exponential backoff with jitter, capped at 10 minutes.
 * Extracted so the math can be unit-tested without a DB.
 *
 *   attempt 0: 1-2s · attempt 1: 2-4s · 2: 4-8s · 3: 8-16s · 4: 16-32s
 *   attempt 7+: clamped to 300-600s (10-min max)
 *
 * `rand` is injectable for deterministic tests.
 */
export function computeBackoffSeconds(attempt: number, rand: () => number = Math.random): number {
  if (!Number.isFinite(attempt) || attempt < 0) return 0;
  const jitter = 0.5 + rand();
  const base = 2 ** Math.min(attempt, 10);
  return Math.min(600, Math.round(base * jitter));
}

export type EnqueueInput<T extends JobType = JobType> = {
  type: T;
  orgId: string;
  payload: Record<string, unknown>;
  /** ISO timestamp when the job should first be claimable. Default now. */
  runAt?: string;
  /** Prevents duplicate enqueue while prior enqueue is pending/running. */
  dedupKey?: string;
  maxAttempts?: number;
};

/**
 * Enqueue a job. Uses service-role client because `job_queue` INSERT is
 * RLS-gated off from the authenticated role (intentional — jobs come from
 * code paths, not direct API calls).
 *
 * Returns the inserted row, or `null` if a dedup collision occurred
 * (another pending/running row with the same `(type, dedup_key)`).
 */
export async function enqueue<T extends JobType>(input: EnqueueInput<T>): Promise<JobRow | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("job_queue")
    .insert({
      type: input.type,
      payload: input.payload as never,
      org_id: input.orgId,
      run_at: input.runAt ?? new Date().toISOString(),
      dedup_key: input.dedupKey ?? null,
      max_attempts: input.maxAttempts ?? 5,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    if (/duplicate key/i.test(error.message)) {
      log.info("jobs.dedup_hit", { type: input.type, dedup_key: input.dedupKey });
      return null;
    }
    log.warn("jobs.enqueue_failed", { type: input.type, err: error.message });
    throw error;
  }
  return data as JobRow | null;
}

/**
 * Atomic claim — typically called from the worker, not application code.
 * Returns up to `batchSize` rows now in state='running' with the lease
 * held until now()+visibilitySeconds.
 */
export async function claimJobs(batchSize: number, visibilitySeconds: number, workerId: string): Promise<JobRow[]> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("claim_jobs", {
    p_batch: batchSize,
    p_visibility_s: visibilitySeconds,
    p_worker: workerId,
  });
  if (error) throw error;
  return (data ?? []) as JobRow[];
}

export async function reclaimStuck(): Promise<number> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("reclaim_stuck_jobs");
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

export async function complete(jobId: string): Promise<void> {
  const svc = createServiceClient();
  await svc
    .from("job_queue")
    .update({ state: "done", completed_at: new Date().toISOString(), last_error: null })
    .eq("id", jobId);
}

/**
 * Record a failure. If attempts < max_attempts the job is re-queued with
 * an exponential backoff (base 2s, jitter 0-1s, capped at 10 min). Otherwise
 * it moves to `dead` for human triage.
 */
export async function fail(jobId: string, err: unknown): Promise<void> {
  const svc = createServiceClient();
  const message = err instanceof Error ? err.message : String(err);

  // Read current attempt count so we can decide retry vs dead.
  const { data: current } = await svc
    .from("job_queue")
    .select("attempts, max_attempts")
    .eq("id", jobId)
    .maybeSingle();
  const attempts = (current?.attempts as number | undefined) ?? 0;
  const maxAttempts = (current?.max_attempts as number | undefined) ?? 5;

  if (attempts >= maxAttempts) {
    await svc
      .from("job_queue")
      .update({ state: "dead", last_error: message })
      .eq("id", jobId);
    log.error("jobs.dead_letter", { job_id: jobId, err: message, attempts });
    return;
  }

  const backoffS = computeBackoffSeconds(attempts);
  const nextRun = new Date(Date.now() + backoffS * 1000).toISOString();
  await svc
    .from("job_queue")
    .update({
      state: "pending",
      last_error: message,
      run_at: nextRun,
      locked_by: null,
      locked_until: null,
    })
    .eq("id", jobId);
  log.warn("jobs.retry_scheduled", { job_id: jobId, attempts, backoff_s: backoffS });
}
