import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ActivityRow, ActivityVerb } from "@/components/gvteway/ActivityTimeline";
import type { SetTimeRow } from "@/components/gvteway/OnsiteSetTimes";
import type { VenueZonePresence } from "@/components/gvteway/VenueMap";

/**
 * GVTEWAY consumer data layer (design_handoff §2–§3). Server-only typed query
 * helpers over the social/ticketing/onsite tables from
 * `20260623120000_gvteway_consumer.sql` (now applied + in the generated types).
 * Mirrors the shape of `src/lib/marketplace.ts` / `src/lib/workforce.ts`:
 * presentational components stay dumb; these resolve real org/user-scoped rows
 * and hand back the components' prop shapes. RLS does the authorization — these
 * never widen it (e.g. `activity` only returns self + followed actors).
 */
type Sb = Awaited<ReturnType<typeof createClient>>;

export type SceneSummary = { id: string; slug: string; name: string; description: string | null };
export type ListSummary = { id: string; slug: string; name: string; visibility: string };
export type ListItemRow = { id: string; itemKind: string; itemRef: string; position: number };
export type ProviderConnectionRow = { id: string; provider: string; syncState: string; lastSynced: string | null };
export type LinkedPassRow = {
  id: string;
  eventName: string;
  eventAt: string | null;
  venueName: string | null;
  tier: string | null;
  seat: string | null;
  passState: string;
};
export type SceneMemberRow = { userId: string; role: string; name: string; handle: string | null };
export type ScenePostRow = { id: string; body: string; authorName: string; at: string };

type ProfileLite = { name: string; handle: string | null; avatar: string | null };

const ACTIVITY_VERBS = new Set<ActivityVerb>(["saved", "followed", "attended", "posted", "listed"]);

/** Batch-resolve `user_profiles` for a set of user ids → display map. */
async function resolveProfiles(supabase: Sb, ids: string[]): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, public_handle, avatar_url")
    .in("user_id", unique);
  for (const p of data ?? []) {
    map.set(p.user_id, {
      name: p.display_name?.trim() || (p.public_handle ? `@${p.public_handle}` : "Someone"),
      handle: p.public_handle,
      avatar: p.avatar_url,
    });
  }
  return map;
}

// ── Scenes ──────────────────────────────────────────────────────────────────

export async function listPublishedScenes(supabase: Sb): Promise<SceneSummary[]> {
  const { data } = await supabase
    .from("scene")
    .select("id, slug, name, description")
    .eq("scene_state", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  return data ?? [];
}

export async function getSceneBySlug(supabase: Sb, slug: string): Promise<SceneSummary | null> {
  const { data } = await supabase.from("scene").select("id, slug, name, description").eq("slug", slug).maybeSingle();
  return data ?? null;
}

export async function listScenePosts(supabase: Sb, sceneId: string): Promise<ScenePostRow[]> {
  const { data } = await supabase
    .from("post")
    .select("id, body, author_id, created_at")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = data ?? [];
  const profiles = await resolveProfiles(supabase, rows.map((r) => r.author_id));
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    authorName: profiles.get(r.author_id)?.name ?? "Someone",
    at: r.created_at,
  }));
}

export async function listSceneMembers(supabase: Sb, sceneId: string): Promise<SceneMemberRow[]> {
  const { data } = await supabase
    .from("scene_member")
    .select("user_id, member_role")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: true })
    .limit(100);
  const rows = data ?? [];
  const profiles = await resolveProfiles(supabase, rows.map((r) => r.user_id));
  return rows.map((r) => ({
    userId: r.user_id,
    role: r.member_role,
    name: profiles.get(r.user_id)?.name ?? "Member",
    handle: profiles.get(r.user_id)?.handle ?? null,
  }));
}

// ── Lists ───────────────────────────────────────────────────────────────────

/** Owned + public/unlisted lists — RLS scopes the visibility. */
export async function listLists(supabase: Sb): Promise<ListSummary[]> {
  const { data } = await supabase
    .from("list")
    .select("id, slug, name, visibility")
    .order("created_at", { ascending: false })
    .limit(60);
  return data ?? [];
}

