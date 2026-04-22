/**
 * Marketing-shell Suspense fallback.
 *
 * Returns `null` instead of a full skeleton so client-side `<Link>` nav
 * keeps the previous page painted until the new page's RSC payload is
 * ready, matching the Vercel / Linear / Stripe pattern. A heavy skeleton
 * here flashes jarringly on fast transitions (the prior version rendered
 * a 6-row PageSkeleton that was visible for ~150ms on every internal
 * nav even when the new page was static and fully pre-rendered).
 *
 * Pages that genuinely need a loading state (slow data fetches) should
 * render their own local `<Suspense>` boundaries with targeted fallbacks
 * rather than relying on this shell-level fallback.
 */
export default function Loading() {
  return null;
}
