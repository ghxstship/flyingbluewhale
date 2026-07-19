"use client";

import type { CSSProperties } from "react";
import { KIcon } from "./icon";
import { Crumbs, type Crumb } from "./Crumbs";

/**
 * Canonical screen header — kit 34 v3.5 (design_handoff_compvss_field/runtime/
 * app.jsx:74). The single source of truth for the fixed top-of-screen order on
 * standalone (non-hub) screens: `[crumbs | back] → title`.
 *
 * - Standalone drawer-reached screen: pass `onBack={() => setNavOpen(true)}`.
 * - Bottom-tab screen: no `onBack` (nothing above the title).
 * - Deep-reference screen: pass `crumbs`.
 * - Hub-member screens omit this entirely — hub chrome is their header.
 *
 * `Eyebrow` is intentionally suppressed globally in this build (kicker off), so
 * there is no eyebrow slot here.
 */
export type ScreenHeaderProps = {
  onBack?: () => void;
  /** Already-translated back label (defaults to "More"). */
  backLabel?: string;
  crumbs?: Crumb[];
  title?: string;
  titleStyle?: CSSProperties;
};

export function ScreenHeader({ onBack, backLabel, crumbs, title, titleStyle }: ScreenHeaderProps) {
  return (
    <>
      {crumbs ? (
        <Crumbs items={crumbs} />
      ) : onBack ? (
        <button type="button" className="backbtn" onClick={onBack}>
          <KIcon name="ChevronLeft" size={17} /> {backLabel || "More"}
        </button>
      ) : null}
      {title != null && (
        <h1 className="scr-h" style={{ marginBottom: 12, ...titleStyle }}>
          {title}
        </h1>
      )}
    </>
  );
}