export async function getListBySlug(
  supabase: Sb,
  slug: string,
): Promise<{ list: ListSummary; items: ListItemRow[] } | null> {
  const { data: list } = await supabase
    .from("list")
    .select("id, slug, name, visibility")
    .eq("slug", slug)
    .maybeSingle();
  if (!list) return null;
  const { data: items } = await supabase
    .from("list_item")
    .select("id, item_kind, item_ref, position")
    .eq("list_id", list.id)
    .order("position", { ascending: true });
  return {
    list,
    items: (items ?? []).map((i) => ({ id: i.id, itemKind: i.item_kind, itemRef: i.item_ref, position: i.position })),
  };
}

// ── Friend activity ───────────────────────────────────────────────────────────

const VERB_OBJECT_PHRASE: Record<string, string> = {
  event: "event",
  scene: "scene",
  user: "someone",
  list: "list",
  venue: "venue",
};

export async function listFriendActivity(supabase: Sb, limit = 40): Promise<ActivityRow[]> {
  const { data } = await supabase
    .from("activity")
    .select("id, actor_id, verb, object_kind, object_ref, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const profiles = await resolveProfiles(supabase, rows.map((r) => r.actor_id));
  return rows
    .filter((r) => ACTIVITY_VERBS.has(r.verb as ActivityVerb))
    .map((r) => ({
      id: r.id,
      actorName: profiles.get(r.actor_id)?.name ?? "Someone",
      verb: r.verb as ActivityVerb,
      objectLabel: r.object_ref || VERB_OBJECT_PHRASE[r.object_kind] || r.object_kind,
      at: r.created_at,
    }));
}

// ── Account: ticketing providers + linked passes ──────────────────────────────

export async function listProviderConnections(supabase: Sb, userId: string): Promise<ProviderConnectionRow[]> {
  const { data } = await supabase
    .from("provider_connection")
    .select("id, provider, sync_state, last_synced")
    .eq("user_id", userId);
  return (data ?? []).map((r) => ({ id: r.id, provider: r.provider, syncState: r.sync_state, lastSynced: r.last_synced }));
}

export async function listLinkedPasses(supabase: Sb, userId: string): Promise<LinkedPassRow[]> {
  const { data } = await supabase
    .from("linked_pass")
    .select("id, event_name, event_at, venue_name, tier, seat, pass_state")
    .eq("user_id", userId)
    .order("event_at", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id,
    eventName: r.event_name,
    eventAt: r.event_at,
    venueName: r.venue_name,
    tier: r.tier,
    seat: r.seat,
    passState: r.pass_state,
  }));
}

// ── Onsite: set times + find-my-friends presence ──────────────────────────────

function toSetTimeRows(rows: { id: string; stage: string; performer: string; starts_at: string; ends_at: string | null }[]): SetTimeRow[] {
  return rows.map((r) => ({ id: r.id, stage: r.stage, performer: r.performer, startsAt: r.starts_at, endsAt: r.ends_at }));
}

/** Lineup for a specific event/project. */
export async function listSetTimesForProject(supabase: Sb, projectId: string): Promise<SetTimeRow[]> {
  const { data } = await supabase
    .from("set_time")
    .select("id, stage, performer, starts_at, ends_at")
    .eq("project_id", projectId)
    .order("starts_at", { ascending: true });
  return toSetTimeRows(data ?? []);
}

/** Upcoming set times across events (public read) — the consumer "My Night" feed. */
export async function listUpcomingSetTimes(supabase: Sb, limit = 40): Promise<SetTimeRow[]> {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("set_time")
    .select("id, stage, performer, starts_at, ends_at")
    .gte("starts_at", since)
    .order("starts_at", { ascending: true })
    .limit(limit);
  return toSetTimeRows(data ?? []);
}

// ── Order-to-seat menu ────────────────────────────────────────────────────────

export type MenuItemRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  priceCents: number;
  projectId: string | null;
};

