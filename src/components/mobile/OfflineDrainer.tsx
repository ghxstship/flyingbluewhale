"use client";

import { useEffect, useRef } from "react";
// Side effect: registers every kind's server-action replayer.
import "@/lib/offline/replayers";
import { drainAppQueue } from "@/lib/offline/drainer";
import { OUTBOX_EVENT } from "@/lib/offline/queue";
import { drainOutboxFromWindow, outboxSize } from "@/lib/offline/outbox";
import { requestQueueDrain } from "@/lib/offline/queue-status";

/**
 * <OfflineDrainer> — the ONE app-level drain loop for both offline outboxes
 * (T1-1), mounted once in the (mobile) layout. Renders nothing.
 *
 * What it drains:
 *  1. The localStorage app queue (`queue.ts` — server-action payloads:
 *     incidents, lost & found, handover, daily logs, chat). Replayed via the
 *     registered replayers REGARDLESS of which surface enqueued — previously
 *     these only replayed while the enqueuing form was mounted.
 *  2. The IndexedDB field-write outbox (`outbox.ts`). The service worker
 *     stays the primary executor when it controls the page (background sync
 *     + the QUEUE_DRAIN nudge — draining the same IDB rows from the window
 *     concurrently would risk double-POSTs); with no controlling SW the
 *     window-side drain runs here.
 *
 * Triggers: reconnect (`online`), tab return (`visibilitychange`), a new
 * enqueue while online (OUTBOX_EVENT — covers the throw-mid-send path), and
 * an interval fallback (iOS Safari fires `online` unreliably in standalone
 * PWAs). Failed drains back off exponentially so a flapping edge-of-coverage
 * radio doesn't hammer the API; any fresh trigger resets the backoff.
 *
 * Failure surfacing is the shell <SyncBanner>'s job (pending + failed counts
 * with a retry affordance) — this island never toasts per item.
 */

const INTERVAL_MS = 60_000;
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 5 * 60_000;

export function OfflineDrainer() {
  const draining = useRef(false);
  const failures = useRef(0);
  const nextAllowedAt = useRef(0);

  useEffect(() => {
    let alive = true;

    const drain = async (force = false) => {
      if (!alive || draining.current || !navigator.onLine) return;
      if (!force && Date.now() < nextAllowedAt.current) return;
      draining.current = true;
      try {
        const result = await drainAppQueue();

        // IDB outbox: SW is the executor when present; window drain otherwise.
        if (navigator.serviceWorker?.controller) {
          if ((await outboxSize()) > 0) requestQueueDrain();
        } else {
          await drainOutboxFromWindow();
        }

        // Replayable items still queued (parked-failed excluded) means a
        // transient failure stopped a kind — back off before the next try.
        if (result.remaining > 0) {
          failures.current += 1;
          const delay = Math.min(BACKOFF_BASE_MS * 2 ** (failures.current - 1), BACKOFF_MAX_MS);
          nextAllowedAt.current = Date.now() + delay;
        } else {
          failures.current = 0;
          nextAllowedAt.current = 0;
        }
      } finally {
        draining.current = false;
      }
    };

    const onTrigger = () => {
      // A real trigger (reconnect, tab return, fresh enqueue) resets backoff:
      // conditions changed, so the next attempt is warranted now.
      failures.current = 0;
      nextAllowedAt.current = 0;
      void drain(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onTrigger();
    };
    const onEnqueue = () => {
      if (navigator.onLine) void drain();
    };

    window.addEventListener("online", onTrigger);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(OUTBOX_EVENT, onEnqueue);
    const interval = setInterval(() => void drain(), INTERVAL_MS);
    // Mount drain — covers a reload while items are queued.
    void drain(true);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("online", onTrigger);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(OUTBOX_EVENT, onEnqueue);
    };
  }, []);

  return null;
}
