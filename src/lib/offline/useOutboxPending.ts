"use client";

import * as React from "react";
import { outboxCounts } from "./outbox";

/**
 * Kit 32 B2 — per-mutation offline-queue visibility.
 *
 * Returns how many writes for the given queueable endpoint(s) are sitting in
 * the durable IndexedDB outbox (the SAME store the service worker drains).
 * HONEST by construction: the number is read from the outbox itself, so a
 * surface can only ever claim a pending write that is really queued.
 *
 * Refreshes on mount, on reconnect, when the tab regains focus, and on a
 * slow poll (the SW drains in the background without notifying the window).
 */
export function useOutboxPending(endpoints: readonly string[]): number {
  const [pending, setPending] = React.useState(0);
  // The endpoints list is static per call site; key on its joined form so a
  // caller passing a fresh array literal each render doesn't re-subscribe.
  const key = endpoints.join("|");

  React.useEffect(() => {
    let alive = true;
    const eps = key.split("|").filter(Boolean);
    const refresh = () => {
      void outboxCounts().then((counts) => {
        if (!alive) return;
        setPending(eps.reduce((sum, ep) => sum + (counts[ep] ?? 0), 0));
      });
    };
    refresh();
    const interval = setInterval(refresh, 10_000);
    const onOnline = () => setTimeout(refresh, 2_000); // after the drain kicks off
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", refresh);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", refresh);
    };
  }, [key]);

  return pending;
}
