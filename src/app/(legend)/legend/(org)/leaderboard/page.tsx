import { ModuleHeader } from "@/components/Shell";
import { LeaderboardRow } from "@/components/ui/LeaderboardRow";
import { LoyaltyTier } from "@/components/ui/LoyaltyTier";
import { AchievementBadge } from "@/components/ui/AchievementBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers, pointsByUser } from "@/lib/db/legend-people";
import { resolveTier, type Achievement } from "@/lib/legend_gamification";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/leaderboard — the shared LEG3ND ⇄ COMPVSS gamification surface. The
 * org ranking (from the shared points ledger), the viewer's loyalty tier, and
 * the achievement catalog with earned/locked state.
 */
export default async function LeaderboardPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.leaderboard.eyebrow", undefined, "LEG3ND · Community")}
          title={t("console.legend.leaderboard.title", undefined, "Leaderboard")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [members, points, { data: achData }, { data: awardData }] = await Promise.all([
    listOrgMembers(session.orgId),
    pointsByUser(session.orgId),
    db
      .from("achievements")
      .select("id, org_id, code, name, description, tone, points, icon_key, achievement_state")
      .eq("org_id", session.orgId)
      .eq("achievement_state", "active")
      .is("deleted_at", null)
      .order("points", { ascending: false }),
    db.from("achievement_awards").select("achievement_id").eq("org_id", session.orgId).eq("user_id", session.userId),
  ]);

  const ranked = members
    .map((m) => ({ ...m, points: points.get(m.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const myPoints = points.get(session.userId) ?? 0;
  const tier = resolveTier(myPoints);

  const achievements = (achData ?? []) as Achievement[];
  const earned = new Set(((awardData ?? []) as Array<{ achievement_id: string }>).map((a) => a.achievement_id));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.leaderboard.eyebrow", undefined, "LEG3ND · Community")}
        title={t("console.legend.leaderboard.title", undefined, "Leaderboard")}
        subtitle={t("console.legend.leaderboard.subtitle", undefined, "Points, tiers, and achievements, shared with COMPVSS field.")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-2">
          <h2 className="eyebrow">{t("console.legend.leaderboard.ranking", undefined, "Ranking")}</h2>
          {ranked.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.legend.leaderboard.emptyTitle", undefined, "No points yet")}
              description={t(
                "console.legend.leaderboard.emptyDescription",
                undefined,
                "Complete courses and field work to climb the board.",
              )}
            />
          ) : (
            <div className="surface flex flex-col gap-1 p-2">
              {ranked.map((m, i) => (
                <LeaderboardRow
                  key={m.id}
                  rank={i + 1}
                  name={m.name}
                  avatarUrl={m.avatar_url}
                  points={m.points}
                  subtitle={m.role ?? undefined}
                  highlight={m.id === session.userId}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="eyebrow mb-2">{t("console.legend.leaderboard.yourTier", undefined, "Your tier")}</h2>
            <LoyaltyTier tier={tier.tier} tone={tier.tone} points={myPoints} nextTier={tier.nextTier} nextThreshold={tier.nextThreshold} />
          </div>

          <div>
            <h2 className="eyebrow mb-2">{t("console.legend.leaderboard.achievements", undefined, "Achievements")}</h2>
            {achievements.length === 0 ? (
              <p className="text-sm text-[var(--p-text-2)]">
                {t("console.legend.leaderboard.noAchievements", undefined, "No achievements configured yet.")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {achievements.map((a) => (
                  <AchievementBadge
                    key={a.id}
                    name={a.name}
                    description={a.description ?? undefined}
                    points={a.points}
                    tone={a.tone}
                    earned={earned.has(a.id)}
                    size="compact"
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
