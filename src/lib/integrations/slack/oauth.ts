import "server-only";

import { httpFetch } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import type { SlackOAuthAccessResponse, SlackWorkspaceRow } from "./types";

/** Scopes we request — chat write (DMs + channels), channels.read for the
 * channel picker, users.read + users.read.email for "Auto-detect" linking. */
export const SLACK_BOT_SCOPES = [
  "chat:write",
  "chat:write.public",
  "channels:read",
  "groups:read",
  "users:read",
  "users:read.email",
  "im:write",
];

/**
 * Build the Slack OAuth v2 authorization URL.
 * Caller is responsible for signing the state value.
 */
export function buildInstallUrl(opts: {
  clientId: string;
  state: string;
  redirectUri: string;
  scopes?: readonly string[];
}): string {
  const params = new URLSearchParams();
  params.set("client_id", opts.clientId);
  params.set("scope", (opts.scopes ?? SLACK_BOT_SCOPES).join(","));
  params.set("state", opts.state);
  params.set("redirect_uri", opts.redirectUri);
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange an OAuth code for tokens via Slack's `oauth.v2.access` endpoint.
 * Returns the parsed Slack response. Slack APIs return 200 with `ok: false`
 * for application-level errors; we surface that shape verbatim.
 */
export async function exchangeOAuthCode(opts: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<SlackOAuthAccessResponse> {
  const form = new URLSearchParams();
  form.set("client_id", opts.clientId);
  form.set("client_secret", opts.clientSecret);
  form.set("code", opts.code);
  form.set("redirect_uri", opts.redirectUri);

  let res: Response;
  try {
    res = await httpFetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      timeoutMs: 10000,
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  if (!res.ok) {
    return { ok: false, error: `slack_oauth_http_${res.status}` };
  }
  try {
    return (await res.json()) as SlackOAuthAccessResponse;
  } catch (err) {
    return { ok: false, error: `slack_oauth_parse_${(err as Error).message}` };
  }
}

/**
 * Persist (upsert) a Slack workspace row tied to an org. Uses the service
 * client because the OAuth callback route runs on a non-RLS-friendly
 * code path (the user is signed in but we want the upsert to happen
 * regardless of which membership row resolves first).
 */
export async function upsertWorkspace(opts: {
  orgId: string;
  installedBy: string | null;
  oauth: SlackOAuthAccessResponse;
}): Promise<SlackWorkspaceRow | null> {
  const { oauth } = opts;
  if (!oauth.ok || !oauth.access_token || !oauth.bot_user_id || !oauth.team?.id || !oauth.team?.name) {
    return null;
  }

  try {
    const svc = createServiceClient();
    const now = new Date().toISOString();
    const row = {
      org_id: opts.orgId,
      team_id: oauth.team.id,
      team_name: oauth.team.name,
      bot_token: oauth.access_token,
      bot_user_id: oauth.bot_user_id,
      icon_url: oauth.team_icon?.image_88 ?? null,
      installed_by: opts.installedBy,
      enabled: true,
      updated_at: now,
    };
    const { data, error } = await (
      svc.from as unknown as (table: string) => {
        upsert: (
          v: Record<string, unknown>,
          opt: { onConflict: string },
        ) => {
          select: () => {
            single: () => Promise<{
              data: SlackWorkspaceRow | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )("slack_workspaces")
      .upsert(row, { onConflict: "org_id" })
      .select()
      .single();

    if (error) {
      log.warn("slack.oauth.upsert_failed", { err: error.message });
      return null;
    }
    return data;
  } catch (err) {
    log.warn("slack.oauth.exception", { err: (err as Error).message });
    return null;
  }
}

/**
 * Disable (or delete) the workspace row when an `app_uninstalled` event
 * arrives (or when the admin clicks "Disconnect"). We toggle `enabled`
 * rather than delete so we keep history; the next install upserts on top.
 */
export async function disableWorkspaceByTeamId(teamId: string): Promise<boolean> {
  try {
    const svc = createServiceClient();
    const { error } = await (
      svc.from as unknown as (table: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )("slack_workspaces")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("team_id", teamId);
    if (error) {
      log.warn("slack.oauth.disable_failed", { err: error.message, team_id: teamId });
      return false;
    }
    return true;
  } catch (err) {
    log.warn("slack.oauth.disable_exception", { err: (err as Error).message });
    return false;
  }
}

/** Mark a workspace disabled by org id (used by the "Disconnect" button). */
export async function disableWorkspaceByOrgId(orgId: string): Promise<boolean> {
  try {
    const svc = createServiceClient();
    const { error } = await (
      svc.from as unknown as (table: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )("slack_workspaces")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("org_id", orgId);
    if (error) {
      log.warn("slack.oauth.disable_org_failed", { err: error.message, org_id: orgId });
      return false;
    }
    return true;
  } catch (err) {
    log.warn("slack.oauth.disable_org_exception", { err: (err as Error).message });
    return false;
  }
}
