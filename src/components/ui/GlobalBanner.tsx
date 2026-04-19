"use client";

import * as React from "react";
import { WifiOff, Wifi, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

/**
 * Top-of-shell announcement banner. Replaces the mobile-only OfflineBanner
 * with a general primitive usable in every shell. See
 * docs/ia/02-navigation-redesign.md §7 #6.
 *
 * Kinds:
 *   - offline  — amber, persists until `navigator.onLine` flips true
 *   - online   — emerald, brief "back online" toast (auto-hides after 2.5s)
 *   - warning  — amber, dismissable unless `persistent` set
 *   - info     — sky, dismissable
 *   - success  — emerald, dismissable
 *
 * Positioning: fixed to `inset-x-0 top-0` with `z-40` so it sits above the
 * glass nav (`z-30`) but below open dialogs (`z-50`). Respects safe-area
 * insets so it doesn't collide with iOS notch / Dynamic Island.
 */

type BannerKind = "offline" | "online" | "warning" | "info" | "success";

const KIND_STYLES: Record<BannerKind, { bg: string; fg: string; Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = {
  offline: { bg: "bg-amber-500", fg: "text-amber-950", Icon: WifiOff },
  online: { bg: "bg-emerald-500", fg: "text-emerald-950", Icon: Wifi },
  warning: { bg: "bg-amber-500", fg: "text-amber-950", Icon: AlertTriangle },
  info: { bg: "bg-sky-500", fg: "text-sky-950", Icon: Info },
  success: { bg: "bg-emerald-500", fg: "text-emerald-950", Icon: CheckCircle2 },
};

export function GlobalBanner({
  kind,
  children,
  onDismiss,
  persistent = false,
}: {
  kind: BannerKind;
  children: React.ReactNode;
  onDismiss?: () => void;
  persistent?: boolean;
}) {
  const { bg, fg, Icon } = KIND_STYLES[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-40 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${bg} ${fg}`}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
    >
      <Icon size={12} aria-hidden />
      <span>{children}</span>
      {!persistent && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className="ml-2 rounded p-0.5 hover:bg-black/10"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * Network-connectivity banner. Subscribes to `online` / `offline` window
 * events. Shows persistent amber while offline; briefly flashes emerald
 * on reconnect. Zero config — drop it into any shell layout.
 */
export function ConnectivityBanner() {
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
      <GlobalBanner kind="offline" persistent>
        You&rsquo;re offline — actions will queue and sync when you reconnect.
      </GlobalBanner>
    );
  }
  if (justReconnected) {
    return (
      <GlobalBanner kind="online" persistent>
        Back online — syncing queued actions…
      </GlobalBanner>
    );
  }
  return null;
}
