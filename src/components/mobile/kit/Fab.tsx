"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { KIcon } from "./icon";

/**
 * Fab — the ONE COMPVSS field-PWA floating create button.
 *
 * The kit renders exactly one context-aware create FAB per surface
 * (design_handoff_compvss_field runtime/app.jsx — the per-tab CREATE map;
 * docs/compvss/KIT_CANON.md). Before this primitive every surface hand-rolled
 * `className="fab"` with drifting markup: some `<Link>`, some `<button>`, mixed
 * icon sizes (22 vs 24), and — the real defect — all of them authored INSIDE
 * `<main>`'s pull-to-refresh wrapper (`PullToRefresh`), which carries a
 * `transform: translateY(0)` at rest. A non-`none` transform is a containing
 * block for `position: fixed`, so every FAB anchored to the wrapper's
 * content-bottom instead of the viewport — floating mid-page on long screens.
 *
 * This primitive portals the button OUT of that transformed subtree into the
 * `.mobile-shell` root, so it is truly viewport-fixed on every surface. It
 * mounts into `.mobile-shell` (NOT `document.body`) because the `.fab` style is
 * scoped `.mobile-shell .fab` — and that root carries no transform/contain of
 * its own, so fixed == viewport there.
 *
 * z-index stays 25 (from `.fab`): above the tab bar (15), below sheets (40).
 */

/** The single canonical FAB glyph size — a 24px mark in the 54px circle. */
const FAB_ICON = 24;

export type FabProps = {
  /** Required accessible name → aria-label (the kit's create verb, Title Case). */
  label: string;
  /** Lucide icon name; defaults to the kit's "Plus" create glyph. */
  icon?: string;
  /** Link target — the surface's CREATE-map route. Mutually exclusive with onClick. */
  href?: string;
  /** Click handler for surfaces whose create opens an in-page sheet/form. */
  onClick?: () => void;
  /** Optional count/dot badge (reuses the kit `.qa-badge` treatment). */
  badge?: number | string;
};

export function Fab({ label, icon = "Plus", href, onClick, badge }: FabProps) {
  // Portal host resolved after mount — the single `.mobile-shell` root.
  const [host, setHost] = React.useState<Element | null>(null);
  React.useEffect(() => {
    setHost(document.querySelector(".mobile-shell"));
  }, []);

  const showBadge = badge != null && badge !== "" && badge !== 0;
  const inner = (
    <>
      <KIcon name={icon} size={FAB_ICON} />
      {showBadge ? <span className="qa-badge">{badge}</span> : null}
    </>
  );

  const node = href ? (
    <Link href={href} className="fab" aria-label={label}>
      {inner}
    </Link>
  ) : (
    <button type="button" className="fab" aria-label={label} onClick={onClick}>
      {inner}
    </button>
  );

  // Pre-mount (SSR / first paint) there is no host yet — the field PWA requires
  // JS, so the button appears on hydration. Escaping the transformed wrapper is
  // worth the one-frame deferral.
  if (!host) return null;
  return createPortal(node, host);
}
