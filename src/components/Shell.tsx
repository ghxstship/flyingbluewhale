import React from "react";
import type { NavItem } from "@/lib/nav";
import { MobileTabBarClient } from "./MobileTabBarClient";
import { PortalRailClient } from "./PortalRailClient";
import { Breadcrumbs as UnifiedBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { RecordTabsSlot } from "@/components/ui/RecordTabsContext";

export { PlatformSidebar } from "./PlatformSidebar";

export function PortalRail({ items, title }: { items: NavItem[]; title: string }) {
  return <PortalRailClient items={items} title={title} />;
}

export function MobileTabBar({ items, badges }: { items: NavItem[]; badges?: Record<string, number> }) {
  return <MobileTabBarClient items={items} badges={badges} />;
}

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
          {eyebrow && (
            <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">{eyebrow}</div>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="module-header-tabs px-6">{tabs ?? <RecordTabsSlot />}</div>
    </div>
  );
}

/**
 * PageStub — render-time placeholder for routes scaffolded via
 * `scripts/generate-stubs.sh` that haven't been wired up yet.
 */
export function PageStub({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <ModuleHeader title={title} subtitle={description} />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--text-secondary)]">
          This surface is scaffolded but not yet wired.
        </div>
      </div>
    </>
  );
}

export function PageSkeleton({
  rows = 5,
  variant = "list",
}: {
  rows?: number;
  variant?: "list" | "form" | "table" | "detail";
}) {
  if (variant === "form") {
    return (
      <div className="page-content space-y-4" aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-10" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <div className="skeleton h-9 w-20 rounded-md" />
          <div className="skeleton h-9 w-24 rounded-md" />
        </div>
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className="page-content space-y-3" aria-busy="true">
        <div className="skeleton h-10 rounded-md" />
        <div className="surface overflow-hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-2.5 last:border-0"
            >
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (variant === "detail") {
    return (
      <div className="page-content space-y-6" aria-busy="true">
        <div className="space-y-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-7 w-64" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="skeleton h-40" />
      </div>
    );
  }
  return (
    <div className="page-content space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14" />
      ))}
    </div>
  );
}
