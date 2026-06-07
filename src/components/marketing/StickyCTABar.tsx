"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CANONICAL_CTAS } from "@/lib/seo";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Sticky CTA bar — slides up from bottom after the viewer scrolls past a
 * threshold. Persists until they dismiss or convert. Mounted in the
 * marketing layout so every long-form page gets it.
 *
 * Show threshold: scrollY > 800px (just past most heroes). Dismissal
 * persists for the session via sessionStorage so we don't badger the
 * same visitor across pages.
 */
export function StickyCTABar() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("sticky-cta-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const dismiss = () => {
    sessionStorage.setItem("sticky-cta-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label={t("components.stickyCta.region", undefined, "Quick access")}
      className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] p-3 shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs sm:text-sm">
          <span className="font-semibold">{t("components.stickyCta.open", undefined, "ATLVS is open.")}</span>{" "}
          <span className="text-[var(--p-text-2)]">
            {t("components.stickyCta.tagline", undefined, "Free for small teams. No card.")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={CANONICAL_CTAS.primary.href} className="ps-btn ps-btn--sm whitespace-nowrap">
            {CANONICAL_CTAS.primary.label}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("components.stickyCta.dismiss", undefined, "Dismiss")}
            className="px-1 text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
