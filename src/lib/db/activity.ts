import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Activity feed wrapper around the `audit_log` table. The SSOT trigger
 * (`tg_audit_log`, see `20260417_000010_ssot_triggers.sql`) writes a row
 * for every insert/update/delete on every tenant-scoped table. We surface
 * those rows as a per-record timeline — the underlying RLS (`is_org_member`)
 * is the authorization gate.
 *
 * SmartSuite parity: per-record activity history.
 * https://help.smartsuite.com/en/articles/4855582-record-activity-history
 */

export type ActivityDiff = Record<string, { before: unknown; after: unknown }>;

export type ActivityItem = {
  id: string;
  orgId: string;
  actorId: string | null;
  actorName?: string;
  actorEmail?: string;
  actorAvatarUrl?: string;
  /** e.g. "tickets.update", "deliverables.update", "annotations.insert". */
  action: string;
  /** "insert" | "update" | "delete" — present on trigger-emitted rows. */
  operation?: string | null;
  targetTable: string;
  targetId: string;
  diff?: ActivityDiff;
  metadata?: Record<string, unknown>;
  /** ISO 8601 timestamp from `audit_log.at`. */
  occurredAt: string;
};

type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

type AuditRowWithUser = AuditRow & {
  actor?: { id: string; name: string | null; avatar_url: string | null; email: string | null } | null;
};

const DEFAULT_LIMIT = 100;

function jsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Derive a column-level before/after diff from the trigger's snapshot rows. */
function deriveDiff(before: unknown, after: unknown): ActivityDiff | undefined {
  const b = jsonObject(before);
  const a = jsonObject(after);
  if (!b && !a) return undefined;

  // Internal/noisy columns that aren't useful in a human timeline.
  const skip = new Set(["id", "org_id", "created_at", "updated_at", "deleted_at", "search_index"]);

  const keys = new Set<string>([...(b ? Object.keys(b) : []), ...(a ? Object.keys(a) : [])]);
  const diff: ActivityDiff = {};
  for (const key of keys) {
    if (skip.has(key)) continue;
    const beforeVal = b ? b[key] : undefined;
    const afterVal = a ? a[key] : undefined;
    if (JSON.stringify(beforeVal) === JSON.stringify(afterVal)) continue;
    diff[key] = { before: beforeVal, after: afterVal };
  }
  return Object.keys(diff).length === 0 ? undefined : diff;
}

function rowToActivity(row: AuditRowWithUser): ActivityItem {
  const diff = row.operation === "update" ? deriveDiff(row.before, row.after) : undefined;
  return {
    id: row.id,
    orgId: row.org_id,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? undefined,
    actorEmail: row.actor?.email ?? row.actor_email ?? undefined,
    actorAvatarUrl: row.actor?.avatar_url ?? undefined,
    action: row.action,
    operation: row.operation,
    targetTable: row.target_table ?? "",
    targetId: row.target_id ?? "",
    diff,
    metadata: jsonObject(row.metadata) ?? undefined,
    occurredAt: row.at,
  };
}

export type GetActivityForTargetOptions = {
  targetTable: string;
  targetId: string;
  /** Soft cap. Default 100. */
  limit?: number;
  /** Pagination cursor — return rows where `at < before`. */
  before?: string;
};

/**
 * Read the activity timeline for a single record. RLS gates the query
 * (caller must be a member of the row's org), so this is safe to call
 * from any server component.
 */
export async function getActivityForTarget(opts: GetActivityForTargetOptions): Promise<ActivityItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), 500);
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select(
      "id, org_id, actor_id, actor_email, action, operation, target_table, target_id, before, after, metadata, at, actor:users!audit_log_actor_id_fkey(id, name, avatar_url, email)",
    )
    .eq("target_table", opts.targetTable)
    .eq("target_id", opts.targetId)
    .order("at", { ascending: false })
    .limit(limit);

  if (opts.before) {
    query = query.lt("at", opts.before);
  }

  const { data, error } = await query;
  if (error) {
    // RLS denial / no rows / column mismatch — return empty so the page renders.
    return [];
  }
  const rows = (data ?? []) as unknown as AuditRowWithUser[];
  return rows.map(rowToActivity);
}

export type GetActivityForRecordOptions = {
  /** Caller's org — enforces an extra defensive check on top of RLS. */
  orgId: string;
  targetTable: string;
  targetId: string;
  limit?: number;
  before?: string;
};

/**
 * Same as `getActivityForTarget`, plus an extra org_id filter. Useful when
 * the caller already has a session and wants belt-and-braces scoping (e.g.
 * to defend against a future RLS policy regression).
 */
export async function getActivityForRecord(opts: GetActivityForRecordOptions): Promise<ActivityItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), 500);
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select(
      "id, org_id, actor_id, actor_email, action, operation, target_table, target_id, before, after, metadata, at, actor:users!audit_log_actor_id_fkey(id, name, avatar_url, email)",
    )
    .eq("org_id", opts.orgId)
    .eq("target_table", opts.targetTable)
    .eq("target_id", opts.targetId)
    .order("at", { ascending: false })
    .limit(limit);

  if (opts.before) {
    query = query.lt("at", opts.before);
  }

  const { data, error } = await query;
  if (error) return [];
  const rows = (data ?? []) as unknown as AuditRowWithUser[];
  return rows.map(rowToActivity);
}
