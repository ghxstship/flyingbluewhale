import { NextResponse } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { disableWorkspaceByTeamId } from "@/lib/integrations/slack/oauth";
import { verifySlackSignature } from "@/lib/integrations/slack/sign";
import { log } from "@/lib/log";
import type { SlackEventEnvelope } from "@/lib/integrations/slack/types";

/**
 * Phase 5.3 — Slack Events API endpoint.
 *
 * Slack POSTs every event-subscription event here. We:
 *   1. Verify the request signature (HMAC-SHA256 of `v0:<ts>:<body>`).
 *   2. Handle `url_verification` by echoing back the challenge.
 *   3. Handle `app_uninstalled` by disabling the workspace row.
 *   4. Ignore everything else with a 200 OK so Slack doesn't retry.
 *
 * Endpoint is intentionally lean — we keep it on the apex/marketing host
 * because Slack only allows ONE Request URL per app.
 */

export async function POST(req: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return apiError("service_unavailable", "SLACK_SIGNING_SECRET is not configured");

  const sig = req.headers.get("x-slack-signature");
  const ts = req.headers.get("x-slack-request-timestamp");
  const rawBody = await req.text();

  const ok = verifySlackSignature({
    signingSecret,
    signature: sig,
    timestamp: ts,
    rawBody,
  });
  if (!ok) return apiError("unauthorized", "Invalid Slack signature");

  let event: SlackEventEnvelope;
  try {
    event = JSON.parse(rawBody) as SlackEventEnvelope;
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }

  // 1. URL verification challenge (one-time during app config). Slack
  // expects the raw `{challenge}` body, NOT our `{ok, data}` envelope, so
  // we serialize directly via NextResponse rather than apiOk.
  if (event.type === "url_verification" && typeof event.challenge === "string") {
    return new NextResponse(JSON.stringify({ challenge: event.challenge }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 2. App uninstall — disable the workspace.
  if (event.type === "event_callback" && event.event?.type === "app_uninstalled") {
    if (event.team_id) {
      const disabled = await disableWorkspaceByTeamId(event.team_id);
      log.info("slack.events.app_uninstalled", {
        team_id: event.team_id,
        disabled,
      });
    }
    return apiOk({ received: true });
  }

  // 3. Everything else — ack so Slack doesn't retry.
  return apiOk({ received: true, type: event.type });
}
