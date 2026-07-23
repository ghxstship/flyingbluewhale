import { ModuleHeader } from "@/components/Shell";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { type Achievement } from "@/lib/legend_gamification";

export const dynamic = "force-dynamic";

/**
 * /legend/badges — the achievement collection. Mirrors the leaderboard's
 * achievement catalog (shared LEG3ND ⇄ COMPVSS gamification model) but
 * presents the full earned-vs-locked grid with collection-progress metrics.
 */
export default async function BadgesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Compete" title="Badges" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: achData }, { data: awardData }] = await Promise.all([
    db
      .from("achievements")
      .select("id, org_id, code, name, description, tone, points, icon_key, achievement_state")
      .eq("org_id", session.orgId)
      .eq("achievement_state", "active")
      .is("deleted_at", null)
      .order("points", { ascending: false }),
    db.from("achievement_awards").select("achievement_id").eq("org_id", session.orgId).eq("user_id", session.userId),
  ]);

  const achievements = (achData ?? []) as Achievement[];
  const earned = new Set(((awardData ?? []) as Array<{ achievement_id: string }>).map((a) => a.achievement_id));

  const total = achievements.length;
  const earnedCount = achievements.filter((a) => earned.has(a.id)).length;
  const pointsEarned = achievements.filter((a) => earned.has(a.id)).reduce((sum, a) => sum + a.points, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Compete"
        title="Badges"
        subtitle="Your achievement collection, earned across LEG3ND learning and COMPVSS field work."
      />

      <div className="metric-grid mb-6">
        <MetricCard label="Earned" value={`${earnedCount} / ${total}`} />
        <MetricCard label="Points Earned" value={pointsEarned} />
        <MetricCard label="Locked" value={total - earnedCount} />
      </div>

      {total === 0 ? (
        <EmptyState size="compact" title="No badges configured" description="Achievements your org defines will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <AchievementBadge
              key={a.id}
              name={a.name}
              description={a.description ?? undefined}
              points={a.points}
              tone={a.tone}
              earned={earned.has(a.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
