import type { NavItem } from "@/lib/nav";
import { MobileTabBarClient } from "./MobileTabBarClient";
import { Skeleton } from "./ui/Skeleton";

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

// PageStub was the generate-stubs.sh placeholder; zero routes render it
// anymore (audit 2026-06-09 confirmed), so the export is gone. New stub
// routes should build real pages — never resurrect a placeholder export.

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
            <Skeleton width={96} height={12} />
            <Skeleton width="100%" height={40} />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton width={80} height={36} radius="var(--p-r-md)" />
          <Skeleton width={96} height={36} radius="var(--p-r-md)" />
        </div>
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className="page-content space-y-3" aria-busy="true">
        <Skeleton width="100%" height={40} radius="var(--p-r-md)" />
        <div className="surface overflow-hidden">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0"
            >
              <Skeleton className="flex-1" height={16} />
              <Skeleton width={96} height={16} />
              <Skeleton width={64} height={16} />
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
          <Skeleton width={80} height={12} />
          <Skeleton width={256} height={28} />
          <Skeleton width={384} height={16} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={96} />
          ))}
        </div>
        <Skeleton width="100%" height={160} />
      </div>
    );
  }
  return (
    <div className="page-content space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={56} />
      ))}
    </div>
  );
}
