"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { matchRoute } from "@/lib/hooks/useActiveRoute";

export type RouteTab = { label: string; href: string };

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
 * Attio (record tabs). Tab cap: 6 visible — anything beyond becomes a
 * `More ▾` overflow per `docs/ia/02-navigation-redesign.md §3.4`.
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
  return (
    <nav role="tablist" aria-label="Section" className={`-mb-px flex items-center gap-1 ${scroll} ${className}`}>
      {tabs.map((t) => {
        const { isActive } = matchRoute(pathname ?? "", t.href);
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
            className={`relative inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--org-primary)] ${
              isActive
                ? "border-[var(--org-primary)] font-medium text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
