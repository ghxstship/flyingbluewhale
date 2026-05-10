import "server-only";
import { createServiceClient } from "./supabase/server";
import { log } from "./log";
import type { LooseSupabase } from "./supabase/loose";

/**
 * Per-tenant usage metering — H3-01 / IK-023.
 *
 * Single-surface recorder for usage events that feed billing, quotas, and
 * per-tenant dashboards. Callers invoke `record(...)` from anywhere on the
 * server; the event is written straight into `usage_events` under the
 * service-role client. A downstream `usage.aggregate` job rolls buckets
 * into `usage_rollups` hourly (H3-02 worker wires this up).
 *
 * Metrics are free-form strings so new measurements don't require a
 * migration, but callers SHOULD reuse the `Metric` union below so the
 * billing layer has a stable vocabulary.
 *
 * Silent-failure policy: a dropped usage event must not break the action
 * that triggered it. We log-warn on error and return. Repeat drops are
 * alertable via the `usage.record.failed` log event.
 */

export type Metric =
  | "ai.tokens.input"
  | "ai.tokens.output"
  | "ai.request"
  | "api.request"
  | "storage.bytes.uploaded"
  | "storage.bytes.downloaded"
  | "email.sent"
  | "webhook.delivered";

export type Unit = "count" | "bytes" | "tokens" | "seconds";

export type UsageInput = {
  orgId: string;
  actorId?: string | null;
  metric: Metric | (string & { __brand?: "metric" });
  quantity: number;
  unit: Unit;
  metadata?: Record<string, unknown>;
};

/** Default unit per metric so callers can omit it in common cases. */
const DEFAULT_UNIT: Record<string, Unit> = {
  "ai.tokens.input": "tokens",
  "ai.tokens.output": "tokens",
  "ai.request": "count",
  "api.request": "count",
  "storage.bytes.uploaded": "bytes",
  "storage.bytes.downloaded": "bytes",
  "email.sent": "count",
  "webhook.delivered": "count",
};

export async function record(input: UsageInput): Promise<void> {
  if (!input.orgId) return;
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    log.warn("usage.record.rejected", { metric: input.metric, quantity: input.quantity });
    return;
  }
  try {
    const svc = createServiceClient();
    const { error } = await svc.from("usage_events").insert({
      org_id: input.orgId,
      actor_id: input.actorId ?? null,
      metric: input.metric,
      quantity: Math.round(input.quantity),
      unit: input.unit ?? DEFAULT_UNIT[input.metric as string] ?? "count",
      metadata: (input.metadata ?? {}) as never,
    });
    if (error) {
      log.warn("usage.record.failed", { metric: input.metric, err: error.message });
    }
  } catch (e) {
    log.warn("usage.record.failed", {
      metric: input.metric,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Read the current hour's rollup for a metric. Returns 0 when no data.
 * Used by API handlers doing a "did you exceed quota?" check inline.
 */
export async function currentBucket(orgId: string, metric: Metric | string): Promise<number> {
  try {
    const svc = createServiceClient();
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);
    // usage_rollups isn't in the generated database.types yet (added
    // by a later migration; gen:types pending). Route through the
    // codebase's typed-loose helper LooseSupabase, then reassert the
    // narrow row shape at the consume site.
    const loose = svc as unknown as LooseSupabase;
    const { data, error } = (await loose
      .from("usage_rollups")
      .select("quantity")
      .eq("org_id", orgId)
      .eq("metric", metric)
      .eq("bucket_start", hourStart.toISOString())
      .maybeSingle()) as { data: { quantity: number } | null; error: { message: string } | null };
    if (error || !data) return 0;
    return Number(data.quantity) || 0;
  } catch {
    return 0;
  }
}

/**
 * Format a UTC timestamp onto its canonical hour bucket (ISO string).
 * Extracted so the aggregator + test harness can share the same math.
 */
export function hourBucketStart(ts: Date = new Date()): string {
  const d = new Date(ts.getTime());
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}
