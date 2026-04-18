"use client";

import { useEffect, useMemo } from "react";

export type HotkeyBinding = {
  /** Keyboard combo. Supports "mod" (Cmd on Mac, Ctrl elsewhere), "shift", "alt", "enter", single keys, "?". */
  combo: string;
  /** Handler. Prevent-default is applied automatically unless `preventDefault: false`. */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable description shown in <ShortcutDialog>. */
  description?: string;
  /** Group bucket for the cheatsheet: "global", "navigation", "editor", "table". */
  group?: string;
  /** If true, do not capture when the focused element is an input/textarea/contenteditable. */
  skipWhenEditing?: boolean;
  preventDefault?: boolean;
};

/**
 * Tiny hotkey manager — feature-parity with Linear's core needs.
 * - "mod+k" = Cmd on Mac, Ctrl elsewhere
 * - sequences like "g p" (go to projects) not supported; use two bindings instead
 * - automatically skips input/textarea/contenteditable when skipWhenEditing: true
 */
export function useHotkeys(bindings: HotkeyBinding[]) {
  const parsed = useMemo(() => bindings.map(parseBinding), [bindings]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      for (const b of parsed) {
        if (!matches(b, e)) continue;
        if (b.skipWhenEditing && isEditing(e.target)) continue;
        if (b.preventDefault !== false) e.preventDefault();
        b.handler(e);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parsed]);
}

// ─── Registry for <ShortcutDialog> discovery ────────────────────────────────

type RegisteredShortcut = { combo: string; description: string; group: string };
const REGISTRY = new Map<string, RegisteredShortcut>();
const listeners = new Set<() => void>();

export function registerShortcut(combo: string, description: string, group = "Global") {
  const key = `${group}::${combo}`;
  REGISTRY.set(key, { combo, description, group });
  listeners.forEach((fn) => fn());
  return () => {
    REGISTRY.delete(key);
    listeners.forEach((fn) => fn());
  };
}

export function useShortcutRegistry(): RegisteredShortcut[] {
  const [, forceRender] = useReducerState();
  useEffect(() => {
    listeners.add(forceRender);
    return () => {
      listeners.delete(forceRender);
    };
  }, [forceRender]);
  return Array.from(REGISTRY.values());
}

// ─── internals ───────────────────────────────────────────────────────────────

type Parsed = HotkeyBinding & {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
};

function parseBinding(b: HotkeyBinding): Parsed {
  const parts = b.combo.toLowerCase().split("+").map((s) => s.trim());
  const mod = parts.includes("mod") || parts.includes("cmd") || parts.includes("ctrl") || parts.includes("meta");
  const shift = parts.includes("shift");
  const alt = parts.includes("alt") || parts.includes("option");
  const key = parts.filter((p) => !["mod", "cmd", "ctrl", "meta", "shift", "alt", "option"].includes(p)).pop() ?? "";
  return { ...b, key, mod, shift, alt };
}

function matches(b: Parsed, e: KeyboardEvent): boolean {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;
  if (b.mod !== modPressed) return false;
  if (b.shift !== e.shiftKey) return false;
  if (b.alt !== e.altKey) return false;
  return e.key.toLowerCase() === b.key;
}

function isEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

// Lightweight useReducer-based force-render without pulling React namespace each call
import { useReducer } from "react";
function useReducerState(): [unknown, () => void] {
  return useReducer((n: number) => n + 1, 0);
}
