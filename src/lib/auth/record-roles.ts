import "server-only";

import { getSession } from "@/lib/auth";
import { getRecordRole, canRecord, type RecordOp, type RecordRole } from "@/lib/db/record-grants";

/**
 * Server-only helpers that compose `record_grants` lookups with the existing
 * org-admin bypass — the canonical layer that should be called by route
 * handlers and server actions when deciding whether the current user may
 * read/edit a specific record.
 *
 * Design: org owners + admins always pass; managers always pass for ops
 * other than `admin` (full record-admin remains a per-record grant). Below
 * that band, we fall through to the SmartSuite-style record_role ladder.
 */

/**
 * Highest-priority record_role the current session has on (table, id).
 * Returns NULL when there's no grant. NOTE: org-admins / managers do not
 * synthesize a role here — call `canRecord(...)` for the bypass-aware check.
 */
export async function recordRoleFor(table: string, id: string): Promise<RecordRole | null> {
  const session = await getSession();
  if (!session) return null;
  return getRecordRole({ resourceTable: table, resourceId: id, userId: session.userId });
}

/**
 * Capability check that honors org-admin bypass. Owners/admins always pass.
 * Managers pass every op except `admin` (which still requires a `full` grant).
 * Below that, the result is determined entirely by the record_grants ladder.
 */
export async function canRecordFor(table: string, id: string, op: RecordOp): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  // Org-admin bypass — owners and admins have superpowers on every record
  // in their org. Mirrors the existing `is_org_admin()` SQL helper.
  if (session.role === "owner" || session.role === "admin") return true;

  // Managers pass every op except `admin` (record-admin still requires a
  // `full` grant — keeps the "Solution Manager" parity at record scope).
  if (session.role === "manager" && op !== "admin") return true;

  const role = await getRecordRole({ resourceTable: table, resourceId: id, userId: session.userId });
  return canRecord(role, op);
}

// Re-export for callers that want types without reaching into db/record-grants.
export type { RecordOp, RecordRole };
