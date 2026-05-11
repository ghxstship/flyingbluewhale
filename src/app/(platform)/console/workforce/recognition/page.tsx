import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  value_tag: string | null;
  points: number;
  visibility_state: string;
  created_at: string;
};

export default async function RecognitionAdminPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Recognition" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: posts } = await supabase
    .from("recognition_posts")
    .select("id, from_user_id, to_user_id, message, value_tag, points, visibility_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (posts ?? []) as Post[];

  // Leaderboard: count posts received per user in the last 90 days.
  const since = new Date(Date.now() - 90 * 86_400_000);
  const leaderboard = new Map<string, number>();
  for (const p of rows) {
    if (new Date(p.created_at) >= since) {
      leaderboard.set(p.to_user_id, (leaderboard.get(p.to_user_id) ?? 0) + 1);
    }
  }
  const topUserIds = Array.from(leaderboard.keys());
  const userIds = Array.from(
    new Set([...rows.map((r) => r.from_user_id), ...rows.map((r) => r.to_user_id), ...topUserIds]),
  );
  const { data: users } = userIds.length
    ? await supabase.from("users").select("id, email, name").in("id", userIds)
    : { data: [] };
  const userMap = new Map(
    ((users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  const top = Array.from(leaderboard.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Recognition"
        subtitle={`${rows.length} kudos posts · 90-day leaderboard below`}
      />
      <div className="page-content grid gap-4 lg:grid-cols-2">
        <section className="surface p-4">
          <h2 className="text-sm font-semibold">90-Day Leaderboard</h2>
          {top.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No kudos in the last 90 days.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {top.map(([uid, count], idx) => (
                <li key={uid} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">#{idx + 1}</span>{" "}
                    {userMap.get(uid) ?? "Unknown"}
                  </span>
                  <span className="font-mono text-xs">{count}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Recent Posts</h2>
          <ul className="mt-3 space-y-3">
            {rows.slice(0, 20).map((p) => (
              <li key={p.id}>
                <div className="text-xs">
                  <span className="font-semibold">{userMap.get(p.from_user_id) ?? "Someone"}</span>
                  <span className="text-[var(--text-muted)]"> → </span>
                  <span className="font-semibold">{userMap.get(p.to_user_id) ?? "Someone"}</span>
                  <span className="ml-2 font-mono text-[var(--text-muted)]">{fmt.time(p.created_at)}</span>
                </div>
                <p className="mt-1 text-xs">{p.message}</p>
                {p.value_tag && (
                  <Badge variant="info" className="mt-1">
                    {p.value_tag}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
