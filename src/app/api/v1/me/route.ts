import { apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";

/**
 * Canonical "who am I" endpoint. Returns the current session payload
 * (user id, email, active org, role, persona, tier) or 401 if no session.
 *
 * Sea Trial FINDING-003 — pre-fix this route was missing; client code
 * targeting `/api/v1/me` got a Next.js 404 page instead of a 401 JSON.
 * Sub-resources at `/api/v1/me/preferences`, `/api/v1/me/workspaces`, etc.
 * already existed and stay unchanged.
 */
export async function GET() {
  return withAuth(async (session) => {
    return apiOk({
      userId: session.userId,
      email: session.email,
      orgId: session.orgId,
      role: session.role,
      tier: session.tier,
      persona: session.persona,
    });
  });
}
