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
 * Pull the portal slug out of a URL pathname, or return null when:
 *   - The path isn't a /p/<slug> route.
 *   - The slug is one of the reserved sentinels (`select`,
 *     `undefined`, `null`) — these are app-level placeholders, not
 *     real portal slugs we should DB-resolve.
 *
 * Examples:
 *   /p/mmw26/guide        → "mmw26"
 *   /p/foo                → "foo"
 *   /p/select             → null
 *   /console/foo          → null
 */
export function extractPortalSlug(pathname: string): string | null {
  const m = PORTAL_SLUG_RX.exec(pathname);
  if (!m) return null;
  const slug = m[1];
  if (slug === "select" || slug === "undefined" || slug === "null") return null;
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
