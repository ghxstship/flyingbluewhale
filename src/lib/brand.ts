/**
 * Brand canon — single source of truth for every visible brand string.
 *
 * Dual-brand setup:
 *   - GHXSTSHIP is the parent company (the "Spaceport" marketing
 *     site, ghxstship.tours — coming later).
 *   - ATLVS Technologies is the Tech vertical legal entity that owns the
 *     proprietary software (v4 kit roles): ATLVS — Experiential Productions
 *     (ERP×CRM×PM superset console, nebula/pink); COMPVSS — Site & Venue
 *     Operations (field/venue ops, brass/amber); GVTEWAY — Public Interface
 *     & Marketplace (tickets/stores/jobs/RFPs portal, plasma/cyan).
 *
 * This file describes the ATLVS Technologies brand that ships on
 * atlvs.pro today. The umbrella `parent` block carries the GHXSTSHIP
 * fields used wherever we surface the holding co (footer trademark,
 * about page, OG schema's `parentOrganization`).
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

  /** Tagline — Bermuda canon was "Production Runs On It"; GHXSTSHIP
   *  canon is "Venture Beyond". We surface the ATLVS-Technologies-tier
   *  tagline here; the umbrella tagline lives on `parent.tagline`. */
  tagline: "The World Builder's Ecosystem",

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
    support: "sos@atlvs.pro",
    /** Web Push VAPID subject + low-level ops escalation. */
    ops: "ops@atlvs.pro",
    /** Transactional `from:` for Resend. */
    noReply: "no-reply@atlvs.pro",
  },

  /** Social handle used in @-mentions / Twitter Card `site` attribution. */
  socialHandle: "@atlvs.pro",

  /**
   * Canonical social profiles. ATLVS Technologies does not run its own
   * social accounts — the company presence lives on the parent
   * GHXSTSHIP profiles (source of truth: linktr.ee/ghxstship). Centralized
   * here so the footer + Organization JSON-LD `sameAs` read one list.
   * `key` maps to a brand icon at the render site; order = footer order.
   */
  socials: [
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/ghxstship.xyz" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@ghxstship.pro" },
    { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@ghxstship" },
    { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/ghxstship" },
    { key: "soundcloud", label: "SoundCloud", href: "https://www.soundcloud.com/ghxstship" },
    { key: "threads", label: "Threads", href: "https://www.threads.com/@ghxstship.xyz" },
    { key: "facebook", label: "Facebook", href: "https://www.facebook.com/ghxstship.xyz" },
  ],

  /**
   * Parent company — GHXSTSHIP Industries LLC. The umbrella brand that
   * eventually lives on ghxstship.tours. Used in trademark lines, OG
   * schema (`parentOrganization`), the About page, and the footer.
   *
   * The literal "G H X S T S H I P" is the visible spaced wordmark;
   * `GHXSTSHIP` (unspaced) is the machine-readable token for URLs,
   * schema name, and handles. Tagline: "Venture Beyond."
   */
  parent: {
    name: "GHXSTSHIP",
    mark: "G H X S T S H I P",
    legalName: "GHXSTSHIP Industries LLC",
    apexDomain: "ghxstship.tours",
    apexUrl: "https://ghxstship.tours",
    tagline: "Venture Beyond.",
    /** Three integrated verticals (per BRAND_ARCHITECTURE.md). */
    verticals: ["Production", "Operations", "Technology"] as const,
    /** ATLVS Technologies is the legal entity under GHXSTSHIP's
     *  Technology vertical. */
    techVertical: "ATLVS Technologies",
  },

  /**
   * Sub-products under the ATLVS umbrella.
   *
   * Color palette is canonical (per project/tokens.json — see PRODUCT_ACCENTS):
   *   v8.0 palette-locked — each product OWNS its accent: ATLVS volcanic red
   *   #E23414 · COMPVSS signal yellow #FFC400 · GVTEWAY blue #2563EB · LEG3ND
   *   molten orange #ED6A1E. The GHXSTSHIP house/master brand accent is ATLVS
   *   volcanic red #E23414 (the default for non-product / ecosystem-marketing
   *   surfaces); the retired house green #2EDB3A is no longer used.
   *
   * The legacy `color` strings (nebula / brass / plasma) are retained only as
   * readable `data-platform` / Tailwind name tokens; the paint flows through
   * the per-platform `--p-accent` overlays. */
  products: {
    console: {
      name: "ATLVS",
      mark: "A T L V S",
      color: "nebula",
      /** Sidebar subtitle = the v4 kit product role (tokens.json#products).
       *  ATLVS is the superset console: Experiential Productions — ERP × CRM
       *  × PM (Sales/CRM + all executive Construction/Project/Venue/Asset &
       *  Logistics management). */
      subtitle: "Experiential Productions",
      audience: "Producers · Internal",
      /** Kit v3 logo asset paths. The product mark is the 8-point
       *  Waypoint star; the GHXSTSHIP skull is parent-company only.
       *  Use the white variant on accent tiles, the ink variant on
       *  light grounds, and the per-product icon (white waypoint on
       *  the accent tile, self-contained) where a colored chip works. */
      iconWhite: "/brand/atlvs-mark-white.svg",
      iconInk: "/brand/atlvs-mark.svg",
      iconTile: "/brand/atlvs-icon-atlvs.svg",
    },
    portal: {
      name: "GVTEWAY",
      mark: "G V T E W A Y",
      color: "plasma",
      subtitle: "Public Interface & Marketplace",
      audience: "Guests · Clients",
      iconWhite: "/brand/atlvs-mark-white.svg",
      iconInk: "/brand/atlvs-mark.svg",
      iconTile: "/brand/atlvs-icon-gvteway.svg",
    },
    mobile: {
      name: "COMPVSS",
      mark: "C O M P V S S",
      color: "brass",
      subtitle: "Site & Venue Operations",
      audience: "Crew · Vendors · Talent",
      iconWhite: "/brand/atlvs-mark-white.svg",
      iconInk: "/brand/atlvs-mark.svg",
      iconTile: "/brand/atlvs-icon-compvss.svg",
    },
  },
} as const;

/**
 * Sub-product accent hexes — the TS mirror of `tokens.json` `products.*.accent`
 * (the design SSOT). For runtime consumers that CANNOT read the `--p-accent`
 * CSS variable: OG/ImageResponse generation, HTML email, invite emails, and
 * data-driven marketing/brand-kit surfaces that enumerate the products.
 *
 * CSS surfaces must keep using `--p-accent`; this is the literal-only escape
 * hatch and the single owner for these four hexes. Keep in lockstep with
 * `src/app/theme/tokens.json`.
 */
export const PRODUCT_ACCENTS = {
  atlvs: "#E23414",
  compvss: "#FFC400",
  gvteway: "#2563EB",
  legend: "#ED6A1E",
} as const;

export type ProductAccentKey = keyof typeof PRODUCT_ACCENTS;

/** Convenience: the full trademark line used in footers + i18n. */
export const TRADEMARK_LINE = `${BRAND.products.console.name}, ${BRAND.products.portal.name}, and ${BRAND.products.mobile.name} are trademarks of ${BRAND.legalName}, a ${BRAND.parent.mark} company.`;
