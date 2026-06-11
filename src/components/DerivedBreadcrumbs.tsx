"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { deriveBreadcrumbs } from "@/lib/breadcrumbs";

/**
 * Pathname-derived breadcrumb fallback for `ModuleHeader`. Renders the
 * nav-tree trail from `deriveBreadcrumbs` when a page doesn't pass an
 * explicit `breadcrumbs` prop. Client component so the (often server-
 * rendered) header can read the current pathname without threading
 * `headers()` through every page.
 *
 * Single-item trails are suppressed — they'd just repeat the page title.
 */
export function DerivedBreadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const items = deriveBreadcrumbs(pathname ?? "");
  if (items.length < 2) return null;
  return <Breadcrumbs items={items} className={className} />;
}
