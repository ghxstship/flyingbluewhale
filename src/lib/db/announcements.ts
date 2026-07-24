import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_BAND_ROLES } from "@/lib/auth";

/**
 * Announcement audience resolution — the ONE mapping from the
 * `announcements.audience` enum to actual members, shared by the publish
 * fan-out (new/actions.ts + [id]/actions.ts) and the feed read side
 * (/m/feed), so the set of people notified and the set of people who see
 * the row in their feed cannot drift apart again.
 *
 * Before this module the two publish actions carried forked copies of a
 * role-only filter whose `contractors` and `vendors` arms fell through to
 * null — a vendors-targeted announcement pushed to EVERY org member — and
 * the mobile feed applied no audience filter at all.
 *
 * Mapping (memberships carry both `role` and `persona`):
 *   all         → every live member
 *   admins      → role ∈ ADMIN_BAND_ROLES (owner/admin)
 *   crew        → role = member OR persona = crew
 *   contractors → persona = contractor
 *   vendors     → persona = contractor (the persona taxonomy has no separate
 *                 vendor value; `contractor` is documented as "vendor /
 *                 outside contributor")
 */

export const ANNOUNCEMENT_AUDIENCES = ["all", "crew", "contractors", "vendors", "admins"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

type MemberRow = { user_id: string; role: string | null; persona: string | null };

function matchesAudience(m: MemberRow, audience: AnnouncementAudience): boolean {
  switch (audience) {
    case "all":
      return true;
    case "admins":
      return (ADMIN_BAND_ROLES as readonly string[]).includes(m.role ?? "");
    case "crew":
      return m.role === "member" || m.persona === "crew";
    case "contractors":
    case "vendors":
      return m.persona === "contractor";
  }
}

/**
 * The audiences a given member belongs to — the read-side mirror of
 * `matchesAudience`, for filtering feed queries to what this viewer was
 * meant to see.
 */
export function audiencesForViewer(role: string | null, persona: string | null): AnnouncementAudience[] {
  const m: MemberRow = { user_id: "", role, persona };
  return ANNOUNCEMENT_AUDIENCES.filter((a) => matchesAudience(m, a));
}

/**
 * Resolve the recipient user ids for one announcement. `service` must be a
 * service-role client (reads memberships across users). Team / project
 * filters narrow the audience cohort to actual team / project members,
 * matching the original fan-out semantics.
 */
export async function resolveAnnouncementRecipients(
  service: SupabaseClient,
  opts: { orgId: string; audience: AnnouncementAudience; teamId?: string | null; projectId?: string | null },
): Promise<string[]> {
  const { data: members } = await service
    .from("memberships")
    .select("user_id, role, persona")
    .eq("org_id", opts.orgId)
    .is("deleted_at", null);
  let userIds = ((members ?? []) as MemberRow[]).filter((m) => matchesAudience(m, opts.audience)).map((m) => m.user_id);

  if (opts.teamId && userIds.length > 0) {
    const { data: teamMembers } = await service
      .from("team_members")
      .select("user_id")
      .eq("team_id", opts.teamId)
      .in("user_id", userIds);
    const teamSet = new Set(((teamMembers ?? []) as Array<{ user_id: string }>).map((r) => r.user_id));
    userIds = userIds.filter((id) => teamSet.has(id));
  }
  if (opts.projectId && userIds.length > 0) {
    const { data: projectMembers } = await service
      .from("project_members")
      .select("user_id")
      .eq("project_id", opts.projectId)
      .in("user_id", userIds);
    const projectSet = new Set(((projectMembers ?? []) as Array<{ user_id: string }>).map((r) => r.user_id));
    userIds = userIds.filter((id) => projectSet.has(id));
  }
  return userIds;
}
