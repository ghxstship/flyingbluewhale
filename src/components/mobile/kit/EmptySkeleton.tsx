import type { ReactNode } from "react";

/**
 * Empty state that keeps the view's structure visible — kit 31 `EmptySkeleton`
 * (design_handoff_compvss_field/runtime/app.jsx:82). Renders the view's real
 * column headers over 4 ghost rows so users see what belongs here before data
 * exists (live-test resolution #16), then the title/hint/action line.
 *
 * Presentational: callers pass already-translated `cols`, `title`, and `hint`.
 */
export type EmptySkeletonProps = {
  /** The view's column headers, first column flexes. */
  cols: string[];
  title: string;
  hint: string;
  /** Optional CTA (e.g. a permission-gated New button). */
  action?: ReactNode;
};

export function EmptySkeleton({ cols, title, hint, action }: EmptySkeletonProps) {
  return (
    <div>
      <div className="dtbl" aria-hidden="true">
        <div className="dtbl-head">
          {cols.map((c, i) => (
            <span key={c} style={i === 0 ? { flex: 1 } : { marginLeft: 14 }}>
              {c}
            </span>
          ))}
        </div>
        {[0, 1, 2, 3].map((r) => (
          <div className="dtbl-row" key={r} style={{ cursor: "default" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  width: `${64 - r * 9}%`,
                  borderRadius: 6,
                  background: "var(--p-border)",
                  opacity: 0.55,
                }}
              />
              <div
                style={{
                  height: 9,
                  width: `${40 - r * 5}%`,
                  borderRadius: 5,
                  background: "var(--p-border)",
                  opacity: 0.35,
                  marginTop: 7,
                }}
              />
            </div>
            <div
              style={{ width: 56, height: 20, borderRadius: 999, background: "var(--p-border)", opacity: 0.4, flex: "none" }}
            />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", padding: "14px 0 6px" }}>
        <div className="t" style={{ fontSize: 14 }}>
          {title}
        </div>
        <div className="s" style={{ marginTop: 3 }}>
          {hint}
        </div>
        {action && <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>{action}</div>}
      </div>
    </div>
  );
}
