"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { platformTabs, type PlatformTabFamily } from "@/lib/nav";
import { RouteTabs } from "@/components/ui/RouteTabs";

/**
 * Kit 20 second shelf — auto-renders the page-tab family for the current
 * route. `platformTabs` (src/lib/nav.ts) is the SSOT: 30 families, every
 * tab a real route. A family renders only on an EXACT member-path match
 * (list-level surfaces); detail pages keep their own record tabs via
 * `RecordTabsProvider`, which wins over this fallback in ModuleHeader.
 *
 * Slotted as the `RecordTabsSlot` fallback so every console list page
 * gets its family with zero per-page wiring — the shelf follows the IA
 * registry, not hand-maintained page props.
 */

const path = (href: string) => (href.split(/[?#]/)[0] ?? href).replace(/\/$/, "") || "/";

// path → family, owner claims win over tab cross-listings.
const FAMILY_BY_PATH: Map<string, PlatformTabFamily> = (() => {
  const m = new Map<string, PlatformTabFamily>();
  for (const fam of platformTabs) for (const t of fam.tabs) if (!m.has(path(t.href))) m.set(path(t.href), fam);
  for (const fam of platformTabs) m.set(path(fam.owner), fam); // owner overrides
  return m;
})();

export function familyForPath(pathname: string): PlatformTabFamily | null {
  return FAMILY_BY_PATH.get(path(pathname)) ?? null;
}

export function PlatformTabsAuto() {
  const pathname = usePathname();
  const fam = familyForPath(pathname ?? "");
  if (!fam) return null;
  return <RouteTabs tabs={fam.tabs} />;
}
