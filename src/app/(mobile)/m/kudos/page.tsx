import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { createKudos, toggleReaction } from "./actions";

const REACTION_EMOJIS = ["👏", "🙌", "🔥", "💯", "🚀", "❤️"] as const;

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  value_tag: string | null;
  points: number;
  created_at: string;
};

type Member = { id: string; email: string };

export default async function MobileKudosPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: posts }, { data: myBadges }] = await Promise.all([
    supabase
      .from("recognition_posts")
      .select("id, from_user_id, to_user_id, message, value_tag, points, created_at")
      .eq("org_id", session.orgId)
      .eq("visibility_state", "public")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("badge_awards")
      .select("id, badge_id, note, awarded_at, badge:badge_id(name, icon)")
      .eq("user_id", session.userId)
      .order("awarded_at", { ascending: false })
      .limit(20),
  ]);

  // recognition_reactions was orphaned — no surface let anyone +1 a kudo.
  // Pull all reactions for the visible window in one round-trip and group
  // client-side: cheaper than a per-post fetch and the 50-post limit caps
  // the row count.
  const postIds = ((posts ?? []) as Array<{ id: string }>).map((p) => p.id);
  const { data: reactionsData } = postIds.length
    ? await supabase.from("recognition_reactions").select("post_id, user_id, emoji").in("post_id", postIds)
    : { data: [] as Array<{ post_id: string; user_id: string; emoji: string }> };
  type ReactionRow = { post_id: string; user_id: string; emoji: string };
  const reactions = (reactionsData ?? []) as ReactionRow[];
  // Per-post per-emoji: total count + whether the caller is in.
  type ReactionTally = Map<string, { count: number; mine: boolean }>;
  const reactionsByPost = new Map<string, ReactionTally>();
  for (const r of reactions) {
    let tally = reactionsByPost.get(r.post_id);
    if (!tally) {
      tally = new Map();
      reactionsByPost.set(r.post_id, tally);
    }
    const entry = tally.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.user_id === session.userId) entry.mine = true;
    tally.set(r.emoji, entry);
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  const members = ((memberships ?? []) as Array<{ user_id: string; users: { id: string; email: string } | null }>)
    .map((m) => m.users)
    .filter((u): u is Member => !!u);
  const memberMap = new Map(members.map((m) => [m.id, m.email]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.common.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.kudos.title", undefined, "Kudos")}</h1>

      {(
        (myBadges ?? []) as Array<{
          id: string;
          badge_id: string;
          note: string | null;
          awarded_at: string;
          badge: { name: string; icon: string | null } | null;
        }>
      ).length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.kudos.myBadges", undefined, "My Badges")}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(
              (myBadges ?? []) as Array<{
                id: string;
                badge_id: string;
                note: string | null;
                awarded_at: string;
                badge: { name: string; icon: string | null } | null;
              }>
            ).map((ba) => (
              <li key={ba.id} className="surface flex items-center gap-2 px-3 py-2 text-xs">
                <span className="font-mono text-base">{ba.badge?.icon ?? "🏅"}</span>
                <span className="font-semibold">
                  {ba.badge?.name ?? t("m.kudos.badgeFallback", undefined, "Badge")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="surface mt-4 p-3">
        <summary className="cursor-pointer text-sm font-semibold">{t("m.kudos.give", undefined, "Give Kudos")}</summary>
        <form action={createKudos} className="mt-3 space-y-2">
          <label className="block text-xs font-semibold">
            {t("m.kudos.to", undefined, "To")}
            <select
              name="to_user_id"
              required
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              {members
                .filter((m) => m.id !== session.userId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.email}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            {t("m.kudos.message", undefined, "Message")}
            <textarea
              name="message"
              required
              rows={3}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {t("m.kudos.valueTag", undefined, "Value (optional tag)")}
            <input
              type="text"
              name="value_tag"
              maxLength={40}
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="btn btn-primary w-full">
            {t("common.send", undefined, "Send")}
          </button>
        </form>
      </details>

      <ul className="mt-5 space-y-3">
        {((posts ?? []) as Post[]).length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.kudos.empty.title", undefined, "No Kudos Yet")}
              description={t("m.kudos.empty.description", undefined, "Recognition posts will appear here.")}
            />
          </li>
        ) : (
          ((posts ?? []) as Post[]).map((p) => (
            <li key={p.id} className="surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">
                  <span className="font-semibold">
                    {memberMap.get(p.from_user_id) ?? t("m.kudos.someone", undefined, "Someone")}
                  </span>{" "}
                  <span className="text-[var(--text-muted)]">→</span>{" "}
                  <span className="font-semibold">{memberMap.get(p.to_user_id) ?? "Someone"}</span>
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">{fmt.time(p.created_at)}</span>
              </div>
              <p className="mt-2 text-sm">{p.message}</p>
              <div className="mt-2 flex items-center gap-2">
                {p.value_tag && <Badge variant="info">{p.value_tag}</Badge>}
                {p.points > 0 && (
                  <Badge variant="muted">{t("m.kudos.points", { count: p.points }, `${p.points} pts`)}</Badge>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {REACTION_EMOJIS.map((emoji) => {
                  const tally = reactionsByPost.get(p.id)?.get(emoji);
                  const count = tally?.count ?? 0;
                  const mine = tally?.mine ?? false;
                  return (
                    <form key={emoji} action={toggleReaction}>
                      <input type="hidden" name="post_id" value={p.id} />
                      <input type="hidden" name="emoji" value={emoji} />
                      <button
                        type="submit"
                        aria-label={t("m.kudos.reactWith", { emoji }, `React with ${emoji}`)}
                        aria-pressed={mine}
                        className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          mine
                            ? "border-[var(--org-primary)] bg-[var(--surface-inset)]"
                            : "border-[var(--border-color)] hover:bg-[var(--surface-inset)]"
                        }`}
                      >
                        <span aria-hidden>{emoji}</span>
                        {count > 0 && <span className="ms-1 font-mono">{count}</span>}
                      </button>
                    </form>
                  );
                })}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
