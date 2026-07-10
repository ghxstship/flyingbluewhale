"use client";

import { useEffect, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * COMPVSS install prompt (A2HS) — D-11.
 *
 * Chromium: captures `beforeinstallprompt`, suppresses the mini-infobar, and
 * surfaces a small dismissible banner above the tab bar with an Install
 * button that replays the captured prompt.
 *
 * iOS Safari (no `beforeinstallprompt`): shows an "Add to Home Screen" coach
 * mark instead (Share → Add to Home Screen), since that's the only install
 * path Apple offers.
 *
 * Dismissal persists in localStorage for 30 days so the banner doesn't nag a
 * crew member every shift. Nothing renders when already installed
 * (standalone display mode).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "compvss-install-dismissed-at";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
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

export function InstallPrompt() {
  const t = useT();
  const [mode, setMode] = useState<"hidden" | "native" | "ios">("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires beforeinstallprompt — show the coach mark instead.
    if (isIos()) setMode("ios");

    const onInstalled = () => setMode("hidden");
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage unavailable — session-only dismissal still applies.
    }
    setMode("hidden");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setMode("hidden");
    else dismiss();
  };

  if (mode === "hidden") return null;

  return (
    <div
      role="region"
      aria-label={t("m.install.regionLabel", undefined, "Install App")}
      className="fixed inset-x-3 z-20 rounded-2xl border border-[var(--p-border)] bg-[var(--p-surface)] p-3 shadow-[var(--p-elev-2)]"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
    >
      <div className="flex items-center gap-3">
        <span className="more-ic" aria-hidden="true">
          <KIcon name="Smartphone" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] leading-tight font-bold text-[var(--p-text-1)]">
            {t("m.install.title", undefined, "Install COMPVSS")}
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-[var(--p-text-2)]">
            {mode === "ios"
              ? t(
                  "m.install.iosHint",
                  undefined,
                  "Tap Share, then Add to Home Screen for offline access on the floor.",
                )
              : t("m.install.body", undefined, "One tap from your home screen. Works offline on the floor.")}
          </div>
        </div>
        {mode === "native" && (
          <button type="button" className="ps-btn ps-btn--cta ps-btn--sm" onClick={install}>
            {t("m.install.cta", undefined, "Install")}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("m.install.dismiss", undefined, "Dismiss install prompt")}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[var(--p-text-3)]"
        >
          <KIcon name="X" size={16} />
        </button>
      </div>
    </div>
  );
}
