/**
 * Portal-slug helpers used by the middleware (proxy.ts) to resolve
 * `/p/<slug>/...` URLs before the response stream starts. Extracted so
 * they have unit-test coverage independent of the Edge runtime in
 * proxy.ts (which can't be vitest-imported directly without a
 * Next.js fixture).
 *
 * No DOM, no node: dependencies — pure string handling so the proxy
 * can re-use this in any runtime.
 */

const PORTAL_SLUG_RX = /^\/p\/([^/]+)(?:\/|$)/;

/**
 * Reserved first-segments under `/p/` that are real app routes, NOT tenant
 * slugs: the `select` picker plus the GVTEWAY consumer surfaces (design_handoff
 * §2 — root-level `/p/discover`, `/p/saved`, `/p/account`, …). The middleware
 * slug pre-check must skip these so their static routes serve instead of
 * 404ing as "unknown portal". Keep in sync with the `portalConsumerNav` routes.
 */
const RESERVED_PORTAL_SEGMENTS = new Set([
  "select",
  "undefined",
  "null",
  "discover",
  "onsite",
  "community",
  "scenes",
  "lists",
  "saved",
  "account",
  "welcome",
]);

/**
 * Pull the portal slug out of a URL pathname, or return null when:
 *   - The path isn't a /p/<slug> route.
 *   - The first segment is a reserved app route (the `select` picker, the
 *     GVTEWAY consumer surfaces) or a placeholder sentinel — not a real portal
 *     slug we should DB-resolve.
 *
 * Examples:
 *   /p/mmw26/guide        → "mmw26"
 *   /p/foo                → "foo"
 *   /p/select             → null
 *   /p/discover           → null
 *   /studio/foo          → null
 */
export function extractPortalSlug(pathname: string): string | null {
  const m = PORTAL_SLUG_RX.exec(pathname);
  if (!m) return null;
  const slug = m[1]!;
  if (RESERVED_PORTAL_SEGMENTS.has(slug)) return null;
  return slug;
}

/**
 * Minimal HTML-entity escape for embedding untrusted strings into the
 * 404 fallback page rendered by proxy.ts. We don't need a full
 * sanitizer here — the only thing we ever interpolate is a slug that
 * already passed extractPortalSlug() — but defense-in-depth means we
 * still escape every char that could close a tag or attribute.
 */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
