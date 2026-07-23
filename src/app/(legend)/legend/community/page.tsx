import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { ActivityTimeline, type ActivityItem } from "@/components/ui/ActivityTimeline";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import { POST_CATEGORY_LABELS, type CommunityPost, type PostCategory } from "@/lib/legend_community";
import { PostComposer } from "./PostComposer";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/community — the cohort-community-class community feed. A post composer over an
 * <ActivityTimeline> of published posts, with a link to the members directory.
 */
export default async function CommunityPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.community.eyebrow", undefined, "LEG3ND · Community")}
          title={t("console.legend.community.title", undefined, "Community")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: postData }, members] = await Promise.all([
    db
      .from("community_posts")
      .select("id, org_id, author_id, title, body_html, category, pinned, like_count, comment_count, post_state, created_at, updated_at")
      .eq("org_id", session.orgId)
      .eq("post_state", "published")
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    listOrgMembers(session.orgId),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const posts = (postData ?? []) as CommunityPost[];

  const items: ActivityItem[] = posts.map((p) => {
    const author = p.author_id ? memberMap.get(p.author_id) : undefined;
    const cat = POST_CATEGORY_LABELS[p.category as PostCategory] ?? p.category;
    return {
      id: p.id,
      actorName: author?.name ?? t("console.legend.community.member", undefined, "Member"),
      actorAvatarUrl: author?.avatar_url ?? null,
      action: t("console.legend.community.postedIn", undefined, "posted in"),
      target: cat,
      time: timeAgo(p.created_at),
      body: (
        <div>
          <Link href={`/legend/community/${p.id}`} className="font-medium text-[var(--p-text-1)] hover:underline">
            {p.pinned && <span className="mr-1 text-[var(--p-accent)]">📌</span>}
            {p.title}
          </Link>
          <div className="mt-0.5 flex gap-3 text-xs text-[var(--p-text-3)]">
            <span>♥ {p.like_count}</span>
            <span>💬 {p.comment_count}</span>
          </div>
        </div>
      ),
    };
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.community.eyebrow", undefined, "LEG3ND · Community")}
        title={t("console.legend.community.title", undefined, "Community")}
        subtitle={t("console.legend.community.subtitle", undefined, "Wins, questions, and resources from the cohort.")}
        action={
          <Link href="/legend/community/members" className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
            {t("console.legend.community.members", undefined, "Members")}
          </Link>
        }
      />
      <div className="mx-auto max-w-2xl space-y-6">
        <PostComposer />
        <ActivityTimeline
          items={items}
          emptyLabel={t("console.legend.community.emptyFeed", undefined, "No posts yet. Start the conversation.")}
        />
      </div>
    </>
  );
}
