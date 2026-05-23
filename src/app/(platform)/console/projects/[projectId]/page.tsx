import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { Presence } from "@/components/collab/Presence";
import { getPresenceUser } from "@/components/collab/getPresenceUser";
import { ActivityDrawer } from "@/components/collab/activity";
import { requireSession } from "@/lib/auth";
import { getActivityForRecord } from "@/lib/db/activity";
import { getProject } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { ProjectStatusToggle } from "./ProjectStatusToggle";
import { deleteProject } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();
  const presenceUser = await getPresenceUser(session);
  const activity = await getActivityForRecord({
    orgId: session.orgId,
    targetTable: "projects",
    targetId: project.id,
    limit: 50,
  });

  return (
    <>
      <ModuleHeader
        eyebrow="Project"
        title={project.name}
        subtitle={project.description ?? "No description"}
        breadcrumbs={[
          { label: "Plan", href: "/console/projects" },
          { label: "Projects", href: "/console/projects" },
          { label: project.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Presence targetTable="projects" targetId={project.id} currentUser={presenceUser} />
            <ProjectStatusToggle projectId={project.id} projectState={project.project_state} />
            <Button href={`/console/projects/${projectId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteProject.bind(null, projectId)}
              confirm={`Archive project "${project.name}"? It will be soft-deleted; no data is lost.`}
              label="Archive"
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="State">
            <Badge variant={project.project_state === "active" ? "success" : "muted"}>{project.project_state}</Badge>
          </Field>
          <Field label="Slug">{project.slug}</Field>
          <Field label="Start">{project.start_date ?? "—"}</Field>
          <Field label="End">{project.end_date ?? "—"}</Field>
          <Field label="Budget">{formatMoney(project.budget_cents) || "—"}</Field>
          <Field label="Created">{formatDate(project.created_at)}</Field>
          <Field label="Updated">{formatDate(project.updated_at)}</Field>
        </div>

        <div className="surface p-6">
          <h2 className="text-base font-semibold">Description</h2>
          <p className="mt-3 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
            {project.description || "No description provided yet."}
          </p>
        </div>

        <div className="surface p-6">
          <h2 className="text-base font-semibold">External Portal</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Stakeholders access this project via slug-scoped portal.
          </p>
          <Link
            href={`/p/${project.slug}/overview`}
            className="mt-3 inline-block font-mono text-xs text-[var(--org-primary)] hover:underline"
          >
            /p/{project.slug}/overview →
          </Link>
        </div>

        {/* Collab rail — Phase 2.1 (CommentThread) drops in alongside activity. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div aria-label="Comments">{/* CommentThread (P2.1) lands here */}</div>
          <ActivityDrawer targetTable="projects" targetId={project.id} initial={activity} />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
