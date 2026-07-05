import React from "react";
import { Info } from "lucide-react";
import { Breadcrumbs as UnifiedBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { DerivedBreadcrumbs } from "@/components/DerivedBreadcrumbs";
import { RecordTabsSlot } from "@/components/ui/RecordTabsContext";
import { PlatformTabsAuto } from "@/components/PlatformTabs";
import { Hint } from "@/components/ui/Tooltip";

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
  info,
  action,
  eyebrow,
  breadcrumbs,
  tabs,
}: {
  title: string;
  subtitle?: React.ReactNode;
  /** Kit W0 tooltip pattern — the module blurb, shown from an ⓘ beside the
   *  title instead of a description paragraph. Use for what-this-page-is
   *  copy; keep `subtitle` for record metadata (dates, IDs, live status). */
  info?: string;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Optional breadcrumb trail rendered above the title. Delegates to the
   *  unified `<Breadcrumbs>` primitive so every shell (console, portal,
   *  mobile, marketing) shares the same JSON-LD + truncation rules.
   *  See docs/ia/02-navigation-redesign.md §3.7.
   *  When omitted, console pages get a pathname-derived default trail via
   *  `<DerivedBreadcrumbs>`; pass an empty array to suppress crumbs
   *  entirely. */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Optional Tabs slot rendered at the bottom of the header (e.g. <TabsList>). */
  tabs?: React.ReactNode;
}) {
  return (
    <div className="module-header">
      <div className="module-header-inner">
        <div className="min-w-0 flex-1">
          {breadcrumbs === undefined ? (
            <DerivedBreadcrumbs className="mb-2" />
          ) : breadcrumbs.length > 0 ? (
            <UnifiedBreadcrumbs items={breadcrumbs} className="mb-2" />
          ) : null}
          {/* Canonical SaaS module header — Space Mono uppercase crumb +
              Inter h1 sentence case per ui_kits/atlvs/dashboard.html .top.
              The pre-v3 cosmic Big Shoulders display + UPPERCASE h1 was
              removed from SaaS surfaces; UPPERCASE remains on the small
              eyebrow per the Title Case rule's letter-spaced-label
              exception. */}
          {eyebrow && <div className="eyebrow eyebrow-accent">{eyebrow}</div>}
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-[-0.01em] text-[var(--p-text-1)]">
            {title}
            {info ? (
              <Hint label={info} side="right">
                <span className="inline-grid cursor-help place-items-center p-0.5 text-[var(--p-text-3)]" tabIndex={0}>
                  <Info size={15} aria-label={info} />
                </span>
              </Hint>
            ) : null}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--p-text-2)]">{subtitle}</p> : null}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="module-header-tabs px-6">{tabs ?? <RecordTabsSlot fallback={<PlatformTabsAuto />} />}</div>
    </div>
  );
}
