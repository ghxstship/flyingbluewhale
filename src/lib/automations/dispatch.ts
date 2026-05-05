import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Domain event bus — Phase 4.3 of the SmartSuite parity roadmap.
 *
 * `emitDomainEvent` writes a single append-only row to `domain_events`. The
 * job-worker tails this table on every cron tick, finds matching
 * `automation_subscriptions`, and enqueues an `automation.run` job per
 * (event × automation) pair. Stamping `dispatched_at` after fan-out makes
 * the drain loop idempotent — re-running it never double-fires.
 *
 * The boundary between this module and `notify.ts` is intentional:
 *
 *  - `notify()` writes a `notifications` row (per-user UI feed) and a
 *    `webhook_deliveries` row (outbound HTTP fan-out to subscribers).
 *  - `emitDomainEvent()` writes a `domain_events` row (in-app automation
 *    fan-out). It is called as a side-effect from the same `notify()` path
 *    so every notify event is also an automation trigger.
 *
 * Direct callers (SSOT triggers that don't notify a user — record-created /
 * record-updated semantics) can import this module on their own; that's how
 * SmartSuite-style "Record matches a condition" triggers will land later.
 */

// `domain_events` / `automation_subscriptions` / `automation_schedules` aren't
// in `database.types.ts` until type-gen runs against the migrated DB. Untype
// the client at the boundary to avoid an editor-only error blocking the
// dispatcher from compiling. Every write is org-scoped and validated.
type AnySvc = { from: (t: string) => unknown };

export async function emitDomainEvent(opts: {
  orgId: string;
  eventType: string; // 'invoice.paid', 'ticket.scanned', etc.
  payload: Record<string, unknown>;
  sourceTable?: string;
  sourceId?: string;
}): Promise<void> {
  try {
    const svc = createServiceClient() as unknown as AnySvc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (svc.from("domain_events") as any).insert({
      org_id: opts.orgId,
      event_type: opts.eventType,
      payload: opts.payload,
      source_table: opts.sourceTable ?? null,
      source_id: opts.sourceId ?? null,
    });
    if (error) {
      log.warn("domain_events.insert_failed", { event: opts.eventType, err: error.message });
    }
  } catch (err) {
    log.warn("domain_events.exception", {
      event: opts.eventType,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Subscribe an automation to a domain event. Idempotent on
 * (automation_id, event_type, source_table, source_id).
 */
export async function subscribeAutomationToEvent(opts: {
  orgId: string;
  automationId: string;
  eventType: string;
  sourceTable?: string | null;
  sourceId?: string | null;
}): Promise<void> {
  const svc = createServiceClient() as unknown as AnySvc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (svc.from("automation_subscriptions") as any).upsert(
    {
      org_id: opts.orgId,
      automation_id: opts.automationId,
      event_type: opts.eventType,
      source_table: opts.sourceTable ?? null,
      source_id: opts.sourceId ?? null,
      enabled: true,
    },
    { onConflict: "automation_id,event_type,source_table,source_id" },
  );
  if (error) throw new Error(`subscribe failed: ${error.message}`);
}

type DomainEventRow = {
  id: string;
  org_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  source_table: string | null;
  source_id: string | null;
  emitted_at: string;
};

type SubscriptionRow = {
  id: string;
  org_id: string;
  automation_id: string;
  event_type: string;
  source_table: string | null;
  source_id: string | null;
  enabled: boolean;
};

/**
 * Drain undispatched `domain_events`; for each, enqueue `automation.run`
 * jobs for all matching subscriptions, then stamp `dispatched_at` so the
 * row is excluded from subsequent ticks.
 *
 * Idempotency: each enqueued job carries
 * `dedup_key = ${automationId}:event:${domainEventId}` — concurrent worker
 * ticks racing on the same event row will collide on the `(type, dedup_key)`
 * partial unique index in `job_queue` and only one job survives.
 */
export async function drainPending(opts: { batchSize?: number } = {}): Promise<{
  drained: number;
  enqueued: number;
}> {
  const batchSize = opts.batchSize ?? 50;
  const svc = createServiceClient() as unknown as AnySvc;

  // 1. Pull pending events (oldest first).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawEvents, error: readErr } = await (svc.from("domain_events") as any)
    .select("id, org_id, event_type, payload, source_table, source_id, emitted_at")
    .is("dispatched_at", null)
    .order("emitted_at", { ascending: true })
    .limit(batchSize);
  if (readErr) throw new Error(`domain_events read failed: ${readErr.message}`);
  const events = (rawEvents ?? []) as DomainEventRow[];
  if (events.length === 0) return { drained: 0, enqueued: 0 };

  // 2. Look up subscriptions for the unique set of event types we just read.
  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubs, error: subsErr } = await (svc.from("automation_subscriptions") as any)
    .select("id, org_id, automation_id, event_type, source_table, source_id, enabled")
    .in("event_type", eventTypes)
    .eq("enabled", true);
  if (subsErr) throw new Error(`subscriptions read failed: ${subsErr.message}`);
  const subs = (rawSubs ?? []) as SubscriptionRow[];

  // 3. For each event, fan out to every matching subscription (org + filters).
  let enqueued = 0;
  for (const ev of events) {
    const matchingSubs = subs.filter(
      (s) =>
        s.org_id === ev.org_id &&
        s.event_type === ev.event_type &&
        (s.source_table == null || s.source_table === ev.source_table) &&
        (s.source_id == null || s.source_id === ev.source_id),
    );

    for (const sub of matchingSubs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: jobErr } = await (svc.from("job_queue") as any).insert({
        type: "automation.run",
        org_id: sub.org_id,
        payload: {
          automationId: sub.automation_id,
          triggerKind: "event",
          triggerPayload: {
            eventId: ev.id,
            eventType: ev.event_type,
            sourceTable: ev.source_table,
            sourceId: ev.source_id,
            data: ev.payload,
          },
        },
        dedup_key: `${sub.automation_id}:event:${ev.id}`,
      });
      if (jobErr) {
        const msg = jobErr.message ?? "";
        // Duplicate-key collisions are expected (concurrent ticks) — swallow
        // without counting as enqueued. Real errors get logged + skipped.
        if (!/duplicate key|unique constraint/i.test(msg)) {
          log.warn("domain_events.enqueue_failed", {
            event: ev.event_type,
            automation: sub.automation_id,
            err: msg,
          });
        }
        continue;
      }
      enqueued += 1;
    }

    // 4. Stamp the event as dispatched.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: stampErr } = await (svc.from("domain_events") as any)
      .update({ dispatched_at: new Date().toISOString() })
      .eq("id", ev.id);
    if (stampErr) {
      log.warn("domain_events.stamp_failed", { eventId: ev.id, err: stampErr.message });
    }
  }

  return { drained: events.length, enqueued };
}
