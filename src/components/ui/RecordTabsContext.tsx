"use client";

import * as React from "react";
import { RouteTabs, type RouteTab } from "@/components/ui/RouteTabs";

/**
 * Bridge between a Next.js route layout and the `ModuleHeader` rendered
 * inside its child page. The layout is the natural place to declare the
 * record's tabs (every sub-route shares the same tab list), but it
 * renders BEFORE the page in DOM order — so tabs declared at the layout
 * level can't naturally appear in the position the IA spec demands
 * (under the page's title, inside the module-header band).
 *
 * This context lets the layout publish its tabs and the ModuleHeader
 * (further down the tree, inside the page) consume them and render
 * them in its own `module-header-tabs` slot. Result: tabs always sit
 * directly below the title, never as a sticky overlay scrolling
 * separately from the title.
 *
 * Used by every record-tabs layout shipped in the WAYFINDER Phase B
 * remediation: project, venue, person, vendor, client, lead, equipment,
 * invoice. Replaces an earlier sticky-bar layout pattern that overlapped
 * the page title on scroll.
 */
const RecordTabsCtx = React.createContext<RouteTab[] | null>(null);

export function RecordTabsProvider({ tabs, children }: { tabs: RouteTab[]; children: React.ReactNode }) {
  return <RecordTabsCtx.Provider value={tabs}>{children}</RecordTabsCtx.Provider>;
}

/**
 * Renders the contextual tab strip if a layout above has set one, else
 * nothing. Slotted into `ModuleHeader` (see `src/components/Shell.tsx`)
 * as the fallback when no explicit `tabs` prop is passed.
 */
export function RecordTabsSlot({ fallback = null }: { fallback?: React.ReactNode }) {
  const tabs = React.useContext(RecordTabsCtx);
  if (!tabs || tabs.length === 0) return <>{fallback}</>;
  return <RouteTabs tabs={tabs} />;
}
