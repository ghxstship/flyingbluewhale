"use client";

import { useEffect, useState } from "react";
import { Sparkles, Search, ArrowRight, CornerDownLeft, Command } from "lucide-react";

/**
 * `<CommandPaletteDemo>` — an animated, looping marketing replica of the
 * `⌘K` command palette inside ATLVS. Demonstrates the AI-native
 * affordances (slash + natural-language entry, ranked suggestions, inline
 * AI assist) without dragging the actual palette state into the marketing
 * bundle.
 *
 * Loops a scripted prompt sequence with the typewriter pattern, swapping
 * which suggestion row is highlighted. Pauses on hover so the viewer can
 * read. Fully decorative — visually replicates the chrome but does not
 * mount the production palette. Mounted from marketing pages only.
 */
const SCRIPT: Array<{ query: string; results: { icon: "ai" | "page"; label: string; hint: string }[] }> = [
  {
    query: "draft the artist rider for sza",
    results: [
      { icon: "ai", label: "Draft rider — SZA · MMW26 · sound + hospitality", hint: "AI · Production tier" },
      { icon: "page", label: "Advancing → Riders → New", hint: "Module" },
      { icon: "page", label: "SZA · MMW26 · Last rider revision (v3)", hint: "Document" },
    ],
  },
  {
    query: "open mmw26 punch list",
    results: [
      { icon: "page", label: "MMW26 Hialeah → Punch List", hint: "47 open · 12 due today" },
      { icon: "page", label: "MMW26 Hialeah → Inspections", hint: "Module" },
      { icon: "ai", label: "Summarize today's punch progress", hint: "AI" },
    ],
  },
  {
    query: "vendor payouts due this week",
    results: [
      { icon: "ai", label: "Show vendors owed by Friday + Stripe Connect status", hint: "AI" },
      { icon: "page", label: "Finance → Stripe Connect → Payouts", hint: "Module" },
      { icon: "page", label: "Procurement → POs → Open", hint: "Module · 23 awaiting" },
    ],
  },
];

export function CommandPaletteDemo() {
  const [scriptIdx, setScriptIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [paused, setPaused] = useState(false);

  // Typewriter + suggestion cycle.
  useEffect(() => {
    if (paused) return;
    const current = SCRIPT[scriptIdx].query;
    if (typed.length < current.length) {
      const t = setTimeout(() => setTyped(current.slice(0, typed.length + 1)), 38);
      return () => clearTimeout(t);
    }
    // After the query finishes, walk through highlights then advance.
    if (highlight < SCRIPT[scriptIdx].results.length - 1) {
      const t = setTimeout(() => setHighlight((h) => h + 1), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped("");
      setHighlight(0);
      setScriptIdx((i) => (i + 1) % SCRIPT.length);
    }, 1600);
    return () => clearTimeout(t);
  }, [typed, scriptIdx, highlight, paused]);

  const results = SCRIPT[scriptIdx].results;

  return (
    <div
      className="surface-raised mx-auto max-w-2xl overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Command palette demo"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
        <Search size={14} className="text-[var(--text-muted)]" aria-hidden />
        <div className="flex-1 font-mono text-sm">
          <span aria-hidden>{typed}</span>
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-[var(--org-primary)]"
            aria-hidden
          />
          <span className="sr-only">{SCRIPT[scriptIdx].query}</span>
        </div>
        <kbd className="hidden items-center gap-1 rounded border border-[var(--border-color)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline-flex">
          <Command size={10} aria-hidden />K
        </kbd>
      </div>
      <ul className="py-1.5" role="listbox">
        {results.map((r, i) => {
          const isOn = i === highlight;
          return (
            <li
              key={r.label}
              role="option"
              aria-selected={isOn}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                isOn ? "bg-[var(--bg-secondary)]" : ""
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                  r.icon === "ai"
                    ? "bg-[color-mix(in_srgb,var(--org-primary)_12%,transparent)] text-[var(--org-primary)]"
                    : "bg-[var(--surface-inset)] text-[var(--text-muted)]"
                }`}
                aria-hidden
              >
                {r.icon === "ai" ? <Sparkles size={14} /> : <ArrowRight size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{r.label}</div>
                <div className="font-mono text-[11px] tracking-wide text-[var(--text-muted)]">{r.hint}</div>
              </div>
              {isOn && (
                <kbd className="hidden items-center gap-1 rounded border border-[var(--border-color)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline-flex">
                  <CornerDownLeft size={10} aria-hidden />
                </kbd>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 font-mono text-[10px] tracking-wide text-[var(--text-muted)] uppercase">
        <span>Press / for AI · ↑↓ to walk · ⏎ to open</span>
        <span aria-hidden>● live</span>
      </div>
    </div>
  );
}
