"use client";

/**
 * Client-side view of the durable IndexedDB outbox — the SAME store the
 * service worker drains (`atlvs-punch-queue` / `punches`, see
 * public/service-worker.js). This is the canonical offline queue for field
 * writes (clock punches, gate scans, inventory scans); the localStorage
 * queue in `./queue.ts` is scoped to server-action payloads (chat,
 * daily-log) that can't be replayed as raw endpoint POSTs.
 *
 * `postFieldWrite` is the one submit path field UIs should use for
 * queueable endpoints:
 *   1. fetch() the endpoint — when the SW controls the page, a network
 *      failure is intercepted there and answered with a 202 `queued` body.
 *   2. If there is NO controlling SW (first uncontrolled visit, private
 *      mode) and the fetch throws, the write is enqueued here directly —
 *      same rows, same store — and drained by the SW later or by
 *      `drainOutboxFromWindow()` when the browser comes back online.
 */

const QUEUE_DB = "atlvs-punch-queue";
const QUEUE_STORE = "punches";
const SYNC_TAG = "punch-replay";

/** Endpoints the service worker queues + replays. Keep in sync with
 * QUEUEABLE_ENDPOINTS in public/service-worker.js. */
export const QUEUEABLE_ENDPOINTS = [
  "/api/v1/shifts/checkin",
  "/api/v1/time/clock",
  "/api/v1/scan",
  "/api/v1/accreditation/scan",
  "/api/v1/equipment/scan",
  "/api/v1/kiosk/punch",
] as const;

export type QueueableEndpoint = (typeof QUEUEABLE_ENDPOINTS)[number];

export type FieldWriteResult<T> =
  | { status: "ok"; data: T }
  | { status: "queued" }
  /** `code`/`details` carry the API envelope's machine-readable error so a
   *  caller can branch on a specific rejection instead of matching on
   *  message text — e.g. a geofence-blocked punch (422 `geofence_blocked`)
   *  is a prompt, not a failure. Both are absent for transport-level
   *  failures, which have no envelope. */
  | { status: "error"; message: string; code?: string; details?: unknown };

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

type OutboxRow = { id?: number; endpoint: string; body: string; enqueued_at: number };

function getAllRows(db: IDBDatabase): Promise<OutboxRow[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxRow[]);
    req.onerror = () => reject(req.error);
  });
}

/** Append a request to the durable outbox (window-side fallback for when no
 * service worker controls the page). Mirrors the SW's row shape exactly. */
export async function enqueueOutbox(endpoint: string, body: string): Promise<void> {
  const db = await openQueueDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).add({ endpoint, body, enqueued_at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  // Ask the SW (if any) to pick it up on the next sync opportunity.
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sync = (reg as unknown as { sync?: { register: (t: string) => Promise<void> } })?.sync;
    if (sync) await sync.register(SYNC_TAG);
  } catch {
    /* no background sync — drainOutboxFromWindow covers reconnect */
  }
}

/** Queued rows per endpoint (kit 32 B2 — per-mutation pending visibility).
 * Read directly from IndexedDB so a surface can show "Will Sync · N" for
 * exactly the writes it owns — never a fabricated pending state. */
export async function outboxCounts(): Promise<Record<string, number>> {
  if (typeof indexedDB === "undefined") return {};
  try {
    const db = await openQueueDb();
    const rows = await getAllRows(db).catch(() => [] as OutboxRow[]);
    db.close();
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const ep = row.endpoint || "/api/v1/shifts/checkin";
      counts[ep] = (counts[ep] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/** Total queued rows (all endpoints) — read directly from IndexedDB so the
 * count is available even without a controlling service worker. */
export async function outboxSize(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  try {
    const db = await openQueueDb();
    const rows = await getAllRows(db).catch(() => [] as OutboxRow[]);
    db.close();
    return rows.length;
  } catch {
    return 0;
  }
}

/**
 * Replay the outbox from the window context. Only needed when no service
 * worker controls the page (the SW's background-sync / QUEUE_DRAIN path is
 * the primary drain). FIFO per endpoint; 4xx (except 429) is terminal and
 * drops the row, 5xx / network failures stop that endpoint's drain.
 */
export async function drainOutboxFromWindow(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  let db: IDBDatabase;
  try {
    db = await openQueueDb();
  } catch {
    return 0;
  }
  const rows = await getAllRows(db).catch(() => [] as OutboxRow[]);
  const blocked = new Set<string>();
  let drained = 0;
  for (const row of rows) {
    const endpoint = row.endpoint || "/api/v1/shifts/checkin";
    if (blocked.has(endpoint)) continue;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: row.body,
      });
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(QUEUE_STORE, "readwrite");
          tx.objectStore(QUEUE_STORE).delete(row.id as number);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        drained += 1;
      } else {
        blocked.add(endpoint);
      }
    } catch {
      blocked.add(endpoint);
    }
  }
  db.close();
  return drained;
}

/**
 * POST a field write to a queueable endpoint. Success and queued paths are
 * both non-throwing — callers branch on `status`:
 *   "ok"     — landed live; `data` is the API payload.
 *   "queued" — durably queued (SW 202 or window-side enqueue); will replay
 *              on reconnect. Show "recorded, will sync" — never an error.
 *   "error"  — a real rejection (validation, FSM conflict, auth). Surface it.
 */
export async function postFieldWrite<T>(
  endpoint: QueueableEndpoint,
  body: Record<string, unknown>,
): Promise<FieldWriteResult<T>> {
  const raw = JSON.stringify(body);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: raw,
    });
    const json = (await res.json().catch(() => null)) as
      | {
          ok?: boolean;
          queued?: boolean;
          data?: T;
          error?: { message?: string; code?: string; details?: { code?: string } & Record<string, unknown> };
        }
      | null;
    if (res.status === 202 && json?.queued) return { status: "queued" };
    if (res.ok && json?.ok) return { status: "ok", data: json.data as T };
    return {
      status: "error",
      message: json?.error?.message ?? `Request failed (${res.status})`,
      // Prefer the specific cause in `details.code` (e.g. "geofence_blocked")
      // over the envelope's coarse `code` ("unprocessable"), which only
      // names the HTTP class.
      code: json?.error?.details?.code ?? json?.error?.code,
      details: json?.error?.details,
    };
  } catch {
    // Network failure with no SW interception — queue it ourselves in the
    // same durable store the SW drains.
    try {
      await enqueueOutbox(endpoint, raw);
      return { status: "queued" };
    } catch {
      return { status: "error", message: "Offline and the device queue is unavailable. This was not recorded." };
    }
  }
}
