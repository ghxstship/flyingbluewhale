import "server-only";
import webpush from "web-push";
import { createServiceClient } from "../supabase/server";
import type { Json, TablesInsert } from "../supabase/types";
import { log } from "../log";
import { sendNotificationEmailToUsers } from "../email";
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

/** Canonical event kinds from migration 0051's notification_kind_catalog
 *  view. Per-user preferences in `notification_preferences.matrix` gate
 *  delivery — sendPushTo/Bulk skip users who've toggled the kind off
 *  via /m/settings/notifications. Omit `kind` only for system-level
 *  pings that shouldn't be user-disable-able (e.g. security alerts). */
export type PushKind =
  | "announcement"
  | "chat"
  | "kudos"
  | "badge"
  | "assignment"
  | "assignment_state"
  | "assignment_scan"
  | "shift_swap"
  | "time_off"
  | "timesheet"
  | "course"
  | "incident"
  // Safety-critical broadcast. Carries a kind (so the row is tagged and the
  // field's alert surface can tone it) but is exempt from the opt-out
  // matrix — see UNSILENCEABLE_KINDS.
  | "crisis";

/**
 * Kinds a user may NOT switch off.
 *
 * The per-kind opt-out matrix is right for announcements, kudos and chat.
 * It is wrong for a declared crisis: the whole point is that it reaches
 * everyone, and someone who muted "alerts" three months ago has not
 * consented to missing an evacuation.
 *
 * The alternative — omitting `kind` entirely, which already bypasses the
 * gate — would leave the notification row tagged with the column's
 * 'system' default and lose the crisis tone the field's alert surface
 * already renders. So the kind stays and the exemption is explicit.
 */
export type UnsilenceableKind = "crisis";

export const UNSILENCEABLE_KINDS: ReadonlySet<PushKind> = new Set<UnsilenceableKind>(["crisis"]);

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  /** Categorisation tag for user-prefs filtering. */
  kind?: PushKind;
  /** ADR-0010 Move 1: shell scoping for the `notifications` row written
   *  alongside this push. `"all"` (default) surfaces in every shell's
   *  bell; `"platform"` / `"portal"` / `"mobile"` scope to that shell. */
  scope?: "platform" | "portal" | "mobile" | "all";
  /** Optional project scope for the notifications row — the portal bell
   *  on `/p/[slug]` filters here. */
  projectId?: string;
  /** Optional org scope for the notifications row — the ATLVS bell
   *  filters here on multi-org sessions. */
  orgId?: string;
  /** P2.a — actionable notification buttons. Each becomes a button on the
   *  OS notification; tapping it makes the service worker POST `body` to
   *  `endpoint` (cookies included) without opening the app. The endpoint
   *  re-authorizes — these descriptors are not a trust boundary. Web
   *  Notifications render at most ~2 actions, so keep the list short. */
  actions?: PushAction[];
};

export type PushAction = {
  /** Stable action id — matches the SW `notificationclick` `event.action`. */
  action: string;
  /** Button label shown on the notification. */
  title: string;
  /** Same-origin API path the SW POSTs to (e.g. /api/v1/notifications/actions). */
  endpoint: string;
  /** JSON body sent with the POST. */
  body?: Record<string, unknown>;
};

export type PushSendResult = { sent: number; failed: number; disabled: number };

export type PushSendOptions = {
  /** ADR-0010 Move 1 — sendPushTo/Bulk write a `notifications` bell row
   *  per recipient by default. Callers that already maintain their own
   *  rows (writeInbox's idempotent upsert, notify()'s emit_notification
   *  RPC) pass false so the bell doesn't get a duplicate row. */
  recordBell?: boolean;
};

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
    const { data, error } = await svc
      .from("push_subscriptions")
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
    const { data, error } = await svc
      .from("push_subscriptions")
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
    await svc.from("push_subscriptions").update({ disabled_at: new Date().toISOString() }).eq("id", id);
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
    await svc
      .from("push_subscriptions")
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
    await svc.from("push_subscriptions").update({ last_seen_at: new Date().toISOString() }).eq("id", id);
  } catch {
    // last_seen is best-effort; never fail a push because we couldn't bump it.
  }
}

/**
 * ADR-0010 Move 1 — write a `notifications` row for each recipient
 * alongside the push send.
 *
 * The notifications matrix is the SSOT for the bell on every shell;
 * push is just one delivery channel. This helper writes the row before
 * any push-pref gating so users who've muted push for a kind still see
 * the event in their bell.
 *
 * Fire-and-forget pattern: failures log + swallow so the push pipeline
 * never blocks on notifications-table availability. RLS is the
 * authorization boundary (`user_id = auth.uid()` policy on
 * notifications), but the service-role client bypasses RLS here since
 * sending is a system action by definition.
 */
