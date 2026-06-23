import "server-only";

import type { LooseSupabase } from "@/lib/supabase/loose";
import type { OwnerOption } from "./GoalForm";

/**
 * Load the org's members as goal-owner options (id + display label),
 * sorted by display name. Shared by the new + edit goal pages.
 */
export async function listOwnerOptions(db: LooseSupabase, orgId: string): Promise<OwnerOption[]> {
  const { data } = await db
    .from("memberships")
    .select("user_id, users:users!inner(id, email, name)")
    .eq("org_id", orgId)
    .is("deleted_at", null);

  const members = (data ?? []) as unknown as Array<{
    users: { id: string; email: string; name: string | null } | null;
  }>;

  return members
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .map((u) => ({ id: u.id, label: u.name ?? u.email }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
