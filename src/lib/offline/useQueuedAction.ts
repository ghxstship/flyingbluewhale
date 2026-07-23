"use client";

import * as React from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { geoKeyFor, parsePhotoFixes } from "@/lib/mobile/photo-geo";
import { enqueue, list, OUTBOX_EVENT } from "./queue";
import { enqueuePhotoBatch } from "./photo-outbox";
import { PhotoBudgetExceededError } from "./photo-blobs";
import { CLIENT_REF_FIELD, ITEM_ID_KEY, PHOTOS_KEY, scalarPayloadFromFormData } from "./replay-codec";

export type QueuedActionResult =
  | { status: "sent"; warning?: string }
  | { status: "queued" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

type ActionState = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

/**
 * Offline-queueable submit for server-action form surfaces (T1-1).
 *
 * The counterpart to `useOfflineQueue` for surfaces that submit a whole
 * FormData (possibly with photos) to one server action: online it delivers
 * live; offline — or when the signal dies mid-send — it parks the photos in
 * the shared photo outbox and enqueues the scalar payload under `kind`.
 * Replay is NOT this hook's job: the app-level drainer replays the item via
 * the kind's registered replayer (`replayers.ts`) whether or not this
 * surface is still mounted. That is the whole point — the old model lost
 * incidents and handovers filed with no signal unless the crew member
 * reopened the exact form after reconnecting.
 *
 * The `kind` MUST have a replayer registered in `replayers.ts` for the same
 * action — the coverage ratchet (`replay-coverage.test.ts`) enforces it.
 *
 * A client idempotency ref rides both the live and the queued submit under
 * `clientRef` (same id), so the server can dedupe a replay whose first
 * attempt landed once the backing tables can record it.
 */
export function useQueuedAction(opts: {
  kind: string;
  action: (prev: null, fd: FormData) => Promise<ActionState>;
  /** FormData key holding the photo Files (+ its `__geo` sibling). Omit for
   *  photo-less forms — do not point it at a field the form doesn't have. */
  photoField?: string;
}) {
  const t = useT();
  const [online, setOnline] = React.useState(true);
  const [queued, setQueued] = React.useState(0);
  const actionRef = React.useRef(opts.action);
  React.useEffect(() => {
    actionRef.current = opts.action;
  });

  const kind = opts.kind;
  const photoField = opts.photoField;

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const refresh = () => setQueued(list(kind).length);
    refresh();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(OUTBOX_EVENT, refresh);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(OUTBOX_EVENT, refresh);
    };
  }, [kind]);

  const submit = React.useCallback(
    async (fd: FormData): Promise<QueuedActionResult> => {
      const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      fd.set(CLIENT_REF_FIELD, id);

      const photos = photoField
        ? fd.getAll(photoField).filter((f): f is File => f instanceof File && f.size > 0)
        : [];
      const fixes = photoField ? parsePhotoFixes(fd.get(geoKeyFor(photoField)), photos.length) : [];

      if (navigator.onLine) {
        try {
          const res = await actionRef.current(null, fd);
          if (res?.error) return { status: "error", error: res.error, fieldErrors: res.fieldErrors };
          return res?.warning ? { status: "sent", warning: res.warning } : { status: "sent" };
        } catch {
          // Signal died mid-send. We still hold the bytes — make them durable
          // rather than lose the submit.
        }
      }

      const payload = scalarPayloadFromFormData(fd, photoField);
      if (photos.length > 0) {
        try {
          const metas = await enqueuePhotoBatch(kind, id, photos, fixes);
          payload[PHOTOS_KEY] = JSON.stringify(metas);
          payload[ITEM_ID_KEY] = id;
        } catch (err) {
          return {
            status: "error",
            error:
              err instanceof PhotoBudgetExceededError
                ? t(
                    "m.offline.photoBudget",
                    undefined,
                    "Too many photos are already waiting to sync. Reconnect to clear them, or remove the photos to submit now.",
                  )
                : t(
                    "m.offline.photoStoreBlocked",
                    undefined,
                    "You're offline and this device can't store photos. Reconnect to submit, or remove the photos to send it now.",
                  ),
          };
        }
      }
      enqueue({ id, kind, payload, queuedAt: Date.now() });
      return { status: "queued" };
    },
    [kind, photoField, t],
  );

  return { online, queued, submit };
}
