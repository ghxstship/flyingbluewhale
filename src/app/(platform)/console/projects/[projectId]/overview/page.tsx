export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { money, fmtDate } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { count: taskCount }, { count: eventCount }, { data: budgets }, { data: deliverables }] = await Promise.all([
    supabase.from("projects").select("id, name, slug, status, start_date, end_date, description").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("budgets").select("amount_cents, spent_cents").eq("project_id", projectId),
    supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null),
  ]);
  if (!project) notFound();
  const totalBudget = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const totalSpent = (budgets ?? []).reduce((s, b) => s + (b.spent_cents ?? 0), 0);
  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Overview"
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "Overview" },
        ]}
      />
      <div className="page-content max-w-5xl space-y-4">
        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--text-muted)] font-mono">{project.slug}</div>
              <h2 className="mt-1 text-lg font-semibold">{project.name}</h2>
              {project.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{project.description}</p>}
            </div>
            <StatusBadge status={project.status ?? "draft"} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Starts</dt><dd className="mt-1 text-sm">{fmtDate(project.start_date)}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Ends</dt><dd className="mt-1 text-sm">{fmtDate(project.end_date)}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Tasks</dt><dd className="mt-1 text-sm">{taskCount ?? 0}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Events</dt><dd className="mt-1 text-sm">{eventCount ?? 0}</dd></div>
          </dl>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/console/projects/${projectId}/budget`} className="surface hover-lift p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Budget</div>
            <div className="mt-2 text-2xl font-semibold">{money(totalBudget)}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Spent: {money(totalSpent)}</div>
          </Link>
          <Link href={`/console/projects/${projectId}/advancing`} className="surface hover-lift p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Deliverables</div>
            <div className="mt-2 text-2xl font-semibold">{(deliverables ? 0 : null) ?? (await supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("project_id", projectId).is("deleted_at", null)).count ?? 0}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
