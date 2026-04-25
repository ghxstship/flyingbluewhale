/**
 * `matchRoute(pathname, href)` — pure helper, importable from server or
 * client. The hook variant lives in `lib/hooks/useActiveRoute.ts`.
 *
 * Rules (benchmarked against Linear + Stripe):
 *   - Exact match is always active.
 *   - Prefix match active ONLY when the next character is "/" or
 *     end-of-string. Stops `/console/proposals` from claiming
 *     `/console/projects`.
 *   - The root `/` is active only on exact match.
 */

export type ActiveRouteState = { isActive: boolean; isExact: boolean };

export function matchRoute(pathname: string, href: string): ActiveRouteState {
  if (!href) return { isActive: false, isExact: false };
  if (pathname === href) return { isActive: true, isExact: true };
  if (href === "/") return { isActive: false, isExact: false };
  if (pathname.startsWith(href) && pathname.charAt(href.length) === "/") {
    return { isActive: true, isExact: false };
  }
  return { isActive: false, isExact: false };
}
