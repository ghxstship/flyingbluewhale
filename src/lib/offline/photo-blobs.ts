"use client";

import type { PhotoFix } from "@/lib/mobile/photo-geo";

/**
 * Durable photo storage for the offline write queue.
 *
 * The existing outbox (`queue.ts`) is a localStorage FIFO of JSON payloads,
 * and photos are megabytes of binary — `String(file)` yields "[object File]",
 * which is precisely why `DailyLogForm` refused to queue a log with photos
 * rather than pretend it saved. That refusal was the honest answer to a real
 * gap; this module closes the gap instead.
 *
 * A SIDECAR, deliberately, rather than a third queue. IndexedDB holds the
 * bytes keyed by the queue item's id; the JSON payload keeps a small
 * `__photos` manifest. So `queue.ts` stays the single source of ordering and
 * durability, `<SyncBanner>` keeps reporting one combined pending count, and
 * nothing about the existing replay contract changes. The alternative — a
 * parallel blob queue with its own ordering — would have two outboxes
 * disagreeing about what is still pending.
 *
 * Bytes are stored as ArrayBuffer, not Blob.
 *
 * RATIONALE, WITH AN EXPIRY DATE — re-test this, don't inherit it. As of
 * **Safari 17 / July 2026**, WebKit has a long tail of Blob-in-IndexedDB bugs
 * where the handle survives a reload and its backing store quietly doesn't:
 * for us that is a photo reading as zero bytes on replay, which is the exact
 * silent failure this module exists to prevent. An ArrayBuffer is plain
 * structured-clonable data with no backing file to lose. Safari is what most
 * of this field fleet runs, so it sets the floor.
 *
 * If you are reading this years later: check whether that still holds. Blob
 * storage would be a strictly smaller memory footprint (no full buffering on
 * write), so the only thing keeping ArrayBuffer here is that bug class. The
 * cost of the current choice is bounded because photos are already downscaled
 * to a few hundred KB before they reach this module — but if capture ever
 * grows to video or RAW, this design must be REPLACED rather than extended:
 * video has to stream, not buffer.
 *
 * Not base64 either — that would inflate every photo by a third and push it
 * back toward the quota this is meant to avoid.
 */

const DB_NAME = "atlvs-field-photos";
const STORE = "blobs";
const DB_VERSION = 1;

/**
 * Ceiling on everything parked here across all queued submissions.
 *
 * Without a bound, a week of dead zones is unbounded invisible IndexedDB, and
 * the only thing between that and a quota error is a `catch` — i.e. the crew
 * member finds out at the worst moment, with no idea why. A budget turns that
 * into a sentence we can say in advance.
 *
 * Sized against the capture path, not guessed: `MAX_EDGE_PX` 1600 at JPEG
 * q0.82 lands ~200-400KB per photo, and `MAX_FILES` caps a submission at 10.
 * 64MB is therefore ~20 fully-loaded submissions — far more than anyone
 * accumulates between reconnects, and still small next to a phone's origin
 * quota. `photo-blobs.test.ts` pins this to those constants so raising the
 * downscale cap can't silently blow the budget.
 */
export const MAX_QUEUED_BYTES = 64 * 1024 * 1024;

/** What the JSON payload carries so a replay can rebuild the FormData. The
 *  bytes are NOT here — only what's needed to find and name them. */
export type PhotoMeta = {
  n: number;
  filename: string;
  contentType: string;
  fix: PhotoFix | null;
};

type BlobRow = {
  key: string;
  itemId: string;
  bytes: ArrayBuffer;
};

