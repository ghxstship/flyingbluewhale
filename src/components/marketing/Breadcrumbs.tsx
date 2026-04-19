/**
 * Marketing breadcrumbs — re-export of the unified primitive.
 *
 * The component moved to `src/components/ui/Breadcrumbs.tsx` so every
 * shell (console, portal, mobile, marketing) uses the exact same
 * implementation. Existing marketing imports keep working via this
 * re-export; new callers should import directly from `@/components/ui`.
 */
import { Breadcrumbs as UnifiedBreadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export type { Crumb };

export function Breadcrumbs(props: React.ComponentProps<typeof UnifiedBreadcrumbs>) {
  // Preserve the marketing-specific default container width when the caller
  // doesn't override — other shells want to position the trail themselves.
  const className = props.className ?? "mx-auto max-w-6xl px-6 pt-6";
  return <UnifiedBreadcrumbs {...props} className={className} />;
}
