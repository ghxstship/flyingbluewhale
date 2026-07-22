"use client";

import { KIcon } from "./icon";

/**
 * Hub command strip — kit 34 v3.1 (design_handoff_compvss_field/runtime/
 * app.jsx:1369). The 4-up segmented KPI bar that sits above every hub's
 * viewseg: one container, hairline dividers, per segment a state-color dot +
 * value + terse uppercase label; tap a metric to jump to the relevant tab.
 *
 * `tone` is a `--p-*` semantic token name (success / warning / danger / info)
 * or `text-3` for neutral. Segments with a live warning/danger value tint the
 * value in the tone color.
 */
export type MetricBarItem = {
  short: string;
  v: string | number;
  tone: "success" | "warning" | "danger" | "info" | "text-3" | "accent";
  go?: () => void;
};

export function MetricBar({ items }: { items: MetricBarItem[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "var(--p-surface)",
        border: "1px solid var(--p-border)",
        borderRadius: 14,
        boxShadow: "var(--p-elev-1)",
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {items.map((k, i) => {
        const live = !!k.v && (k.tone === "warning" || k.tone === "danger");
        return (
          <button
            key={k.short}
            type="button"
            onClick={k.go}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "11px 4px 10px",
              background: "none",
              border: "none",
              borderLeft: i ? "1px solid var(--p-border)" : "none",
              cursor: k.go ? "pointer" : "default",
              font: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  flexShrink: 0,
                  background: `var(--p-${k.tone})`,
                  opacity: k.v ? 1 : 0.35,
                }}
              />
              <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1, color: live ? `var(--p-${k.tone})` : "var(--p-text-1)" }}>
                {k.v}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--p-text-3)", whiteSpace: "nowrap" }}>
              {k.short}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hub sub-module tabs — the in-place `viewseg` that switches a hub's members.
 * Each member is `[id, label, icon]`; a gated member self-hides upstream.
 */
export type ViewSegItem = { id: string; label: string; icon: string };

export function ViewSeg({
  members,
  active,
  onSelect,
  style,
}: {
  members: ViewSegItem[];
  active: string;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div className="viewseg" style={style}>
      {members.map((m) => (
        <button key={m.id} type="button" className={active === m.id ? "on" : ""} aria-pressed={active === m.id} onClick={() => onSelect(m.id)}>
          <KIcon name={m.icon} size={14} /> {m.label}
        </button>
      ))}
    </div>
  );
}
