import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { exchangeOAuthCode, upsertWorkspace } from "@/lib/integrations/slack/oauth";
import { verifyOAuthState } from "@/lib/integrations/slack/sign";
import { log } from "@/lib/log";
import { urlFor } from "@/lib/urls";

/**
 * Phase 5.3 — Slack OAuth v2 callback.
 *
 * Slack redirects here with `?code=...&state=...` after the user approves.
 * We verify the HMAC state, exchange the code for tokens, and upsert the
 * workspace row. Then bounce back to the settings page with a flash.
 */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const settings = urlFor("platform", "/settings/integrations/slack");

  if (error) {
    return NextResponse.redirect(`${settings}?error=${encodeURIComponent(error)}`);
  }
  if (!code || !state) {
    return apiError("bad_request", "Missing OAuth code or state");
  }

  const signingSecret = env.SLACK_SIGNING_SECRET;
  const clientId = env.SLACK_CLIENT_ID;
  const clientSecret = env.SLACK_CLIENT_SECRET;
  if (!signingSecret || !clientId || !clientSecret) {
    return apiError("service_unavailable", "Slack environment variables not configured");
  }

  const verified = verifyOAuthState({ secret: signingSecret, state });
  if (!verified) {
    return apiError("unauthorized", "Invalid or expired OAuth state");
  }

  // The session may have rotated since install kicked off. We trust the
  // org id from the signed state and only use the live session for
  // `installed_by` audit (best-effort).
  const session = await getSession();

  const oauth = await exchangeOAuthCode({
    clientId,
    clientSecret,
    code,
    redirectUri: urlFor("marketing", "/api/v1/integrations/slack/callback"),
  });

  if (!oauth.ok) {
    log.warn("slack.oauth.callback_failed", { err: oauth.error ?? "unknown" });
    return NextResponse.redirect(`${settings}?error=${encodeURIComponent(oauth.error ?? "oauth_failed")}`);
  }

  const installedBy = session?.userId && session.orgId === verified.orgId ? session.userId : null;
  const row = await upsertWorkspace({
    orgId: verified.orgId,
    installedBy,
    oauth,
  });
  if (!row) {
    return NextResponse.redirect(`${settings}?error=upsert_failed`);
  }

  return NextResponse.redirect(`${settings}?installed=1`);
}
