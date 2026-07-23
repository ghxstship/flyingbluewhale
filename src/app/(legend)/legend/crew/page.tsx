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

export const dynamic = "force-dynamic";

/**
 * /legend/crew — learning crews / cohorts, ranked by total contribution points
 * (rolled up from the shared points ledger). Highlights the viewer's own crew.
 */
export default async function CrewPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Community" title="Crew & Cohorts" />
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
      <ModuleHeader eyebrow="LEG3ND · Community" title="Crew & Cohorts" subtitle="Learning crews ranked by total contribution points. Climb the board together." />

      <div className="metric-grid mb-6">
        <MetricCard label="Crews" value={crews.length} />
        <MetricCard label="Members" value={members.length} />
        <MetricCard label="Your crews" value={myCrewIds.size} />
      </div>

      {ranked.length === 0 ? (
        <EmptyState size="compact" title="No crews yet" description="Learning crews your org creates will appear here." />
      ) : (
        <div className="surface flex flex-col gap-1 p-2">
          {ranked.map((s) => (
            <LeaderboardRow
              key={s.crew.id}
              rank={s.rank}
              name={s.crew.name}
              avatarUrl={null}
              points={s.points}
              subtitle={`${s.memberCount} ${s.memberCount === 1 ? "member" : "members"}`}
              highlight={myCrewIds.has(s.crew.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
