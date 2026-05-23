import "server-only";
import { createServiceClient, isServiceClientAvailable } from "./supabase/server";
import { sendPushTo, sendPushBulk, type PushKind, type PushPayload } from "./push/send";
import { log } from "./log";

/**
 * Inbox writer — the canonical entry point for routing user-facing
 * notifications across channels. Replaces ad-hoc `sendPushTo(...)`
 * calls that only land on push and never on the in-app inbox.
 *
 * One call → one row in `notifications` (the unified inbox) + push
 * fan-out (best-effort, gated by the per-kind preference matrix).
 *
 * Idempotency: `source_type` + `source_id` enforce a partial unique
 * key per user, so retrying the same logical event collapses instead
 * of duplicating. Use the originating record's table + uuid.
 */

export type InboxEntry = {
  userId: string;
  orgId: string;
  /** Per-kind preference key + push channel kind. */
  kind: PushKind;
  /** Originating table (e.g. "deliverables", "chat_messages"). */
  sourceType: string;
  /** Originating row id. Idempotent — repeated writes collapse. */
  sourceId: string;
  /** Who triggered this event (optional — system events leave null). */
  actorId?: string | null;
  /** Inbox title (≤120 chars recommended). */
  title: string;
  /** Inbox body / preview. */
  body?: string | null;
  /** Deep link the user follows when clicking the row. */
  href?: string | null;
  /** When true, also fire push fan-out. Defaults true. */
  push?: boolean;
};

/**
 * Write a single inbox row for one user, then fan out push.
 * Push failures don't roll back the insert (push is best-effort).
 */
export async function writeInbox(entry: InboxEntry): Promise<{ inboxed: boolean; pushed: boolean }> {
  let inboxed = false;
  let pushed = false;

  if (isServiceClientAvailable()) {
    const service = createServiceClient();
    const { error } = await service.from("notifications").upsert(
      {
        org_id: entry.orgId,
        user_id: entry.userId,
        kind: entry.kind,
        title: entry.title,
        body: entry.body ?? null,
        href: entry.href ?? null,
        source_type: entry.sourceType,
        source_id: entry.sourceId,
        actor_id: entry.actorId ?? null,
      } as never,
      { onConflict: "user_id,source_type,source_id", ignoreDuplicates: false },
    );
    if (error) {
      log.warn("inbox.write.failed", { kind: entry.kind, sourceType: entry.sourceType, error: error.message });
    } else {
      inboxed = true;
    }
  }

  if (entry.push !== false) {
    const payload: PushPayload = {
      title: entry.title,
      body: (entry.body ?? "").slice(0, 200),
      url: entry.href ?? "/me/notifications/inbox",
      tag: `${entry.sourceType}:${entry.sourceId}`,
      kind: entry.kind,
    };
    const result = await sendPushTo(entry.userId, payload);
    pushed = result.sent > 0;
  }

  return { inboxed, pushed };
}

/**
 * Same shape, fan-out flavor — one inbox row per recipient.
 * Uses bulk push under the hood after writing rows.
 */
export async function writeInboxBulk(
  userIds: string[],
  entry: Omit<InboxEntry, "userId">,
): Promise<{ inboxed: number; pushed: number }> {
  if (userIds.length === 0) return { inboxed: 0, pushed: 0 };
  let inboxed = 0;
  let pushed = 0;

  if (isServiceClientAvailable()) {
    const service = createServiceClient();
    const rows = userIds.map((userId) => ({
      org_id: entry.orgId,
      user_id: userId,
      kind: entry.kind,
      title: entry.title,
      body: entry.body ?? null,
      href: entry.href ?? null,
      source_type: entry.sourceType,
      source_id: entry.sourceId,
      actor_id: entry.actorId ?? null,
    }));
    const { error, count } = await service
      .from("notifications")
      .upsert(rows as never, { onConflict: "user_id,source_type,source_id", ignoreDuplicates: false, count: "exact" });
    if (error) {
      log.warn("inbox.write.bulk.failed", {
        kind: entry.kind,
        sourceType: entry.sourceType,
        recipients: userIds.length,
        error: error.message,
      });
    } else {
      inboxed = count ?? userIds.length;
    }
  }

  if (entry.push !== false) {
    const payload: PushPayload = {
      title: entry.title,
      body: (entry.body ?? "").slice(0, 200),
      url: entry.href ?? "/me/notifications/inbox",
      tag: `${entry.sourceType}:${entry.sourceId}`,
      kind: entry.kind,
    };
    const result = await sendPushBulk(userIds, payload);
    pushed = result.sent;
  }

  return { inboxed, pushed };
}
