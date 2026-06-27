import { FeedSurface } from "@/components/workforce/FeedSurface";

/**
 * GVTEWAY crew feed (ADR-0008 Move 1) — thin wrapper over the shared
 * `<FeedSurface>`. Replaces the placeholder CrewScaffoldPage that
 * landed in the prior commit; this surface now renders the full
 * announcements list, identical to /m/feed.
 *
 * Per-slug revalidate path is computed so a mark-as-read on the
 * portal-side surface refreshes exactly the right cache entry.
 */
export const dynamic = "force-dynamic";

export default async function CrewFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FeedSurface variant="portal" revalidatePath={`/p/${slug}/crew/feed`} eyebrowLabel="Crew" titleLabel="Feed" />;
}
