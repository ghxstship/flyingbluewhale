"use client";

import * as React from "react";
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
 * grouped by scope. Benchmark: Linear `?` cheatsheet.
 */
export function ShortcutDialog() {
  const [open, setOpen] = React.useState(false);
  const shortcuts = useShortcutRegistry();

  React.useEffect(() => {
    const off = registerShortcut("?", "Show keyboard shortcuts", "Global");
    return off;
  }, []);

  useHotkeys([
    {
      combo: "?",
      skipWhenEditing: true,
      handler: () => setOpen(true),
    },
  ]);

  const grouped = React.useMemo(() => {
    const out: Record<string, typeof shortcuts> = {};
    for (const s of shortcuts) (out[s.group] ||= []).push(s);
    return out;
  }, [shortcuts]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press <kbd className="rounded border border-[var(--border-color)] px-1 text-xs">?</kbd> anywhere to
            open this panel.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {group}
              </div>
              <ul className="mt-2 space-y-1.5">
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
          {shortcuts.length === 0 && (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">No shortcuts registered yet.</div>
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
