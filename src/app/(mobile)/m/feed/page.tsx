import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { FeedView, type FeedPost } from "./FeedView";

/** Kit 32 A5 — the single "like" reaction emoji stored per user per post. */
const LIKE_EMOJI = "👍";

export const dynamic = "force-dynamic";

/**
 * /m/feed — the COMPVSS Community feed. Merges two real backing tables into
 * one chronological stream:
 *   • `recognition_posts` (visibility_state='public')  → Kudos / shout-outs
 *   • `announcements`     (publish_state='published')  → org Updates
 *
 * Server fetches + shapes the rows; the surviving client `FeedView` owns the
 * composer + like/comment/share leaves. Design truth: prototype community tab
 * (app.jsx 2133-2180).
 */

function initials(name: string | null, fallback: string): string {
  const src = (name ?? "").trim();
  if (!src) return fallback.slice(0, 2).toUpperCase();
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || fallback.slice(0, 2).toUpperCase();
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return `${Math.floor(day / 7)}w`;
}

export default async function MobileFeedPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.feed.eyebrow", undefined, "Community")}</div>
        <h1 className="scr-h">{t("m.feed.title", undefined, "Community")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: kudos }, { data: announcements }] = await Promise.all([
    supabase
      .from("recognition_posts")
      .select("id, from_user_id, message, visibility_state, created_at")
      .eq("org_id", session.orgId)
      .eq("visibility_state", "public")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("announcements")
      .select("id, author_id, title, body, publish_state, published_at, created_at")
      .eq("org_id", session.orgId)
      .eq("publish_state", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(40),
  ]);

  type KudosRow = {
    id: string;
    from_user_id: string;
    message: string;
    created_at: string;
  };
  type AnnouncementRow = {
    id: string;
    author_id: string | null;
    title: string;
    body: string;
    published_at: string | null;
    created_at: string;
  };

  const kudosRows = (kudos ?? []) as KudosRow[];
  const annRows = (announcements ?? []) as AnnouncementRow[];

  // Hydrate author display names in one round-trip.
  const userIds = Array.from(
    new Set([...kudosRows.map((k) => k.from_user_id), ...annRows.map((a) => a.author_id).filter(Boolean) as string[]]),
  );
  const userMap = new Map<string, { name: string | null; email: string }>();
  if (userIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string }>) {
      userMap.set(u.id, { name: u.name, email: u.email });
    }
  }

  // Kit 32 A5 — resolve real like state per post. Kudos reactions live in
  // recognition_reactions; announcement reactions in the kit-32 twin. Count the
  // "like" emoji per subject and mark the ones the caller has liked. RLS scopes
  // both reads to the caller's org.
  const kudosIds = kudosRows.map((k) => k.id);
  const annIds = annRows.map((a) => a.id);
  const kudosLikeCount = new Map<string, number>();
  const kudosLikedByMe = new Set<string>();
  const annLikeCount = new Map<string, number>();
  const annLikedByMe = new Set<string>();
  const [kudosReactions, annReactions] = await Promise.all([
    kudosIds.length
      ? supabase
          .from("recognition_reactions")
          .select("post_id, user_id")
          .eq("emoji", LIKE_EMOJI)
          .in("post_id", kudosIds)
      : Promise.resolve({ data: [] as Array<{ post_id: string; user_id: string }> }),
    annIds.length
      ? supabase
          .from("announcement_reactions")
          .select("announcement_id, user_id")
          .eq("emoji", LIKE_EMOJI)
          .in("announcement_id", annIds)
      : Promise.resolve({ data: [] as Array<{ announcement_id: string; user_id: string }> }),
  ]);
  for (const r of (kudosReactions.data ?? []) as Array<{ post_id: string; user_id: string }>) {
    kudosLikeCount.set(r.post_id, (kudosLikeCount.get(r.post_id) ?? 0) + 1);
    if (r.user_id === session.userId) kudosLikedByMe.add(r.post_id);
  }
  for (const r of (annReactions.data ?? []) as Array<{ announcement_id: string; user_id: string }>) {
    annLikeCount.set(r.announcement_id, (annLikeCount.get(r.announcement_id) ?? 0) + 1);
    if (r.user_id === session.userId) annLikedByMe.add(r.announcement_id);
  }

  const kudosLabel = t("m.feed.tag.kudos", undefined, "Kudos");
  const updateLabel = t("m.feed.tag.update", undefined, "Update");
  const announcerLabel = t("m.feed.announcerRole", undefined, "Announcement");
  const memberLabel = t("m.feed.memberRole", undefined, "Crew");

  const posts: FeedPost[] = [
    ...kudosRows.map((k): FeedPost => {
      const u = userMap.get(k.from_user_id);
      const name = u?.name ?? u?.email ?? "Crew Member";
      return {
        id: `kudos:${k.id}`,
        who: name,
        av: initials(u?.name ?? null, u?.email ?? "C"),
        role: memberLabel,
        body: k.message,
        tag: kudosLabel,
        tagTone: "ok",
        when: t("m.feed.ago", { time: relativeTime(k.created_at) }, `${relativeTime(k.created_at)} ago`),
        absWhen: fmt.dateTime(k.created_at),
        sortAt: k.created_at,
        likeKind: "kudos",
        refId: k.id,
        likeCount: kudosLikeCount.get(k.id) ?? 0,
        liked: kudosLikedByMe.has(k.id),
      };
    }),
    ...annRows.map((a): FeedPost => {
      const u = a.author_id ? userMap.get(a.author_id) : undefined;
      const name = u?.name ?? u?.email ?? "ATLVS";
      const at = a.published_at ?? a.created_at;
      return {
        id: `ann:${a.id}`,
        who: name,
        av: initials(u?.name ?? null, u?.email ?? "AN"),
        role: announcerLabel,
        body: a.title + (a.body ? ` — ${a.body}` : ""),
        tag: updateLabel,
        tagTone: "info",
        when: t("m.feed.ago", { time: relativeTime(at) }, `${relativeTime(at)} ago`),
        absWhen: fmt.dateTime(at),
        sortAt: at,
        likeKind: "ann",
        refId: a.id,
        likeCount: annLikeCount.get(a.id) ?? 0,
        liked: annLikedByMe.has(a.id),
      };
    }),
  ].sort((x, y) => y.sortAt.localeCompare(x.sortAt));

  return (
    <div className="screen screen-anim">
      {/* F-13: restore the CLAUDE.md-documented realtime nudge — new
          announcements and kudos surface without a manual reload. */}
      <RealtimeRefresh
        channelName={`m-feed-announcements-${session.orgId}`}
        table="announcements"
        filter={`org_id=eq.${session.orgId}`}
      />
      <RealtimeRefresh
        channelName={`m-feed-kudos-${session.orgId}`}
        table="recognition_posts"
        filter={`org_id=eq.${session.orgId}`}
      />
      <div className="scr-eye">
        {t("m.feed.eyebrow", { count: posts.length }, `${posts.length} Posts`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.feed.title", undefined, "Community")}
      </h1>
      <FeedView posts={posts} myInitials={initials(session.email ?? null, session.email ?? "ME")} />
    </div>
  );
}
