import Link from "next/link";
import { KIcon } from "./icon";

/**
 * Breadcrumb trail for surfaces ≥2 levels deep — kit 31 `Crumbs`
 * (design_handoff_compvss_field/runtime/app.jsx:54). The last item is the
 * current surface and renders as plain text; ancestors are taps back up.
 *
 * The prototype navigates with `go()` callbacks; in the repo an ancestor is
 * normally a route, so each item takes `href` (renders a `<Link>`) or `go`
 * (renders a button — for client callers that swap local state instead of
 * navigating). Server components pass `href` only.
 */
export type Crumb = {
  label: string;
  href?: string;
  go?: () => void;
};

export type CrumbsProps = { items: Crumb[] };

const linkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "4px 2px",
  color: "var(--p-text-3)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "none",
};

export function Crumbs({ items }: CrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap", margin: "0 0 6px -2px" }}
    >
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} style={{ display: "contents" }}>
            {i > 0 && <KIcon name="ChevronRight" size={13} style={{ color: "var(--p-text-3)", flex: "none" }} />}
            {last ? (
              <span
                aria-current="page"
                style={{ fontSize: 12.5, fontWeight: 700, color: "var(--p-text-1)", padding: "4px 2px" }}
              >
                {c.label}
              </span>
            ) : c.href ? (
              <Link href={c.href} style={linkStyle}>
                {c.label}
              </Link>
            ) : (
              <button type="button" onClick={c.go} style={linkStyle}>
                {c.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
