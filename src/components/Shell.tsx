import type { NavItem } from "@/lib/nav";
import { MobileTabBarClient } from "./MobileTabBarClient";

export { PlatformSidebar } from "./PlatformSidebar";
// ModuleHeader and PortalRail extracted to their own modules. Shell.tsx
// stays i18n-free so Client Components that import any Shell export
// (PageStub, MobileTabBar) don't drag `next/headers` into the client
// graph via the i18n/request → i18n/server chain. Pre-existing 8-error
// build break originated here. See ADR-0007 follow-up.
export { ModuleHeader } from "./ModuleHeader";
export { PortalRail } from "./PortalRail";

export function MobileTabBar({ items, badges }: { items: NavItem[]; badges?: Record<string, number> }) {
  return <MobileTabBarClient items={items} badges={badges} />;
}

/**
 * PageStub — render-time placeholder for routes scaffolded via
 * `scripts/generate-stubs.sh` that haven't been wired up yet.
 */
import { ModuleHeader } from "./ModuleHeader";

export function PageStub({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <ModuleHeader title={title} subtitle={description} />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--p-text-2)]">This surface is scaffolded but not yet wired.</div>
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
            <div className="ps-skel h-3 w-24" />
            <div className="ps-skel h-10" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <div className="ps-skel h-9 w-20 rounded-md" />
          <div className="ps-skel h-9 w-24 rounded-md" />
        </div>
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className="page-content space-y-3" aria-busy="true">
        <div className="ps-skel h-10 rounded-md" />
        <div className="surface overflow-hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0"
            >
              <div className="ps-skel h-4 flex-1" />
              <div className="ps-skel h-4 w-24" />
              <div className="ps-skel h-4 w-16" />
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
          <div className="ps-skel h-3 w-20" />
          <div className="ps-skel h-7 w-64" />
          <div className="ps-skel h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ps-skel h-24" />
          ))}
        </div>
        <div className="ps-skel h-40" />
      </div>
    );
  }
  return (
    <div className="page-content space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ps-skel h-14" />
      ))}
    </div>
  );
}
