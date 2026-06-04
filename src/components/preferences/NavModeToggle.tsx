"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

/**
 * Per-user toggle for the ATLVS console sidebar shape (ADR-0006).
 *
 *   - `domain` (default) — 7 plain-English groups: Projects · Production ·
 *     Workforce · Sales · Finance · Procurement · Operations.
 *   - `xpms` — 10 XPMS-numeric classes (ADR-0004 spine), preserved for
 *     power users who internalized the taxonomy.
 *
 * Writes to `user_preferences.ui_state.nav_mode` via the existing
 * PATCH `/api/v1/me/preferences` endpoint; the next render of
 * `(platform)/layout.tsx` picks up the new shape via `getPlatformNav()`.
 * A `router.refresh()` after the write nudges the layout server-render
 * without a full page reload.
 */
export function NavModeToggle({ initial }: { initial: "domain" | "xpms" }) {
  const router = useRouter();
  const { setPrefs } = useUserPreferences();
  const [mode, setMode] = React.useState<"domain" | "xpms">(initial);
  const [pending, setPending] = React.useState(false);

  async function pick(next: "domain" | "xpms") {
    if (next === mode || pending) return;
    setMode(next);
    setPending(true);
    try {
      await setPrefs({ nav_mode: next });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
        Console sidebar
      </legend>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => void pick("domain")}
          aria-pressed={mode === "domain"}
          className="surface hover-lift flex flex-col items-start gap-1 px-3 py-2 text-left text-sm disabled:opacity-60"
          disabled={pending}
        >
          <span className="font-medium">Domain</span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Plain-English groups (Projects, Sales, Finance…). Default.
          </span>
        </button>
        <button
          type="button"
          onClick={() => void pick("xpms")}
          aria-pressed={mode === "xpms"}
          className="surface hover-lift flex flex-col items-start gap-1 px-3 py-2 text-left text-sm disabled:opacity-60"
          disabled={pending}
        >
          <span className="font-medium">XPMS spine</span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Numeric class taxonomy (0 EXECUTIVE … 9 TECHNOLOGY).
          </span>
        </button>
      </div>
    </fieldset>
  );
}
