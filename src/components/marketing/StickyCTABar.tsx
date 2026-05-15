"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CANONICAL_CTAS } from "@/lib/seo";

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
      aria-label="Quick access"
      className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs sm:text-sm">
          <span className="font-semibold">ATLVS is open.</span>{" "}
          <span className="text-[var(--text-muted)]">Free for small teams. No card.</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={CANONICAL_CTAS.primary.href} className="btn btn-primary btn-sm whitespace-nowrap">
            {CANONICAL_CTAS.primary.label}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="px-1 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
