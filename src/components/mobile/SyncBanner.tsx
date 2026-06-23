"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getQueueStatus, requestQueueDrain } from "@/lib/offline/queue-status";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * <SyncBanner> — COMPVSS offline differentiator surfaced.
 *
 * Field writes (clock punches, gate/inventory scans) are queued optimistically
 * by the service worker when the network is down and replayed on reconnect.
 * This banner makes that queue visible: it shows how many writes are waiting
 * and offers a manual "Sync now" nudge (for iOS Safari, which has no
 * background-sync). Renders nothing when the queue is empty. Pairs with
 * <ConnectivityBanner> (which shows the online/offline state itself).
 */
export function SyncBanner() {
  const t = useT();
  const [total, setTotal] = useState(0);
  const [online, setOnline] = useState(true);

  const refresh = useCallback(() => {
    void getQueueStatus().then((s) => setTotal(s?.total ?? 0));
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    refresh();
    const interval = setInterval(refresh, 10_000);
    let drainTimer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      setOnline(true);
      requestQueueDrain();
      refresh();
      drainTimer = setTimeout(refresh, 2_000);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(interval);
      if (drainTimer) clearTimeout(drainTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  if (total <= 0) return null;

  const syncNow = () => {
    requestQueueDrain();
    setTimeout(refresh, 1_500);
  };

  const label = online
    ? t("ui.sync.syncing", { count: total }, `Syncing ${total} change${total === 1 ? "" : "s"}…`)
    : t("ui.sync.queued", { count: total }, `${total} change${total === 1 ? "" : "s"} queued — will sync when back online`);

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
      <span className="flex items-center gap-2">
        <RefreshCw size={15} className={online ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
        {label}
      </span>
      {online && (
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
