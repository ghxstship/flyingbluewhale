import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavCountKey } from "@/lib/nav";
import { MANAGER_BAND_ROLES } from "@/lib/auth";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";

/**
 * Live sidebar count badges (kit 21 wave W1) — the three "needing you"
 * numbers the rail displays, computed per request in the (platform) layout
 * and rendered by PlatformSidebar:
 *
 *   inbox      rooms with a message newer than my last_read_at
 *   myWork     open tasks assigned to me (mirrors the My Work page's first stat)
 *   approvals  pending approval instances — deciders (manager+) see the org
 *              queue, members see the ones they initiated (same scoping as
 *              /studio/my-work and /studio/governance/approvals)
 *
 * All three are head-count queries (no rows transferred). Each is wrapped in
 * its own catch so a failed read renders as no badge, never a broken shell.
 * Freshness rides the server-component model: every navigation or
 * router.refresh() after a mutation recomputes them.
 */
export type NavCounts = Partial<Record<NavCountKey, number>>;

type Session = { userId: string; orgId: string; role: string | null };

// Consume the canonical band tuple (src/lib/auth.ts) so the approvals badge
// scopes exactly like the /studio/my-work and /studio/governance/approvals
// pages it counts.
const MANAGER_PLUS = new Set<string>(MANAGER_BAND_ROLES);

export async function getNavCounts(
  supabase: SupabaseClient,
  session: Session,
): Promise<NavCounts> {
  const [inbox, myWork, approvals] = await Promise.all([
    unreadRoomCount(supabase, session).catch(() => undefined),
    openTaskCount(supabase, session).catch(() => undefined),
    pendingApprovalCount(supabase, session).catch(() => undefined),
  ]);
  return { inbox, myWork, approvals };
}

async function unreadRoomCount(supabase: SupabaseClient, session: Session): Promise<number> {
  const { data: memberships } = await supabase
    .from("chat_room_members")
    .select("room_id, last_read_at, muted_at")
    .eq("user_id", session.userId);
  const rows = (memberships ?? []) as Array<{ room_id: string; last_read_at: string | null; muted_at: string | null }>;
  if (rows.length === 0) return 0;
  // Muted rooms never contribute to the sidebar unread badge (kit 21 W5).
  const active = rows.filter((m) => !m.muted_at);
  if (active.length === 0) return 0;
  const readMap = new Map(active.map((m) => [m.room_id, m.last_read_at]));
  const { data: rooms } = await supabase
    .from("chat_rooms")
    .select("id, last_message_at")
    .eq("org_id", session.orgId)
    .in(
      "id",
      active.map((m) => m.room_id),
    )
    .is("deleted_at", null)
    .not("last_message_at", "is", null);
  return ((rooms ?? []) as Array<{ id: string; last_message_at: string | null }>).filter((r) => {
    const lastRead = readMap.get(r.id);
    return r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
  }).length;
}

async function openTaskCount(supabase: SupabaseClient, session: Session): Promise<number> {
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("assigned_to", session.userId)
    .in("task_state", ["todo", "in_progress", "blocked", "review"]);
  return count ?? 0;
}

async function pendingApprovalCount(supabase: SupabaseClient, session: Session): Promise<number> {
  let query = supabase
    .from("approval_instances")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .in("state", [...OPEN_INSTANCE_STATES]);
  if (!MANAGER_PLUS.has(session.role ?? "")) query = query.eq("initiated_by", session.userId);
  const { count } = await query;
  return count ?? 0;
}
