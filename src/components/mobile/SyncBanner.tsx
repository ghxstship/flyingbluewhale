"use client";

import { useCallback, useEffect, useState } from "react";
import { requestQueueDrain } from "@/lib/offline/queue-status";
import { drainOutboxFromWindow, outboxSize } from "@/lib/offline/outbox";
import { size as localQueueSize, OUTBOX_EVENT } from "@/lib/offline/queue";
import { useT } from "@/lib/i18n/LocaleProvider";
import { SyncBadge } from "@/components/mobile/kit";

/**
 * <SyncBanner> — the ONE shell-level sync status line for the COMPVSS
 * offline layer. Reports the combined depth of BOTH durable outboxes:
 *
 *   1. The IndexedDB queue (field writes — clock punches, gate/inventory
 *      scans) drained by the service worker's background sync, or by
 *      `drainOutboxFromWindow` when no SW controls the page.
 *   2. The localStorage outbox (`src/lib/offline/queue.ts` — chat,
 *      daily-log server-action payloads) drained by each surface's
 *      `useOfflineQueue` hook on reconnect.
 *
 * Also renders the stale-data chip: when the service worker serves a cached
 * page/RSC payload because the network failed (SERVED_STALE message), the
 * banner says the data is an offline copy and how old it is. Pairs with
 * <ConnectivityBanner> (which shows the online/offline state itself).
 */
export function SyncBanner() {
  const t = useT();
  const [total, setTotal] = useState(0);
  const [online, setOnline] = useState(true);
  const [staleAt, setStaleAt] = useState<number | null>(null);
  const [staleSeen, setStaleSeen] = useState(false);

  const refresh = useCallback(() => {
    void outboxSize().then((idb) => setTotal(idb + localQueueSize()));
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const interval = setInterval(refresh, 10_000);
    let drainTimer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      setOnline(true);
      setStaleSeen(false);
      setStaleAt(null);
      requestQueueDrain();
      // No controlling SW (first uncontrolled visit, private mode): replay
      // the IndexedDB outbox from the window so queued writes still land.
      if (!navigator.serviceWorker?.controller) void drainOutboxFromWindow().then(refresh);
      refresh();
      drainTimer = setTimeout(refresh, 2_000);
    };
    const onOffline = () => setOnline(false);
    const onOutbox = () => refresh();
    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; cachedAt?: number | null } | null;
      if (data?.type === "SERVED_STALE") {
        setStaleSeen(true);
        setStaleAt(typeof data.cachedAt === "number" ? data.cachedAt : null);
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(OUTBOX_EVENT, onOutbox);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);
    return () => {
      clearInterval(interval);
      if (drainTimer) clearTimeout(drainTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(OUTBOX_EVENT, onOutbox);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [refresh]);

  const showQueue = total > 0;
  const showStale = staleSeen;
  if (!showQueue && !showStale) return null;

  const syncNow = () => {
    requestQueueDrain();
    if (!navigator.serviceWorker?.controller) void drainOutboxFromWindow().then(refresh);
    setTimeout(refresh, 1_500);
  };

  const staleAgeMin = staleAt ? Math.max(0, Math.round((Date.now() - staleAt) / 60_000)) : null;
  const staleLabel =
    staleAgeMin != null
      ? t("ui.sync.staleAged", { minutes: staleAgeMin }, `Offline copy · updated ${staleAgeMin}m ago`)
      : t("ui.sync.stale", undefined, "Offline copy · may be out of date");

  const queueLabel = online
    ? t("ui.sync.syncing", { count: total }, `Syncing ${total} change${total === 1 ? "" : "s"}…`)
    : t("ui.sync.queued", { count: total }, `${total} change${total === 1 ? "" : "s"} queued. They sync when back online`);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
      style={{
        background: "color-mix(in srgb, var(--p-info) 14%, var(--p-surface))",
        color: "var(--p-text-1)",
        borderBottom: "1px solid color-mix(in srgb, var(--p-info) 35%, transparent)",
      }}
    >
      {/* DS_ALIGNMENT §2: the sync/offline PILL is the DS `SyncBadge` kit
          component; only the tap-to-refresh bar (wrapper + "Sync now") stays
          app-level here. */}
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {showQueue && <SyncBadge state={online ? "syncing" : "queued"} label={queueLabel} />}
        {showStale && <SyncBadge state="stale" label={staleLabel} />}
      </span>
      {online && showQueue && (
        <button
          type="button"
          onClick={syncNow}
          className="shrink-0 font-medium text-[var(--p-info)] underline"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          {t("ui.sync.now", undefined, "Sync now")}
        </button>
      )}
    </div>
  );
}
