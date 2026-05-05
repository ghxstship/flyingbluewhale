import "server-only";

/**
 * Slack integration shapes — Phase 5.3.
 *
 * Mirrors the rows in `slack_workspaces`, `slack_channel_mappings`, and
 * `slack_user_links`. Kept narrow on purpose; we don't reflect every
 * Slack API field, only the bits notify() needs to deliver.
 */

export type SlackWorkspaceRow = {
  id: string;
  org_id: string;
  team_id: string;
  team_name: string;
  /** xoxb- bot token. Treated as a secret — never returned via the JSON API. */
  bot_token: string;
  bot_user_id: string;
  icon_url: string | null;
  installed_by: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type SlackChannelMappingRow = {
  id: string;
  workspace_id: string;
  channel_id: string;
  channel_name: string;
  event_pattern: string;
  project_id: string | null;
  enabled: boolean;
  created_at: string;
};

export type SlackUserLinkRow = {
  user_id: string;
  workspace_id: string;
  slack_user_id: string;
  linked_at: string;
};

/** Slack OAuth v2 oauth.v2.access response (subset we care about). */
export type SlackOAuthAccessResponse = {
  ok: boolean;
  error?: string;
  app_id?: string;
  authed_user?: { id: string };
  scope?: string;
  token_type?: string;
  access_token?: string;
  bot_user_id?: string;
  team?: { id: string; name: string };
  enterprise?: { id: string; name: string } | null;
  /** Workspace icon URLs. Free Slack workspaces sometimes omit. */
  team_icon?: { image_88?: string; image_132?: string };
};

/** Slack chat.postMessage response (subset). */
export type SlackPostMessageResponse = {
  ok: boolean;
  error?: string;
  channel?: string;
  ts?: string;
  message?: { text?: string };
};

/** Slack users.lookupByEmail response (subset). */
export type SlackLookupByEmailResponse = {
  ok: boolean;
  error?: string;
  user?: { id: string; name: string; profile?: { email?: string } };
};

/** Inbound Slack event payload. We only handle a couple — `url_verification`
 * and `app_uninstalled` — but keep the shape generous so the verifier can
 * dispatch on the type field without re-parsing. */
export type SlackEventEnvelope = {
  type: string;
  challenge?: string;
  team_id?: string;
  api_app_id?: string;
  event?: { type?: string };
  /** Bot/auth token for the workspace (only present on certain events). */
  token?: string;
};

/** Result type from sendSlackDM / sendSlackChannel. Always resolved — these
 * functions never throw upstream into the originating user request. */
export type SlackSendResult = { ok: boolean; error?: string };
