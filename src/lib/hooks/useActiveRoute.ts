"use client";

import { usePathname } from "next/navigation";
import { matchRoute, type ActiveRouteState } from "@/lib/match-route";

/**
 * `useActiveRoute(href)` — single source of truth for "is this the
 * active nav item?" across every shell (platform sidebar, portal rail,
 * mobile tab bar, command palette).
 *
 * The pure helper now lives at `@/lib/match-route` so server components
 * (e.g. PortalRail) can import it without crossing the client boundary.
 * The re-export below keeps existing client-side `matchRoute` imports
 * working unchanged.
 */

export { matchRoute };
export type { ActiveRouteState };

export function useActiveRoute(href: string): ActiveRouteState {
  const pathname = usePathname();
  return matchRoute(pathname ?? "", href);
}
