import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { disableWorkspaceByOrgId } from "@/lib/integrations/slack/oauth";

/**
 * Phase 5.3 — manual Slack uninstall.
 *
 * Admin clicks "Disconnect" in /studio/settings/integrations/slack — the
 * settings UI POSTs here. We disable (soft-delete) the workspace so notify()
 * stops fanning to it. The bot still appears installed inside Slack until
 * the workspace owner removes it from there; we don't have a clean way to
 * uninstall from our side without admin scopes the user didn't grant.
 */

export async function POST() {
  return withAuth(async (session) => {
    const denial = assertCapability(session, "*");
    if (denial) return denial;

    const ok = await disableWorkspaceByOrgId(session.orgId);
    if (!ok) return apiError("internal", "Failed to disable workspace");
    return apiOk({ disabled: true });
  });
}
