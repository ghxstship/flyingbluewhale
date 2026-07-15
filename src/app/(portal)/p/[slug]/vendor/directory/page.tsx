import { notFound } from "next/navigation";
import { DirectorySurface } from "@/components/workforce/DirectorySurface";
import { projectIdFromSlug } from "@/lib/db/advancing";

/**
 * GVTEWAY vendor directory (ADR-0008 Move 3).
 *
 * The slug is the authorization boundary: it resolves to the project whose
 * roster this renders. A vendor is an external counterparty holding an ordinary
 * org membership, so the project filter is what keeps them from reading the
 * whole org's names + emails (see DirectorySurface's docblock).
 */
export const dynamic = "force-dynamic";

export default async function VendorDirectoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  return <DirectorySurface variant="portal" projectId={project.id} eyebrowLabel="Vendor" titleLabel="Directory" />;
}
