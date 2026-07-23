import { Suspense } from "react";
import Link from "next/link";
import { urlFor } from "@/lib/urls";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listProjects, projectStats } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";
import { SetupChecklist } from "@/components/ui/SetupChecklist";
import { getSetupProgress } from "@/lib/setup/progress";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EventSpine } from "./EventSpine";
import { WorldClocks } from "@/components/home/WorldClocks";
import { ShowDayToggle } from "@/components/home/ShowDayToggle";
import { CopilotSuggests, type CopilotSuggestion } from "@/components/home/CopilotSuggests";
import { Badge } from "@/components/ui/Badge";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";

// Dashboard hub tabs — folds the previous Dashboard sidebar group
// (Overview, Portfolio, Action Items, Command Palette) into one record-
// style hub. Command Palette page deleted — cmd-K is canonical.
export const dynamic = "force-dynamic";

export default async function ConsoleDashboard() {
  const { t } = await getRequestT();
  // Tabs: the kit 20 overview family (Overview · Dashboards · Insights ·
  // Reports · Goals · Sustainability) auto-renders via PlatformTabsAuto.

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          title={t("console.dashboard.title", undefined, "Workspace")}
          subtitle={t("console.dashboard.subtitle", undefined, "Operations dashboard")}
        />
        <div className="page-content">
          <div className="surface p-6">
            <div className="text-xs font-semibold tracking-wider text-[var(--p-warning)] uppercase">
              {t("console.dashboard.notConfigured", undefined, "Not configured")}
            </div>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t("console.dashboard.envMissingPrefix", undefined, "Supabase env vars are missing. Copy")}{" "}
              <code className="font-mono text-xs">.env.example</code> →{" "}
              <code className="font-mono text-xs">.env.local</code>{" "}
              {t(
                "console.dashboard.envMissingSuffix",
                undefined,
                "and fill in your project credentials, then restart the dev server.",
              )}
            </p>
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();

  // No-org users (community/viewer with no membership, or fresh accounts mid-invite)
  // would otherwise pass `""` into a UUID column and crash with 22P02. Render a
  // first-class empty state inviting them to create or join an org instead.
  if (!session.orgId) {
    return (
      <>
        <ModuleHeader
          title={t("console.dashboard.title", undefined, "Workspace")}
          subtitle={t("console.dashboard.loggedInAs", { email: session.email }, `Logged in as ${session.email}`)}
        />
        <div className="page-content">
          <EmptyState
            title={t("console.dashboard.noOrg.title", undefined, "No Organization Yet")}
            description={t(
              "console.dashboard.noOrg.description",
              undefined,
              "The operations workspace is org-scoped. Create your first organization, or accept an invitation from your team.",
            )}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Button href={urlFor("personal", "/me/organizations")}>
                  {t("console.dashboard.noOrg.createOrg", undefined, "Create Organization")}
                </Button>
                <Link href="/me" className="text-xs text-[var(--p-accent)]">
                  {t("console.dashboard.noOrg.backToDashboard", undefined, "← Back To Dashboard")}
                </Link>
              </div>
            }
          />
        </div>
      </>
    );
  }

  // Kit 20 acceptance fixture 01: the Home hero is the ACTIVE PRODUCTION
  // (name + phase chip), not a generic workspace label — the operator lands
  // on the world they are building. Falls back to "Workspace" when no
  // production is active. Same cheap indexed query the EventSpine island
  // runs; both are force-dynamic streaming reads.
  const supabase = await createClient();
  const [{ data: activeProject }, { data: prefRow }] = await Promise.all([
    supabase
      .from("projects")
      .select("name, slug, xpms_phase")
      .eq("org_id", session.orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("start_date", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_preferences").select("ui_state").eq("user_id", session.userId).maybeSingle(),
  ]);
  const showDay = Boolean((prefRow?.ui_state as { show_day_mode?: boolean } | null)?.show_day_mode);

  // Kit 20 fixture 01 — phase chip (Phase N · Name) + the production's mono
  // identifier, rendered as the hero subtitle chips.
  const XPMS_PHASES = ["Discovery", "Design", "Advance", "Procurement", "Build", "Install", "Operate", "Close"];
  const phaseNum = activeProject ? XPMS_PHASES.indexOf(activeProject.xpms_phase) + 1 : 0;

  // Copilot Suggests — derived next-best actions from real org state.
  const [blockedQ, approvalsQ, incidentsQ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("task_state", "blocked"),
    supabase
      .from("approval_instances")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .in("state", [...OPEN_INSTANCE_STATES]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("closed_at", null)
      .is("deleted_at", null),
  ]);
  const suggestions: CopilotSuggestion[] = [];
  if ((blockedQ.count ?? 0) > 0)
    suggestions.push({
      id: "tasks-blocked",
      title: t(
        "console.copilotSuggests.blocked.title",
        { count: blockedQ.count ?? 0 },
        `${blockedQ.count} Task${blockedQ.count === 1 ? "" : "s"} Blocked`,
      ),
      body: t(
        "console.copilotSuggests.blocked.body",
        undefined,
        "Blocked work cascades into the phases behind it. Unblock before it spreads.",
      ),
      ctaLabel: t("console.copilotSuggests.blocked.cta", undefined, "Open Tasks"),
      ctaHref: "/studio/tasks",
    });
  if ((approvalsQ.count ?? 0) > 0)
    suggestions.push({
      id: "approvals-waiting",
      title: t(
        "console.copilotSuggests.approvals.title",
        { count: approvalsQ.count ?? 0 },
        `${approvalsQ.count} Approval${approvalsQ.count === 1 ? "" : "s"} Wait On You`,
      ),
      body: t(
        "console.copilotSuggests.approvals.body",
        undefined,
        "Requests sit until someone decides. Clear the queue to keep money and gear moving.",
      ),
      ctaLabel: t("console.copilotSuggests.approvals.cta", undefined, "Open Queue"),
      ctaHref: "/studio/governance/approvals",
    });
  if ((incidentsQ.count ?? 0) > 0)
    suggestions.push({
      id: "incidents-open",
      title: t(
        "console.copilotSuggests.incidents.title",
        { count: incidentsQ.count ?? 0 },
        `${incidentsQ.count} Incident${incidentsQ.count === 1 ? "" : "s"} Open`,
      ),
      body: t(
        "console.copilotSuggests.incidents.body",
        undefined,
        "Open incidents need an owner and a close-out. Triage them before the next call.",
      ),
      ctaLabel: t("console.copilotSuggests.incidents.cta", undefined, "Open Incidents"),
      ctaHref: "/studio/operations/incidents",
    });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.dashboard.eyebrow", undefined, "Home")}
        title={activeProject?.name ?? t("console.dashboard.title", undefined, "Workspace")}
        subtitle={
          activeProject ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge variant="brand">
                {phaseNum > 0
                  ? t(
                      "console.dashboard.phaseChip",
                      { num: phaseNum, phase: activeProject.xpms_phase },
                      `Phase ${phaseNum} · ${activeProject.xpms_phase}`,
                    )
                  : activeProject.xpms_phase}
              </Badge>
              {activeProject.slug ? (
                <span className="font-mono text-xs tracking-wider text-[var(--p-text-3)] uppercase">
                  {activeProject.slug}
                </span>
              ) : null}
            </span>
          ) : (
            t(
              "console.dashboard.loggedInAsWithRole",
              { email: session.email, role: session.role },
              `Logged in as ${session.email} · ${session.role}`,
            )
          )
        }
        action={<ShowDayToggle on={showDay} />}
      />
      <div className="page-content space-y-6">
        {showDay ? (
          <Suspense fallback={<MetricGridSkeleton count={4} />}>
            <ShowDayStrip orgId={session.orgId} />
          </Suspense>
        ) : null}
        <Suspense fallback={null}>
          <SetupCard orgId={session.orgId} />
        </Suspense>
        {/* Event Spine — the Sell → Settle lifecycle checklist IS the training
            (v7.8 zero-training layer). Streams independently of the metrics. */}
        <Suspense fallback={<div className="ps-skel h-40" aria-busy="true" />}>
          <EventSpine orgId={session.orgId} />
        </Suspense>
        <Suspense fallback={<MetricGridSkeleton count={4} />}>
          <DashboardMetrics orgId={session.orgId} />
        </Suspense>

        <WorldClocks />

        <section>
          <h2 className="eyebrow pb-3">{t("console.dashboard.quickActions", undefined, "Quick Actions")}</h2>
          <QuickActions />
        </section>

        <section>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-semibold">
              {t("console.dashboard.recentProjects", undefined, "Recent Projects")}
            </h2>
            <Link href="/studio/projects" className="text-xs font-medium text-[var(--p-accent)] hover:underline">
              {t("console.dashboard.viewAll", undefined, "View all →")}
            </Link>
          </div>
          <Suspense fallback={<TableSkeleton rows={6} />}>
            <RecentProjects orgId={session.orgId} />
          </Suspense>
        </section>
      </div>
      <CopilotSuggests suggestions={suggestions} />
    </>
  );
}

