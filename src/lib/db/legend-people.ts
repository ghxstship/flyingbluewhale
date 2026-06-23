import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type OrgMember = { id: string; name: string; avatar_url: string | null; role: string | null };

/**
 * Org members for the LEG3ND people surfaces (community directory, recert
 * matrix rows, leaderboard). Two robust queries — memberships for the
 * roster, users for display — rather than a FK-aliased join.
 */
export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: memberships } = await db
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", orgId)
    .is("deleted_at", null);
  const rows = (memberships ?? []) as Array<{ user_id: string | null; role: string | null }>;
  const ids = rows.map((r) => r.user_id).filter((id): id is string => !!id);
  if (ids.length === 0) return [];

  const { data: users } = await db.from("users").select("id, name, avatar_url, email").in("id", ids);
  const userMap = new Map(
    ((users ?? []) as Array<{ id: string; name: string | null; avatar_url: string | null; email: string | null }>).map((u) => [u.id, u]),
  );
  const roleMap = new Map(rows.filter((r) => r.user_id).map((r) => [r.user_id as string, r.role]));

  return ids.map((id) => {
    const u = userMap.get(id);
    return {
      id,
      name: u?.name || u?.email || "Member",
      avatar_url: u?.avatar_url ?? null,
      role: roleMap.get(id) ?? null,
    };
  });
}

/**
 * Sum the shared points ledger per user for an org (leaderboard + community
 * contribution points). Combines LEG3ND + COMPVSS sources — the model is
 * shared. Returns a Map keyed by user id.
 */
export async function pointsByUser(orgId: string): Promise<Map<string, number>> {
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db.from("points_ledger").select("user_id, points").eq("org_id", orgId);
  const out = new Map<string, number>();
  for (const r of (data ?? []) as Array<{ user_id: string; points: number }>) {
    out.set(r.user_id, (out.get(r.user_id) ?? 0) + (r.points ?? 0));
  }
  return out;
}
