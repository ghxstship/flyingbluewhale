"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RadioTower } from "lucide-react";

/**
 * Show-Day Mode pill (kit 20 fixture 01) — flips the console home into the
 * live-ops strip. Persisted per user (`ui_state.show_day_mode`); the server
 * component reads the flag and renders the Show-Day tiles, so the toggle
 * just patches and refreshes.
 */
export function ShowDayToggle({ on }: { on: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const toggle = () => {
    startTransition(async () => {
      try {
        await fetch("/api/v1/me/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ show_day_mode: !on }),
        });
      } catch {
        // Non-fatal — the refresh below re-reads whatever persisted.
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-focus)] ${
        on
          ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-on)]"
          : "border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
      }`}
    >
      <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
      Show-Day Mode
    </button>
  );
}
