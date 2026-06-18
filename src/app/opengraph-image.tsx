/**
 * Root OpenGraph share image — 1200×630 Waypoint + wordmark + tagline.
 *
 * Generated at request time via Next.js's built-in `ImageResponse` (next/og)
 * which renders a tiny JSX subset to a PNG using satori. No raster pipeline
 * needed; no asset to keep in sync. The result is what social platforms
 * (X, Slack, iMessage, LinkedIn, Discord) embed when atlvs.pro is shared.
 *
 * Per the v4 ATLVS_PRODUCT canon, this is the SaaS-skin lockup —
 * pink-tile Waypoint app-icon + spaced "A T L V S" wordmark on the
 * neutral canvas. The endorsement ("a GHXSTSHIP Industries company")
 * sits as a small footer line per the v4 endorsement spec.
 *
 * To override per route, drop an `opengraph-image.tsx` (or .png) into
 * any nested route segment — Next.js picks the closest one to the URL.
 */
import { ImageResponse } from "next/og";
import { BRAND, PRODUCT_ACCENTS } from "@/lib/brand";

// Route segment config — Next.js requires these exports.
// Runtime defaults to Node here (not edge) because Turbopack dev mode
// is currently slow to bundle the edge runtime + satori; Node is plenty
// fast for OG generation and is bit-identical at the output. Prod can
// promote to edge by re-adding `export const runtime = "edge"`.
export const alt = "ATLVS Technologies — the platform for production.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Canonical SaaS palette — atlvs-product theme tokens, inlined here
// because ImageResponse runs at the edge and can't resolve CSS vars.
const PINK = PRODUCT_ACCENTS.atlvs;
const INK = "#181B23";
const INK_2 = "#5B6472";
const CANVAS = "#F7F8FA";

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CANVAS,
        padding: "80px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Top — primary lockup: Waypoint app-icon tile + spaced wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {/* Pink tile + white Waypoint star — the ATLVS app-icon */}
        <div
          style={{
            width: "144px",
            height: "144px",
            borderRadius: "32px",
            background: PINK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="100" height="100" viewBox="0 0 64 64" fill="none">
            <path d="M32 5 L37 27 L59 32 L37 37 L32 59 L27 37 L5 32 L27 27 Z" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="4.2" fill={PINK} />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "112px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: INK,
              lineHeight: 1,
            }}
          >
            {BRAND.mark}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: INK_2,
              textTransform: "uppercase",
            }}
          >
            Technologies
          </div>
        </div>
      </div>

      {/* Middle — the tagline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "880px",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: INK,
            lineHeight: 1.15,
          }}
        >
          The engine behind new worlds.
        </div>
        <div style={{ fontSize: "28px", color: INK_2, lineHeight: 1.4 }}>
          ATLVS · COMPVSS · GVTEWAY · LEG3ND — develop, build, operate, and experience live productions on one source of
          truth.
        </div>
      </div>

      {/* Bottom — endorsement line + domain */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "18px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: INK_2,
          fontFamily: "monospace",
        }}
      >
        <span>a G H X S T S H I P Industries company</span>
        <span style={{ color: PINK, fontWeight: 600 }}>atlvs.pro</span>
      </div>
    </div>,
    { ...size },
  );
}
