import React from "react";
import { Breadcrumbs as UnifiedBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { RecordTabsSlot } from "@/components/ui/RecordTabsContext";

/**
 * Module header — canonical SaaS title block used by every page.
 *
 * Extracted from `src/components/Shell.tsx` (ADR-0007 follow-up) so
 * client components (e.g. shell error.tsx files) can render a header
 * without dragging the i18n server-only imports — Shell.tsx imports
 * `getRequestT` for its async `PortalRail`, which transitively pulls
 * `next/headers` into any Client Component graph that imports anything
 * from Shell. Pre-existing build error trace ended at
 * `Shell.tsx → i18n/request.ts → i18n/server.ts → next/headers`.
 *
 * This file deliberately has zero i18n imports so it can be safely
 * consumed by both Server and Client components.
 *
 * Pure-render component — no async, no i18n. Callers that want
 * translation pass already-translated strings in.
 */
export function ModuleHeader({
  title,
  subtitle,
  action,
  eyebrow,
  breadcrumbs,
  tabs,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Optional breadcrumb trail rendered above the title. Delegates to the
   *  unified `<Breadcrumbs>` primitive so every shell (console, portal,
   *  mobile, marketing) shares the same JSON-LD + truncation rules.
   *  See docs/ia/02-navigation-redesign.md §3.7. */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Optional Tabs slot rendered at the bottom of the header (e.g. <TabsList>). */
  tabs?: React.ReactNode;
}) {
  return (
    <div className="module-header">
      <div className="module-header-inner">
        <div className="min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && <UnifiedBreadcrumbs items={breadcrumbs} className="mb-2" />}
          {/* Canonical SaaS module header — Space Mono uppercase crumb +
              Inter h1 sentence case per ui_kits/atlvs/dashboard.html .top.
              The pre-v3 cosmic Big Shoulders display + UPPERCASE h1 was
              removed from SaaS surfaces; UPPERCASE remains on the small
              eyebrow per the Title Case rule's letter-spaced-label
              exception. */}
          {eyebrow && (
            <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-accent)] uppercase">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-[var(--p-text-1)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--p-text-2)]">{subtitle}</p> : null}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="module-header-tabs px-6">{tabs ?? <RecordTabsSlot />}</div>
    </div>
  );
}
