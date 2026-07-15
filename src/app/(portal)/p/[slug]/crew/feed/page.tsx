import { notFound } from "next/navigation";
import { FeedSurface } from "@/components/workforce/FeedSurface";
import { projectIdFromSlug } from "@/lib/db/advancing";

/**
 * GVTEWAY crew feed (ADR-0008 Move 1) — thin wrapper over the shared
 * `<FeedSurface>`, scoped to the slug's project. Unlike /m/feed this shows
 * only THIS project's announcements, never the org-wide internal ones.
 *
 * Per-slug revalidate path is computed so a mark-as-read on the
 * portal-side surface refreshes exactly the right cache entry.
 */
export const dynamic = "force-dynamic";

export default async function CrewFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  return (
    <FeedSurface
      variant="portal"
      projectId={project.id}
      revalidatePath={`/p/${slug}/crew/feed`}
      eyebrowLabel="Crew"
      titleLabel="Feed"
    />
  );
}
