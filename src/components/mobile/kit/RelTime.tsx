"use client";

import { useState, type CSSProperties } from "react";

/**
 * RelTime — kit 32 D3. Renders a relative stamp ("2h ago") that flips to the
 * absolute date/time on tap, and always carries the absolute value as a
 * `title` for hover/assistive tech.
 *
 * Presentational: the caller passes both the already-formatted `relative` and
 * `absolute` strings (both locale-formatted upstream). `stop` prevents the tap
 * from bubbling to a row's own onClick when the stamp lives inside a tappable
 * row.
 */
export type RelTimeProps = {
  relative: string;
  absolute: string;
  className?: string;
  style?: CSSProperties;
  /** Stop propagation so a row click isn't triggered by the flip. Default true. */
  stop?: boolean;
};

export function RelTime({ relative, absolute, className, style, stop = true }: RelTimeProps) {
  const [showAbs, setShowAbs] = useState(false);
  return (
    <button
      type="button"
      className={className}
      title={absolute}
      aria-label={absolute}
      onClick={(e) => {
        if (stop) e.stopPropagation();
        setShowAbs((v) => !v);
      }}
      style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", ...style }}
    >
      {showAbs ? absolute : relative}
    </button>
  );
}
