export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SELECT_COLUMNS, TrackerView, type TrackerRow } from "@/components/xpms/TrackerView";
import type { LooseSupabase } from "@/lib/supabase/loose";

export default async function TrackerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, xpms_phase")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  const loose = supabase as unknown as LooseSupabase;
  const { data: rows } = (await loose
    .from("v_xpms_atom_rollup_recursive")
    .select(SELECT_COLUMNS)
    .eq("project_id", projectId)
    .order("wbs_path", { ascending: true })) as { data: TrackerRow[] | null };

  const atoms = rows ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Tracker"
        subtitle={`${atoms.length} atom${atoms.length === 1 ? "" : "s"} · ${project.xpms_phase ?? "draft"} phase`}
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project.name, href: `/console/projects/${projectId}` },
          { label: "Tracker" },
        ]}
      />
      <div className="page-content">
        <TrackerView
          atoms={atoms}
          atomHrefBuilder={(id) => `/console/projects/${projectId}/tracker?atom=${id}`}
          emptyAction={
            <Link className="text-sm text-[var(--org-primary)]" href="/console/xpms">
              Open Catalog →
            </Link>
          }
        />
      </div>
    </>
  );
}