/**
 * Show-Day strip — live-ops tiles, all real reads: open incidents, gate
 * scans in the last hour, crew currently clocked in, tasks due today.
 */
async function ShowDayStrip({ orgId }: { orgId: string }) {
  const [{ t }, supabase] = await Promise.all([getRequestT(), createClient()]);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);
  const [incidentsQ, scansQ, crewQ, dueQ] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("closed_at", null)
      .is("deleted_at", null),
    supabase
      .from("assignment_events")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("event_kind", "scan")
      .gte("at", hourAgo),
    supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("org_id", orgId).is("ended_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .in("task_state", ["todo", "in_progress", "blocked", "review"])
      .lte("due_at", dayEnd.toISOString()),
  ]);
  return (
    <div className="metric-grid">
      <MetricCard
        label={t("console.showDay.incidents", undefined, "Open Incidents")}
        value={String(incidentsQ.count ?? 0)}
        accent
      />
      <MetricCard
        label={t("console.showDay.scans", undefined, "Scans · Last Hour")}
        value={String(scansQ.count ?? 0)}
      />
      <MetricCard label={t("console.showDay.crew", undefined, "Crew Clocked In")} value={String(crewQ.count ?? 0)} />
      <MetricCard label={t("console.showDay.due", undefined, "Tasks Due Today")} value={String(dueQ.count ?? 0)} />
    </div>
  );
}

