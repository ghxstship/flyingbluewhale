"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useHotkeys, useShortcutRegistry, registerShortcut } from "@/lib/hooks/useHotkeys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";

/**
 * <ShortcutDialog> — opens on `?` key. Lists every registered shortcut
 * grouped by scope with a live filter and count. See
 * docs/ia/02-navigation-redesign.md §7 #8.
 *
 * Discovery: `registerShortcut()` is called by every host component (the
 * command palette, the sidebar, the dialog itself, …). Filter is plain
 * substring match against description + combo.
 *
 * Group order: "Global" first, then alphabetical. Ensures the most-used
 * shortcuts (palette, help, sidebar) surface above the fold.
 */

const GROUP_ORDER = ["Global", "Navigation", "Editor", "Table"];

export function ShortcutDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const shortcuts = useShortcutRegistry();
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    return registerShortcut("?", "Show keyboard shortcuts", "Global");
  }, []);

  useHotkeys([
    {
      combo: "?",
      skipWhenEditing: true,
      handler: () => setOpen(true),
    },
  ]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => searchRef.current?.focus(), 40);
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query) return shortcuts;
    const q = query.toLowerCase();
    return shortcuts.filter(
      (s) => s.description.toLowerCase().includes(q) || s.combo.toLowerCase().includes(q),
    );
  }, [shortcuts, query]);

  const grouped = React.useMemo(() => {
    const out: Record<string, typeof shortcuts> = {};
    for (const s of filtered) (out[s.group] ||= []).push(s);
    return Object.entries(out).sort(([a], [b]) => {
      const ai = GROUP_ORDER.indexOf(a);
      const bi = GROUP_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            Keyboard shortcuts
            <span className="ml-2 rounded bg-[var(--surface-inset)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
              {shortcuts.length}
            </span>
          </DialogTitle>
          <DialogDescription>
            Press <kbd className="rounded border border-[var(--border-color)] px-1 text-xs">?</kbd> anywhere to
            open. Press <kbd className="rounded border border-[var(--border-color)] px-1 text-xs">Esc</kbd> to dismiss.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-1.5">
          <Search size={12} className="text-[var(--text-muted)]" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter shortcuts…"
            aria-label="Filter shortcuts"
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>

        <div className="mt-4 max-h-[50vh] space-y-5 overflow-y-auto pr-1">
          {grouped.map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {group}
              </div>
              <ul className="mt-2 space-y-1">
                {items.map((s) => (
                  <li
                    key={`${s.group}::${s.combo}`}
                    className="flex items-center justify-between gap-3 py-0.5 text-sm"
                  >
                    <span className="text-[var(--text-primary)]">{s.description}</span>
                    <kbd className="rounded border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-0.5 font-mono text-[11px]">
                      {formatCombo(s.combo)}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              {shortcuts.length === 0
                ? "No shortcuts registered yet."
                : `No shortcuts match “${query}”.`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatCombo(combo: string): string {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  return combo
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .map((p) => {
      if (p === "mod" || p === "cmd" || p === "ctrl" || p === "meta") return isMac ? "⌘" : "Ctrl";
      if (p === "shift") return "⇧";
      if (p === "alt" || p === "option") return isMac ? "⌥" : "Alt";
      if (p === "enter") return "↵";
      if (p === "tab") return "⇥";
      if (p === "escape") return "Esc";
      return p.toUpperCase();
    })
    .join(" ");
}
