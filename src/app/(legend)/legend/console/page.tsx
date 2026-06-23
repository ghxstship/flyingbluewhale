import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { listOrgMembers } from "@/lib/db/legend-people";
import { AssignForm } from "./AssignForm";

export const dynamic = "force-dynamic";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * /legend/console — the training console. Manager+ only: org compliance KPIs, a
 * learner roster (certs held · courses in progress), and a course-assignment
 * control. All counts derive from live certification_holders + course_enrollments.
 */
export default async function TrainingConsolePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Manage" title="Training Console" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;

  const [members, { data: holderData }, { data: enrollData }, { data: courseData }] = await Promise.all([
    listOrgMembers(session.orgId),
    db.from("certification_holders").select("user_id, accreditation_state, expires_on").eq("org_id", session.orgId),
    db.from("course_enrollments").select("user_id, enrollment_state").eq("org_id", session.orgId),
    db
      .from("legend_courses")
      .select("id, title")
      .eq("org_id", session.orgId)
      .eq("course_state", "published")
      .is("deleted_at", null)
      .order("title", { ascending: true }),
  ]);

  const holders = (holderData ?? []) as Array<{ user_id: string; accreditation_state: string; expires_on: string | null }>;
  const enrollments = (enrollData ?? []) as Array<{ user_id: string; enrollment_state: string }>;
  const courses = (courseData ?? []) as Array<{ id: string; title: string }>;

  const now = Date.now();
  const horizon = now + 30 * DAY_MS;

  // KPIs
  const validCerts = holders.filter((h) => h.accreditation_state === "valid").length;
  const expiringSoon = holders.filter(
    (h) =>
      (h.accreditation_state === "valid" || h.accreditation_state === "expiring") &&
      h.expires_on != null &&
      new Date(h.expires_on + "T00:00:00Z").getTime() <= horizon &&
      new Date(h.expires_on + "T00:00:00Z").getTime() >= now,
  ).length;
  const overdue = holders.filter((h) => h.accreditation_state === "expired").length;
  const activeEnrollments = enrollments.filter((e) => e.enrollment_state !== "completed").length;

  // Per-member rollups
  const validByUser = new Map<string, number>();
  for (const h of holders) {
    if (h.accreditation_state === "valid" || h.accreditation_state === "expiring") {
      validByUser.set(h.user_id, (validByUser.get(h.user_id) ?? 0) + 1);
    }
  }
  const enrolledByUser = new Map<string, { total: number; completed: number }>();
  for (const e of enrollments) {
    const cur = enrolledByUser.get(e.user_id) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (e.enrollment_state === "completed") cur.completed += 1;
    enrolledByUser.set(e.user_id, cur);
  }

  return (
    <>
      <ModuleHeader eyebrow="LEG3ND · Manage" title="Training Console" subtitle="Org compliance, the learner roster, and course assignment — manager view." />

      <div className="metric-grid mb-6">
        <MetricCard label="Members" value={members.length} />
        <MetricCard label="Valid certs" value={validCerts} />
        <MetricCard label="Expiring · 30d" value={expiringSoon} />
        <MetricCard label="Overdue" value={overdue} />
        <MetricCard label="Active enrollments" value={activeEnrollments} />
      </div>

      <div className="mb-6">
        <AssignForm members={members.map((m) => ({ id: m.id, name: m.name }))} courses={courses} />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Roster</h2>
      {members.length === 0 ? (
        <EmptyState size="compact" title="No members" description="Org members appear here once invited." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--p-text-2)]">
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium num">Valid certs</th>
                <th className="px-3 py-2 font-medium num">Courses</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const certs = validByUser.get(m.id) ?? 0;
                const en = enrolledByUser.get(m.id) ?? { total: 0, completed: 0 };
                return (
                  <tr key={m.id} className="border-t border-[var(--p-border)]">
                    <td className="px-3 py-2 text-[var(--p-text-1)]">{m.name}</td>
                    <td className="px-3 py-2 text-[var(--p-text-2)]">{m.role ?? "—"}</td>
                    <td className="px-3 py-2 num">
                      {certs > 0 ? <Badge variant="success">{certs}</Badge> : <span className="text-[var(--p-text-3)]">0</span>}
                    </td>
                    <td className="px-3 py-2 num text-[var(--p-text-2)]">
                      {en.total === 0 ? "—" : `${en.completed} / ${en.total}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
