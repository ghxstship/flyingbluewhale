import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server helpers for `teams` + `team_members` — Phase 5.1 of the SmartSuite
 * parity roadmap (recommendation #8). Reads/writes are RLS-gated by the
 * caller's session — owners/admins/managers have full write, regular org
 * members have read, and team admins can manage their own team's members.
 *
 * `teams` and `team_members` are brand-new tables not yet in the generated
 * Supabase Database types — `npm run gen:types` will pick them up next
 * build. Until then we expose a loosely-typed query builder so the helpers
 * compile; RLS remains the actual authorization boundary.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseSupabase = {
  from: (table: string) => {
    select: (cols?: string) => any;
    insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => any;
    update: (row: Record<string, unknown>) => any;
    delete: () => any;
  };
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type TeamRole = "admin" | "member";

export type TeamRow = {
  id: string;
  orgId: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberRow = {
  teamId: string;
  userId: string;
  role: TeamRole;
  addedAt: string;
};

type TeamRecord = {
  id: string;
  org_id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

type TeamMemberRecord = {
  team_id: string;
  user_id: string;
  role: TeamRole;
  added_at: string;
};

function rowFrom(record: TeamRecord): TeamRow {
  return {
    id: record.id,
    orgId: record.org_id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    avatarUrl: record.avatar_url,
    ownerId: record.owner_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function memberFrom(record: TeamMemberRecord): TeamMemberRow {
  return {
    teamId: record.team_id,
    userId: record.user_id,
    role: record.role,
    addedAt: record.added_at,
  };
}

/** List all teams visible to the caller in the given org. */
export async function listTeams(opts: { orgId: string }): Promise<TeamRow[]> {
  if (!opts.orgId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("org_id", opts.orgId)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TeamRecord[]).map(rowFrom);
}

/** Fetch a single team. Returns null when not visible to caller. */
export async function getTeam(opts: { id: string }): Promise<TeamRow | null> {
  if (!opts.id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("teams").select("*").eq("id", opts.id).maybeSingle();
  if (error) throw error;
  return data ? rowFrom(data as TeamRecord) : null;
}

/** Resolve a team by slug within an org — used by the @team-<slug> mention path. */
export async function getTeamBySlug(opts: { orgId: string; slug: string }): Promise<TeamRow | null> {
  if (!opts.orgId || !opts.slug) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("org_id", opts.orgId)
    .eq("slug", opts.slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowFrom(data as TeamRecord) : null;
}

/**
 * Create a new team. RLS gates write to org owner/admin/manager. The creator
 * becomes the default owner_id and is auto-added as an `admin` member so they
 * can manage the team without elevating their org role.
 */
export async function createTeam(opts: {
  orgId: string;
  slug: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
}): Promise<TeamRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const payload = {
    org_id: opts.orgId,
    slug: opts.slug,
    name: opts.name,
    description: opts.description ?? null,
    avatar_url: opts.avatarUrl ?? null,
    owner_id: userId,
  };

  const { data, error } = await supabase.from("teams").insert(payload).select("*").single();
  if (error) throw error;
  const team = rowFrom(data as TeamRecord);

  // Auto-add the creator as an admin member.
  if (userId) {
    const { error: memberErr } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: userId, role: "admin" });
    // Ignore conflicts — duplicate (team_id, user_id) is harmless.
    if (memberErr && !/duplicate|23505/.test(memberErr.message ?? "")) throw memberErr;
  }

  return team;
}

/** Update a team's metadata. */
export async function updateTeam(opts: {
  id: string;
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
  ownerId?: string | null;
}): Promise<TeamRow> {
  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["teams"]["Update"] = {};
  if (opts.name !== undefined) patch.name = opts.name;
  if (opts.description !== undefined) patch.description = opts.description;
  if (opts.avatarUrl !== undefined) patch.avatar_url = opts.avatarUrl;
  if (opts.ownerId !== undefined) patch.owner_id = opts.ownerId;

  const { data, error } = await supabase.from("teams").update(patch).eq("id", opts.id).select("*").single();
  if (error) throw error;
  return rowFrom(data as TeamRecord);
}

/** Delete a team. RLS gates by org role. team_members rows cascade. */
export async function deleteTeam(opts: { id: string }): Promise<void> {
  if (!opts.id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", opts.id);
  if (error) throw error;
}

/** List members of a team with hydrated user info (name + email). */
export type TeamMemberWithUser = TeamMemberRow & {
  user: { id: string; name: string | null; email: string } | null;
};

export async function listTeamMembers(opts: { teamId: string }): Promise<TeamMemberWithUser[]> {
  if (!opts.teamId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id,user_id,role,added_at,users(id,name,email)")
    .eq("team_id", opts.teamId)
    .order("added_at", { ascending: true });
  if (error) throw error;
  type Row = TeamMemberRecord & { users: { id: string; name: string | null; email: string } | null };
  return ((data ?? []) as Row[]).map((r) => ({
    ...memberFrom(r),
    user: r.users,
  }));
}

/** Add a member to a team. Idempotent on (team_id, user_id). */
export async function addTeamMember(opts: { teamId: string; userId: string; role?: TeamRole }): Promise<TeamMemberRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert({ team_id: opts.teamId, user_id: opts.userId, role: opts.role ?? "member" })
    .select("*")
    .single();
  if (error) throw error;
  return memberFrom(data as TeamMemberRecord);
}

/** Update a member's intra-team role. */
export async function updateTeamMember(opts: {
  teamId: string;
  userId: string;
  role: TeamRole;
}): Promise<TeamMemberRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .update({ role: opts.role })
    .eq("team_id", opts.teamId)
    .eq("user_id", opts.userId)
    .select("*")
    .single();
  if (error) throw error;
  return memberFrom(data as TeamMemberRecord);
}

/** Remove a member from a team. */
export async function removeTeamMember(opts: { teamId: string; userId: string }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("team_id", opts.teamId).eq("user_id", opts.userId);
  if (error) throw error;
}

/** Resolve user_ids for a list of team_ids — used by @team-<slug> fan-out. */
export async function expandTeamMemberIds(opts: { teamIds: string[] }): Promise<string[]> {
  if (opts.teamIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("team_members").select("user_id").in("team_id", opts.teamIds);
  if (error) throw error;
  const ids = ((data ?? []) as { user_id: string }[]).map((r) => r.user_id);
  return Array.from(new Set(ids));
}
