export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { fmtDate } from "@/components/detail/DetailShell";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  burndownSeries,
  completedPoints,
  remainingPoints,
  totalPoints,
} from "@/lib/sprints";
import type { BurndownSnapshot, Sprint, SprintStory } from "@/lib/sprints";
import { getRequestT } from "@/lib/i18n/request";
import { BurndownChart } from "./BurndownChart";
import { KanbanBoard } from "./KanbanBoard";
import { AddStoryForm } from "./SprintForms";
import { snapshotBurndownAction } from "./actions";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();
  const session = await requireSession();
  const canWrite = isManagerPlus(session);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: project }, { data: sprintRows }, { data: storyRows }, { data: snapRows }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase
      .from("sprints")
      .select("id, org_id, project_id, name, starts_on, ends_on, sprint_state, goal, created_at")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("starts_on", { ascending: false }),
    supabase
      .from("sprint_stories")
      .select("id, org_id, sprint_id, title, points, story_state, notes, created_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("burndown_snapshots")
      .select("id, sprint_id, snapshot_on, remaining_points")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const sprints = (sprintRows ?? []) as Sprint[];
  const allStories = (storyRows ?? []) as SprintStory[];
  const allSnaps = (snapRows ?? []) as BurndownSnapshot[];
  const today = new Date().toISOString().slice(0, 10);

  // Velocity: mean completed points across sprints that have any completed work.
  const perSprintCompleted = sprints.map((s) =>
    completedPoints(allStories.filter((st) => st.sprint_id === s.id)),
  );
  const scored = perSprintCompleted.filter((v) => v > 0);
  const velocity = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.sprints.projectFallback", undefined, "Project")}
        title={t("console.projects.sprints.title", undefined, "Sprints")}
        subtitle={t("console.projects.sprints.subtitle", undefined, "Sprint Board, Burndown, And Velocity")}
        breadcrumbs={[
          { label: t("console.projects.sprints.breadcrumb.projects", undefined, "Projects"), href: "/studio/projects" },
          {
            label: project?.name ?? t("console.projects.sprints.projectFallback", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          { label: t("console.projects.sprints.title", undefined, "Sprints") },
        ]}
        action={
          canWrite ? (
            <Button href={`/studio/projects/${projectId}/sprints/new`} size="sm">
              {t("console.projects.sprints.newSprint", undefined, "New Sprint")}
            </Button>
          ) : undefined
        }
      />
      <div className="page-content max-w-5xl space-y-6">
        <div className="metric-grid">
          <MetricCard label={t("console.projects.sprints.metrics.sprints", undefined, "Sprints")} value={String(sprints.length)} />
          <MetricCard label={t("console.projects.sprints.metrics.stories", undefined, "Stories")} value={String(allStories.length)} />
          <MetricCard
            label={t("console.projects.sprints.metrics.velocity", undefined, "Velocity")}
            value={t("console.projects.sprints.metrics.velocityValue", { points: velocity }, `${velocity} pts`)}
          />
        </div>

        {sprints.length === 0 ? (
          <EmptyState
            title={t("console.projects.sprints.empty", undefined, "No Sprints Yet")}
            description={t(
              "console.projects.sprints.emptyDescription",
              undefined,
              "Create your first sprint to plan stories on a kanban board and track burndown.",
            )}
            action={
              canWrite ? (
                <Button href={`/studio/projects/${projectId}/sprints/new`} size="sm">
                  {t("console.projects.sprints.newSprint", undefined, "New Sprint")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          sprints.map((sprint) => {
            const stories = allStories.filter((st) => st.sprint_id === sprint.id);
            const snaps = allSnaps.filter((sn) => sn.sprint_id === sprint.id);
            const committed = totalPoints(stories);
            const remaining = remainingPoints(stories);
            const done = completedPoints(stories);
            const series = burndownSeries(snaps, remaining, today);
            return (
              <section key={sprint.id} className="surface space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[var(--p-text-1)]">{sprint.name}</h2>
                      <StatusBadge status={sprint.sprint_state} />
                    </div>
                    {sprint.goal && <p className="mt-1 text-sm text-[var(--p-text-2)]">{sprint.goal}</p>}
                    <p className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {fmtDate(sprint.starts_on)} – {fmtDate(sprint.ends_on)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--p-text-2)]">
                    <span>
                      <span className="font-mono text-sm text-[var(--p-text-1)]">{committed}</span>{" "}
                      {t("console.projects.sprints.points.committed", undefined, "committed")}
                    </span>
                    <span>
                      <span className="font-mono text-sm text-[var(--p-text-1)]">{done}</span>{" "}
                      {t("console.projects.sprints.points.done", undefined, "done")}
                    </span>
                    <span>
                      <span className="font-mono text-sm text-[var(--p-text-1)]">{remaining}</span>{" "}
                      {t("console.projects.sprints.points.remaining", undefined, "remaining")}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                  <KanbanBoard projectId={projectId} stories={stories} canWrite={canWrite} />
                  <div className="surface-inset rounded-md p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                        {t("console.projects.sprints.burndown", undefined, "Burndown")}
                      </span>
                      {canWrite && (
                        <form action={snapshotBurndownAction}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="sprintId" value={sprint.id} />
                          <button
                            type="submit"
                            className="ps-btn ps-btn--ghost ps-btn--sm"
                          >
                            {t("console.projects.sprints.snapshotToday", undefined, "Snapshot Today")}
                          </button>
                        </form>
                      )}
                    </div>
                    <BurndownChart
                      series={series}
                      committed={committed}
                      label={t("console.projects.sprints.burndownAria", undefined, "Sprint burndown chart")}
                    />
                  </div>
                </div>

                {canWrite && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
                      {t("console.projects.sprints.addStory", undefined, "Add story")}
                    </summary>
                    <div className="mt-3">
                      <AddStoryForm projectId={projectId} sprintId={sprint.id} />
                    </div>
                  </details>
                )}
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
