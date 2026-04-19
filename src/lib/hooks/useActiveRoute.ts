"use client";

import { usePathname } from "next/navigation";

/**
 * `useActiveRoute(href)` — single source of truth for "is this the
 * active nav item?" across every shell (platform sidebar, portal rail,
 * mobile tab bar, command palette).
 *
 * Rules (benchmarked against Linear + Stripe Dashboard):
 *   - Exact match is always active.
 *   - Prefix match is active ONLY when the next character is a "/"
 *     or end-of-string. This prevents `/console/proposals` from
 *     marking `/console/projects` active.
 *   - The root `/` is active only on exact match — it should never
 *     claim every page.
 *
 * Returns `{ isActive, isExact }`. Callers typically only need
 * `isActive`, but `isExact` is useful for disabling self-links.
 */

export type ActiveRouteState = { isActive: boolean; isExact: boolean };

export function matchRoute(pathname: string, href: string): ActiveRouteState {
  if (!href) return { isActive: false, isExact: false };
  if (pathname === href) return { isActive: true, isExact: true };
  if (href === "/") return { isActive: false, isExact: false };
  // Prefix match only at path-segment boundary.
  if (pathname.startsWith(href) && pathname.charAt(href.length) === "/") {
    return { isActive: true, isExact: false };
  }
  return { isActive: false, isExact: false };
}

export function useActiveRoute(href: string): ActiveRouteState {
  const pathname = usePathname();
  return matchRoute(pathname ?? "", href);
}
