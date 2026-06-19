import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function TrainingPathDetailPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const { data: path } = await supabase
    .from("training_paths")
    .select("id, name, description, target_role, estimated_hours, is_required, created_at")
    .eq("id", pathId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!path) notFound();

  const typedPath = path as {
    id: string;
    name: string;
    description: string | null;
    target_role: string | null;
    estimated_hours: number | null;
    is_required: boolean;
    created_at: string;
  };

  const [{ data: steps }, { data: enrollments }, { data: streaks }] = await Promise.all([
    supabase
      .from("training_path_steps")
      .select("id, position, kind, title, estimated_minutes, is_required, resource_url")
      .eq("path_id", pathId)
      .order("position"),
    supabase
      .from("training_path_enrollments")
      .select("id, user_id, enrolled_at, completed_at, progress_pct")
      .eq("path_id", pathId)
      .eq("org_id", session.orgId)
      .order("progress_pct", { ascending: false }),
    supabase
      .from("learning_streaks")
      .select("user_id, current_streak, longest_streak, total_completions")
      .eq("org_id", session.orgId)
      .order("current_streak", { ascending: false })
      .limit(10),
  ]);

  const typedSteps = (steps ?? []) as Array<{
    id: string;
    position: number;
    kind: string;
    title: string;
    estimated_minutes: number | null;
    is_required: boolean;
    resource_url: string | null;
  }>;

  const typedEnrollments = (enrollments ?? []) as Array<{
    id: string;
    user_id: string;
    enrolled_at: string;
    completed_at: string | null;
    progress_pct: number;
  }>;

  const typedStreaks = (streaks ?? []) as Array<{
    user_id: string;
    current_streak: number;
    longest_streak: number;
    total_completions: number;
  }>;

  const userIds = Array.from(new Set([
    ...typedEnrollments.map((e) => e.user_id),
    ...typedStreaks.map((s) => s.user_id),
  ]));

  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: members } = await supabase
      .from("memberships")
      .select("user_id, users:users!inner(email)")
      .eq("org_id", session.orgId)
      .in("user_id", userIds);
    for (const m of (members ?? []) as Array<{ user_id: string; users: { email: string | null } | null }>) {
      if (m.users?.email) emailById.set(m.user_id, m.users.email);
    }
  }

  const KIND_LABEL: Record<string, string> = {
    course: "Course",
    resource: "Resource",
    quiz: "Quiz",
    external: "External",
  };

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Training Paths"
        title={typedPath.name}
        subtitle={typedPath.description ?? undefined}
        action={
          <Link href="/console/legend/paths" className="ps-btn ps-btn--ghost ps-btn--sm">
            ← All Paths
          </Link>
        }
      />
      <div className="page-content space-y-8">
        {/* Meta strip */}
        <div className="surface flex flex-wrap gap-4 p-4 text-sm">
          {typedPath.target_role && (
            <div className="flex gap-2">
              <span className="text-[var(--p-text-2)]">Role</span>
              <Badge variant="muted">{typedPath.target_role}</Badge>
            </div>
          )}
          {typedPath.estimated_hours != null && (
            <div className="flex gap-2">
              <span className="text-[var(--p-text-2)]">Estimated</span>
              <span>{typedPath.estimated_hours}h</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-[var(--p-text-2)]">Required</span>
            {typedPath.is_required ? <Badge variant="warning">Yes</Badge> : <Badge variant="muted">No</Badge>}
          </div>
          <div className="flex gap-2">
            <span className="text-[var(--p-text-2)]">Enrollments</span>
            <span>{typedEnrollments.length}</span>
          </div>
        </div>

        {/* Steps */}
        <section>
          <h2 className="ps-h mb-3 text-sm uppercase tracking-widest text-[var(--p-text-2)]">
            Steps ({typedSteps.length})
          </h2>
          {typedSteps.length === 0 ? (
            <div className="surface p-6 text-sm text-[var(--p-text-2)]">
              No steps added yet. Steps can be added via the API or directly in the database.
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("common.title", undefined, "Title")}</th>
                    <th>Kind</th>
                    <th>Est.</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {typedSteps.map((step, i) => (
                    <tr key={step.id}>
                      <td className="font-mono text-xs text-[var(--p-text-2)]">{i + 1}</td>
                      <td>
                        {step.resource_url ? (
                          <a href={step.resource_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            {step.title}
                          </a>
                        ) : (
                          step.title
                        )}
                      </td>
                      <td>
                        <Badge variant="muted">{KIND_LABEL[step.kind] ?? step.kind}</Badge>
                      </td>
                      <td className="font-mono text-xs">
                        {step.estimated_minutes != null ? `${step.estimated_minutes}m` : "—"}
                      </td>
                      <td>
                        {step.is_required ? (
                          <Badge variant="warning">Yes</Badge>
                        ) : (
                          <Badge variant="muted">Optional</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Enrolled learners */}
        {typedEnrollments.length > 0 && (
          <section>
            <h2 className="ps-h mb-3 text-sm uppercase tracking-widest text-[var(--p-text-2)]">
              Enrolled ({typedEnrollments.length})
            </h2>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Progress</th>
                    <th>Enrolled</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {typedEnrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{emailById.get(e.user_id) ?? e.user_id.slice(0, 8)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--p-surface-2)]">
                            <div
                              className="h-full rounded-full bg-[var(--p-accent)]"
                              style={{ width: `${e.progress_pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs">{e.progress_pct}%</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-[var(--p-text-2)]">
                        {new Date(e.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="font-mono text-xs">
                        {e.completed_at ? (
                          <Badge variant="success">{new Date(e.completed_at).toLocaleDateString()}</Badge>
                        ) : (
                          <span className="text-[var(--p-text-2)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Leaderboard */}
        {typedStreaks.length > 0 && (
          <section>
            <h2 className="ps-h mb-3 text-sm uppercase tracking-widest text-[var(--p-text-2)]">
              Leaderboard — Top Learners
            </h2>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Streak</th>
                    <th>Completions</th>
                  </tr>
                </thead>
                <tbody>
                  {typedStreaks.map((s, i) => (
                    <tr key={s.user_id}>
                      <td className="font-mono text-xs text-[var(--p-text-2)]">#{i + 1}</td>
                      <td className="font-mono text-xs">{emailById.get(s.user_id) ?? s.user_id.slice(0, 8)}</td>
                      <td>
                        <span className="font-mono text-sm font-semibold">{s.current_streak}</span>
                        <span className="ml-1 text-xs text-[var(--p-text-2)]">days</span>
                      </td>
                      <td className="font-mono text-xs">{s.total_completions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
