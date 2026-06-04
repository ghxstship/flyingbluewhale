import { FeedSurface } from "@/components/connecteam/FeedSurface";

/**
 * COMPVSS feed (ADR-0008 Move 1) — thin wrapper over the shared
 * `<FeedSurface>` so this page and `/p/[slug]/crew/feed` render the
 * exact same announcements list. Page-level concerns (layout, the
 * revalidate path) stay here; the data fetch + render moves into the
 * shared component.
 */
export const dynamic = "force-dynamic";

export default function MobileFeedPage() {
  return <FeedSurface variant="mobile" revalidatePath="/m/feed" />;
}
