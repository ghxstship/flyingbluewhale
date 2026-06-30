import { apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { getSetupProgress } from "@/lib/setup/progress";

/**
 * GET /api/v1/setup — the org's activation / time-to-value checklist, derived
 * live from real data (create project → import → invite → go live). Drives the
 * SetupChecklist surface; also lets onboarding tooling read activation state.
 */
export async function GET() {
  return withAuth(async (session) => {
    const progress = await getSetupProgress(session.orgId);
    return apiOk(progress);
  });
}
