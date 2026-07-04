import { Suspense } from "react";
import Link from "next/link";
import { urlFor } from "@/lib/urls";
import { ModuleHeader } from "@/components/Shell";
import { RouteTabs } from "@/components/ui/RouteTabs";
import { DataTable } from "@/components/DataTable";
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

// Dashboard hub tabs — folds the previous Dashboard sidebar group
// (Overview, Portfolio, Action Items, Command Palette) into one record-
// style hub. Command Palette page deleted — cmd-K is canonical.
export const dynamic = "force-dynamic";

export default async function ConsoleDashboard() {
  const { t } = await getRequestT();
  const DASHBOARD_TABS = [
    { label: t("console.dashboard.tabs.overview", undefined, "Overview"), href: "/studio" },
    { label: t("console.dashboard.tabs.portfolio", undefined, "Portfolio"), href: "/studio/dashboards" },
    { label: t("console.dashboard.tabs.actionItems", undefined, "Action Items"), href: "/studio/action-items" },
  ];

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          title={t("console.dashboard.title", undefined, "Workspace")}
          subtitle={t("console.dashboard.subtitle", undefined, "Operations dashboard")}
          tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
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
          tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
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
  const { data: activeProject } = await supabase
    .from("projects")
    .select("name, xpms_phase")
    .eq("org_id", session.orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.dashboard.eyebrow", undefined, "Home")}
        title={activeProject?.name ?? t("console.dashboard.title", undefined, "Workspace")}
        subtitle={
          activeProject
            ? t(
                "console.dashboard.activePhase",
                { phase: activeProject.xpms_phase },
                `Active Production · ${activeProject.xpms_phase}`,
              )
            : t(
                "console.dashboard.loggedInAsWithRole",
                { email: session.email, role: session.role },
                `Logged in as ${session.email} · ${session.role}`,
              )
        }
        action={
          <Button href="/studio/projects/new">{t("console.dashboard.newProject", undefined, "+ New Project")}</Button>
        }
        tabs={<RouteTabs tabs={DASHBOARD_TABS} />}
      />
      <div className="page-content space-y-6">
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
    </>
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
        <DataTable
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
              header: t("console.dashboard.columns.state", undefined, "State"),
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