/** Available F&B / merch items (public read of `venue_menu_item`). */
export async function listAvailableMenu(supabase: Sb, limit = 30): Promise<MenuItemRow[]> {
  const { data } = await supabase
    .from("venue_menu_item")
    .select("id, category, name, description, price_cents, project_id")
    .eq("is_available", true)
    .order("category", { ascending: true })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    name: r.name,
    description: r.description,
    priceCents: r.price_cents,
    projectId: r.project_id,
  }));
}

// ── Gamification: onsite points → tier + achievements ─────────────────────────

export type OnsiteAchievements = { checkIn: boolean; streak: boolean; squad: boolean };
export type OnsiteScore = {
  points: number;
  tier: string;
  nextTier: string | null;
  nextThreshold: number | null;
  achievements: OnsiteAchievements;
};

const TIERS: { name: string; at: number }[] = [
  { name: "Newcomer", at: 0 },
  { name: "Regular", at: 100 },
  { name: "Insider", at: 500 },
  { name: "Legend", at: 1500 },
];

/** Sum the points ledger → tier + earned achievements (real, RLS-scoped to self). */
export async function computeOnsiteScore(supabase: Sb, userId: string): Promise<OnsiteScore> {
  const { data } = await supabase.from("onsite_points").select("reason, points").eq("user_id", userId);
  const rows = data ?? [];
  const points = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);

  let tierIdx = 0;
  for (let i = 0; i < TIERS.length; i++) if (points >= TIERS[i]!.at) tierIdx = i;
  const next = TIERS[tierIdx + 1] ?? null;

  const setCaught = rows.filter((r) => r.reason === "set_caught").length;
  return {
    points,
    tier: TIERS[tierIdx]!.name,
    nextTier: next?.name ?? null,
    nextThreshold: next?.at ?? null,
    achievements: {
      checkIn: rows.some((r) => r.reason === "check_in"),
      streak: setCaught >= 3,
      squad: rows.some((r) => r.reason === "friend_found"),
    },
  };
}

// ── Scene → events ────────────────────────────────────────────────────────────

export type SceneEventRow = { projectId: string; name: string; slug: string; startDate: string | null };

/** Events a scene is into (`scene_event` → `projects`). */
export async function getSceneEvents(supabase: Sb, sceneId: string): Promise<SceneEventRow[]> {
  const { data: links } = await supabase.from("scene_event").select("project_id").eq("scene_id", sceneId);
  const ids = (links ?? []).map((l) => l.project_id);
  if (ids.length === 0) return [];
  const { data: projects } = await supabase.from("projects").select("id, name, slug, start_date").in("id", ids);
  return (projects ?? []).map((p) => ({ projectId: p.id, name: p.name, slug: p.slug, startDate: p.start_date }));
}

/** Coarse, opt-in zone presence of followed users (RLS: self + followed). */
export async function listFollowedPresence(supabase: Sb, viewerId: string): Promise<VenueZonePresence[]> {
  const { data } = await supabase.from("presence").select("user_id, venue_zone_id").not("venue_zone_id", "is", null);
  const rows = (data ?? []).filter((r) => r.user_id !== viewerId && r.venue_zone_id);
  if (rows.length === 0) return [];

  const zoneIds = [...new Set(rows.map((r) => r.venue_zone_id!))];
  const { data: zones } = await supabase.from("venue_zones").select("id, name").in("id", zoneIds);
  const zoneName = new Map((zones ?? []).map((z) => [z.id, z.name]));
  const profiles = await resolveProfiles(supabase, rows.map((r) => r.user_id));

  const byZone = new Map<string, VenueZonePresence>();
  for (const r of rows) {
    const zid = r.venue_zone_id!;
    const entry = byZone.get(zid) ?? { zoneId: zid, zoneName: zoneName.get(zid) ?? "Zone", friends: [] };
    entry.friends.push(profiles.get(r.user_id)?.name ?? "A friend");
    byZone.set(zid, entry);
  }
  return [...byZone.values()];
}
