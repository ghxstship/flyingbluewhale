/**
 * SITEPLAN Design Tokens — protocol §7.
 *
 * The renderer-side spine for the ATLVS site-plan sheet aesthetic.
 * Per-shell accent overrides happen elsewhere; bands always render
 * their canonical band-vocab color regardless of shell theming.
 *
 * Type families realigned to the v3 ATLVS kit "MONUMENT" (2026-06-13):
 * Anton drives the display + heading register (sheet titles, section bars),
 * Hanken Grotesk carries body/narrative, Space Mono carries data labels and
 * identifiers. The PDF/SVG renderer must register these faces; unregistered
 * names fall back to the host stack.
 */

/** §7.1 Typography. */
export const SITEPLAN_FONTS = {
  display: "Anton", // sheet title H1, dimension callouts
  heading: "Anton", // section bars, zone labels, station tags
  body: "Hanken Grotesk", // notes, narrative blocks
  mono: "Space Mono", // atom IDs, model numbers, dimensions, schedules
} as const;

/** §7.2 Color — paper aesthetic (default). */
export const SITEPLAN_COLORS = {
  ink: "#0a0a0a",
  paper: "#f5f1ea",
  paperBright: "#ffffff",
  rule: "#cdc6b8",
  muted: "#6b6356",
} as const;

/** §7.3 Line weights in pixels. */
export const SITEPLAN_STROKES = {
  shell: 2.5, // tent / building perimeter
  band: 2.5, // band boundary
  equipment: 1.5, // placement block
  dimension: 1.0, // dim lines
  aux: 0.8, // hatching, dots, secondary
} as const;

/** §7.3 Shadows. */
export const SITEPLAN_SHADOWS = {
  hard: "4px 4px 0 0 #0a0a0a", // title-block drop shadow
} as const;

/** §7.4 Required sheet anatomy — every sheet MUST contain all six. */
export const SITEPLAN_REQUIRED_ANATOMY = [
  "title_block",
  "plan_view",
  "legend_strip",
  "equipment_schedule",
  "utility_schedule",
  "notes_footer",
] as const;
export type SitePlanAnatomySection = (typeof SITEPLAN_REQUIRED_ANATOMY)[number];
