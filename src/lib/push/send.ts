import "server-only";
import webpush from "web-push";
import { createServiceClient } from "../supabase/server";
import { log } from "../log";
import { hasVapid, vapid } from "./vapid";

/**
 * Server-side Web Push sender (Phase 2.3).
 *
 * Reads `push_subscriptions` for the target user(s), encrypts the payload
 * with VAPID, and POSTs to each device's push endpoint. Provider responses:
 *   - 201/204: success — bump `last_seen_at`.
 *   - 410/404: subscription is gone — set `disabled_at` (kept for audit).
 *   - other:   transient — increment `failure_count`.
 *
 * Fire-and-forget from `notify()` — never block the originating request on
 * push delivery.
 */

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export type PushSendResult = { sent: number; failed: number; disabled: number };

type PushSubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
};

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (!hasVapid()) return false;
  const { subject, publicKey, privateKey } = vapid();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

async function fetchActiveSubs(userId: string): Promise<PushSubRow[]> {
  try {
    const svc = createServiceClient();
    // Cast through `any` because `push_subscriptions` is added by a fresh
    // migration and may not yet be in the regenerated database.types.
    const { data, error } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            is: (
              col: string,
              val: null,
            ) => Promise<{
              data: PushSubRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )("push_subscriptions")
      .select("id, endpoint, p256dh, auth, failure_count")
      .eq("user_id", userId)
      .is("disabled_at", null);
    if (error) {
      log.warn("push.fetch_subs_error", { userId, err: error.message });
      return [];
    }
    return data ?? [];
  } catch (err) {
    log.warn("push.fetch_subs_exception", { userId, err: (err as Error).message });
    return [];
  }
}

async function fetchActiveSubsBulk(userIds: string[]): Promise<Map<string, PushSubRow[]>> {
  const map = new Map<string, PushSubRow[]>();
  if (userIds.length === 0) return map;
  try {
    const svc = createServiceClient();
    const { data, error } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          in: (
            col: string,
            vals: string[],
          ) => {
            is: (
              col: string,
              val: null,
            ) => Promise<{
              data: Array<PushSubRow & { user_id: string }> | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth, failure_count")
      .in("user_id", userIds)
      .is("disabled_at", null);
    if (error) {
      log.warn("push.bulk_fetch_subs_error", { err: error.message });
      return map;
    }
    for (const row of data ?? []) {
      const arr = map.get(row.user_id) ?? [];
      arr.push({
        id: row.id,
        endpoint: row.endpoint,
        p256dh: row.p256dh,
        auth: row.auth,
        failure_count: row.failure_count,
      });
      map.set(row.user_id, arr);
    }
    return map;
  } catch (err) {
    log.warn("push.bulk_fetch_subs_exception", { err: (err as Error).message });
    return map;
  }
}

async function markDisabled(id: string): Promise<void> {
  try {
    const svc = createServiceClient();
    await (
      svc.from as unknown as (table: string) => {
        update: (patch: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )("push_subscriptions")
      .update({ disabled_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    log.warn("push.mark_disabled_exception", { id, err: (err as Error).message });
  }
}

async function bumpFailure(id: string, current: number): Promise<void> {
  try {
    const svc = createServiceClient();
    // CAS on the observed failure_count so concurrent failures don't
    // lose increments (read-modify-write on the same value: both fail,
    // both read N, both write N+1, the disable threshold takes 2× the
    // failures to trip).
    type FromUpdate = (table: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (
          col: string,
          val: string | number,
        ) => {
          eq: (col: string, val: string | number) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
    await (svc.from as unknown as FromUpdate)("push_subscriptions")
      .update({ failure_count: current + 1 })
      .eq("id", id)
      .eq("failure_count", current);
  } catch (err) {
    log.warn("push.bump_failure_exception", { id, err: (err as Error).message });
  }
}

async function bumpLastSeen(id: string): Promise<void> {
  try {
    const svc = createServiceClient();
    await (
      svc.from as unknown as (table: string) => {
        update: (patch: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )("push_subscriptions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", id);
  } catch {
    // last_seen is best-effort; never fail a push because we couldn't bump it.
  }
}

async function sendOne(sub: PushSubRow, serialized: string): Promise<"sent" | "disabled" | "failed"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      serialized,
    );
    void bumpLastSeen(sub.id);
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      await markDisabled(sub.id);
      return "disabled";
    }
    await bumpFailure(sub.id, sub.failure_count);
    return "failed";
  }
}

export async function sendPushTo(userId: string, payload: PushPayload): Promise<PushSendResult> {
  if (!ensureVapid()) return { sent: 0, failed: 0, disabled: 0 };
  const subs = await fetchActiveSubs(userId);
  if (subs.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const serialized = JSON.stringify(payload);
  const results = await Promise.allSettled(subs.map((s) => sendOne(s, serialized)));
  let sent = 0;
  let failed = 0;
  let disabled = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") {
      failed += 1;
      continue;
    }
    if (r.value === "sent") sent += 1;
    else if (r.value === "disabled") disabled += 1;
    else failed += 1;
  }
  return { sent, failed, disabled };
}

export async function sendPushBulk(userIds: string[], payload: PushPayload): Promise<PushSendResult> {
  if (!ensureVapid()) return { sent: 0, failed: 0, disabled: 0 };
  if (userIds.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const byUser = await fetchActiveSubsBulk(userIds);
  const subs: PushSubRow[] = [];
  for (const list of byUser.values()) subs.push(...list);
  if (subs.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const serialized = JSON.stringify(payload);
  const results = await Promise.allSettled(subs.map((s) => sendOne(s, serialized)));
  let sent = 0;
  let failed = 0;
  let disabled = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") {
      failed += 1;
      continue;
    }
    if (r.value === "sent") sent += 1;
    else if (r.value === "disabled") disabled += 1;
    else failed += 1;
  }
  return { sent, failed, disabled };
}
