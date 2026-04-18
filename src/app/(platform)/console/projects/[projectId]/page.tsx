import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { ProjectStatusToggle } from "./ProjectStatusToggle";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();

  const subTabs = [
    { label: "Overview", href: `/console/projects/${projectId}/overview` },
    { label: "Tasks", href: `/console/projects/${projectId}/tasks` },
    { label: "Gantt", href: `/console/projects/${projectId}/gantt` },
    { label: "Files", href: `/console/projects/${projectId}/files` },
    { label: "Calendar", href: `/console/projects/${projectId}/calendar` },
    { label: "Budget", href: `/console/projects/${projectId}/budget` },
    { label: "Crew", href: `/console/projects/${projectId}/crew` },
    { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
    { label: "Guides", href: `/console/projects/${projectId}/guides` },
  ];

  return (
    <>
      <ModuleHeader
        title={project.name}
        subtitle={project.description ?? "No description"}
        action={<ProjectStatusToggle projectId={project.id} status={project.status} />}
      />
      <div className="border-b border-[var(--color-border)] px-8">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1">
          {subTabs.map((t) => (
            <Link key={t.href} href={t.href} className="nav-item">{t.label}</Link>
          ))}
        </nav>
      </div>
      <div className="page-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Status">
            <Badge variant={project.status === "active" ? "success" : "muted"}>{project.status}</Badge>
          </Field>
          <Field label="Slug" mono>{project.slug}</Field>
          <Field label="Start" mono>{project.start_date ?? "—"}</Field>
          <Field label="End" mono>{project.end_date ?? "—"}</Field>
          <Field label="Budget" mono>{formatMoney(project.budget_cents) || "—"}</Field>
          <Field label="Created" mono>{formatDate(project.created_at)}</Field>
          <Field label="Updated" mono>{formatDate(project.updated_at)}</Field>
        </div>

        <div className="card mt-6 p-6">
          <h2 className="text-heading text-sm">Description</h2>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {project.description || "No description provided yet."}
          </p>
        </div>

        <div className="card-elevated mt-6 p-6">
          <h2 className="text-heading text-sm">External portal</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Stakeholders access this project via slug-scoped portal.
          </p>
          <Link href={`/p/${project.slug}/overview`} className="mt-3 inline-block text-mono text-xs text-[var(--brand-color)]">
            /p/{project.slug}/overview →
          </Link>
        </div>
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="card-elevated p-3">
      <div className="text-label text-[var(--color-text-tertiary)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "text-mono" : ""}`}>{children}</div>
    </div>
  );
}
