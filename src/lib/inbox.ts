import "server-only";
import { createClient, createServiceClient, isServiceClientAvailable } from "./supabase/server";
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

/**
 * Inbox-row kinds: every push-catalog kind, plus in-app-only kinds that
 * have no `notification_kind_catalog` entry yet. In-app-only kinds never
 * fan out to push (there is no per-kind opt-out row to gate them), they
 * only land in the `notifications` bell.
 */
export type InboxOnlyKind = "talent_offer";
export type InboxKind = PushKind | InboxOnlyKind;

function pushKindFor(kind: InboxKind): PushKind | null {
  return kind === "talent_offer" ? null : kind;
}

export type InboxEntry = {
  userId: string;
  orgId: string;
  /** Per-kind preference key + push channel kind. */
  kind: InboxKind;
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

  // Prefer the service client (writes to anyone's inbox), fall back to
  // the user-authenticated client when the service key isn't present
  // (local dev). RLS gates the user client to the caller's own
  // user_id — so writeInbox() to a different user is a no-op in that
  // fallback path, but self-writes still land.
  const writer = isServiceClientAvailable() ? createServiceClient() : await createClient();
  const { error } = await writer.from("notifications").upsert(
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

  const pushKind = pushKindFor(entry.kind);
  if (entry.push !== false && pushKind) {
    const payload: PushPayload = {
      title: entry.title,
      body: (entry.body ?? "").slice(0, 200),
      url: entry.href ?? "/me/notifications/inbox",
      tag: `${entry.sourceType}:${entry.sourceId}`,
      kind: pushKind,
    };
    // recordBell: false — the upsert above IS this event's bell row;
    // letting sendPushTo write its own would double up the inbox.
    const result = await sendPushTo(entry.userId, payload, { recordBell: false });
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

  const pushKind = pushKindFor(entry.kind);
  if (entry.push !== false && pushKind) {
    const payload: PushPayload = {
      title: entry.title,
      body: (entry.body ?? "").slice(0, 200),
      url: entry.href ?? "/me/notifications/inbox",
      tag: `${entry.sourceType}:${entry.sourceId}`,
      kind: pushKind,
    };
    // recordBell: false — the bulk upsert above already wrote the rows.
    const result = await sendPushBulk(userIds, payload, { recordBell: false });
    pushed = result.sent;
  }

  return { inboxed, pushed };
}
