"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";

/**
 * Kit 32 B1 — the online-state sync stamp under the top bar:
 * "Updated HH:MM · Tap To Refresh". One shell-level component, not
 * per-screen copies. Tapping it refreshes the RSC payload
 * (`router.refresh()`) and re-stamps; a pull-to-refresh anywhere in the
 * shell announces itself over `REFRESHED_EVENT` so the stamp follows the
 * gesture too. Offline the bar yields to <ConnectivityBanner> /
 * <SyncBanner>, which own that state — this bar is only ever the happy
 * path. Renders nothing until mounted: the stamp is wall-clock state, and
 * stamping during render is the React #418 hydration trap.
 */

/** Window event announcing "the RSC payload was just refreshed". */
export const REFRESHED_EVENT = "compvss:refreshed";

export function SyncStampBar() {
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const [online, setOnline] = React.useState(true);
  const [stamp, setStamp] = React.useState<Date | null>(null);
  const [spinning, setSpinning] = React.useState(false);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    setStamp(new Date());
    const onOnline = () => {
      setOnline(true);
      setStamp(new Date());
    };
    const onOffline = () => setOnline(false);
    const onRefreshed = () => setStamp(new Date());
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(REFRESHED_EVENT, onRefreshed);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(REFRESHED_EVENT, onRefreshed);
    };
  }, []);

  if (!online || !stamp) return null;

  const refresh = () => {
    setSpinning(true);
    router.refresh();
    setStamp(new Date());
    // router.refresh() resolves synchronously; hold the spin briefly so the
    // tap visibly did something while the payload streams in.
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <button
      type="button"
      onClick={refresh}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        padding: "5px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--p-text-3)",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "inherit",
      }}
    >
      <RefreshCw size={11} className={spinning ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
      {t("m.sync.updatedTap", { time: fmt.time(stamp) }, `Updated ${fmt.time(stamp)} · Tap To Refresh`)}
    </button>
  );
}
