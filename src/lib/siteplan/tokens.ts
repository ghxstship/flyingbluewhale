/**
 * SITEPLAN Design Tokens — protocol §7.
 *
 * The renderer-side spine for the ATLVS site-plan sheet aesthetic.
 * Per-shell accent overrides happen elsewhere; bands always render
 * their canonical band-vocab color regardless of shell theming.
 *
 * Type families realigned to the v3 ATLVS kit (2026-06-03): the dead
 * Bermuda Triangle / HVRBOR stack (Anton/Bebas/Share Tech) is purged
 * everywhere it lived as a free-text font name. Site plans now read
 * in the kit's two-family canon — Space Grotesk for headings and
 * body, Space Mono for data labels and identifiers.
 */

/** §7.1 Typography. */
export const SITEPLAN_FONTS = {
  display: "Space Grotesk", // sheet title H1, dimension callouts
  heading: "Space Grotesk", // section bars, zone labels, station tags
  body: "Space Grotesk", // notes, narrative blocks
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
