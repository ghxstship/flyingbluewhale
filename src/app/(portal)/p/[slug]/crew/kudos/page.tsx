import { KudosSurface } from "@/components/workforce/KudosSurface";

/** GVTEWAY crew kudos — thin wrapper over shared <KudosSurface>. */
export const dynamic = "force-dynamic";

export default async function CrewKudosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <KudosSurface variant="portal" revalidatePath={`/p/${slug}/crew/kudos`} eyebrowLabel="Crew" titleLabel="Kudos" />
  );
}
