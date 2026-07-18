"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

const TRIGGER_PX = 70;
const MAX_PX = 120;

/**
 * Touch-driven pull-to-refresh with native overscroll fallback.
 * Pure CSS transforms — no animation library needed.
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled,
}: {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);
  // prefers-reduced-motion: the gesture still works, but the content does
  // not translate — only the indicator fades in (kit 32 B1).
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    if (disabled || refreshing) return;
    if (window.scrollY > 0) return;
    // Never hijack a drag that starts inside an overlay (sheet, dialog,
    // drawer) — those own their touch surface. Shell-level mount means this
    // wrapper sees every touch in the app.
    const target = e.target as Element | null;
    if (target?.closest('[role="dialog"], .sheet, [data-overlay]')) return;
    startY.current = e.touches[0]?.clientY ?? null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dy = touch.clientY - startY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(MAX_PX, dy * 0.5));
  }

  async function onTouchEnd() {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= TRIGGER_PX) {
      setRefreshing(true);
      try {
        // Soft haptic on supported devices
        if ("vibrate" in navigator) navigator.vibrate(8);
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  const ratio = Math.min(1, pull / TRIGGER_PX);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="relative">
      <div
        aria-live="polite"
        className="pointer-events-none absolute start-1/2 top-2 z-10 -translate-x-1/2 transition-opacity"
        style={{ opacity: ratio || (refreshing ? 1 : 0) }}
      >
        <RefreshCw
          size={18}
          className={`text-[var(--p-accent)] ${refreshing ? "motion-safe:animate-spin" : ""}`}
          style={{ transform: `rotate(${ratio * 360}deg)` }}
        />
      </div>
      <div
        style={{
          // At rest (pull === 0) apply NO transform. A transform — even
          // translateY(0) — makes this wrapper the containing block for every
          // position:fixed descendant, so FABs and .sheet/.drawer overlays
          // (inset:0) would anchor to this content box instead of the viewport
          // and mis-position on scrollable pages. Only the live pull gesture
          // sets a transform; the whole drawer canon depends on this.
          transform: reduceMotion || pull === 0 ? undefined : `translateY(${pull}px)`,
          transition: pull === 0 ? "transform var(--motion-normal) var(--ease-out)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
