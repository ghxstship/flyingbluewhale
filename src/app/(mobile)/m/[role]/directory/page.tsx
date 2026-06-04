/**
 * ADR-0009 URL flip — role-prefixed alias for /m/directory.
 *
 * Thin re-export so the canonical URL is /m/[role]/directory while the page
 * body still lives at /m/directory/page.tsx (avoids duplicating data fetch
 * logic across roles). Once every role-relevant surface migrates here,
 * the proxy.ts alias rule for /m/directory can flip to redirect instead.
 *
 * Next.js doesn't allow re-exporting route segment config (`dynamic`,
 * etc.) — that has to be declared at the new page's own module scope.
 */
export const dynamic = "force-dynamic";
export { default } from "@/app/(mobile)/m/directory/page";
