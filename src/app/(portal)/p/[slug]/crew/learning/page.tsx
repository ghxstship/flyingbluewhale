import { LearningSurface } from "@/components/connecteam/LearningSurface";

/**
 * GVTEWAY crew learning — thin wrapper over shared <LearningSurface>.
 * Course detail links deep into the mobile quiz surface; portal-side
 * assessment lifts in a future PR.
 */
export const dynamic = "force-dynamic";

export default function CrewLearningPage() {
  return (
    <LearningSurface
      variant="portal"
      detailHref={(id) => `/m/learning/${id}`}
      eyebrowLabel="Crew"
      titleLabel="Learning"
    />
  );
}
