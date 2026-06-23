import { LearningSurface } from "@/components/connecteam/LearningSurface";

/**
 * GVTEWAY crew learning — thin wrapper over shared <LearningSurface>.
 * Learning was retired from the COMPVSS mobile kit (it is a portal/studio
 * concern, not a field surface), so course rows stay portal-side; the
 * portal-native assessment detail lifts in a future PR. Until then detail
 * links keep the user on the portal learning list rather than 404-ing into
 * the deleted `/m/learning` surface.
 */
export const dynamic = "force-dynamic";

export default async function CrewLearningPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <LearningSurface
      variant="portal"
      detailHref={() => `/p/${slug}/crew/learning`}
      eyebrowLabel="Crew"
      titleLabel="Learning"
    />
  );
}
