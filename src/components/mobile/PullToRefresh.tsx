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

  function onTouchStart(e: React.TouchEvent) {
    if (disabled || refreshing) return;
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
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
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      <div
        aria-live="polite"
        className="pointer-events-none absolute start-1/2 top-2 z-10 -translate-x-1/2 transition-opacity"
        style={{ opacity: ratio || (refreshing ? 1 : 0) }}
      >
        <RefreshCw
          size={18}
          className={`text-[var(--org-primary)] ${refreshing ? "motion-safe:animate-spin" : ""}`}
          style={{ transform: `rotate(${ratio * 360}deg)` }}
        />
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: pull === 0 ? "transform 200ms" : "none" }}>
        {children}
      </div>
    </div>
  );
}
