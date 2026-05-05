import { apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";

/**
 * Zapier "Auth Test" — invoked once when a Zapier user connects their
 * account. Returns a stable, human-readable identity blob that Zapier
 * displays in the connection list ("Connected as Julian @ LYTEHAUS Demo").
 *
 * Auth is a Bearer PAT minted at /console/settings/api. Failure returns
 * 401 via `withAuth`, which Zapier maps to "credentials are invalid".
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    return apiOk({
      id: session.userId,
      email: session.email,
      orgId: session.orgId,
      orgSlug: session.orgSlug,
      role: session.role,
      // Zapier shows whichever string is named `label`. Use a sentence
      // case so the connection card reads naturally.
      label: session.email ? `${session.email} · ${session.orgSlug || "(no org)"}` : session.orgSlug || session.userId,
    });
  });
}