async function recordNotifications(userIds: string[], payload: PushPayload): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const svc = createServiceClient();
    const rows: TablesInsert<"notifications">[] = userIds.map((userId) => ({
      user_id: userId,
      // Omit kind when the payload has none so the column's 'system'
      // default applies — an explicit null would violate NOT NULL.
      ...(payload.kind ? { kind: payload.kind } : {}),
      title: payload.title,
      body: payload.body,
      href: payload.url ?? null,
      scope: payload.scope ?? "all",
      project_id: payload.projectId ?? null,
      org_id: payload.orgId ?? null,
    }));
    const { error } = await svc.from("notifications").insert(rows);
    if (error) log.warn("push.record_notifications_error", { err: error.message, count: rows.length });
  } catch (err) {
    log.warn("push.record_notifications_exception", { err: (err as Error).message });
  }
}

/**
 * P2 hardening — enqueue a failed push delivery into
 * `public.push_send_failures` for replay. Exponential backoff:
 *   attempt 1 → next try in 5s
 *   attempt 2 → next try in 30s
 *   attempt 3 → next try in 5min (final retry; row is GC'd after that)
 *
 * Fire-and-forget; an enqueue failure is logged but never blocks the
 * originating push send.
 */
function nextBackoffMs(attempt: number): number {
  if (attempt <= 1) return 5_000;
  if (attempt === 2) return 30_000;
  return 5 * 60_000;
}

async function enqueuePushRetry(
  userId: string,
  sub: PushSubRow,
  payload: PushPayload,
  status: number | undefined,
  err: string,
): Promise<void> {
  try {
    const svc = createServiceClient();
    const nextAt = new Date(Date.now() + nextBackoffMs(1)).toISOString();
    await svc.from("push_send_failures").insert([
      {
        user_id: userId,
        subscription_id: sub.id,
        // KEPT CAST: PushPayload.data is Record<string, unknown>, which the
        // Json type can't absorb without widening the public payload API.
        payload: payload as unknown as Json,
        attempt: 1,
        max_attempts: 3,
        next_attempt_at: nextAt,
        last_error: err.slice(0, 500),
        last_status: status ?? null,
      },
    ]);
  } catch (e) {
    log.warn("push.enqueue_retry_exception", { err: (e as Error).message, sub: sub.id });
  }
}

async function sendOne(
  userId: string,
  sub: PushSubRow,
  payload: PushPayload,
  serialized: string,
): Promise<"sent" | "disabled" | "failed"> {
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
    const msg = err instanceof Error ? err.message : String(err);
    if (status === 410 || status === 404) {
      await markDisabled(sub.id);
      return "disabled";
    }
    await bumpFailure(sub.id, sub.failure_count);
    // P2: enqueue for retry on transient failures (429 / 5xx / network).
    // 401/403 means something is wrong with the VAPID config — no point
    // in retrying with the same keys. Fire-and-forget.
    if (status !== 401 && status !== 403) {
      void enqueuePushRetry(userId, sub, payload, status, msg);
    }
    return "failed";
  }
}

/** Read the caller's notification_preferences.matrix and return the
 *  set of user_ids who have toggled `kind` to false on the `push`
 *  channel. Default-on: if a user has no prefs row, or no entry for the
 *  kind, or push is undefined for the kind, we include them in delivery.
 *  Only an explicit `push:false` excludes a user. */
async function filterByPushPrefs(userIds: string[], kind: PushKind | undefined): Promise<Set<string>> {
  // No kind → broadcast to everyone (system-level pings).
  if (!kind || userIds.length === 0) return new Set();
  // Safety-critical kinds ignore the opt-out matrix entirely.
  if (UNSILENCEABLE_KINDS.has(kind)) return new Set();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("user_id, matrix")
    .in("user_id", userIds)
    // `matrix` is JSONB keyed by PushKind — shape to the prefs contract.
    .returns<Array<{ user_id: string; matrix: Record<string, { push?: boolean }> | null }>>();
  const excluded = new Set<string>();
  for (const row of data ?? []) {
    const cell = row.matrix?.[kind];
    if (cell?.push === false) excluded.add(row.user_id);
  }
  return excluded;
}

/** Human eyebrow for the email rendering of a push kind. */
const KIND_EMAIL_LABEL: Record<PushKind, string> = {
  announcement: "Announcement",
  chat: "New Message",
  kudos: "Recognition",
  badge: "Badge Awarded",
  timesheet: "Timesheet",
  assignment: "Assignment",
  assignment_state: "Assignment Update",
  assignment_scan: "Assignment Scan",
  shift_swap: "Shift Swap",
  time_off: "Time Off",
  course: "Course",
  incident: "Incident",
  crisis: "Crisis Alert",
};

