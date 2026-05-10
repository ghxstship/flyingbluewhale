/**
 * Shared types for the 10 XPMS-class dashboard templates.
 *
 * Each template is a thin layout primitive: cover, branding band,
 * section grid. The actual content per section is fetched by the
 * portal page mounting the template, then passed in via `sections`.
 *
 * The data side (which artifacts surface, in which order) is stored
 * in `client_dashboards.sections` JSONB so an operator can curate per
 * share-link without code changes.
 */

import type { XpmsClassCode } from "@/lib/xpms";

export type DashboardSection = {
  /** Stable section key — e.g. "proposals", "settlements", "approvals" */
  key: string;
  /** Title rendered as the section header */
  title: string;
  /** Optional one-line description shown under the title */
  description?: string;
  /** Pre-rendered React node for the section body. Templates are
   *  layout-only; the data + UI for each section live with the caller. */
  body: React.ReactNode;
};

export type DashboardBranding = {
  /** Cover image URL */
  coverUrl?: string | null;
  /** Logo URL (small, top-left) */
  logoUrl?: string | null;
  /** Accent color for chrome (hex) */
  accent?: string | null;
  /** Display name override (defaults to org name) */
  nameOverride?: string | null;
};

export type DashboardProps = {
  /** XPMS class code this template represents (0..9). Drives the
   *  default accent color from XPMS_CLASSES[n].accent when no
   *  branding override is provided. */
  classCode: XpmsClassCode;
  /** Title rendered prominently in the cover band */
  title: string;
  /** Optional subtitle (e.g. project name + phase chip) */
  subtitle?: string;
  /** Branding payload — drives cover, logo, accent. */
  branding?: DashboardBranding;
  /** Curated sections in render order */
  sections: DashboardSection[];
  /** Footer rendered after the last section. Caller-provided so the
   *  template doesn't dictate share-link / privacy / contact UX. */
  footer?: React.ReactNode;
};
