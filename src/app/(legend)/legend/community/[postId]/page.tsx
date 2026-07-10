import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { MANAGER_BAND_ROLES, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import { POST_CATEGORY_LABELS, type PostCategory } from "@/lib/legend_community";
import { CommentComposer } from "./CommentComposer";
import { AcceptAnswerButton } from "./AcceptAnswerButton";

export const dynamic = "force-dynamic";

type Comment = { id: string; author_id: string | null; body_html: string; created_at: string };

/**
 * /legend/community/[postId] — the post-detail + Q&A thread (kit 21
 * remediation R2, ADR-0015). For a `questions`-category post the author can
 * accept one answer (Discourse/SO) — stamped on `community_posts
 * .accepted_comment_id`; answers from org staff carry a Team badge (derived
 * from membership, no column).
 */
export default async function CommunityPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Community" title="Post" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: post } = await db
    .from("community_posts")
    .select("id, author_id, title, body_html, category, like_count, accepted_comment_id, created_at")
    .eq("id", postId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!post) notFound();

  const [{ data: commentData }, members] = await Promise.all([
    db
      .from("community_comments")
      .select("id, author_id, body_html, created_at")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    listOrgMembers(session.orgId),
  ]);
  const comments = (commentData ?? []) as Comment[];
  const memberMap = new Map(members.map((m) => [m.id, m]));
  // Team badge — the answerer holds a manager+ org role.
  const staffIds = new Set(
    members.filter((m) => (MANAGER_BAND_ROLES as readonly string[]).includes(m.role ?? "")).map((m) => m.id),
  );

  const isQuestion = post.category === "questions";
  const isAuthor = post.author_id === session.userId;
  const acceptedId = post.accepted_comment_id as string | null;
  const authorOf = (id: string | null) => (id ? (memberMap.get(id)?.name ?? "Member") : "Member");

  // Accepted answer floats to the top.
  const ordered = [...comments].sort((a, b) => Number(b.id === acceptedId) - Number(a.id === acceptedId));

  return (
    <>
      <ModuleHeader
        eyebrow={`LEG3ND · ${POST_CATEGORY_LABELS[post.category as PostCategory] ?? post.category}`}
        title={post.title}
        breadcrumbs={[
          { label: "Community", href: "/legend/community" },
          { label: post.title },
        ]}
      />
      <div className="mx-auto max-w-2xl space-y-6">
        <article className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--p-text-3)]">
            <span>{authorOf(post.author_id as string | null)}</span>
            <span>·</span>
            <span>{timeAgo(post.created_at as string)}</span>
            <span>·</span>
            <span>♥ {post.like_count}</span>
          </div>
          <div className="prose-sm text-[var(--p-text-1)]" dangerouslySetInnerHTML={{ __html: post.body_html || "" }} />
        </article>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {isQuestion ? "Answers" : "Comments"} · {comments.length}
          </h2>
          {ordered.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">Be the first to reply.</p>
          ) : (
            <ul className="space-y-3">
              {ordered.map((c) => {
                const accepted = c.id === acceptedId;
                return (
                  <li
                    key={c.id}
                    className={`surface p-4 ${accepted ? "border-[color:var(--p-success)]/50" : ""}`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs text-[var(--p-text-3)]">
                      <span className="font-medium text-[var(--p-text-2)]">{authorOf(c.author_id)}</span>
                      {c.author_id && staffIds.has(c.author_id) && <Badge variant="brand">Team</Badge>}
                      {accepted && <Badge variant="success">Accepted</Badge>}
                      <span className="ms-auto">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="prose-sm text-[var(--p-text-1)]" dangerouslySetInnerHTML={{ __html: c.body_html }} />
                    {isQuestion && isAuthor && (
                      <div className="mt-2">
                        <AcceptAnswerButton postId={postId} commentId={c.id} accepted={accepted} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <CommentComposer postId={postId} />
        </section>

        <Link href="/legend/community" className="inline-block text-xs text-[var(--p-text-3)] hover:underline">
          ← Back to Community
        </Link>
      </div>
    </>
  );
}
