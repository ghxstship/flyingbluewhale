import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { generateDigest, getCachedDigest } from "@/lib/ai/digest";

/**
 * GET  /api/v1/ai/digest — return the cached digest if fresh, else 204.
 * POST /api/v1/ai/digest — force-generate a new digest and return it.
 *
 * The console DigestWidget calls GET on load and POST when the user
 * clicks "Refresh". Rate budget re-uses the ai bucket (30/min).
 */

export async function GET(req: NextRequest) {
  return withAuth(async (session) => {
    const cached = await getCachedDigest(session.userId, session.orgId);
    if (!cached) return new Response(null, { status: 204 });
    return apiOk({ digest: cached });
  });
}

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:digest"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  return withAuth(async (session) => {
    const digest = await generateDigest(session.userId, session.orgId);
    return apiOk({ digest });
  });
}
