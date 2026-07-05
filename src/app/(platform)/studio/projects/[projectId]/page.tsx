import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { RecordShare } from "@/components/records/RecordShare";
import { Presence } from "@/components/collab/Presence";
import { getPresenceUser } from "@/components/collab/getPresenceUser";
import { ActivityDrawer } from "@/components/collab/activity";
import { requireSession, type Session } from "@/lib/auth";
import { getActivityForRecord } from "@/lib/db/activity";
import { getProject } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { ProjectStatusToggle } from "./ProjectStatusToggle";
import { deleteProject } from "./edit/actions";
import { ProjectReportsMenu } from "@/components/projects/ProjectReportsMenu";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();

  const { t } = await getRequestT();
  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.projects.detail.eyebrow", undefined, "Project")}
        title={project.name}
        subtitle={project.description ?? t("console.projects.detail.noDescription", undefined, "No description")}
        breadcrumbs={[
          { label: t("console.projects.detail.breadcrumbs.plan", undefined, "Plan"), href: "/studio/projects" },
          {
            label: t("console.projects.detail.breadcrumbs.projects", undefined, "Projects"),
            href: "/studio/projects",
          },
          { label: project.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <PresenceSlot session={session} projectId={project.id} />
            </Suspense>
            <ProjectStatusToggle projectId={project.id} projectState={project.project_state} />
            <RecordShare path={`/studio/projects/${projectId}`} title={project.name} />
            <ProjectReportsMenu projectId={project.id} />
            <Button href={`/studio/projects/${projectId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteProject.bind(null, projectId)}
              confirm={t(
                "console.projects.detail.archiveConfirm",
                { name: project.name },
                `Archive project "${project.name}"? It will be soft-deleted; no data is lost.`,
              )}
              label={t("console.projects.detail.archive", undefined, "Archive")}
              undo={{ table: "projects", id: projectId, redirectTo: "/studio/projects" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t("console.projects.detail.fields.state", undefined, "State")}>
            <Badge variant={project.project_state === "active" ? "success" : "muted"}>{project.project_state}</Badge>
          </Field>
          <Field label={t("console.projects.detail.fields.slug", undefined, "Slug")}>{project.slug}</Field>
          <Field label={t("console.projects.detail.fields.start", undefined, "Start")}>
            {project.start_date ?? "—"}
          </Field>
          <Field label={t("console.projects.detail.fields.end", undefined, "End")}>{project.end_date ?? "—"}</Field>
          <Field label={t("console.projects.detail.fields.budget", undefined, "Budget")}>
            {formatMoney(project.budget_cents) || "—"}
          </Field>
          <Field label={t("console.projects.detail.fields.created", undefined, "Created")}>
            {formatDate(project.created_at)}
          </Field>
          <Field label={t("console.projects.detail.fields.updated", undefined, "Updated")}>
            {formatDate(project.updated_at)}
          </Field>
        </div>

        <div className="surface p-6">
          <h2 className="text-base font-semibold">
            {t("console.projects.detail.descriptionHeading", undefined, "Description")}
          </h2>
          <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">
            {project.description ||
              t("console.projects.detail.noDescriptionYet", undefined, "No description provided yet.")}
          </p>
        </div>

        <div className="surface p-6">
          <h2 className="text-base font-semibold">
            {t("console.projects.detail.externalPortal.heading", undefined, "External Portal")}
          </h2>
          <p className="mt-2 text-sm text-[var(--p-text-2)]">
            {t(
              "console.projects.detail.externalPortal.description",
              undefined,
              "Stakeholders access this project via slug-scoped portal.",
            )}
          </p>
          <Link
            href={urlFor("portal", `/${project.slug}/overview`)}
            className="mt-3 inline-block font-mono text-xs text-[var(--p-accent)] hover:underline"
          >
            /p/{project.slug}/overview →
          </Link>
        </div>

        {/* Collab rail — Phase 2.1 (CommentThread) drops in alongside activity. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div aria-label={t("console.projects.detail.commentsAria", undefined, "Comments")}>
            {/* CommentThread (P2.1) lands here */}
          </div>
          <Suspense fallback={<div className="ps-skel h-40" aria-busy="true" />}>
            <ActivitySection orgId={session.orgId} projectId={project.id} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

/**
 * Streaming island — presence avatars in the header action row. The
 * `users` lookup behind `getPresenceUser` no longer blocks first paint
 * of the project header and detail fields.
 */
async function PresenceSlot({ session, projectId }: { session: Session; projectId: string }) {
  const presenceUser = await getPresenceUser(session);
  return <Presence targetTable="projects" targetId={projectId} currentUser={presenceUser} />;
}

/** Streaming island — audit-log activity feed (50-row query). */
async function ActivitySection({ orgId, projectId }: { orgId: string; projectId: string }) {
  const activity = await getActivityForRecord({
    orgId,
    targetTable: "projects",
    targetId: projectId,
    limit: 50,
  });
  return <ActivityDrawer targetTable="projects" targetId={projectId} initial={activity} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
