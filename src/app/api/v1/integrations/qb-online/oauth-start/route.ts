import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";

/**
 * GET /api/v1/integrations/qb-online/oauth-start
 *
 * Initiates the QuickBooks Online OAuth-2 consent flow. The user is
 * redirected to Intuit; on consent, Intuit posts to our callback with
 * code + realmId.
 *
 * State carries the org_id so the callback can verify the connection
 * lands in the correct tenant. Production should HMAC-sign the state.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAuth(async (session) => {
    const clientId = process.env.QB_CLIENT_ID;
    if (!clientId) return apiError("internal", "QB_CLIENT_ID not configured");

    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/v1/integrations/qb-online/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      redirect_uri: redirectUri,
      state: session.orgId,
    });

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
    return NextResponse.redirect(authUrl, 302);
  });
}
