"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export type CopilotSuggestion = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

/**
 * Copilot Suggests rail (kit 20 fixture 01) — the floating bottom-right
 * panel of derived next-best actions. Every card is computed server-side
 * from real org data (blocked tasks, approvals waiting, open incidents)
 * and deep-links to the surface that clears it. Suggestions never
 * auto-apply — the header says so, and Dismiss only hides the card
 * locally for the day.
 */
const DISMISS_KEY = "atlvs-copilot-dismissed";

function loadDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const { day, ids } = JSON.parse(raw) as { day: string; ids: string[] };
    return day === new Date().toDateString() ? ids : [];
  } catch {
    return [];
  }
}

export function CopilotSuggests({ suggestions }: { suggestions: CopilotSuggestion[] }) {
  const [dismissed, setDismissed] = React.useState<string[] | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => setDismissed(loadDismissed()), []);

  if (dismissed === null) return null; // avoid a hydration flash; paints on mount
  const visible = suggestions.filter((s) => !dismissed.includes(s.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const ids = [...dismissed, id];
    setDismissed(ids);
    try {
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify({ day: new Date().toDateString(), ids }));
    } catch {
      // Storage unavailable — the card stays hidden for this render only.
    }
  };

  return (
    <aside
      aria-label="Copilot suggestions"
      className="fixed right-6 bottom-6 z-40 w-[22rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[var(--p-r-xl)] border border-[var(--p-border)] bg-[var(--p-surface)] shadow-[var(--p-elev-xl)]"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 border-b border-[var(--p-border)] px-4 py-3 text-left"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--p-accent)]" aria-hidden="true" />
        <span className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase">Copilot</span>
        <span className="font-mono text-[11px] tracking-[0.08em] text-[var(--p-text-3)] uppercase">
          Suggests · Never Auto-Applies
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-[var(--p-text-3)] transition-transform ${collapsed ? "" : "rotate-180"}`}
          aria-hidden="true"
        />
      </button>
      {!collapsed && (
        <div className="max-h-[50vh] divide-y divide-[var(--p-border)] overflow-y-auto">
          {visible.map((s) => (
            <div key={s.id} className="px-4 py-3">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">{s.body}</p>
              <div className="mt-2 flex items-center gap-2">
                <Link href={s.ctaHref} className="ps-btn ps-btn--sm">
                  {s.ctaLabel}
                </Link>
                <button type="button" className="ps-btn ps-btn--sm ps-btn--tertiary" onClick={() => dismiss(s.id)}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
