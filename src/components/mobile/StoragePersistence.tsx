"use client";

import { useEffect } from "react";
import { requestPersistence } from "@/lib/offline/photo-blobs";

/**
 * Ask once, at app start, for durable storage.
 *
 * COMPVSS parks offline work in IndexedDB — queued photos, the punch outbox —
 * and by default a browser is free to evict all of it when the device gets
 * tight. That eviction is silent, and it lands on exactly the crew member who
 * was told their log was saved.
 *
 * Timing is the whole point of this component. Chrome grants persistence on
 * engagement heuristics (installed PWA, bookmark, visit history), so asking at
 * the moment someone first queues a photo is the worst possible time: the
 * request is likeliest to be refused precisely when it matters. Asking here —
 * on every mobile page, early, before anything needs it — gives engagement a
 * session to accumulate and the grant a chance to already be in place.
 *
 * Fire-and-forget by design: a refusal is not an error and must not interrupt
 * anyone. What a refusal DOES change is what we're allowed to claim, and that
 * is read back through `isPersisted()` at the point we'd otherwise promise
 * durability.
 */
export function StoragePersistence() {
  useEffect(() => {
    void requestPersistence();
  }, []);
  return null;
}
