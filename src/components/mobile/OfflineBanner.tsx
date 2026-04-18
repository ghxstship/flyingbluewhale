"use client";

import * as React from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline indicator. Shows a banner when navigator.onLine is false.
 * Briefly shows a "back online" toast-style banner on reconnect.
 */
export function OfflineBanner() {
  const [online, setOnline] = React.useState(true);
  const [justReconnected, setJustReconnected] = React.useState(false);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    function onOnline() {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2500);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!online) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-medium text-amber-950"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <WifiOff size={12} aria-hidden="true" />
        <span>You're offline — actions will queue and sync when you reconnect.</span>
      </div>
    );
  }
  if (justReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 bg-emerald-500 px-4 py-2 text-xs font-medium text-emerald-950"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <Wifi size={12} aria-hidden="true" />
        <span>Back online — syncing queued actions…</span>
      </div>
    );
  }
  return null;
}
