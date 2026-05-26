import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { buildInstallUrl } from "@/lib/integrations/slack/oauth";
import { signOAuthState } from "@/lib/integrations/slack/sign";
import { urlFor } from "@/lib/urls";

/**
 * Phase 5.3 — Slack OAuth install bootstrap.
 *
 * GET → 302 redirect into Slack's `oauth/v2/authorize` with our client id,
 * scopes, and a CSRF-signed state. The signing key is `SLACK_SIGNING_SECRET`
 * (re-using the signing-secret env so we don't multiply secrets — a stale
 * leak invalidates BOTH event verification AND OAuth state at once).
 *
 * The redirect_uri must match what we register in Slack's app config —
 * always the apex (marketing) host. Slack does not allow wildcard
 * redirect URIs, so the exact same URL is sent here and used in callback.
 */

export async function GET() {
  return withAuth(async (session) => {
    // Org-admin only. Rely on the platform owner/admin "*" capability.
    const denial = assertCapability(session, "*");
    if (denial) return denial;

    const clientId = env.SLACK_CLIENT_ID;
    const signingSecret = env.SLACK_SIGNING_SECRET;
    if (!clientId) return apiError("service_unavailable", "SLACK_CLIENT_ID is not configured");
    if (!signingSecret) return apiError("service_unavailable", "SLACK_SIGNING_SECRET is not configured");

    const state = signOAuthState({ secret: signingSecret, orgId: session.orgId });
    const redirectUri = urlFor("marketing", "/api/v1/integrations/slack/callback");

    const url = buildInstallUrl({ clientId, state, redirectUri });
    return NextResponse.redirect(url, 302);
  });
}
