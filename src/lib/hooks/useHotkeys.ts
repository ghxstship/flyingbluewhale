"use client";

import { useEffect, useMemo } from "react";

export type HotkeyBinding = {
  /**
   * Keyboard combo. Supports "mod" (Cmd on Mac, Ctrl elsewhere), "shift",
   * "alt", "enter", single keys, "?". A space makes a two-key SEQUENCE
   * ("g h" = press g, then h within 1.2s) — Linear-style go-to chords.
   */
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
 * - "g p" (space-separated) = a two-key sequence: g, then p within 1.2s
 * - automatically skips input/textarea/contenteditable when skipWhenEditing: true
 */
export function useHotkeys(bindings: HotkeyBinding[]) {
  const parsed = useMemo(() => bindings.map(parseBinding), [bindings]);
  const hasSeq = parsed.some((b) => b.seq);

  useEffect(() => {
    const stopRecorder = hasSeq ? ensureSeqRecorder() : null;
    function onKey(e: KeyboardEvent) {
      const bare = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
      for (const b of parsed) {
        if (b.seq) {
          // Sequence: the PREVIOUS bare key (tracked by the capture-phase
          // recorder) must be the prefix, and this key the terminal.
          if (!bare) continue;
          if (e.key.toLowerCase() !== b.seq[1]) continue;
          if (seqState.prev !== b.seq[0] || Date.now() - seqState.prevAt > SEQ_TIMEOUT_MS) continue;
          if (b.skipWhenEditing !== false && isEditing(e.target)) continue;
          seqState.prev = "";
          if (b.preventDefault !== false) e.preventDefault();
          b.handler(e);
          return;
        }
        if (!matches(b, e)) continue;
        if (b.skipWhenEditing && isEditing(e.target)) continue;
        if (b.preventDefault !== false) e.preventDefault();
        b.handler(e);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopRecorder?.();
    };
  }, [parsed, hasSeq]);
}

// ─── Two-key sequence support ("g h") ───────────────────────────────────────
// A single capture-phase recorder tracks the last two bare keypresses so any
// number of useHotkeys instances can match sequences regardless of listener
// order. Capture runs before every bubble-phase binding handler, so by the
// time a handler sees the terminal key, the prefix has already been shifted
// into `seqState.prev`.
const SEQ_TIMEOUT_MS = 1200;
// `last` is the key currently being dispatched (capture already saw it);
// `prev` is the one before — the candidate prefix a handler matches against.
const seqState = { prev: "", prevAt: 0, last: "", lastAt: 0 };
let seqRecorderRefs = 0;

function recordKey(e: KeyboardEvent) {
  const bare = !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
  if (bare && !isEditing(e.target) && e.key.length === 1) {
    seqState.prev = seqState.last;
    seqState.prevAt = seqState.lastAt;
    seqState.last = e.key.toLowerCase();
    seqState.lastAt = Date.now();
  } else {
    // Modifier combos / typing break any pending chord.
    seqState.prev = "";
    seqState.last = "";
  }
}

function ensureSeqRecorder(): () => void {
  if (typeof window !== "undefined" && seqRecorderRefs === 0) {
    window.addEventListener("keydown", recordKey, true);
  }
  seqRecorderRefs += 1;
  return () => {
    seqRecorderRefs -= 1;
    if (typeof window !== "undefined" && seqRecorderRefs === 0) {
      window.removeEventListener("keydown", recordKey, true);
    }
  };
}

// ─── Registry for <ShortcutDialog> discovery ────────────────────────────────

type RegisteredShortcut = { combo: string; description: string; group: string };
const REGISTRY = new Map<string, RegisteredShortcut & { refs: number }>();
const listeners = new Set<() => void>();

/**
 * Ref-counted: several instances of the same host (e.g. two DataTables on one
 * page) may register the same combo; the cheatsheet entry survives until the
 * LAST one unregisters.
 */
export function registerShortcut(combo: string, description: string, group = "Global") {
  const key = `${group}::${combo}`;
  const existing = REGISTRY.get(key);
  if (existing) {
    existing.refs += 1;
    existing.description = description;
  } else {
    REGISTRY.set(key, { combo, description, group, refs: 1 });
  }
  listeners.forEach((fn) => fn());
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const cur = REGISTRY.get(key);
    if (!cur) return;
    cur.refs -= 1;
    if (cur.refs <= 0) REGISTRY.delete(key);
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
  /** Two-key sequence ("g h") — [prefix, terminal]. */
  seq?: [string, string];
};

function parseBinding(b: HotkeyBinding): Parsed {
  const seqParts = b.combo.toLowerCase().split(/\s+/).filter(Boolean);
  if (seqParts.length === 2 && !b.combo.includes("+")) {
    return { ...b, key: seqParts[1]!, mod: false, shift: false, alt: false, seq: [seqParts[0]!, seqParts[1]!] };
  }
  const parts = b.combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim());
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
