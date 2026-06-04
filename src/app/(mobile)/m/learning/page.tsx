import { LearningSurface } from "@/components/connecteam/LearningSurface";

/** COMPVSS learning — thin wrapper over shared <LearningSurface>. */
export const dynamic = "force-dynamic";

export default function MobileLearningPage() {
  return <LearningSurface variant="mobile" detailHref={(id) => `/m/learning/${id}`} />;
}
