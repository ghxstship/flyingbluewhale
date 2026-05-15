/**
 * Brand canon — single source of truth for every visible brand string.
 *
 * Every marketing page, OG card, email template, SEO tag, push fallback,
 * and i18n message reaches into this module. Rebrands edit this file
 * (and the i18n message catalogs); call sites stay untouched.
 *
 * Multitenancy hook: when we ship per-tenant branding overrides, this
 * becomes the default and tenants override `name` / `mark` / `legalName`
 * via `tenant.branding.*`. See `src/lib/branding.ts` for the per-tenant
 * resolver layered on top — that file pulls `BRAND` as its fallback.
 */

export const BRAND = {
  /** Solid wordmark, used in titles, copy, sentence flow. */
  name: "ATLVS",

  /**
   * Spaced visual mark. Literal spaces between letters — matches the
   * spaced `G H X S T S H I P` parent-company treatment. Always pair
   * with `aria-label={BRAND.legalName + " — home"}` so screen readers
   * say it once, not five times.
   */
  mark: "A T L V S",

  /** Long-form legal/aria name. */
  legalName: "ATLVS Technologies",

  /** Inc. form — used in structured data, T&Cs, copyright lines. */
  legalNameInc: "ATLVS Technologies, Inc.",

  /** Apex domain (no scheme, no path). */
  apexDomain: "atlvs.pro",

  /** Canonical absolute origin used in seo + email fallbacks. */
  apexUrl: "https://atlvs.pro",

  /**
   * Canonical email addresses. Centralized so the marketing site,
   * contact pages, transactional senders, runbooks, and footer all
   * read from one place.
   */
  emails: {
    general: "greetings@atlvs.pro",
    sales: "sales@atlvs.pro",
    press: "press@atlvs.pro",
    careers: "careers@atlvs.pro",
    support: "support@atlvs.pro",
    partners: "partners@atlvs.pro",
    oncall: "oncall@atlvs.pro",
    privacy: "privacy@atlvs.pro",
    /** Web Push VAPID subject + low-level ops escalation. */
    ops: "ops@atlvs.pro",
    /** Transactional `from:` for Resend. */
    noReply: "no-reply@atlvs.pro",
  },

  /** Social handle. Same string everywhere — no Twitter/X. */
  socialHandle: "@atlvs.pro",

  /**
   * Parent company. Independent of the ATLVS rebrand — GHXSTSHIP
   * is the holding co; ATLVS is the platform product.
   */
  parent: {
    name: "GHXSTSHIP Industries",
    mark: "G H X S T S H I P Industries",
  },

  /**
   * Sub-products under the ATLVS umbrella. The console is now the
   * ATLVS app itself (no sub-name); portal + mobile keep their
   * function names + color overlays.
   */
  products: {
    console: { name: "ATLVS", mark: "A T L V S", color: "red" },
    portal: { name: "GVTEWAY", mark: "G V T E W A Y", color: "blue" },
    mobile: { name: "COMPVSS", mark: "C O M P V S S", color: "yellow" },
  },
} as const;

/** Convenience: the full trademark line used in footers + i18n. */
export const TRADEMARK_LINE = `${BRAND.products.console.name}, ${BRAND.products.portal.name}, and ${BRAND.products.mobile.name} are trademarks of ${BRAND.legalName}, a ${BRAND.parent.mark} company.`;
