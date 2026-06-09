"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side view into the service worker's offline POST queue
 * (public/service-worker.js). The SW buffers clock punches + field
 * scans in IndexedDB while the network is down; this helper asks it
 * for queue depth over postMessage so scanner UIs can render an
 * "N Pending" badge and nudge a replay when connectivity returns.
 */

export type QueueStatus = { total: number; counts: Record<string, number> };

const STATUS_TIMEOUT_MS = 1500;

/** Ask the controlling service worker for per-endpoint queue depths.
 * Resolves null when there is no controller (SSR, non-PWA shells,
 * first uncontrolled visit) or the SW doesn't answer in time. */
export function getQueueStatus(): Promise<QueueStatus | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  const controller = navigator.serviceWorker.controller;
  if (!controller) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), STATUS_TIMEOUT_MS);
    channel.port1.onmessage = (event: MessageEvent) => {
      clearTimeout(timer);
      const data = event.data as { counts?: Record<string, number>; total?: number } | null;
      resolve({ total: data?.total ?? 0, counts: data?.counts ?? {} });
    };
    try {
      controller.postMessage({ type: "QUEUE_STATUS" }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/** Queue depth for a single endpoint, e.g. "/api/v1/scan". */
export async function getPendingCount(endpoint: string): Promise<number> {
  const status = await getQueueStatus();
  return status?.counts[endpoint] ?? 0;
}

/** Nudge the SW to replay the queue now. Covers browsers without
 * background sync (iOS Safari) when a client observes `online`.
 * Fire-and-forget — replay results surface via queue depth. */
export function requestQueueDrain(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    navigator.serviceWorker.controller?.postMessage({ type: "QUEUE_DRAIN" });
  } catch {
    /* ignore */
  }
}

/**
 * Pending-count poller for one queued endpoint. Refreshes on mount, on
 * a slow interval, and when the browser comes back online (after asking
 * the SW to drain). Call `refresh()` after each submit so the badge
 * reflects a just-queued request immediately.
 */
export function usePendingCount(endpoint: string): { count: number; refresh: () => void } {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    void getPendingCount(endpoint).then(setCount);
  }, [endpoint]);
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    let drainTimer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      requestQueueDrain();
      refresh();
      // Re-read after the drain has had a beat to replay.
      drainTimer = setTimeout(refresh, 2_000);
    };
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      if (drainTimer) clearTimeout(drainTimer);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);
  return { count, refresh };
}
