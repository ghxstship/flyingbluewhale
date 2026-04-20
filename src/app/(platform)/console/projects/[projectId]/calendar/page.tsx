export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: events }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).eq("id", projectId).maybeSingle(),
    supabase.from("events").select("id, name, description, status, starts_at, ends_at, location_id").eq("project_id", projectId).order("starts_at", { ascending: true }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Calendar"
        subtitle={`${events?.length ?? 0} event${(events?.length ?? 0) === 1 ? "" : "s"}`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Calendar" },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!events || events.length === 0 ? (
          <EmptyState title="No events yet" description="Schedule events from the Operations → Events module." />
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/console/events/${e.id}`} className="surface hover-lift block p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{e.name}</div>
                      {e.description && <div className="mt-1 text-xs text-[var(--text-muted)]">{e.description}</div>}
                    </div>
                    <StatusBadge status={e.status ?? "draft"} />
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-muted)] font-mono">{fmtDateTime(e.starts_at)} → {fmtDateTime(e.ends_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
