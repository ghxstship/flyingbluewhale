import { ModuleHeader } from "@/components/Shell";
import { LeaderboardRow } from "@/components/ui/LeaderboardRow";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { pointsByUser } from "@/lib/db/legend-people";
import { rankCrews, type Crew, type CrewStanding } from "@/lib/legend_crew";
import { isLegendReadOnly } from "@/lib/legend_access";
import { CrewJoinButton } from "./CrewJoinButton";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/crew — learning crews / cohorts, ranked by total contribution points
 * (rolled up from the shared points ledger). Highlights the viewer's own crew.
 */
export default async function CrewPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.crew.eyebrow", undefined, "LEG3ND · Community")}
          title={t("console.legend.crew.title", undefined, "Crew & Cohorts")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: crewData }, { data: memberData }, points] = await Promise.all([
    db
      .from("legend_crews")
      .select("id, org_id, name, description, crew_state")
      .eq("org_id", session.orgId)
      .eq("crew_state", "active")
      .is("deleted_at", null),
    db.from("legend_crew_members").select("crew_id, user_id").eq("org_id", session.orgId),
    pointsByUser(session.orgId),
  ]);

  const crews = (crewData ?? []) as Crew[];
  const members = (memberData ?? []) as Array<{ crew_id: string; user_id: string }>;

  // Roll member points up into each crew.
  const byCrew = new Map<string, string[]>();
  for (const m of members) {
    const arr = byCrew.get(m.crew_id) ?? [];
    arr.push(m.user_id);
    byCrew.set(m.crew_id, arr);
  }
  const myCrewIds = new Set(members.filter((m) => m.user_id === session.userId).map((m) => m.crew_id));

  const standings: CrewStanding[] = crews.map((crew) => {
    const memberIds = byCrew.get(crew.id) ?? [];
    return {
      crew,
      memberCount: memberIds.length,
      points: memberIds.reduce((s, uid) => s + (points.get(uid) ?? 0), 0),
    };
  });
  const ranked = rankCrews(standings);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.crew.eyebrow", undefined, "LEG3ND · Community")}
        title={t("console.legend.crew.title", undefined, "Crew & Cohorts")}
        subtitle={t(
          "console.legend.crew.subtitle",
          undefined,
          "Learning crews ranked by total contribution points. Climb the board together.",
        )}
      />

      <div className="metric-grid mb-6">
        <MetricCard label={t("console.legend.crew.crews", undefined, "Crews")} value={crews.length} />
        <MetricCard label={t("console.legend.crew.members", undefined, "Members")} value={members.length} />
        <MetricCard label={t("console.legend.crew.yourCrews", undefined, "Your crews")} value={myCrewIds.size} />
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("console.legend.crew.emptyTitle", undefined, "No crews yet")}
          description={t("console.legend.crew.emptyDescription", undefined, "Learning crews your org creates will appear here.")}
        />
      ) : (
        <div className="surface flex flex-col gap-1 p-2">
          {ranked.map((s) => (
            <div key={s.crew.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <LeaderboardRow
                  rank={s.rank}
                  name={s.crew.name}
                  avatarUrl={null}
                  points={s.points}
                  subtitle={
                    s.memberCount === 1
                      ? t("console.legend.crew.oneMember", undefined, "1 member")
                      : t("console.legend.crew.nMembers", { count: s.memberCount }, `${s.memberCount} members`)
                  }
                  highlight={myCrewIds.has(s.crew.id)}
                />
              </div>
              {/* Read-only personas browse standings without join/leave (P-1). */}
              {!isLegendReadOnly(session) && (
                <CrewJoinButton crewId={s.crew.id} member={myCrewIds.has(s.crew.id)} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
