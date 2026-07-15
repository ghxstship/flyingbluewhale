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
 * Bytes are stored as ArrayBuffer, not Blob. IndexedDB can hold a Blob
 * directly, but Safari — the browser most of this field fleet runs — has a
 * long history of Blob-in-IDB bugs where the handle survives and its backing
 * store quietly doesn't, which for us would mean a photo that reads as zero
 * bytes on replay. An ArrayBuffer is plain structured-clonable data with no
 * backing file to lose. It also costs nothing here: the photos are already
 * downscaled to a few hundred KB before they reach this module.
 *
 * Not base64, either — that would inflate every photo by a third and push it
 * back toward the quota this is meant to avoid.
 */

const DB_NAME = "atlvs-field-photos";
const STORE = "blobs";
const DB_VERSION = 1;

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
 * silently isn't. Best-effort: Safari grants it on engagement, others may
 * refuse, and a refusal is not a reason to fail the submit.
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
 * Store a submission's photos and return the manifest to embed in its
 * payload. Throws if IndexedDB is unavailable — the caller must NOT tell the
 * user their photos are queued when they aren't.
 */
export async function putPhotos(itemId: string, files: File[], fixes: (PhotoFix | null)[]): Promise<PhotoMeta[]> {
  if (files.length === 0) return [];
  void requestPersistence();
  const db = await openDb();
  try {
    const metas: PhotoMeta[] = [];
    for (let n = 0; n < files.length; n++) {
      const file = files[n]!;
      const bytes = await file.arrayBuffer();
      await tx(db, "readwrite", (s) => s.put({ key: blobKey(itemId, n), itemId, bytes } satisfies BlobRow));
      metas.push({
        n,
        filename: file.name,
        contentType: file.type || "image/jpeg",
        fix: fixes[n] ?? null,
      });
    }
    return metas;
  } finally {
    db.close();
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
