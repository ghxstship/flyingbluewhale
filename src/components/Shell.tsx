import React from "react";
import Link from "next/link";
import type { NavGroup, NavItem, NavSection } from "@/lib/nav";
import { MobileTabBarClient } from "./MobileTabBarClient";
import { Breadcrumbs as UnifiedBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { RecordTabsSlot } from "@/components/ui/RecordTabsContext";
import { matchRoute } from "@/lib/match-route";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";

export { PlatformSidebar } from "./PlatformSidebar";

/**
 * Portal rail — accepts ADR-0005 super-persona-shaped `NavGroup` and
 * renders sectioned (Workspace + persona) when sections are present;
 * falls back to flat `items` for any caller passing the legacy shape.
 *
 * `title` is optional and overrides `group.label` when supplied — used
 * by the shared `/p/[slug]/{tasks,messages,inbox,announcements}` pages
 * that need a generic "Portal" label rather than a super-persona name.
 */
export function PortalRail({
  group,
  items,
  title,
  currentPath,
}: {
  group?: NavGroup;
  items?: NavItem[];
  title?: string;
  currentPath?: string;
}) {
  const sections: NavSection[] = group?.sections?.length
    ? group.sections
    : group
      ? [{ label: group.label, items: group.items }]
      : [{ label: title ?? "", items: items ?? [] }];
  const headerTitle = title ?? group?.label ?? "";
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <div className="mb-3 flex items-center gap-2">
        {/* Canonical SaaS brand row — Inter 700 16px tight letter-spacing
            per ui_kits/atlvs/dashboard.html .brandrow b. The pre-v3
            cosmic Big Shoulders display + uppercase has been removed
            from SaaS surfaces (design canon: brand display reserved for
            marketing only). The spaced "G V T E W A Y" wordmark form
            remains — that's a brand-canon affordance, not a font choice. */}
        <span className="text-base font-bold tracking-[-0.01em] text-[var(--org-primary)]">G V T E W A Y</span>
      </div>
      {headerTitle ? <div className="nav-label">{headerTitle}</div> : null}
      {sections.map((section, idx) => (
        <div key={`${section.label}-${idx}`} className={idx === 0 ? "mt-0.5" : "mt-3"}>
          {idx > 0 && section.label ? (
            <div className="nav-label px-2 pb-1 text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
              {section.label}
            </div>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((i) => {
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
        </div>
      ))}
      {/* Language switch parity with the platform sidebar — every authed
          surface needs a way out of English without leaving the page. */}
      <div className="mt-auto flex justify-end pt-3">
        <LocaleSwitcher />
      </div>
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
            <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--org-primary)] uppercase">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-[var(--foreground)]">{title}</h1>
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
