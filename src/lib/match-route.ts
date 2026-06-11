/**
 * `matchRoute(pathname, href)` — pure helper, importable from server or
 * client. The hook variant lives in `lib/hooks/useActiveRoute.ts`.
 *
 * Rules (benchmarked against Linear + Stripe):
 *   - Exact match is always active.
 *   - Prefix match active ONLY when the next character is "/" or
 *     end-of-string. Stops `/console/proposals` from claiming
 *     `/console/projects`.
 *   - Shell roots (`/`, `/console`, `/m`, `/me`) are active only on
 *     exact match — otherwise the Overview/Home entry lights on every
 *     page in its shell.
 *   - Hrefs carrying a query string (e.g.
 *     `/console/commercial/hospitality?audience=guest`) identify a
 *     filtered view of a shared route. `pathname` never includes search
 *     params, so these entries never claim active state — the
 *     query-free twin owns the highlight, which keeps duplicate nav
 *     entries from fighting over it.
 */

export type ActiveRouteState = { isActive: boolean; isExact: boolean };

const EXACT_ONLY_ROOTS = new Set(["/", "/console", "/m", "/me"]);

export function matchRoute(pathname: string, href: string): ActiveRouteState {
  if (!href) return { isActive: false, isExact: false };
  if (href.includes("?")) return { isActive: false, isExact: false };
  if (pathname === href) return { isActive: true, isExact: true };
  if (EXACT_ONLY_ROOTS.has(href)) return { isActive: false, isExact: false };
  if (pathname.startsWith(href) && pathname.charAt(href.length) === "/") {
    return { isActive: true, isExact: false };
  }
  return { isActive: false, isExact: false };
}
