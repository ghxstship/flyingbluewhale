import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { Persona, PlatformRole } from "@/lib/supabase/types";
import type { MemberInput, RoleGrantInput, UserGrantInput } from "@/lib/rbac/holders";

/**
 * One fetch for the whole capability graph of an org — shared by the
 * capabilities page (matrix + who-holds-what) and the enforcement-flip
 * preview, so the two surfaces can never disagree about the inputs.
 *
 * Reads MIRROR `public.effective_capabilities()` deliberately: crew role
 * membership is crew_members.user_id × crew_role_id with no further filters
 * (the SQL applies none), and user grants filter only on revoked_at — the
 * time window is evaluated in `holders.ts` against one shared `now`.
 */

export type CrewRoleRow = { id: string; name: string; slug: string };

export type RoleGrantRecord = RoleGrantInput & { id: string; createdAt: string };

export type UserGrantRecord = UserGrantInput & {
  id: string;
  reason: string | null;
  createdAt: string;
};

export type CapabilityGraph = {
  members: MemberInput[];
  emailByUser: Map<string, string>;
  crewRoleIdsByUser: Map<string, string[]>;
  roleNameById: Map<string, string>;
  /** crew_role_id → total crew_members rows (linked to a login or not). */
  crewCountByRole: Map<string, number>;
  roles: CrewRoleRow[];
  roleGrants: RoleGrantRecord[];
  userGrants: UserGrantRecord[];
  enforced: boolean;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function fetchCapabilityGraph(supabase: Supabase, orgId: string): Promise<CapabilityGraph> {
  const [membersRes, crewRes, rolesRes, roleGrantsRes, userGrantsRes, orgRes] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, role, persona, users(email)")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .limit(500),
    supabase
      .from("crew_members")
      .select("user_id, crew_role_id")
      .eq("org_id", orgId)
      .not("crew_role_id", "is", null)
      .limit(2000),
    supabase.from("crew_roles").select("id, name, slug").eq("org_id", orgId).is("deleted_at", null).order("name"),
    supabase
      .from("role_capability_grants")
      .select("id, crew_role_id, capability, shift_derivable, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_capability_grants")
      .select("id, user_id, capability, valid_from, valid_until, reason, revoked_at, created_at")
      .eq("org_id", orgId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("orgs").select("capability_grants_enforced").eq("id", orgId).maybeSingle(),
  ]);

  const members: MemberInput[] = [];
  const emailByUser = new Map<string, string>();
  for (const m of (membersRes.data ?? []) as {
    user_id: string;
    role: PlatformRole;
    persona: Persona | null;
    users: { email?: string | null } | null;
  }[]) {
    const email = m.users?.email ?? m.user_id;
    emailByUser.set(m.user_id, email);
    members.push({ userId: m.user_id, email, role: m.role, persona: m.persona });
  }
  members.sort((a, b) => a.email.localeCompare(b.email));

  const crewRoleIdsByUser = new Map<string, string[]>();
  const crewCountByRole = new Map<string, number>();
  for (const c of (crewRes.data ?? []) as { user_id: string | null; crew_role_id: string | null }[]) {
    if (!c.crew_role_id) continue;
    crewCountByRole.set(c.crew_role_id, (crewCountByRole.get(c.crew_role_id) ?? 0) + 1);
    // Only crew rows LINKED to a login can carry role-derived grants — this
    // is exactly effective_capabilities' `cm.user_id = auth.uid()` join.
    if (!c.user_id) continue;
    const list = crewRoleIdsByUser.get(c.user_id) ?? [];
    if (!list.includes(c.crew_role_id)) list.push(c.crew_role_id);
    crewRoleIdsByUser.set(c.user_id, list);
  }

  const roles = ((rolesRes.data ?? []) as CrewRoleRow[]).map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));

  const roleGrants: RoleGrantRecord[] = (
    (roleGrantsRes.data ?? []) as {
      id: string;
      crew_role_id: string;
      capability: string;
      shift_derivable: boolean;
      created_at: string;
    }[]
  ).map((g) => ({
    id: g.id,
    crewRoleId: g.crew_role_id,
    capability: g.capability,
    shiftDerivable: g.shift_derivable,
    createdAt: g.created_at,
  }));

  const userGrants: UserGrantRecord[] = (
    (userGrantsRes.data ?? []) as {
      id: string;
      user_id: string;
      capability: string;
      valid_from: string | null;
      valid_until: string | null;
      reason: string | null;
      revoked_at: string | null;
      created_at: string;
    }[]
  ).map((g) => ({
    id: g.id,
    userId: g.user_id,
    capability: g.capability,
    validFrom: g.valid_from,
    validUntil: g.valid_until,
    revokedAt: g.revoked_at,
    reason: g.reason,
    createdAt: g.created_at,
  }));

  const enforced = Boolean(
    (orgRes.data as { capability_grants_enforced?: boolean | null } | null)?.capability_grants_enforced,
  );

  return {
    members,
    emailByUser,
    crewRoleIdsByUser,
    roleNameById,
    crewCountByRole,
    roles,
    roleGrants,
    userGrants,
    enforced,
  };
}
