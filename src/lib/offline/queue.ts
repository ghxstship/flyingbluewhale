/**
 * Offline write queue (kit 21 W8) — the COMPVSS field differentiator. A tiny
 * localStorage-backed FIFO of pending writes so a field submit made with no
 * signal isn't lost: it's optimistically enqueued and replayed on reconnect.
 *
 * Headless + framework-agnostic (React binding lives in `useOfflineQueue`).
 * Payloads are small JSON records (a chat body, a daily-log form) — this is
 * not a general-purpose sync engine, just a durable outbox. SSR-safe: every
 * accessor no-ops without `window`.
 */

export type QueuedItem<T = unknown> = {
  /** Stable client id — dedupes optimistic UI + guards double-flush. */
  id: string;
  /** Queue channel (e.g. "chat:<roomId>", "daily-log"). */
  kind: string;
  payload: T;
  /** Epoch ms the write was queued (passed in — Date.now() is banned in
   *  some contexts, and injecting it keeps the module pure/testable). */
  queuedAt: number;
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

/**
 * Replay the queued items for `kind` in order via `send`. Each item that
 * sends successfully is removed; the first failure stops the drain (so
 * ordering holds and a transient error doesn't drop later writes). Returns
 * the count flushed. `send` throwing OR resolving false counts as a failure.
 */
export async function flush(
  kind: string,
  send: (item: QueuedItem) => Promise<boolean | void>,
): Promise<number> {
  let flushed = 0;
  for (const item of list(kind)) {
    try {
      const ok = await send(item);
      if (ok === false) break;
      remove(item.id);
      flushed += 1;
    } catch {
      break;
    }
  }
  return flushed;
}
