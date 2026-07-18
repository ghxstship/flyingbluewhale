"use client";

import { useState } from "react";
import { KIcon } from "./icon";
import { Sheet } from "./Sheet";

/**
 * LockedRow — the permission-denied affordance (kit 32 enrichment E2).
 *
 * OPT-IN alternative to hiding a gated row: the row renders with a lock
 * icon, and tapping it opens the "Ask Your Lead" sheet explaining who can
 * grant access — instead of a surface that silently doesn't exist. The
 * DEFAULT for gated rows everywhere stays hidden; a surface adopts this
 * per row where discoverability beats invisibility (e.g. the manager
 * band's More rows).
 *
 * Hiding is UX either way — the destination route always re-checks
 * server-side. This row never links anywhere.
 *
 * Kit primitive: callers pass already-translated labels. No i18n here.
 */
export type LockedRowProps = {
  icon: string;
  title: string;
  sub: string;
  /** Sheet heading, e.g. "Ask Your Lead". */
  askTitle: string;
  /** Sheet body copy explaining who can unlock the surface. */
  askBody: string;
  /** Already-translated close label for the sheet. */
  closeLabel: string;
  /** aria-label for the lock affordance, e.g. "Locked · Manager Access". */
  lockLabel: string;
};

export function LockedRow({ icon, title, sub, askTitle, askBody, closeLabel, lockLabel }: LockedRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="item tap"
        aria-haspopup="dialog"
        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
        onClick={() => setOpen(true)}
      >
        <span className="more-ic" style={{ opacity: 0.55 }}>
          <KIcon name={icon} size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0, opacity: 0.55 }}>
          <div className="t">{title}</div>
          <div className="s">{sub}</div>
        </div>
        <span className="sp" />
        <span aria-label={lockLabel} title={lockLabel} style={{ display: "inline-flex", color: "var(--p-text-3)" }}>
          <KIcon name="Lock" size={16} />
        </span>
      </button>
      {open && (
        <Sheet icon="Lock" title={askTitle} sub={title} closeLabel={closeLabel} onClose={() => setOpen(false)}>
          <p className="hint" style={{ margin: "4px 0 12px" }}>
            {askBody}
          </p>
        </Sheet>
      )}
    </>
  );
}
