"use client";

import { useEffect, useRef } from "react";

/**
 * Scrolls the thread to its newest message on mount (C-10). Rendered as the
 * last element of the message list; instant (no smooth animation) so the
 * first paint lands at the bottom like every chat surface users know.
 */
export function ScrollToLatest() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, []);
  return <div ref={ref} aria-hidden="true" />;
}
