/**
 * ProductPreview — an abstract, theme-aware product-UI illustration (C6).
 *
 * Not a screenshot. A self-contained inline SVG drawn entirely from design
 * tokens (`--p-*`) plus a product `accent`, so it adapts to light/dark and to
 * each sub-product's color without shipping any raster asset. It reads as "the
 * console" — window chrome, a sidebar, metric cards, a bar chart — without
 * claiming to be a literal capture of the app.
 *
 * `accent` is a concrete hex (the product color) because SVG fills can't read a
 * per-instance CSS var here; everything else is tokenized.
 */
export function ProductPreview({
  accent,
  label,
  className,
}: {
  accent: string;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 280"
      className={className}
      role="img"
      aria-label={`${label} — interface preview`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Window frame */}
      <rect
        x="1.5"
        y="1.5"
        width="397"
        height="277"
        rx="14"
        fill="var(--p-surface)"
        stroke="var(--p-border)"
        strokeWidth="1.5"
      />

      {/* Title bar: traffic dots only (no label text — the surrounding copy
          already names the product; a chrome label just repeats it). */}
      <circle cx="22" cy="20" r="4" fill={accent} />
      <circle cx="38" cy="20" r="4" fill="var(--p-border-2)" />
      <circle cx="54" cy="20" r="4" fill="var(--p-border-2)" />
      <line x1="1.5" y1="40" x2="398.5" y2="40" stroke="var(--p-border)" strokeWidth="1" />

      {/* Sidebar */}
      <rect x="1.5" y="40" width="92" height="238.5" fill="var(--p-surface-2)" />
      {/* active nav item */}
      <rect x="12" y="58" width="70" height="14" rx="4" fill={accent} opacity="0.16" />
      <rect x="18" y="62" width="46" height="6" rx="3" fill={accent} />
      {[86, 110, 134, 158, 182].map((y) => (
        <rect key={y} x="18" y={y} width={y % 3 === 0 ? 54 : 44} height="6" rx="3" fill="var(--p-text-3)" opacity="0.45" />
      ))}

      {/* Header row in main area */}
      <rect x="112" y="56" width="120" height="9" rx="4.5" fill="var(--p-text-2)" opacity="0.8" />
      <rect x="320" y="54" width="66" height="18" rx="6" fill={accent} />

      {/* Metric cards */}
      {[0, 1, 2].map((i) => {
        const x = 112 + i * 94;
        return (
          <g key={i}>
            <rect x={x} y="84" width="82" height="58" rx="8" fill="var(--p-surface)" stroke="var(--p-border)" />
            <rect x={x + 12} y="96" width="10" height="10" rx="3" fill={accent} opacity={0.85 - i * 0.2} />
            <rect x={x + 12} y="116" width="42" height="11" rx="4" fill="var(--p-text-1)" opacity="0.85" />
            <rect x={x + 12} y="132" width="30" height="5" rx="2.5" fill="var(--p-text-3)" opacity="0.6" />
          </g>
        );
      })}

      {/* Mini bar chart */}
      <rect x="112" y="158" width="274" height="104" rx="8" fill="var(--p-surface)" stroke="var(--p-border)" />
      <rect x="124" y="170" width="70" height="7" rx="3.5" fill="var(--p-text-3)" opacity="0.5" />
      {[34, 56, 28, 70, 48, 82, 60, 90].map((h, i) => {
        const x = 126 + i * 32;
        const y = 250 - h;
        return <rect key={i} x={x} y={y} width="18" height={h} rx="3" fill={accent} opacity={0.35 + (i / 8) * 0.6} />;
      })}
    </svg>
  );
}
