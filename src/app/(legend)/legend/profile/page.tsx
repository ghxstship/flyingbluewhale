import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Avatar } from "@/components/ui/Avatar";
import { LoyaltyTier } from "@/components/ui/LoyaltyTier";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { pointsByUser } from "@/lib/db/legend-people";
import { resolveTier } from "@/lib/legend_gamification";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/profile — the learner's own LEG3ND profile: identity header, loyalty
 * tier (from the shared LEG3ND ⇄ COMPVSS points ledger), and lifetime stats
 * (XP, courses completed, certs held, badges earned).
 */
export default async function ProfilePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Account" title="Profile" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const [{ data: me }, points, { data: certData }, { count: badgesCount }, { data: enrollData }] = await Promise.all([
    db.from("users").select("id, name, avatar_url, email").eq("id", session.userId).maybeSingle(),
    pointsByUser(session.orgId),
    db
      .from("certification_holders")
      .select("accreditation_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("achievement_awards")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("course_enrollments")
      .select("enrollment_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
  ]);

  const myPoints = points.get(session.userId) ?? 0;
  const tier = resolveTier(myPoints);

  const certsValidCount = ((certData ?? []) as Array<{ accreditation_state: string | null }>).filter(
    (c) => c.accreditation_state === "valid",
  ).length;
  const completedCount = ((enrollData ?? []) as Array<{ enrollment_state: string | null }>).filter(
    (e) => e.enrollment_state === "completed",
  ).length;

  const profile = me as { name: string | null; avatar_url: string | null; email: string | null } | null;
  const displayName = profile?.name || profile?.email || "Learner";

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Account"
        title="Profile"
        subtitle="Your LEG3ND learner profile, tier, and lifetime stats."
      />

      <div className="surface mb-6 flex items-center gap-4 p-4">
        <Avatar src={profile?.avatar_url} name={displayName} size="xl" />
        <div>
          <div className="text-lg font-semibold text-[var(--p-text-1)]">{displayName}</div>
          <div className="text-sm text-[var(--p-text-2)]">{session.role}</div>
        </div>
      </div>

      <div className="metric-grid mb-6">
        <MetricCard label="Total XP" value={fmt.number(myPoints)} />
        <MetricCard label="Courses Completed" value={completedCount} />
        <MetricCard label="Certs Held" value={certsValidCount} />
        <MetricCard label="Badges" value={badgesCount ?? 0} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Your tier</h2>
        <LoyaltyTier
          tier={tier.tier}
          tone={tier.tone}
          points={myPoints}
          nextTier={tier.nextTier}
          nextThreshold={tier.nextThreshold}
        />
      </div>
    </>
  );
}
