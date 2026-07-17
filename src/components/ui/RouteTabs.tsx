"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { matchRoute } from "@/lib/hooks/useActiveRoute";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";

export type RouteTab = { label: string; href: string };

/** Tab cap per docs/ia/02-navigation-redesign.md §3.4 — the first six
 *  tabs render inline; everything beyond collapses into a `More`
 *  overflow menu. The active tab is always visible: when it lives in
 *  the overflow it swaps places with the last visible tab. */
const VISIBLE_CAP = 6;

const TAB_BASE_CLASS =
  "relative inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-focus)]";
const TAB_ACTIVE_CLASS = "border-[var(--p-accent)] font-medium text-[var(--p-text-1)]";
const TAB_INACTIVE_CLASS = "border-transparent text-[var(--p-text-2)] hover:text-[var(--p-text-1)]";

/**
 * Presentational tabs strip that uses Next.js routing for state instead of
 * Radix's controlled `<Tabs>` (which is for in-page state). Lives in the
 * `ModuleHeader.tabs` slot per the IA spec — every detail page that has
 * sub-resources renders one of these so navigation between sub-views is
 * one click warm and shares URL semantics with deep links / browser back.
 *
 * Active state delegates to `matchRoute` so all shells agree on which tab
 * is current — the same matcher the sidebar and command palette use.
 *
 * Reference patterns: Stripe Dashboard (record tabs), Linear (issue tabs),
 * Attio (record tabs).
 */
export function RouteTabs({
  tabs,
  scrollable = true,
  className = "",
}: {
  tabs: RouteTab[];
  /** Allow horizontal scroll on overflow rather than wrap (Stripe pattern). */
  scrollable?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const scroll = scrollable ? "overflow-x-auto whitespace-nowrap scrollbar-thin" : "";
  // Identify "parent" tabs whose href is a prefix of another tab's href.
  // The Overview tab on a record is the canonical case: its href is the
  // record root (`/studio/clients/[id]`) and every other tab nests
  // under it. Without this distinction matchRoute would mark Overview
  // active on every sub-route via prefix match. Linear and Stripe both
  // apply the same exact-only rule for parent tabs.
  const isParentHref = (href: string) => tabs.some((other) => other.href !== href && other.href.startsWith(`${href}/`));
  const isTabActive = (tab: RouteTab) => {
    const m = matchRoute(pathname ?? "", tab.href);
    return isParentHref(tab.href) ? m.isExact : m.isActive;
  };

  let visible = tabs;
  let overflow: RouteTab[] = [];
  if (tabs.length > VISIBLE_CAP) {
    visible = tabs.slice(0, VISIBLE_CAP);
    overflow = tabs.slice(VISIBLE_CAP);
    const activeIdx = overflow.findIndex(isTabActive);
    const activeTab = activeIdx >= 0 ? overflow[activeIdx] : undefined;
    const lastVisible = visible[visible.length - 1];
    if (activeTab && lastVisible) {
      visible = [...visible.slice(0, -1), activeTab];
      overflow = [lastVisible, ...overflow.slice(0, activeIdx), ...overflow.slice(activeIdx + 1)];
    }
  }

  return (
    <nav role="tablist" aria-label="Section" className={`-mb-px flex items-center gap-1 ${scroll} ${className}`}>
      {visible.map((t) => {
        const isActive = isTabActive(t);
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            // Match the underline-tab styling used by the Radix Tabs primitive
            // ([Tabs.tsx:35]) so the shell looks consistent regardless of
            // whether a page wires URL-state tabs or route-state tabs.
            className={`${TAB_BASE_CLASS} ${isActive ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}`}
          >
            {t.label}
          </Link>
        );
      })}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="More Tabs" className={`${TAB_BASE_CLASS} ${TAB_INACTIVE_CLASS}`}>
              More
              <ChevronDown size={12} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflow.map((t) => (
              <DropdownMenuItem key={t.href} asChild>
                <Link href={t.href} className="cursor-pointer">
                  {t.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
