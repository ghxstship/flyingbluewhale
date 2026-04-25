"use client";

import * as React from "react";

/**
 * FloatingActionBar — bottom-center pill that surfaces bulk actions when
 * rows are selected. Animates in/out, locks to viewport, dismissible via
 * Esc. Linear and Stripe both float bulk actions instead of inlining
 * them — this is the modern affordance.
 */
export function FloatingActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (count === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClear();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [count, onClear]);

  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`${count} selected`}
      className="pointer-events-auto fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-raised)] px-3 py-1.5 shadow-lg animate-fade-in"
      style={{
        animation: "var(--motion-toast, fade-in 200ms ease-out)",
      }}
    >
      <button
        type="button"
        onClick={onClear}
        className="rounded-full px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
        aria-label="Clear selection"
      >
        {count} selected
      </button>
      <span aria-hidden className="h-4 w-px bg-[var(--border-color)]" />
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
