"use client";

import type { CSSProperties, ReactNode } from "react";
import { SheetHead } from "./SheetHead";
import { useDismissable } from "./useDismissable";

/**
 * Canonical bottom-sheet shell — kit 32 Drawer System (v2.8),
 * REPO_UPDATE_FIELD_TEST.md §"Drawer System (canon, 2026-07-17 · v2.8)".
 *
 * One overlay grammar for every drawer on /m, whatever its type
 * (action / form / share / context):
 *
 *   .sheet        fixed overlay
 *   .sheet-bg     scrim — tap dismisses
 *   .sheet-panel  bottom-anchored, radius-top, scrollable
 *   .sheet-grip   drag affordance
 *   SheetHead     icon · title · optional sub · explicit ✕
 *
 * No sheet may ship without the SheetHead: scrim-tap alone is not a close
 * affordance. ESC / focus-trap / focus-restore semantics ride
 * `useDismissable`, same as the hand-rolled sheets this replaces.
 *
 * Taxonomy guardrails (enforced by review, stated here so they're findable):
 *  - form drawers carry ≤5 fields — anything longer is a full-screen
 *    `FormScreen`, never a drawer;
 *  - record detail (`RecordDetail`), `FORMS` and the emergency card stay
 *    full-screen surfaces;
 *  - context drawers may stack ONE child (switcher → join); the child closes
 *    back to its parent.
 *
 * Kit primitive: callers pass already-translated labels. No i18n here.
 */
export type SheetProps = {
  icon?: string;
  title: string;
  sub?: string;
  /** Already-translated close label for the ✕ control (defaults to "Close"). */
  closeLabel?: string;
  onClose: () => void;
  /** aria-label for the dialog; defaults to `title`. */
  ariaLabel?: string;
  /** Extra style on `.sheet-panel` (e.g. a taller max-height for pickers). */
  panelStyle?: CSSProperties;
  children: ReactNode;
};

export function Sheet({ icon, title, sub, closeLabel, onClose, ariaLabel, panelStyle, children }: SheetProps) {
  const panelRef = useDismissable<HTMLDivElement>(true, onClose);
  return (
    <div className="sheet">
      <button
        type="button"
        className="sheet-bg"
        aria-label={closeLabel ?? "Close"}
        tabIndex={-1}
        style={{ border: "none", padding: 0, cursor: "default" }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        style={panelStyle}
      >
        <div className="sheet-grip" />
        <SheetHead icon={icon} title={title} sub={sub} closeLabel={closeLabel} onClose={onClose} />
        {children}
      </div>
    </div>
  );
}