/**
 * F-03 — the email channel of the per-kind delivery matrix. The
 * `/m/notifications` matrix has always offered an Email column; this is
 * the fan-out that makes it real. OPT-IN semantics: a user is emailed
 * only when their `notification_preferences.matrix[kind].email` is
 * explicitly true (the matrix UI renders email default-off, so a missing
 * cell means "never opted in"). Kind-less system pings never email.
 * Returns the opted-in subset.
 */
async function filterByEmailOptIn(userIds: string[], kind: PushKind | undefined): Promise<string[]> {
  if (!kind || userIds.length === 0) return [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("user_id, matrix")
      .in("user_id", userIds)
      .returns<Array<{ user_id: string; matrix: Record<string, { email?: boolean }> | null }>>();
    const optedIn: string[] = [];
    for (const row of data ?? []) {
      if (row.matrix?.[kind]?.email === true) optedIn.push(row.user_id);
    }
    return optedIn;
  } catch (err) {
    log.warn("push.email_optin_fetch_exception", { err: (err as Error).message });
    return [];
  }
}

/**
 * Fire-and-forget email fan-out for a push payload — one kit-templated
 * notification email per opted-in recipient. Never blocks or fails the
 * push path.
 */
function fanOutEmail(userIds: string[], payload: PushPayload): void {
  if (!payload.kind || userIds.length === 0) return;
  const kind = payload.kind;
  void filterByEmailOptIn(userIds, kind)
    .then((optedIn) => {
      if (optedIn.length === 0) return;
      return sendNotificationEmailToUsers({
        userIds: optedIn,
        title: payload.title,
        body: payload.body,
        url: payload.url ?? null,
        eyebrow: KIND_EMAIL_LABEL[kind],
      });
    })
    .catch((err: unknown) => {
      log.warn("push.email_fanout_failed", { kind, err: (err as Error).message });
    });
}

export async function sendPushTo(
  userId: string,
  payload: PushPayload,
  opts?: PushSendOptions,
): Promise<PushSendResult> {
  // ADR-0010 Move 1 — write the notifications row BEFORE the push-pref
  // gate. The matrix is the canonical event log, independent of whether
  // the user has push delivery enabled for this kind. Bell on every
  // shell reads from here; push is the optional channel.
  if (opts?.recordBell !== false) await recordNotifications([userId], payload);
  // F-03 email channel — independent of push availability (VAPID) and of
  // the push pref gate below; gated on its own matrix column. Fire-and-forget.
  fanOutEmail([userId], payload);
  if (!ensureVapid()) return { sent: 0, failed: 0, disabled: 0 };
  // Pref gate: if the user has toggled this kind off, short-circuit
  // (push channel only — the notifications row above is already written).
  const excluded = await filterByPushPrefs([userId], payload.kind);
  if (excluded.has(userId)) return { sent: 0, failed: 0, disabled: 0 };
  const subs = await fetchActiveSubs(userId);
  if (subs.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const serialized = JSON.stringify(payload);
  const results = await Promise.allSettled(subs.map((s) => sendOne(userId, s, payload, serialized)));
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

export async function sendPushBulk(
  userIds: string[],
  payload: PushPayload,
  opts?: PushSendOptions,
): Promise<PushSendResult> {
  if (userIds.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  // ADR-0010 Move 1 — write notifications rows for every recipient
  // before the push-pref gate. Single batch insert; bell on every shell
  // reads from here regardless of push delivery state.
  if (opts?.recordBell !== false) await recordNotifications(userIds, payload);
  // F-03 email channel — independent of push availability (VAPID) and of
  // the push pref gate below; gated on its own matrix column. Fire-and-forget.
  fanOutEmail(userIds, payload);
  if (!ensureVapid()) return { sent: 0, failed: 0, disabled: 0 };
  // Pref gate: drop users who've toggled this kind off before we hit
  // the push_subscriptions read (push channel only).
  const excluded = await filterByPushPrefs(userIds, payload.kind);
  const allowed = userIds.filter((u) => !excluded.has(u));
  if (allowed.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const byUser = await fetchActiveSubsBulk(allowed);
  // Preserve userId per sub so the retry queue (P2) knows which user
  // the failed payload belonged to. Pre-XPMS code flattened the map
  // and lost that mapping.
  const subsWithUser: Array<{ userId: string; sub: PushSubRow }> = [];
  for (const [uid, list] of byUser.entries()) {
    for (const sub of list) subsWithUser.push({ userId: uid, sub });
  }
  if (subsWithUser.length === 0) return { sent: 0, failed: 0, disabled: 0 };
  const serialized = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subsWithUser.map(({ userId: uid, sub }) => sendOne(uid, sub, payload, serialized)),
  );
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
