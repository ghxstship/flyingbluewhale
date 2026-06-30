"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * UndoStack — a pure undo/redo history for optimistic mutations (v7.7 data
 * engine). Each entry is a reversible action: a `label` for the affordance plus
 * `undo`/`redo` thunks the caller supplies (they own the actual state write —
 * server action, optimistic patch, whatever). The stack only sequences them.
 *
 * `useUndoStack()` returns the controller; `<UndoBar>` is the ⌘Z/⌘⇧Z affordance.
 * Both are token-only and i18n-ready (all copy via the `labels` prop).
 */
export type UndoEntry = {
  /** Human label for the affordance, e.g. "Renamed project". */
  label: string;
  /** Revert the action. May be async. */
  undo: () => void | Promise<void>;
  /** Re-apply the action after an undo. May be async. */
  redo: () => void | Promise<void>;
};

export type UndoController = {
  /** Record a freshly-applied action (clears the redo branch). */
  push: (entry: UndoEntry) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** The entry that ⌘Z would revert next, or null. */
  pending: UndoEntry | null;
};

export function useUndoStack(limit = 50): UndoController {
  // past[] = applied actions (undo target is the tail); future[] = undone actions.
  const [past, setPast] = useState<UndoEntry[]>([]);
  const [future, setFuture] = useState<UndoEntry[]>([]);
  const busy = useRef(false);

  const push = useCallback(
    (entry: UndoEntry) => {
      setPast((p) => [...p, entry].slice(-limit));
      setFuture([]);
    },
    [limit],
  );

  const undo = useCallback(async () => {
    if (busy.current) return;
    const entry = past[past.length - 1];
    if (!entry) return;
    busy.current = true;
    try {
      await entry.undo();
      setPast((p) => p.slice(0, -1));
      setFuture((f) => [entry, ...f]);
    } finally {
      busy.current = false;
    }
  }, [past]);

  const redo = useCallback(async () => {
    if (busy.current) return;
    const entry = future[0];
    if (!entry) return;
    busy.current = true;
    try {
      await entry.redo();
      setFuture((f) => f.slice(1));
      setPast((p) => [...p, entry].slice(-limit));
    } finally {
      busy.current = false;
    }
  }, [future, limit]);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    push,
    undo,
    redo,
    clear,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pending: past[past.length - 1] ?? null,
  };
}

type UndoBarLabels = {
  /** Prefix shown before the last action label, e.g. "Done:". */
  done?: string;
  undo?: string;
  redo?: string;
};

const isEditableTarget = (el: EventTarget | null): boolean => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
};

/**
 * UndoBar — the persistent ⌘Z/⌘⇧Z affordance for a controller. Renders inline
 * (the caller positions it, e.g. in a toolbar or a sticky footer). Binds the
 * keyboard shortcuts while mounted, ignoring keystrokes inside text inputs so it
 * never steals a field's native undo.
 */
export function UndoBar({
  controller,
  labels = {},
  className = "",
}: {
  controller: UndoController;
  labels?: UndoBarLabels;
  className?: string;
}) {
  const { undo, redo, canUndo, canRedo, pending } = controller;
  const t = { done: "Done:", undo: "Undo", redo: "Redo", ...labels };
  // Keep handlers fresh without rebinding every render.
  const ref = useRef({ undo, redo });
  ref.current = { undo, redo };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      if (e.shiftKey) void ref.current.redo();
      else void ref.current.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!canUndo && !canRedo) return null;

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--p-2)",
        padding: "var(--p-2) var(--p-3)",
        borderRadius: "var(--p-r-md, 10px)",
        background: "var(--p-surface-2)",
        border: "1px solid var(--p-border)",
        fontSize: 13,
        color: "var(--p-text-2)",
      }}
    >
      {pending && (
        <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.done} {pending.label}
        </span>
      )}
      <button
        type="button"
        className="ps-btn ps-btn--tertiary ps-btn--sm"
        onClick={() => void undo()}
        disabled={!canUndo}
        aria-keyshortcuts="Meta+Z Control+Z"
      >
        {t.undo}
      </button>
      <button
        type="button"
        className="ps-btn ps-btn--tertiary ps-btn--sm"
        onClick={() => void redo()}
        disabled={!canRedo}
        aria-keyshortcuts="Meta+Shift+Z Control+Shift+Z"
      >
        {t.redo}
      </button>
    </div>
  );
}
