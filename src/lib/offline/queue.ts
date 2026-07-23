/**
 * Offline write queue (kit 21 W8). A tiny localStorage-backed FIFO of
 * pending writes so a field submit made with no signal isn't lost: it's
 * optimistically enqueued and replayed on reconnect.
 *
 * SCOPE: server-action payloads that need a caller-supplied `send` to
 * replay (chat messages, daily-log forms). Field writes that map to a
 * queueable POST endpoint (clock punches, gate/inventory scans) use the
 * durable IndexedDB outbox instead — `src/lib/offline/outbox.ts`, drained
 * by the service worker. The shell <SyncBanner> reports both queues as one
 * combined pending count.
 *
 * Headless + framework-agnostic (React binding lives in `useOfflineQueue`).
 * Payloads are small JSON records — this is not a general-purpose sync
 * engine, just a durable outbox. SSR-safe: every accessor no-ops without
 * `window`. Writes dispatch OUTBOX_EVENT so shell chrome can refresh its
 * pending count immediately.
 */

/** window event dispatched whenever the outbox contents change. */
export const OUTBOX_EVENT = "atlvs:offline-outbox";

export type QueuedItem<T = unknown> = {
  /** Stable client id — dedupes optimistic UI + guards double-flush. */
  id: string;
  /** Queue channel (e.g. "chat:<roomId>", "daily-log"). */
  kind: string;
  payload: T;
  /** Epoch ms the write was queued (passed in — Date.now() is banned in
   *  some contexts, and injecting it keeps the module pure/testable). */
  queuedAt: number;
  /**
   * Set when a background replay hit a TERMINAL rejection (validation / FSM /
   * auth — the server answered and said no). The row is parked, not dropped:
   * `flush` skips it so one poisoned write can't wedge every later item of
   * its kind, and the shell banner offers an explicit retry (`clearFailed`).
   * Transient failures (network, 5xx) never set this — they just stop the
   * drain and wait for the next reconnect.
   */
  failed?: { at: number; message: string; attempts: number };
};

const KEY = "atlvs.offline.queue.v1";

function read(): QueuedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full / blocked (private mode) — the write is lost rather than
    // throwing into the submit path. Acceptable for an outbox of last resort.
  }
  try {
    window.dispatchEvent(new Event(OUTBOX_EVENT));
  } catch {
    /* ignore */
  }
}

/** Append an item to the outbox. Returns the full queue after the append. */
export function enqueue<T>(item: QueuedItem<T>): QueuedItem[] {
  const items = read();
  // Idempotent on id — a retried enqueue (double tap) doesn't duplicate.
  if (items.some((q) => q.id === item.id)) return items;
  const next = [...items, item as QueuedItem];
  write(next);
  return next;
}

/** Every queued item, or just those for one kind. */
export function list(kind?: string): QueuedItem[] {
  const items = read();
  return kind ? items.filter((q) => q.kind === kind) : items;
}

/** Remove one item by id. Returns the remaining queue. */
export function remove(id: string): QueuedItem[] {
  const next = read().filter((q) => q.id !== id);
  write(next);
  return next;
}

/** Total queued count (all kinds). */
export function size(): number {
  return read().length;
}

/** Items parked by a terminal replay rejection (see `QueuedItem.failed`). */
export function listFailed(): QueuedItem[] {
  return read().filter((q) => q.failed);
}

/** Count of parked-failed items — the shell banner's "N failed" chip. */
export function failedCount(): number {
  return listFailed().length;
}

/**
 * Park an item as terminally failed (server answered with a business /
 * validation rejection during a background replay). Keeps the row + payload
 * so the user can retry explicitly; `flush` skips it meanwhile.
 */
export function markFailed(id: string, message: string): void {
  const items = read();
  const item = items.find((q) => q.id === id);
  if (!item) return;
  item.failed = {
    at: Date.now(),
    message,
    attempts: (item.failed?.attempts ?? 0) + 1,
  };
  write(items);
}

/**
 * Clear the failed mark (all items, or just `ids`) so the next drain retries
 * them. Returns how many were re-armed. The retry affordance in the shell
 * <SyncBanner> calls this, then nudges a drain.
 */
export function clearFailed(ids?: string[]): number {
  const items = read();
  let cleared = 0;
  for (const item of items) {
    if (!item.failed) continue;
    if (ids && !ids.includes(item.id)) continue;
    delete item.failed;
    cleared += 1;
  }
  if (cleared) write(items);
  return cleared;
}

/**
 * Per-kind drain mutex, shared by every drain path in the bundle (the
 * surface-mounted `useOfflineQueue` drain AND the app-level drainer island).
 * Without it, a reconnect can fire both at once and double-send the same
 * queued item — the enqueue is idempotent on id, the server insert is not.
 * Returns null (without running `fn`) when a drain for `kind` is already in
 * flight; that drain is already working the same items.
 */
const drainingKinds = new Set<string>();
export async function withKindLock<T>(kind: string, fn: () => Promise<T>): Promise<T | null> {
  if (drainingKinds.has(kind)) return null;
  drainingKinds.add(kind);
  try {
    return await fn();
  } finally {
    drainingKinds.delete(kind);
  }
}

/**
 * Replay the queued items for `kind` in order via `send`. Each item that
 * sends successfully is removed; the first failure stops the drain (so
 * ordering holds and a transient error doesn't drop later writes). Returns
 * the count flushed. `send` throwing OR resolving false counts as a failure.
 * Items parked as `failed` are skipped (explicit retry re-arms them); a
 * concurrent drain of the same kind short-circuits to 0 via the kind lock.
 */
export async function flush(
  kind: string,
  send: (item: QueuedItem) => Promise<boolean | void>,
): Promise<number> {
  const flushed = await withKindLock(kind, async () => {
    let n = 0;
    for (const item of list(kind)) {
      if (item.failed) continue;
      try {
        const ok = await send(item);
        if (ok === false) break;
        remove(item.id);
        n += 1;
      } catch {
        break;
      }
    }
    return n;
  });
  return flushed ?? 0;
}
