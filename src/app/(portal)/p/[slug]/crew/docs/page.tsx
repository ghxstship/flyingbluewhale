import { DocsSurface } from "@/components/workforce/DocsSurface";

/**
 * GVTEWAY crew docs — thin wrapper over shared <DocsSurface>.
 * The upload form is portal-native as of ADR-0008 Amendment 4.
 */
export const dynamic = "force-dynamic";

export default async function CrewDocsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <DocsSurface variant="portal" uploadHref={`/p/${slug}/crew/docs/new`} eyebrowLabel="Crew" titleLabel="Docs" />;
}
