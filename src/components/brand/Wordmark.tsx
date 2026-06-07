/**
 * Waypoint Wordmark — the official ATLVS Technologies brand mark.
 *
 * Faithful port of the kit's KIT.wordmark() builder
 * (design_handoff_atlvs_kit/kit.js). Renders the spaced caps wordmark in
 * Jost with a crossbar-less "A" — every "A" is replaced by a flipped "V"
 * span (`transform: scaleY(-1)`), so the A and V are mirror forms and the
 * stroke widths match exactly.
 *
 * The container carries `letter-spacing: .42em` AND a negative right
 * margin equal to the letter-spacing so the box ends at the final glyph's
 * ink — same trick the kit uses to avoid trailing whitespace breaking
 * lockups.
 *
 * The subtitle (e.g. "TECHNOLOGIES" under ATLVS) renders justified to span
 * the exact width of the wordmark, per kit canon. COMPVSS and GVTEWAY do
 * not carry a subtitle; only ATLVS does.
 *
 * Styles for `.wordmark`, `.wm-row`, `.wm-A`, and `.wm-tag` live in
 * src/app/theme/themes/atlvs-product.css.
 */
import * as React from "react";

export interface WordmarkProps {
  /** The wordmark text — spaced caps will render with crossbar-less A. */
  word: string;
  /** Optional subtitle, justified to wordmark width (e.g. "TECHNOLOGIES"). */
  subtitle?: string;
  /** Optional font weight override (default Jost light/400). */
  weight?: 300 | 400 | 500;
  /** Optional aria-label override; defaults to "{word} {subtitle}". */
  ariaLabel?: string;
  /** Optional className for the outer span (size via font-size on the parent). */
  className?: string;
  /** Optional inline style — most callers should size via font-size on parent. */
  style?: React.CSSProperties;
}

export function Wordmark({ word, subtitle, weight, ariaLabel, className, style }: WordmarkProps) {
  const label = ariaLabel ?? (subtitle ? `${word} ${subtitle}` : word);
  const mergedStyle: React.CSSProperties = {
    ...(weight ? { ["--wm-w" as never]: String(weight) } : null),
    ...style,
  };
  return (
    <span className={`wordmark${className ? ` ${className}` : ""}`} aria-label={label} role="img" style={mergedStyle}>
      <span className="wm-row" aria-hidden="true">
        {[...word].map((ch, i) =>
          ch === "A" ? (
            <span key={i} className="wm-A">
              <i>V</i>
            </span>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
      {subtitle ? (
        <span className="wm-tag" aria-hidden="true">
          {[...subtitle].join(" ")}
        </span>
      ) : null}
    </span>
  );
}
