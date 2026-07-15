import { notFound } from "next/navigation";
import { DirectorySurface } from "@/components/workforce/DirectorySurface";
import { projectIdFromSlug } from "@/lib/db/advancing";

/**
 * GVTEWAY crew directory — thin wrapper over shared <DirectorySurface>.
 *
 * The slug is the authorization boundary: it resolves to the project whose
 * roster this renders. Without it the surface falls back to the org-wide
 * membership list (see DirectorySurface's docblock).
 */
export const dynamic = "force-dynamic";

export default async function CrewDirectoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  return <DirectorySurface variant="portal" projectId={project.id} eyebrowLabel="Crew" titleLabel="Directory" />;
}
