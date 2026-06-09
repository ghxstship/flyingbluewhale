import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { signOAuthState } from "@/lib/integrations/slack/sign";

/**
 * GET /api/v1/integrations/qb-online/oauth-start
 *
 * Initiates the QuickBooks Online OAuth-2 consent flow. The user is
 * redirected to Intuit; on consent, Intuit posts to our callback with
 * code + realmId.
 *
 * State is HMAC-signed (orgId + nonce + 10-min expiry, keyed off
 * QB_CLIENT_SECRET — the same generic `signOAuthState` the Slack flow
 * uses). A bare orgId state is guessable by any member or ex-member,
 * which enables connection-binding CSRF: an attacker starts their own
 * Intuit consent and replays our callback to bind THEIR realm to a
 * victim org's books.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAuth(async (session) => {
    const clientId = process.env.QB_CLIENT_ID;
    const clientSecret = process.env.QB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return apiError("service_unavailable", "QB_CLIENT_ID/QB_CLIENT_SECRET not configured");
    }

    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/v1/integrations/qb-online/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      redirect_uri: redirectUri,
      state: signOAuthState({ secret: clientSecret, orgId: session.orgId }),
    });

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
    return NextResponse.redirect(authUrl, 302);
  });
}
