"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { KIcon } from "./icon";

/** Keyboard-accessible props for a tappable non-button row/card (kit canon:
 *  `role="button"` + Enter/Space activation). Spread onto the element; pass no
 *  handler to get an empty (non-interactive) object. */
export function pressable(onClick?: () => void) {
  if (!onClick) return {} as const;
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
  };
}

/**
 * Standard layout blocks — kit 34 v3.4 (design_handoff_compvss_field/runtime/
 * app.jsx:595). Non-list hub content composes ONLY from these so pages stay
 * uniform (Projects·Timeline, Finance·Budget, Logistics·Docks, Time Off).
 * "Bespoke" content is a named block slotted into the same frame, never a
 * one-off screen.
 *
 *   Block      — labeled section wrapper (title + optional meta + right slot)
 *   ListRow    — the canonical item row (icon · title/sub · trailing slot)
 *   MetricGrid — the 2–4-up stat grid (rec-grid / rec-cell)
 *   MeterRow   — a labeled progress track (coverage / budget / phase %)
 */

export function Block({
  title,
  meta,
  right,
  children,
  style,
}: {
  title?: string;
  meta?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {(title || right) && (
        <div className="sech" style={{ margin: "4px 0 8px" }}>
          <h2>{title}</h2>
          {meta && <span className="sched-meta">{meta}</span>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  sub,
  right,
  onClick,
  children,
}: {
  icon?: string;
  iconColor?: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={`item${onClick ? " tap" : ""}`} style={onClick ? { cursor: "pointer" } : undefined} {...pressable(onClick)}>
      {icon && (
        <span className="more-ic" style={iconColor ? { color: iconColor } : undefined}>
          <KIcon name={icon} size={17} />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{title}</div>
        {sub && <div className="s">{sub}</div>}
        {children}
      </div>
      {right}
    </div>
  );
}

export type MetricCell = { k: ReactNode; v: ReactNode; color?: string };

export function MetricGrid({ cells, style }: { cells: MetricCell[]; style?: CSSProperties }) {
  return (
    <div className="rec-grid" style={style}>
      {cells.map((c, i) => (
        <div className="rec-cell" key={i}>
          <div className="rec-k">{c.k}</div>
          <div className="rec-v" style={c.color ? { color: c.color } : undefined}>
            {c.v}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeterRow({
  label,
  pct,
  tone = "accent",
  right,
}: {
  label: ReactNode;
  pct: number;
  tone?: string;
  right?: ReactNode;
}) {
  return (
    <div className="cov-row">
      <span className="cov-h">{label}</span>
      <span className="cov-track">
        <span className="cov-fill" style={{ width: Math.min(100, pct) + "%", background: `var(--p-${tone})` }} />
      </span>
      {right != null ? right : <span className="cov-n">{pct}%</span>}
    </div>
  );
}
