import "server-only";
import { createServiceClient } from "./supabase/server";
import { log } from "./log";
import { shouldNotify } from "./notify-resolver";
import { sendPushTo } from "./push/send";
import { emitDomainEvent } from "./automations/dispatch";

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
 *     href: `/console/finance/invoices/${invoiceId}`,
 *     data: { invoiceId, amountCents: 1245000 },
 *   });
 */

export type NotifyEvent =
  | "project.created"
  | "project.status_changed"
  | "invoice.sent"
  | "invoice.paid"
  | "proposal.sent"
  | "proposal.signed"
  | "deliverable.submitted"
  | "deliverable.approved"
  | "assignment.scanned"
  | "po.acknowledged"
  | "po.fulfilled"
  | "incident.filed"
  | "offer_letter.accepted"
  | "offer_letter.declined"
  | "job.failed"
  | "passkey.registered"
  | "account.deletion_requested";

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
    // request never blocks on the push provider. Gated on the user's
    // notification matrix; defaults to off (see notify-resolver).
    if (args.userId) {
      const pushUserId = args.userId;
      void shouldNotify(pushUserId, args.eventType, "push")
        .then((allowPush) => {
          if (!allowPush) return;
          // recordBell: false — the emit_notification RPC below writes
          // the notifications row (gated on the in_app preference).
          return sendPushTo(
            pushUserId,
            {
              title: args.title,
              body: args.body ?? "",
              url: args.href ?? undefined,
              tag: args.eventType,
              data: { event: args.eventType, ...(args.data ?? {}) },
            },
            { recordBell: false },
          );
        })
        .catch((err: unknown) => {
          log.warn("notify.push_send_failed", {
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
    .in("role", ["owner", "admin"])
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

  // 2. Per-user push fan-out — same preference gate as the single-user
  //    notify() path. Fire-and-forget.
  for (const uid of userIds) {
    void shouldNotify(uid, args.eventType, "push")
      .then((allowPush) => {
        if (!allowPush) return;
        // recordBell: false — step 1's bulk insert is this event's
        // notifications row (already filtered by the in_app pref).
        return sendPushTo(
          uid,
          {
            title: args.title,
            body: args.body ?? "",
            url: args.href ?? undefined,
            tag: args.eventType,
            data: { event: args.eventType, ...(args.data ?? {}) },
          },
          { recordBell: false },
        );
      })
      .catch((err: unknown) => {
        log.warn("notify.admins_push_send_failed", {
          event: args.eventType,
          uid,
          err: (err as Error).message,
        });
      });
  }

  // 3. ONE webhook + domain_event fan-out for the org as a whole. Calls
  //    notify() with userId=null so emit_notification creates a single
  //    webhook delivery per active endpoint rather than one per admin.
  await notify({ ...args, userId: null });
}
