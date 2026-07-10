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
