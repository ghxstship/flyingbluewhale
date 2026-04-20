import "server-only";
import { createServiceClient } from "./supabase/server";
import { log } from "./log";

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
  | "ticket.scanned"
  | "po.acknowledged"
  | "po.fulfilled"
  | "incident.filed"
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
    const svc = createServiceClient();
    const { data, error } = await (svc.rpc as unknown as (
      name: string,
      params: Record<string, unknown>,
    ) => Promise<{ data: string | null; error: { message: string } | null }>)(
      "emit_notification",
      {
        p_org_id: args.orgId,
        p_user_id: args.userId ?? null,
        p_event_type: args.eventType,
        p_title: args.title,
        p_body: args.body ?? null,
        p_href: args.href ?? null,
        p_payload: args.data ?? {},
      },
    );
    if (error) {
      log.warn("notify.rpc_error", { event: args.eventType, err: error.message });
      return null;
    }
    return data ?? null;
  } catch (err) {
    log.warn("notify.exception", { event: args.eventType, err: (err as Error).message });
    return null;
  }
}

/**
 * Broadcast to every org owner/admin. Convenience wrapper for events
 * that need to reach leadership (incident.filed, job.failed, etc.).
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
  const { data: members } = await svc
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", args.orgId)
    .in("role", ["owner", "admin"]);
  const userIds = (members ?? []).map((m) => m.user_id);
  await Promise.all(
    userIds.map((uid) =>
      notify({ ...args, userId: uid }),
    ),
  );
  // Also emit one webhook-only broadcast (no userId) so the webhook is
  // fired once per event rather than once per admin.
  if (userIds.length > 0) {
    await notify({ ...args, userId: null });
  }
}
