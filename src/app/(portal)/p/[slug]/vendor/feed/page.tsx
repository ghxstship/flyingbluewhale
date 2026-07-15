import { notFound } from "next/navigation";
import { FeedSurface } from "@/components/workforce/FeedSurface";
import { projectIdFromSlug } from "@/lib/db/advancing";

/** GVTEWAY vendor feed (ADR-0008 Move 3) — scoped to the slug's project. */
export const dynamic = "force-dynamic";

export default async function VendorFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  return (
    <FeedSurface
      variant="portal"
      projectId={project.id}
      revalidatePath={`/p/${slug}/vendor/feed`}
      eyebrowLabel="Vendor"
      titleLabel="Feed"
    />
  );
}
