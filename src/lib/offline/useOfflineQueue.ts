"use client";

import * as React from "react";
import { enqueue, list, flush, type QueuedItem } from "./queue";

/**
 * React binding for the offline write queue (kit 21 W8). Gives a field
 * surface: online state, the pending count for its `kind`, a `submit` that
 * sends immediately when online and enqueues when not, and auto-flush on
 * reconnect. The caller supplies `send` (its server action / fetch) — the
 * hook owns the durability + retry, not the transport.
 */
export function useOfflineQueue<T>(
  kind: string,
  send: (payload: T) => Promise<boolean | void>,
) {
  const [online, setOnline] = React.useState(true);
  const [pending, setPending] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);
  const sendRef = React.useRef(send);
  React.useEffect(() => {
    sendRef.current = send;
  });

  const refresh = React.useCallback(() => setPending(list(kind).length), [kind]);

  const drain = React.useCallback(async () => {
    if (list(kind).length === 0) return;
    setSyncing(true);
    try {
      await flush(kind, (item: QueuedItem) => sendRef.current(item.payload as T));
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [kind, refresh]);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const onOnline = () => {
      setOnline(true);
      void drain();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Attempt a drain on mount too (covers a reload while items are queued).
    if (navigator.onLine) void drain();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [drain, refresh]);

  /**
   * Send now when online; otherwise enqueue for replay. `id` dedupes an
   * optimistic UI row against its eventual real row. Returns:
   *   "sent"   — delivered live.
   *   "failed" — a handled business/validation error (send returned false).
   *              NOT queued; the caller should surface it.
   *   "queued" — offline, or a live send that THREW (network/transient); the
   *              write is durable and replays on reconnect.
   */
  const submit = React.useCallback(
    async (id: string, payload: T): Promise<"sent" | "failed" | "queued"> => {
      if (navigator.onLine) {
        try {
          const ok = await sendRef.current(payload);
          // A definite business failure must not be retried forever — surface
          // it instead of queueing.
          if (ok === false) return "failed";
          return "sent";
        } catch {
          // Network/transient — fall through to enqueue.
        }
      }
      enqueue<T>({ id, kind, payload, queuedAt: Date.now() });
      refresh();
      return "queued";
    },
    [kind, refresh],
  );

  return { online, pending, syncing, submit, drain };
}