/** One Front Door echoes — the five Request intakes as home quick actions. */
async function QuickActions() {
  const { t } = await getRequestT();
  const actions = [
    { label: t("console.quickActions.gear", undefined, "Gear & Advance"), href: "/studio/advancing/request" },
    {
      label: t("console.quickActions.requisition", undefined, "Purchase Requisition"),
      href: "/studio/procurement/requisitions/new",
    },
    { label: t("console.quickActions.timeOff", undefined, "Time Off"), href: "/studio/workforce/time-off" },
    { label: t("console.quickActions.reportIt", undefined, "Report It"), href: "/studio/operations/incidents/new" },
    { label: t("console.quickActions.itTicket", undefined, "IT & Facilities"), href: "/studio/services/requests/new" },
    { label: t("console.quickActions.myWork", undefined, "My Work"), href: "/studio/my-work" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="surface hover-lift press-scale flex items-center justify-center px-3 py-4 text-center text-sm font-medium"
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}

/**
 * Streaming island — portfolio metric cards. Queries `projectStats`
 * independently of the recent-projects table so whichever resolves
 * first paints first; the header chrome above never waits on either.
 */
async function SetupCard({ orgId }: { orgId: string }) {
  const [{ t }, progress] = await Promise.all([getRequestT(), getSetupProgress(orgId)]);
  if (progress.complete) return null;
  const steps = progress.steps.map((s) => ({
    id: s.id,
    href: s.href,
    done: s.done,
    label: t(s.labelKey, undefined, s.fallbackLabel),
  }));
  // Pre-format the progress label server-side — SetupChecklist is a client
  // component; a formatter function would violate the RSC boundary.
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <SetupChecklist
      orgId={orgId}
      steps={steps}
      labels={{
        title: t("console.setup.title", undefined, "Finish setting up"),
        subtitle: t("console.setup.subtitle", undefined, "A few steps to get your workspace operating."),
        dismiss: t("console.setup.dismiss", undefined, "Dismiss"),
        progress: t(
          "console.setup.progress",
          { done: doneCount, total: steps.length },
          `${doneCount} of ${steps.length} done`,
        ),
      }}
    />
  );
}

async function DashboardMetrics({ orgId }: { orgId: string }) {
  const [{ t }, fmt, stats] = await Promise.all([getRequestT(), getRequestFormatters(), projectStats(orgId)]);
  return (
    <div className="metric-grid">
      <MetricCard
        label={t("console.dashboard.metrics.projects", undefined, "Projects")}
        value={fmt.number(stats.total)}
      />
      <MetricCard
        label={t("console.dashboard.metrics.active", undefined, "Active")}
        value={fmt.number(stats.byState.active)}
        accent
      />
      <MetricCard
        label={t("console.dashboard.metrics.draft", undefined, "Draft")}
        value={fmt.number(stats.byState.draft)}
      />
      <MetricCard
        label={t("console.dashboard.metrics.archived", undefined, "Archived")}
        value={fmt.number(stats.byState.archived + stats.byState.complete)}
      />
    </div>
  );
}

/** Streaming island — recent-projects table (or its empty state). */
async function RecentProjects({ orgId }: { orgId: string }) {
  const [{ t }, projects] = await Promise.all([getRequestT(), listProjects(orgId)]);
  return (
    <>
      {projects.length === 0 ? (
        <div className="surface">
          <EmptyState
            size="compact"
            title={t("console.dashboard.noProjects.title", undefined, "No Projects Yet")}
            description={t(
              "console.dashboard.noProjects.description",
              undefined,
              "Spin up your first project to see it here.",
            )}
            action={
              <Button href="/studio/projects/new" size="sm">
                {t("console.dashboard.newProject", undefined, "+ New Project")}
              </Button>
            }
          />
        </div>
      ) : (
        <DataView
          rows={projects.slice(0, 8)}
          rowHref={(p) => `/studio/projects/${p.id}`}
          tableId="t:/studio:recent-projects"
          searchable={false}
          emptyLabel={t("console.dashboard.noRecentProjects", undefined, "No Recent Projects")}
          columns={[
            {
              key: "name",
              header: t("console.dashboard.columns.name", undefined, "Name"),
              render: (p) => p.name,
              accessor: (p) => p.name,
              sortable: true,
            },
            {
              key: "project_state",
              header: t("console.dashboard.columns.state", undefined, "Status"),
              render: (p) => <StatusBadge status={p.project_state} />,
              accessor: (p) => p.project_state,
              filterable: true,
            },
            {
              key: "start_date",
              header: t("console.dashboard.columns.start", undefined, "Start"),
              render: (p) => p.start_date ?? "—",
              accessor: (p) => p.start_date ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "end_date",
              header: t("console.dashboard.columns.end", undefined, "End"),
              render: (p) => p.end_date ?? "—",
              accessor: (p) => p.end_date ?? "",
              mono: true,
              sortable: true,
            },
          ]}
        />
      )}
    </>
  );
}

function MetricGridSkeleton({ count }: { count: number }) {
  return (
    <div className="metric-grid" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ps-skel h-24" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="surface overflow-hidden" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0">
          <div className="ps-skel h-4 flex-1" />
          <div className="ps-skel h-4 w-24" />
          <div className="ps-skel h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
