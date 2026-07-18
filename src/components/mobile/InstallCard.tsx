"use client";

import { useEffect, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * COMPVSS install prompt (A2HS) — kit 32 F5.
 *
 * The install prompt is a CARD on /m/more, shown from the 2nd visit on —
 * not a floating shell banner (that was the pre-kit D-11 treatment this
 * replaces; the kit's More hub owns the affordance).
 *
 *  - Visit counting: `InstallVisitBeacon` rides the mobile shell layout and
 *    bumps a localStorage counter once per browser session. The card stays
 *    hidden until the counter reads ≥ 2 — a first-shift visitor is never
 *    asked to commit to the home screen.
 *  - Chromium: the beacon captures `beforeinstallprompt` (module-scoped, so
 *    a client-side nav to More can still replay it) and the card's Install
 *    button replays it.
 *  - iOS Safari (no `beforeinstallprompt`): the card shows the
 *    Share → Add to Home Screen instructions line instead.
 *  - Dismissal is PERMANENT (localStorage) — the card never nags again.
 *    Nothing renders when already installed (standalone display mode).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const VISIT_KEY = "compvss-visit-count";
const VISIT_SESSION_KEY = "compvss-visit-counted";
const DISMISS_KEY = "compvss-a2hs-dismissed";
/** Window event: the beacon captured a fresh beforeinstallprompt. */
const PROMPT_CAPTURED_EVENT = "compvss:install-prompt-captured";

/** Module-scoped so the card (mounted later, on More) can replay the event
 *  the beacon (mounted in the shell) captured at page load. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function visitCount(): number {
  try {
    const n = Number(localStorage.getItem(VISIT_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac; the touch check catches it.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Shell-level, renders nothing: counts one visit per browser session and
 *  captures `beforeinstallprompt` for the More card to replay. */
export function InstallVisitBeacon() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(VISIT_SESSION_KEY)) {
        sessionStorage.setItem(VISIT_SESSION_KEY, "1");
        localStorage.setItem(VISIT_KEY, String(visitCount() + 1));
      }
    } catch {
      // Storage unavailable — the card simply never shows.
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event(PROMPT_CAPTURED_EVENT));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

/** The /m/more card. */
export function InstallCard() {
  const t = useT();
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");

  useEffect(() => {
    if (isStandalone() || isDismissed() || visitCount() < 2) return;

    const resolve = () => {
      if (deferredPrompt) setMode("native");
      else if (isIos()) setMode("ios");
      // Neither: this browser has no install path to offer — stay hidden
      // rather than painting a button that does nothing.
    };
    resolve();
    window.addEventListener(PROMPT_CAPTURED_EVENT, resolve);
    const onInstalled = () => setMode("hidden");
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener(PROMPT_CAPTURED_EVENT, resolve);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Session-only dismissal still applies.
    }
    setMode("hidden");
  };

  const install = async () => {
    const evt = deferredPrompt;
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === "accepted") setMode("hidden");
    else dismiss();
  };

  if (mode === "hidden") return null;

  return (
    <div
      role="region"
      aria-label={t("m.a2hs.regionLabel", undefined, "Install App")}
      className="item"
      style={{ display: "block", marginBottom: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="more-ic" aria-hidden="true">
          <KIcon name="Smartphone" size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.a2hs.title", undefined, "Install COMPVSS")}</div>
          <div className="s" style={{ whiteSpace: "normal" }}>
            {mode === "ios"
              ? t("m.a2hs.iosHint", undefined, "Tap Share, then Add to Home Screen for offline access on the floor.")
              : t("m.a2hs.body", undefined, "One tap from your home screen. Works offline on the floor.")}
          </div>
        </div>
        {mode === "native" && (
          <button type="button" className="ps-btn ps-btn--cta ps-btn--sm" onClick={install}>
            {t("m.a2hs.cta", undefined, "Install")}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("m.a2hs.dismiss", undefined, "Dismiss install card")}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[var(--p-text-3)]"
        >
          <KIcon name="X" size={16} />
        </button>
      </div>
    </div>
  );
}
