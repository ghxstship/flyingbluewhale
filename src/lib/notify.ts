import "server-only";
import { createServiceClient } from "./supabase/server";
import { ADMIN_BAND_ROLES } from "./auth";
import { log } from "./log";
import { bulkShouldNotify, shouldNotify } from "./notify-resolver";
import { sendPushTo, type PushKind } from "./push/send";
import { resolveNotificationHref } from "./urls";
import { sendNotificationEmailToUsers } from "./email";
import { emitDomainEvent } from "./automations/dispatch";
import type { WebhookEvent } from "./webhooks/events";

/**
 * Notification + webhook emitter — resolves audit B1/B2.
 *
 * Shape: every lifecycle event in the app calls `notify({ ... })` with
 * one canonical shape. Server-side the RPC `emit_notification` writes a
 * `notifications` row (if `userId` given) AND a `webhook_deliveries`
 * row for every subscribed endpoint. The job-worker drains deliveries.
 *
 * Usage:
 *   await notify({
 *     orgId: session.orgId,
 *     userId: target.id,          // optional — omit for broadcast
 *     eventType: "invoice.paid",
 *     title: "Invoice #0042 paid",
 *     body: "$12,450 from Acme Productions",
 *     href: `/studio/finance/invoices/${invoiceId}`,
 *     data: { invoiceId, amountCents: 1245000 },
 *   });
 */

/**
 * The events this emitter can fire. Sourced from the shared registry in
 * `./webhooks/events` so the subscribe-side list in
 * `/api/v1/webhooks/endpoints` cannot drift from it again — the two were
 * hand-synced and had already diverged.
 */
export type NotifyEvent = WebhookEvent;

/**
 * NotifyEvent -> PushKind now lives in notify-resolver.ts — since the
 * resolver reads the live `notification_preferences.matrix` (2026-07-24
 * unification), the map is what keys EVERY channel's per-kind switch
 * (push here, in_app/email in shouldNotify). Re-exported for the existing
 * callers and tests.
 *
 * Unmapped events send NO push — deliberately. `filterByPushPrefs` treats a
 * missing kind as "exclude nobody", so handing it an unmapped event would
 * make that push UNMUTABLE, which is the exact defect the map exists to
 * fix. Adding an event is opt-in, and every kind it names must be
 * toggleable (NOTIF_KINDS) so the switch is real.
 */
import { pushKindForEvent } from "./notify-resolver";

export { pushKindForEvent };

/** Readable eyebrow for the email rendering of an event type. */
function eventEyebrow(eventType: NotifyEvent): string {
  const noun = eventType.split(".")[0] ?? "notification";
  return noun.charAt(0).toUpperCase() + noun.slice(1).replace(/_/g, " ");
}

export async function notify(args: {
  orgId: string;
  userId?: string | null;
  eventType: NotifyEvent;
  title: string;
  body?: string | null;
  href?: string | null;
  data?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    // Gate the in-app row insertion on the user's preferences matrix.
    // If the user has opted out, we still call the RPC with a null user
    // so the webhook fan-out (subscriber-side, org-scoped) still fires.
    // Webhook deliveries intentionally bypass per-user preferences.
    let effectiveUserId = args.userId ?? null;
    if (effectiveUserId) {
      const allowInApp = await shouldNotify(effectiveUserId, args.eventType, "in_app");
      if (!allowInApp) effectiveUserId = null;
    }

    // Fan out to Web Push in parallel — fire-and-forget so the originating
    // request never blocks on the push provider. Only mapped events push,
    // and sendPushTo gates the kind on the live prefs matrix; see
    // NOTIFY_EVENT_PUSH_KIND for why this does not route through
    // shouldNotify like the in_app/email channels do.
    const pushKind = pushKindForEvent(args.eventType);
    if (args.userId && pushKind) {
      const pushUserId = args.userId;
      // recordBell: false — the emit_notification RPC below writes
      // the notifications row (gated on the in_app preference).
      void sendPushTo(
        pushUserId,
        {
          title: args.title,
          body: args.body ?? "",
          // Stored hrefs are internal route-group paths (/studio/..., /m/...).
          // The push opens on the compvss service-worker origin, so resolve to
          // the owning shell's absolute URL — same rule as the email channel.
          url: args.href ? resolveNotificationHref(args.href) : undefined,
          tag: args.eventType,
          kind: pushKind,
          data: { event: args.eventType, ...(args.data ?? {}) },
        },
        { recordBell: false },
      ).catch((err: unknown) => {
        log.warn("notify.push_send_failed", {
          event: args.eventType,
          err: (err as Error).message,
        });
      });
    }

    if (args.userId) {
      // F-03 — email channel. The /me/notifications matrix has always
      // offered an Email column (default ON); this closes the loop.
      // Fire-and-forget, gated per (event, email) on the same matrix.
      const emailUserId = args.userId;
      void shouldNotify(emailUserId, args.eventType, "email")
        .then((allowEmail) => {
          if (!allowEmail) return;
          return sendNotificationEmailToUsers({
            userIds: [emailUserId],
            title: args.title,
            body: args.body ?? null,
            url: args.href ?? null,
            eyebrow: eventEyebrow(args.eventType),
          });
        })
        .catch((err: unknown) => {
          log.warn("notify.email_send_failed", {
            event: args.eventType,
            err: (err as Error).message,
          });
        });
    }

    const svc = createServiceClient();
    const { data, error } = await (
      svc.rpc as unknown as (
        name: string,
        params: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: { message: string } | null }>
    )("emit_notification", {
      p_org_id: args.orgId,
      p_user_id: effectiveUserId,
      p_event_type: args.eventType,
      p_title: args.title,
      p_body: args.body ?? null,
      p_href: args.href ?? null,
      p_payload: args.data ?? {},
    });
    if (error) {
      log.warn("notify.rpc_error", { event: args.eventType, err: error.message });
      return null;
    }

    // Phase 4.3: also emit a domain_events row so the automation dispatcher
    // can fan this out to subscribed automations. Fire-and-forget; the
    // notification path is the source-of-truth, the event row is a
    // best-effort side-effect for the automation runtime.
    const dataObj = (args.data ?? {}) as Record<string, unknown>;
    const sourceTable = typeof dataObj.targetTable === "string" ? (dataObj.targetTable as string) : undefined;
    const sourceId = typeof dataObj.targetId === "string" ? (dataObj.targetId as string) : undefined;
    void emitDomainEvent({
      orgId: args.orgId,
      eventType: args.eventType,
      payload: {
        userId: args.userId ?? null,
        title: args.title,
        body: args.body ?? null,
        href: args.href ?? null,
        ...dataObj,
      },
      sourceTable,
      sourceId,
    }).catch((err: unknown) => {
      log.warn("notify.domain_event_failed", {
        event: args.eventType,
        err: (err as Error).message,
      });
    });

    return data ?? null;
  } catch (err) {
    log.warn("notify.exception", { event: args.eventType, err: (err as Error).message });
    return null;
  }
}

