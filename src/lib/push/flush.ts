import "server-only";
import { createServiceClient } from "../supabase/server";
import type { LooseSupabase } from "../supabase/loose";
import { log } from "../log";
import { resolveNotificationHref } from "../urls";
import { sendPushDirect, type PushKind, type PushPayload } from "./send";

/**
 * Deferred-push flush (T1-2 discipline engine) — drains `push_deferred`.
 *
 * Rides the existing automations worker tick
 * (/api/v1/internal/automations/schedule, cron-pinged every minute) —
 * same pattern as `evaluateAdvanceDeadlines`; no new cron.
 *
 * Two row classes:
 *  - `ambient` — pushes parked during the recipient's quiet hours. Each
 *    replays verbatim via `sendPushDirect` (the bell row + email fan-out
 *    already happened at enqueue time; only the buzz was deferred).
 *  - `digest` — accrued feed noise. All of a user's due digest rows fold
 *    into ONE summarized push per flush: "{count} updates in {surfaces}",
 *    deep-linking to /m/feed.
 *
 * The per-kind opt-out is RE-CHECKED at flush time: a user who muted a
 * kind between enqueue and flush stays muted (mute wins over an already-
 * parked row). Claiming is a single conditional UPDATE so a racing tick
 * can't double-send.
 */

type DeferredRow = {
  id: string;
  org_id: string | null;
  user_id: string;
  kind: string;
  tier: "ambient" | "digest";
  payload: PushPayload;
};

/** Surface noun per digest-able kind, for the summary body. */
const DIGEST_SURFACE: Partial<Record<PushKind, string>> = {
  announcement: "Feed",
  kudos: "Recognition",
  badge: "Recognition",
  course: "Learning",
};

/** matrix[kind].push === false readers for the flush-time re-check. */
async function fetchMutedByUser(
  svc: LooseSupabase,
  userIds: string[],
): Promise<Map<string, Record<string, { push?: boolean }>>> {
  const map = new Map<string, Record<string, { push?: boolean }>>();
  if (userIds.length === 0) return map;
  try {
    const { data } = (await svc
      .from("notification_preferences")
      .select("user_id, matrix")
      .in("user_id", userIds)) as {
      data: Array<{ user_id: string; matrix: Record<string, { push?: boolean }> | null }> | null;
    };
    for (const row of data ?? []) map.set(row.user_id, row.matrix ?? {});
  } catch (err) {
    log.warn("push.flush_prefs_read_failed", { err: (err as Error).message });
  }
  return map;
}

function isMuted(matrix: Record<string, { push?: boolean }> | undefined, kind: string): boolean {
  return matrix?.[kind]?.push === false;
}

export async function evaluateDeferredPushes(opts: { batchSize?: number } = {}): Promise<{
  due: number;
  claimed: number;
  delivered: number;
  digests: number;
}> {
  // KEPT CAST: push_deferred ships in migration 20260723150000 and is not
  // in the generated types yet (never blind-regen database.types.ts).
  const svc = createServiceClient() as unknown as LooseSupabase;
  const batchSize = opts.batchSize ?? 200;
  const nowIso = new Date().toISOString();

  const { data: rawDue, error } = (await svc
    .from("push_deferred")
    .select("id, org_id, user_id, kind, tier, payload")
    .is("sent_at", null)
    .lte("defer_until", nowIso)
    .order("defer_until", { ascending: true })
    .limit(batchSize)) as { data: DeferredRow[] | null; error: { message: string } | null };
  if (error) {
    log.warn("push.flush_read_failed", { err: error.message });
    return { due: 0, claimed: 0, delivered: 0, digests: 0 };
  }
  const due = rawDue ?? [];
  if (due.length === 0) return { due: 0, claimed: 0, delivered: 0, digests: 0 };

  // Claim in one conditional UPDATE — a racing tick sees sent_at set and
  // claims nothing. Only the rows we actually claimed get delivered.
  const { data: claimedRows } = (await svc
    .from("push_deferred")
    .update({ sent_at: new Date().toISOString() })
    .in(
      "id",
      due.map((r) => r.id),
    )
    .is("sent_at", null)
    .select("id")) as { data: Array<{ id: string }> | null };
  const claimedIds = new Set((claimedRows ?? []).map((r) => r.id));
  const rows = due.filter((r) => claimedIds.has(r.id));
  if (rows.length === 0) return { due: due.length, claimed: 0, delivered: 0, digests: 0 };

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const mutedBy = await fetchMutedByUser(svc, userIds);

  let delivered = 0;
  let digests = 0;
  for (const userId of userIds) {
    const mine = rows.filter((r) => r.user_id === userId);
    const matrix = mutedBy.get(userId);

    // Ambient replays — verbatim, one push per parked payload.
    for (const row of mine.filter((r) => r.tier === "ambient")) {
      if (isMuted(matrix, row.kind)) continue;
      try {
        const result = await sendPushDirect(userId, row.payload);
        delivered += result.sent;
      } catch (err) {
        log.warn("push.flush_ambient_failed", { id: row.id, err: (err as Error).message });
      }
    }

    // Digest fold — one summary push for everything that accrued.
    const digestRows = mine.filter((r) => r.tier === "digest" && !isMuted(matrix, r.kind));
    if (digestRows.length === 0) continue;
    const surfaces = [
      ...new Set(digestRows.map((r) => DIGEST_SURFACE[r.kind as PushKind] ?? "Updates")),
    ];
    const count = digestRows.length;
    const summary: PushPayload = {
      title: count === 1 ? "1 update" : `${count} updates`,
      body: `New activity in ${surfaces.join(" · ")}`,
      url: resolveNotificationHref("/m/feed"),
      // Stable tag: back-to-back digest windows replace, not stack, on the
      // recipient's notification shade.
      tag: "compvss-digest",
      scope: "mobile",
    };
    try {
      const result = await sendPushDirect(userId, summary);
      delivered += result.sent;
      digests += 1;
    } catch (err) {
      log.warn("push.flush_digest_failed", { userId, err: (err as Error).message });
    }
  }

  return { due: due.length, claimed: rows.length, delivered, digests };
}
