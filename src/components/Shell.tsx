import React from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/nav";
import { MobileTabBarClient } from "./MobileTabBarClient";
import { Breadcrumbs as UnifiedBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { matchRoute } from "@/lib/hooks/useActiveRoute";

export { PlatformSidebar } from "./PlatformSidebar";

export function PortalRail({ items, title, currentPath }: { items: NavItem[]; title: string; currentPath?: string }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--org-primary)]">
        GVTEWAY
      </div>
      <div className="nav-label">{title}</div>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((i) => {
          // Unified active-route rule so /p/{slug}/client/invoices/{id} still
          // marks `Invoices` active. IA spec §7 anti-pattern #2.
          const { isActive: active } = matchRoute(currentPath ?? "", i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={active ? "nav-item nav-item-active" : "nav-item"}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
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
  subtitle?: string;
  action?: React.ReactNode;
  eyebrow?: string;
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
          {breadcrumbs && breadcrumbs.length > 0 && (
            <UnifiedBreadcrumbs items={breadcrumbs} className="mb-2" />
          )}
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--org-primary)]">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {tabs && <div className="module-header-tabs px-6">{tabs}</div>}
    </div>
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