const blobKey = (itemId: string, n: number) => `${itemId}#${n}`;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        // Lets a drop/sweep find every blob for one queued submission
        // without scanning the whole store.
        store.createIndex("itemId", "itemId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ask the browser to stop evicting our storage under pressure.
 *
 * Without this an offline photo is exactly the thing a UA drops first when a
 * device gets tight — the crew member is told the log is queued, and then it
 * silently isn't.
 *
 * CALL THIS AT APP START, not at submit time. Chrome grants persistence on
 * engagement heuristics (installed PWA, bookmarks, visit history), so asking
 * the first time someone queues a photo is the worst possible moment: the
 * request is most likely to be refused exactly when it matters. Mounted via
 * `<StoragePersistence>` in the (mobile) layout, where engagement has had a
 * whole session to accumulate.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Whether the browser has actually promised not to evict us.
 *
 * The answer has to reach the UI. Telling someone their log is "queued" while
 * the UA is free to bin it under storage pressure is the same overclaim as
 * every other defect in this area — a durability promise we don't hold.
 */
export async function isPersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

/** Total bytes currently parked across every queued submission. */
export async function queuedBytes(): Promise<number> {
  try {
    const db = await openDb();
    try {
      const rows = await tx<BlobRow[]>(db, "readonly", (s) => s.getAll());
      return rows.reduce((n, r) => n + (r.bytes?.byteLength ?? 0), 0);
    } finally {
      db.close();
    }
  } catch {
    return 0;
  }
}

/** Thrown when a submission would push the sidecar past its budget. The
 *  caller must surface this — silently dropping photos is the whole thing we
 *  are trying not to do. */
export class PhotoBudgetExceededError extends Error {
  constructor(readonly wouldBe: number) {
    super(`Queued photos would reach ${Math.round(wouldBe / 1024 / 1024)}MB, over the ${MAX_QUEUED_BYTES / 1024 / 1024}MB budget`);
    this.name = "PhotoBudgetExceededError";
  }
}

/**
 * Store a submission's photos and return the manifest to embed in its
 * payload.
 *
 * Throws if IndexedDB is unavailable, or `PhotoBudgetExceededError` if this
 * would push the sidecar past `MAX_QUEUED_BYTES`. Both must reach the user —
 * the caller must NOT tell them their photos are queued when they aren't.
 *
 * Persistence is NOT requested here; that happens once at app start. See
 * `requestPersistence`.
 */
export async function putPhotos(
  itemId: string,
  files: File[],
  fixes: (PhotoFix | null)[],
  /** Overridable so the bound itself is testable without allocating 64MB.
   *  Callers should leave it alone. */
  budgetBytes = MAX_QUEUED_BYTES,
  /** First index to key this batch at. The photo-outbox uses it to append a
   *  single late photo behind an earlier batch without clobbering key #0. */
  startAt = 0,
): Promise<PhotoMeta[]> {
  if (files.length === 0) return [];

  // The budget is a TOTAL across every queued submission, so the backlog has
  // to be counted, not just this batch.
  const incoming = files.reduce((n, f) => n + f.size, 0);
  const wouldBe = (await queuedBytes()) + incoming;
  if (wouldBe > budgetBytes) throw new PhotoBudgetExceededError(wouldBe);

  const db = await openDb();
  try {
    const metas: PhotoMeta[] = [];
    for (let i = 0; i < files.length; i++) {
      const n = startAt + i;
      const file = files[i]!;
      const bytes = await file.arrayBuffer();
      await tx(db, "readwrite", (s) => s.put({ key: blobKey(itemId, n), itemId, bytes } satisfies BlobRow));
      metas.push({
        n,
        filename: file.name,
        contentType: file.type || "image/jpeg",
        fix: fixes[i] ?? null,
      });
    }
    return metas;
  } finally {
    db.close();
  }
}

/** Whether the bytes for one queued photo are still present. The
 *  photo-outbox surfaces this as a per-photo state instead of discovering a
 *  hole at replay time. */
export async function hasPhoto(itemId: string, n: number): Promise<boolean> {
  try {
    const db = await openDb();
    try {
      const row = await tx<BlobRow | undefined>(db, "readonly", (s) => s.get(blobKey(itemId, n)));
      return !!row?.bytes;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

/**
 * Rebuild the Files for a queued submission.
 *
 * A blob missing from the store yields no File rather than an error: the log
 * itself is still worth replaying, and the upload warning path already tells
 * the user when fewer photos landed than they attached.
 */
export async function readPhotos(itemId: string, metas: PhotoMeta[]): Promise<File[]> {
  if (metas.length === 0) return [];
  const db = await openDb();
  try {
    const out: File[] = [];
    for (const meta of metas) {
      const row = await tx<BlobRow | undefined>(db, "readonly", (s) => s.get(blobKey(itemId, meta.n)));
      if (!row?.bytes) continue;
      out.push(new File([row.bytes], meta.filename, { type: meta.contentType }));
    }
    return out;
  } finally {
    db.close();
  }
}

/** Delete every blob for a submission. Call once its row is gone from the
 *  queue — on success, and equally on a terminal failure, or the bytes
 *  outlive the thing that referenced them. */
export async function dropPhotos(itemId: string): Promise<void> {
  try {
    const db = await openDb();
    try {
      const keys = await tx<IDBValidKey[]>(db, "readonly", (s) => s.index("itemId").getAllKeys(itemId));
      for (const key of keys) await tx(db, "readwrite", (s) => s.delete(key as string));
    } finally {
      db.close();
    }
  } catch {
    // A failed cleanup must never fail a submit. Orphans are swept below.
  }
}

/**
 * Delete blobs whose submission is no longer queued.
 *
 * The queue lives in localStorage and the bytes live in IndexedDB, so the two
 * can drift: a cleared browser store, a queue item removed by a path that
 * didn't know about photos, a tab killed mid-drain. Without a sweep those
 * megabytes are invisible and permanent. Returns how many were reclaimed.
 */
export async function sweepOrphans(liveItemIds: string[]): Promise<number> {
  try {
    const live = new Set(liveItemIds);
    const db = await openDb();
    try {
      const rows = await tx<BlobRow[]>(db, "readonly", (s) => s.getAll());
      const dead = rows.filter((r) => !live.has(r.itemId));
      for (const row of dead) await tx(db, "readwrite", (s) => s.delete(row.key));
      return dead.length;
    } finally {
      db.close();
    }
  } catch {
    return 0;
  }
}
