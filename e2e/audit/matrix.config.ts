/**
 * CHROMA BEACON × responsive audit matrix.
 *
 * Shared source of truth for the themes/responsive/browser audit. Used by
 * `e2e/audit/themes-responsive.spec.ts` to drive the validation pass and
 * by `docs/audits/AUDIT_THEMES_RESPONSIVE_*.md` as the reported matrix.
 */

export const THEMES = [
  "glass",
  "brutal",
  "bento",
  "kinetic",
  "copilot",
  "cyber",
  "soft",
  "earthy",
] as const;
export type Theme = (typeof THEMES)[number];

export const BREAKPOINTS = [
  { name: "mobile-s", width: 375, height: 667, device: "iPhone SE (1st gen)" },
  { name: "mobile", width: 390, height: 844, device: "iPhone 14/15" },
  { name: "tablet", width: 768, height: 1024, device: "iPad Mini portrait" },
  { name: "tablet-lg", width: 1024, height: 1366, device: "iPad Pro portrait" },
  { name: "desktop", width: 1280, height: 800, device: "Desktop 1280" },
  { name: "desktop-xl", width: 1920, height: 1080, device: "Desktop 1920" },
] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/**
 * Curated representative routes. Each shell is covered with at least one
 * list-style and one detail-style route. Routes that require a session
 * are flagged `authed: true` so the spec uses the shared login helper.
 *
 * The full 225-route inventory is catalogued in the audit report; this
 * list is the executed slice. CI can lift the sample by expanding
 * `ROUTES` without touching the spec.
 */
export const ROUTES: Array<{
  path: string;
  name: string;
  shell: "marketing" | "auth" | "platform" | "portal" | "mobile" | "personal";
  authed: boolean;
  /** If true, this route is known to require seeded data — skip if missing. */
  requiresSeed?: boolean;
}> = [
  // Marketing — public, no auth (all 19 static marketing routes)
  { path: "/", name: "marketing-home", shell: "marketing", authed: false },
  { path: "/pricing", name: "marketing-pricing", shell: "marketing", authed: false },
  { path: "/about", name: "marketing-about", shell: "marketing", authed: false },
  { path: "/solutions", name: "marketing-solutions", shell: "marketing", authed: false },
  { path: "/solutions/atlvs", name: "marketing-solutions-atlvs", shell: "marketing", authed: false },
  { path: "/solutions/gvteway", name: "marketing-solutions-gvteway", shell: "marketing", authed: false },
  { path: "/solutions/compvss", name: "marketing-solutions-compvss", shell: "marketing", authed: false },
  { path: "/features", name: "marketing-features", shell: "marketing", authed: false },
  { path: "/contact", name: "marketing-contact", shell: "marketing", authed: false },
  { path: "/customers", name: "marketing-customers", shell: "marketing", authed: false },
  { path: "/compare", name: "marketing-compare", shell: "marketing", authed: false },
  { path: "/guides", name: "marketing-guides", shell: "marketing", authed: false },
  { path: "/blog", name: "marketing-blog", shell: "marketing", authed: false },
  { path: "/changelog", name: "marketing-changelog", shell: "marketing", authed: false },
  { path: "/docs", name: "marketing-docs", shell: "marketing", authed: false },
  { path: "/legal/privacy", name: "marketing-privacy", shell: "marketing", authed: false },
  { path: "/legal/terms", name: "marketing-terms", shell: "marketing", authed: false },
  { path: "/legal/dpa", name: "marketing-dpa", shell: "marketing", authed: false },
  { path: "/legal/sla", name: "marketing-sla", shell: "marketing", authed: false },
  // Auth
  { path: "/login", name: "auth-login", shell: "auth", authed: false },
  { path: "/signup", name: "auth-signup", shell: "auth", authed: false },
  { path: "/forgot-password", name: "auth-forgot", shell: "auth", authed: false },
  // Personal (authed) — renders without seed data
  { path: "/me/settings/appearance", name: "personal-appearance", shell: "personal", authed: true },
];

/**
 * Full browser matrix. The spec chooses a project via `test.use({ browserName })`.
 * `firefox` + `webkit` are only run on the cross-browser slice to keep the
 * local run time tractable; CI can expand via `AUDIT_BROWSERS` env.
 */
export const BROWSERS = ["chromium", "firefox", "webkit"] as const;
export type BrowserName = (typeof BROWSERS)[number];