/**
 * Broadcast to every org owner/admin. Convenience wrapper for events
 * that need to reach leadership (incident.filed, job.failed, etc.).
 *
 * Insert per-user notification rows DIRECTLY rather than calling
 * `notify()` once per admin: `emit_notification` fans out a
 * webhook_deliveries row on every invocation regardless of
 * p_user_id, so calling it N times for N admins multiplies webhook
 * fan-out by N. We bulk-insert the notifications table in one shot,
 * then call notify({ userId: null }) ONCE for the webhook + push +
 * domain_events fan-out. Per-user push respects each user's
 * preference matrix in a small parallel pass below.
 */
export async function notifyOrgAdmins(args: {
  orgId: string;
  eventType: NotifyEvent;
  title: string;
  body?: string | null;
  href?: string | null;
  data?: Record<string, unknown>;
}) {
  const svc = createServiceClient();
  // .is("deleted_at", null) — don't notify offboarded admins.
  const { data: members } = await svc
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", args.orgId)
    .in("role", [...ADMIN_BAND_ROLES])
    .is("deleted_at", null);
  const userIds = (members ?? []).map((m) => m.user_id as string);
  if (userIds.length === 0) return;

  // 1. Bulk-insert notification rows respecting each user's in-app
  //    preference. shouldNotify() is in-process; one batched filter is
  //    cheaper than N round-trips.
  const allowed = await Promise.all(userIds.map((uid) => shouldNotify(uid, args.eventType, "in_app")));
  const eligibleUserIds = userIds.filter((_, i) => allowed[i]);
  if (eligibleUserIds.length > 0) {
    const rows = eligibleUserIds.map((uid) => ({
      org_id: args.orgId,
      user_id: uid,
      kind: args.eventType,
      title: args.title,
      body: args.body ?? null,
      href: args.href ?? null,
    }));
    const { error } = await svc.from("notifications").insert(rows);
    if (error) {
      log.warn("notify.bulk_insert_failed", { event: args.eventType, err: error.message });
    }
  }

  // 2. Per-user push fan-out — same kind gate as the single-user notify()
  //    path: only mapped events push, and sendPushTo excludes the users who
  //    muted the kind. Fire-and-forget.
  const adminPushKind = pushKindForEvent(args.eventType);
  if (adminPushKind) {
    for (const uid of userIds) {
      // recordBell: false — step 1's bulk insert is this event's
      // notifications row (already filtered by the in_app pref).
      void sendPushTo(
        uid,
        {
          title: args.title,
          body: args.body ?? "",
          // Same cross-shell resolution as the single-user path above.
          url: args.href ? resolveNotificationHref(args.href) : undefined,
          tag: args.eventType,
          kind: adminPushKind,
          data: { event: args.eventType, ...(args.data ?? {}) },
        },
        { recordBell: false },
      ).catch((err: unknown) => {
        log.warn("notify.admins_push_send_failed", {
          event: args.eventType,
          uid,
          err: (err as Error).message,
        });
      });
    }
  }

  // 3. Email fan-out (F-03) — one kit-templated email per admin whose
  //    matrix allows (event, email); default ON per the /me/notifications
  //    matrix. Fire-and-forget.
  void bulkShouldNotify(userIds, args.eventType, "email")
    .then((allowedEmail) => {
      const emailIds = userIds.filter((uid) => allowedEmail.has(uid));
      if (emailIds.length === 0) return;
      return sendNotificationEmailToUsers({
        userIds: emailIds,
        title: args.title,
        body: args.body ?? null,
        url: args.href ?? null,
        eyebrow: eventEyebrow(args.eventType),
      });
    })
    .catch((err: unknown) => {
      log.warn("notify.admins_email_send_failed", {
        event: args.eventType,
        err: (err as Error).message,
      });
    });

  // 4. ONE webhook + domain_event fan-out for the org as a whole. Calls
  //    notify() with userId=null so emit_notification creates a single
  //    webhook delivery per active endpoint rather than one per admin.
  await notify({ ...args, userId: null });
}
