import { Suspense, cache } from "react";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireSession } from "@/lib/auth";
import { listProjects } from "@/lib/db/projects";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";
import { ProjectPortfolioGrid, type PortfolioEntry } from "./ProjectPortfolioGrid";
import { bulkArchiveProjects } from "./actions";

export const dynamic = "force-dynamic";

// Per-request memo so the streaming subtitle count and the body island
// share a single query each instead of issuing them twice. listProjects
// is capped (SC-8), so the header count comes from an exact COUNT —
// projects.length under-reported once an org passed the cap.
const getProjects = cache((orgId: string) => listProjects(orgId));
const getProjectsCount = cache((orgId: string) => countOrgScoped("projects", orgId));

export default async function ProjectsPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.projects.title", undefined, "Projects")} />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.projects.configureSupabase", undefined, "Configure Supabase to load projects.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();

  return (
    <>
      <ModuleHeader
        title={t("console.projects.title", undefined, "Projects")}
        subtitle={
          <Suspense fallback={<span className="ps-skel inline-block h-4 w-16 align-middle" aria-busy="true" />}>
            <ProjectsCount orgId={session.orgId} />
          </Suspense>
        }
        action={
          <Button href="/studio/projects/new">{t("console.projects.newProject", undefined, "+ New Project")}</Button>
        }
      />
      <div className="page-content space-y-5">
        <Suspense fallback={<ProjectsSkeleton />}>
          <ProjectsBody orgId={session.orgId} />
        </Suspense>
      </div>
    </>
  );
}

/** Streaming island — header subtitle project count. */
async function ProjectsCount({ orgId }: { orgId: string }) {
  const [{ t }, count] = await Promise.all([getRequestT(), getProjectsCount(orgId)]);
  return <>{t("console.projects.totalCount", { count }, `${count} Total`)}</>;
}

/** Streaming island — portfolio grid + projects table (or empty state). */
async function ProjectsBody({ orgId }: { orgId: string }) {
  const [{ t }, projects, count] = await Promise.all([getRequestT(), getProjects(orgId), getProjectsCount(orgId)]);
  return (
    <>
      {projects.length === 0 ? (
        <EmptyState
          title={t("console.projects.emptyTitle", undefined, "No Projects Yet")}
          description={t(
            "console.projects.emptyDescription",
            undefined,
            "A project is the top-level container for events, deliverables, invoices, and crew.",
          )}
          action={
            <Button href="/studio/projects/new">
              {t("console.projects.createFirst", undefined, "Create Your First Project")}
            </Button>
          }
        />
      ) : (
        <>
          <ProjectPortfolioGrid
            entries={projects.map<PortfolioEntry>((p) => ({
              id: p.id,
              name: p.name,
              status: p.project_state,
              startDate: p.start_date ?? null,
              endDate: p.end_date ?? null,
              budgetCents: p.budget_cents ?? 0,
            }))}
          />
          <DataView
            rows={projects}
            totalCount={count}
            rowHref={(p) => `/studio/projects/${p.id}`}
            emptyLabel={t("console.projects.emptyLabel", undefined, "No Projects")}
            bulkActions={[
              {
                id: "archive",
                label: t("console.projects.bulk.archive", undefined, "Archive"),
                variant: "danger",
                perform: bulkArchiveProjects,
              },
            ]}
            columns={[
              {
                key: "name",
                header: t("console.projects.columns.name", undefined, "Name"),
                render: (p) => p.name,
                accessor: (p) => p.name,
                sortable: true,
              },
              {
                key: "slug",
                header: t("console.projects.columns.slug", undefined, "Slug"),
                render: (p) => p.slug,
                accessor: (p) => p.slug,
                mono: true,
              },
              {
                key: "project_state",
                header: t("console.projects.columns.state", undefined, "Status"),
                render: (p) => (
                  <Badge variant={p.project_state === "active" ? "success" : "muted"}>{toTitle(p.project_state)}</Badge>
                ),
                accessor: (p) => p.project_state,
                filterable: true,
                groupable: true,
              },
              {
                key: "start_date",
                header: t("console.projects.columns.start", undefined, "Start"),
                render: (p) => p.start_date ?? "—",
                accessor: (p) => p.start_date ?? "",
                mono: true,
                sortable: true,
              },
              {
                key: "end_date",
                header: t("console.projects.columns.end", undefined, "End"),
                render: (p) => p.end_date ?? "—",
                accessor: (p) => p.end_date ?? "",
                mono: true,
                sortable: true,
              },
              {
                key: "updated_at",
                header: t("console.projects.columns.updated", undefined, "Updated"),
                render: (p) => formatDate(p.updated_at),
                accessor: (p) => p.updated_at,
                mono: true,
                sortable: true,
              },
            ]}
          />
        </>
      )}
    </>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={112} />
        ))}
      </div>
      <div className="surface overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--p-border)] px-4 py-2.5 last:border-0">
            <Skeleton className="flex-1" height={16} />
            <Skeleton width={96} height={16} />
            <Skeleton width={64} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}
