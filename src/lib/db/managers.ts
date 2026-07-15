import "server-only";

import { createClient } from "@/lib/supabase/server";
import { MANAGER_BAND_ROLES } from "@/lib/auth";

/**
 * Return the user IDs of an org's manager-band members (owner / admin /
 * manager) — the push-notification fan-out target for field-filed reports,
 * time-off requests, and other escalations from the COMPVSS shell.
 *
 * Excludes the optional `exclude` user (typically the filer themselves) so a
 * manager who files their own report doesn't ping themselves.
 */
export async function managerUserIds(orgId: string, exclude?: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", orgId)
    .in("role", [...MANAGER_BAND_ROLES])
    .is("deleted_at", null);
  const rows = (data ?? []) as Array<{ user_id: string | null; role: string | null }>;
  return rows
    .map((r) => r.user_id)
    .filter((id): id is string => !!id && id !== exclude);
}

/**
 * Every active member of an org — the fan-out target for broadcasts that
 * must reach the whole workforce rather than the manager band.
 *
 * Used by the crisis / major-incident declaration path: those wrote their
 * row and told nobody, so the console could declare an emergency and the
 * field would learn about it by opening the app and looking.
 *
 * Soft-deleted memberships are excluded — an offboarded worker is not on
 * site and does not get the evacuation ping.
 */
export async function orgMemberUserIds(orgId: string, exclude?: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", orgId)
    .is("deleted_at", null);
  const rows = (data ?? []) as Array<{ user_id: string | null }>;
  return rows.map((r) => r.user_id).filter((id): id is string => !!id && id !== exclude);
}
