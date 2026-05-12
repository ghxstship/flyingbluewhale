import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import TaskTemplateForm from "./TaskTemplateForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ projectId: string }> };

export default async function TaskTemplatesPage({ params }: Props) {
  const { projectId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Projects" title="Task Templates" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, start_date, xpms_phase")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!project) {
    return (
      <>
        <ModuleHeader eyebrow="Projects" title="Task Templates" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Project not found.</div>
        </div>
      </>
    );
  }

  const { data: existingTasks, count } = await supabase
    .from("tasks")
    .select("id", { count: "exact" })
    .eq("project_id", projectId)
    .eq("org_id", session.orgId);
  void existingTasks;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Smart Task Templates"
        subtitle="LASSO parity — bulk-create role-assigned tasks from industry-standard event type templates."
        action={
          <Link href={`/console/projects/${projectId}/tasks`} className="btn btn-sm btn-outline">
            ← Back to Tasks
          </Link>
        }
      />
      <div className="page-content space-y-5">
        <div className="surface p-5">
          <div className="mb-4">
            <p className="text-sm">
              Choose a template set to instantly generate role-assigned tasks with relative due dates calculated from
              the project event date. {count != null ? `This project already has ${count} task(s).` : ""}
            </p>
            {project.start_date && (
              <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                Event date: {project.start_date} — due dates will be calculated relative to this.
              </p>
            )}
          </div>

          <TaskTemplateForm projectId={projectId} />
        </div>

        <div className="surface p-5">
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Template Coverage
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: "concert", label: "Concert / Single Show", tasks: 11 },
              { key: "festival", label: "Festival / Multi-Stage", tasks: 12 },
              { key: "corporate", label: "Corporate Event", tasks: 6 },
              { key: "sport", label: "Sport / Athletics", tasks: 8 },
              { key: "broadcast", label: "Broadcast / Streaming", tasks: 7 },
              { key: "touring", label: "Touring Production", tasks: 7 },
            ].map((t) => (
              <div key={t.key} className="surface-inset rounded-lg p-3">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{t.tasks} tasks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
