import "server-only";

import { httpFetch } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import type {
  SlackChannelMappingRow,
  SlackLookupByEmailResponse,
  SlackPostMessageResponse,
  SlackSendResult,
  SlackUserLinkRow,
  SlackWorkspaceRow,
} from "./types";

/**
 * Slack delivery surface for notify().
 *
 * - `sendSlackDM(userId, …)` — looks up the user's Slack id, posts to that DM.
 * - `sendSlackChannel(channelId, …)` — posts to a channel by id.
 * - `getMatchingChannelMappings(orgId, eventType)` — returns enabled mappings
 *   for an org whose event_pattern matches the eventType.
 *
 * All functions are designed to be fire-and-forget callers — they NEVER
 * throw upstream into the originating user request. Failures are logged.
 */

const SLACK_API_BASE = "https://slack.com/api";

/** Build a minimal Block Kit payload for a notify() event. */
function buildBlocks(args: { title: string; body?: string | null; href?: string | null }) {
  type Block =
    | { type: "section"; text: { type: "mrkdwn"; text: string } }
    | {
        type: "actions";
        elements: Array<{
          type: "button";
          text: { type: "plain_text"; text: string };
          url: string;
        }>;
      };

  const blocks: Block[] = [];
  const titleLine = `*${escapeMrkdwn(args.title)}*`;
  const bodyLine = args.body ? `\n${escapeMrkdwn(args.body)}` : "";
  blocks.push({ type: "section", text: { type: "mrkdwn", text: `${titleLine}${bodyLine}` } });

  if (args.href) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open" },
          url: args.href,
        },
      ],
    });
  }

  return blocks;
}

/** Slack mrkdwn has a small set of escapable chars (`&`, `<`, `>`).  */
function escapeMrkdwn(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function postSlack<T>(endpoint: string, token: string, body: Record<string, unknown>): Promise<T> {
  const res = await httpFetch(`${SLACK_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
    timeoutMs: 10000,
  });
  return (await res.json()) as T;
}

/** Find an active workspace row by org id. */
async function workspaceForOrg(orgId: string): Promise<SlackWorkspaceRow | null> {
  try {
    const svc = createServiceClient();
    const { data } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (
              col: string,
              val: boolean,
            ) => {
              maybeSingle: () => Promise<{ data: SlackWorkspaceRow | null }>;
            };
          };
        };
      }
    )("slack_workspaces")
      .select("*")
      .eq("org_id", orgId)
      .eq("enabled", true)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

async function workspaceById(workspaceId: string): Promise<SlackWorkspaceRow | null> {
  try {
    const svc = createServiceClient();
    const { data } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            maybeSingle: () => Promise<{ data: SlackWorkspaceRow | null }>;
          };
        };
      }
    )("slack_workspaces")
      .select("*")
      .eq("id", workspaceId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/** Look up the slack_user_links row for a ATLVS user. */
async function userLinkFor(userId: string): Promise<SlackUserLinkRow | null> {
  try {
    const svc = createServiceClient();
    const { data } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            maybeSingle: () => Promise<{ data: SlackUserLinkRow | null }>;
          };
        };
      }
    )("slack_user_links")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Send a DM to the ATLVS user (by their `users.id`).
 *
 * Resolution chain:
 *   1. slack_user_links row → workspace_id + slack_user_id
 *   2. slack_workspaces row → bot_token
 *   3. POST chat.postMessage with channel=<slack_user_id>
 */
export async function sendSlackDM(opts: {
  userId: string;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<SlackSendResult> {
  try {
    const link = await userLinkFor(opts.userId);
    if (!link) return { ok: false, error: "no_link" };
    const workspace = await workspaceById(link.workspace_id);
    if (!workspace || !workspace.enabled) return { ok: false, error: "no_workspace" };

    const result = await postSlack<SlackPostMessageResponse>("chat.postMessage", workspace.bot_token, {
      channel: link.slack_user_id,
      text: opts.title,
      blocks: buildBlocks({ title: opts.title, body: opts.body, href: opts.href }),
      unfurl_links: false,
      unfurl_media: false,
    });

    if (!result.ok) {
      log.warn("slack.dm.api_error", { user_id: opts.userId, err: result.error ?? "unknown" });
      return { ok: false, error: result.error ?? "api_error" };
    }
    return { ok: true };
  } catch (err) {
    log.warn("slack.dm.exception", { user_id: opts.userId, err: (err as Error).message });
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Post to a Slack channel for a given org. The org id is needed to look
 * up the bot token; the channel id alone is not sufficient because two
 * orgs can share the same channel name in different workspaces.
 */
export async function sendSlackChannel(opts: {
  orgId: string;
  channelId: string;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<SlackSendResult> {
  try {
    const workspace = await workspaceForOrg(opts.orgId);
    if (!workspace || !workspace.enabled) return { ok: false, error: "no_workspace" };

    const result = await postSlack<SlackPostMessageResponse>("chat.postMessage", workspace.bot_token, {
      channel: opts.channelId,
      text: opts.title,
      blocks: buildBlocks({ title: opts.title, body: opts.body, href: opts.href }),
      unfurl_links: false,
      unfurl_media: false,
    });
    if (!result.ok) {
      log.warn("slack.channel.api_error", {
        channel: opts.channelId,
        err: result.error ?? "unknown",
      });
      return { ok: false, error: result.error ?? "api_error" };
    }
    return { ok: true };
  } catch (err) {
    log.warn("slack.channel.exception", { channel: opts.channelId, err: (err as Error).message });
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Match a notify() eventType against the org's enabled channel mappings.
 * Glob semantics: `foo.bar` is exact, `foo.*` matches anything starting
 * with `foo.`, plain `*` matches everything. Empty pattern never matches.
 */
export function eventMatches(pattern: string, eventType: string): boolean {
  if (!pattern) return false;
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -1); // keep the trailing dot
    return eventType.startsWith(prefix);
  }
  return pattern === eventType;
}

/** Returns the enabled channel mappings whose pattern matches `eventType`. */
export async function getMatchingChannelMappings(orgId: string, eventType: string): Promise<SlackChannelMappingRow[]> {
  try {
    const workspace = await workspaceForOrg(orgId);
    if (!workspace) return [];

    const svc = createServiceClient();
    const { data } = await (
      svc.from as unknown as (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (col: string, val: boolean) => Promise<{ data: SlackChannelMappingRow[] | null }>;
          };
        };
      }
    )("slack_channel_mappings")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("enabled", true);

    const rows = (data ?? []) as SlackChannelMappingRow[];
    return rows.filter((r) => eventMatches(r.event_pattern, eventType));
  } catch {
    return [];
  }
}

/**
 * Slack `users.lookupByEmail` — used by "Auto-detect" to map a ATLVS
 * user.email → Slack user id without a full user-OAuth flow.
 */
export async function lookupSlackUserByEmail(opts: {
  workspaceId: string;
  email: string;
}): Promise<{ ok: boolean; slackUserId?: string; error?: string }> {
  try {
    const workspace = await workspaceById(opts.workspaceId);
    if (!workspace || !workspace.enabled) return { ok: false, error: "no_workspace" };

    const params = new URLSearchParams({ email: opts.email });
    const res = await httpFetch(`${SLACK_API_BASE}/users.lookupByEmail?${params.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${workspace.bot_token}`,
      },
      timeoutMs: 10000,
    });
    const json = (await res.json()) as SlackLookupByEmailResponse;
    if (!json.ok || !json.user) {
      return { ok: false, error: json.error ?? "users_not_found" };
    }
    return { ok: true, slackUserId: json.user.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
