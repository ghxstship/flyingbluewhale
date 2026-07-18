"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { mobileTabs } from "@/lib/nav";

/**
 * Per-tab scroll restore — kit 32 enrichment B6 (P3).
 *
 * The six tab roots (Home · Calendar · Tasks · Inbox · Assets · More) are
 * long lists; App Router client navs reset the window scroll, so switching
 * Tasks → Inbox → Tasks lost your place. This shell-level island remembers
 * `window.scrollY` per tab root in sessionStorage and restores it when you
 * land back on that tab. Session-scoped on purpose: a fresh app open starts
 * at the top (stale positions on refreshed data are disorienting).
 *
 * Best-effort by design: restore is a single post-paint attempt — if the
 * list is still streaming and shorter than the saved offset, the browser
 * clamps to the bottom. Non-tab routes are untouched.
 */

const TAB_ROOTS = new Set(mobileTabs.map((tab) => tab.href));
const keyFor = (path: string) => `compvss-scroll:${path}`;

export function ScrollMemory() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !TAB_ROOTS.has(pathname)) return;

    // Restore after paint so the list has laid out.
    const raf = requestAnimationFrame(() => {
      try {
        const saved = Number(sessionStorage.getItem(keyFor(pathname)));
        if (Number.isFinite(saved) && saved > 0) window.scrollTo(0, saved);
      } catch {
        // Storage unavailable — nothing to restore.
      }
    });

    // Save on scroll, rAF-throttled.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        try {
          sessionStorage.setItem(keyFor(pathname), String(Math.round(window.scrollY)));
        } catch {
          // Storage unavailable — restore simply won't happen.
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
