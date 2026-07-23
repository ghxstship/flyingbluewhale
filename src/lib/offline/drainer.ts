"use client";

import { list, markFailed, remove, withKindLock, type QueuedItem } from "./queue";
import { sweepOrphans } from "./photo-blobs";

/**
 * App-level outbox drainer core (T1-1) — replays the localStorage queue
 * REGARDLESS of which surface enqueued. Before this, `useOfflineQueue` only
 * drained while the enqueuing form was mounted: an incident filed offline
 * from the gate replayed only if the crew member happened to reopen that
 * exact form after reconnecting. The drainer island (`<OfflineDrainer>`,
 * mounted once in the (mobile) layout) calls `drainAppQueue()` on
 * reconnect / visibility / an interval fallback.
 *
 * Headless + framework-free so the drain semantics are unit-testable with no
 * surface mounted. Replayers are registered by `replayers.ts` (which imports
 * the server actions); the registry lives here so tests can register mocks.
 *
 * Outcome protocol per item:
 *   "ok"                — landed (or the replayer handled it terminally
 *                          itself); the row is removed.
 *   { error: string }   — TERMINAL rejection (the server answered no:
 *                          validation / FSM / auth). The row is parked as
 *                          `failed` — kept, skipped by later drains, counted
 *                          by the shell banner, re-armed by its retry. The
 *                          drain CONTINUES to the next item: unlike a
 *                          transient failure, a poisoned row says nothing
 *                          about its neighbors.
 *   throw               — transient (network / 5xx). Stops that kind's drain
 *                          so FIFO holds; the next trigger retries.
 */

export type ReplayOutcome = "ok" | { error: string };
export type Replayer = (item: QueuedItem) => Promise<ReplayOutcome>;

const exact = new Map<string, Replayer>();
const prefixes: Array<{ prefix: string; fn: Replayer }> = [];

/** Register the replayer for one exact queue kind (e.g. "incident"). */
export function registerReplayer(kind: string, fn: Replayer): void {
  exact.set(kind, fn);
}

/** Register a replayer for a dynamic kind family (e.g. "chat:"). */
export function registerPrefixReplayer(prefix: string, fn: Replayer): void {
  const existing = prefixes.find((p) => p.prefix === prefix);
  if (existing) existing.fn = fn;
  else prefixes.push({ prefix, fn });
}

/** Resolve the replayer for a kind — exact match wins, then longest prefix. */
export function replayerFor(kind: string): Replayer | null {
  const hit = exact.get(kind);
  if (hit) return hit;
  let best: { prefix: string; fn: Replayer } | null = null;
  for (const p of prefixes) {
    if (kind.startsWith(p.prefix) && (!best || p.prefix.length > best.prefix.length)) best = p;
  }
  return best?.fn ?? null;
}

/** Registered exact kinds — the coverage ratchet reads this. */
export function registeredKinds(): string[] {
  return [...exact.keys()];
}

/** TESTS ONLY — reset the registry between cases. */
export function __resetReplayers(): void {
  exact.clear();
  prefixes.length = 0;
}

export type DrainResult = {
  flushed: number;
  failed: number;
  /** Non-failed items with a registered replayer still queued after this
   *  pass — i.e. a transient failure stopped a kind. The island uses it to
   *  decide whether to back off. */
  remaining: number;
};

/**
 * Drain every replayable kind currently queued. FIFO per kind; per-kind
 * mutex shared with `useOfflineQueue`'s flush (a surface-mounted drain and
 * this one can never double-send the same item); kinds with no registered
 * replayer are left untouched for the surface that owns them. Finishes with
 * an orphan sweep so photo bytes whose rows are gone get reclaimed no matter
 * which path removed the row.
 */
export async function drainAppQueue(): Promise<DrainResult> {
  const result: DrainResult = { flushed: 0, failed: 0, remaining: 0 };
  const kinds = [...new Set(list().map((q) => q.kind))];

  for (const kind of kinds) {
    const replayer = replayerFor(kind);
    if (!replayer) continue;
    await withKindLock(kind, async () => {
      for (const item of list(kind)) {
        if (item.failed) continue;
        let outcome: ReplayOutcome;
        try {
          outcome = await replayer(item);
        } catch {
          // Transient — stop this kind, keep FIFO, wait for the next trigger.
          return;
        }
        if (outcome === "ok") {
          remove(item.id);
          result.flushed += 1;
        } else {
          markFailed(item.id, outcome.error);
          result.failed += 1;
        }
      }
    });
  }

  // Reclaim bytes for rows that no longer exist — pass ALL live ids (every
  // kind), because the byte store is shared across surfaces now.
  await sweepOrphans(list().map((q) => q.id));

  result.remaining = list().filter((q) => !q.failed && replayerFor(q.kind)).length;
  return result;
}
