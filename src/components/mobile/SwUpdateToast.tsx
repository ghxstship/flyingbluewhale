"use client";

import { useEffect, useRef, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Service-worker update toast — kit 32 F4.
 *
 * The COMPVSS shell registers /service-worker.js (root layout inline
 * script). When a NEW worker version finishes installing while an old one
 * still controls the page, it sits in `waiting` until every tab closes —
 * which on a field device pinned to the home screen can be days. This
 * toast surfaces that state: "New Version · Tap To Reload". Tapping posts
 * SKIP_WAITING to the waiting worker; when it takes control
 * (`controllerchange`) the page reloads onto the new build.
 *
 * The reload only fires when the user asked for it (`askedRef`) — a
 * controllerchange from a first-visit claim must not bounce the page.
 */
export function SwUpdateToast() {
  const t = useT();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [reloading, setReloading] = useState(false);
  const askedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let disposed = false;

    const adopt = (sw: ServiceWorker | null) => {
      // Only an update is announceworthy: a waiting worker while another
      // version controls the page. A first install has no controller and
      // needs no reload prompt.
      if (!disposed && sw && navigator.serviceWorker.controller) setWaiting(sw);
    };

    const onUpdateFound = (reg: ServiceWorkerRegistration) => () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed") adopt(sw);
      });
    };

    let reg: ServiceWorkerRegistration | undefined;
    let updateFoundHandler: (() => void) | undefined;
    void navigator.serviceWorker.getRegistration().then((r) => {
      if (!r || disposed) return;
      reg = r;
      adopt(r.waiting);
      updateFoundHandler = onUpdateFound(r);
      r.addEventListener("updatefound", updateFoundHandler);
    });

    const onControllerChange = () => {
      if (askedRef.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      disposed = true;
      if (reg && updateFoundHandler) reg.removeEventListener("updatefound", updateFoundHandler);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  const reload = () => {
    askedRef.current = true;
    setReloading(true);
    waiting.postMessage({ type: "SKIP_WAITING" });
    // Belt-and-braces: if controllerchange never fires (e.g. the waiting
    // worker was already activated by another tab), reload anyway.
    setTimeout(() => {
      if (askedRef.current) window.location.reload();
    }, 2_500);
  };

  return (
    <div role="status" aria-live="polite">
      <button
        type="button"
        onClick={reload}
        disabled={reloading}
        className="ps-btn ps-btn--cta"
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)",
          zIndex: 30,
          justifyContent: "center",
          boxShadow: "var(--p-elev-2)",
        }}
      >
        <KIcon name="RefreshCw" size={15} className={reloading ? "motion-safe:animate-spin" : undefined} />
        {reloading
          ? t("m.swUpdate.reloading", undefined, "Reloading…")
          : t("m.swUpdate.cta", undefined, "New Version · Tap To Reload")}
      </button>
    </div>
  );
}
