"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KIcon } from "./icon";

/**
 * 5-second undo bar — kit 31 `withUndo`
 * (design_handoff_compvss_field/runtime/app.jsx:1428, render at :4633).
 * Destructive swipe actions (archive / dismiss / deny) apply immediately and
 * surface this bar above the tab bar instead of a confirm modal; `Undo`
 * reverts the mutation, and the bar self-clears after 5s.
 *
 * Usage (client list surfaces):
 *   const { undo, withUndo, clearUndo } = useUndo();
 *   … withUndo(`Archived · ${row.title}`, () => restore(row)); …
 *   <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t(...)} />
 */
export type UndoState = { label: string; on: () => void } | null;

const UNDO_MS = 5000;

export function useUndo() {
  const [undo, setUndo] = useState<UndoState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const withUndo = useCallback((label: string, revert: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setUndo({ label, on: revert });
    timer.current = setTimeout(() => setUndo(null), UNDO_MS);
  }, []);

  /** Fire the revert (if any) and drop the bar. */
  const clearUndo = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setUndo((u) => {
      u?.on();
      return null;
    });
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { undo, withUndo, clearUndo };
}

export type UndoBarProps = {
  undo: UndoState;
  /** Invoked on tap — callers pass `clearUndo` (reverts + dismisses). */
  onUndo: () => void;
  /** Already-translated "Undo" label. */
  undoLabel?: string;
};

export function UndoBar({ undo, onUndo, undoLabel = "Undo" }: UndoBarProps) {
  if (!undo) return null;
  return (
    <div className="undobar" role="status">
      <KIcon name="Undo2" size={15} style={{ color: "var(--p-accent)", flex: "none" }} />
      <span
        style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {undo.label}
      </span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          border: "none",
          background: "none",
          color: "var(--p-accent)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        {undoLabel}
      </button>
    </div>
  );
}
