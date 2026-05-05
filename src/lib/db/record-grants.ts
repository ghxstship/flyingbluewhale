import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Server helpers for `record_grants` — Phase 5.1 of the SmartSuite parity
 * roadmap (recommendation #9). Records six SmartSuite-style record-level
 * roles, polymorphic across (resource_table, resource_id), per principal
 * (user OR team).
 *
 * RLS gates write to org owner/admin/manager. Read is org-wide so anyone
 * with a grant (and any other org member) can list who has access.
 *
 * `record_grants` is brand-new and not yet in the generated Supabase
 * Database types — `npm run gen:types` will pick it up next build.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseSupabase = {
  from: (table: string) => {
    select: (cols?: string) => any;
    insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => any;
    update: (row: Record<string, unknown>) => any;
    delete: () => any;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const RECORD_ROLES = ["viewer", "commenter", "assignee", "contributor", "editor", "full"] as const;

export type RecordRole = (typeof RECORD_ROLES)[number];

/**
 * Numeric priority for a record_role — mirrors Postgres enum declaration
 * order. Higher = more privileged. `max(role)` semantics in SQL match
 * `Math.max` over these numbers.
 */
const ROLE_PRIORITY: Record<RecordRole, number> = {
  viewer: 0,
  commenter: 1,
  assignee: 2,
  contributor: 3,
  editor: 4,
  full: 5,
};

/** Compare record roles. Returns negative, 0, or positive. */
export function compareRecordRoles(a: RecordRole, b: RecordRole): number {
  return ROLE_PRIORITY[a] - ROLE_PRIORITY[b];
}

/** Highest-priority role in a list. Returns null when list is empty. */
export function maxRecordRole(roles: RecordRole[]): RecordRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((acc, r) => (compareRecordRoles(r, acc) > 0 ? r : acc), roles[0]);
}

/**
 * Op semantics for can_record — kept in sync with the SQL helper. Pure
 * function so the same logic is unit-testable in JS without hitting the DB.
 */
export type RecordOp = "read" | "comment" | "edit" | "edit_others" | "delete" | "admin";

const OP_MIN_ROLE: Record<RecordOp, RecordRole> = {
  read: "viewer",
  comment: "commenter",
  edit: "contributor",
  edit_others: "editor",
  delete: "editor",
  admin: "full",
};

/**
 * Pure-JS port of `can_record(table, id, op)`. `role` is the highest grant
 * the caller has on the record (NULL → no grant → false for every op except
 * org-admin bypass, which is the caller's responsibility).
 *
 * NOTE: `admin` op requires exactly `full` (not >= full); since `full` is the
 * top of the ladder, `>= full` and `== full` collapse to the same check.
 */
export function canRecord(role: RecordRole | null, op: RecordOp): boolean {
  if (role === null) return false;
  return compareRecordRoles(role, OP_MIN_ROLE[op]) >= 0;
}

export type RecordGrantRow = {
  id: string;
  orgId: string;
  resourceTable: string;
  resourceId: string;
  userId: string | null;
  teamId: string | null;
  role: RecordRole;
  expiresAt: string | null;
  grantedBy: string | null;
  grantedAt: string;
};

type GrantRecord = {
  id: string;
  org_id: string;
  resource_table: string;
  resource_id: string;
  user_id: string | null;
  team_id: string | null;
  role: RecordRole;
  expires_at: string | null;
  granted_by: string | null;
  granted_at: string;
};

function rowFrom(record: GrantRecord): RecordGrantRow {
  return {
    id: record.id,
    orgId: record.org_id,
    resourceTable: record.resource_table,
    resourceId: record.resource_id,
    userId: record.user_id,
    teamId: record.team_id,
    role: record.role,
    expiresAt: record.expires_at,
    grantedBy: record.granted_by,
    grantedAt: record.granted_at,
  };
}

/** List grants on a specific record. Hydrates principal name on the caller side. */
export async function listRecordGrants(opts: { resourceTable: string; resourceId: string }): Promise<RecordGrantRow[]> {
  if (!opts.resourceTable || !opts.resourceId) return [];
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("record_grants")
    .select("*")
    .eq("resource_table", opts.resourceTable)
    .eq("resource_id", opts.resourceId)
    .order("granted_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as GrantRecord[]).map(rowFrom);
}

/**
 * Grant a record-level role to a user OR team. Pass exactly one of
 * `userId` / `teamId`. Idempotent on (table, id, principal, role).
 */
export async function grantRecord(opts: {
  orgId: string;
  resourceTable: string;
  resourceId: string;
  userId?: string | null;
  teamId?: string | null;
  role: RecordRole;
  expiresAt?: string | null;
  grantedBy?: string | null;
}): Promise<RecordGrantRow> {
  const hasUser = !!opts.userId;
  const hasTeam = !!opts.teamId;
  if (hasUser === hasTeam) {
    throw new Error("grantRecord: pass exactly one of userId or teamId.");
  }

  const payload = {
    org_id: opts.orgId,
    resource_table: opts.resourceTable,
    resource_id: opts.resourceId,
    user_id: opts.userId ?? null,
    team_id: opts.teamId ?? null,
    role: opts.role,
    expires_at: opts.expiresAt ?? null,
    granted_by: opts.grantedBy ?? null,
  };

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase.from("record_grants").insert(payload).select("*").single();
  if (error) throw error;
  return rowFrom(data as GrantRecord);
}

/** Revoke a single grant by id. */
export async function revokeRecord(opts: { id: string }): Promise<void> {
  if (!opts.id) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("record_grants").delete().eq("id", opts.id);
  if (error) throw error;
}

/**
 * Resolve the highest-priority record_role the given user has on the given
 * record. Considers direct user grants AND grants on teams the user belongs
 * to. Excludes expired grants. Mirrors the SQL `record_role_for(table, id)`
 * helper but takes an explicit userId so it's callable from server actions
 * outside the auth.uid() context.
 */
export async function getRecordRole(opts: {
  resourceTable: string;
  resourceId: string;
  userId: string;
}): Promise<RecordRole | null> {
  if (!opts.resourceTable || !opts.resourceId || !opts.userId) return null;

  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Pull the user's team_ids first so we can OR them into the grant query.
  const { data: tmData, error: tmErr } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", opts.userId);
  if (tmErr) throw tmErr;
  const teamIds = ((tmData ?? []) as { team_id: string }[]).map((r) => r.team_id);

  const nowIso = new Date().toISOString();

  // Direct user grants.
  const { data: userGrants, error: ug } = await supabase
    .from("record_grants")
    .select("role,expires_at")
    .eq("resource_table", opts.resourceTable)
    .eq("resource_id", opts.resourceId)
    .eq("user_id", opts.userId);
  if (ug) throw ug;

  // Team grants the user belongs to.
  let teamGrants: { role: RecordRole; expires_at: string | null }[] = [];
  if (teamIds.length > 0) {
    const { data, error } = await supabase
      .from("record_grants")
      .select("role,expires_at")
      .eq("resource_table", opts.resourceTable)
      .eq("resource_id", opts.resourceId)
      .in("team_id", teamIds);
    if (error) throw error;
    teamGrants = (data ?? []) as { role: RecordRole; expires_at: string | null }[];
  }

  const all = [...((userGrants ?? []) as { role: RecordRole; expires_at: string | null }[]), ...teamGrants];
  const valid = all.filter((g) => g.expires_at === null || new Date(g.expires_at) > new Date(nowIso));
  return maxRecordRole(valid.map((g) => g.role));
}
